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
  Globe,
  Radio,
  Youtube,
} from 'lucide-react';
import { ViewMode } from '../types';
import { APP_LOGO_URL } from '../data/initialMovies';
import { CountryInfo, COUNTRIES_LIST, findCountryInfo } from '../utils/countryHelper';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  allGenres: string[];
  selectedCountry: string;
  onSelectCountry: (countryCode: string) => void;
  availableCountries: { info: CountryInfo; count: number }[];
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
  selectedCountry,
  onSelectCountry,
  availableCountries,
  activeFilter,
  onSelectFilter,
  onRequestAdminLogin,
  isAdminAuthenticated,
  onAdminLogout,
}) => {
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
        setGenreDropdownOpen(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCountryInfo = selectedCountry !== 'All' ? findCountryInfo(selectedCountry) : null;

  return (
    <header className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-[#1b1b22] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Brand Logo & Title with Secret 2x Tap/Click Admin Trigger */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <button
              id="brand-logo-btn"
              onClick={handleLogoTap}
              onDoubleClick={(e) => {
                e.preventDefault();
                onRequestAdminLogin();
              }}
              title="Tontonan Gratis (Klik / Tap 2x Cepat untuk Login Admin)"
              className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-none select-none active:opacity-90"
            >
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-black/60 border border-[#E50914]/40 shadow-lg shadow-[#E50914]/25 group-hover:scale-105 group-active:scale-95 transition-transform duration-200 shrink-0">
                <img
                  src={APP_LOGO_URL}
                  alt="Tontonan Gratis Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base xs:text-lg sm:text-2xl font-black tracking-wider text-[#E50914] flex items-center leading-none">
                  TONTONAN<span className="text-[#F9F9F9] font-black">GRATIS</span>
                </span>
                <span className="block text-[9px] sm:text-[10px] tracking-widest uppercase text-[#8E8E93] font-semibold mt-0.5">
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
                  onSelectCountry('All');
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                  currentView === 'catalog' && activeFilter === 'all' && selectedGenre === 'All' && selectedCountry === 'All'
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
                  currentView === 'catalog' && (selectedGenre !== 'All' || selectedCountry !== 'All' || activeFilter === 'all')
                    ? 'text-[#F9F9F9] hover:bg-[#15151C]'
                    : 'text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#15151C]'
                }`}
              >
                Katalog
              </button>

              {/* Country Dropdown */}
              <div className="relative" ref={countryDropdownRef}>
                <button
                  id="nav-country-dropdown-btn"
                  onClick={() => {
                    setCountryDropdownOpen(!countryDropdownOpen);
                    setGenreDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                    selectedCountry !== 'All'
                      ? 'bg-[#E50914]/20 text-white font-bold border border-[#E50914]/40'
                      : 'text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#15151C]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    {activeCountryInfo
                      ? `${activeCountryInfo.flag} ${activeCountryInfo.name}`
                      : 'Pilih Negara'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      countryDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {countryDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-[#0B0B10] border border-[#20202C] rounded-2xl shadow-2xl p-3 grid grid-cols-2 gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        onSelectCountry('All');
                        setCountryDropdownOpen(false);
                        onNavigate('catalog');
                      }}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between col-span-2 ${
                        selectedCountry === 'All'
                          ? 'bg-[#E50914] text-white'
                          : 'text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#14141C]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Semua Negara</span>
                      </span>
                    </button>

                    {availableCountries.map(({ info, count }) => (
                      <button
                        key={info.code}
                        onClick={() => {
                          onSelectCountry(info.code);
                          setCountryDropdownOpen(false);
                          onNavigate('catalog');
                        }}
                        className={`text-left px-2.5 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between truncate ${
                          selectedCountry === info.code
                            ? 'bg-[#E50914] text-white'
                            : 'text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#14141C]'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <span className="text-sm">{info.flag}</span>
                          <span className="truncate">{info.name}</span>
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ml-1 ${
                            selectedCountry === info.code
                              ? 'bg-black/30 text-white'
                              : 'bg-white/5 text-[#71717A]'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Genre Dropdown */}
              <div className="relative" ref={genreDropdownRef}>
                <button
                  id="nav-genre-dropdown-btn"
                  onClick={() => {
                    setGenreDropdownOpen(!genreDropdownOpen);
                    setCountryDropdownOpen(false);
                  }}
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

              {/* Live Streaming Nav Button */}
              <button
                id="nav-livestream-btn"
                onClick={() => onNavigate('livestream')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                  currentView === 'livestream'
                    ? 'bg-red-600 text-white font-bold shadow-lg shadow-red-600/30'
                    : 'text-red-400 hover:text-white hover:bg-red-950/40 border border-red-500/20'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <Radio className="w-3.5 h-3.5" />
                <span>Live TV</span>
              </button>

              {/* YouTube Search Nav Button */}
              <button
                id="nav-youtube-btn"
                onClick={() => onNavigate('youtube')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                  currentView === 'youtube'
                    ? 'bg-red-700 text-white font-bold shadow-lg'
                    : 'text-[#E0E0E6] hover:text-white hover:bg-[#161622]'
                }`}
              >
                <Youtube className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                <span>Cari YouTube</span>
              </button>
            </nav>
          </div>

          {/* Right Side: Search & Authenticated Admin Mode Badge */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-end max-w-xs sm:max-w-md">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-[200px] xs:max-w-[240px] sm:max-w-xs md:max-w-sm">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#71717A] pointer-events-none" />
              <input
                id="search-movie-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (currentView !== 'catalog') onNavigate('catalog');
                }}
                placeholder="Cari film..."
                className="w-full bg-[#0E0E14] border border-[#22222C] pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm text-[#F9F9F9] placeholder-[#71717A] focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/40 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#F9F9F9] p-0.5"
                >
                  <X className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </button>
              )}
            </div>

            {/* Authenticated Admin Mode Controls (Only visible after PIN login) */}
            {isAdminAuthenticated && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onNavigate(currentView === 'admin' ? 'catalog' : 'admin')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#E50914] text-white text-xs font-bold shadow-md shadow-[#E50914]/30 hover:bg-[#F40612] transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{currentView === 'admin' ? 'Katalog' : 'Admin'}</span>
                </button>
                <button
                  onClick={onAdminLogout}
                  title="Keluar dari Mode Admin"
                  className="p-1.5 sm:p-2 rounded-xl bg-[#14141C] border border-[#22222C] text-[#8E8E93] hover:text-[#E50914] hover:bg-[#1C1C26] transition"
                >
                  <LogOut className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#0E0E14] border border-[#22222C] text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#161620] transition shrink-0"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
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
                onSelectCountry('All');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                currentView === 'catalog' && activeFilter === 'all' && selectedGenre === 'All' && selectedCountry === 'All'
                  ? 'bg-[#E50914] text-white'
                  : 'text-[#A1A1AA] hover:bg-[#14141C] hover:text-[#F9F9F9]'
              }`}
            >
              <span>🏠 Beranda</span>
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

            {/* Mobile Live TV */}
            <button
              onClick={() => {
                onNavigate('livestream');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                currentView === 'livestream'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-red-400 hover:bg-red-950/30'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>🔴 Live Streaming & TV 24 Jam</span>
              </span>
              <span className="text-[10px] text-white bg-red-600/80 px-2 py-0.5 rounded font-black">LIVE</span>
            </button>

            {/* Mobile YouTube Search */}
            <button
              onClick={() => {
                onNavigate('youtube');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                currentView === 'youtube'
                  ? 'bg-red-700 text-white'
                  : 'text-[#E0E0E6] hover:bg-[#14141C]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500 fill-red-500" />
                <span>🎬 Cari Film di YouTube</span>
              </span>
              <span className="text-[10px] text-[#A1A1AA] bg-black/40 px-2 py-0.5 rounded">API Resmi</span>
            </button>

            {/* Mobile Country Selection */}
            <div className="pt-2 border-t border-[#181822]">
              <span className="block px-3.5 py-1 text-[10px] uppercase font-bold text-[#71717A] tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3 text-sky-400" />
                <span>Pilih Negara</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1.5">
                <button
                  onClick={() => {
                    onSelectCountry('All');
                    setMobileMenuOpen(false);
                    onNavigate('catalog');
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                    selectedCountry === 'All'
                      ? 'bg-[#E50914] text-white font-bold'
                      : 'bg-[#0A0A0F] text-[#A1A1AA] hover:bg-[#14141C]'
                  }`}
                >
                  🌐 Semua Negara
                </button>
                {availableCountries.map(({ info, count }) => (
                  <button
                    key={info.code}
                    onClick={() => {
                      onSelectCountry(info.code);
                      setMobileMenuOpen(false);
                      onNavigate('catalog');
                    }}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition truncate flex items-center justify-between ${
                      selectedCountry === info.code
                        ? 'bg-[#E50914] text-white font-bold'
                        : 'bg-[#0A0A0F] text-[#A1A1AA] hover:bg-[#14141C]'
                    }`}
                  >
                    <span className="truncate">{info.flag} {info.name}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Genre Selection */}
            <div className="pt-2 border-t border-[#181822]">
              <span className="block px-3.5 py-1 text-[10px] uppercase font-bold text-[#71717A] tracking-wider">
                Kategori Genre
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1.5">
                <button
                  onClick={() => {
                    onSelectGenre('All');
                    setMobileMenuOpen(false);
                    onNavigate('catalog');
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                    selectedGenre === 'All'
                      ? 'bg-[#E50914] text-white font-bold'
                      : 'bg-[#0A0A0F] text-[#A1A1AA] hover:bg-[#14141C]'
                  }`}
                >
                  🌟 Semua Genre
                </button>
                {allGenres.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      onSelectGenre(g);
                      setMobileMenuOpen(false);
                      onNavigate('catalog');
                    }}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition truncate ${
                      selectedGenre === g
                        ? 'bg-[#E50914] text-white font-bold'
                        : 'bg-[#0A0A0F] text-[#A1A1AA] hover:bg-[#14141C]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category, Country & Genre Quick Filter Bar (Visible in Catalog) */}
        {currentView === 'catalog' && (
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2 sm:py-2.5 scrollbar-none border-t border-[#181820] -mx-3 px-3 sm:mx-0 sm:px-0">
            
            {/* Quick Filter Badges */}
            <button
              id="filter-all-btn"
              onClick={() => {
                onSelectFilter('all');
                onSelectGenre('All');
                onSelectCountry('All');
              }}
              className={`whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                activeFilter === 'all' && selectedGenre === 'All' && selectedCountry === 'All'
                  ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                  : 'bg-[#0E0E14] text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#161620] border border-[#1F1F2A]'
              }`}
            >
              Semua Film
            </button>

            {/* Popular Country Badges (Indonesia, Korea, Jepang, Barat, Thailand, India) */}
            {availableCountries.slice(0, 5).map(({ info, count }) => (
              <button
                key={`quick-country-${info.code}`}
                id={`filter-country-${info.code.toLowerCase()}-btn`}
                onClick={() => {
                  if (selectedCountry === info.code) {
                    onSelectCountry('All');
                  } else {
                    onSelectCountry(info.code);
                  }
                }}
                className={`whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  selectedCountry === info.code
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'bg-[#0E0E14] text-[#C4C4CE] hover:text-white hover:bg-[#161620] border border-[#1F1F2A]'
                }`}
              >
                <span>{info.flag}</span>
                <span>{info.name}</span>
                <span className={`text-[10px] px-1 rounded ${selectedCountry === info.code ? 'bg-black/30 text-white' : 'bg-white/5 text-[#71717A]'}`}>
                  {count}
                </span>
              </button>
            ))}

            <div className="w-[1px] h-4 sm:h-5 bg-[#20202A] mx-0.5 sm:mx-1 shrink-0" />

            <button
              id="filter-popular-btn"
              onClick={() => onSelectFilter('popular')}
              className={`whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1 ${
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
              className={`whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1 ${
                activeFilter === 'latest'
                  ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                  : 'bg-[#0E0E14] text-[#A1A1AA] hover:text-[#F9F9F9] hover:bg-[#161620] border border-[#1F1F2A]'
              }`}
            >
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Terbaru</span>
            </button>

            <div className="w-[1px] h-4 sm:h-5 bg-[#20202A] mx-0.5 sm:mx-1 shrink-0" />

            {/* Individual Genre Badges */}
            {allGenres.map((g) => (
              <button
                key={g}
                onClick={() => {
                  onSelectGenre(g);
                  onSelectFilter('all');
                }}
                className={`whitespace-nowrap px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
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


