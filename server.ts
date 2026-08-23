import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types (simplified for server-side)
interface MovieServer {
  id: string;
  name: string;
  url: string;
  quality?: string;
  isDefault?: boolean;
}

interface Movie {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  backdrop?: string;
  embed_code: string;
  synopsis?: string;
  genres?: string[];
  rating?: number;
  year?: number;
  duration?: string;
  views?: number;
  quality?: string;
  tmdb_id?: number;
  imdb_id?: string;
  trailer_url?: string;
  servers?: MovieServer[];
  created_at: string;
}

interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

interface AdConfig {
  bannerTopEnabled: boolean;
  bannerTopCode: string;
  bannerBottomEnabled: boolean;
  bannerBottomCode: string;
  adsterraDirectLink: string;
  popunderUrl: string;
}

interface CustomMovieProvider {
  id: string;
  name: string;
  badge?: string;
  description?: string;
  template: string;
  apiKey?: string;
  enabled: boolean;
}

interface MovieApiKeyItem {
  id: string;
  providerName: string;
  keyName: string;
  keyValue: string;
  endpointUrl?: string;
  enabled: boolean;
}

interface ApiIntegrationConfig {
  tmdbApiKey: string;
  tmdbLanguage: string;
  tmdbApiReadToken?: string;
  omdbApiKey?: string;
  youtubeApiKey?: string;
  defaultProvider: string;
  customEmbedTemplate: string;
  autoMultiServers: boolean;
  enabledProviders: string[];
  customProviders?: CustomMovieProvider[];
  movieApiKeys?: MovieApiKeyItem[];
}

interface ServerDatabase {
  movies: Movie[];
  supabaseConfig: SupabaseConfig;
  adConfig: AdConfig;
  apiConfig: ApiIntegrationConfig;
  lastUpdated: string;
}

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DEFAULT_TMDB_API_KEY = '4e44d9029b1270a757cddc766a1bcb63';

// Generate multi-server streaming embed links for a TMDB movie
function generateServersForTmdb(tmdbId: number | string, imdbId?: string): MovieServer[] {
  const idStr = String(tmdbId);
  const imdbStr = imdbId || '';
  return [
    { id: `srv-vidsrc-${idStr}`, name: 'VidSrc HD', url: `https://vidsrc.xyz/embed/movie/${idStr}`, quality: '1080p', isDefault: true },
    { id: `srv-vidsrcto-${idStr}`, name: 'VidSrc TO', url: `https://vidsrc.to/embed/movie/${idStr}`, quality: 'Fast HD' },
    { id: `srv-superembed-${idStr}`, name: 'SuperEmbed VIP', url: `https://multiembed.mov/?video_id=${idStr}&tmdb=1`, quality: 'MultiHost' },
    { id: `srv-embedsu-${idStr}`, name: 'Embed.su 4K', url: `https://embed.su/embed/movie/${idStr}`, quality: '4K / UHD' },
    { id: `srv-autoembed-${idStr}`, name: 'AutoEmbed', url: `https://player.autoembed.cc/embed/movie/${idStr}`, quality: 'Stable' },
    { id: `srv-vidlink-${idStr}`, name: 'VidLink Pro', url: `https://vidlink.pro/movie/${idStr}`, quality: 'Fast CDN' },
    { id: `srv-moviesapi-${idStr}`, name: 'MoviesAPI', url: `https://moviesapi.club/movie/${idStr}`, quality: 'HD' },
  ];
}

const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

async function fetchRealTmdbMoviesForServer(apiKey?: string, lang = 'id-ID'): Promise<Movie[]> {
  const key = (apiKey && apiKey.trim()) || DEFAULT_TMDB_API_KEY;
  const rawList: any[] = [];
  const seenIds = new Set<number>();

  try {
    const [trendRes, popRes, indoRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${key}&language=${lang}&page=1`).catch(() => null),
      fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${key}&language=${lang}&page=1`).catch(() => null),
      fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${key}&with_original_language=id&sort_by=popularity.desc&language=${lang}&page=1`).catch(() => null),
    ]);

    for (const res of [trendRes, popRes, indoRes]) {
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          for (const item of data.results) {
            if (item && item.id && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              rawList.push(item);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Server error fetching TMDB real movies:', err);
  }

  const movies: Movie[] = [];
  for (const item of rawList.slice(0, 30)) {
    const tmdbId = item.id;
    const title = item.title || item.original_title || 'Film Tanpa Judul';
    const year = item.release_date ? new Date(item.release_date).getFullYear() : 2024;
    const cleanSlug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${year}`;
    const vote = Number(item.vote_average) || 7.5;
    const quality = vote >= 7.8 ? '4K' : vote >= 6.5 ? 'FHD' : 'HD';

    const genres = Array.isArray(item.genre_ids) && item.genre_ids.length > 0
      ? item.genre_ids.map((gid: number) => TMDB_GENRE_MAP[gid] || 'Action').filter(Boolean)
      : ['Action', 'Drama'];

    const servers = generateServersForTmdb(tmdbId);
    const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800';
    const backdrop = item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined;

    movies.push({
      id: `tmdb-${tmdbId}-${Date.now().toString(36)}`,
      title,
      slug: cleanSlug,
      thumbnail: poster,
      backdrop,
      embed_code: `<iframe src="${servers[0].url}" title="${title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen="true" scrolling="no" class="w-full h-full"></iframe>`,
      synopsis: item.overview || 'Sinopsis belum tersedia untuk film ini.',
      genres,
      rating: parseFloat(vote.toFixed(1)),
      year,
      duration: '2j 00m',
      views: Math.floor(Math.random() * 400) + 150,
      quality,
      tmdb_id: tmdbId,
      servers,
      created_at: new Date().toISOString(),
    });
  }

  return movies;
}

