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
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#070709] border border-[#1d1d26] shadow-2xl mb-6 sm:mb-10 group">
      {/* Background Image with Dark Vignette & Gradient Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={movie.backdrop || movie.thumbnail}
          alt={movie.title}
          className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition duration-1000 opacity-40 filter brightness-90"
          onError={(e) => {
            (e.target as HTMLImageElement).src = movie.thumbnail;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/85 to-transparent w-full md:w-3/4" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-4 xs:p-6 sm:p-10 md:p-14 flex flex-col justify-end min-h-[300px] xs:min-h-[340px] sm:min-h-[400px] md:min-h-[440px] max-w-3xl">
        
        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 mb-2.5 sm:mb-3.5">
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-[#E50914] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-md shadow-[#E50914]/30">
            🔥 Rekomendasi
          </span>
          {movie.quality && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded bg-[#15151C] border border-[#2A2A38] text-amber-400 text-[10px] sm:text-xs font-bold">
              {movie.quality}
            </span>
          )}
          {movie.rating && (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-300 bg-black/60 px-1.5 sm:px-2 py-0.5 rounded border border-amber-500/30">
              <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-amber-400 text-amber-400" />
              {movie.rating}
            </span>
          )}
          {movie.year && (
            <span className="text-[#A1A1AA] text-[10px] sm:text-xs font-semibold">
              {movie.year}
            </span>
          )}
          {movie.duration && (
            <span className="flex items-center gap-1 text-[#8E8E93] text-[10px] sm:text-xs">
              <Clock className="w-3 h-3" />
              {movie.duration}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl xs:text-2xl sm:text-4xl md:text-5xl font-black text-[#F9F9F9] leading-tight mb-2 sm:mb-3 drop-shadow-md line-clamp-2">
          {movie.title}
        </h1>

        {/* Synopsis snippet */}
        <p className="text-[#A1A1AA] text-xs sm:text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-4 sm:mb-6 max-w-2xl leading-relaxed">
          {movie.synopsis || 'Nikmati tontonan film full HD gratis tanpa jeda, dilengkapi pemutar video embed berkualitas tinggi.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            id="hero-watch-now-btn"
            onClick={() => onWatch(movie.slug)}
            className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#E50914] hover:bg-[#F40612] active:bg-[#B80710] text-white font-bold text-xs sm:text-sm shadow-xl shadow-[#E50914]/30 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Play className="w-4 sm:w-5 h-4 sm:h-5 fill-white text-white" />
            <span>Nonton Sekarang</span>
          </button>

          <button
            id="hero-share-btn"
            onClick={() => onShare(movie)}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#14141A] hover:bg-[#1C1C24] border border-[#22222C] text-[#E4E4E7] font-semibold text-xs sm:text-sm transition hover:text-white"
          >
            <Share2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            <span>Bagikan Shortlink</span>
          </button>
        </div>
      </div>
    </div>
  );
};
