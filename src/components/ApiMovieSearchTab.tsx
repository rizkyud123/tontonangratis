import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Sparkles,
  Star,
  Calendar,
  Film,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Globe,
  Layers,
  Eye,
  Check,
  Plus,
  Play,
  X,
  ExternalLink,
  RefreshCw,
  Filter,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Movie, TmdbMovieResult, ApiIntegrationConfig } from '../types';
import {
  searchTmdbMovies,
  getTmdbPresetMovies,
  getTmdbMovieDetails,
  convertTmdbDetailsToMovie,
  getTmdbImageUrl,
  mapGenreIdsToNames,
  generateSlug,
} from '../services/movieApiService';

interface ApiMovieSearchTabProps {
  apiConfig: ApiIntegrationConfig;
  existingMovies: Movie[];
  onImportSingleMovie?: (movie: Movie) => Promise<void> | void;
  onSaveMovie?: (movie: Movie) => Promise<void> | void;
  onBulkImportMovies?: (movies: Movie[]) => Promise<void> | void;
  onPreviewMovie?: (movie: Movie) => void;
  showToast: (msg: string) => void;
}

export const ApiMovieSearchTab: React.FC<ApiMovieSearchTabProps> = ({
  apiConfig,
  existingMovies,
  onImportSingleMovie,
  onSaveMovie,
  onBulkImportMovies,
  onPreviewMovie,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activePreset, setActivePreset] = useState<'trending' | 'popular' | 'top_rated' | 'now_playing' | 'indonesia'>('trending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [results, setResults] = useState<TmdbMovieResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter: Hide movies that are already in database
  const [hideAlreadyInDb, setHideAlreadyInDb] = useState(true);

  // Selected for batch import
  const [selectedTmdbIds, setSelectedTmdbIds] = useState<number[]>([]);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  // Direct ID input
  const [directId, setDirectId] = useState('');
  const [isImportingDirect, setIsImportingDirect] = useState(false);

  // Existing slugs / TMDB IDs set for fast check
  const existingTmdbIds = new Set(
    existingMovies
      .map((m) => (m.tmdb_id ? Number(m.tmdb_id) : null))
      .filter(Boolean)
  );
  const existingSlugs = new Set(existingMovies.map((m) => m.slug));
  const existingTitles = new Set(existingMovies.map((m) => m.title.toLowerCase().trim()));

  const isMovieInDb = (item: TmdbMovieResult) => {
    if (existingTmdbIds.has(item.id)) return true;
    const year = item.release_date ? new Date(item.release_date).getFullYear() : '';
    const expectedSlug = `${generateSlug(item.title)}-${year}`;
    if (existingSlugs.has(expectedSlug)) return true;
    if (existingTitles.has(item.title.toLowerCase().trim())) return true;
    return false;
  };

  // Load initial preset
  useEffect(() => {
    loadPreset('trending', 1);
  }, []);

  const loadPreset = async (
    preset: 'trending' | 'popular' | 'top_rated' | 'now_playing' | 'indonesia',
    page = 1,
    isRefresh = false
  ) => {
    setActivePreset(preset);
    setSearchQuery('');
    setCurrentPage(page);
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);
    setSelectedTmdbIds([]);
    try {
      const data = await getTmdbPresetMovies(preset, page);
      setResults(data.results || []);
      setTotalPages(Math.min(data.total_pages || 1, 500));
      if (isRefresh) {
        showToast('Daftar film TMDB berhasil diperbarui!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat daftar film dari TMDB');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery.trim(), currentPage, true);
    } else {
      loadPreset(activePreset, currentPage, true);
    }
  };

  const handleSearch = async (query: string, page = 1, isRefresh = false) => {
    if (!query.trim()) return;

    setCurrentPage(page);
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);
    setSelectedTmdbIds([]);
    try {
      const data = await searchTmdbMovies(query.trim(), page);
      setResults(data.results || []);
      setTotalPages(Math.min(data.total_pages || 1, 500));
      if (isRefresh) {
        showToast('Hasil pencarian berhasil diperbarui!');
      } else if (!data.results || data.results.length === 0) {
        showToast('Tidak ada film yang ditemukan untuk kata kunci tersebut.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mencari film di TMDB');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    handleSearch(searchQuery.trim(), 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (searchQuery.trim()) {
      handleSearch(searchQuery.trim(), newPage);
    } else {
      loadPreset(activePreset, newPage);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Import single movie by TMDB ID
  const handleImportSingle = async (tmdbId: number) => {
    setImportingId(tmdbId);
    try {
      const detail = await getTmdbMovieDetails(tmdbId);
      const movie = convertTmdbDetailsToMovie(detail, apiConfig);
      if (typeof onImportSingleMovie === 'function') {
        await onImportSingleMovie(movie);
      } else if (typeof onSaveMovie === 'function') {
        await onSaveMovie(movie);
      }
      showToast(`Film "${movie.title}" berhasil diimport ke katalog & database!`);
    } catch (err: any) {
      showToast(`Gagal mengimport: ${err.message || err}`);
    } finally {
      setImportingId(null);
    }
  };

  // Import Direct by TMDB ID or IMDb ID
  const handleImportDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directId.trim()) return;

    setIsImportingDirect(true);
    try {
      const detail = await getTmdbMovieDetails(directId.trim());
      const movie = convertTmdbDetailsToMovie(detail, apiConfig);
      if (typeof onImportSingleMovie === 'function') {
        await onImportSingleMovie(movie);
      } else if (typeof onSaveMovie === 'function') {
        await onSaveMovie(movie);
      }
      showToast(`Film "${movie.title}" (${movie.year}) berhasil diimport!`);
      setDirectId('');
    } catch (err: any) {
      showToast(`Gagal mengimport ID ${directId}: ${err.message || 'ID tidak ditemukan'}`);
    } finally {
      setIsImportingDirect(false);
    }
  };

  // Filtered results based on hideAlreadyInDb
  const filteredResults = hideAlreadyInDb
    ? results.filter((item) => !isMovieInDb(item))
    : results;

  const alreadyInDbCount = results.filter((item) => isMovieInDb(item)).length;
  const newMoviesCount = results.length - alreadyInDbCount;

  // Bulk import selected movies
  const handleBulkImport = async () => {
    if (selectedTmdbIds.length === 0) return;

    setIsBulkImporting(true);
    setBulkProgress({ current: 0, total: selectedTmdbIds.length });

    const importedList: Movie[] = [];
    let successCount = 0;

    for (let i = 0; i < selectedTmdbIds.length; i++) {
      const id = selectedTmdbIds[i];
      setBulkProgress({ current: i + 1, total: selectedTmdbIds.length });
      try {
        const detail = await getTmdbMovieDetails(id);
        const movie = convertTmdbDetailsToMovie(detail, apiConfig);
        importedList.push(movie);
        successCount++;
      } catch (err) {
        console.warn(`Failed importing ID ${id}`, err);
      }
    }

    if (importedList.length > 0) {
      if (typeof onBulkImportMovies === 'function') {
        await onBulkImportMovies(importedList);
      } else {
        for (const m of importedList) {
          if (typeof onImportSingleMovie === 'function') await onImportSingleMovie(m);
          else if (typeof onSaveMovie === 'function') await onSaveMovie(m);
        }
      }
      showToast(`Sukses mengimport ${successCount} film ke database & katalog!`);
      setSelectedTmdbIds([]);
    } else {
      showToast('Gagal mengimport film yang dipilih.');
    }

    setIsBulkImporting(false);
    setBulkProgress(null);
  };

  const handleToggleSelect = (id: number) => {
    setSelectedTmdbIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleIds = filteredResults.map((r) => r.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedTmdbIds.includes(id));
    if (allSelected) {
      setSelectedTmdbIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedTmdbIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const isAllVisibleSelected =
    filteredResults.length > 0 &&
    filteredResults.every((r) => selectedTmdbIds.includes(r.id));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Search & Preset Banner */}
      <div className="bg-[#0B0B10] border border-[#1C1C26] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#F9F9F9] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E50914]" />
              <span>Pencarian & Import Film Otomatis (TMDB API)</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#8E8E93] mt-0.5">
              Cari jutaan judul film dunia atau pilih preset trending untuk diimport ke website dengan 1 klik lengkap dengan player video multi-server.
            </p>
          </div>

          {/* Right Action: Refresh Button & Direct ID Quick Import */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="refresh-tmdb-movies-btn"
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              title="Refresh / Muat Ulang Film Baru dari API TMDB"
              className="px-3.5 py-2 rounded-xl bg-[#181824] hover:bg-[#222232] border border-[#2D2D3E] hover:border-emerald-500/40 text-[#E0E0E6] hover:text-emerald-400 font-bold text-xs flex items-center gap-2 transition shrink-0 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Refresh Film Baru'}</span>
            </button>

            <form onSubmit={handleImportDirect} className="flex items-center gap-2">
              <input
                id="input-direct-tmdb-id"
                type="text"
                value={directId}
                onChange={(e) => setDirectId(e.target.value)}
                placeholder="Input TMDB ID..."
                className="bg-[#07070B] border border-[#222230] rounded-xl px-3 py-2 text-xs text-[#F9F9F9] placeholder-[#636370] font-mono outline-none w-32 focus:border-[#E50914]"
              />
              <button
                id="import-direct-id-btn"
                type="submit"
                disabled={isImportingDirect || !directId.trim()}
                className="px-3 py-2 rounded-xl bg-[#E50914] hover:bg-[#F40612] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-md shadow-[#E50914]/25"
              >
                {isImportingDirect ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Import ID</span>
              </button>
            </form>
          </div>
        </div>

        {/* Search Bar Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            id="api-search-movie-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul film... (contoh: Avatar, Spider-Man, Pengabdi Setan, Oppenheimer, Naruto, Avengers)"
            className="w-full bg-[#060609] border border-[#1F1F2C] focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] rounded-xl pl-11 pr-24 py-3 text-sm text-[#F9F9F9] placeholder-[#5A5A6A] outline-none transition"
          />
          <Search className="w-5 h-5 text-[#8E8E93] absolute left-3.5 top-3.5 pointer-events-none" />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadPreset(activePreset, 1);
              }}
              className="absolute right-24 top-3 text-[#71717A] hover:text-[#F9F9F9] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            id="api-search-submit-btn"
            type="submit"
            disabled={isLoading || isRefreshing}
            className="absolute right-1.5 top-1.5 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#F40612] text-white font-bold text-xs flex items-center gap-1.5 transition"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Cari</span>
          </button>
        </form>

        {/* Preset Discovery Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[#8E8E93] font-semibold shrink-0">Preset:</span>

          <button
            id="preset-trending-btn"
            type="button"
            onClick={() => loadPreset('trending', 1)}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
              activePreset === 'trending' && !searchQuery
                ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/30'
                : 'bg-[#14141C] text-[#A1A1AA] hover:text-[#F9F9F9] border border-[#20202C]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>⚡ Trending Hari Ini</span>
          </button>

          <button
            id="preset-indonesia-btn"
            type="button"
            onClick={() => loadPreset('indonesia', 1)}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
              activePreset === 'indonesia' && !searchQuery
                ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/30'
                : 'bg-[#14141C] text-[#A1A1AA] hover:text-[#F9F9F9] border border-[#20202C]'
            }`}
          >
            <span>🇮🇩 Film Indonesia</span>
          </button>

          <button
            id="preset-popular-btn"
            type="button"
            onClick={() => loadPreset('popular', 1)}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
              activePreset === 'popular' && !searchQuery
                ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/30'
                : 'bg-[#14141C] text-[#A1A1AA] hover:text-[#F9F9F9] border border-[#20202C]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>🌟 Populer Global</span>
          </button>

          <button
            id="preset-now-playing-btn"
            type="button"
            onClick={() => loadPreset('now_playing', 1)}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
              activePreset === 'now_playing' && !searchQuery
                ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/30'
                : 'bg-[#14141C] text-[#A1A1AA] hover:text-[#F9F9F9] border border-[#20202C]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>🎬 Sedang Tayang</span>
          </button>

          <button
            id="preset-top-rated-btn"
            type="button"
            onClick={() => loadPreset('top_rated', 1)}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
              activePreset === 'top_rated' && !searchQuery
                ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/30'
                : 'bg-[#14141C] text-[#A1A1AA] hover:text-[#F9F9F9] border border-[#20202C]'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>🏆 Rating Tertinggi</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar (Hide already in database + Batch Actions + Refresh Status) */}
      {results.length > 0 && (
        <div className="bg-[#0D0D14] border border-[#222230] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex flex-wrap items-center gap-4">
            {/* Select All Checkbox */}
            <button
              id="select-all-results-btn"
              type="button"
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs font-semibold text-[#A1A1AA] hover:text-[#F9F9F9]"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                  isAllVisibleSelected
                    ? 'bg-[#E50914] border-[#E50914] text-white'
                    : 'border-[#444456]'
                }`}
              >
                {isAllVisibleSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>
                Pilih Semua ({selectedTmdbIds.length} dari {filteredResults.length} film tampil)
              </span>
            </button>

            <span className="hidden sm:inline text-[#333344]">|</span>

            {/* Toggle: Hide already in database */}
            <button
              id="toggle-hide-existing-movies-btn"
              type="button"
              onClick={() => {
                const nextVal = !hideAlreadyInDb;
                setHideAlreadyInDb(nextVal);
                showToast(
                  nextVal
                    ? 'Menyembunyikan film yang sudah ada di database'
                    : 'Menampilkan semua film dari API'
                );
              }}
              className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                hideAlreadyInDb
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/60'
                  : 'bg-[#161622] border-[#2A2A3C] text-[#9E9EA8] hover:text-white'
              }`}
            >
              {hideAlreadyInDb ? (
                <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-[#9E9EA8]" />
              )}
              <span>Sembunyikan yang sudah di database</span>
              {alreadyInDbCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-md font-mono ${
                    hideAlreadyInDb ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white'
                  }`}
                >
                  {alreadyInDbCount} disembunyikan
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Refresh Icon */}
            <button
              id="quick-refresh-btn"
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              title="Perbarui daftar film dari TMDB"
              className="p-2 rounded-lg bg-[#161622] hover:bg-[#202030] text-[#A1A1AA] hover:text-white border border-[#252535] transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Batch Import Button */}
            {selectedTmdbIds.length > 0 && (
              <button
                id="batch-import-selected-btn"
                type="button"
                disabled={isBulkImporting}
                onClick={handleBulkImport}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
              >
                {isBulkImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      Mengimport {bulkProgress?.current}/{bulkProgress?.total}...
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>📥 Import {selectedTmdbIds.length} Film Terpilih Sekaligus</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
          <p className="text-xs text-[#A1A1AA]">Mengambil data film terbaru dari TMDB API...</p>
        </div>
      )}

      {/* Movie Results Grid */}
      {!isLoading && filteredResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredResults.map((item) => {
            const isSelected = selectedTmdbIds.includes(item.id);
            const isAlreadyInDb = isMovieInDb(item);
            const isCurrentImporting = importingId === item.id;
            const releaseYear = item.release_date
              ? new Date(item.release_date).getFullYear()
              : 'N/A';
            const genres = mapGenreIdsToNames(item.genre_ids).slice(0, 2);

            return (
              <div
                key={item.id}
                className={`bg-[#0A0A0F] border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 group ${
                  isSelected
                    ? 'border-[#E50914] ring-1 ring-[#E50914]'
                    : isAlreadyInDb
                    ? 'border-emerald-500/30'
                    : 'border-[#1E1E2A] hover:border-[#2C2C3E]'
                }`}
              >
                {/* Poster & Badges */}
                <div className="relative aspect-[16/10] bg-black overflow-hidden">
                  <img
                    src={getTmdbImageUrl(item.backdrop_path || item.poster_path, 'w500')}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-black/60" />

                  {/* Select Checkbox Top Left */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(item.id);
                    }}
                    className="absolute top-2.5 left-2.5 z-10 cursor-pointer p-1 rounded-lg bg-black/60 backdrop-blur-md"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#E50914] border-[#E50914] text-white'
                          : 'border-white/50 bg-black/40'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* TMDB Rating Top Right */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-400 text-[11px] font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{item.vote_average ? item.vote_average.toFixed(1) : '7.0'}</span>
                  </div>

                  {/* Status if already in database */}
                  {isAlreadyInDb && (
                    <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Sudah Ada di Database</span>
                    </div>
                  )}
                </div>

                {/* Info Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#F9F9F9] line-clamp-1 group-hover:text-[#E50914] transition">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-[#8E8E93] mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#E50914]" />
                        {releaseYear}
                      </span>
                      <span>•</span>
                      <span className="text-[#A1A1AA]">{genres.join(', ')}</span>
                    </div>
                    <p className="text-xs text-[#8E8E93] line-clamp-2 mt-2 leading-relaxed">
                      {item.overview || 'Sinopsis belum tersedia dari TMDB.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#181824] flex items-center gap-2">
                    <button
                      id={`import-movie-btn-${item.id}`}
                      type="button"
                      disabled={isCurrentImporting || isBulkImporting}
                      onClick={() => handleImportSingle(item.id)}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                        isAlreadyInDb
                          ? 'bg-[#181824] hover:bg-[#222232] text-[#A1A1AA] hover:text-[#F9F9F9] border border-[#2A2A3A]'
                          : 'bg-[#E50914] hover:bg-[#F40612] text-white shadow-md shadow-[#E50914]/25'
                      } disabled:opacity-50`}
                    >
                      {isCurrentImporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengimport...</span>
                        </>
                      ) : isAlreadyInDb ? (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Re-Import (Perbarui)</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>⚡ 1-Click Import</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && results.length > 0 && (
        <div className="bg-[#0B0B10] border border-[#1C1C26] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#8E8E93]">
            Halaman <span className="text-white font-bold">{currentPage}</span> dari{' '}
            <span className="text-white font-bold">{totalPages}</span> (
            {newMoviesCount} film baru, {alreadyInDbCount} sudah di database)
          </div>

          <div className="flex items-center gap-2">
            <button
              id="prev-page-btn"
              type="button"
              disabled={currentPage <= 1 || isLoading || isRefreshing}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-3 py-1.5 rounded-lg bg-[#14141E] hover:bg-[#1E1E2C] disabled:opacity-40 text-xs font-bold text-[#E0E0E6] flex items-center gap-1 transition border border-[#252535]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              id="next-page-btn"
              type="button"
              disabled={currentPage >= totalPages || isLoading || isRefreshing}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-4 py-1.5 rounded-lg bg-[#E50914] hover:bg-[#F40612] disabled:opacity-40 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-md shadow-[#E50914]/20"
            >
              <span>Halaman Berikutnya ({currentPage + 1})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State when all movies in current page are already in DB */}
      {!isLoading && results.length > 0 && filteredResults.length === 0 && hideAlreadyInDb && (
        <div className="p-10 text-center bg-[#0B0B10] border border-[#1C1C26] rounded-2xl space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-[#F9F9F9]">
            Semua {results.length} Film di Halaman Ini Sudah Ada di Database!
          </h3>
          <p className="text-xs text-[#8E8E93] max-w-md mx-auto">
            Semua film di halaman ini telah berhasil Anda tambahkan sebelumnya. Klik <strong>"Halaman Berikutnya ({currentPage + 1})"</strong> untuk melihat film baru lainnya atau matikan filter sembunyikan.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setHideAlreadyInDb(false)}
              className="px-3.5 py-2 rounded-xl bg-[#181824] hover:bg-[#222230] text-xs font-bold text-white border border-[#2B2B3C] transition"
            >
              Tampilkan Semua ({results.length} Film)
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-xs font-bold text-white flex items-center gap-1.5 transition"
            >
              <span>Buka Halaman {currentPage + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State for no search results */}
      {!isLoading && results.length === 0 && (
        <div className="p-12 text-center bg-[#0B0B10] border border-[#1C1C26] rounded-2xl space-y-3">
          <Film className="w-12 h-12 text-[#52525B] mx-auto" />
          <h3 className="text-base font-bold text-[#F9F9F9]">Tidak Ada Hasil Film</h3>
          <p className="text-xs text-[#8E8E93] max-w-md mx-auto">
            Coba ketik kata kunci judul film lain di kolom pencarian di atas, atau klik salah satu tombol preset seperti <strong>⚡ Trending Hari Ini</strong>.
          </p>
        </div>
      )}
    </div>
  );
};

