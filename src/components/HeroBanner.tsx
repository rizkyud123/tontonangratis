import React from 'react';
import { Play, Info, Share2, Star, Clock, Eye, Sparkles } from 'lucide-react';
import { Movie } from '../types';

interface HeroBannerProps {
  movie: Movie;
  onWatch: (slug: string) => void;
  onShare: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movie, onWatch, onShare }) => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#070709] border border-[#1d1d26] shadow-2xl mb-10 group">
      {/* Background Image with Dark Vignette & Gradient Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={movie.thumbnail}
          alt={movie.title}
          className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition duration-1000 opacity-40 filter brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/85 to-transparent w-full md:w-3/4" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-10 md:p-14 flex flex-col justify-end min-h-[360px] sm:min-h-[420px] md:min-h-[460px] max-w-3xl">
        
        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3.5">
          <span className="px-2.5 py-1 rounded-md bg-[#E50914] text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-[#E50914]/30">
            🔥 Rekomendasi Hari Ini
          </span>
          {movie.quality && (
            <span className="px-2 py-0.5 rounded bg-[#15151C] border border-[#2A2A38] text-amber-400 text-xs font-bold">
              {movie.quality}
            </span>
          )}
          {movie.rating && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {movie.rating}
            </span>
          )}
          {movie.year && (
            <span className="text-[#A1A1AA] text-xs font-semibold">
              {movie.year}
            </span>
          )}
          {movie.duration && (
            <span className="flex items-center gap-1 text-[#8E8E93] text-xs">
              <Clock className="w-3 h-3" />
              {movie.duration}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#F9F9F9] leading-tight mb-3 drop-shadow-md">
          {movie.title}
        </h1>

        {/* Synopsis snippet */}
        <p className="text-[#A1A1AA] text-xs sm:text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-6 max-w-2xl leading-relaxed">
          {movie.synopsis || 'Nikmati tontonan film full HD gratis tanpa jeda, dilengkapi pemutar video embed berkualitas tinggi.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="hero-watch-now-btn"
            onClick={() => onWatch(movie.slug)}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white font-bold text-sm sm:text-base shadow-xl shadow-[#E50914]/30 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Play className="w-5 h-5 fill-white text-white" />
            Nonton Sekarang
          </button>

          <button
            id="hero-share-btn"
            onClick={() => onShare(movie)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#14141A] hover:bg-[#1C1C24] border border-[#22222C] text-[#E4E4E7] font-semibold text-sm transition hover:text-white"
          >
            <Share2 className="w-4 h-4" />
            Bagikan Shortlink
          </button>
        </div>
      </div>
    </div>
  );
};
