export interface Movie {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  embed_code: string;
  synopsis?: string;
  genres?: string[];
  rating?: number;
  year?: number;
  duration?: string;
  views?: number;
  quality?: '4K' | 'FHD' | 'HD' | 'CAM';
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

export type ViewMode = 'catalog' | 'watch' | 'admin' | 'database';
