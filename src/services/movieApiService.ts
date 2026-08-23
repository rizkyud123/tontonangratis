import { Movie, MovieServer, ApiIntegrationConfig, TmdbMovieResult } from '../types';
import { findCountryInfo } from '../utils/countryHelper';

// Default TMDB Public Key for immediate out-of-the-box discovery if user hasn't set one yet
export const DEFAULT_FALLBACK_TMDB_KEY = '4e44d9029b1270a757cddc766a1bcb63';

export const DEFAULT_API_CONFIG: ApiIntegrationConfig = {
  tmdbApiKey: '',
  tmdbLanguage: 'id-ID',
  omdbApiKey: '',
  youtubeApiKey: 'AIzaSyDwL7xt9_C8X2QvjhSbxRVA1KqowIxa9-k',
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

export interface EmbedProviderInfo {
  id: string;
  name: string;
  badge: string;
  description: string;
  template: string;
  supportsImdb?: boolean;
}

export const EMBED_PROVIDERS: EmbedProviderInfo[] = [
  {
    id: 'vidsrc_xyz',
    name: 'VidSrc XYZ (Server 1 - HD)',
    badge: 'Rekomendasi',
    description: 'Server VidSrc resmi cepat dengan subtitle otomatis & resolusi 1080p HD',
    template: 'https://vidsrc.xyz/embed/movie/{tmdb_id}',
  },
  {
    id: 'vidsrc_to',
    name: 'VidSrc TO (Server 2 - Cepat)',
    badge: 'Cepat',
    description: 'Server VidSrc mirror alternatif kecepatan tinggi tanpa jeda',
    template: 'https://vidsrc.to/embed/movie/{tmdb_id}',
  },
  {
    id: 'superembed',
    name: 'SuperEmbed (Server 3 - MultiHost)',
    badge: 'Multi-Host',
    description: 'Menyediakan banyak opsi host video cadangan terintegrasi',
    template: 'https://multiembed.mov/?video_id={tmdb_id}&tmdb=1',
  },
  {
    id: 'embed_su',
    name: 'Embed.su (Server 4 - Ultra HD)',
    badge: '4K / 1080p',
    description: 'Dukungan resolusi tinggi hingga 1080p/4K tanpa lag',
    template: 'https://embed.su/embed/movie/{tmdb_id}',
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed (Server 5 - VIP)',
    badge: 'Stabil',
    description: 'Player video otomatis dengan server global cadangan',
    template: 'https://player.autoembed.cc/embed/movie/{tmdb_id}',
  },
  {
    id: 'vidlink',
    name: 'VidLink Pro (Server 6)',
    badge: 'Fast CDN',
    description: 'Koneksi CDN cepat dan minimal buffering',
    template: 'https://vidlink.pro/movie/{tmdb_id}',
  },
  {
    id: 'moviesapi',
    name: 'MoviesAPI (Server 7)',
    badge: 'Populer',
    description: 'Server streaming film global dengan pemutar modern',
    template: 'https://moviesapi.club/movie/{tmdb_id}',
  },
  {
    id: 'smashystream',
    name: 'SmashyStream (Server 8)',
    badge: 'Cadangan',
    description: 'Streaming alternatif dengan kualitas beragam',
    template: 'https://player.smashystream.com/movie/{tmdb_id}',
  },
  {
    id: '2embed',
    name: '2Embed (Server 9)',
    badge: 'Klasik',
    description: 'Player stabil berbasis TMDB ID',
    template: 'https://www.2embed.cc/embed/{tmdb_id}',
  },
];

// In-memory API integration configuration (persisted directly via Database API)
let memoryApiConfig: ApiIntegrationConfig = { ...DEFAULT_API_CONFIG };

export function getApiConfig(): ApiIntegrationConfig {
  return memoryApiConfig;
}

export function setApiConfigInMemory(config: ApiIntegrationConfig): void {
  memoryApiConfig = { ...DEFAULT_API_CONFIG, ...config };
}

export function saveApiConfig(config: ApiIntegrationConfig): void {
  memoryApiConfig = { ...DEFAULT_API_CONFIG, ...config };
}

// Sanitizer for video embed URLs (fixes dead vidsrc.icu domains)
export function sanitizeEmbedUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim();
  if (clean.includes('vidsrc.icu')) {
    clean = clean.replace(/vidsrc\.icu/g, 'vidsrc.xyz');
  }
  return clean;
}

