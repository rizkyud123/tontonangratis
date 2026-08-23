import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Send,
  Facebook,
  Twitter,
  Star,
  Sparkles,
  Film,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ShareData {
  title: string;
  thumbnail: string;
  backdrop?: string;
  synopsis?: string;
  slug?: string;
  url?: string;
  rating?: number;
  year?: number;
  quality?: string;
  genres?: string[];
  isLive?: boolean;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareData | null;
  showToast?: (message: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  data,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://tontonangratis.app';
  const shareUrl = data.url || (data.slug ? `${currentOrigin}/?slug=${data.slug}` : currentOrigin);
  const displayImage = data.backdrop || data.thumbnail;
  const encodedUrl = encodeURIComponent(shareUrl);
  const shareText = `🎬 Nonton "${data.title}" streaming gratis kualitas ${data.quality || 'Full HD'} tanpa buffering di Tontonan Gratis! 🍿✨`;
  const encodedText = encodeURIComponent(shareText);

  // Direct Social Share URLs
  const socialLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
    setCopied(true);
    if (showToast) {
      showToast('Tautan film berhasil disalin! Thumbnail akan otomatis muncul saat dibagikan.');
    }
    try {
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // Ignored
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Nonton ${data.title} - Tontonan Gratis`,
          text: shareText,
          url: shareUrl,
        });
        if (showToast) showToast('Berhasil membagikan tontonan!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-[#0E0E14] border border-[#20202E] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#1C1C28] bg-[#0A0A10]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center text-[#E50914]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#F9F9F9]">Bagikan ke Media Sosial</h3>
              <p className="text-[11px] text-[#A1A1AA]">Thumbnail & deskripsi otomatis muncul di chat/feed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#1A1A24] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Live Preview Card for Social Media (Simulating WhatsApp / Telegram / Facebook Card) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Pratinjau Tampilan Link
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Thumbnail Otomatis Aktif
              </span>
            </div>

            <div className="rounded-xl overflow-hidden bg-[#14141E] border border-[#262638] shadow-md group hover:border-[#E50914]/40 transition">
              {/* Thumbnail Image */}
              <div className="relative aspect-video w-full overflow-hidden bg-[#050508]">
                <img
                  src={displayImage}
                  alt={data.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Badges on Thumbnail */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {data.isLive ? (
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[10px] font-black uppercase tracking-wider shadow">
                        {data.quality || 'FULL HD'}
                      </span>
                    )}
                    {data.rating && (
                      <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-amber-500/30 text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {data.rating}
                      </span>
                    )}
                  </div>
                  {data.year && (
                    <span className="text-[10px] font-semibold text-white/90 bg-black/60 px-1.5 py-0.5 rounded">
                      {data.year}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Meta Description */}
              <div className="p-3 sm:p-3.5 bg-[#14141E]">
                <div className="text-[10px] text-[#8E8E98] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                  <span>tontonangratis.app</span>
                  <span>•</span>
                  <span className="text-amber-400 font-medium">Streaming Movie HD</span>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-[#F9F9F9] line-clamp-1 mb-1">
                  {data.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
                  {data.synopsis || `Nonton streaming gratis film ${data.title} kualitas HD tanpa buffering dengan subtitle Indonesia.`}
                </p>
              </div>
            </div>
          </div>

          {/* 1-Click Direct Social Media Share Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
              Pilih Aplikasi Media Sosial:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* WhatsApp */}
              <a
                href={socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] hover:scale-102 transition group"
              >
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center mb-1.5 shadow-md shadow-[#25D366]/20 group-hover:scale-110 transition">
                  <MessageCircle className="w-4 h-4 fill-white" />
                </div>
                <span className="text-xs font-bold text-[#F9F9F9]">WhatsApp</span>
                <span className="text-[9px] text-[#A1A1AA]">Chat & Status</span>
              </a>

              {/* Telegram */}
              <a
                href={socialLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] hover:scale-102 transition group"
              >
                <div className="w-8 h-8 rounded-full bg-[#0088cc] text-white flex items-center justify-center mb-1.5 shadow-md shadow-[#0088cc]/20 group-hover:scale-110 transition">
                  <Send className="w-4 h-4 fill-white ml-0.5" />
                </div>
                <span className="text-xs font-bold text-[#F9F9F9]">Telegram</span>
                <span className="text-[9px] text-[#A1A1AA]">Grup & Channel</span>
              </a>

              {/* Facebook */}
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] hover:scale-102 transition group"
              >
                <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center mb-1.5 shadow-md shadow-[#1877F2]/20 group-hover:scale-110 transition">
                  <Facebook className="w-4 h-4 fill-white" />
                </div>
                <span className="text-xs font-bold text-[#F9F9F9]">Facebook</span>
                <span className="text-[9px] text-[#A1A1AA]">Feed & Cerita</span>
              </a>

              {/* Twitter / X */}
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white hover:scale-102 transition group"
              >
                <div className="w-8 h-8 rounded-full bg-black border border-white/30 text-white flex items-center justify-center mb-1.5 shadow-md group-hover:scale-110 transition">
                  <Twitter className="w-4 h-4 fill-white" />
                </div>
                <span className="text-xs font-bold text-[#F9F9F9]">Twitter / X</span>
                <span className="text-[9px] text-[#A1A1AA]">Post & Tweet</span>
              </a>
            </div>
          </div>

          {/* Native Web Share Button (if supported on mobile/tablet) */}
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B80710] hover:from-[#F40612] hover:to-[#C70812] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#E50914]/25 hover:scale-[1.01] active:scale-[0.99] transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan ke Semua Aplikasi di Perangkat (Instagram, TikTok, dll)</span>
          </button>

          {/* Copy Link Input Bar */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
              Salin Tautan Langsung:
            </span>
            <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-xl bg-[#08080C] border border-[#20202E]">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-2.5 py-1 text-xs sm:text-sm text-[#F9F9F9] focus:outline-none truncate font-mono select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg font-bold text-xs transition shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#181824] hover:bg-[#222232] text-[#F9F9F9] border border-[#2A2A3C]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-4 sm:px-6 py-3 bg-[#08080C] border-t border-[#1C1C28] flex items-center justify-between text-[11px] text-[#71717A]">
          <span>⚡ Link dilengkapi Open Graph & Twitter Card HD</span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#A1A1AA] hover:text-[#F9F9F9] transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
