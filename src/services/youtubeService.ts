import { YouTubeVideoItem, LiveChannel, Movie } from '../types';
import { generateSlug } from './storageService';
import { findCountryInfo } from '../utils/countryHelper';

export const DEFAULT_YOUTUBE_API_KEY = 'AIzaSyDwL7xt9_C8X2QvjhSbxRVA1KqowIxa9-k';

export const LIVE_CATEGORY_QUERIES: Record<string, { query: string; label: string }> = {
  all: { query: 'live streaming indonesia | siaran langsung tv indonesia', label: 'Semua Siaran Live' },
  berita: { query: 'kompas tv live | cnn indonesia live | inews live | metro tv live', label: 'Berita Nasional 🇮🇩' },
  'tv-nasional': { query: 'tvri nasional live | tvri streaming | siaran tv indonesia live', label: 'TV Nasional' },
  anime: { query: 'muse asia live anime | ani-one live stream | anime 24/7 stream', label: 'Anime 24/7' },
  musik: { query: 'lofi hip hop radio live | lofi girl live | relax beats 24/7 stream', label: 'Musik & Lofi 24/7' },
  cinema: { query: 'live movie stream 24/7 | film bioskop streaming live', label: 'Bioskop & Film Live' },
  event: { query: 'live event streaming indonesia | esports tournament live indonesia', label: 'Live Event & Gaming' },
};

/**
 * Convert YouTube video item into LiveChannel
 */
export function convertYouTubeItemToLiveChannel(item: YouTubeVideoItem, category = 'all'): LiveChannel {
  const titleLower = item.title.toLowerCase();
  const chanLower = item.channelTitle.toLowerCase();
  const isIndo = titleLower.includes('indonesia') || chanLower.includes('indonesia') || chanLower.includes('tv') || titleLower.includes('berita');

  return {
    id: `yt-live-${item.id}`,
    name: item.title,
    category: category,
    categoryLabel: item.channelTitle || 'YouTube Live',
    logo: item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
    videoId: item.id,
    channelId: item.channelId,
    embedUrl: getYouTubeEmbedUrl(item.id, true),
    description: item.description || `Siaran langsung dari ${item.channelTitle}. Tonton live streaming real-time gratis.`,
    isOnline: true,
    country: isIndo ? 'Indonesia' : 'Global',
    viewers: 'LIVE',
  };
}

/**
 * Fetch genuine YouTube live streams for a selected topic or query
 */
export async function fetchLiveStreamsFromYouTube(options: {
  category?: string;
  customQuery?: string;
  apiKey?: string;
  maxResults?: number;
}): Promise<LiveChannel[]> {
  const { category = 'all', customQuery, apiKey, maxResults = 12 } = options;
  const targetCategoryInfo = LIVE_CATEGORY_QUERIES[category] || LIVE_CATEGORY_QUERIES.all;
  const q = customQuery && customQuery.trim() ? customQuery.trim() : targetCategoryInfo.query;

  const result = await searchYouTube({
    query: q,
    isLive: true,
    apiKey,
    maxResults,
  });

  return result.items.map((item) => convertYouTubeItemToLiveChannel(item, category));
}

/**
 * Extract YouTube Video ID from any YouTube URL or text string
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already standard 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle standard youtube URLs: youtube.com/watch?v=XXX or youtu.be/XXX or youtube.com/embed/XXX or /live/XXX
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

/**
 * Clean & format YouTube embed URL
 */