export function getActiveTmdbKey(): string {
  const config = getApiConfig();
  if (config.tmdbApiKey && config.tmdbApiKey.trim()) {
    return config.tmdbApiKey.trim();
  }
  return DEFAULT_FALLBACK_TMDB_KEY;
}

// Genre ID to label mapping
export const TMDB_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

export function mapGenreIdsToNames(genreIds?: number[]): string[] {
  if (!genreIds || genreIds.length === 0) return ['Action', 'Drama'];
  return genreIds.map((id) => TMDB_GENRES[id] || 'Action').filter(Boolean);
}

// Image URL helper
export function getTmdbImageUrl(path: string | null, size: 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string {
  if (!path) {
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
  }
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate multi-server streaming embed links
export function generateMovieServers(
  tmdbId: number | string,
  imdbId?: string,
  customTemplate?: string
): MovieServer[] {
  const idStr = String(tmdbId);
  const imdbStr = imdbId || '';
  const servers: MovieServer[] = [];
  const config = getApiConfig();

  const enabledSet = new Set(config.enabledProviders || []);

  EMBED_PROVIDERS.forEach((provider, index) => {
    // Only include if provider is enabled
    if (enabledSet.size === 0 || enabledSet.has(provider.id)) {
      const url = provider.template.replace('{tmdb_id}', idStr).replace('{imdb_id}', imdbStr);
      servers.push({
        id: `server-${provider.id}-${idStr}`,
        name: provider.name.split(' (')[0],
        url: url,
        quality: index === 0 ? '1080p HD' : index === 2 ? '4K / FHD' : 'HD 720p',
        isDefault: servers.length === 0,
      });
    }
  });

  // Custom User-Defined Providers
  if (Array.isArray(config.customProviders)) {
    config.customProviders.forEach((cp, idx) => {
      if (cp.enabled && cp.template) {
        let cpUrl = cp.template.replace('{tmdb_id}', idStr).replace('{imdb_id}', imdbStr);
        if (cp.apiKey) {
          cpUrl = cpUrl.replace('{api_key}', cp.apiKey);
        }
        servers.push({
          id: `custom-srv-${cp.id || idx}-${idStr}`,
          name: cp.name || `Custom Server ${idx + 1}`,
          url: cpUrl,
          quality: cp.badge || 'HD',
          isDefault: servers.length === 0,
        });
      }
    });
  }

  if (customTemplate && customTemplate.trim()) {
    const customUrl = customTemplate
      .replace('{tmdb_id}', idStr)
      .replace('{imdb_id}', imdbStr);
    servers.push({
      id: `server-custom-${idStr}`,
      name: 'Server Custom',
      url: customUrl,
      quality: 'HD',
      isDefault: servers.length === 0,
    });
  }

  return servers;
}

// Construct primary iframe embed HTML from server URL
export function createEmbedHtml(url: string, title?: string): string {
  return `<iframe src="${url}" title="${title || 'Video Player'}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen="true" scrolling="no" class="w-full h-full"></iframe>`;
}

// OMDb API test
export async function testOmdbConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const key = apiKey.trim();
    if (!key) return { success: false, message: 'Harap masukkan OMDb API Key.' };
    const res = await fetch(`https://www.omdbapi.com/?apikey=${key}&t=Inception`);
    const data = await res.json();
    if (data.Response === 'True') {
      return { success: true, message: `Koneksi OMDb Berhasil! Terhubung ke film: ${data.Title} (${data.Year})` };
    }
    return { success: false, message: data.Error || 'OMDb API Key tidak valid.' };
  } catch (err: any) {
    return { success: false, message: `Gagal terhubung ke OMDb: ${err.message || err}` };
  }
}