const EMBEDDED_SUPABASE_URL = 'https://zuzvukxufrsawplsekgh.supabase.co';
const EMBEDDED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1enZ1a3h1ZnJzYXdwbHNla2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NDk5NzAsImV4cCI6MjEwMzAyNTk3MH0.Re-9OHwvylRX8gfC42MDbKDmGbyfG72HSeuLBNKYFBA';

const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || EMBEDDED_SUPABASE_URL,
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || EMBEDDED_SUPABASE_ANON_KEY,
  enabled: true,
};

const DEFAULT_AD_CONFIG: AdConfig = {
  bannerTopEnabled: true,
  bannerTopCode: '<div class="w-full py-4 text-center bg-gradient-to-r from-amber-950/40 via-red-950/30 to-amber-950/40 border border-amber-500/20 rounded-xl"><span class="text-xs text-amber-400 font-semibold tracking-wide flex items-center justify-center gap-2">📢 Slot Iklan Banner 728x90 Adsterra Aktif</span></div>',
  bannerBottomEnabled: true,
  bannerBottomCode: '<div class="w-full py-4 text-center bg-gradient-to-r from-red-950/30 via-zinc-900 to-red-950/30 border border-red-500/20 rounded-xl"><span class="text-xs text-red-400 font-semibold tracking-wide flex items-center justify-center gap-2">🔥 Rekomendasi Sponsor Premium</span></div>',
  adsterraDirectLink: 'https://www.highcpmgate.com',
  popunderUrl: '',
};

const DEFAULT_API_CONFIG: ApiIntegrationConfig = {
  tmdbApiKey: '',
  tmdbLanguage: 'id-ID',
  omdbApiKey: '',
  defaultProvider: 'vidsrc_xyz',
  customEmbedTemplate: 'https://vidsrc.xyz/embed/movie/{tmdb_id}',
  autoMultiServers: true,
  enabledProviders: [
    'vidsrc_xyz',
    'vidsrc_to',
    'superembed',
    'embed_su',
    'autoembed',
    'vidlink',
    'moviesapi',
    'smashystream',
    '2embed',
  ],
};

function isMockMovie(m: any): boolean {
  if (!m) return true;
  if (typeof m.id === 'string' && m.id.startsWith('a000000')) return true;
  if (typeof m.thumbnail === 'string' && m.thumbnail.includes('images.unsplash.com')) return true;
  return false;
}

