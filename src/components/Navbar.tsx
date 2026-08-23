import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Film,
  X,
  ChevronDown,
  Sparkles,
  Flame,
  Clock,
  Compass,
  Menu,
  Star,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import { ViewMode } from '../types';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  allGenres: string[];
  activeFilter: 'all' | 'popular' | 'latest' | 'top-rated';
  onSelectFilter: (filter: 'all' | 'popular' | 'latest' | 'top-rated') => void;
  onRequestAdminLogin: () => void;
  isAdminAuthenticated: boolean;
  onAdminLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  searchQuery,
  onSearchChange,
  selectedGenre,
  onSelectGenre,
  allGenres,
  activeFilter,
  onSelectFilter,
  onRequestAdminLogin,
  isAdminAuthenticated,
  onAdminLogout,
}) => {
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Ref for double click / double tap detection on logo
  const lastTapRef = useRef<number>(0);

  const handleLogoTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 450; // ms
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      lastTapRef.current = 0;
      onRequestAdminLogin();
    } else {
      lastTapRef.current = now;
      if (currentView !== 'catalog') {
        onNavigate('catalog');
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setGenreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-[#1b1b22] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Brand Logo & Title with Secret 2x Tap/Click Admin Trigger */}
          <div className="flex items-center gap-6">
            <button
              id="brand-logo-btn"
              onClick={handleLogoTap}
              onDoubleClick={(e) => {
                e.preventDefault();
                onRequestAdminLogin();
              }}
              title="Tontonan Gratis (Klik 2x untuk Login Admin)"
              className="flex items-center gap-2.5 text-left group focus:outline-none select-none"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#E50914] flex items-center justify-center shadow-lg shadow-[#E50914]/25 group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-wider text-[#E50914] flex items-center gap-1">
                  TONTONAN<span className="text-[#F9F9F9] font-black">GRATIS</span>
                </span>
                <span className="block text-[10px] tracking-widest uppercase text-[#8E8E93] font-semibold -mt-1">
                  Streaming Film HD
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links for Normal Public Users */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
              <button
                id="nav-home-btn"
                onClick={() => {
                  onNavigate('catalog');
                  onSelectFilter('all');
                  onSelectGenre('All');
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                  currentView === 'catalog' && activeFilter === 'all' && selectedGenre === 'All'
                    ? 'bg-[#E50914]/15 text-[#E50914] font-bold'
                    : 'text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#15151C]'
                }`}
              >
                Beranda
              </button>

              <button
                id="nav-catalog-btn"
                onClick={() => {
                  onNavigate('catalog');
                  onSelectFilter('all');
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                  currentView === 'catalog' && (selectedGenre !== 'All' || activeFilter === 'all')
                    ? 'text-[#F9F9F9] hover:bg-[#15151C]'
                    : 'text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#15151C]'
                }`}
              >
                Katalog Lengkap
              </button>

              {/* Genre Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  id="nav-genre-dropdown-btn"
                  onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
                  className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                    selectedGenre !== 'All'
                      ? 'bg-[#E50914]/15 text-[#E50914] font-bold'
                      : 'text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#15151C]'
                  }`}
                >
                  <span>{selectedGenre === 'All' ? 'Pilih Genre' : `Genre: ${selectedGenre}`}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${genreDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {genreDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-[#0B0B10] border border-[#20202C] rounded-2xl shadow-2xl p-3 grid grid-cols-2 gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        onSelectGenre('All');
                        setGenreDropdownOpen(false);
                        onNavigate('catalog');
                      }}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        selectedGenre === 'All'
                          ? 'bg-[#E50914] text-white'
                          : 'text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#14141C]'
                      }`}
                    >
                      🌟 Semua Genre
                    </button>
                    {allGenres.map((g) => (
                      <button
                        key={g}
                        onClick={() => {
                          onSelectGenre(g);
                          setGenreDropdownOpen(false);
                          onNavigate('catalog');
                        }}
                        className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition truncate ${
                          selectedGenre === g
                            ? 'bg-[#E50914] text-white'
                            : 'text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#14141C]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Populer Filter */}
              <button
                id="nav-popular-btn"
                onClick={() => {
                  onNavigate('catalog');
                  onSelectFilter('popular');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                  currentView === 'catalog' && activeFilter === 'popular'
                    ? 'bg-[#E50914]/15 text-[#E50914] font-bold'
                    : 'text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#15151C]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Populer</span>
              </button>

              {/* Terbaru Filter */}
              <button
                id="nav-latest-btn"
                onClick={() => {
                  onNavigate('catalog');
                  onSelectFilter('latest');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                  currentView === 'catalog' && activeFilter === 'latest'
                    ? 'bg-[#E50914]/15 text-[#E50914] font-bold'
                    : 'text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#15151C]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Terbaru</span>
              </button>
            </nav>
          </div>

          {/* Right Side: Search & Authenticated Admin Mode Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Bar */}
            <div className="relative w-36 sm:w-56 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
              <input
                id="search-movie-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (currentView !== 'catalog') onNavigate('catalog');
                }}
                placeholder="Cari judul film..."
                className="w-full bg-[#0E0E14] border border-[#22222C] pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm text-[#F9F9F9] placeholder-[#71717A] focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/40 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#F9F9F9]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Authenticated Admin Mode Controls (Only visible after PIN login) */}
            {isAdminAuthenticated && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onNavigate(currentView === 'admin' ? 'catalog' : 'admin')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E50914] text-white text-xs font-bold shadow-md shadow-[#E50914]/30 hover:bg-[#F40612] transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{currentView === 'admin' ? 'Katalog' : 'Admin Panel'}</span>
                </button>
                <button
                  onClick={onAdminLogout}
                  title="Keluar dari Mode Admin"
                  className="p-2 rounded-xl bg-[#14141C] border border-[#22222C] text-[#8E8E93] hover:text-[#E50914] hover:bg-[#1C1C26] transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#0E0E14] border border-[#22222C] text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#161620] transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 px-2 border-t border-[#181822] space-y-1 animate-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => {
                onNavigate('catalog');
                onSelectFilter('all');
                onSelectGenre('All');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                currentView === 'catalog' && activeFilter === 'all' && selectedGenre === 'All'
                  ? 'bg-[#E50914] text-white'
                  : 'text-[#A1A1AA] hover:bg-[#14141C] hover:text-[#F9F9F9]'
              }`}
            >
              🏠 Beranda
            </button>
            <button
              onClick={() => {
                onNavigate('catalog');
                onSelectFilter('popular');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                activeFilter === 'popular'
                  ? 'bg-[#E50914] text-white'
                  : 'text-[#A1A1AA] hover:bg-[#14141C] hover:text-[#F9F9F9]'
              }`}
            >
              <span>🔥 Film Populer</span>
              <span className="text-[10px] text-amber-400 bg-black/40 px-2 py-0.5 rounded">Rating Tertinggi</span>
            </button>
            <button
              onClick={() => {
                onNavigate('catalog');
                onSelectFilter('latest');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                activeFilter === 'latest'
                  ? 'bg-[#E50914] text-white'
                  : 'text-[#A1A1AA] hover:bg-[#14141C] hover:text-[#F9F9F9]'
              }`}
            >
              <span>⚡ Film Terbaru</span>
              <span className="text-[10px] text-emerald-400 bg-black/40 px-2 py-0.5 rounded">New Release</span>
            </button>

            {/* Mobile Genre Selection */}
            <div className="pt-2 border-t border-[#181822]">
              <span className="block px-3.5 py-1 text-[10px] uppercase font-bold text-[#71717A] tracking-wider">
                Kategori Genre
              </span>
              <div className="grid grid-cols-2 gap-1 pt-1">
                <button
                  onClick={() => {
                    onSelectGenre('All');
                    setMobileMenuOpen(false);
                    onNavigate('catalog');
                  }}
                  className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    selectedGenre === 'All'
                      ? 'bg-[#E50914] text-white font-bold'
                      : 'text-[#A1A1AA] hover:bg-[#14141C]'
                  }`}
                >
                  Semua
                </button>
                {allGenres.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      onSelectGenre(g);
                      setMobileMenuOpen(false);
                      onNavigate('catalog');
                    }}
                    className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium transition truncate ${
                      selectedGenre === g
                        ? 'bg-[#E50914] text-white font-bold'
                        : 'text-[#A1A1AA] hover:bg-[#14141C]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category & Genre Quick Filter Bar (Visible in Catalog) */}
        {currentView === 'catalog' && (
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none border-t border-[#181820]">
            
            {/* Quick Filter Badges */}
            <button
              id="filter-all-btn"
              onClick={() => {
                onSelectFilter('all');
                onSelectGenre('All');
              }}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                activeFilter === 'all' && selectedGenre === 'All'
                  ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                  : 'bg-[#0E0E14] text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#161620] border border-[#1F1F2A]'
              }`}
            >
              Semua Film
            </button>

            <button
              id="filter-popular-btn"
              onClick={() => onSelectFilter('popular')}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1 ${
                activeFilter === 'popular'
                  ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                  : 'bg-[#0E0E14] text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#161620] border border-[#1F1F2A]'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Populer</span>
            </button>

            <button
              id="filter-latest-btn"
              onClick={() => onSelectFilter('latest')}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1 ${
                activeFilter === 'latest'
                  ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                  : 'bg-[#0E0E14] text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#161620] border border-[#1F1F2A]'
              }`}
            >
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Terbaru</span>
            </button>

            <div className="w-[1px] h-5 bg-[#20202A] mx-1 shrink-0" />

            {/* Individual Genre Badges */}
            {allGenres.map((g) => (
              <button
                key={g}
                onClick={() => {
                  onSelectGenre(g);
                  onSelectFilter('all');
                }}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  selectedGenre === g
                    ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                    : 'bg-[#0E0E14] text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#161620] border border-[#1F1F2A]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