// TMDB API Client calls
export async function testTmdbConnection(apiKey: string): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const keyToTest = apiKey.trim() || DEFAULT_FALLBACK_TMDB_KEY;
    const res = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${keyToTest}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errData.status_message || `HTTP Error ${res.status}: API Key TMDB tidak valid.`,
      };
    }
    const data = await res.json();
    return {
      success: true,
      message: 'Koneksi ke API TMDB Berhasil! Server siap mengambil data film.',
      details: data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal terhubung ke TMDB: ${err.message || err}`,
    };
  }
}

export async function searchTmdbMovies(query: string, page = 1): Promise<{ results: TmdbMovieResult[]; total_pages: number; total_results: number }> {
  const apiKey = getActiveTmdbKey();
  const config = getApiConfig();
  const lang = config.tmdbLanguage || 'id-ID';

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&language=${lang}&include_adult=false`
  );

  if (!res.ok) {
    // If id-ID returns empty/error, try en-US
    const fallbackRes = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&language=en-US&include_adult=false`
    );
    if (fallbackRes.ok) {
      return await fallbackRes.json();
    }
    throw new Error(`Gagal mencari film di TMDB (Status: ${res.status})`);
  }

  const data = await res.json();
  return data;
}

export async function getTmdbPresetMovies(preset: 'trending' | 'popular' | 'top_rated' | 'now_playing' | 'indonesia', page = 1): Promise<{ results: TmdbMovieResult[]; total_pages: number; total_results: number }> {
  const apiKey = getActiveTmdbKey();
  const config = getApiConfig();
  const lang = config.tmdbLanguage || 'id-ID';

  let endpoint = '';
  switch (preset) {
    case 'trending':
      endpoint = `https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}&language=${lang}&page=${page}`;
      break;
    case 'popular':
      endpoint = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${lang}&page=${page}`;
      break;
    case 'top_rated':
      endpoint = `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=${lang}&page=${page}`;
      break;
    case 'now_playing':
      endpoint = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=${lang}&page=${page}`;
      break;
    case 'indonesia':
      endpoint = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_original_language=id&sort_by=popularity.desc&language=${lang}&page=${page}`;
      break;
    default:
      endpoint = `https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}&language=${lang}&page=${page}`;
  }

  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error(`Gagal memuat preset film dari TMDB (${preset})`);
  }

  const data = await res.json();
  return data;
}

