import React, { useState } from 'react';
import { Play, Star, Share2, Check, Sparkles } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onWatch: (slug: string) => void;
  onQuickShare: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onWatch, onQuickShare }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?slug=${movie.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onQuickShare(movie);
  };

  return (
    <div
      id={`movie-card-${movie.id}`}
      onClick={() => onWatch(movie.slug)}
      className="group relative flex flex-col bg-[#0B0B10] hover:bg-[#101016] border border-[#1B1B24] hover:border-[#E50914]/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-black/60 transition-all duration-300 cursor-pointer hover:-translate-y-1.5"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#050505]">
        <img
          src={movie.thumbnail}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback poster if image fails to load
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
          }}
        />

        {/* Quality and Rating Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {movie.quality && (
            <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-[#2B2B38] text-[10px] font-black text-amber-400">
              {movie.quality}
            </span>
          )}
        </div>

        {movie.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-amber-500/30 text-[11px] font-bold text-amber-300 z-10">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{movie.rating}</span>
          </div>
        )}

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-xl shadow-[#E50914]/40 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-white text-white ml-0.5" />
          </div>
        </div>

        {/* Year bottom gradient tag */}
        {movie.year && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-semibold text-[#A1A1AA]">
            {movie.year}
          </div>
        )}
      </div>

      {/* Movie Details */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-grow justify-between gap-2.5">
        <div>
          <h3 className="font-bold text-sm text-[#F9F9F9] line-clamp-2 group-hover:text-[#E50914] transition-colors leading-snug">
            {movie.title}
          </h3>

          {/* Genre Chips */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {movie.genres.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="text-[10px] font-medium text-[#A1A1AA] bg-[#14141C] border border-[#20202C] px-1.5 py-0.5 rounded"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Bottom Row */}
        <div className="pt-2.5 border-t border-[#181822] flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatch(movie.slug);
            }}
            className="flex-1 bg-[#E50914] hover:bg-[#F40612] active:bg-[#B80710] text-white text-center py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm shadow-[#E50914]/20 flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Nonton</span>
          </button>

          <button
            onClick={handleCopyLink}
            title="Salin Shortlink"
            className="p-2 rounded-lg bg-[#14141C] hover:bg-[#1C1C26] border border-[#20202C] text-[#A1A1AA] hover:text-[#F9F9F9] transition"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