export function getYouTubeEmbedUrl(videoId: string, autoplay = true): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&enablejsapi=1`;
}

export interface SearchYouTubeOptions {
  query: string;
  isLive?: boolean;
  isMovie?: boolean;
  maxResults?: number;
  pageToken?: string;
  apiKey?: string;
}

/**
 * Search YouTube Real-Time Engine (Zero Admin Config required, direct YouTube search)
 */
export async function searchYouTube(options: SearchYouTubeOptions): Promise<{
  items: YouTubeVideoItem[];
  nextPageToken?: string;
  totalResults?: number;
}> {
  const {
    query,
    isLive = false,
    isMovie = false,
    maxResults = 16,
    apiKey,
  } = options;

  let searchQuery = query.trim();
  if (!searchQuery) {
    searchQuery = isLive ? 'live streaming indonesia' : isMovie ? 'film indonesia full movie' : 'film bioskop full movie';
  } else if (isMovie && !searchQuery.toLowerCase().includes('full movie') && !searchQuery.toLowerCase().includes('film') && !searchQuery.toLowerCase().includes('movie')) {
    searchQuery = `${searchQuery} full movie`;
  }

  // Call our Backend Real-Time YouTube Proxy (/api/youtube/search)
  try {
    const proxyParams = new URLSearchParams({
      q: searchQuery,
      isLive: isLive ? 'true' : 'false',
      isMovie: isMovie ? 'true' : 'false',
      maxResults: String(maxResults),
    });

    if (apiKey && apiKey.trim()) {
      proxyParams.set('apiKey', apiKey.trim());
    }

    const proxyRes = await fetch(`/api/youtube/search?${proxyParams.toString()}`);
    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      if (proxyData.items && Array.isArray(proxyData.items)) {
        const items: YouTubeVideoItem[] = proxyData.items.map((item: any) => ({
          id: item.id,
          title: item.title || 'YouTube Video',
          description: item.description || '',
          thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
          channelTitle: item.channelTitle || 'YouTube Channel',
          channelId: item.channelId,
          publishedAt: item.publishedAt || 'Terbaru',
          viewCount: item.viewCount || '',
          isLive: Boolean(item.isLive || isLive),
          embedUrl: item.embedUrl || getYouTubeEmbedUrl(item.id, false),
        }));

        return {
          items,
          totalResults: proxyData.totalResults || items.length,
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Backend proxy YouTube call failed:', proxyErr);
  }

  // Fallback to Curated Live / Movies if network fails
  const fallbackItems = getEmergencyCuratedVideos(searchQuery, isLive);
  return {
    items: fallbackItems,
    totalResults: fallbackItems.length,
  };
}

function getEmergencyCuratedVideos(query: string, isLive: boolean): YouTubeVideoItem[] {
  if (isLive) {
    return [
      {
        id: 'rQJoEpzKkNk',
        title: '🔴 Live Streaming tvOne 24 Jam Nonstop',
        description: 'Siaran berita langsung terkini dan terhangat dari Indonesia.',
        thumbnail: 'https://i.ytimg.com/vi/rQJoEpzKkNk/hqdefault.jpg',
        channelTitle: 'tvOneNews',
        publishedAt: 'Live Sekarang',
        duration: 'LIVE',
        viewCount: '19.4K menonton',
        isLive: true,
        embedUrl: getYouTubeEmbedUrl('rQJoEpzKkNk', false),
      },
      {
        id: 'jfKfPfyJRdk',
        title: '🔴 Lofi Girl - Beats to relax/study to 24/7 Live Music',
        description: 'Peaceful lofi hip hop radio stream running 24/7 worldwide.',
        thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
        channelTitle: 'Lofi Girl',
        publishedAt: 'Live Sekarang',
        duration: 'LIVE',
        viewCount: '26.8K menonton',
        isLive: true,
        embedUrl: getYouTubeEmbedUrl('jfKfPfyJRdk', false),
      },
      {
        id: '21X5lGlDOfg',
        title: '🔴 NASA Live: Official Earth Views from Space Station (ISS)',
        description: 'Live views of Earth from the International Space Station.',
        thumbnail: 'https://i.ytimg.com/vi/21X5lGlDOfg/hqdefault.jpg',
        channelTitle: 'NASA',
        publishedAt: 'Live Sekarang',
        duration: 'LIVE',
        viewCount: '14.2K menonton',
        isLive: true,
        embedUrl: getYouTubeEmbedUrl('21X5lGlDOfg', false),
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
      embedUrl: getYouTubeEmbedUrl('Y1g8FrAzsn4', false),
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
      embedUrl: getYouTubeEmbedUrl('16cnRtZK3Bc', false),
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
      embedUrl: getYouTubeEmbedUrl('IvEtWGhGl2g', false),
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
      embedUrl: getYouTubeEmbedUrl('8lLQimyKBA0', false),
    },
  ];
}

/**
 * Convert a YouTube video into a catalog Movie ready to store in Supabase
 */
export function convertYouTubeToMovie(video: YouTubeVideoItem): Movie {
  const cleanTitle = video.title.replace(/[\(\[\{].*?[\)\]\}]/g, '').trim() || video.title;
  const currentYear = new Date(video.publishedAt).getFullYear() || new Date().getFullYear();
  const slug = `${generateSlug(cleanTitle)}-yt-${video.id.slice(0, 6)}`;

  const countryInfo = findCountryInfo(
    video.title.toLowerCase().includes('indonesia') || video.title.toLowerCase().includes('drakor')
      ? video.title.toLowerCase().includes('drakor')
        ? 'KR'
        : 'ID'
      : 'US'
  );

  const embedCode = `<iframe src="${video.embedUrl}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="w-full h-full rounded-xl"></iframe>`;

  return {
    id: `yt-${video.id}`,
    title: video.title,
    slug,
    thumbnail: video.thumbnail,
    backdrop: video.thumbnail,
    embed_code: embedCode,
    synopsis: video.description || `Film & Tayangan "${video.title}" dari channel ${video.channelTitle}. Tonton streaming gratis tanpa buffering.`,
    genres: ['YouTube', video.isLive ? 'Live Stream' : 'Full Movie'],
    rating: 8.5,
    year: currentYear,
    duration: video.isLive ? 'LIVE' : 'Full HD',
    quality: 'FHD',
    country: countryInfo.name,
    country_code: countryInfo.code,
    trailer_url: `https://www.youtube.com/watch?v=${video.id}`,
    created_at: new Date().toISOString(),
    servers: [
      {
        id: 'yt-main',
        name: 'YouTube HD (Resmi)',
        url: video.embedUrl,
        quality: '1080p FHD',
        isDefault: true,
      },
    ],
  };
}

