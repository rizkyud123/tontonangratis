import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Movie, SupabaseConfig, AdConfig, ApiIntegrationConfig } from '../types';
import { DEFAULT_AD_CONFIG } from '../data/initialMovies';
import {
  getApiConfig as getLocalApiConfig,
  setApiConfigInMemory,
  sanitizeEmbedUrl,
  DEFAULT_API_CONFIG,
  fetchRealLiveMoviesFromApi,
} from './movieApiService';

export const AVAILABLE_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'War',
  'Western',
  'Indonesian',
  'Anime',
  'KDrama',
];

export const SUPABASE_SQL_SCHEMA = `-- =========================================================================
-- SKEMA LENGKAP DATABASE SUPABASE UNTUK TONTONAN GRATIS
-- Copy semua script ini dan klik RUN di menu SQL Editor pada Supabase Anda
-- =========================================================================

-- 1. Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Buat tabel movies (Film, Multi-Server, TMDB & Embed)
CREATE TABLE IF NOT EXISTS public.movies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  thumbnail TEXT NOT NULL,
  backdrop TEXT,
  embed_code TEXT NOT NULL,
  synopsis TEXT,
  genres TEXT[] DEFAULT ARRAY['Action'],
  rating NUMERIC(3,1) DEFAULT 7.5,
  year INTEGER DEFAULT 2024,
  duration TEXT DEFAULT '2j 00m',
  views INTEGER DEFAULT 0,
  quality TEXT DEFAULT 'HD',
  tmdb_id BIGINT,
  imdb_id TEXT,
  trailer_url TEXT,
  servers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Buat tabel app_settings untuk menyimpan semua API Key, Provider Video & Iklan
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 5. Policies untuk tabel movies
DROP POLICY IF EXISTS "Allow public read access" ON public.movies;
CREATE POLICY "Allow public read access" ON public.movies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON public.movies;
CREATE POLICY "Allow public insert" ON public.movies FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON public.movies;
CREATE POLICY "Allow public update" ON public.movies FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete" ON public.movies;
CREATE POLICY "Allow public delete" ON public.movies FOR DELETE USING (true);

-- 6. Policies untuk tabel app_settings (API TMDB, Provider & Monetisasi)
DROP POLICY IF EXISTS "Allow public read app_settings" ON public.app_settings;
CREATE POLICY "Allow public read app_settings" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert app_settings" ON public.app_settings;
CREATE POLICY "Allow public insert app_settings" ON public.app_settings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update app_settings" ON public.app_settings;
CREATE POLICY "Allow public update app_settings" ON public.app_settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete app_settings" ON public.app_settings;
CREATE POLICY "Allow public delete app_settings" ON public.app_settings FOR DELETE USING (true);

-- 7. Aktifkan Realtime Replication untuk sinkronisasi seketika
ALTER PUBLICATION supabase_realtime ADD TABLE public.movies;
`;

// Embedded Supabase Cloud Credentials for Multi-Device & Cross-Platform Instant Mirroring
export const EMBEDDED_SUPABASE_URL = 'https://zuzvukxufrsawplsekgh.supabase.co';
export const EMBEDDED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1enZ1a3h1ZnJzYXdwbHNla2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NDk5NzAsImV4cCI6MjEwMzAyNTk3MH0.Re-9OHwvylRX8gfC42MDbKDmGbyfG72HSeuLBNKYFBA';

// Persistent Storage Keys for multi-device and offline reliability
const STORAGE_KEYS = {
  SUPABASE_CONFIG: 'tontonan_gratis_supabase_config_v2',
  AD_CONFIG: 'tontonan_gratis_ad_config_v2',
  API_CONFIG: 'tontonan_gratis_api_config_v2',
  MOVIES_CACHE: 'tontonan_gratis_movies_v2',
};

// Safe helper for localStorage
function getLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private mode
  }
}

