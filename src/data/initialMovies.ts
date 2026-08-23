import { Movie, AdConfig } from '../types';

export const INITIAL_MOVIES: Movie[] = [
  {
    id: '1',
    title: 'Spider-Man: Across the Spider-Verse',
    slug: 'spider-man-across-the-spider-verse-2023',
    thumbnail: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=800&auto=format&fit=crop',
    embed_code: '<iframe class="w-full h-full rounded-xl" src="https://www.youtube.com/embed/cqGjhVJWtEg?autoplay=0&rel=0" title="Spider-Man: Across the Spider-Verse" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
    synopsis: 'Miles Morales terlempar melintasi Multiverse, di mana ia bertemu dengan tim Spider-People yang bertugas melindungi keberadaannya. Namun, ketika para pahlawan bentrok tentang cara menangani ancaman baru, Miles harus mendefinisikan ulang apa artinya menjadi seorang pahlawan.',
    genres: ['Action', 'Animation', 'Sci-Fi'],
    rating: 8.7,
    year: 2023,
    duration: '2j 20m',
    views: 14250,
    quality: '4K',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '2',
    title: 'Dune: Part Two',
    slug: 'dune-part-two-2024',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    embed_code: '<iframe class="w-full h-full rounded-xl" src="https://www.youtube.com/embed/Way9Dexny3w?autoplay=0&rel=0" title="Dune: Part Two" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
    synopsis: 'Paul Atreides bersatu dengan Chani dan suku Fremen saat membalas dendam terhadap para konspirator yang menghancurkan keluarganya. Menghadapi pilihan antara cinta dalam hidupnya dan nasib alam semesta.',
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    rating: 8.6,
    year: 2024,
    duration: '2j 46m',
    views: 28910,
    quality: '4K',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: '3',
    title: 'Oppenheimer',
    slug: 'oppenheimer-2023',
    thumbnail: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800&auto=format&fit=crop',
    embed_code: '<iframe class="w-full h-full rounded-xl" src="https://www.youtube.com/embed/uYPbbksJxIg?autoplay=0&rel=0" title="Oppenheimer" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
    synopsis: 'Kisah fisikawan teoretis Amerika J. Robert Oppenheimer, yang memimpin Proyek Manhattan untuk mengembangkan bom atom pertama di dunia selama Perang Dunia II.',
    genres: ['Biography', 'Drama', 'History'],
    rating: 8.9,
    year: 2023,
    duration: '3j 00m',
    views: 35120,
    quality: '4K',
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: '4',
    title: 'The Batman',
    slug: 'the-batman-2022',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    embed_code: '<iframe class="w-full h-full rounded-xl" src="https://www.youtube.com/embed/mqqft2x_Aa4?autoplay=0&rel=0" title="The Batman" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
    synopsis: 'Ketika Riddler, seorang pembunuh berantai yang sadis, mulai membunuh tokoh-tokoh politik penting di Gotham, Batman terpaksa menyelidiki korupsi tersembunyi di kota itu.',
    genres: ['Action', 'Crime', 'Mystery'],
    rating: 7.9,
    year: 2022,
    duration: '2j 56m',
    views: 19800,
    quality: 'FHD',
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: '5',
    title: 'Pengabdi Setan 2: Communion',
    slug: 'pengabdi-setan-2-communion-2022',
    thumbnail: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800&auto=format&fit=crop',
    embed_code: '<iframe class="w-full h-full rounded-xl" src="https://www.youtube.com/embed/s3k79PZg6oU?autoplay=0&rel=0" title="Pengabdi Setan 2" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
    synopsis: 'Beberapa tahun setelah berhasil menyelamatkan diri dari kejadian mengerikan yang membuat mereka kehilangan ibu, Rini dan adik-adiknya tinggal di rumah susun yang menyimpan rahasia kelam masa lalu.',
    genres: ['Horror', 'Mystery', 'Thriller'],
    rating: 7.4,
    year: 2022,
    duration: '1j 59m',
    views: 42300,
    quality: 'HD',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: '6',
    title: 'Interstellar',
    slug: 'interstellar-2014',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    embed_code: '<iframe class="w-full h-full rounded-xl" src="https://www.youtube.com/embed/zSWdZVtXT7E?autoplay=0&rel=0" title="Interstellar" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
    synopsis: 'Ketika Bumi menjadi tidak dapat dihuni di masa depan, seorang mantan pilot NASA bernama Cooper bersama tim ilmuwan melakukan perjalanan melintasi lubang cacing di luar angkasa untuk menemukan planet baru.',
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    rating: 8.7,
    year: 2014,
    duration: '2j 49m',
    views: 65400,
    quality: '4K',
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: '7',
    title: 'Avatar: The Way of Water',
    slug: 'avatar-the-way-of-water-2022',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    embed_code: '<iframe class="w-full h-full rounded-xl" src="https://www.youtube.com/embed/d9MyW72ELq0?autoplay=0&rel=0" title="Avatar: The Way of Water" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
    synopsis: 'Jake Sully hidup bersama keluarga barunya di planet Pandora. Ketika ancaman lama kembali untuk menyelesaikan apa yang dimulai, Jake harus bekerja sama dengan Neytiri dan pasukan ras Na\'vi untuk melindungi rumah mereka.',
    genres: ['Action', 'Adventure', 'Fantasy'],
    rating: 7.6,
    year: 2022,
    duration: '3j 12m',
    views: 38200,
    quality: '4K',
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: '8',
    title: 'Agak Laen',
    slug: 'agak-laen-2024',
    thumbnail: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800&auto=format&fit=crop',
    embed_code: '<iframe class="w-full h-full rounded-xl" src="https://www.youtube.com/embed/b5eF2j4aD2E?autoplay=0&rel=0" title="Agak Laen" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
    synopsis: 'Empat sekawan pengelola rumah hantu di pasar malam yang sepi pengunjung berusaha merenovasi wahana mereka, hingga suatu hari seorang caleg jantungan meninggal di dalam wahana mereka dan mereka terpaksa menguburnya di sana.',
    genres: ['Comedy', 'Horror'],
    rating: 8.1,
    year: 2024,
    duration: '1j 59m',
    views: 54100,
    quality: 'FHD',
    created_at: new Date(Date.now() - 86400000 * 16).toISOString(),
  }
];

