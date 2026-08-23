import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio,
  Tv,
  Play,
  Share2,
  Check,
  Search,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Users,
  Film,
  Music,
  Send,
  MessageSquare,
  Globe,
  Gamepad2,
  AlertCircle,
} from 'lucide-react';
import { LiveChannel, YouTubeVideoItem, AdConfig } from '../types';
import {
  fetchLiveStreamsFromYouTube,
  searchYouTube,
  extractYouTubeId,
  getYouTubeEmbedUrl,
  convertYouTubeItemToLiveChannel,
  LIVE_CATEGORY_QUERIES,
} from '../services/youtubeService';
import { AdBannerSlot } from './AdBannerSlot';

interface LiveStreamViewProps {
  adConfig: AdConfig;
  showToast: (msg: string) => void;
  onNavigateHome: () => void;
  youtubeApiKey?: string;
  onOpenShareModal?: (data: any) => void;
}

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  badge?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'Semua Siaran Live', icon: Tv, desc: 'Siaran langsung terpopuler saat ini' },
  { id: 'berita', label: 'Berita Nasional 🇮🇩', icon: Radio, desc: 'Kompas TV, CNN, iNews, TVRI, Metro TV' },
  { id: 'tv-nasional', label: 'TV Nasional', icon: Globe, desc: 'Siaran televisi nasional Indonesia' },
  { id: 'anime', label: 'Anime 24/7', icon: Sparkles, desc: 'Streaming anime nonstop legal sub Indo' },
  { id: 'musik', label: 'Musik & Lofi 24/7', icon: Music, desc: 'Lofi hip hop & radio relaksasi 24 jam' },
  { id: 'cinema', label: 'Bioskop & Film Live', icon: Film, desc: 'Siaran film bioskop live stream' },
  { id: 'event', label: 'Event & Gaming', icon: Gamepad2, desc: 'Turnamen esports & siaran event langsung' },
];