// Initial Supabase Config: Check localStorage, then env, and fallback to embedded mirror database
const initialSbSaved = getLocalItem<SupabaseConfig | null>(STORAGE_KEYS.SUPABASE_CONFIG, null);
const envSbUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const envSbKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const resolvedSbUrl = initialSbSaved?.url || envSbUrl || EMBEDDED_SUPABASE_URL;
const resolvedSbKey = initialSbSaved?.anonKey || envSbKey || EMBEDDED_SUPABASE_ANON_KEY;

let inMemorySupabaseConfig: SupabaseConfig = {
  url: resolvedSbUrl,
  anonKey: resolvedSbKey,
  enabled: initialSbSaved?.enabled !== false, // default enabled so all devices mirror instantly
};

let inMemoryAdConfig: AdConfig = getLocalItem<AdConfig>(STORAGE_KEYS.AD_CONFIG, { ...DEFAULT_AD_CONFIG });

// Track whether custom backend /api/* routes are available
let isApiServerAvailable: boolean | null = null;

async function tryServerFetch(url: string, options?: RequestInit): Promise<Response | null> {
  // If we already know the server API is not available on static hosts, skip immediately
  if (isApiServerAvailable === false) {
    return null;
  }

  try {
    const res = await fetch(url, options);
    // 404 (Not Found), 405 (Method Not Allowed)
    if (res.status === 404 || res.status === 405) {
      isApiServerAvailable = false;
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    // If static hosting rewrote /api/* to index.html (text/html instead of JSON)
    if (url.startsWith('/api/') && contentType.includes('text/html')) {
      isApiServerAvailable = false;
      return null;
    }

    if (!res.ok) {
      if (res.status >= 400 && res.status < 500) {
        isApiServerAvailable = false;
      }
      return null;
    }

    isApiServerAvailable = true;
    return res;
  } catch {
    isApiServerAvailable = false;
    return null;
  }
}

let supabaseInstance: SupabaseClient | null = null;

// Helper to broadcast changes across all open browser windows/tabs
function broadcastSync(type: 'MOVIES_UPDATED' | 'SETTINGS_UPDATED') {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('tontonan_gratis_sync');
      bc.postMessage({ type, timestamp: Date.now() });
      setTimeout(() => bc.close(), 300);
    }
  } catch {
    // ignore
  }
}

// Helper to get Supabase config
export function getSupabaseConfig(): SupabaseConfig {
  return inMemorySupabaseConfig;
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  inMemorySupabaseConfig = config;
  setLocalItem(STORAGE_KEYS.SUPABASE_CONFIG, config);
  supabaseInstance = null; // Reset client
  saveAllSettings({ supabaseConfig: config }).catch(() => {});
  broadcastSync('SETTINGS_UPDATED');
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (config.enabled && config.url && config.anonKey) {
    if (!supabaseInstance) {
      try {
        supabaseInstance = createClient(config.url.trim(), config.anonKey.trim(), {
          auth: {
            persistSession: false,
            autoRefreshToken: true,
          },
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        });
      } catch (e) {
        console.error('Failed to create Supabase client:', e);
        return null;
      }
    }
    return supabaseInstance;
  }
  return null;
}

// Subscribe to live Realtime database changes across all devices
export function subscribeToSupabaseRealtime(onUpdate: (movies: Movie[]) => void): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel('public:movies')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movies' },
        async () => {
          const freshMovies = await fetchAllMovies();
          onUpdate(freshMovies);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return null;
  }
}

// -------------------------------------------------------------
// GLOBAL SETTINGS SYNC (Direct Database API & Supabase)
// -------------------------------------------------------------

