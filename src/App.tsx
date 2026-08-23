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
  ApiIntegrationConfig,
} from './types';
import {
  fetchAllMovies,
  saveMovie,
  deleteMovieById,
  incrementMovieViews,
  getSupabaseConfig,
  saveSupabaseConfig,
  getAdConfig,
  fetchAdConfig,
  saveAdConfig,
  getApiConfig,
  fetchApiConfig,
  saveApiConfig,
  bulkSaveMovies,
  fetchAllSettings,
  triggerSupabaseSync,
  subscribeToSupabaseRealtime,
} from './services/storageService';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MovieCard } from './components/MovieCard';
import { WatchView } from './components/WatchView';
import { LiveStreamView } from './components/LiveStreamView';
import { YouTubeSearchView } from './components/YouTubeSearchView';
import { AdBannerSlot } from './components/AdBannerSlot';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ShareModal, ShareData } from './components/ShareModal';
import { Toast } from './components/Toast';
import { APP_LOGO_URL } from './data/initialMovies';
import { updateDocumentMeta } from './utils/metaHelper';
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
  X,
  Radio,
  Youtube,
} from 'lucide-react';
import {
  getMovieCountry,
  getAvailableCountries,
  findCountryInfo,
} from './utils/countryHelper';

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('catalog');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [activeFilter, setActiveFilter] = useState<'all' | 'popular' | 'latest' | 'top-rated'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin authentication state (PIN 070600)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('tontonan_gratis_admin_auth') === 'true' || sessionStorage.getItem('streamflix_admin_auth') === 'true';
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(getSupabaseConfig());
  const [adConfig, setAdConfigState] = useState<AdConfig>(getAdConfig());
  const [apiConfig, setApiConfigState] = useState<ApiIntegrationConfig>(getApiConfig());

  // Social Media Share Modal with Thumbnail State
  const [shareModalData, setShareModalData] = useState<ShareData | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleOpenShareModal = (data: Movie | ShareData) => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://tontonangratis.app';
    if ('slug' in data && 'id' in data) {
      const m = data as Movie;
      setShareModalData({
        title: m.title,
        thumbnail: m.thumbnail,
        backdrop: m.backdrop,
        synopsis: m.synopsis,
        slug: m.slug,
        url: `${currentOrigin}/?slug=${m.slug}`,
        rating: m.rating,
        year: m.year,
        quality: m.quality,
        genres: m.genres,
      });
    } else {
      setShareModalData(data as ShareData);
    }
    setIsShareModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Load initial movies & settings directly from Database API & Supabase
  useEffect(() => {
    let isMounted = true;
    let unsubscribeSupabase: (() => void) | null = null;

    async function init() {
      setLoading(true);
      try {
        // 1. Fetch settings first from server database to populate API keys & Supabase config
        const settings = await fetchAllSettings();
        if (isMounted && settings) {
          if (settings.supabaseConfig) setSupabaseConfigState(settings.supabaseConfig);
          if (settings.apiConfig) setApiConfigState(settings.apiConfig);
          if (settings.adConfig) setAdConfigState(settings.adConfig);
        }

        // 2. Fetch movies directly from Database API / Supabase
        const movieData = await fetchAllMovies();
        if (isMounted && movieData && Array.isArray(movieData)) {
          setMovies(movieData);
        }

        // 3. Attach Realtime listener now that Supabase client is initialized
        if (isMounted) {
          unsubscribeSupabase = subscribeToSupabaseRealtime((updatedMovies) => {
            if (isMounted && updatedMovies && updatedMovies.length > 0) {
              setMovies(updatedMovies);
            }
          });
        }
      } catch (e) {
        console.warn('Initialization error:', e);
      }

      const params = new URLSearchParams(window.location.search);
      const slugFromUrl = params.get('slug');
      if (slugFromUrl && isMounted) {
        setActiveSlug(slugFromUrl);
        setCurrentView('watch');
      }
      if (isMounted) setLoading(false);
    }
    init();

    // Cross-Device Real-Time Auto-Sync:
    // Periodically checks server database & Supabase for updates made from other devices/computers
    const syncLatestDataSilently = async () => {
      try {
        const [remoteMovies, settings] = await Promise.all([
          fetchAllMovies(),
          fetchAllSettings(),
        ]);

        if (isMounted) {
          if (settings) {
            if (settings.supabaseConfig) {
              setSupabaseConfigState((prev) =>
                JSON.stringify(prev) !== JSON.stringify(settings.supabaseConfig) ? settings.supabaseConfig : prev
              );
            }
            if (settings.apiConfig) {
              setApiConfigState((prev) =>
                JSON.stringify(prev) !== JSON.stringify(settings.apiConfig) ? settings.apiConfig : prev
              );
            }
            if (settings.adConfig) {
              setAdConfigState((prev) =>
                JSON.stringify(prev) !== JSON.stringify(settings.adConfig) ? settings.adConfig : prev
              );
            }
          }

          if (remoteMovies && Array.isArray(remoteMovies) && remoteMovies.length > 0) {
            setMovies((prev) => {
              // Deep compare to detect any edit on any field (title, thumbnail, servers, embed_code, etc.)
              if (JSON.stringify(prev) !== JSON.stringify(remoteMovies)) {
                return remoteMovies;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // silent
      }
    };

    // Auto-poll every 4 seconds for fast cross-device updates
    const interval = setInterval(syncLatestDataSilently, 4000);

    // Sync immediately when user switches tabs, unlocks phone, or focuses window
    const handleFocus = () => {
      syncLatestDataSilently();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        syncLatestDataSilently();
      }
    });

    // Multi-tab BroadcastChannel for zero-latency local sync
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('tontonan_gratis_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'MOVIES_UPDATED' || event.data?.type === 'SETTINGS_UPDATED') {
            syncLatestDataSilently();
          }
        };
      }
    } catch (e) {
      // ignore
    }

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
      if (bc) bc.close();
      if (unsubscribeSupabase) unsubscribeSupabase();
    };
  }, []);

  const notifyBroadcastSync = (type: 'MOVIES_UPDATED' | 'SETTINGS_UPDATED' = 'MOVIES_UPDATED') => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('tontonan_gratis_sync');
        bc.postMessage({ type, timestamp: Date.now() });
        setTimeout(() => bc.close(), 500);
      }
    } catch (e) {
      // ignore
    }
  };

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
    await saveMovie(movieData);
    const updated = await fetchAllMovies();
    setMovies(updated);
    notifyBroadcastSync();
  };

  const handleBulkImportMovies = async (newMovies: Movie[]) => {
    await bulkSaveMovies(newMovies);
    const updated = await fetchAllMovies();
    setMovies(updated);
    notifyBroadcastSync();
  };

  const handleDeleteMovie = async (id: string) => {
    await deleteMovieById(id);
    const updated = await fetchAllMovies();
    setMovies(updated);
    notifyBroadcastSync();
  };

  const handleIncrementViews = async (id: string) => {
    await incrementMovieViews(id);
  };

  const handleSaveSupabaseConfig = async (cfg: SupabaseConfig) => {
    await saveSupabaseConfig(cfg);
    setSupabaseConfigState(cfg);
    // Trigger sync with Supabase and fetch updated settings
    try {
      const syncRes = await triggerSupabaseSync();
      const updatedMovies = await fetchAllMovies();
      setMovies(updatedMovies);
      notifyBroadcastSync();
      if (syncRes.message) {
        showToast(syncRes.message);
      }
    } catch (e) {
      console.warn('Sync after Supabase save:', e);
    }
  };

  const handleSaveAdConfig = async (cfg: AdConfig) => {
    await saveAdConfig(cfg);
    setAdConfigState(cfg);
    notifyBroadcastSync('SETTINGS_UPDATED');
  };

  const handleSaveApiConfig = async (cfg: ApiIntegrationConfig) => {
    await saveApiConfig(cfg);
    setApiConfigState(cfg);
    notifyBroadcastSync('SETTINGS_UPDATED');
  };

  const handleManualSupabaseSync = async () => {
    try {
      const syncRes = await triggerSupabaseSync();
      const updatedMovies = await fetchAllMovies();
      setMovies(updatedMovies);
      notifyBroadcastSync();
      showToast(syncRes.message || 'Sinkronisasi selesai!');
    } catch (e: any) {
      showToast(`Gagal sinkronisasi: ${e.message || e}`);
    }
  };

  // Extract all distinct genres
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => {
      m.genres?.forEach((g) => set.add(g));
    });
    return Array.from(set);
  }, [movies]);

  // Extract all available countries with movie count
  const availableCountries = useMemo(() => {
    return getAvailableCountries(movies);
  }, [movies]);

  // Filtered and sorted movies in catalog
  const filteredMovies = useMemo(() => {
    let list = movies.filter((m) => {
      const matchSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGenre =
        selectedGenre === 'All' || (m.genres && m.genres.includes(selectedGenre));
      
      const movieCountry = getMovieCountry(m);
      const matchCountry =
        selectedCountry === 'All' ||
        movieCountry.code.toUpperCase() === selectedCountry.toUpperCase() ||
        movieCountry.name.toLowerCase() === selectedCountry.toLowerCase() ||
        movieCountry.aliases.includes(selectedCountry.toLowerCase());

      return matchSearch && matchGenre && matchCountry;
    });

    if (activeFilter === 'popular') {
      list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0) || (b.rating || 0) - (a.rating || 0));
    } else if (activeFilter === 'latest') {
      list = [...list].sort((a, b) => (b.year || 0) - (a.year || 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (activeFilter === 'top-rated') {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [movies, searchQuery, selectedGenre, selectedCountry, activeFilter]);

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

  const activeCountryInfo = selectedCountry !== 'All' ? findCountryInfo(selectedCountry) : null;

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
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
        availableCountries={availableCountries}
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
                  onOpenShareModal={handleOpenShareModal}
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
                  apiConfig={apiConfig}
                  onSaveMovie={handleSaveMovie}
                  onBulkImportMovies={handleBulkImportMovies}
                  onDeleteMovie={handleDeleteMovie}
                  onSaveSupabaseConfig={handleSaveSupabaseConfig}
                  onSaveAdConfig={handleSaveAdConfig}
                  onSaveApiConfig={handleSaveApiConfig}
                  onSyncSupabase={handleManualSupabaseSync}
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

            {/* VIEW 3: LIVE STREAMING & TV 24/7 */}
            {currentView === 'livestream' && (
              <LiveStreamView
                adConfig={adConfig}
                showToast={showToast}
                onNavigateHome={() => handleNavigate('catalog')}
                youtubeApiKey={apiConfig.youtubeApiKey}
                onOpenShareModal={handleOpenShareModal}
              />
            )}

            {/* VIEW 4: YOUTUBE MOVIE SEARCH & IMPORT */}
            {currentView === 'youtube' && (
              <YouTubeSearchView
                onSaveMovieToCatalog={handleSaveMovie}
                onWatchMovie={handleWatchMovie}
                adConfig={adConfig}
                showToast={showToast}
                youtubeApiKey={apiConfig.youtubeApiKey}
                onOpenShareModal={handleOpenShareModal}
              />
            )}

            {/* VIEW 5: CATALOG & HOMEPAGE */}
            {currentView === 'catalog' && (
              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                
                {/* Hero Banner (Only when not actively searching and no filters active) */}
                {!searchQuery && selectedGenre === 'All' && selectedCountry === 'All' && activeFilter === 'all' && heroMovie && (
                  <HeroBanner
                    movie={heroMovie}
                    onWatch={handleWatchMovie}
                    onShare={(m) => handleOpenShareModal(m)}
                  />
                )}

                {/* ADSTERRA TOP HOMEPAGE BANNER */}
                {adConfig.bannerTopEnabled && (
                  <div className="my-4">
                    <AdBannerSlot
                      code={adConfig.bannerTopCode}
                      enabled={adConfig.bannerTopEnabled}
                      type="top"
                    />
                  </div>
                )}

                {/* Live TV & YouTube Quick Highlight Strip on Homepage */}
                {!searchQuery && selectedGenre === 'All' && selectedCountry === 'All' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => handleNavigate('livestream')}
                      className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/80 via-[#14080A] to-[#0A0A10] border border-red-800/40 hover:border-red-500 text-left transition flex items-center justify-between group shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 group-hover:scale-110 transition">
                          <Radio className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition">
                              🔴 Live Streaming & TV Nasional
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-red-600 text-[9px] font-black text-white">
                              LIVE
                            </span>
                          </div>
                          <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                            Kompas TV, CNN, Anime 24 Jam, & Musik Bebas Iklan
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-red-400 font-bold hidden xs:inline">Tonton &rarr;</span>
                    </button>

                    <button
                      onClick={() => handleNavigate('youtube')}
                      className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1A0808]/80 via-[#120D14] to-[#0A0A10] border border-rose-800/30 hover:border-red-500 text-left transition flex items-center justify-between group shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 group-hover:scale-110 transition">
                          <Youtube className="w-5 h-5 fill-red-500 text-red-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition">
                              Cari & Nonton Film di YouTube
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-[#20202E] text-[9px] font-semibold text-[#A1A1AA]">
                              HD
                            </span>
                          </div>
                          <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                            Film bioskop full movie, drakor, anime & film pendek
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-red-400 font-bold hidden xs:inline">Cari &rarr;</span>
                    </button>
                  </div>
                )}

                {/* Catalog Header & Count */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-4 sm:mb-6 pt-1 sm:pt-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="w-1 h-5 sm:h-6 bg-[#E50914] rounded-full shrink-0" />
                    <h2 className="text-base sm:text-xl font-bold text-[#F9F9F9] flex items-center gap-2 flex-wrap">
                      <span>
                        {searchQuery
                          ? `Hasil Pencarian: "${searchQuery}"`
                          : selectedCountry !== 'All' && selectedGenre !== 'All'
                          ? `${activeCountryInfo ? activeCountryInfo.flag : '🌐'} Film ${activeCountryInfo?.name} • Genre: ${selectedGenre}`
                          : selectedCountry !== 'All'
                          ? `${activeCountryInfo ? activeCountryInfo.flag : '🌐'} Film ${activeCountryInfo?.name}`
                          : selectedGenre !== 'All'
                          ? `Genre: ${selectedGenre}`
                          : activeFilter === 'popular'
                          ? '🔥 Film Paling Populer'
                          : activeFilter === 'latest'
                          ? '⚡ Rilisan Film Terbaru'
                          : 'Daftar Film & Serial'}
                      </span>
                    </h2>

                    {/* Active Filter Clear Chips */}
                    {(selectedCountry !== 'All' || selectedGenre !== 'All' || searchQuery) && (
                      <div className="flex items-center gap-1.5 ml-1">
                        {selectedCountry !== 'All' && (
                          <button
                            onClick={() => setSelectedCountry('All')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-950/70 text-sky-300 border border-sky-600/40 text-[11px] font-semibold hover:bg-sky-900 transition"
                          >
                            <span>{activeCountryInfo?.flag} {activeCountryInfo?.name}</span>
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        {selectedGenre !== 'All' && (
                          <button
                            onClick={() => setSelectedGenre('All')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950/70 text-red-300 border border-red-600/40 text-[11px] font-semibold hover:bg-red-900 transition"
                          >
                            <span>{selectedGenre}</span>
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs text-[#8E8E93] font-medium">
                    {filteredMovies.length} Film Ditampilkan
                  </span>
                </div>

                {/* Movie Grid */}
                {filteredMovies.length === 0 ? (
                  <div className="py-16 sm:py-20 text-center bg-[#0B0B10] border border-[#1C1C26] rounded-2xl p-6 sm:p-8">
                    <Film className="w-10 h-10 sm:w-12 sm:h-12 text-[#52525B] mx-auto mb-3" />
                    <h3 className="text-base sm:text-lg font-bold text-[#F9F9F9] mb-1">Tidak Ada Film Yang Cocok</h3>
                    <p className="text-[#A1A1AA] text-xs sm:text-sm mb-4">
                      Coba cari dengan kata kunci lain, pilih negara lain, atau pilih genre/kategori yang berbeda.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedGenre('All');
                        setSelectedCountry('All');
                        setActiveFilter('all');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#14141C] hover:bg-[#1C1C26] border border-[#22222C] text-[#F9F9F9] text-xs font-semibold transition"
                    >
                      Reset Semua Filter
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 xs:gap-3.5 sm:gap-5 lg:gap-6">
                    {filteredMovies.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onWatch={handleWatchMovie}
                        onQuickShare={(m) => handleOpenShareModal(m)}
                      />
                    ))}
                  </div>
                )}

                {/* ADSTERRA BOTTOM HOMEPAGE BANNER */}
                {adConfig.bannerBottomEnabled && (
                  <div className="mt-8 mb-4">
                    <AdBannerSlot
                      code={adConfig.bannerBottomCode}
                      enabled={adConfig.bannerBottomEnabled}
                      type="bottom"
                    />
                  </div>
                )}

                {/* Features & Benefits Bar */}
                <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 pt-8 sm:pt-10 border-t border-[#181822]">
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0B10] border border-[#1C1C26] flex items-start gap-3.5 shadow-lg">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-[#E50914]/15 text-[#E50914] shrink-0 border border-[#E50914]/25">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#F9F9F9] mb-0.5 sm:mb-1">Multi-Server Video Player</h4>
                      <p className="text-[11px] sm:text-xs text-[#A1A1AA]">
                        Pilihan server cadangan (VidSrc, SuperEmbed, 2Embed) untuk streaming lancar tanpa macet.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0B10] border border-[#1C1C26] flex items-start gap-3.5 shadow-lg">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/15 text-amber-400 shrink-0 border border-amber-500/25">
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#F9F9F9] mb-0.5 sm:mb-1">Shortlink & Social Share</h4>
                      <p className="text-[11px] sm:text-xs text-[#A1A1AA]">
                        Bagikan film instan ke WhatsApp, FB, dan Twitter dengan slug otomatis.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0B10] border border-[#1C1C26] flex items-start gap-3.5 shadow-lg">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0 border border-emerald-500/25">
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#F9F9F9] mb-0.5 sm:mb-1">Koleksi Terupdate</h4>
                      <p className="text-[11px] sm:text-xs text-[#A1A1AA]">
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
          <div className="flex items-center gap-2.5">
            <img
              src={APP_LOGO_URL}
              alt="Tontonan Gratis Logo"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-lg object-cover border border-[#E50914]/40"
            />
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

      {/* Social Media Share Modal with Live Card Preview */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={shareModalData}
        showToast={showToast}
      />

      {/* Toast Feedback */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
