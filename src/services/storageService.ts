import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Movie, SupabaseConfig, AdConfig } from '../types';
import { INITIAL_MOVIES, DEFAULT_AD_CONFIG } from '../data/initialMovies';

const STORAGE_KEYS = {
  MOVIES: 'tontonan_gratis_movies_v1',
  SUPABASE_CONFIG: 'tontonan_gratis_supabase_config_v1',
  AD_CONFIG: 'tontonan_gratis_ad_config_v1',
};

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading Supabase config from storage', e);
  }
  return {
    url: '',
    anonKey: '',
    enabled: false,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
  supabaseInstance = null; // Reset client
}

export function getAdConfig(): AdConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AD_CONFIG);
    if (saved) {
      return { ...DEFAULT_AD_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading ad config', e);
  }
  return DEFAULT_AD_CONFIG;
}

export function saveAdConfig(config: AdConfig): void {
  localStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify(config));
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (config.enabled && config.url && config.anonKey) {
    if (!supabaseInstance) {
      try {
        supabaseInstance = createClient(config.url.trim(), config.anonKey.trim());
      } catch (e) {
        console.error('Failed to create Supabase client:', e);
        return null;
      }
    }
    return supabaseInstance;
  }
  return null;
}

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${base || 'film'}-${randomSuffix}`;
}

export async function fetchAllMovies(): Promise<Movie[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, falling back to local:', error.message);
      } else if (data && data.length > 0) {
        // Also cache locally
        localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(data));
        return data as Movie[];
      }
    } catch (err) {
      console.error('Supabase query failed:', err);
    }
  }

  // Local storage fallback
  try {
    const localData = localStorage.getItem(STORAGE_KEYS.MOVIES);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local movies:', e);
  }

  // Seed default if empty
  localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(INITIAL_MOVIES));
  return INITIAL_MOVIES;
}

export async function fetchMovieBySlug(slug: string): Promise<Movie | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return data as Movie;
      }
    } catch (e) {
      console.warn('Error fetching movie from Supabase by slug:', e);
    }
  }

  const movies = await fetchAllMovies();
  return movies.find((m) => m.slug === slug) || null;
}

export async function saveMovie(movieData: Omit<Movie, 'id' | 'created_at'> & { id?: string }): Promise<Movie> {
  const isEditing = !!movieData.id;
  const id = movieData.id || crypto.randomUUID();
  const created_at = new Date().toISOString();

  const completeMovie: Movie = {
    id,
    created_at,
    ...movieData,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('movies')
          .update(completeMovie)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('movies')
          .insert([completeMovie]);
        if (error) throw error;
      }
    } catch (e: any) {
      console.error('Supabase save error:', e);
      throw new Error(`Gagal menyimpan ke Supabase: ${e.message || e}`);
    }
  }

  // Update local storage
  const current = await fetchAllMovies();
  let updated: Movie[];
  if (isEditing) {
    updated = current.map((m) => (m.id === id ? { ...m, ...completeMovie } : m));
  } else {
    updated = [completeMovie, ...current];
  }
  localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(updated));

  return completeMovie;
}

export async function deleteMovieById(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('movies').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      console.error('Supabase delete error:', e);
      throw new Error(`Gagal menghapus dari Supabase: ${e.message || e}`);
    }
  }

  const current = await fetchAllMovies();
  const filtered = current.filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(filtered));
}

export async function incrementMovieViews(id: string): Promise<void> {
  const current = await fetchAllMovies();
  const target = current.find((m) => m.id === id);
  if (!target) return;

  const newViews = (target.views || 0) + 1;
  const updated = current.map((m) => (m.id === id ? { ...m, views: newViews } : m));
  localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('movies').update({ views: newViews }).eq('id', id);
    } catch (e) {
      // Non-critical
    }
  }
}

export function resetMoviesToDefault(): Movie[] {
  localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(INITIAL_MOVIES));
  return INITIAL_MOVIES;
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  if (!url || !key) {
    return { success: false, message: 'URL dan Anon Key tidak boleh kosong.' };
  }
  try {
    const testClient = createClient(url.trim(), key.trim());
    const { error } = await testClient.from('movies').select('id').limit(1);
    if (error) {
      return { success: false, message: `Error koneksi: ${error.message}` };
    }
    return { success: true, message: 'Koneksi ke Supabase berhasil terhubung!' };
  } catch (err: any) {
    return { success: false, message: `Gagal menghubungkan: ${err.message || 'Periksa format URL'}` };
  }
}
