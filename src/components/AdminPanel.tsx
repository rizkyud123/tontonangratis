import React, { useState } from 'react';
import {
  Film,
  Plus,
  Trash2,
  Edit,
  Search,
  RefreshCw,
  Database,
  Megaphone,
  Save,
  Check,
  Copy,
  ArrowLeft,
  Eye,
  Code2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  X,
  AlertTriangle,
  Loader2,
  Radio,
  Sparkles,
  Server,
  Zap,
  Youtube,
} from 'lucide-react';
import { Movie, SupabaseConfig, AdConfig, ApiIntegrationConfig, MovieServer } from '../types';
import {
  generateSlug,
  AVAILABLE_GENRES,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
  resetMoviesToDefault,
} from '../services/storageService';
import {
  searchTmdbMovies,
  getTmdbMovieDetails,
  convertTmdbDetailsToMovie,
  generateMovieServers,
  createEmbedHtml,
} from '../services/movieApiService';
import { ApiIntegrationTab } from './ApiIntegrationTab';
import { ApiMovieSearchTab } from './ApiMovieSearchTab';
import { YouTubeSearchView } from './YouTubeSearchView';
import { APP_LOGO_URL } from '../data/initialMovies';

interface AdminPanelProps {
  movies: Movie[];
  supabaseConfig: SupabaseConfig;
  adConfig: AdConfig;
  apiConfig: ApiIntegrationConfig;
  onSaveMovie: (movieData: Omit<Movie, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
  onBulkImportMovies: (movies: Movie[]) => Promise<void>;
  onDeleteMovie: (id: string) => Promise<void>;
  onSaveSupabaseConfig: (config: SupabaseConfig) => void;
  onSaveAdConfig: (config: AdConfig) => void;
  onSaveApiConfig: (config: ApiIntegrationConfig) => void;
  onSyncSupabase?: () => Promise<void>;
  onWatchMovie: (slug: string) => void;
  showToast: (msg: string) => void;
  onClose?: () => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  movies,
  supabaseConfig,
  adConfig,
  apiConfig,
  onSaveMovie,
  onBulkImportMovies,
  onDeleteMovie,
  onSaveSupabaseConfig,
  onSaveAdConfig,
  onSaveApiConfig,
  onSyncSupabase,
  onWatchMovie,
  showToast,
  onClose,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'api_search' | 'youtube_search' | 'add' | 'api_integration' | 'ads' | 'database'>('list');
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);

