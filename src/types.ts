export interface MovieServer {
  id: string;
  name: string;
  url: string;
  quality?: string;
  isDefault?: boolean;
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  embed_code: string;
  backdrop?: string;
  synopsis?: string;
  genres?: string[];
  rating?: number;
  year?: number;
  duration?: string;
  views?: number;
  quality?: '4K' | 'FHD' | 'HD' | 'CAM';
  country?: string;
  country_code?: string;
  tmdb_id?: number | string;
  imdb_id?: string;
  trailer_url?: string;
  servers?: MovieServer[];
  created_at: string;
}

export interface AdConfig {
  bannerTopEnabled: boolean;
  bannerBottomEnabled: boolean;
  popunderEnabled: boolean;
  bannerTopCode: string;
  bannerBottomCode: string;
  popunderUrl: string;
  adsterraDirectLink: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export interface CustomMovieProvider {
  id: string;
  name: string;
  badge?: string;
  description?: string;
  template: string;
  apiKey?: string;
  enabled: boolean;
}

export interface MovieApiKeyItem {
  id: string;
  providerName: string;
  keyName: string;
  keyValue: string;
  endpointUrl?: string;
  enabled: boolean;
}

export interface ApiIntegrationConfig {
  tmdbApiKey: string;
  tmdbLanguage: 'id-ID' | 'en-US';
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

export interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  channelId?: string;
  publishedAt: string;
  isLive?: boolean;
  viewCount?: string;
  duration?: string;
  embedUrl: string;
}

export interface LiveChannel {
  id: string;
  name: string;
  category: string;
  categoryLabel?: string;
  logo: string;
  videoId?: string;
  channelId?: string;
  embedUrl: string;
  description: string;
  isOnline?: boolean;
  country: string;
  viewers?: string;
}

export interface TmdbMovieResult {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  imdb_id?: string;
}

export type ViewMode = 'catalog' | 'watch' | 'livestream' | 'youtube' | 'admin' | 'database';

