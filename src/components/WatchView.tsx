import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Movie, AdConfig } from '../types';
import { AdBannerSlot } from './AdBannerSlot';
import confetti from 'canvas-confetti';

interface WatchViewProps {
  movie: Movie;
  allMovies: Movie[];
  adConfig: AdConfig;
  onBack: () => void;
  onSelectMovie: (slug: string) => void;
  onIncrementViews: (id: string) => void;
  showToast: (msg: string) => void;
}

export const WatchView: React.FC<WatchViewProps> = ({
  movie,
  allMovies,
  adConfig,
  onBack,
  onSelectMovie,
  onIncrementViews,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);

  // Increment views once on mount
  useEffect(() => {
    onIncrementViews(movie.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <button
          id="back-to-catalog-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0E0E14] border border-[#20202A] text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#161620] transition text-xs sm:text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4 text-[#E50914]" />
          <span>Kembali ke Katalog</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
          <span className="hidden sm:inline">Sedang Menonton:</span>
          <span className="text-[#E50914] font-bold truncate max-w-[200px]">{movie.title}</span>
        </div>
      </div>

      <div className={`${theaterMode ? 'max-w-full px-2 sm:px-4' : 'max-w-6xl px-4 sm:px-6'} mx-auto transition-all duration-300`}>
        
        {/* Adsterra Top Banner Slot */}
        <AdBannerSlot
          code={adConfig.bannerTopCode}
          enabled={adConfig.bannerTopEnabled}
          type="top"
          onAdClick={handlePopunderClick}
        />

        {/* Video Player Wrapper */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-[#1E1E28] shadow-2xl mb-4 group">
          
          {/* Player Controls Bar Top */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#08080C] border-b border-[#1A1A24] text-xs text-[#8E8E93]">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-pulse" />
              <span className="text-[#F9F9F9] font-semibold">{movie.title}</span>
              {movie.quality && (
                <span className="px-1.5 py-0.5 rounded bg-[#E50914]/20 text-[#E50914] text-[10px] font-black">
                  {movie.quality}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPlayerKey((prev) => prev + 1)}
                title="Muat Ulang Pemutar"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14141C] hover:bg-[#1C1C26] border border-[#20202C] text-[#A1A1AA] hover:text-[#F9F9F9] transition text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reload</span>
              </button>

              <button
                onClick={() => setTheaterMode(!theaterMode)}
                title={theaterMode ? 'Mode Standar' : 'Mode Bioskop / Theater'}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14141C] hover:bg-[#1C1C26] border border-[#20202C] text-[#A1A1AA] hover:text-[#F9F9F9] transition text-xs"
              >
                {theaterMode ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Kecilkan</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
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
            {movie.embed_code ? (
              <div
                className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 [&>video]:w-full [&>video]:h-full"
                dangerouslySetInnerHTML={{ __html: movie.embed_code }}
              />
            ) : (
              <div className="text-center p-8">
                <Film className="w-12 h-12 text-[#52525B] mx-auto mb-3" />
                <p className="text-[#A1A1AA] text-sm mb-2">Kode embed pemutar video belum dikonfigurasi.</p>
                <p className="text-xs text-[#71717A]">Buka Admin Panel untuk menambahkan iframe player.</p>
              </div>
            )}
          </div>
        </div>

        {/* Shortlink & Social Media Share Section */}
        <div className="bg-[#0B0B10] border border-[#1C1C26] p-5 sm:p-6 rounded-2xl mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Share2 className="w-4 h-4 text-[#E50914]" />
                <h3 className="font-bold text-base sm:text-lg text-[#F9F9F9]">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold self-start md:self-auto transition shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Download Film HD</span>
                <ExternalLink className="w-3 h-3 text-amber-400" />
              </a>
            )}
          </div>

          {/* Copy Shortlink Bar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-grow">
              <input
                id="short-link-display-input"
                type="text"
                readOnly
                value={currentUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full bg-[#050505] border border-[#22222C] px-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#D4D4D8] font-mono focus:outline-none focus:border-[#E50914] select-all"
              />
            </div>
            <button
              id="copy-shortlink-action-btn"
              onClick={handleCopyLink}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-md ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#E50914] hover:bg-[#F40612] text-white shadow-[#E50914]/25'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>

          {/* Social Share Buttons */}
          <div className="flex flex-wrap gap-2.5 pt-2.5 border-t border-[#181822]">
            <a
              id="share-whatsapp-link"
              href={shareLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/90 hover:bg-[#25D366] text-white text-xs font-bold transition shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <a
              id="share-facebook-link"
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1877F2]/90 hover:bg-[#1877F2] text-white text-xs font-bold transition shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </a>

            <a
              id="share-twitter-link"
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1D9BF0]/90 hover:bg-[#1D9BF0] text-white text-xs font-bold transition shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Twitter / X</span>
            </a>

            <a
              id="share-telegram-link"
              href={shareLinks.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#229ED9]/90 hover:bg-[#229ED9] text-white text-xs font-bold transition shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </a>
          </div>
        </div>

        {/* Movie Details & Synopsis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Main Info (2 cols) */}
          <div className="lg:col-span-2 bg-[#0B0B10] border border-[#1C1C26] p-6 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              {movie.rating && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {movie.rating} / 10
                </span>
              )}
              {movie.year && (
                <span className="px-2.5 py-1 rounded-lg bg-[#14141C] border border-[#20202C] text-[#A1A1AA] text-xs font-semibold">
                  Tahun {movie.year}
                </span>
              )}
              {movie.duration && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14141C] border border-[#20202C] text-[#A1A1AA] text-xs font-semibold">
                  <Clock className="w-3 h-3 text-[#71717A]" />
                  {movie.duration}
                </span>
              )}
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14141C] border border-[#20202C] text-[#8E8E93] text-xs">
                <Eye className="w-3 h-3" />
                {(movie.views || 0) + 1} Ditonton
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#F9F9F9] mb-4">
              {movie.title}
            </h1>

            {/* Genre Chips */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 rounded-lg bg-[#14141C] border border-[#22222E] text-[#A1A1AA] text-xs font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <div className="border-t border-[#181822] pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-2">
                Sinopsis & Alur Cerita
              </h3>
              <p className="text-[#A1A1AA] text-sm leading-relaxed whitespace-pre-line">
                {movie.synopsis ||
                  'Nikmati streaming film gratis full HD berkualitas tinggi langsung di halaman ini tanpa registrasi.'}
              </p>
            </div>
          </div>

          {/* Quick Poster Thumbnail & Short Info Sidebar */}
          <div className="bg-[#0B0B10] border border-[#1C1C26] p-5 rounded-2xl flex flex-col items-center text-center">
            <div className="w-36 aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-[#1C1C26] mb-3 bg-[#050505]">
              <img
                src={movie.thumbnail}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="font-bold text-sm text-[#F9F9F9] mb-1">{movie.title}</h4>
            <span className="text-[11px] font-mono text-[#71717A] mb-3">Slug: {movie.slug}</span>

            <div className="w-full bg-[#050505] p-3 rounded-xl border border-[#1A1A24] text-left text-xs space-y-2 text-[#A1A1AA]">
              <div className="flex justify-between">
                <span>Kualitas:</span>
                <span className="text-white font-bold">{movie.quality || 'HD'}</span>
              </div>
              <div className="flex justify-between">
                <span>Audio:</span>
                <span className="text-white font-medium">Original / Sub Indo</span>
              </div>
              <div className="flex justify-between">
                <span>Server:</span>
                <span className="text-emerald-400 font-medium">Fast CDN Stream</span>
              </div>
            </div>
          </div>
        </div>

        {/* Adsterra Bottom Native Banner */}
        <AdBannerSlot
          code={adConfig.bannerBottomCode}
          enabled={adConfig.bannerBottomEnabled}
          type="bottom"
          onAdClick={handlePopunderClick}
        />

        {/* Related Movies Section */}
        {relatedMovies.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-[#E50914]" />
              <h3 className="text-lg font-bold text-[#F9F9F9]">Film Lainnya Yang Mungkin Kamu Suka</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedMovies.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectMovie(rel.slug)}
                  className="group bg-[#0B0B10] border border-[#1B1B24] hover:border-[#E50914]/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-[#050505]">
                    <img
                      src={rel.thumbnail}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Play className="w-8 h-8 fill-white text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-xs text-[#F9F9F9] line-clamp-1 group-hover:text-[#E50914] transition-colors">
                      {rel.title}
                    </h4>
                    <span className="text-[10px] text-[#71717A]">{rel.year || '2024'}</span>
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