  // Form State for Add / Edit Movie
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [backdrop, setBackdrop] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Action']);
  const [rating, setRating] = useState('8.0');
  const [year, setYear] = useState('2024');
  const [duration, setDuration] = useState('2j 05m');
  const [quality, setQuality] = useState<'HD' | 'FHD' | '4K' | 'CAM'>('HD');
  const [tmdbId, setTmdbId] = useState<string>('');
  const [imdbId, setImdbId] = useState<string>('');
  const [trailerUrl, setTrailerUrl] = useState<string>('');
  const [servers, setServers] = useState<MovieServer[]>([]);
  const [autoSlug, setAutoSlug] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-Fill TMDB inside Form
  const [autoFillQuery, setAutoFillQuery] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // New Server Form in Add tab
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerQuality, setNewServerQuality] = useState('1080p');

  // Search in Admin
  const [adminSearch, setAdminSearch] = useState('');

  // Supabase State
  const [sbUrl, setSbUrl] = useState(supabaseConfig.url || '');
  const [sbAnonKey, setSbAnonKey] = useState(supabaseConfig.anonKey || '');
  const [sbEnabled, setSbEnabled] = useState(supabaseConfig.enabled || false);
  const [isTestingSb, setIsTestingSb] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Adsterra Ads State
  const [adsForm, setAdsForm] = useState<AdConfig>(adConfig);

  // Modal State for Delete Confirmation
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [isDeletingMovie, setIsDeletingMovie] = useState(false);

  // Modal State for Reset Default Confirmation
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResettingDefault, setIsResettingDefault] = useState(false);

  const handleGenreToggle = (g: string) => {
    if (selectedGenres.includes(g)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((item) => item !== g));
      }
    } else {
      setSelectedGenres([...selectedGenres, g]);
    }
  };

  const handleEditMovie = (m: Movie) => {
    setEditingId(m.id);
    setTitle(m.title);
    setSlug(m.slug);
    setThumbnail(m.thumbnail);
    setBackdrop(m.backdrop || '');
    setEmbedCode(m.embed_code);
    setSynopsis(m.synopsis || '');
    setSelectedGenres(m.genres || ['Action']);
    setRating(String(m.rating || 8.0));
    setYear(String(m.year || 2024));
    setDuration(m.duration || '2j 00m');
    setQuality(m.quality || 'HD');
    setTmdbId(m.tmdb_id ? String(m.tmdb_id) : '');
    setImdbId(m.imdb_id || '');
    setTrailerUrl(m.trailer_url || '');

    if (m.servers && m.servers.length > 0) {
      setServers(m.servers);
    } else if (m.tmdb_id) {
      setServers(generateMovieServers(m.tmdb_id, m.imdb_id));
    } else {
      setServers([]);
    }

    setAutoSlug(false);
    setActiveTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setThumbnail('');
    setBackdrop('');
    setEmbedCode('');
    setSynopsis('');
    setSelectedGenres(['Action']);
    setRating('8.0');
    setYear('2024');
    setDuration('2j 05m');
    setQuality('HD');
    setTmdbId('');
    setImdbId('');
    setTrailerUrl('');
    setServers([]);
    setAutoSlug(true);
    setAutoFillQuery('');
  };

  // Quick TMDB Auto-fill inside Manual Add/Edit Form
  const handleQuickAutoFill = async () => {
    const query = autoFillQuery.trim() || title.trim();
    if (!query) {
      showToast('Masukkan judul atau TMDB ID untuk mencari otomatis!');
      return;
    }

    setIsAutoFilling(true);
    try {
      let targetTmdbId: number | null = null;

      if (/^\d+$/.test(query)) {
        targetTmdbId = parseInt(query, 10);
      } else {
        const searchRes = await searchTmdbMovies(query, 1);
        if (searchRes && searchRes.results && searchRes.results.length > 0) {
          targetTmdbId = searchRes.results[0].id;
        }
      }

      if (!targetTmdbId) {
        showToast('Film tidak ditemukan di TMDB. Coba dengan judul lain.');
        return;
      }

      const rawDetail = await getTmdbMovieDetails(targetTmdbId);
      if (rawDetail) {
        const movieObj = convertTmdbDetailsToMovie(rawDetail, apiConfig);
        setTitle(movieObj.title);
        setSlug(movieObj.slug);
        setThumbnail(movieObj.thumbnail);
        setBackdrop(movieObj.backdrop || '');
        setSynopsis(movieObj.synopsis || '');
        setSelectedGenres(movieObj.genres || ['Action']);
        setRating(String(movieObj.rating || 8.0));
        setYear(String(movieObj.year || 2024));
        setDuration(movieObj.duration || '2j 00m');
        setQuality(movieObj.quality || 'HD');
        setTmdbId(String(movieObj.tmdb_id || targetTmdbId));
        setImdbId(movieObj.imdb_id || '');
        setTrailerUrl(movieObj.trailer_url || '');

        const generatedSrvs = movieObj.servers || generateMovieServers(targetTmdbId, movieObj.imdb_id);
        setServers(generatedSrvs);

        if (generatedSrvs.length > 0) {
          setEmbedCode(createEmbedHtml(generatedSrvs[0].url, movieObj.title));
        } else {
          setEmbedCode(movieObj.embed_code);
        }

        setAutoSlug(false);
        showToast(`✨ Data film "${movieObj.title}" berhasil diisi otomatis dari TMDB!`);
      }
    } catch (err: any) {
      showToast(`Gagal auto-fill TMDB: ${err.message || err}`);
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Add a new streaming server manually
  const handleAddServer = () => {
    if (!newServerName.trim() || !newServerUrl.trim()) {
      showToast('Masukkan Nama Server dan URL Video!');
      return;
    }

    const newSrv: MovieServer = {
      id: `srv-${Date.now()}`,
      name: newServerName.trim(),
      url: newServerUrl.trim(),
      quality: newServerQuality || '1080p',
      isDefault: servers.length === 0,
    };

    const updated = [...servers, newSrv];
    setServers(updated);
    setNewServerName('');
    setNewServerUrl('');
    showToast(`Server "${newSrv.name}" ditambahkan!`);
  };

  const handleRemoveServer = (id: string) => {
    setServers(servers.filter((s) => s.id !== id));
    showToast('Server video dihapus.');
  };

  const handleSubmitMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !thumbnail.trim()) {
      showToast('Harap isi Judul dan URL Poster!');
      return;
    }

    let finalEmbedCode = embedCode.trim();
    if (!finalEmbedCode && servers.length > 0) {
      finalEmbedCode = createEmbedHtml(servers[0].url, title);
    }

    if (!finalEmbedCode && !servers.length && !tmdbId) {
      showToast('Harap isi Kode Embed atau tambahkan Server Video!');
      return;
    }

    const finalSlug = slug.trim() || generateSlug(title);

    setIsSubmitting(true);
    try {
      await onSaveMovie({
        id: editingId || undefined,
        title: title.trim(),
        slug: finalSlug,
        thumbnail: thumbnail.trim(),
        backdrop: backdrop.trim() || undefined,
        embed_code: finalEmbedCode || (servers[0] ? createEmbedHtml(servers[0].url, title) : ''),
        synopsis: synopsis.trim(),
        genres: selectedGenres.length > 0 ? selectedGenres : ['Action'],
        rating: parseFloat(rating) || 7.5,
        year: parseInt(year, 10) || 2024,
        duration: duration.trim() || '2j 00m',
        quality,
        tmdb_id: tmdbId ? parseInt(tmdbId, 10) : undefined,
        imdb_id: imdbId.trim() || undefined,
        trailer_url: trailerUrl.trim() || undefined,
        servers: servers.length > 0 ? servers : undefined,
      });

      showToast(editingId ? 'Film berhasil diperbarui!' : 'Film baru berhasil diterbitkan!');
      handleResetForm();
      setActiveTab('list');
    } catch (err: any) {
      showToast(`Gagal menyimpan film: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!movieToDelete) return;
    setIsDeletingMovie(true);
    try {
      await onDeleteMovie(movieToDelete.id);
      showToast(`Film "${movieToDelete.title}" berhasil dihapus dari database.`);
      setMovieToDelete(null);
    } catch (err: any) {
      showToast(`Gagal menghapus: ${err.message || err}`);
    } finally {
      setIsDeletingMovie(false);
    }
  };

  const handleConfirmResetDefault = async () => {
    setIsResettingDefault(true);
    try {
      await resetMoviesToDefault();
      showToast('Database berhasil diperbarui dengan film asli dari TMDB API!');
      setIsResetConfirmOpen(false);
      window.location.reload();
    } catch (err: any) {
      showToast(`Gagal memuat film API: ${err.message || err}`);
      setIsResettingDefault(false);
    }
  };

  const handleTestSupabase = async () => {
    setIsTestingSb(true);
    setTestResult(null);
    const res = await testSupabaseConnection(sbUrl, sbAnonKey);
    setTestResult(res);
    setIsTestingSb(false);
  };

  const handleSaveSupabase = () => {
    onSaveSupabaseConfig({
      url: sbUrl.trim(),
      anonKey: sbAnonKey.trim(),
      enabled: sbEnabled,
    });
    showToast('Konfigurasi Supabase berhasil disimpan.');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    showToast('SQL Schema Supabase berhasil disalin!');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveAds = () => {
    onSaveAdConfig(adsForm);
    showToast('Pengaturan Iklan & Adsterra berhasil disimpan.');
  };

  const filteredMovies = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(adminSearch.toLowerCase()) ||
      m.slug.toLowerCase().includes(adminSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#1b1b24]">
        <div className="flex items-start gap-4">
          <img
            src={APP_LOGO_URL}
            alt="Tontonan Gratis Logo"
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-2xl object-cover border border-[#E50914]/40 shadow-lg shadow-[#E50914]/20 shrink-0 hidden sm:block"
          />
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-[#E50914]/15 text-[#E50914] font-bold text-xs uppercase tracking-wider border border-[#E50914]/30">
                Admin & Database Console
              </span>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-xs text-[#A1A1AA] hover:text-[#F9F9F9] flex items-center gap-1 transition px-2 py-0.5 rounded bg-[#14141C] border border-[#20202A]"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Kembali ke Website</span>
                </button>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition px-2 py-0.5 rounded bg-red-950/30 border border-red-800/40"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Kunci Admin</span>
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F9F9F9]">
              Kelola Film, Integrasi API & Monetisasi
            </h1>
            <p className="text-[#A1A1AA] text-xs sm:text-sm mt-1">
              Import jutaan film via API TMDB, atur multi-server pemutar video otomatis, sinkronisasi Supabase, dan Adsterra.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0E0E14] border border-[#1E1E28] rounded-xl overflow-x-auto scrollbar-none">
          
          <button
            id="tab-list-btn"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 ${
              activeTab === 'list'
                ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                : 'text-[#8E8E93] hover:text-[#F9F9F9] hover:bg-[#161622]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Koleksi ({movies.length})</span>
          </button>

          <button
            id="tab-api-search-btn"
            onClick={() => setActiveTab('api_search')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 ${
              activeTab === 'api_search'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/30 ring-1 ring-white/20'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Cari & Import (TMDB)</span>
          </button>

          <button
            id="tab-youtube-search-btn"
            onClick={() => setActiveTab('youtube_search')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 ${
              activeTab === 'youtube_search'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/30'
                : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 fill-red-500 text-red-500" />
            <span>🎬 Cari YouTube</span>
          </button>

          <button
            id="tab-add-btn"
            onClick={() => {
              setActiveTab('add');
              if (editingId) handleResetForm();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 ${
              activeTab === 'add'
                ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                : 'text-[#8E8E93] hover:text-[#F9F9F9] hover:bg-[#161622]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingId ? 'Edit Film' : 'Tambah Film'}</span>
          </button>

          <button
            id="tab-api-integration-btn"
            onClick={() => setActiveTab('api_integration')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 ${
              activeTab === 'api_integration'
                ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                : 'text-[#8E8E93] hover:text-[#F9F9F9] hover:bg-[#161622]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>API & Server Video</span>
          </button>

          <button
            id="tab-ads-btn"
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 ${
              activeTab === 'ads'
                ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                : 'text-[#8E8E93] hover:text-[#F9F9F9] hover:bg-[#161622]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Iklan Adsterra</span>
          </button>

          <button
            id="tab-db-btn"
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 ${
              activeTab === 'database'
                ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                : 'text-[#8E8E93] hover:text-[#F9F9F9] hover:bg-[#161622]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase DB</span>
          </button>
        </div>
      </div>

      {/* TAB: SEARCH & 1-CLICK BULK IMPORT FROM TMDB API */}
      {activeTab === 'api_search' && (
        <ApiMovieSearchTab
          apiConfig={apiConfig}
          existingMovies={movies}
          onImportSingleMovie={onSaveMovie}
          onSaveMovie={onSaveMovie}
          onBulkImportMovies={onBulkImportMovies}
          onPreviewMovie={(m) => onWatchMovie(m.slug)}
          showToast={showToast}
        />
      )}

      {/* TAB: SEARCH & IMPORT FROM YOUTUBE */}
      {activeTab === 'youtube_search' && (
        <YouTubeSearchView
          onSaveMovieToCatalog={onSaveMovie}
          onWatchMovie={onWatchMovie}
          adConfig={adConfig}
          showToast={showToast}
          youtubeApiKey={apiConfig.youtubeApiKey}
        />
      )}

      {/* TAB: API INTEGRATION & VIDEO PROVIDERS CONFIG */}
      {activeTab === 'api_integration' && (
        <ApiIntegrationTab
          apiConfig={apiConfig}
          onSaveConfig={onSaveApiConfig}
          onSaveApiConfig={onSaveApiConfig}
          showToast={showToast}
        />
      )}

      {/* TAB: ADD / EDIT MOVIE FORM WITH AUTO-FILL & MULTI-SERVER */}
      {activeTab === 'add' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Form (8 Cols) */}
          <div className="lg:col-span-8 bg-[#0B0B10] border border-[#1C1C26] p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#181822]">
              <h2 className="text-lg sm:text-xl font-bold text-[#F9F9F9] flex items-center gap-2 border-l-4 border-[#E50914] pl-3">
                {editingId ? 'Edit Data Film' : 'Tambah Film Baru (Embed & Multi-Server)'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs text-[#8E8E93] hover:text-white underline"
                >
                  Batal Edit & Tambah Baru
                </button>
              )}
            </div>

            {/* Quick Auto-Fill Bar */}
            <div className="p-4 rounded-xl bg-[#07070C] border border-[#1E1E2C] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Isi Formulir Otomatis Dari TMDB API
                </span>
                <span className="text-[11px] text-[#71717A]">
                  Ketik judul (contoh: Avengers Endgame) atau ID TMDB
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={autoFillQuery}
                  onChange={(e) => setAutoFillQuery(e.target.value)}
                  placeholder="Ketik judul film atau TMDB ID (misal: 299534)..."
                  className="flex-1 bg-[#0E0E14] border border-[#22222E] px-3.5 py-2 rounded-xl text-xs sm:text-sm text-[#F9F9F9] focus:outline-none focus:border-amber-500 font-medium"
                />
                <button
                  type="button"
                  onClick={handleQuickAutoFill}
                  disabled={isAutoFilling}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-950/40"
                >
                  {isAutoFilling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengambil Data...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✨ Auto-Fill TMDB</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitMovie} className="space-y-5">
              
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2">
                    Judul Film <span className="text-[#E50914]">*</span>
                  </label>
                  <input
                    id="input-movie-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (autoSlug) setSlug(generateSlug(e.target.value));
                    }}
                    placeholder="Contoh: Iron Man 2 (2010)"
                    className="w-full bg-[#050505] border border-[#22222C] px-4 py-2.5 rounded-xl text-sm text-[#F9F9F9] focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
                      Shortlink / Slug <span className="text-[#E50914]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setSlug(generateSlug(title || 'film'))}
                      className="text-[11px] text-[#E50914] hover:text-red-400 font-semibold"
                    >
                      Acak Ulang Slug
                    </button>
                  </div>
                  <input
                    id="input-movie-slug"
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setAutoSlug(false);
                    }}
                    placeholder="iron-man-2-2010"
                    className="w-full bg-[#050505] border border-[#22222C] px-4 py-2.5 rounded-xl text-sm text-[#F9F9F9] font-mono focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              {/* Poster URL & Backdrop URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2">
                    URL Poster / Thumbnail <span className="text-[#E50914]">*</span>
                  </label>
                  <input
                    id="input-movie-thumbnail"
                    type="url"
                    required
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="https://image.tmdb.org/t/p/w500/..."
                    className="w-full bg-[#050505] border border-[#22222C] px-4 py-2.5 rounded-xl text-sm text-[#F9F9F9] focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2">
                    URL Backdrop / Banner (Opsional)
                  </label>
                  <input
                    id="input-movie-backdrop"
                    type="url"
                    value={backdrop}
                    onChange={(e) => setBackdrop(e.target.value)}
                    placeholder="https://image.tmdb.org/t/p/original/..."
                    className="w-full bg-[#050505] border border-[#22222C] px-4 py-2.5 rounded-xl text-sm text-[#F9F9F9] focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              {/* TMDB ID, IMDb ID & Trailer URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                    TMDB ID
                  </label>
                  <input
                    type="text"
                    value={tmdbId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTmdbId(val);
                      if (val && /^\d+$/.test(val)) {
                        setServers(generateMovieServers(parseInt(val, 10), imdbId));
                      }
                    }}
                    placeholder="Contoh: 299534"
                    className="w-full bg-[#050505] border border-[#22222C] px-3 py-2 rounded-xl text-xs sm:text-sm text-[#F9F9F9] font-mono focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                    IMDb ID
                  </label>
                  <input
                    type="text"
                    value={imdbId}
                    onChange={(e) => setImdbId(e.target.value)}
                    placeholder="Contoh: tt4154796"
                    className="w-full bg-[#050505] border border-[#22222C] px-3 py-2 rounded-xl text-xs sm:text-sm text-[#F9F9F9] font-mono focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                    URL Trailer Resmi (YouTube)
                  </label>
                  <input
                    type="url"
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-[#050505] border border-[#22222C] px-3 py-2 rounded-xl text-xs sm:text-sm text-[#F9F9F9] focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              {/* Streaming Video Server List Manager */}
              <div className="p-4 rounded-xl bg-[#06060A] border border-[#1E1E2C] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#F9F9F9] flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-[#E50914]" />
                      <span>Daftar Server Streaming Video ({servers.length})</span>
                    </label>
                    <p className="text-[11px] text-[#8E8E93]">
                      Pengunjung dapat berganti-ganti server jika salah satu server buffering atau mati.
                    </p>
                  </div>

                  {tmdbId && (
                    <button
                      type="button"
                      onClick={() => {
                        const srvs = generateMovieServers(parseInt(tmdbId, 10), imdbId);
                        setServers(srvs);
                        showToast('Server video di-generate otomatis dari TMDB ID!');
                      }}
                      className="text-[11px] text-[#E50914] hover:text-red-400 font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Re-Generate Otomatis</span>
                    </button>
                  )}
                </div>

                {/* Server list items */}
                {servers.length > 0 ? (
                  <div className="space-y-2">
                    {servers.map((srv, idx) => (
                      <div
                        key={srv.id || idx}
                        className="flex items-center justify-between gap-2 p-2.5 bg-[#0D0D14] border border-[#1F1F2C] rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-bold text-[#F9F9F9] shrink-0">{srv.name}</span>
                          <span className="text-[#666] shrink-0">•</span>
                          <span className="font-mono text-[#8E8E93] truncate">{srv.url}</span>
                          {srv.quality && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-[10px] shrink-0">
                              {srv.quality}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveServer(srv.id)}
                          className="text-red-400 hover:text-red-300 p-1 hover:bg-red-950/30 rounded transition shrink-0"
                          title="Hapus server"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-xs text-[#71717A]">
                    Belum ada server video tersimpan. Masukkan TMDB ID di atas atau tambah server custom di bawah.
                  </div>
                )}

                {/* Add Custom Server Row */}
                <div className="pt-2 border-t border-[#181822] flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    placeholder="Nama Server (e.g. Server VIP)"
                    className="w-full sm:w-1/3 bg-[#0A0A10] border border-[#22222E] px-3 py-1.5 rounded-lg text-xs text-[#F9F9F9]"
                  />
                  <input
                    type="url"
                    value={newServerUrl}
                    onChange={(e) => setNewServerUrl(e.target.value)}
                    placeholder="URL Video Embed (https://...)"
                    className="w-full sm:flex-1 bg-[#0A0A10] border border-[#22222E] px-3 py-1.5 rounded-lg text-xs text-[#F9F9F9] font-mono"
                  />
                  <select
                    value={newServerQuality}
                    onChange={(e) => setNewServerQuality(e.target.value)}
                    className="w-full sm:w-24 bg-[#0A0A10] border border-[#22222E] px-2 py-1.5 rounded-lg text-xs text-[#F9F9F9]"
                  >
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="4K">4K</option>
                    <option value="CAM">CAM</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddServer}
                    className="w-full sm:w-auto px-3 py-1.5 bg-[#1C1C28] hover:bg-[#282838] text-[#F9F9F9] rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              {/* Fallback Embed Video Code (Iframe/Player) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
                    Kode Embed HTML Cadangan (Fallback Iframe)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEmbedCode(
                        '<iframe class="w-full h-full rounded-xl" src="https://vidsrc.to/embed/movie/299534" frameborder="0" allowfullscreen></iframe>'
                      )
                    }
                    className="text-[11px] text-[#8E8E93] hover:text-[#F9F9F9]"
                  >
                    Contoh Template Iframe
                  </button>
                </div>
                <textarea
                  id="input-movie-embed"
                  rows={3}
                  value={embedCode}
                  onChange={(e) => setEmbedCode(e.target.value)}
                  placeholder='<iframe class="w-full h-full" src="https://..." frameborder="0" allowfullscreen></iframe>'
                  className="w-full bg-[#050505] border border-[#22222C] p-3 rounded-xl text-xs text-emerald-400 font-mono focus:outline-none focus:border-[#E50914]"
                />
              </div>

              {/* Synopsis */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2">
                  Sinopsis & Deskripsi Film
                </label>
                <textarea
                  id="input-movie-synopsis"
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Tulis sinopsis ringkas tentang alur cerita film ini..."
                  className="w-full bg-[#050505] border border-[#22222C] p-3 rounded-xl text-sm text-[#D4D4D8] focus:outline-none focus:border-[#E50914]"
                />
              </div>

              {/* Genres Tag Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2">
                  Pilih Genre
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_GENRES.map((g) => {
                    const isSelected = selectedGenres.includes(g);
                    return (
                      <button
                        type="button"
                        key={g}
                        onClick={() => handleGenreToggle(g)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          isSelected
                            ? 'bg-[#E50914] text-white font-bold shadow-sm shadow-[#E50914]/30'
                            : 'bg-[#050505] border border-[#20202A] text-[#8E8E93] hover:text-[#F9F9F9] hover:border-[#2C2C38]'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Metadata Row: Rating, Year, Duration, Quality */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8E8E93] mb-1">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full bg-[#050505] border border-[#22222C] px-3 py-2 rounded-lg text-sm text-[#F9F9F9] focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8E8E93] mb-1">Tahun</label>
                  <input
                    type="number"
                    min="1950"
                    max="2030"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-[#050505] border border-[#22222C] px-3 py-2 rounded-lg text-sm text-[#F9F9F9] focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8E8E93] mb-1">Durasi</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="2j 15m"
                    className="w-full bg-[#050505] border border-[#22222C] px-3 py-2 rounded-lg text-sm text-[#F9F9F9] focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8E8E93] mb-1">Kualitas</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as any)}
                    className="w-full bg-[#050505] border border-[#22222C] px-3 py-2 rounded-lg text-sm text-[#F9F9F9] focus:outline-none focus:border-[#E50914]"
                  >
                    <option value="4K">4K Ultra HD</option>
                    <option value="FHD">Full HD 1080p</option>
                    <option value="HD">HD 720p</option>
                    <option value="CAM">CAM / TS</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#181822] flex items-center gap-3">
                <button
                  id="submit-movie-form-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#E50914] hover:bg-[#F40612] active:bg-[#B80710] disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-lg shadow-[#E50914]/25 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : editingId ? 'Perbarui Film' : 'Simpan & Terbitkan Film'}</span>
                </button>
              </div>

            </form>
          </div>

          {/* Live Preview Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Live Poster Preview */}
            <div className="bg-[#0B0B10] border border-[#1C1C26] p-5 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-3 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#E50914]" />
                Live Preview Poster
              </h3>

              <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#050505] border border-[#1E1E28] flex items-center justify-center relative mb-3">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                ) : (
                  <div className="text-center p-4">
                    <Film className="w-10 h-10 text-[#2C2C38] mx-auto mb-2" />
                    <span className="text-xs text-[#71717A]">Masukkan URL poster di formulir</span>
                  </div>
                )}
                {quality && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/85 text-[10px] font-bold text-amber-400">
                    {quality}
                  </span>
                )}
              </div>

              <div className="text-xs space-y-1 text-[#A1A1AA]">
                <p className="font-bold text-[#F9F9F9] truncate">{title || 'Judul Film Anda'}</p>
                <p className="text-[#71717A] font-mono truncate">slug: {slug || 'slug-otomatis'}</p>
              </div>
            </div>

            {/* Live Video Embed Tester */}
            <div className="bg-[#0B0B10] border border-[#1C1C26] p-5 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-3 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                Live Embed Player Tester
              </h3>

              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-[#1E1E28] flex items-center justify-center">
                {servers.length > 0 ? (
                  <iframe
                    src={servers[0].url}
                    className="w-full h-full border-0"
                    allowFullScreen
                    title="Player Preview"
                  />
                ) : embedCode ? (
                  <div
                    className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                    dangerouslySetInnerHTML={{ __html: embedCode }}
                  />
                ) : (
                  <span className="text-xs text-[#71717A] text-center px-4">
                    Ketik kode embed atau TMDB ID untuk menguji pemutar secara langsung di sini
                  </span>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB: LIST & MANAGE MOVIES */}
      {activeTab === 'list' && (
        <div className="bg-[#0B0B10] border border-[#1C1C26] rounded-2xl p-6 shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Cari judul atau slug film..."
                className="w-full bg-[#050505] border border-[#22222C] pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm text-[#F9F9F9] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onSyncSupabase && (
                <button
                  type="button"
                  disabled={isSyncingGlobal}
                  onClick={async () => {
                    setIsSyncingGlobal(true);
                    await onSyncSupabase();
                    setIsSyncingGlobal(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition"
                  title="Sinkronkan database ke semua perangkat dan cloud Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingGlobal ? 'animate-spin' : ''}`} />
                  <span>{isSyncingGlobal ? 'Menyinkronkan...' : 'Sinkron Semua Device'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('api_search')}
                className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Import API TMDB</span>
              </button>

              <button
                id="admin-reset-default-btn"
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#14141C] hover:bg-[#1C1C26] border border-[#22222C] text-[#A1A1AA] hover:text-[#F9F9F9] text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>

              <button
                id="admin-add-movie-tab-btn"
                type="button"
                onClick={() => setActiveTab('add')}
                className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#E50914]/25 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Film</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#07070B] text-[#8E8E93] uppercase text-[10px] tracking-wider border-b border-[#1C1C26]">
                <tr>
                  <th className="py-3 px-4">Poster</th>
                  <th className="py-3 px-4">Judul & Genre</th>
                  <th className="py-3 px-4">Slug / Shortlink</th>
                  <th className="py-3 px-4">Rating / Kualitas</th>
                  <th className="py-3 px-4">Server</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181822] text-[#D4D4D8]">
                {filteredMovies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#71717A]">
                      Tidak ada film ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredMovies.map((m) => (
                    <tr key={m.id} className="hover:bg-[#13131B] transition">
                      <td className="py-3 px-4">
                        <div className="w-10 h-14 rounded-lg overflow-hidden bg-[#050505] border border-[#1E1E28]">
                          <img src={m.thumbnail} alt={m.title} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#F9F9F9]">
                        <div>{m.title}</div>
                        <div className="text-[11px] text-[#8E8E93] font-normal">
                          {m.genres?.join(', ') || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#8E8E93]">
                        {m.slug}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 font-bold">★ {m.rating || '-'}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#14141C] border border-[#20202C] text-[10px] font-bold text-[#A1A1AA]">
                            {m.quality || 'HD'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {m.servers && m.servers.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800 text-emerald-400 font-bold text-[10px]">
                            {m.servers.length} Server
                          </span>
                        ) : m.tmdb_id ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-950/40 border border-blue-800 text-blue-300 font-bold text-[10px]">
                            Auto TMDB
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#71717A]">1 Server</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#8E8E93]">
                        {m.views || 0}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onWatchMovie(m.slug)}
                            title="Tonton Preview"
                            className="p-1.5 rounded-lg bg-[#14141C] hover:bg-[#1C1C26] border border-[#20202C] text-[#A1A1AA] hover:text-[#F9F9F9] transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            id={`admin-edit-movie-${m.id}`}
                            type="button"
                            onClick={() => handleEditMovie(m)}
                            title="Edit Film"
                            className="p-1.5 rounded-lg bg-[#14141C] hover:bg-[#1C1C26] border border-[#20202C] text-amber-400 hover:text-amber-300 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            id={`admin-delete-movie-${m.id}`}
                            type="button"
                            onClick={() => setMovieToDelete(m)}
                            title="Hapus Film"
                            className="p-1.5 rounded-lg bg-[#14141C] hover:bg-[#E50914]/20 border border-[#20202C] hover:border-[#E50914]/50 text-[#E50914] hover:text-red-300 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB: SUPABASE & MULTI-DEVICE SHARED DATABASE */}
      {activeTab === 'database' && (
        <div className="space-y-8">
          
          {/* Multi-Device Shared Status Banner */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/40 via-[#0B0B10] to-blue-950/30 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-sm sm:text-base font-bold text-[#F9F9F9]">
                    Database Terpusat & Sinkronisasi Lintas Perangkat Aktif
                  </h3>
                </div>
                <p className="text-xs text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
                  Semua film yang Anda tambah, edit, atau hapus di komputer ini otomatis tersimpan di database server dan langsung tersinkronkan ke <strong>Komputer B, HP/Smartphone, Tablet</strong>, maupun pengunjung lainnya secara instan.
                </p>
              </div>
            </div>

            {onSyncSupabase && (
              <button
                type="button"
                disabled={isSyncingGlobal}
                onClick={async () => {
                  setIsSyncingGlobal(true);
                  await onSyncSupabase();
                  setIsSyncingGlobal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-900/40 shrink-0 self-start md:self-auto"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingGlobal ? 'animate-spin' : ''}`} />
                <span>{isSyncingGlobal ? 'Menyinkronkan...' : 'Sinkronkan Database Sekarang'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Credentials Setup (7 cols) */}
            <div className="lg:col-span-7 bg-[#0B0B10] border border-[#1C1C26] p-6 sm:p-8 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#181822]">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#F9F9F9] flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    Koneksi Cloud Supabase PostgreSQL
                  </h2>
                  <p className="text-xs text-[#8E8E93] mt-1">
                    Hubungkan project Supabase Anda untuk mencadangkan dan menyinkronkan seluruh database ke cloud secara real-time.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3.5 bg-[#050505] rounded-xl border border-[#1E1E28]">
                  <input
                    id="enable-supabase-toggle"
                    type="checkbox"
                    checked={sbEnabled}
                    onChange={(e) => setSbEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E50914] focus:ring-[#E50914] bg-[#0E0E14] border-[#2A2A38]"
                  />
                  <label htmlFor="enable-supabase-toggle" className="text-xs sm:text-sm font-semibold text-[#F9F9F9] cursor-pointer">
                    Aktifkan Sinkronisasi Cloud Supabase Live
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2">
                    Supabase Project URL
                  </label>
                  <input
                    id="supabase-url-input"
                    type="url"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-[#050505] border border-[#22222C] px-4 py-2.5 rounded-xl text-sm text-[#F9F9F9] font-mono focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2">
                    Supabase Anon (Public) Key
                  </label>
                  <input
                    id="supabase-anon-key-input"
                    type="password"
                    value={sbAnonKey}
                    onChange={(e) => setSbAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-[#050505] border border-[#22222C] px-4 py-2.5 rounded-xl text-sm text-[#F9F9F9] font-mono focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
                      testResult.success
                        ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                        : 'bg-red-950/40 border border-red-800 text-red-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={isTestingSb}
                    className="px-4 py-2.5 rounded-xl bg-[#14141C] hover:bg-[#1C1C26] border border-[#22222C] text-[#D4D4D8] text-xs font-bold transition flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSb ? 'animate-spin' : ''}`} />
                    <span>{isTestingSb ? 'Menguji...' : 'Tes Koneksi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSupabase}
                    className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold shadow-md shadow-[#E50914]/25 transition flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan & Sinkronkan ke Semua Perangkat</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SQL Script Viewer (5 cols) */}
            <div className="lg:col-span-5 bg-[#0B0B10] border border-[#1C1C26] p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#F9F9F9] flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span>Supabase SQL Schema Script</span>
                </h3>

                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14141C] hover:bg-[#1C1C26] border border-[#22222C] text-[#A1A1AA] hover:text-[#F9F9F9] text-xs font-semibold transition"
                >
                  {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSql ? 'Tersalin' : 'Salin SQL'}</span>
                </button>
              </div>

              <p className="text-xs text-[#8E8E93] mb-3">
                Jalankan script ini di menu <strong>SQL Editor</strong> di dashboard Supabase Anda untuk membuat tabel <code>movies</code> dan tabel <code>app_settings</code> beserta RLS policy.
              </p>

              <pre className="bg-[#050505] p-3.5 rounded-xl border border-[#1C1C26] text-[11px] font-mono text-[#D4D4D8] overflow-x-auto max-h-72 leading-relaxed">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>

        </div>
      )}

      {/* TAB: ADSTERRA & MONETIZATION SETTINGS */}
      {activeTab === 'ads' && (
        <div className="bg-[#0B0B10] border border-[#1C1C26] p-6 sm:p-8 rounded-2xl shadow-xl max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#181822]">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#F9F9F9] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                Integrasi Monetisasi & Slot Iklan Adsterra
              </h2>
              <p className="text-xs text-[#8E8E93] mt-1">
                Atur penempatan script banner Adsterra, native ads, serta URL direct link & popunder.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Top Banner */}
            <div className="p-4 bg-[#050505] rounded-xl border border-[#1E1E28]">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-[#F9F9F9] flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adsForm.bannerTopEnabled}
                    onChange={(e) =>
                      setAdsForm({ ...adsForm, bannerTopEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#E50914] focus:ring-[#E50914]"
                  />
                  <span>Aktifkan Banner Atas (Top Banner Slot)</span>
                </label>
                <span className="text-[11px] text-[#71717A]">Adsterra 728x90 / Native</span>
              </div>
              <textarea
                rows={3}
                value={adsForm.bannerTopCode}
                onChange={(e) =>
                  setAdsForm({ ...adsForm, bannerTopCode: e.target.value })
                }
                placeholder="Paste script atau HTML banner Adsterra di sini..."
                className="w-full bg-[#0E0E14] border border-[#22222C] p-3 rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:border-[#E50914]"
              />
            </div>

            {/* Bottom Banner */}
            <div className="p-4 bg-[#050505] rounded-xl border border-[#1E1E28]">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-[#F9F9F9] flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adsForm.bannerBottomEnabled}
                    onChange={(e) =>
                      setAdsForm({ ...adsForm, bannerBottomEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#E50914] focus:ring-[#E50914]"
                  />
                  <span>Aktifkan Banner Bawah (Bottom Native Slot)</span>
                </label>
                <span className="text-[11px] text-[#71717A]">Adsterra Native Recommendation</span>
              </div>
              <textarea
                rows={3}
                value={adsForm.bannerBottomCode}
                onChange={(e) =>
                  setAdsForm({ ...adsForm, bannerBottomCode: e.target.value })
                }
                placeholder="Paste script atau HTML banner bawah di sini..."
                className="w-full bg-[#0E0E14] border border-[#22222C] p-3 rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:border-[#E50914]"
              />
            </div>

            {/* Popunder & Direct Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2">
                  URL Adsterra Direct Link (Sponsor)
                </label>
                <input
                  type="url"
                  value={adsForm.adsterraDirectLink}
                  onChange={(e) =>
                    setAdsForm({ ...adsForm, adsterraDirectLink: e.target.value })
                  }
                  placeholder="https://example.com/adsterra-direct-link"
                  className="w-full bg-[#050505] border border-[#22222C] px-4 py-2.5 rounded-xl text-sm text-[#F9F9F9] focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2">
                  URL Adsterra Popunder
                </label>
                <input
                  type="url"
                  value={adsForm.popunderUrl}
                  onChange={(e) =>
                    setAdsForm({ ...adsForm, popunderUrl: e.target.value })
                  }
                  placeholder="https://example.com/popunder"
                  className="w-full bg-[#050505] border border-[#22222C] px-4 py-2.5 rounded-xl text-sm text-[#F9F9F9] focus:outline-none focus:border-[#E50914]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#181822] flex justify-end">
              <button
                type="button"
                onClick={handleSaveAds}
                className="px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white font-bold text-sm shadow-md shadow-[#E50914]/25 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Iklan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: KONFIRMASI HAPUS FILM (YA / TIDAK) */}
      {movieToDelete && (
        <div
          id="delete-movie-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingMovie) {
              setMovieToDelete(null);
            }
          }}
        >
          <div
            id="delete-movie-modal"
            className="w-full max-w-md bg-[#0D0D14] border border-red-500/30 rounded-2xl p-6 shadow-2xl shadow-red-950/50 space-y-5 relative animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Close Button */}
            <button
              id="close-delete-modal-btn"
              type="button"
              disabled={isDeletingMovie}
              onClick={() => setMovieToDelete(null)}
              className="absolute top-4 right-4 text-[#8E8E93] hover:text-[#F9F9F9] p-1 rounded-lg hover:bg-[#1C1C26] transition disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon and Title */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 text-[#E50914]">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="pr-6">
                <h3 className="text-lg font-bold text-[#F9F9F9]">
                  Hapus Film Dari Database?
                </h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Konfirmasi penghapusan data film
                </p>
              </div>
            </div>

            {/* Movie Preview Box */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#07070B] border border-[#1F1F2C]">
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-black shrink-0 border border-[#2A2A38]">
                <img
                  src={movieToDelete.thumbnail}
                  alt={movieToDelete.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#F9F9F9] truncate">
                  {movieToDelete.title}
                </h4>
                <p className="text-xs text-[#8E8E93] font-mono truncate">
                  slug: {movieToDelete.slug}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-amber-400 font-semibold">
                    ★ {movieToDelete.rating}
                  </span>
                  <span className="text-[#3A3A4C]">•</span>
                  <span className="text-[11px] text-[#8E8E93]">
                    {movieToDelete.year || 2024}
                  </span>
                  <span className="text-[#3A3A4C]">•</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#181822] text-[#A1A1AA] rounded font-medium">
                    {movieToDelete.quality || 'HD'}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="p-3 rounded-xl bg-red-950/20 border border-red-800/30 text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>
                Apakah Anda yakin ingin menghapus film ini? Tindakan ini permanen dan film tidak akan bisa ditonton lagi oleh pengunjung.
              </span>
            </div>

            {/* Modal Buttons: Ya / Tidak */}
            <div className="flex items-center gap-3 pt-2">
              <button
                id="cancel-delete-movie-btn"
                type="button"
                disabled={isDeletingMovie}
                onClick={() => setMovieToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#14141C] hover:bg-[#1C1C26] active:bg-[#101018] border border-[#262636] text-[#A1A1AA] hover:text-[#F9F9F9] font-semibold text-xs sm:text-sm transition text-center disabled:opacity-50"
              >
                Tidak, Batalkan
              </button>
              <button
                id="confirm-delete-movie-btn"
                type="button"
                disabled={isDeletingMovie}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#E50914] hover:bg-[#F40612] active:bg-[#B80710] text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-950/60 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeletingMovie ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Film</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: KONFIRMASI RESET DEFAULT DATABASE (YA / TIDAK) */}
      {isResetConfirmOpen && (
        <div
          id="reset-default-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isResettingDefault) {
              setIsResetConfirmOpen(false);
            }
          }}
        >
          <div
            id="reset-default-modal"
            className="w-full max-w-md bg-[#0D0D14] border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-amber-950/40 space-y-5 relative animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Close Button */}
            <button
              id="close-reset-modal-btn"
              type="button"
              disabled={isResettingDefault}
              onClick={() => setIsResetConfirmOpen(false)}
              className="absolute top-4 right-4 text-[#8E8E93] hover:text-[#F9F9F9] p-1 rounded-lg hover:bg-[#1C1C26] transition disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon and Title */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div className="pr-6">
                <h3 className="text-lg font-bold text-[#F9F9F9]">
                  Perbarui Koleksi dari TMDB API?
                </h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Tarik film trending & populer terbaru secara langsung dari TMDB
                </p>
              </div>
            </div>

            {/* Description Warning */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Tindakan ini akan mengimpor daftar film live asli terbaru dari TMDB API ke dalam database dan menyinkronkannya ke semua perangkat.
              </span>
            </div>

            {/* Modal Buttons: Ya / Tidak */}
            <div className="flex items-center gap-3 pt-2">
              <button
                id="cancel-reset-modal-btn"
                type="button"
                disabled={isResettingDefault}
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#14141C] hover:bg-[#1C1C26] active:bg-[#101018] border border-[#262636] text-[#A1A1AA] hover:text-[#F9F9F9] font-semibold text-xs sm:text-sm transition text-center disabled:opacity-50"
              >
                Tidak, Batalkan
              </button>
              <button
                id="confirm-reset-default-btn"
                type="button"
                disabled={isResettingDefault}
                onClick={handleConfirmResetDefault}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResettingDefault ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mereset...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Ya, Reset Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