export async function fetchAllSettings(): Promise<{
  supabaseConfig: SupabaseConfig;
  apiConfig: ApiIntegrationConfig;
  adConfig: AdConfig;
}> {
  // 1. Direct Server Database API query
  const res = await tryServerFetch('/api/settings');
  if (res && res.ok) {
    try {
      const json = await res.json();
      if (json && json.data) {
        const { supabaseConfig, apiConfig, adConfig } = json.data;
        if (supabaseConfig && (supabaseConfig.url || supabaseConfig.anonKey)) {
          inMemorySupabaseConfig = { ...inMemorySupabaseConfig, ...supabaseConfig };
          setLocalItem(STORAGE_KEYS.SUPABASE_CONFIG, inMemorySupabaseConfig);
        }
        if (apiConfig) {
          setApiConfigInMemory(apiConfig);
          setLocalItem(STORAGE_KEYS.API_CONFIG, apiConfig);
        }
        if (adConfig) {
          inMemoryAdConfig = { ...DEFAULT_AD_CONFIG, ...adConfig };
          setLocalItem(STORAGE_KEYS.AD_CONFIG, inMemoryAdConfig);
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Direct Supabase Cloud check if client is active
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (!error && data && Array.isArray(data)) {
        let apiCfg: ApiIntegrationConfig = getLocalApiConfig();
        let adCfg: AdConfig = inMemoryAdConfig;

        for (const row of data) {
          if (row.key === 'api_config' && row.value) {
            apiCfg = { ...DEFAULT_API_CONFIG, ...row.value };
            setApiConfigInMemory(apiCfg);
            setLocalItem(STORAGE_KEYS.API_CONFIG, apiCfg);
          }
          if (row.key === 'ad_config' && row.value) {
            adCfg = { ...DEFAULT_AD_CONFIG, ...row.value };
            inMemoryAdConfig = adCfg;
            setLocalItem(STORAGE_KEYS.AD_CONFIG, adCfg);
          }
        }

        return {
          supabaseConfig: getSupabaseConfig(),
          apiConfig: apiCfg,
          adConfig: adCfg,
        };
      }
    } catch (e) {
      console.warn('Supabase settings fetch notice:', e);
    }
  }

  return {
    supabaseConfig: getSupabaseConfig(),
    apiConfig: getLocalApiConfig(),
    adConfig: inMemoryAdConfig,
  };
}

export async function saveAllSettings(payload: {
  supabaseConfig?: SupabaseConfig;
  apiConfig?: ApiIntegrationConfig;
  adConfig?: AdConfig;
}): Promise<void> {
  // 1. Update in-memory & local storage state
  if (payload.supabaseConfig) {
    inMemorySupabaseConfig = payload.supabaseConfig;
    setLocalItem(STORAGE_KEYS.SUPABASE_CONFIG, payload.supabaseConfig);
    supabaseInstance = null;
  }
  if (payload.apiConfig) {
    setApiConfigInMemory(payload.apiConfig);
    setLocalItem(STORAGE_KEYS.API_CONFIG, payload.apiConfig);
  }
  if (payload.adConfig) {
    inMemoryAdConfig = { ...DEFAULT_AD_CONFIG, ...payload.adConfig };
    setLocalItem(STORAGE_KEYS.AD_CONFIG, inMemoryAdConfig);
  }

  // 2. Direct Supabase Cloud Save
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      if (payload.apiConfig) {
        await supabase.from('app_settings').upsert({
          key: 'api_config',
          value: payload.apiConfig,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
      }
      if (payload.adConfig) {
        await supabase.from('app_settings').upsert({
          key: 'ad_config',
          value: payload.adConfig,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
      }
    } catch (e) {
      console.warn('Supabase app_settings sync warning:', e);
    }
  }

  // 3. Direct Server Database API Post
  await tryServerFetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  broadcastSync('SETTINGS_UPDATED');
}

export function getApiConfig(): ApiIntegrationConfig {
  return getLocalApiConfig();
}

export async function fetchApiConfig(): Promise<ApiIntegrationConfig> {
  const settings = await fetchAllSettings();
  return settings.apiConfig;
}

export async function saveApiConfig(config: ApiIntegrationConfig): Promise<void> {
  await saveAllSettings({ apiConfig: config });
}

export function getAdConfig(): AdConfig {
  return inMemoryAdConfig;
}

export async function fetchAdConfig(): Promise<AdConfig> {
  const settings = await fetchAllSettings();
  return settings.adConfig;
}

export async function saveAdConfig(config: AdConfig): Promise<void> {
  await saveAllSettings({ adConfig: config });
}

// -------------------------------------------------------------
// MOVIES PERSISTENCE & DIRECT DATABASE API
// -------------------------------------------------------------

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function ensureValidUUID(id?: string): string {
  if (id && UUID_REGEX.test(id)) {
    return id;
  }
  return generateUUID();
}

// Helper to sanitize movies and fix old dead domain references
export function sanitizeMovieObject(movie: Movie): Movie {
  const sanitized = { ...movie };
  sanitized.id = ensureValidUUID(sanitized.id);
  if (sanitized.embed_code) {
    sanitized.embed_code = sanitizeEmbedUrl(sanitized.embed_code);
  }
  if (Array.isArray(sanitized.servers)) {
    sanitized.servers = sanitized.servers.map((srv) => ({
      ...srv,
      url: sanitizeEmbedUrl(srv.url),
    }));
  }
  return sanitized;
}

// Prepare payload conforming to Supabase movies table schema
function toSupabaseMoviePayload(movie: Movie): any {
  return {
    id: ensureValidUUID(movie.id),
    title: movie.title || 'Film Tanpa Judul',
    slug: movie.slug,
    thumbnail: movie.thumbnail || '',
    backdrop: movie.backdrop || null,
    embed_code: sanitizeEmbedUrl(movie.embed_code || ''),
    synopsis: movie.synopsis || null,
    genres: Array.isArray(movie.genres) ? movie.genres : ['Action'],
    rating: typeof movie.rating === 'number' ? movie.rating : parseFloat(String(movie.rating)) || 7.5,
    year: typeof movie.year === 'number' ? movie.year : parseInt(String(movie.year), 10) || 2024,
    duration: movie.duration || '2j 00m',
    views: typeof movie.views === 'number' ? movie.views : 0,
    quality: movie.quality || 'HD',
    tmdb_id: movie.tmdb_id ? Number(movie.tmdb_id) : null,
    imdb_id: movie.imdb_id ? String(movie.imdb_id) : null,
    trailer_url: movie.trailer_url || null,
    servers: Array.isArray(movie.servers) ? movie.servers : null,
    created_at: movie.created_at || new Date().toISOString(),
  };
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

function isMockMovie(m: Movie): boolean {
  if (!m) return true;
  if (typeof m.id === 'string' && m.id.startsWith('a000000')) return true;
  if (typeof m.thumbnail === 'string' && m.thumbnail.includes('images.unsplash.com')) return true;
  return false;
}

export async function fetchAllMovies(): Promise<Movie[]> {
  // 1. PRIMARY: Direct Supabase Cloud PostgreSQL Database Query
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.warn('Supabase fetch notice:', error.message);
      } else if (data && Array.isArray(data) && data.length > 0) {
        const realMovies = (data as Movie[]).filter((m) => !isMockMovie(m));
        if (realMovies.length > 0) {
          const sanitized = realMovies.map(sanitizeMovieObject);
          setLocalItem(STORAGE_KEYS.MOVIES_CACHE, sanitized);
          return sanitized;
        }
      }
    } catch (err) {
      console.warn('Supabase query failed:', err);
    }
  }

  // 2. SECONDARY: Server Database API (/api/movies)
  const res = await tryServerFetch('/api/movies');
  if (res && res.ok) {
    try {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        const realMovies = (json.data as Movie[]).filter((m) => !isMockMovie(m));
        if (realMovies.length > 0) {
          const sanitized = realMovies.map(sanitizeMovieObject);
          setLocalItem(STORAGE_KEYS.MOVIES_CACHE, sanitized);
          return sanitized;
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. TERTIARY: Persistent Local Storage Cache (Guarantees multi-window & offline stability)
  const cachedMovies = getLocalItem<Movie[]>(STORAGE_KEYS.MOVIES_CACHE, []);
  if (Array.isArray(cachedMovies) && cachedMovies.length > 0) {
    return cachedMovies.map(sanitizeMovieObject);
  }

  // 4. QUATERNARY: Direct Live TMDB API fetch ONLY if zero movies anywhere
  try {
    const liveMovies = await fetchRealLiveMoviesFromApi(24);
    if (liveMovies.length > 0) {
      const sanitized = liveMovies.map(sanitizeMovieObject);
      setLocalItem(STORAGE_KEYS.MOVIES_CACHE, sanitized);

      // If Supabase is connected, seed it
      if (supabase) {
        try {
          const payloads = sanitized.map(toSupabaseMoviePayload);
          await supabase.from('movies').upsert(payloads, { onConflict: 'slug' });
        } catch {
          // ignore
        }
      }
      return sanitized;
    }
  } catch (err) {
    console.warn('Failed to fetch fallback real movies:', err);
  }

  return [];
}

export async function fetchMovieBySlug(slug: string): Promise<Movie | null> {
  // 1. Direct Supabase Database API Query
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return sanitizeMovieObject(data as Movie);
      }
    } catch (e) {
      console.warn('Error fetching movie from Supabase by slug:', e);
    }
  }

  // 2. Direct Server Database API Query
  const res = await tryServerFetch(`/api/movies/${encodeURIComponent(slug)}`);
  if (res && res.ok) {
    try {
      const json = await res.json();
      if (json && json.success && json.data) {
        return sanitizeMovieObject(json.data as Movie);
      }
    } catch {
      // fallback
    }
  }

  // 3. Fallback to all movies from database / local cache
  const movies = await fetchAllMovies();
  return movies.find((m) => m.slug === slug) || null;
}

export async function saveMovie(movieData: Omit<Movie, 'id' | 'created_at'> & { id?: string }): Promise<Movie> {
  const id = ensureValidUUID(movieData.id);
  const created_at = new Date().toISOString();

  let completeMovie: Movie = {
    id,
    created_at,
    ...movieData,
  };

  completeMovie = sanitizeMovieObject(completeMovie);

  // 1. Direct Supabase Cloud Database Upsert
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload = toSupabaseMoviePayload(completeMovie);
      const { error } = await supabase
        .from('movies')
        .upsert(payload, { onConflict: 'slug' });
      if (error) {
        console.warn('Supabase movie save warning:', error.message);
      }
    } catch (e: any) {
      console.warn('Supabase save error:', e);
    }
  }

  // 2. Direct Server Database API Save
  await tryServerFetch('/api/movies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(completeMovie),
  });

  // 3. Update Local Cache
  const currentCache = getLocalItem<Movie[]>(STORAGE_KEYS.MOVIES_CACHE, []);
  const existingIdx = currentCache.findIndex((m) => m.id === completeMovie.id || m.slug === completeMovie.slug);
  let updatedCache: Movie[];
  if (existingIdx >= 0) {
    updatedCache = [...currentCache];
    updatedCache[existingIdx] = completeMovie;
  } else {
    updatedCache = [completeMovie, ...currentCache];
  }
  setLocalItem(STORAGE_KEYS.MOVIES_CACHE, updatedCache);
  broadcastSync('MOVIES_UPDATED');

  return completeMovie;
}

