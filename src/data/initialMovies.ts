import { Movie, AdConfig } from '../types';

export const APP_LOGO_URL = 'https://external-preview.redd.it/am-i-the-only-one-hoping-to-see-this-logo-at-some-point-v0-GgIm5dR-zw4qK_0a3qQTDu1o4w68NmbyEc_kiVU5wIs.jpg?width=640&crop=smart&auto=webp&s=a53733319e45fbbdc7f89651ead87999a53c6c67';

// No mock data - all movies are fetched dynamically from real TMDB API and live streaming providers
export const INITIAL_MOVIES: Movie[] = [];

export const DEFAULT_AD_CONFIG: AdConfig = {
  bannerTopEnabled: true,
  bannerBottomEnabled: true,
  popunderEnabled: false,
  bannerTopCode: '<div class="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/30 rounded-xl text-amber-200 text-xs sm:text-sm font-medium"><div class="flex items-center gap-3"><span class="px-2 py-0.5 bg-amber-500 text-black font-bold rounded text-xs uppercase tracking-wide">Sponsored</span><span>⚡ Nikmati streaming kecepatan tinggi tanpa buffering & unduh film favoritmu!</span></div><a href="https://example.com/adsterra-sponsor" target="_blank" rel="noopener noreferrer" class="shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition">Klaim Promo</a></div>',
  bannerBottomCode: '<div class="p-3 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400"><span class="text-red-400 font-semibold">[Adsterra Native Ad]</span> Pasang aplikasi mobile resmi untuk tontonan offline tanpa kuota! <a href="#" class="underline text-red-400 hover:text-red-300 ml-1">Download APK</a></div>',
  popunderUrl: 'https://example.com/adsterra-popunder',
  adsterraDirectLink: 'https://example.com/direct-link',
};

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
`;
