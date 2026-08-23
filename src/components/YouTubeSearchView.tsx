import React, { useState, useEffect } from 'react';
import {
  Search,
  Play,
  Download,
  Plus,
  Check,
  Share2,
  ExternalLink,
  Film,
  Sparkles,
  RefreshCw,
  Clock,
  Radio,
  Tv,
  Eye,
  X,
  Youtube,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Movie, YouTubeVideoItem, AdConfig } from '../types';
import {
  searchYouTube,
  convertYouTubeToMovie,
  DEFAULT_YOUTUBE_API_KEY,
  extractYouTubeId,
  getYouTubeEmbedUrl,
} from '../services/youtubeService';
import { AdBannerSlot } from './AdBannerSlot';

interface YouTubeSearchViewProps {
  onSaveMovieToCatalog: (movieData: Omit<Movie, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
  onWatchMovie: (slug: string) => void;
  adConfig: AdConfig;
  showToast: (msg: string) => void;
  youtubeApiKey?: string;
  onOpenShareModal?: (data: any) => void;
}

const QUICK_PRESETS = [
  { label: '🇮🇩 Film Indonesia Full', query: 'film indonesia full movie' },
  { label: '🍿 Bioskop Sub Indo', query: 'film bioskop full movie sub indo' },
  { label: '👻 Horor Indonesia', query: 'film horor indonesia full movie' },
  { label: '💥 Action Full Movie', query: 'film action sub indo full movie' },
  { label: '🎭 Drakor Lengkap', query: 'drama korea full episode sub indo' },
  { label: '🎌 Anime Sub Indo', query: 'anime movie sub indo' },
  { label: '📽️ Film Pendek', query: 'film pendek indonesia' },
  { label: '🔴 Live Stream TV', query: 'live streaming indonesia tv' },
];

export const YouTubeSearchView: React.FC<YouTubeSearchViewProps> = ({
  onSaveMovieToCatalog,
  onWatchMovie,
  adConfig,
  showToast,
  youtubeApiKey,
  onOpenShareModal,
}) => {
  const [query, setQuery] = useState('film indonesia full movie');
  const [filterType, setFilterType] = useState<'movie' | 'all' | 'live'>('movie');
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePreviewVideo, setActivePreviewVideo] = useState<YouTubeVideoItem | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customLinkInput, setCustomLinkInput] = useState('');

  // Initial load search
  useEffect(() => {
    handleSearch('film indonesia full movie', 'movie');
  }, []);

  const handleSearch = async (searchQuery: string, type: 'movie' | 'all' | 'live' = filterType) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await searchYouTube({
        query: searchQuery,
        isMovie: type === 'movie',
        isLive: type === 'live',
        maxResults: 16,
        apiKey: youtubeApiKey || DEFAULT_YOUTUBE_API_KEY,
      });

      setVideos(res.items);
      if (res.items.length === 0) {
        showToast('Tidak ada video ditemukan di YouTube untuk pencarian ini.');
      } else {
        showToast(`Ditemukan ${res.items.length} tayangan dari YouTube!`);
      }
    } catch (err) {
      showToast('Gagal memuat pencarian dari YouTube.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query, filterType);
  };

  const handleSaveToCatalog = async (video: YouTubeVideoItem) => {
    try {
      setSavingId(video.id);
      const movieObj = convertYouTubeToMovie(video);
      await onSaveMovieToCatalog(movieObj);
      setSavedIds((prev) => new Set(prev).add(video.id));
      showToast(`"${video.title.slice(0, 25)}..." berhasil disimpan ke katalog film!`);
    } catch (err) {
      showToast('Gagal menyimpan film ke katalog.');
    } finally {
      setSavingId(null);
    }
  };

  const handleCopyLink = (video: YouTubeVideoItem) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?yt=${video.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(video.id);
    showToast('Tautan YouTube disalin ke clipboard!');
    setTimeout(() => setCopiedId(null), 2000);

    if (onOpenShareModal) {
      onOpenShareModal({
        title: video.title,
        thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
        backdrop: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
        synopsis: video.description || `Nonton tayangan ${video.title} dari ${video.channelTitle} kualitas HD di Tontonan Gratis.`,
        url: shareUrl,
        isLive: video.isLive,
        quality: video.isLive ? 'LIVE' : 'Full HD',
      });
    }
  };

  const handleAddCustomLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLinkInput.trim()) return;

    const extractedId = extractYouTubeId(customLinkInput);
    if (!extractedId) {
      showToast('URL YouTube atau ID Video tidak valid!');
      return;
    }

    const customVideo: YouTubeVideoItem = {
      id: extractedId,
      title: `Film YouTube (${extractedId})`,
      description: `Ditambahkan secara kustom dari URL: ${customLinkInput}`,
      thumbnail: `https://i.ytimg.com/vi/${extractedId}/hqdefault.jpg`,
      channelTitle: 'YouTube',
      publishedAt: new Date().toISOString(),
      embedUrl: getYouTubeEmbedUrl(extractedId, false),
    };

    try {
      const movieObj = convertYouTubeToMovie(customVideo);
      await onSaveMovieToCatalog(movieObj);
      showToast('Film YouTube kustom berhasil dimasukkan ke katalog!');
      setCustomLinkInput('');
      setVideos((prev) => [customVideo, ...prev]);
    } catch (err) {
      showToast('Gagal menyimpan film kustom.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F9F9F9] py-4 sm:py-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-600/40 text-red-400 text-xs font-bold mb-2">
            <Youtube className="w-4 h-4 text-red-500 fill-red-500" />
            <span>PENCARIAN FILM RESMI YOUTUBE API</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            Cari & Impor Film dari YouTube
          </h1>
          <p className="text-[#A1A1AA] text-xs sm:text-sm mt-1">
            Temukan film bioskop full movie, film pendek, drama, anime, dan siaran live langsung dari database YouTube ke katalog situsmu.
          </p>
        </div>

        {/* 1-Click Custom YouTube URL Import */}
        <form onSubmit={handleAddCustomLink} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={customLinkInput}
            onChange={(e) => setCustomLinkInput(e.target.value)}
            placeholder="Tempel Link Film YouTube..."
            className="flex-1 md:w-64 px-3.5 py-2 bg-[#0E0E14] border border-[#232330] rounded-xl text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-red-500 transition"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-[#1C1C28] hover:bg-[#252536] border border-[#303044] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Impor</span>
          </button>
        </form>
      </div>

      {/* Search Box & Controls */}
      <div className="p-4 sm:p-6 bg-[#0A0A10] border border-[#1C1C28] rounded-2xl mb-6 shadow-xl">
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul film, bioskop indonesia, action sub indo, horror, drama..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#050508] border border-[#242434] rounded-xl text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-red-500 transition"
            />
          </div>

          {/* Filter Type Radio Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-[#050508] border border-[#242434] rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => {
                setFilterType('movie');
                handleSearch(query, 'movie');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterType === 'movie'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Full Movie</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType('all');
                handleSearch(query, 'all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterType === 'all'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Video</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType('live');
                handleSearch(query, 'live');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterType === 'live'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Now</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 shrink-0"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{loading ? 'Mencari...' : 'Cari Film'}</span>
          </button>
        </form>

        {/* Quick Search Preset Tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[#71717A] shrink-0 font-medium">Pencarian Cepat:</span>
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setQuery(preset.query);
                const isLiveQuery = preset.query.includes('live');
                const t = isLiveQuery ? 'live' : 'movie';
                setFilterType(t);
                handleSearch(preset.query, t);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#14141E] hover:bg-[#1E1E2C] border border-[#222232] text-[#D1D1DB] hover:text-white font-semibold transition shrink-0 whitespace-nowrap"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Adsterra Banner Slot in YouTube Search */}
      {adConfig && adConfig.bannerTopEnabled && (
        <AdBannerSlot
          code={adConfig.bannerTopCode}
          enabled={adConfig.bannerTopEnabled}
          type="top"
        />
      )}

      {/* Video Results Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-red-500 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#A1A1AA]">
            Menghubungkan ke YouTube Data API v3 & mengambil hasil film...
          </p>
        </div>
      ) : videos.length === 0 ? (
        <div className="p-12 text-center bg-[#0A0A10] border border-[#1C1C28] rounded-2xl space-y-3">
          <Film className="w-12 h-12 text-[#52525B] mx-auto" />
          <h3 className="text-base font-bold text-white">Tidak Ada Hasil Ditemukan</h3>
          <p className="text-xs text-[#8E8E98]">
            Silakan coba kata kunci lain atau klik tombol pencarian cepat di atas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8E8E98] px-1">
            <span className="font-semibold text-white">
              Menampilkan {videos.length} Film dari YouTube
            </span>
            <span>Kualitas HD • Pemutar Cepat</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {videos.map((video) => {
              const isSaved = savedIds.has(video.id);
              const isSaving = savingId === video.id;
              const isCopied = copiedId === video.id;

              return (
                <div
                  key={video.id}
                  className="group bg-[#0A0A10] border border-[#1C1C28] hover:border-red-600/50 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col hover:shadow-xl hover:shadow-red-950/20"
                >
                  {/* Video Thumbnail */}
                  <div
                    className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                    onClick={() => setActivePreviewVideo(video)}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Play Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-bold text-red-400 border border-red-600/30 flex items-center gap-1">
                        <Youtube className="w-3 h-3 fill-red-500 text-red-500" />
                        YouTube
                      </span>
                    </div>

                    {video.isLive && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-red-600 text-[10px] font-black text-white animate-pulse">
                        LIVE
                      </span>
                    )}

                    {video.duration && (
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                        {video.duration}
                      </span>
                    )}
                  </div>

                  {/* Video Information */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3
                        onClick={() => setActivePreviewVideo(video)}
                        className="text-xs sm:text-sm font-bold text-white line-clamp-2 cursor-pointer hover:text-red-400 transition"
                        title={video.title}
                      >
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between gap-1 mt-1.5 text-[11px] text-[#8E8E98]">
                        <span className="font-medium truncate max-w-[130px]">{video.channelTitle}</span>
                        {video.viewCount && (
                          <span className="text-[10px] text-red-400/90 font-mono shrink-0">
                            {video.viewCount}
                          </span>
                        )}
                      </div>
                      {video.publishedAt && (
                        <p className="text-[10px] text-[#61616F] mt-0.5">
                          {video.publishedAt.includes('T') ? new Date(video.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : video.publishedAt}
                        </p>
                      )}
                    </div>

                    {/* Actions Toolbar */}
                    <div className="pt-2 border-t border-[#1C1C28] flex items-center justify-between gap-1.5">
                      {/* Play Preview Button */}
                      <button
                        onClick={() => setActivePreviewVideo(video)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Nonton</span>
                      </button>

                      {/* 1-Click Save to Catalog */}
                      <button
                        onClick={() => handleSaveToCatalog(video)}
                        disabled={isSaved || isSaving}
                        className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                          isSaved
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40 cursor-default'
                            : 'bg-[#151520] hover:bg-[#1E1E2E] text-white border-[#2A2A3C]'
                        }`}
                        title={isSaved ? 'Sudah tersimpan di katalog' : 'Simpan ke Katalog'}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">Tersimpan</span>
                          </>
                        ) : isSaving ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Simpan</span>
                          </>
                        )}
                      </button>

                      {/* Copy Share Link */}
                      <button
                        onClick={() => handleCopyLink(video)}
                        className="p-1.5 rounded-xl bg-[#151520] hover:bg-[#1E1E2E] border border-[#2A2A3C] text-[#A1A1AA] hover:text-white transition"
                        title="Salin Tautan YouTube"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Video Modal Preview */}
      {activePreviewVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#0A0A10] border border-[#222234] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#1C1C28] flex items-center justify-between">
              <div className="flex items-center gap-2 max-w-[80%]">
                <Youtube className="w-5 h-5 text-red-500 fill-red-500 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {activePreviewVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActivePreviewVideo(null)}
                className="p-1.5 rounded-lg bg-[#14141E] hover:bg-[#202030] text-[#A1A1AA] hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`${activePreviewVideo.embedUrl}&autoplay=1`}
                title={activePreviewVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-[#0E0E16] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-white">
                  Channel: {activePreviewVideo.channelTitle}
                </p>
                <p className="text-[11px] text-[#8E8E98] line-clamp-1 mt-0.5">
                  {activePreviewVideo.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSaveToCatalog(activePreviewVideo)}
                  disabled={savedIds.has(activePreviewVideo.id)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
                >
                  {savedIds.has(activePreviewVideo.id) ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Sudah di Katalog</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Tambahkan ke Katalog Film</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setActivePreviewVideo(null)}
                  className="px-4 py-2 rounded-xl bg-[#181824] hover:bg-[#222232] text-[#A1A1AA] hover:text-white text-xs font-semibold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