export const LiveStreamView: React.FC<LiveStreamViewProps> = ({
  adConfig,
  showToast,
  onNavigateHome,
  youtubeApiKey,
  onOpenShareModal,
}) => {
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<LiveChannel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [customUrlInput, setCustomUrlInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideoItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user: 'NontonYuk_Official',
      avatar: '🔴',
      text: 'Selamat datang di Siaran Langsung YouTube Live 24 Jam Nonstop!',
      time: 'Baru saja',
      badge: 'Admin',
    },
    {
      id: '2',
      user: 'RianCinema',
      avatar: '🎬',
      text: 'Siaran live YouTube jernih dan lancar tanpa buffer 👍',
      time: '1m lalu',
      badge: 'VIP',
    },
  ]);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Load genuine live streams directly from YouTube Data API
  const loadLiveStreams = useCallback(
    async (category: string) => {
      setIsLoadingLive(true);
      setErrorMsg(null);
      try {
        const liveItems = await fetchLiveStreamsFromYouTube({
          category,
          apiKey: youtubeApiKey,
          maxResults: 14,
        });

        if (liveItems && liveItems.length > 0) {
          setChannels(liveItems);
          // Set first stream as active if none selected or if category changed
          setActiveChannel((prev) => {
            if (!prev) return liveItems[0];
            const stillExists = liveItems.find((item) => item.id === prev.id);
            return stillExists || liveItems[0];
          });
        } else {
          setChannels([]);
          setErrorMsg('Tidak ada siaran live yang ditemukan untuk kategori ini saat ini.');
        }
      } catch (err: any) {
        console.error('Error fetching YouTube live streams:', err);
        setErrorMsg('Gagal memuat siaran live dari YouTube API.');
      } finally {
        setIsLoadingLive(false);
      }
    },
    [youtubeApiKey]
  );

  // Fetch live streams on mount and when category changes
  useEffect(() => {
    loadLiveStreams(selectedCategory);
  }, [selectedCategory, loadLiveStreams]);

  const handleSelectChannel = (channel: LiveChannel) => {
    setActiveChannel(channel);
    showToast(`Memutar siaran live: ${channel.name.slice(0, 35)}...`);
    if (window.innerWidth < 768 && playerContainerRef.current) {
      playerContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePlayCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    const extractedId = extractYouTubeId(customUrlInput);
    if (!extractedId) {
      showToast('URL YouTube atau Video ID tidak valid!');
      return;
    }

    const customChannel: LiveChannel = {
      id: `custom-${extractedId}`,
      name: 'Siaran Kustom YouTube',
      category: 'kustom',
      categoryLabel: 'Custom Live Link',
      logo: `https://i.ytimg.com/vi/${extractedId}/hqdefault.jpg`,
      videoId: extractedId,
      embedUrl: getYouTubeEmbedUrl(extractedId, true),
      description: `Siaran streaming live dari tautan kustom: ${customUrlInput}`,
      isOnline: true,
      country: 'Kustom',
      viewers: 'LIVE',
    };

    setActiveChannel(customChannel);
    setChannels((prev) => [customChannel, ...prev.filter((c) => c.id !== customChannel.id)]);
    setCustomUrlInput('');
    showToast('Memutar siaran kustom...');
    if (playerContainerRef.current) {
      playerContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await searchYouTube({
        query: searchQuery,
        isLive: true,
        apiKey: youtubeApiKey,
        maxResults: 10,
      });

      setSearchResults(res.items);
      if (res.items.length === 0) {
        showToast('Tidak ada siaran live aktif ditemukan untuk kata kunci ini.');
      } else {
        showToast(`Ditemukan ${res.items.length} siaran live aktif!`);
      }
    } catch (err) {
      showToast('Gagal mencari siaran live YouTube');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (video: YouTubeVideoItem) => {
    const liveCh = convertYouTubeItemToLiveChannel(video, selectedCategory);
    setActiveChannel(liveCh);
    setChannels((prev) => [liveCh, ...prev.filter((c) => c.id !== liveCh.id)]);
    showToast(`Memutar: ${video.title.slice(0, 30)}...`);
    if (playerContainerRef.current) {
      playerContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      user: 'Kamu (Penonton)',
      avatar: '👤',
      text: chatInput.trim(),
      time: 'Baru saja',
      badge: 'User',
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  const handleCopyShare = () => {
    if (activeChannel) {
      const liveId = activeChannel.videoId || activeChannel.id;
      const shareUrl = `${window.location.origin}${window.location.pathname}?live=${liveId}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Tautan siaran live berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);

      if (onOpenShareModal) {
        onOpenShareModal({
          title: activeChannel.name,
          thumbnail: activeChannel.logo || `https://i.ytimg.com/vi/${liveId}/hqdefault.jpg`,
          backdrop: `https://i.ytimg.com/vi/${liveId}/hqdefault.jpg`,
          synopsis: activeChannel.description || `Nonton siaran langsung ${activeChannel.name} kualitas HD streaming 24 jam nonstop di Tontonan Gratis.`,
          url: shareUrl,
          isLive: true,
          quality: 'LIVE HD',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F9F9F9] py-4 sm:py-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-600/40 text-red-400 text-xs font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <Radio className="w-3.5 h-3.5 text-red-500" />
            <span>REAL-TIME YOUTUBE DATA API V3</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-2">
            <span>Siaran Langsung & TV 24 Jam Nonstop</span>
          </h1>
          <p className="text-[#A1A1AA] text-xs sm:text-sm mt-1">
            Tonton siaran berita terkini, TV nasional, anime 24 jam, lofi radio, dan live event gratis langsung dari YouTube tanpa jeda buffering.
          </p>
        </div>

        {/* Action Controls (Custom URL & Refresh Live) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <form onSubmit={handlePlayCustomUrl} className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="Tempel Link YouTube Live..."
              className="flex-1 md:w-60 px-3.5 py-2 bg-[#0E0E14] border border-[#232330] rounded-xl text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-red-500 transition font-mono"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-red-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Putar</span>
            </button>
          </form>

          <button
            onClick={() => loadLiveStreams(selectedCategory)}
            disabled={isLoadingLive}
            className="px-3.5 py-2 bg-[#12121A] hover:bg-[#1C1C28] border border-[#222230] hover:border-red-500/40 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
            title="Segarkan data siaran live dari YouTube API"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-red-400 ${isLoadingLive ? 'animate-spin' : ''}`} />
            <span>Segarkan Live</span>
          </button>
        </div>
      </div>

      {/* Main Streaming Grid (Player & Live Chat / Channels) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" ref={playerContainerRef}>
        {/* Left / Center: Live Player (2 Cols on Large Screen) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-[#20202E] shadow-2xl">
            {activeChannel ? (
              <iframe
                key={activeChannel.embedUrl}
                src={activeChannel.embedUrl}
                title={activeChannel.name}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : isLoadingLive ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070A] p-6 text-center space-y-3">
                <RefreshCw className="w-10 h-10 text-red-500 animate-spin" />
                <p className="text-sm font-bold text-white">Menghubungkan ke YouTube Data API v3...</p>
                <p className="text-xs text-[#71717A]">Memuat siaran langsung aktif dari YouTube...</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070A] p-6 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500" />
                <p className="text-sm font-bold text-white">Tidak ada siaran live yang dipilih</p>
                <button
                  onClick={() => loadLiveStreams('all')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white transition"
                >
                  Muat Semua Siaran Live
                </button>
              </div>
            )}
          </div>

          {/* Active Channel Details Bar */}
          {activeChannel && (
            <div className="p-4 bg-[#0A0A10] border border-[#1C1C28] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src={activeChannel.logo}
                    alt={activeChannel.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#2A2A3C]"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                      {activeChannel.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      LIVE
                    </span>
                    {activeChannel.categoryLabel && (
                      <span className="px-2 py-0.5 rounded bg-[#161622] text-[#A1A1AA] text-[10px] font-medium border border-[#242434]">
                        {activeChannel.categoryLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8E8E98] mt-1 line-clamp-1">
                    {activeChannel.description}
                  </p>
                </div>
              </div>

              {/* Live Actions (Share, Chat Toggle, Viewer count) */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 text-red-300 border border-red-900/40 text-xs font-bold">
                  <Users className="w-3.5 h-3.5 text-red-400" />
                  <span>Siaran Aktif</span>
                </div>

                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                    showChat
                      ? 'bg-[#E50914]/20 border-[#E50914]/50 text-white'
                      : 'bg-[#12121A] border-[#222230] text-[#A1A1AA] hover:text-white'
                  }`}
                  title="Buka / Tutup Live Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </button>

                <button
                  onClick={handleCopyShare}
                  className="p-2 rounded-xl bg-[#12121A] border border-[#222230] text-[#A1A1AA] hover:text-white text-xs font-bold transition flex items-center gap-1"
                  title="Bagikan Siaran Ini"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Bagikan'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Adsterra Banner Slot in Live Stream View */}
          {adConfig && adConfig.bannerTopEnabled && (
            <AdBannerSlot
              code={adConfig.bannerTopCode}
              enabled={adConfig.bannerTopEnabled}
              type="inline"
            />
          )}

          {/* Live Search on YouTube */}
          <div className="p-4 bg-[#0A0A10] border border-[#1C1C28] rounded-2xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-red-500" />
              <span>Cari Siaran Live Spesifik Lainnya di YouTube Data API</span>
            </h3>
            <form onSubmit={handleSearchLive} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Contoh: Live streaming debat, Live konser, TVRI sport, Anime live..."
                className="flex-1 px-3.5 py-2 bg-[#050508] border border-[#242434] rounded-xl text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{isSearching ? 'Mencari...' : 'Cari Live'}</span>
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#1C1C28]">
                <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block mb-3">
                  Hasil Siaran YouTube Live ({searchResults.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {searchResults.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleSelectSearchResult(video)}
                      className="text-left p-2 rounded-xl bg-[#0E0E14] hover:bg-[#161622] border border-[#20202E] transition flex items-center gap-3 group"
                    >
                      <div className="relative w-20 h-12 shrink-0 rounded-lg overflow-hidden bg-black">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-red-600 text-[9px] font-bold text-white">
                          LIVE
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate group-hover:text-red-400 transition">
                          {video.title}
                        </h4>
                        <p className="text-[10px] text-[#71717A] truncate">
                          {video.channelTitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Chat Room & Category Switcher */}
        <div className="space-y-4">
          {/* Live Chat Room Box */}
          {showChat && (
            <div className="bg-[#0A0A10] border border-[#1C1C28] rounded-2xl p-4 flex flex-col h-[380px]">
              <div className="flex items-center justify-between pb-3 border-b border-[#1C1C28] mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Chat Komunitas
                  </span>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Online
                </span>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="p-2 rounded-xl bg-[#0F0F16] border border-[#1C1C2A] space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400 flex items-center gap-1.5">
                        <span>{msg.avatar}</span>
                        <span>{msg.user}</span>
                        {msg.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                            {msg.badge}
                          </span>
                        )}
                      </span>
                      <span className="text-[9px] text-[#63636E]">{msg.time}</span>
                    </div>
                    <p className="text-[#E0E0E6] text-[11px] leading-relaxed pl-5">
                      {msg.text}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="mt-3 pt-3 border-t border-[#1C1C28] flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ketik pesan chat..."
                  className="flex-1 px-3 py-1.5 bg-[#050508] border border-[#222232] rounded-xl text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition shrink-0"
                  title="Kirim Pesan"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Channel Categories Filter */}
          <div className="p-4 bg-[#0A0A10] border border-[#1C1C28] rounded-2xl">
            <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-red-500" />
              <span>Kategori Live YouTube (Real-Time)</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                        : 'bg-[#12121A] text-[#A1A1AA] hover:text-white hover:bg-[#181824] border border-[#222230]'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channel Selection List (Direct from YouTube API) */}
          <div className="p-4 bg-[#0A0A10] border border-[#1C1C28] rounded-2xl space-y-2 max-h-[480px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#181824]">
              <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
                <span>Siaran Live Aktif ({channels.length})</span>
              </h3>
              <span className="text-[10px] text-red-400 font-normal">Klik untuk Memutar</span>
            </div>

            {isLoadingLive ? (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-red-500 animate-spin mx-auto" />
                <p className="text-xs text-[#A1A1AA]">Mengambil siaran live dari YouTube Data API...</p>
              </div>
            ) : errorMsg && channels.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                <p className="text-xs text-[#A1A1AA]">{errorMsg}</p>
                <button
                  onClick={() => loadLiveStreams(selectedCategory)}
                  className="px-3 py-1.5 bg-[#1A1A26] hover:bg-red-600 rounded-lg text-xs text-white transition font-medium"
                >
                  Coba Lagi
                </button>
              </div>
            ) : (
              channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChannel(ch)}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-3 border ${
                    activeChannel?.id === ch.id
                      ? 'bg-gradient-to-r from-red-950/80 to-black border-red-600 text-white shadow-lg'
                      : 'bg-[#0E0E14] hover:bg-[#151520] border-[#1E1E2C] text-[#D1D1DB]'
                  }`}
                >
                  <div className="relative shrink-0 w-12 h-8 rounded-lg overflow-hidden bg-black">
                    <img
                      src={ch.logo}
                      alt={ch.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded bg-red-600 text-[8px] font-black text-white">
                      LIVE
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate">{ch.name}</h4>
                    <p className="text-[10px] text-[#71717A] truncate mt-0.5">
                      {ch.categoryLabel || ch.category} • {ch.country}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