export const DEFAULT_AD_CONFIG: AdConfig = {
  bannerTopEnabled: true,
  bannerBottomEnabled: true,
  popunderEnabled: false,
  bannerTopCode: '<div class="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/30 rounded-xl text-amber-200 text-xs sm:text-sm font-medium"><div class="flex items-center gap-3"><span class="px-2 py-0.5 bg-amber-500 text-black font-bold rounded text-xs uppercase tracking-wide">Sponsored</span><span>⚡ Nikmati streaming kecepatan tinggi tanpa buffering & unduh film favoritmu!</span></div><a href="https://example.com/adsterra-sponsor" target="_blank" rel="noopener noreferrer" class="shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition">Klaim Promo</a></div>',
  bannerBottomCode: '<div class="p-3 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400"><span class="text-red-400 font-semibold">[Adsterra Native Ad]</span> Pasang aplikasi mobile resmi untuk tontonan offline tanpa kuota! <a href="#" class="underline text-red-400 hover:text-red-300 ml-1">Download APK</a></div>',
  popunderUrl: 'https://example.com/adsterra-popunder',
  adsterraDirectLink: 'https://example.com/direct-link',
};

export const SUPABASE_SQL_SCHEMA = `-- Supabase SQL Schema for Tontonan Gratis
-- Copy and paste this script into your Supabase SQL Editor and click RUN

-- 1. Create movies table
CREATE TABLE IF NOT EXISTS public.movies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  thumbnail TEXT NOT NULL,
  embed_code TEXT NOT NULL,
  synopsis TEXT,
  genres TEXT[] DEFAULT ARRAY['Action'],
  rating NUMERIC(3,1) DEFAULT 7.5,
  year INTEGER DEFAULT 2024,
  duration TEXT DEFAULT '2j 00m',
  views INTEGER DEFAULT 0,
  quality TEXT DEFAULT 'HD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow public read access to all movies
CREATE POLICY "Allow public read access" ON public.movies
  FOR SELECT USING (true);

-- 4. Policy: Allow insert for anyone or authenticated admins
CREATE POLICY "Allow public insert" ON public.movies
  FOR INSERT WITH CHECK (true);

-- 5. Policy: Allow update
CREATE POLICY "Allow public update" ON public.movies
  FOR UPDATE USING (true);

-- 6. Policy: Allow delete
CREATE POLICY "Allow public delete" ON public.movies
  FOR DELETE USING (true);
`;