// Database persistence helpers
function ensureDatabase(): ServerDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.movies)) {
        // Clean out any old mock data
        const nonMock = parsed.movies.filter((m: any) => !isMockMovie(m));
        return {
          movies: nonMock,
          supabaseConfig: { ...DEFAULT_SUPABASE_CONFIG, ...(parsed.supabaseConfig || {}) },
          adConfig: { ...DEFAULT_AD_CONFIG, ...(parsed.adConfig || {}) },
          apiConfig: { ...DEFAULT_API_CONFIG, ...(parsed.apiConfig || {}) },
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.error('Error reading DB_FILE, initializing default:', err);
  }

  const initialDb: ServerDatabase = {
    movies: [],
    supabaseConfig: DEFAULT_SUPABASE_CONFIG,
    adConfig: DEFAULT_AD_CONFIG,
    apiConfig: DEFAULT_API_CONFIG,
    lastUpdated: new Date().toISOString(),
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: ServerDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

function ensureValidUUID(id?: string): string {
  if (!id) return 'a0000000-0000-4000-8000-' + Math.random().toString(16).substring(2, 14).padEnd(12, '0');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  const hash = Array.from(id).reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  const hex = Math.abs(hash).toString(16).padStart(12, '0');
  return `a0000000-0000-4000-8000-${hex.substring(0, 12)}`;
}

function toSupabaseMoviePayload(movie: Movie): any {
  return {
    id: ensureValidUUID(movie.id),
    title: movie.title || 'Film Tanpa Judul',
    slug: movie.slug,
    thumbnail: movie.thumbnail || '',
    backdrop: movie.backdrop || null,
    embed_code: movie.embed_code || '',
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

// Global in-memory DB cache
let memoryDb: ServerDatabase = ensureDatabase();

// Supabase client instance on server
let serverSupabaseClient: SupabaseClient | null = null;

function getServerSupabaseClient(): SupabaseClient | null {
  const cfg = memoryDb.supabaseConfig;
  if (cfg && cfg.enabled && cfg.url && cfg.anonKey) {
    if (!serverSupabaseClient) {
      try {
        serverSupabaseClient = createClient(cfg.url.trim(), cfg.anonKey.trim());
      } catch (err) {
        console.error('Failed to create server Supabase client:', err);
        return null;
      }
    }
    return serverSupabaseClient;
  }
  return null;
}

function resetServerSupabaseClient(): void {
  serverSupabaseClient = null;
}

// Background sync with Supabase
async function syncFromSupabase(): Promise<{ pulledMovies: number; success: boolean; message: string }> {
  const client = getServerSupabaseClient();
  if (!client) {
    return { pulledMovies: 0, success: false, message: 'Supabase tidak dikonfigurasi atau dinonaktifkan.' };
  }

  try {
    // 1. Fetch remote movies
    const { data: remoteMovies, error: movieErr } = await client
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });

    if (movieErr) {
      console.warn('Supabase pull movies error:', movieErr.message);
      return { pulledMovies: 0, success: false, message: `Error Supabase: ${movieErr.message}` };
    }

    if (remoteMovies && Array.isArray(remoteMovies) && remoteMovies.length > 0) {
      // Merge with memoryDb
      const existingSlugs = new Set(remoteMovies.map((m: any) => m.slug));
      const localOnly = memoryDb.movies.filter((m) => !existingSlugs.has(m.slug));
      
      // If local only movies exist, push them to Supabase
      if (localOnly.length > 0) {
        try {
          const payloads = localOnly.map(toSupabaseMoviePayload);
          await client.from('movies').upsert(payloads, { onConflict: 'slug' });
        } catch (pushErr) {
          console.warn('Error pushing local-only movies to Supabase:', pushErr);
        }
      }

      memoryDb.movies = remoteMovies;
      saveDatabase(memoryDb);
    } else if (memoryDb.movies.length > 0) {
      // Remote is empty, push all local movies to Supabase
      try {
        const payloads = memoryDb.movies.map(toSupabaseMoviePayload);
        await client.from('movies').upsert(payloads, { onConflict: 'slug' });
      } catch (e) {
        console.warn('Error seeding Supabase from local:', e);
      }
    }

    // 2. Fetch app_settings
    const { data: settingsData } = await client.from('app_settings').select('*');
    if (settingsData && Array.isArray(settingsData)) {
      for (const item of settingsData) {
        if (item.key === 'api_config' && item.value) {
          memoryDb.apiConfig = { ...DEFAULT_API_CONFIG, ...item.value };
        }
        if (item.key === 'ad_config' && item.value) {
          memoryDb.adConfig = { ...DEFAULT_AD_CONFIG, ...item.value };
        }
      }
      saveDatabase(memoryDb);
    }

    return {
      pulledMovies: memoryDb.movies.length,
      success: true,
      message: `Sinkronisasi berhasil! ${memoryDb.movies.length} film aktif tersinkron ke cloud Supabase & semua perangkat.`,
    };
  } catch (err: any) {
    console.error('Supabase sync exception:', err);
    return { pulledMovies: 0, success: false, message: `Sync exception: ${err.message || err}` };
  }
}

// Start Server
async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // CORS headers for all incoming API calls
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // Health & Sync Status
  app.get('/api/health', (req, res) => {
    const sb = getServerSupabaseClient();
    res.json({
      status: 'ok',
      serverTime: new Date().toISOString(),
      movieCount: memoryDb.movies.length,
      supabaseConnected: !!sb,
      lastUpdated: memoryDb.lastUpdated,
    });
  });

  // GET all movies (Shared across ALL devices)
  app.get('/api/movies', async (req, res) => {
    try {
      // 1. If Supabase is connected, pull latest movies to ensure instant multi-device sync
      const client = getServerSupabaseClient();
      if (client) {
        try {
          const { data: remoteMovies, error } = await client
            .from('movies')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && remoteMovies && Array.isArray(remoteMovies) && remoteMovies.length > 0) {
            memoryDb.movies = remoteMovies;
            saveDatabase(memoryDb);
          }
        } catch (sbErr) {
          console.warn('Supabase movies fetch notice on /api/movies:', sbErr);
        }
      }

      // 2. If database is completely empty, populate with real live movies from TMDB API
      if (memoryDb.movies.length === 0) {
        const liveMovies = await fetchRealTmdbMoviesForServer(
          memoryDb.apiConfig?.tmdbApiKey,
          memoryDb.apiConfig?.tmdbLanguage || 'id-ID'
        );
        if (liveMovies.length > 0) {
          memoryDb.movies = liveMovies;
          saveDatabase(memoryDb);
          if (client) {
            try {
              const payloads = liveMovies.map(toSupabaseMoviePayload);
              await client.from('movies').upsert(payloads, { onConflict: 'slug' });
            } catch (e) {
              console.warn('Auto seed supabase notice:', e);
            }
          }
        }
      }

      res.json({
        success: true,
        data: memoryDb.movies,
        total: memoryDb.movies.length,
        lastUpdated: memoryDb.lastUpdated,
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // GET movie by slug
  app.get('/api/movies/:slug', (req, res) => {
    const slug = req.params.slug;
    const movie = memoryDb.movies.find((m) => m.slug === slug);
    if (!movie) {
      res.status(404).json({ success: false, error: 'Film tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: movie });
  });

  // POST / PUT Save a movie (Add or Edit) -> Synchronized to ALL devices and Supabase
  app.post('/api/movies', async (req, res) => {
    try {
      const movieData = req.body as Movie;
      if (!movieData.title || !movieData.thumbnail) {
        res.status(400).json({ success: false, error: 'Judul dan URL Poster wajib diisi!' });
        return;
      }

      const id = movieData.id || `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const created_at = movieData.created_at || new Date().toISOString();

      const completeMovie: Movie = {
        ...movieData,
        id,
        created_at,
        genres: Array.isArray(movieData.genres) && movieData.genres.length > 0 ? movieData.genres : ['Action'],
        rating: typeof movieData.rating === 'number' ? movieData.rating : parseFloat(String(movieData.rating)) || 7.5,
        year: typeof movieData.year === 'number' ? movieData.year : parseInt(String(movieData.year), 10) || 2024,
        views: typeof movieData.views === 'number' ? movieData.views : 0,
      };

      const existingIndex = memoryDb.movies.findIndex(
        (m) => m.id === id || m.slug === completeMovie.slug
      );

      if (existingIndex >= 0) {
        memoryDb.movies[existingIndex] = {
          ...memoryDb.movies[existingIndex],
          ...completeMovie,
        };
      } else {
        memoryDb.movies.unshift(completeMovie);
      }

      saveDatabase(memoryDb);

      // Async sync to Supabase if connected
      const client = getServerSupabaseClient();
      if (client) {
        try {
          await client.from('movies').upsert(toSupabaseMoviePayload(completeMovie), { onConflict: 'slug' });
        } catch (sbErr) {
          console.warn('Supabase upsert warning:', sbErr);
        }
      }

      res.json({
        success: true,
        message: existingIndex >= 0 ? 'Film berhasil diperbarui!' : 'Film berhasil ditambahkan!',
        data: completeMovie,
        total: memoryDb.movies.length,
      });
    } catch (e: any) {
      console.error('Error saving movie:', e);
      res.status(500).json({ success: false, error: e.message || 'Gagal menyimpan film' });
    }
  });

  // POST Bulk save movies (TMDB auto-discovery imports)
  app.post('/api/movies/bulk', async (req, res) => {
    try {
      const { movies: newMovies } = req.body as { movies: Movie[] };
      if (!Array.isArray(newMovies) || newMovies.length === 0) {
        res.json({ success: true, count: 0, data: memoryDb.movies });
        return;
      }

      const existingSlugs = new Set(memoryDb.movies.map((m) => m.slug));
      const existingTmdbIds = new Set(
        memoryDb.movies.filter((m) => m.tmdb_id).map((m) => Number(m.tmdb_id))
      );

      const trulyNew: Movie[] = [];
      for (const m of newMovies) {
        if (!existingSlugs.has(m.slug) && (!m.tmdb_id || !existingTmdbIds.has(Number(m.tmdb_id)))) {
          const movieObj: Movie = {
            ...m,
            id: m.id || `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            created_at: m.created_at || new Date().toISOString(),
          };
          trulyNew.push(movieObj);
          existingSlugs.add(movieObj.slug);
          if (movieObj.tmdb_id) existingTmdbIds.add(Number(movieObj.tmdb_id));
        }
      }

      if (trulyNew.length > 0) {
        memoryDb.movies = [...trulyNew, ...memoryDb.movies];
        saveDatabase(memoryDb);

        const client = getServerSupabaseClient();
        if (client) {
          try {
            const payloads = trulyNew.map(toSupabaseMoviePayload);
            await client.from('movies').upsert(payloads, { onConflict: 'slug' });
          } catch (sbErr) {
            console.warn('Supabase bulk upsert warning:', sbErr);
          }
        }
      }

      res.json({
        success: true,
        message: `Berhasil mengimpor ${trulyNew.length} film baru!`,
        addedCount: trulyNew.length,
        total: memoryDb.movies.length,
        data: memoryDb.movies,
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // DELETE a movie
  app.delete('/api/movies/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const target = memoryDb.movies.find((m) => m.id === id);
      memoryDb.movies = memoryDb.movies.filter((m) => m.id !== id);
      saveDatabase(memoryDb);

      const client = getServerSupabaseClient();
      if (client && target) {
        try {
          await client.from('movies').delete().or(`id.eq.${id},slug.eq.${target.slug}`);
        } catch (sbErr) {
          console.warn('Supabase delete warning:', sbErr);
        }
      }

      res.json({
        success: true,
        message: 'Film berhasil dihapus dari semua perangkat!',
        total: memoryDb.movies.length,
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // POST Increment view count
  app.post('/api/movies/:id/views', async (req, res) => {
    const id = req.params.id;
    const movie = memoryDb.movies.find((m) => m.id === id);
    if (movie) {
      movie.views = (movie.views || 0) + 1;
      saveDatabase(memoryDb);

      const client = getServerSupabaseClient();
      if (client) {
        Promise.resolve(client.from('movies').update({ views: movie.views }).eq('id', id)).catch(() => {});
      }
    }
    res.json({ success: true, views: movie ? movie.views : 0 });
  });

  // POST Reset movies to fresh live TMDB movies
  app.post('/api/movies/reset', async (req, res) => {
    try {
      const realMovies = await fetchRealTmdbMoviesForServer(
        memoryDb.apiConfig?.tmdbApiKey,
        memoryDb.apiConfig?.tmdbLanguage || 'id-ID'
      );
      memoryDb.movies = realMovies;
      saveDatabase(memoryDb);

      const client = getServerSupabaseClient();
      if (client && realMovies.length > 0) {
        try {
          await client.from('movies').upsert(realMovies, { onConflict: 'slug' });
        } catch (sbErr) {
          console.warn('Supabase reset upsert error:', sbErr);
        }
      }

      res.json({ success: true, message: `Database berhasil diperbarui dengan ${realMovies.length} film asli dari TMDB!`, data: memoryDb.movies });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Refresh real movies from API
  app.post('/api/movies/refresh-real', async (req, res) => {
    try {
      const realMovies = await fetchRealTmdbMoviesForServer(
        memoryDb.apiConfig?.tmdbApiKey,
        memoryDb.apiConfig?.tmdbLanguage || 'id-ID'
      );
      if (realMovies.length > 0) {
        // Merge or replace
        const existingSlugs = new Set(memoryDb.movies.map((m) => m.slug));
        const newAdditions = realMovies.filter((m) => !existingSlugs.has(m.slug));
        memoryDb.movies = [...newAdditions, ...memoryDb.movies];
        saveDatabase(memoryDb);
      }
      res.json({ success: true, count: memoryDb.movies.length, data: memoryDb.movies });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET global settings (Supabase, Ads, API)
  app.get('/api/settings', (req, res) => {
    res.json({
      success: true,
      data: {
        supabaseConfig: memoryDb.supabaseConfig,
        adConfig: memoryDb.adConfig,
        apiConfig: memoryDb.apiConfig,
      },
    });
  });

  // POST save global settings -> Synchronized to ALL devices and Supabase
  app.post('/api/settings', async (req, res) => {
    try {
      const { supabaseConfig, adConfig, apiConfig } = req.body;

      if (supabaseConfig) {
        memoryDb.supabaseConfig = {
          ...memoryDb.supabaseConfig,
          ...supabaseConfig,
        };
        resetServerSupabaseClient();
      }

      if (adConfig) {
        memoryDb.adConfig = {
          ...memoryDb.adConfig,
          ...adConfig,
        };
      }

      if (apiConfig) {
        memoryDb.apiConfig = {
          ...memoryDb.apiConfig,
          ...apiConfig,
        };
      }

      saveDatabase(memoryDb);

      // If Supabase is connected, sync settings to Supabase table app_settings
      const client = getServerSupabaseClient();
      if (client) {
        try {
          if (adConfig) {
            await client.from('app_settings').upsert({
              key: 'ad_config',
              value: memoryDb.adConfig,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });
          }
          if (apiConfig) {
            await client.from('app_settings').upsert({
              key: 'api_config',
              value: memoryDb.apiConfig,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });
          }
        } catch (sbErr) {
          console.warn('Supabase settings sync warning:', sbErr);
        }
      }

      res.json({
        success: true,
        message: 'Pengaturan berhasil disimpan dan disinkronkan ke semua perangkat!',
        data: {
          supabaseConfig: memoryDb.supabaseConfig,
          adConfig: memoryDb.adConfig,
          apiConfig: memoryDb.apiConfig,
        },
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // POST Trigger Supabase Sync
  app.post('/api/sync/supabase', async (req, res) => {
    const result = await syncFromSupabase();
    res.json({
      ...result,
      totalMovies: memoryDb.movies.length,
      data: memoryDb.movies,
    });
  });

  // Helper to decode HTML entities
  function decodeHtmlEntities(str: string): string {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
  }

  // Universal Video Extractor from YouTube Data Structures
  function extractVideosFromYouTubeData(data: any, maxResults = 16): any[] {
    const results: any[] = [];
    const seenIds = new Set<string>();

    function addVideo(id: string, title: string, channel: string, description: string, viewCount: string, duration: string, publishedAt: string, isLive: boolean) {
      if (!id || typeof id !== 'string' || id.length < 5 || id.startsWith('PL') || id.startsWith('VL') || seenIds.has(id) || results.length >= maxResults) return;
      seenIds.add(id);
      results.push({
        id,
        title: decodeHtmlEntities(title || 'YouTube Video'),
        description: decodeHtmlEntities(description || ''),
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        channelTitle: decodeHtmlEntities(channel || 'YouTube Channel'),
        publishedAt: publishedAt || 'Terbaru',
        duration: isLive ? 'LIVE' : duration || 'Full HD',
        viewCount: viewCount || '',
        isLive: Boolean(isLive),
        embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`,
      });
    }

    function traverse(obj: any) {
      if (!obj || typeof obj !== 'object' || results.length >= maxResults) return;

      // 1. videoRenderer (Standard Web Desktop)
      if (obj.videoRenderer && obj.videoRenderer.videoId) {
        const vr = obj.videoRenderer;
        const vId = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || '';
        const channel = vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text || '';
        const desc = vr.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') ||
                     vr.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || '';
        const views = vr.viewCountText?.simpleText || vr.viewCountText?.runs?.map((r: any) => r.text).join('') || vr.shortViewCountText?.simpleText || '';
        const dur = vr.lengthText?.simpleText || '';
        const pub = vr.publishedTimeText?.simpleText || 'Terbaru';
        const isLive = Boolean(
          vr.badges?.some((b: any) => {
            const l = b.metadataBadgeRenderer?.label || b.metadataBadgeRenderer?.style || '';
            return l.includes('LIVE') || l.includes('BADGE_STYLE_TYPE_LIVE_NOW');
          }) ||
          vr.thumbnailOverlays?.some((to: any) => to.thumbnailOverlayTimeStatusRenderer?.style === 'LIVE') ||
          views.includes('menonton') ||
          views.includes('watching')
        );
        addVideo(vId, title, channel, desc, views, dur, pub, isLive);
        return;
      }

      // 2. lockupViewModel (YouTube 2025/2026 unified model)
      if (obj.lockupViewModel) {
        const lm = obj.lockupViewModel;
        let vId = '';
        if (lm.contentId && !lm.contentId.startsWith('PL') && !lm.contentId.startsWith('VL')) {
          vId = lm.contentId;
        }
        if (!vId) {
          vId = lm.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint?.videoId ||
                lm.itemPlayback?.inlinePlayerData?.onSelect?.innertubeCommand?.watchEndpoint?.videoId ||
                lm.itemPlayback?.inlinePlayerData?.onVisible?.innertubeCommand?.watchEndpoint?.videoId;
        }

        if (vId) {
          const title = lm.metadata?.lockupMetadataViewModel?.title?.content || '';
          const metaRows = lm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
          let channel = '';
          let views = '';
          let pub = '';
          let isLive = false;

          for (const row of metaRows) {
            const parts = row.metadataParts || [];
            for (const part of parts) {
              const text = part.text?.content || '';
              if (!channel && text && !text.includes('tayangan') && !text.includes('views') && !text.includes('yang lalu') && !text.includes('ago')) {
                channel = text;
              } else if (text.includes('tayangan') || text.includes('views') || text.includes('menonton') || text.includes('watching')) {
                views = text;
                if (text.includes('menonton') || text.includes('watching')) isLive = true;
              } else if (text.includes('lalu') || text.includes('ago') || text.includes('Streaming') || text.includes('Streamed')) {
                pub = text;
              }
            }
          }

          const badge = lm.contentImage?.thumbnailViewModel?.overlays;
          if (badge && JSON.stringify(badge).includes('LIVE')) {
            isLive = true;
          }

          addVideo(vId, title, channel, '', views, isLive ? 'LIVE' : 'Full HD', pub, isLive);
        }
        return;
      }

      // 3. compactVideoRenderer
      if (obj.compactVideoRenderer && obj.compactVideoRenderer.videoId) {
        const vr = obj.compactVideoRenderer;
        const vId = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || '';
        const channel = vr.shortBylineText?.runs?.[0]?.text || '';
        addVideo(vId, title, channel, '', '', 'Full HD', 'Terbaru', false);
        return;
      }

      // Recursion
      if (Array.isArray(obj)) {
        for (const item of obj) {
          traverse(item);
          if (results.length >= maxResults) break;
        }
      } else {
        for (const key of Object.keys(obj)) {
          traverse(obj[key]);
          if (results.length >= maxResults) break;
        }
      }
    }

    traverse(data);
    return results;
  }

  // Real-time YouTube search engine using InnerTube & HTML Scraping
  async function fetchRealtimeYouTube(query: string, isLive = false, isMovie = false, maxResults = 16): Promise<any[]> {
    let qParam = query.trim();
    if (isLive && !qParam.toLowerCase().includes('live')) {
      qParam += ' live';
    }

    // Tier 1: YouTube Official InnerTube JSON API (Zero API Keys required, ultra-fast & structured)
    try {
      const postBody: any = {
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240301.00.00',
            hl: 'id',
            gl: 'ID',
          },
        },
        query: qParam,
      };

      if (isLive) {
        postBody.params = 'CAMSAkAB';
      }

      const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'X-YouTube-Client-Name': '1',
          'X-YouTube-Client-Version': '2.20240301.00.00',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        body: JSON.stringify(postBody),
      });

      if (res.ok) {
        const json = (await res.json()) as any;
        const videos = extractVideosFromYouTubeData(json, maxResults);
        if (videos.length > 0) {
          return videos;
        }
      }
    } catch (innerErr) {
      console.warn('InnerTube search error, falling back to Web scraper:', innerErr);
    }

    // Tier 2: Web Scraping with Consent Cookies & Balanced JSON Parser
    try {
      let url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(qParam);
      if (isLive) {
        url += '&sp=CAMSAkAB';
      }

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Cookie': 'SOCS=CAESEwgDEgk2ODEwNTk5NjUaAmVuIAEaBgiA_LyaBg; PREF=tz=Asia.Jakarta&f6=400&f5=30000; YSC=aXn7P93-3bA; VISITOR_INFO1_LIVE=dummy',
        },
      });

      if (res.ok) {
        const html = await res.text();
        const marker = 'ytInitialData';
        const index = html.indexOf(marker);
        if (index !== -1) {
          const equalsIndex = html.indexOf('=', index);
          const startBrace = html.indexOf('{', equalsIndex);
          if (startBrace !== -1) {
            let depth = 0;
            let inString = false;
            let isEscaped = false;
            for (let i = startBrace; i < html.length; i++) {
              const char = html[i];
              if (isEscaped) {
                isEscaped = false;
                continue;
              }
              if (char === '\\') {
                isEscaped = true;
                continue;
              }
              if (char === '"' && !isEscaped) {
                inString = !inString;
                continue;
              }
              if (!inString) {
                if (char === '{') depth++;
                else if (char === '}') {
                  depth--;
                  if (depth === 0) {
                    try {
                      const json = JSON.parse(html.substring(startBrace, i + 1));
                      const videos = extractVideosFromYouTubeData(json, maxResults);
                      if (videos.length > 0) return videos;
                    } catch (pe) {}
                    break;
                  }
                }
              }
            }
          }
        }
      }
    } catch (scrapeErr) {
      console.warn('Web scrape fallback warning:', scrapeErr);
    }

    // Tier 3: Curated Backup Movies / Streams Feed for absolute reliability
    return getCuratedYouTubeFallback(qParam, isLive);
  }

  function getCuratedYouTubeFallback(query: string, isLive: boolean): any[] {
    if (isLive) {
      return [
        {
          id: 'jfKfPfyJRdk',
          title: '🔴 Lofi Girl - Beats to relax/study to 24/7 Live Music',
          description: 'Peaceful lofi hip hop radio stream running 24/7 worldwide.',
          thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
          channelTitle: 'Lofi Girl',
          publishedAt: 'Live Sekarang',
          duration: 'LIVE',
          viewCount: '25.4K menonton',
          isLive: true,
          embedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&rel=0&modestbranding=1',
        },
        {
          id: '21X5lGlDOfg',
          title: '🔴 NASA Live: Official Earth Views from Space Station (ISS)',
          description: 'Live views of Earth from the International Space Station.',
          thumbnail: 'https://i.ytimg.com/vi/21X5lGlDOfg/hqdefault.jpg',
          channelTitle: 'NASA',
          publishedAt: 'Live Sekarang',
          duration: 'LIVE',
          viewCount: '12.8K menonton',
          isLive: true,
          embedUrl: 'https://www.youtube.com/embed/21X5lGlDOfg?autoplay=1&rel=0&modestbranding=1',
        },
        {
          id: 'rQJoEpzKkNk',
          title: '🔴 Live Streaming tvOne 24 Jam Nonstop',
          description: 'Siaran berita terlengkap dan terhangat dari tvOne Indonesia.',
          thumbnail: 'https://i.ytimg.com/vi/rQJoEpzKkNk/hqdefault.jpg',
          channelTitle: 'tvOneNews',
          publishedAt: 'Live Sekarang',
          duration: 'LIVE',
          viewCount: '18.2K menonton',
          isLive: true,
          embedUrl: 'https://www.youtube.com/embed/rQJoEpzKkNk?autoplay=1&rel=0&modestbranding=1',
        },
        {
          id: 'gCNeDWCI0vo',
          title: '🔴 Al Jazeera English | Live Global News Stream',
          description: '24 hour live international news broadcasting in HD.',
          thumbnail: 'https://i.ytimg.com/vi/gCNeDWCI0vo/hqdefault.jpg',
          channelTitle: 'Al Jazeera English',
          publishedAt: 'Live Sekarang',
          duration: 'LIVE',
          viewCount: '34.1K menonton',
          isLive: true,
          embedUrl: 'https://www.youtube.com/embed/gCNeDWCI0vo?autoplay=1&rel=0&modestbranding=1',
        },
      ];
    }

    return [
      {
        id: 'Y1g8FrAzsn4',
        title: 'TUNGGU AKU SUKSES NANTI FULL MOVIE HD REAL',
        description: 'Film bioskop drama keluarga dan perjuangan hidup anak muda meraih kesuksesan.',
        thumbnail: 'https://i.ytimg.com/vi/Y1g8FrAzsn4/hqdefault.jpg',
        channelTitle: 'Falcon Pictures',
        publishedAt: 'Terbaru',
        duration: '1j 48m',
        viewCount: '1.2M tayangan',
        isLive: false,
        embedUrl: 'https://www.youtube.com/embed/Y1g8FrAzsn4?autoplay=1&rel=0&modestbranding=1',
      },
      {
        id: '16cnRtZK3Bc',
        title: 'GHOST IN THE CELL | FILM BIOSKOP INDONESIA 2026',
        description: 'Misteri penjara tua dan arwah penasaran yang meneror narapidana.',
        thumbnail: 'https://i.ytimg.com/vi/16cnRtZK3Bc/hqdefault.jpg',
        channelTitle: 'Cinema XXI',
        publishedAt: 'Terbaru',
        duration: '1j 52m',
        viewCount: '850K tayangan',
        isLive: false,
        embedUrl: 'https://www.youtube.com/embed/16cnRtZK3Bc?autoplay=1&rel=0&modestbranding=1',
      },
      {
        id: 'IvEtWGhGl2g',
        title: 'FILM CHINA FULL MOVIE INDO SUB | Aksi & Misteri Legendaris',
        description: 'Pertarungan pendekar jurus rahasia melawan pendekar bayangan kerajaan.',
        thumbnail: 'https://i.ytimg.com/vi/IvEtWGhGl2g/hqdefault.jpg',
        channelTitle: 'Film Bioskop Asia',
        publishedAt: 'Terbaru',
        duration: '1j 35m',
        viewCount: '620K tayangan',
        isLive: false,
        embedUrl: 'https://www.youtube.com/embed/IvEtWGhGl2g?autoplay=1&rel=0&modestbranding=1',
      },
      {
        id: '8lLQimyKBA0',
        title: 'Film Pendek - Nol Rupiah (Kisah Inspiratif)',
        description: 'Kisah nyata perjuangan hidup di kota metropolitan dari nol hingga sukses.',
        thumbnail: 'https://i.ytimg.com/vi/8lLQimyKBA0/hqdefault.jpg',
        channelTitle: 'Karya Sinema Indonesia',
        publishedAt: 'Terbaru',
        duration: '45m',
        viewCount: '410K tayangan',
        isLive: false,
        embedUrl: 'https://www.youtube.com/embed/8lLQimyKBA0?autoplay=1&rel=0&modestbranding=1',
      },
    ];
  }

  // GET Search YouTube Videos & Live Streams (Dual Engine: Google API + Direct Realtime Engine)
  app.get('/api/youtube/search', async (req, res) => {
    try {
      const q = String(req.query.q || 'film bioskop indonesia').trim();
      const isLive = req.query.isLive === 'true';
      const isMovie = req.query.isMovie === 'true';
      const maxResults = Math.min(parseInt(String(req.query.maxResults || '16'), 10), 30);
      const ytApiKey = memoryDb.apiConfig?.youtubeApiKey;

      // 1. If API key exists, try official Google YouTube Data API v3
      if (ytApiKey && ytApiKey.trim()) {
        try {
          const params = new URLSearchParams({
            part: 'snippet',
            maxResults: String(maxResults),
            q,
            type: 'video',
            key: ytApiKey.trim(),
          });

          if (isLive) {
            params.set('eventType', 'live');
          } else if (isMovie) {
            params.set('videoDuration', 'long');
          }

          const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
          if (ytRes.ok) {
            const data = (await ytRes.json()) as any;
            if (data.items && Array.isArray(data.items) && data.items.length > 0) {
              const items = data.items.map((item: any) => {
                const vId = item.id?.videoId || '';
                return {
                  id: vId,
                  title: decodeHtmlEntities(item.snippet?.title || 'YouTube Video'),
                  description: decodeHtmlEntities(item.snippet?.description || ''),
                  thumbnail:
                    item.snippet?.thumbnails?.high?.url ||
                    item.snippet?.thumbnails?.medium?.url ||
                    `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
                  channelTitle: decodeHtmlEntities(item.snippet?.channelTitle || 'YouTube Channel'),
                  channelId: item.snippet?.channelId,
                  publishedAt: item.snippet?.publishedAt || 'Terbaru',
                  isLive: isLive || item.snippet?.liveBroadcastContent === 'live',
                  embedUrl: `https://www.youtube.com/embed/${vId}?autoplay=1&rel=0&modestbranding=1`,
                };
              });

              res.json({
                success: true,
                items,
                source: 'youtube-api-v3',
                totalResults: data.pageInfo?.totalResults || items.length,
              });
              return;
            }
          }
        } catch (apiErr) {
          console.warn('YouTube official API try error, switching to direct engine:', apiErr);
        }
      }

      // 2. Real-time direct YouTube engine (No admin settings or API key required)
      const realtimeItems = await fetchRealtimeYouTube(q, isLive, isMovie, maxResults);
      res.json({
        success: true,
        items: realtimeItems,
        source: 'youtube-realtime-engine',
        totalResults: realtimeItems.length,
      });
    } catch (e: any) {
      console.warn('YouTube search route error:', e);
      res.json({ success: true, items: [] });
    }
  });

  // Dynamic Open Graph & Twitter Card Meta Tag Injector for Social Media Link Previews (WhatsApp, FB, Twitter, Telegram, Discord, etc.)
  function injectMetaTags(html: string, req: express.Request): string {
    const db = ensureDatabase();
    const slug = (req.query.slug as string) || (req.query.movie as string) || (req.query.id as string) || '';
    const live = (req.query.live as string) || (req.query.yt as string) || (req.query.v as string) || '';

    // Check URL path e.g. /watch/:slug or /movie/:slug
    let targetSlug = slug;
    if (!targetSlug && (req.path.startsWith('/watch/') || req.path.startsWith('/movie/'))) {
      targetSlug = req.path.split('/')[2] || '';
    }

    let movie: Movie | undefined;
    if (targetSlug) {
      movie = db.movies.find((m) => m.slug === targetSlug || m.id === targetSlug || String(m.tmdb_id) === targetSlug);
    }

    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'tontonangratis.app';
    const canonicalUrl = `${protocol}://${host}${req.originalUrl}`;

    let title = 'Tontonan Gratis - Streaming Film HD & Live TV';
    let description = 'Streaming film gratis subtitle Indonesia kualitas HD tanpa buffering dengan pemutar multi-server.';
    let image = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80';
    let type = 'video.movie';

    if (movie) {
      const yearStr = movie.year ? ` (${movie.year})` : '';
      const qualityStr = movie.quality ? ` [${movie.quality}]` : ' [Full HD]';
      title = `🎬 Nonton Film ${movie.title}${yearStr}${qualityStr} - Tontonan Gratis`;
      description = movie.synopsis
        ? (movie.synopsis.length > 220 ? movie.synopsis.substring(0, 217) + '...' : movie.synopsis)
        : `Nonton streaming gratis film ${movie.title} kualitas HD tanpa buffering dengan multi-server video player di Tontonan Gratis.`;
      image = movie.backdrop || movie.thumbnail;
      type = 'video.movie';
    } else if (live) {
      title = '🔴 Nonton Siaran Langsung & Live TV HD - Tontonan Gratis';
      description = 'Streaming siaran langsung TV, siaran olahraga, musik, dan tayangan YouTube HD di Tontonan Gratis.';
      image = `https://i.ytimg.com/vi/${live}/hqdefault.jpg`;
      type = 'video.other';
    }

    // Ensure absolute image URL
    if (image && image.startsWith('/')) {
      image = `${protocol}://${host}${image}`;
    }

    const escapeAttr = (str: string) =>
      str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const safeTitle = escapeAttr(title);
    const safeDesc = escapeAttr(description);
    const safeImage = escapeAttr(image);
    const safeUrl = escapeAttr(canonicalUrl);

    let output = html;

    // Replace Title
    output = output.replace(/<title>.*?<\/title>/i, `<title>${safeTitle}</title>`);

    // Replace meta description
    if (output.includes('name="description"')) {
      output = output.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${safeDesc}" />`);
    }

    // Replace or inject Open Graph tags
    const ogReplacements: Record<string, string> = {
      'og:title': safeTitle,
      'og:description': safeDesc,
      'og:image': safeImage,
      'og:image:secure_url': safeImage,
      'og:url': safeUrl,
      'og:type': type,
      'og:site_name': 'Tontonan Gratis',
    };

    for (const [prop, val] of Object.entries(ogReplacements)) {
      const regex = new RegExp(`<meta\\s+property="${prop}"\\s+content=".*?"\\s*\\/?>`, 'i');
      if (regex.test(output)) {
        output = output.replace(regex, `<meta property="${prop}" content="${val}" />`);
      } else {
        output = output.replace('</head>', `  <meta property="${prop}" content="${val}" />\n  </head>`);
      }
    }

    // Replace or inject Twitter tags
    const twitterReplacements: Record<string, string> = {
      'twitter:title': safeTitle,
      'twitter:description': safeDesc,
      'twitter:image': safeImage,
      'twitter:card': 'summary_large_image',
    };

    for (const [name, val] of Object.entries(twitterReplacements)) {
      const regex = new RegExp(`<meta\\s+name="${name}"\\s+content=".*?"\\s*\\/?>`, 'i');
      if (regex.test(output)) {
        output = output.replace(regex, `<meta name="${name}" content="${val}" />`);
      } else {
        output = output.replace('</head>', `  <meta name="${name}" content="${val}" />\n  </head>`);
      }
    }

    return output;
  }

  // -------------------------------------------------------------
  // VITE & STATIC FILES SERVING WITH OPEN GRAPH THUMBNAIL SUPPORT
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Custom HTML Middleware to inject movie thumbnail & meta tags in Dev Mode
    app.use(async (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.includes('.')) {
        return next();
      }

      const acceptsHtml = req.headers.accept?.includes('text/html') || !req.headers.accept;
      const isCrawler = /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|discordbot|slackbot|linkedinbot|pinterest|googlebot|bingbot/i.test(req.headers['user-agent'] || '');
      const hasShareParams = Boolean(req.query.slug || req.query.movie || req.query.id || req.query.live || req.query.yt || req.query.v);

      if (acceptsHtml || isCrawler || hasShareParams) {
        try {
          const indexPath = path.join(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(req.originalUrl, template);
          const html = injectMetaTags(template, req);
          res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(html);
          return;
        } catch (e: any) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
          return;
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      try {
        const template = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
        const html = injectMetaTags(template, req);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
      } catch (e) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  // Perform initial Supabase sync in background
  syncFromSupabase().catch((e) => console.log('Initial sync note:', e.message || e));

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 Server Tontonan Gratis running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
