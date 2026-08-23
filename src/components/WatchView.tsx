import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Star,
  Clock,
  Eye,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Film,
  Send,
  MessageCircle,
  Play,
  Server,
  Radio,
  Tv,
  Globe,
} from 'lucide-react';
import { Movie, AdConfig, MovieServer } from '../types';
import { AdBannerSlot } from './AdBannerSlot';
import { generateMovieServers, createEmbedHtml, sanitizeEmbedUrl } from '../services/movieApiService';
import { getMovieCountry } from '../utils/countryHelper';
import { updateDocumentMeta } from '../utils/metaHelper';
import confetti from 'canvas-confetti';

interface WatchViewProps {
  movie: Movie;
  allMovies: Movie[];
  adConfig: AdConfig;
  onBack: () => void;
  onSelectMovie: (slug: string) => void;
  onIncrementViews: (id: string) => void;
  showToast: (msg: string) => void;
  onOpenShareModal?: (movie: Movie) => void;
}

export const WatchView: React.FC<WatchViewProps> = ({
  movie,
  allMovies,
  adConfig,
  onBack,
  onSelectMovie,
  onIncrementViews,
  showToast,
  onOpenShareModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);

  // Compute available streaming servers
  const availableServers: MovieServer[] = useMemo(() => {
    let serversList: MovieServer[] = [];
    if (movie.servers && movie.servers.length > 0) {
      serversList = movie.servers;
    } else if (movie.tmdb_id) {
      serversList = generateMovieServers(movie.tmdb_id, movie.imdb_id);
    }
    return serversList.map((srv) => ({
      ...srv,
      url: sanitizeEmbedUrl(srv.url),
    }));
  }, [movie]);

  const [activeServerId, setActiveServerId] = useState<string>(() => {
    if (availableServers.length > 0) {
      return availableServers[0].id;
    }
    return 'default';
  });

  const [showingTrailer, setShowingTrailer] = useState(false);

  // Reset active server when movie changes
  useEffect(() => {
    if (availableServers.length > 0) {
      setActiveServerId(availableServers[0].id);
    } else {
      setActiveServerId('default');
    }
    setShowingTrailer(false);
    setPlayerKey((k) => k + 1);
  }, [movie.id, availableServers]);

  // Determine current active embed HTML
  const currentEmbedCode = useMemo(() => {
    if (showingTrailer && movie.trailer_url) {
      return createEmbedHtml(movie.trailer_url, `${movie.title} - Official Trailer`);
    }

    if (availableServers.length > 0) {
      const server = availableServers.find((s) => s.id === activeServerId) || availableServers[0];
      return createEmbedHtml(sanitizeEmbedUrl(server.url), `${movie.title} - ${server.name}`);
    }

    return sanitizeEmbedUrl(movie.embed_code);
  }, [movie, activeServerId, showingTrailer, availableServers]);

  // Increment views once on mount and update document meta for browser/social sharing
  useEffect(() => {
    onIncrementViews(movie.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const movieUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?slug=${movie.slug}` : `https://tontonangratis.app/?slug=${movie.slug}`;
    updateDocumentMeta({
      title: `Nonton Film ${movie.title} (${movie.year || 'Full Movie'}) Full HD`,
      description: movie.synopsis || `Nonton streaming ${movie.title} gratis kualitas HD dengan multi-server video player.`,
      image: movie.backdrop || movie.thumbnail,
      url: movieUrl,
    });
  }, [movie.id]);

  // Construct shortlink URL
  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?slug=${movie.slug}` : `https://tontonangratis.app/?slug=${movie.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    showToast('Tautan film berhasil disalin ke clipboard!');

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // Ignored
    }

    setTimeout(() => setCopied(false), 2500);
  };

  const handlePopunderClick = () => {
    if (adConfig.popunderEnabled && adConfig.popunderUrl) {
      window.open(adConfig.popunderUrl, '_blank');
    }
  };

  // Social share URLs
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedText = encodeURIComponent(`Nonton film "${movie.title}" streaming gratis kualitas HD tanpa buffering di Tontonan Gratis!`);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
  };

  // Related movies
  const relatedMovies = allMovies
    .filter((m) => m.id !== movie.id)
    .slice(0, 4);

  return (
    <div className="w-full pb-16">
      {/* Top Header Navigation */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <button
          id="back-to-catalog-btn"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#0E0E14] border border-[#20202A] text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#161620] transition text-xs sm:text-sm font-semibold shrink-0"
        >
          <ArrowLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#E50914]" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-[#8E8E93] truncate">
          <span className="hidden sm:inline">Sedang Menonton:</span>
          <span className="text-[#E50914] font-bold truncate max-w-[160px] xs:max-w-[240px] sm:max-w-[320px]">{movie.title}</span>
        </div>
      </div>

      <div className={`${theaterMode ? 'max-w-full px-2 sm:px-4' : 'max-w-6xl px-3 sm:px-6'} mx-auto transition-all duration-300`}>
        
        {/* Adsterra Top Banner Slot */}
        <AdBannerSlot
          code={adConfig.bannerTopCode}
          enabled={adConfig.bannerTopEnabled}
          type="top"
          onAdClick={handlePopunderClick}
        />

        {/* Server Selector Bar if multi-servers exist */}
        {(availableServers.length > 0 || movie.trailer_url) && (
          <div className="mb-3 p-2.5 sm:p-3 rounded-2xl bg-[#09090E] border border-[#1C1C28] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-lg">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 -mx-1 px-1">
              <div className="flex items-center gap-1 text-xs text-[#8E8E93] font-bold shrink-0 mr-1">
                <Server className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#E50914]" />
                <span className="text-[11px] sm:text-xs">Server:</span>
              </div>

              {availableServers.map((srv, idx) => {
                const isActive = !showingTrailer && activeServerId === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      setShowingTrailer(false);
                      setActiveServerId(srv.id);
                      setPlayerKey((k) => k + 1);
                      showToast(`Beralih ke ${srv.name}`);
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/30 ring-1 ring-white/20'
                        : 'bg-[#12121A] text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#1A1A26] border border-[#1E1E2C]'
                    }`}
                  >
                    <Radio className={`w-3 h-3 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                    <span>Server {idx + 1} ({srv.name.replace(/Server \d+ - /g, '')})</span>
                    {srv.quality && (
                      <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-black/30 text-white' : 'bg-[#1E1E2C] text-[#8E8E93]'}`}>
                        {srv.quality}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Official Trailer Button if available */}
              {movie.trailer_url && (
                <button
                  type="button"
                  onClick={() => {
                    setShowingTrailer(true);
                    setPlayerKey((k) => k + 1);
                    showToast('Memutar Trailer Resmi');
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    showingTrailer
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40 ring-1 ring-white/20'
                      : 'bg-[#12121A] text-amber-400 hover:bg-[#1A1A26] border border-amber-500/30'
                  }`}
                >
                  <Tv className="w-3 h-3 text-amber-400" />
                  <span>🎬 Trailer</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-[#71717A] hidden lg:block shrink-0">
              💡 <em>Jika buffering, coba server lain.</em>
            </p>
          </div>
        )}

        {/* Video Player Wrapper */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-[#1E1E28] shadow-2xl mb-4 group">
          
          {/* Player Controls Bar Top */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-[#08080C] border-b border-[#1A1A24] text-xs text-[#8E8E93]">
            <div className="flex items-center gap-1.5 sm:gap-2 font-medium truncate mr-2">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#E50914] animate-pulse shrink-0" />
              <span className="text-[#F9F9F9] font-semibold truncate text-xs sm:text-sm">{movie.title}</span>
              {showingTrailer ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] sm:text-[10px] font-black shrink-0">
                  TRAILER
                </span>
              ) : movie.quality ? (
                <span className="px-1.5 py-0.5 rounded bg-[#E50914]/20 text-[#E50914] text-[9px] sm:text-[10px] font-black shrink-0">
                  {movie.quality}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setPlayerKey((prev) => prev + 1)}
                title="Muat Ulang Pemutar"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-[#14141C] hover:bg-[#1C1C26] border border-[#20202C] text-[#A1A1AA] hover:text-[#F9F9F9] transition text-[11px] sm:text-xs"
              >
                <RotateCcw className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span className="hidden sm:inline">Reload</span>
              </button>

              <button
                onClick={() => setTheaterMode(!theaterMode)}
                title={theaterMode ? 'Mode Standar' : 'Mode Bioskop / Theater'}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-[#14141C] hover:bg-[#1C1C26] border border-[#20202C] text-[#A1A1AA] hover:text-[#F9F9F9] transition text-[11px] sm:text-xs"
              >
                {theaterMode ? (
                  <>
                    <Minimize2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                    <span className="hidden sm:inline">Kecilkan</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                    <span className="hidden sm:inline">Theater</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Player Container with Aspect Ratio */}
          <div
            key={playerKey}
            ref={playerRef}
            className={`w-full ${
              theaterMode ? 'aspect-[21/9] max-h-[80vh]' : 'aspect-video'
            } bg-black flex items-center justify-center relative overflow-hidden`}
          >
            {currentEmbedCode ? (
              <div
                className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 [&>video]:w-full [&>video]:h-full"
                dangerouslySetInnerHTML={{ __html: currentEmbedCode }}
              />
            ) : (
              <div className="text-center p-6 sm:p-8">
                <Film className="w-10 h-10 sm:w-12 sm:h-12 text-[#52525B] mx-auto mb-3" />
                <p className="text-[#A1A1AA] text-xs sm:text-sm mb-2">Kode embed pemutar video belum dikonfigurasi.</p>
                <p className="text-[11px] text-[#71717A]">Buka Admin Panel untuk menambahkan iframe player.</p>
              </div>
            )}
          </div>
        </div>

        {/* Shortlink & Social Media Share Section */}
        <div className="bg-[#0B0B10] border border-[#1C1C26] p-4 sm:p-6 rounded-2xl mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Share2 className="w-4 h-4 text-[#E50914]" />
                <h3 className="font-bold text-sm sm:text-lg text-[#F9F9F9]">
                  Bagikan Film Ini & Dapatkan Shortlink
                </h3>
              </div>
              <p className="text-[#A1A1AA] text-xs sm:text-sm">
                Salin tautan pendek instan di bawah ini atau bagikan langsung ke media sosial untuk menonton bersama teman.
              </p>
            </div>

            {/* Quick direct sponsor link if configured */}
            {adConfig.adsterraDirectLink && (
              <a
                href={adConfig.adsterraDirectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold self-start md:self-auto transition shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Download Film HD</span>
                <ExternalLink className="w-3 h-3 text-amber-400" />
              </a>
            )}
          </div>

          {/* Shortlink Box */}
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <div className="flex-1 bg-[#060609] border border-[#1F1F2C] rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-mono text-[#E50914] truncate select-all">
              {currentUrl}
            </div>
            <button
              id="copy-shortlink-btn"
              onClick={handleCopyLink}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#E50914] hover:bg-[#F40612] active:bg-[#B80710] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shrink-0 shadow-lg shadow-[#E50914]/25"
            >
              {copied ? <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> : <Copy className="w-3.5 sm:w-4 h-3.5 sm:h-4" />}
              <span>{copied ? 'Tersalin' : 'Salin Tautan'}</span>
            </button>
          </div>

          {/* Social Share Icons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#181822]">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs text-[#8E8E93] mr-1 font-medium">Bagikan Ke:</span>

              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <a
                href={shareLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/30 text-[#229ED9] text-xs font-semibold transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </a>

              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/30 text-[#1877F2] text-xs font-semibold transition"
              >
                <span>Facebook</span>
              </a>

              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#1DA1F2]/15 hover:bg-[#1DA1F2]/25 border border-[#1DA1F2]/30 text-[#1DA1F2] text-xs font-semibold transition"
              >
                <span>Twitter / X</span>
              </a>
            </div>

            {onOpenShareModal && (
              <button
                onClick={() => onOpenShareModal(movie)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181824] hover:bg-[#222232] border border-[#2A2A3C] text-[#F9F9F9] text-xs font-semibold transition hover:text-[#E50914]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Pratinjau Kartu Thumbnail</span>
              </button>
            )}
          </div>
        </div>

        {/* Movie Info & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                {(() => {
                  const country = getMovieCountry(movie);
                  return country ? (
                    <span
                      title={`Negara: ${country.name}`}
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-950/60 text-sky-300 border border-sky-600/40 flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="text-sm">{country.flag}</span>
                      <span>{country.name}</span>
                    </span>
                  ) : null;
                })()}
                {movie.genres?.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#14141C] text-[#F9F9F9] border border-[#20202C]"
                  >
                    {g}
                  </span>
                ))}
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-[#F9F9F9] tracking-wide leading-tight">
                {movie.title}
              </h1>
            </div>

            {/* Quick Specs */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#8E8E93] py-2 border-y border-[#181822]">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-amber-400" />
                <span>{movie.rating ? movie.rating.toFixed(1) : '8.0'}</span>
                <span className="text-[#555] font-normal">/ 10</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#E50914]" />
                <span>{movie.duration || '2 Jam'}</span>
              </div>
              <span>•</span>
              <div>{movie.year || 2024}</div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#8E8E93]" />
                <span>{movie.views ? movie.views.toLocaleString('id-ID') : 1} ditonton</span>
              </div>
              {movie.quality && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    {movie.quality} UHD
                  </span>
                </>
              )}
            </div>

            {/* Synopsis */}
            <div>
              <h4 className="text-sm font-bold text-[#F9F9F9] mb-1.5">Sinopsis</h4>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {movie.synopsis || 'Sinopsis belum tersedia untuk film ini.'}
              </p>
            </div>
          </div>

          {/* Right Poster Thumbnail */}
          <div className="hidden lg:block">
            <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#14141C] border border-[#20202C] shadow-xl">
              <img
                src={movie.thumbnail}
                alt={movie.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Banner Ad (300x250 / Rectangle) */}
        <AdBannerSlot
          code={adConfig.bannerBottomCode}
          enabled={adConfig.bannerBottomEnabled}
          type="bottom"
          onAdClick={handlePopunderClick}
        />

        {/* Related / Recommended Movies */}
        {relatedMovies.length > 0 && (
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[#181822]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#E50914] rounded-full" />
              <h3 className="text-base sm:text-lg font-bold text-[#F9F9F9]">
                Rekomendasi Film Serupa
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {relatedMovies.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSelectMovie(m.slug)}
                  className="group bg-[#0A0A0E] border border-[#181822] hover:border-[#E50914]/50 rounded-xl overflow-hidden cursor-pointer transition shadow-md flex flex-col justify-between"
                >
                  <div className="aspect-[16/10] bg-black overflow-hidden relative">
                    <img
                      src={m.thumbnail}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-[#E50914] flex items-center justify-center text-white shadow-lg">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h5 className="text-xs font-bold text-[#F9F9F9] line-clamp-1 group-hover:text-[#E50914] transition">
                      {m.title}
                    </h5>
                    <div className="flex items-center justify-between text-[10px] text-[#8E8E93] mt-1">
                      <span>{m.year || 2024}</span>
                      <span className="text-amber-400 font-semibold">★ {m.rating || 8.0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