export async function bulkSaveMovies(newMovies: Movie[]): Promise<Movie[]> {
  if (!newMovies || newMovies.length === 0) return [];

  const sanitizedList = newMovies.map(sanitizeMovieObject);

  // 1. Direct Supabase Cloud Database Bulk Upsert
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payloads = sanitizedList.map(toSupabaseMoviePayload);
      await supabase.from('movies').upsert(payloads, { onConflict: 'slug' });
    } catch (e: any) {
      console.warn('Supabase bulk save exception:', e);
    }
  }

  // 2. Direct Server Database API Bulk Save
  await tryServerFetch('/api/movies/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movies: sanitizedList }),
  });

  // 3. Update Local Cache
  const currentCache = getLocalItem<Movie[]>(STORAGE_KEYS.MOVIES_CACHE, []);
  const existingSlugs = new Set(currentCache.map((m) => m.slug));
  const newAdditions = sanitizedList.filter((m) => !existingSlugs.has(m.slug));
  const updatedCache = [...newAdditions, ...currentCache];
  setLocalItem(STORAGE_KEYS.MOVIES_CACHE, updatedCache);
  broadcastSync('MOVIES_UPDATED');

  return updatedCache;
}

export async function deleteMovieById(id: string): Promise<void> {
  // 1. Direct Delete from Supabase Database
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('movies').delete().eq('id', id);
    } catch (e: any) {
      console.warn('Supabase delete error:', e);
    }
  }

  // 2. Direct Delete from Server Database API
  await tryServerFetch(`/api/movies/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  // 3. Update Local Cache
  const currentCache = getLocalItem<Movie[]>(STORAGE_KEYS.MOVIES_CACHE, []);
  const updatedCache = currentCache.filter((m) => m.id !== id);
  setLocalItem(STORAGE_KEYS.MOVIES_CACHE, updatedCache);
  broadcastSync('MOVIES_UPDATED');
}

export async function incrementMovieViews(id: string): Promise<void> {
  // 1. Direct Increment on Supabase Database
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.from('movies').select('views').eq('id', id).maybeSingle();
      if (data) {
        const nextViews = (data.views || 0) + 1;
        await supabase.from('movies').update({ views: nextViews }).eq('id', id);
      }
    } catch {
      // ignore
    }
  }

  // 2. Direct Increment on Server Database API
  tryServerFetch(`/api/movies/${encodeURIComponent(id)}/views`, { method: 'POST' }).catch(() => {});
}

export async function resetMoviesToDefault(): Promise<Movie[]> {
  let freshMovies: Movie[] = [];
  try {
    freshMovies = await fetchRealLiveMoviesFromApi(24);
  } catch (err) {
    console.warn('Error fetching fresh live movies on reset:', err);
  }

  const sanitized = freshMovies.map(sanitizeMovieObject);

  // 1. Purge & Seed Supabase Database
  const supabase = getSupabaseClient();
  if (supabase && sanitized.length > 0) {
    try {
      await supabase.from('movies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const payloads = sanitized.map(toSupabaseMoviePayload);
      await supabase.from('movies').upsert(payloads, { onConflict: 'slug' });
    } catch {
      // ignore
    }
  }

  // 2. Purge & Seed Server Database API
  await tryServerFetch('/api/movies/reset', { method: 'POST' });

  return sanitized;
}

// Trigger cross-device synchronization with Supabase cloud database
export async function triggerSupabaseSync(): Promise<{
  success: boolean;
  message: string;
  totalMovies?: number;
  data?: Movie[];
}> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const sanitized = data.map(sanitizeMovieObject);
        return {
          success: true,
          message: `Berhasil tersinkron dengan Database Supabase! ${sanitized.length} film termuat langsung dari database.`,
          totalMovies: sanitized.length,
          data: sanitized,
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: `Gagal sinkronisasi Database: ${e.message || e}`,
      };
    }
  }

  // Try server sync if available
  const res = await tryServerFetch('/api/sync/supabase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (res && res.ok) {
    try {
      const json = await res.json();
      return json;
    } catch {
      // ignore
    }
  }

  const movies = await fetchAllMovies();
  return {
    success: true,
    message: `Data film berhasil diambil dari Database API (${movies.length} film).`,
    totalMovies: movies.length,
    data: movies,
  };
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  if (!url || !key) {
    return { success: false, message: 'URL dan Anon Key tidak boleh kosong.' };
  }
  try {
    const testClient = createClient(url.trim(), key.trim());
    const { error } = await testClient.from('movies').select('id').limit(1);
    if (error) {
      return { success: false, message: `Error koneksi database: ${error.message}` };
    }
    return { success: true, message: 'Koneksi ke Database Supabase berhasil terhubung! Tabel movies & app_settings siap digunakan.' };
  } catch (err: any) {
    return { success: false, message: `Gagal menghubungkan database: ${err.message || 'Periksa format URL'}` };
  }
}