export async function getTmdbMovieDetails(tmdbId: number | string): Promise<any> {
  const apiKey = getActiveTmdbKey();
  const config = getApiConfig();
  const lang = config.tmdbLanguage || 'id-ID';

  // Request movie with append_to_response for videos and external_ids (IMDb ID)
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=${lang}&append_to_response=videos,external_ids`
  );

  if (!res.ok) {
    // Try English fallback
    const fallbackRes = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=en-US&append_to_response=videos,external_ids`
    );
    if (fallbackRes.ok) {
      return await fallbackRes.json();
    }
    throw new Error(`Gagal memuat detail film ID ${tmdbId}`);
  }

  const data = await res.json();

  // If overview is empty in Indonesian, fetch English overview
  if (!data.overview || data.overview.trim().length === 0) {
    try {
      const enRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=en-US`);
      if (enRes.ok) {
        const enData = await enRes.json();
        if (enData.overview) {
          data.overview = enData.overview;
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  return data;
}

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

// Convert TMDB movie details directly to application's Movie entity
export function convertTmdbDetailsToMovie(tmdbDetail: any, customConfig?: ApiIntegrationConfig): Movie {
  const config = customConfig || getApiConfig();
  const tmdbId = tmdbDetail.id;
  const imdbId = tmdbDetail.external_ids?.imdb_id || tmdbDetail.imdb_id || '';
  
  // Extract Trailer URL if available
  let trailerUrl = '';
  if (tmdbDetail.videos?.results && Array.isArray(tmdbDetail.videos.results)) {
    const officialTrailer = tmdbDetail.videos.results.find(
      (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    ) || tmdbDetail.videos.results.find((v: any) => v.site === 'YouTube');
    if (officialTrailer) {
      trailerUrl = `https://www.youtube-nocookie.com/embed/${officialTrailer.key}`;
    }
  }

  // Generate multi-servers
  const servers = generateMovieServers(tmdbId, imdbId, config.customEmbedTemplate);
  
  // Determine primary embed URL
  const primaryServer = servers[0] || { url: `https://vidsrc.xyz/embed/movie/${tmdbId}` };
  const embedCode = createEmbedHtml(primaryServer.url, tmdbDetail.title);

  // Genres
  let genres: string[] = [];
  if (tmdbDetail.genres && Array.isArray(tmdbDetail.genres)) {
    genres = tmdbDetail.genres.map((g: any) => g.name);
  } else if (tmdbDetail.genre_ids) {
    genres = mapGenreIdsToNames(tmdbDetail.genre_ids);
  }
  if (genres.length === 0) genres = ['Action', 'Drama'];

  // Quality rating
  const vote = Number(tmdbDetail.vote_average) || 7.5;
  const quality = vote >= 7.8 ? '4K' : vote >= 6.5 ? 'FHD' : 'HD';

  // Duration
  const runtime = Number(tmdbDetail.runtime) || 115;
  const duration = `${runtime} menit`;

  // Year
  const year = tmdbDetail.release_date
    ? new Date(tmdbDetail.release_date).getFullYear()
    : new Date().getFullYear();

  const title = tmdbDetail.title || tmdbDetail.original_title || 'Film Tanpa Judul';
  const slug = `${generateSlug(title)}-${year}`;

  // Extract country from TMDB metadata (production_countries, origin_country, or original_language)
  let rawCountry = '';
  if (tmdbDetail.production_countries && Array.isArray(tmdbDetail.production_countries) && tmdbDetail.production_countries.length > 0) {
    rawCountry = tmdbDetail.production_countries[0].iso_3166_1 || tmdbDetail.production_countries[0].name || '';
  } else if (tmdbDetail.origin_country && Array.isArray(tmdbDetail.origin_country) && tmdbDetail.origin_country.length > 0) {
    rawCountry = tmdbDetail.origin_country[0];
  } else if (tmdbDetail.original_language) {
    rawCountry = tmdbDetail.original_language;
  }
  const countryInfo = findCountryInfo(rawCountry);

  return {
    id: generateUUID(),
    title,
    slug,
    thumbnail: getTmdbImageUrl(tmdbDetail.poster_path, 'w500'),
    backdrop: getTmdbImageUrl(tmdbDetail.backdrop_path, 'original'),
    embed_code: embedCode,
    synopsis: tmdbDetail.overview || 'Sinopsis belum tersedia untuk film ini.',
    genres,
    country: countryInfo.name,
    country_code: countryInfo.code,
    rating: parseFloat(vote.toFixed(1)),
    year,
    duration,
    quality: quality as any,
    views: Math.floor(Math.random() * 450) + 120,
    tmdb_id: tmdbId,
    imdb_id: imdbId,
    trailer_url: trailerUrl,
    servers,
    created_at: new Date().toISOString(),
  };
}

// Automatically fetch real live movies from TMDB API (Trending, Popular & Indonesian)
export async function fetchRealLiveMoviesFromApi(limit = 24): Promise<Movie[]> {
  const apiKey = getActiveTmdbKey();
  const config = getApiConfig();
  const lang = config.tmdbLanguage || 'id-ID';

  const results: any[] = [];
  const seenIds = new Set<number>();

  try {
    // 1. Fetch trending day
    const trendingRes = await fetch(
      `https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}&language=${lang}&page=1`
    ).catch(() => null);
    if (trendingRes && trendingRes.ok) {
      const data = await trendingRes.json();
      if (Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item && item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            results.push(item);
          }
        }
      }
    }

    // 2. Fetch popular movies
    const popularRes = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${lang}&page=1`
    ).catch(() => null);
    if (popularRes && popularRes.ok) {
      const data = await popularRes.json();
      if (Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item && item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            results.push(item);
          }
        }
      }
    }

    // 3. Fetch popular Indonesian movies
    const indoRes = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_original_language=id&sort_by=popularity.desc&language=${lang}&page=1`
    ).catch(() => null);
    if (indoRes && indoRes.ok) {
      const data = await indoRes.json();
      if (Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item && item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            results.push(item);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching live movies from TMDB:', err);
  }

  if (results.length === 0) {
    return [];
  }

  // Convert TMDB results into rich Movie objects
  const targetResults = results.slice(0, limit);
  const movies: Movie[] = [];

  for (const item of targetResults) {
    try {
      const movie = convertTmdbDetailsToMovie(item, config);
      movies.push(movie);
    } catch {
      // ignore item error
    }
  }

  return movies;
}
