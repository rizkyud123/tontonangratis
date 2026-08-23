/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Movie,
  ViewMode,
  SupabaseConfig,
  AdConfig,
} from './types';
import {
  fetchAllMovies,
  saveMovie,
  deleteMovieById,
  incrementMovieViews,
  getSupabaseConfig,
  saveSupabaseConfig,
  getAdConfig,
  saveAdConfig,
} from './services/storageService';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MovieCard } from './components/MovieCard';
import { WatchView } from './components/WatchView';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Toast } from './components/Toast';
import {
  Film,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  Layers,
  Heart,
  Globe,
  Share2,
  Flame,
  Clock,
  Lock,
} from 'lucide-react';

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('catalog');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [activeFilter, setActiveFilter] = useState<'all' | 'popular' | 'latest' | 'top-rated'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin authentication state (PIN 070600)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('tontonan_gratis_admin_auth') === 'true' || sessionStorage.getItem('streamflix_admin_auth') === 'true';
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(getSupabaseConfig());
  const [adConfig, setAdConfigState] = useState<AdConfig>(getAdConfig());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Load initial movies & detect query param ?slug=
  useEffect(() => {
    async function init() {
      setLoading(true);
      const data = await fetchAllMovies();
      setMovies(data);

      const params = new URLSearchParams(window.location.search);
      const slugFromUrl = params.get('slug');
      if (slugFromUrl) {
        setActiveSlug(slugFromUrl);
        setCurrentView('watch');
      }
      setLoading(false);
    }
    init();
  }, []);

  // Sync URL when active slug / view changes
  const handleWatchMovie = (slug: string) => {
    setActiveSlug(slug);
    setCurrentView('watch');
    const newUrl = `${window.location.pathname}?slug=${slug}`;
    window.history.pushState({ slug }, '', newUrl);
  };

  const handleNavigate = (view: ViewMode) => {
    if ((view === 'admin' || view === 'database') && !isAdminAuthenticated) {
      setIsAdminLoginModalOpen(true);
      return;
    }
    setCurrentView(view);
    if (view === 'catalog') {
      setActiveSlug(null);
      window.history.pushState({}, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestAdminLogin = () => {
    if (isAdminAuthenticated) {
      if (currentView === 'admin' || currentView === 'database') {
        setCurrentView('catalog');
      } else {
        setCurrentView('admin');
      }
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('tontonan_gratis_admin_auth', 'true');
    setCurrentView('admin');
    showToast('Akses Admin Terbuka! Selamat datang.');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('tontonan_gratis_admin_auth');
    sessionStorage.removeItem('streamflix_admin_auth');
    if (currentView === 'admin' || currentView === 'database') {
      setCurrentView('catalog');
    }
    showToast('Mode Admin telah dikunci.');
  };

  const handleSaveMovie = async (
    movieData: Omit<Movie, 'id' | 'created_at'> & { id?: string }
  ) => {
    const saved = await saveMovie(movieData);
    const updated = await fetchAllMovies();
    setMovies(updated);
  };

  const handleDeleteMovie = async (id: string) => {
    await deleteMovieById(id);
    const updated = await fetchAllMovies();
    setMovies(updated);
  };

  const handleIncrementViews = async (id: string) => {
    await incrementMovieViews(id);
  };

  const handleSaveSupabaseConfig = (cfg: SupabaseConfig) => {
    saveSupabaseConfig(cfg);
    setSupabaseConfigState(cfg);
  };

  const handleSaveAdConfig = (cfg: AdConfig) => {
    saveAdConfig(cfg);
    setAdConfigState(cfg);
  };

  // Extract all distinct genres
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => {
      m.genres?.forEach((g) => set.add(g));
    });
    return Array.from(set);
  }, [movies]);

  // Filtered and sorted movies in catalog
  const filteredMovies = useMemo(() => {
    let list = movies.filter((m) => {
      const matchSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGenre =
        selectedGenre === 'All' || (m.genres && m.genres.includes(selectedGenre));
      return matchSearch && matchGenre;
    });

    if (activeFilter === 'popular') {
      list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0) || (b.rating || 0) - (a.rating || 0));
    } else if (activeFilter === 'latest') {
      list = [...list].sort((a, b) => (b.year || 0) - (a.year || 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (activeFilter === 'top-rated') {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [movies, searchQuery, selectedGenre, activeFilter]);

  // Current watching movie
  const activeMovie = useMemo(() => {
    if (!activeSlug) return null;
    return movies.find((m) => m.slug === activeSlug) || null;
  }, [movies, activeSlug]);

  // Featured hero movie (highest rated or first in list)
  const heroMovie = useMemo(() => {
    if (movies.length === 0) return null;
    return [...movies].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  }, [movies]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#F9F9F9] font-sans flex flex-col selection:bg-[#E50914] selection:text-white">
      
      {/* Clean Navigation Bar with Secret 2x Click Admin Login */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedGenre={selectedGenre}
        onSelectGenre={setSelectedGenre}
        allGenres={allGenres}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        onRequestAdminLogin={handleRequestAdminLogin}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#A1A1AA] text-sm font-medium animate-pulse">
              Memuat katalog film Tontonan Gratis...
            </p>
          </div>
        ) : (
          <>
            {/* VIEW 1: WATCH VIEW */}
            {currentView === 'watch' && (
              activeMovie ? (
                <WatchView
                  movie={activeMovie}
                  allMovies={movies}
                  adConfig={adConfig}
                  onBack={() => handleNavigate('catalog')}
                  onSelectMovie={handleWatchMovie}
                  onIncrementViews={handleIncrementViews}
                  showToast={showToast}
                />
              ) : (
                <div className="max-w-xl mx-auto px-4 py-20 text-center">
                  <Film className="w-16 h-16 text-[#52525B] mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-[#F9F9F9] mb-2">Film Tidak Ditemukan</h2>
                  <p className="text-[#A1A1AA] text-sm mb-6">
                    Film dengan tautan/slug tersebut tidak tersedia atau sudah dihapus.
                  </p>
                  <button
                    onClick={() => handleNavigate('catalog')}
                    className="px-6 py-2.5 rounded-xl bg-[#E50914] text-white font-bold text-sm hover:bg-[#F40612] transition shadow-lg shadow-[#E50914]/25"
                  >
                    Kembali ke Katalog
                  </button>
                </div>
              )
            )}

            {/* VIEW 2: ADMIN & DATABASE PANEL (Protected by PIN) */}
            {(currentView === 'admin' || currentView === 'database') && (
              isAdminAuthenticated ? (
                <AdminPanel
                  movies={movies}
                  supabaseConfig={supabaseConfig}
                  adConfig={adConfig}
                  onSaveMovie={handleSaveMovie}
                  onDeleteMovie={handleDeleteMovie}
                  onSaveSupabaseConfig={handleSaveSupabaseConfig}
                  onSaveAdConfig={handleSaveAdConfig}
                  onWatchMovie={handleWatchMovie}
                  showToast={showToast}
                  onClose={() => handleNavigate('catalog')}
                  onLogout={handleAdminLogout}
                />
              ) : (
                <div className="max-w-md mx-auto px-4 py-24 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-[#F9F9F9] mb-2">Akses Terkunci</h2>
                  <p className="text-xs text-[#A1A1AA] mb-6">
                    Halaman ini dikhususkan untuk pengelola website. Masukkan PIN keamanan untuk melanjutkan.
                  </p>
                  <button
                    onClick={() => setIsAdminLoginModalOpen(true)}
                    className="px-6 py-2.5 rounded-xl bg-[#E50914] text-white font-bold text-xs hover:bg-[#F40612] transition shadow-lg shadow-[#E50914]/25"
                  >
                    Buka Login PIN
                  </button>
                </div>
              )
            )}

            {/* VIEW 3: CATALOG & HOMEPAGE */}
            {currentView === 'catalog' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                
                {/* Hero Banner (Only when not actively searching) */}
                {!searchQuery && selectedGenre === 'All' && activeFilter === 'all' && heroMovie && (
                  <HeroBanner
                    movie={heroMovie}
                    onWatch={handleWatchMovie}
                    onShare={(m) => {
                      const url = `${window.location.origin}${window.location.pathname}?slug=${m.slug}`;
                      navigator.clipboard.writeText(url);
                      showToast(`Shortlink "${m.title}" berhasil disalin!`);
                    }}
                  />
                )}

                {/* Catalog Header & Count */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-6 bg-[#E50914] rounded-full" />
                    <h2 className="text-lg sm:text-xl font-bold text-[#F9F9F9] flex items-center gap-2">
                      <span>
                        {searchQuery
                          ? `Hasil Pencarian: "${searchQuery}"`
                          : selectedGenre !== 'All'
                          ? `Genre: ${selectedGenre}`
                          : activeFilter === 'popular'
                          ? '🔥 Film Paling Populer & Trending'
                          : activeFilter === 'latest'
                          ? '⚡ Rilisan Film Terbaru'
                          : 'Daftar Film & Serial'}
                      </span>
                    </h2>
                  </div>
                  <span className="text-xs sm:text-sm text-[#8E8E93] font-medium">
                    {filteredMovies.length} Film Ditampilkan
                  </span>
                </div>

                {/* Movie Grid */}
                {filteredMovies.length === 0 ? (
                  <div className="py-20 text-center bg-[#0B0B10] border border-[#1C1C26] rounded-2xl p-8">
                    <Film className="w-12 h-12 text-[#52525B] mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-[#F9F9F9] mb-1">Tidak Ada Film Yang Cocok</h3>
                    <p className="text-[#A1A1AA] text-xs sm:text-sm mb-4">
                      Coba cari dengan kata kunci lain atau pilih genre/kategori yang berbeda.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedGenre('All');
                        setActiveFilter('all');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#14141C] hover:bg-[#1C1C26] border border-[#22222C] text-[#F9F9F9] text-xs font-semibold transition"
                    >
                      Reset Semua Filter
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                    {filteredMovies.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onWatch={handleWatchMovie}
                        onQuickShare={(m) => {
                          showToast(`Shortlink "${m.title}" berhasil disalin!`);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Features & Benefits Bar */}
                <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 border-t border-[#181822]">
                  <div className="p-5 rounded-2xl bg-[#0B0B10] border border-[#1C1C26] flex items-start gap-3.5 shadow-lg">
                    <div className="p-2.5 rounded-xl bg-[#E50914]/15 text-[#E50914] shrink-0 border border-[#E50914]/25">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#F9F9F9] mb-1">Streaming Cepat & Ringan</h4>
                      <p className="text-xs text-[#A1A1AA]">
                        Player video responsif mendukung embed Youtube, CDN, dan server eksternal tanpa jeda.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0B0B10] border border-[#1C1C26] flex items-start gap-3.5 shadow-lg">
                    <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 shrink-0 border border-amber-500/25">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#F9F9F9] mb-1">Shortlink & Social Share</h4>
                      <p className="text-xs text-[#A1A1AA]">
                        Bagikan film instan ke WhatsApp, FB, dan Twitter dengan slug otomatis.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0B0B10] border border-[#1C1C26] flex items-start gap-3.5 shadow-lg">
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0 border border-emerald-500/25">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#F9F9F9] mb-1">Koleksi Terupdate</h4>
                      <p className="text-xs text-[#A1A1AA]">
                        Daftar tontonan film favorit dengan resolusi tinggi dan navigasi kategori lengkap.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#181822] bg-[#07070B] py-10 text-[#8E8E93] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-[#E50914] flex items-center gap-1">TONTONAN<span className="text-[#F9F9F9]">GRATIS</span></span>
            <span className="text-[#2A2A38]">|</span>
            <span>Nonton Film Gratis &copy; {new Date().getFullYear()}</span>
          </div>

          {/* Clean Public Navigation in Footer */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[#A1A1AA]">
            <button
              onClick={() => {
                handleNavigate('catalog');
                setSelectedGenre('All');
                setActiveFilter('all');
              }}
              className="hover:text-[#F9F9F9] transition"
            >
              Beranda
            </button>
            <button
              onClick={() => {
                handleNavigate('catalog');
                setSelectedGenre('All');
              }}
              className="hover:text-[#F9F9F9] transition"
            >
              Katalog Lengkap
            </button>
            <button
              onClick={() => {
                handleNavigate('catalog');
                setActiveFilter('popular');
              }}
              className="hover:text-[#F9F9F9] transition"
            >
              Film Populer
            </button>
            <button
              onClick={() => {
                handleNavigate('catalog');
                setActiveFilter('latest');
              }}
              className="hover:text-[#F9F9F9] transition"
            >
              Film Terbaru
            </button>
            {isAdminAuthenticated && (
              <button
                onClick={() => handleNavigate('admin')}
                className="text-[#E50914] font-semibold hover:underline"
              >
                Admin Panel (Aktif)
              </button>
            )}
          </div>

          <p className="text-[#71717A] text-[11px] text-center md:text-right">
            Disusun dengan UI Modern Gelap &bull; Klik 2x logo untuk kelola website
          </p>
        </div>
      </footer>

      {/* Secret Admin PIN Login Modal (PIN: 070600) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Toast Feedback */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
