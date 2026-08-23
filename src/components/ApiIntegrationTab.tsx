import React, { useState } from 'react';
import {
  Key,
  Globe,
  Radio,
  Server,
  CheckCircle2,
  AlertCircle,
  Play,
  Save,
  ExternalLink,
  Layers,
  Sparkles,
  Check,
  Zap,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Cloud,
  Film,
  Database,
  Link,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { ApiIntegrationConfig, CustomMovieProvider, MovieApiKeyItem } from '../types';
import {
  EMBED_PROVIDERS,
  DEFAULT_FALLBACK_TMDB_KEY,
  testTmdbConnection,
  testOmdbConnection,
  saveApiConfig,
} from '../services/movieApiService';

interface ApiIntegrationTabProps {
  apiConfig: ApiIntegrationConfig;
  onSaveConfig?: (newConfig: ApiIntegrationConfig) => void;
  onSaveApiConfig?: (newConfig: ApiIntegrationConfig) => void;
  showToast: (msg: string) => void;
}

export const ApiIntegrationTab: React.FC<ApiIntegrationTabProps> = ({
  apiConfig,
  onSaveConfig,
  onSaveApiConfig,
  showToast,
}) => {
  const [formConfig, setFormConfig] = useState<ApiIntegrationConfig>({
    ...apiConfig,
    customProviders: apiConfig.customProviders || [],
    movieApiKeys: apiConfig.movieApiKeys || [],
  });

  const [isTestingTmdb, setIsTestingTmdb] = useState(false);
  const [tmdbTestResult, setTmdbTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const [isTestingOmdb, setIsTestingOmdb] = useState(false);
  const [omdbTestResult, setOmdbTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // New Custom Provider Form State
  const [newProvName, setNewProvName] = useState('');
  const [newProvBadge, setNewProvBadge] = useState('VIP HD');
  const [newProvTemplate, setNewProvTemplate] = useState('');
  const [newProvApiKey, setNewProvApiKey] = useState('');
  const [newProvDesc, setNewProvDesc] = useState('');

  // New Movie API Key Form State
  const [newApiKeyProvider, setNewApiKeyProvider] = useState('');
  const [newApiKeyName, setNewApiKeyName] = useState('API Key');
  const [newApiKeyValue, setNewApiKeyValue] = useState('');
  const [newApiKeyEndpoint, setNewApiKeyEndpoint] = useState('');

  // Player Tester State
  const [previewTmdbId, setPreviewTmdbId] = useState('299534'); // Avengers: Endgame
  const [previewImdbId, setPreviewImdbId] = useState('tt4154796');
  const [selectedTesterProviderId, setSelectedTesterProviderId] = useState('vidsrc_xyz');
  const [showKeySecrets, setShowKeySecrets] = useState<Record<string, boolean>>({});

  // 1. TMDB Test
  const handleTestTmdb = async () => {
    setIsTestingTmdb(true);
    setTmdbTestResult(null);
    try {
      const res = await testTmdbConnection(formConfig.tmdbApiKey);
      setTmdbTestResult(res);
      if (res.success) {
        showToast('Koneksi API TMDB Berhasil! Kunci aktif & siap digunakan.');
      } else {
        showToast(`Gagal: ${res.message}`);
      }
    } catch (e: any) {
      setTmdbTestResult({
        success: false,
        message: e.message || 'Gagal menghubungi server TMDB',
      });
    } finally {
      setIsTestingTmdb(false);
    }
  };

  // 2. OMDb Test
  const handleTestOmdb = async () => {
    setIsTestingOmdb(true);
    setOmdbTestResult(null);
    try {
      const res = await testOmdbConnection(formConfig.omdbApiKey);
      setOmdbTestResult(res);
      if (res.success) {
        showToast('Koneksi API OMDb Berhasil! Data rating IMDb siap ditarik.');
      } else {
        showToast(`Gagal: ${res.message}`);
      }
    } catch (e: any) {
      setOmdbTestResult({
        success: false,
        message: e.message || 'Gagal menghubungi server OMDb',
      });
    } finally {
      setIsTestingOmdb(false);
    }
  };

  // Toggle built-in provider
  const handleToggleProvider = (providerId: string) => {
    setFormConfig((prev) => {
      const exists = prev.enabledProviders.includes(providerId);
      const updated = exists
        ? prev.enabledProviders.filter((id) => id !== providerId)
        : [...prev.enabledProviders, providerId];
      return { ...prev, enabledProviders: updated };
    });
  };

  // Add Custom Video Provider
  const handleAddCustomProvider = () => {
    if (!newProvName.trim() || !newProvTemplate.trim()) {
      showToast('Nama Provider dan URL Template wajib diisi!');
      return;
    }

    const newProvider: CustomMovieProvider = {
      id: `custom-prov-${Date.now()}`,
      name: newProvName.trim(),
      badge: newProvBadge.trim() || 'Custom',
      template: newProvTemplate.trim(),
      apiKey: newProvApiKey.trim() || undefined,
      description: newProvDesc.trim() || `Server custom ${newProvName.trim()}`,
      enabled: true,
    };

    setFormConfig((prev) => ({
      ...prev,
      customProviders: [...(prev.customProviders || []), newProvider],
    }));

    setNewProvName('');
    setNewProvBadge('VIP HD');
    setNewProvTemplate('');
    setNewProvApiKey('');
    setNewProvDesc('');
    showToast(`Provider "${newProvider.name}" berhasil ditambahkan!`);
  };

  // Remove Custom Video Provider
  const handleRemoveCustomProvider = (id: string) => {
    setFormConfig((prev) => ({
      ...prev,
      customProviders: (prev.customProviders || []).filter((p) => p.id !== id),
    }));
    showToast('Provider kustom berhasil dihapus.');
  };

  // Toggle Custom Video Provider
  const handleToggleCustomProvider = (id: string) => {
    setFormConfig((prev) => ({
      ...prev,
      customProviders: (prev.customProviders || []).map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      ),
    }));
  };

  // Add Third-Party Movie API Key
  const handleAddMovieApiKey = () => {
    if (!newApiKeyProvider.trim() || !newApiKeyValue.trim()) {
      showToast('Nama Penyedia dan Nilai API Key wajib diisi!');
      return;
    }

    const newItem: MovieApiKeyItem = {
      id: `key-${Date.now()}`,
      providerName: newApiKeyProvider.trim(),
      keyName: newApiKeyName.trim() || 'API Key',
      keyValue: newApiKeyValue.trim(),
      endpointUrl: newApiKeyEndpoint.trim() || undefined,
      enabled: true,
    };

    setFormConfig((prev) => ({
      ...prev,
      movieApiKeys: [...(prev.movieApiKeys || []), newItem],
    }));

    setNewApiKeyProvider('');
    setNewApiKeyName('API Key');
    setNewApiKeyValue('');
    setNewApiKeyEndpoint('');
    showToast(`Kunci API "${newItem.providerName}" berhasil ditambahkan!`);
  };

  // Remove Movie API Key
  const handleRemoveMovieApiKey = (id: string) => {
    setFormConfig((prev) => ({
      ...prev,
      movieApiKeys: (prev.movieApiKeys || []).filter((k) => k.id !== id),
    }));
    showToast('Kunci API berhasil dihapus.');
  };

  // Toggle Movie API Key
  const handleToggleMovieApiKey = (id: string) => {
    setFormConfig((prev) => ({
      ...prev,
      movieApiKeys: (prev.movieApiKeys || []).map((k) =>
        k.id === id ? { ...k, enabled: !k.enabled } : k
      ),
    }));
  };

  // Toggle secret visibility
  const toggleSecret = (keyId: string) => {
    setShowKeySecrets((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  // Calculate Embed URL for Live Tester
  const getTesterEmbedUrl = () => {
    const tmdb = previewTmdbId.trim() || '299534';
    const imdb = previewImdbId.trim() || 'tt4154796';

    // Check if custom provider
    const customProv = (formConfig.customProviders || []).find(
      (p) => p.id === selectedTesterProviderId
    );
    if (customProv) {
      let url = customProv.template;
      url = url.replace(/\{tmdb_id\}/g, tmdb).replace(/\{imdb_id\}/g, imdb);
      if (customProv.apiKey) {
        url = url.replace(/\{api_key\}/g, encodeURIComponent(customProv.apiKey));
      }
      return url;
    }

    // Built-in providers
    const builtin = EMBED_PROVIDERS.find((p) => p.id === selectedTesterProviderId);
    if (builtin) {
      return builtin.template.replace(/\{tmdb_id\}/g, tmdb).replace(/\{imdb_id\}/g, imdb);
    }

    return `https://vidsrc.xyz/embed/movie/${tmdb}`;
  };

  // Global Save Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveApiConfig(formConfig);
      if (typeof onSaveConfig === 'function') {
        onSaveConfig(formConfig);
      }
      if (typeof onSaveApiConfig === 'function') {
        onSaveApiConfig(formConfig);
      }
      showToast('Semua Pengaturan API & Server Berhasil Disimpan ke Database Server & Cloud!');
    } catch (err: any) {
      showToast(`Gagal menyimpan: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-[#0D0D14] to-emerald-950/30 border border-[#22222E] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center shrink-0 text-[#E50914] shadow-lg shadow-[#E50914]/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#F9F9F9] tracking-wide flex items-center gap-2">
                Pusat Integrasi API Film & Multi-Server Video Player
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  Tersimpan di Server & Cloud
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-3xl">
                Atur API Key TMDB, OMDb, tambah kunci API penyedia film lain, dan kelola penyedia video streaming (VidSrc, SuperEmbed, Embed.su, serta server kustom Anda). Semua tersinkron otomatis ke seluruh perangkat.
              </p>
            </div>
          </div>

          <button
            id="save-api-config-top-btn"
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#F40612] active:bg-[#B80710] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#E50914]/30 transition shrink-0 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan ke Database...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: TMDB API CONFIGURATION */}
      <div className="bg-[#0B0B10] border border-[#1C1C26] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#181822]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F9F9F9]">
                1. API Key TMDB (The Movie Database)
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Digunakan untuk pencarian film instan, poster HD, sinopsis Bahasa Indonesia, dan metadata resmi film.
              </p>
            </div>
          </div>

          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#E50914] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Daftar TMDB Gratis</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* TMDB API Key v3 */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-[#A1A1AA] flex items-center justify-between">
              <span>TMDB API Key (v3 auth)</span>
              <span className="text-[11px] text-emerald-400 font-normal">
                {formConfig.tmdbApiKey
                  ? '✓ Menggunakan API Key Kustom Anda'
                  : '⚡ Menggunakan Demo Key Default Sistem'}
              </span>
            </label>
            <div className="flex gap-2">
              <input
                id="input-tmdb-api-key"
                type="password"
                value={formConfig.tmdbApiKey}
                onChange={(e) => setFormConfig({ ...formConfig, tmdbApiKey: e.target.value })}
                placeholder={`Contoh: ${DEFAULT_FALLBACK_TMDB_KEY} (Kosongkan jika ingin pakai default)`}
                className="w-full bg-[#07070B] border border-[#1F1F2C] focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] rounded-xl px-3.5 py-2.5 text-xs text-[#F9F9F9] placeholder-[#52525B] outline-none font-mono"
              />
              <button
                id="test-tmdb-conn-btn"
                type="button"
                disabled={isTestingTmdb}
                onClick={handleTestTmdb}
                className="px-4 py-2.5 rounded-xl bg-[#14141C] hover:bg-[#1E1E2C] border border-[#2A2A38] text-xs font-semibold text-[#F9F9F9] shrink-0 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isTestingTmdb ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Tes Koneksi</span>
              </button>
            </div>
            <p className="text-[11px] text-[#71717A]">
              Kunci API gratis bisa didapatkan di situs <strong>themoviedb.org</strong> di menu Profil &gt; Settings &gt; API.
            </p>
          </div>

          {/* TMDB Language */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Bahasa Sinopsis Default</span>
            </label>
            <select
              id="select-tmdb-lang"
              value={formConfig.tmdbLanguage}
              onChange={(e) =>
                setFormConfig({ ...formConfig, tmdbLanguage: e.target.value as any })
              }
              className="w-full bg-[#07070B] border border-[#1F1F2C] focus:border-[#E50914] rounded-xl px-3.5 py-2.5 text-xs text-[#F9F9F9] outline-none cursor-pointer"
            >
              <option value="id-ID">🇮🇩 Bahasa Indonesia (id-ID)</option>
              <option value="en-US">🇺🇸 English (en-US)</option>
            </select>
            <p className="text-[11px] text-[#71717A]">
              Sinopsis film akan diutamakan dalam Bahasa Indonesia saat diimport.
            </p>
          </div>
        </div>

        {/* TMDB Read Access Token (v4 auth) - Opsional */}
        <div className="space-y-2 pt-2 border-t border-[#161620]">
          <label className="text-xs font-semibold text-[#A1A1AA] flex items-center justify-between">
            <span>TMDB Read Access Token (v4 auth - Opsional)</span>
            <span className="text-[11px] text-[#71717A]">JWT Token TMDB</span>
          </label>
          <input
            id="input-tmdb-read-token"
            type="password"
            value={formConfig.tmdbApiReadToken || ''}
            onChange={(e) =>
              setFormConfig({ ...formConfig, tmdbApiReadToken: e.target.value })
            }
            placeholder="eyJhbGciOiJIUzI1NiJ9... (Opsional jika ingin autentikasi bearer v4)"
            className="w-full bg-[#07070B] border border-[#1F1F2C] focus:border-[#E50914] rounded-xl px-3.5 py-2.5 text-xs text-[#F9F9F9] placeholder-[#52525B] font-mono outline-none"
          />
        </div>

        {/* Test Result Message Box */}
        {tmdbTestResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
              tmdbTestResult.success
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-red-950/20 border-red-800/40 text-red-300'
            }`}
          >
            {tmdbTestResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{tmdbTestResult.message}</p>
              {tmdbTestResult.details && (
                <p className="text-[11px] opacity-80 mt-0.5">
                  Base Image URL: {tmdbTestResult.details.images?.secure_base_url} (Katalog siap)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: OMDB & IMDB API INTEGRATION */}
      <div className="bg-[#0B0B10] border border-[#1C1C26] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#181822]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F9F9F9]">
                2. API Key OMDb (Open Movie Database / IMDb)
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Digunakan untuk mencocokkan IMDb ID, rating Rotten Tomatoes, Metascore, dan pencarian film alternatif.
              </p>
            </div>
          </div>

          <a
            href="https://www.omdbapi.com/apikey.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Daftar OMDb Gratis (1.000 req/hari)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#A1A1AA] flex items-center justify-between">
            <span>OMDb API Key</span>
            <span className="text-[11px] text-amber-400 font-normal">
              {formConfig.omdbApiKey ? '✓ Terpasang' : 'Belum diisi'}
            </span>
          </label>
          <div className="flex gap-2">
            <input
              id="input-omdb-api-key"
              type="password"
              value={formConfig.omdbApiKey || ''}
              onChange={(e) => setFormConfig({ ...formConfig, omdbApiKey: e.target.value })}
              placeholder="Contoh: 1a2b3c4d (Dapatkan gratis di omdbapi.com)"
              className="w-full bg-[#07070B] border border-[#1F1F2C] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-[#F9F9F9] placeholder-[#52525B] outline-none font-mono"
            />
            <button
              id="test-omdb-conn-btn"
              type="button"
              disabled={isTestingOmdb || !formConfig.omdbApiKey}
              onClick={handleTestOmdb}
              className="px-4 py-2.5 rounded-xl bg-[#14141C] hover:bg-[#1E1E2C] border border-[#2A2A38] text-xs font-semibold text-[#F9F9F9] shrink-0 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isTestingOmdb ? (
                <span className="animate-spin">⌛</span>
              ) : (
                <Radio className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Tes Koneksi OMDb</span>
            </button>
          </div>
        </div>

        {omdbTestResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
              omdbTestResult.success
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-red-950/20 border-red-800/40 text-red-300'
            }`}
          >
            {omdbTestResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{omdbTestResult.message}</p>
              {omdbTestResult.details && (
                <p className="text-[11px] opacity-80 mt-0.5">
                  Contoh Data: {omdbTestResult.details.title} ({omdbTestResult.details.year}) - Rating IMDb: {omdbTestResult.details.imdbRating}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: YOUTUBE DATA API V3 INTEGRATION */}
      <div className="bg-[#0B0B10] border border-[#1C1C26] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#181822]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F9F9F9]">
                3. API Key YouTube Data API v3 (Live Streaming & Pencarian Film)
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Digunakan untuk pencarian film bioskop full movie di YouTube, integrasi siaran Live Streaming 24 jam, dan impor video 1-klik.
              </p>
            </div>
          </div>

          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-red-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Google Cloud Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#A1A1AA] flex items-center justify-between">
            <span>YouTube Data API v3 Key</span>
            <span className="text-[11px] text-emerald-400 font-normal">
              {formConfig.youtubeApiKey ? '✓ API Key Kustom Terpasang' : '⚡ Menggunakan Default'}
            </span>
          </label>
          <div className="flex gap-2">
            <input
              id="input-youtube-api-key"
              type="text"
              value={formConfig.youtubeApiKey || ''}
              onChange={(e) => setFormConfig({ ...formConfig, youtubeApiKey: e.target.value })}
              placeholder="Contoh: AIzaSyDwL7xt9_C8X2QvjhSbxRVA1KqowIxa9-k"
              className="w-full bg-[#07070B] border border-[#1F1F2C] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl px-3.5 py-2.5 text-xs text-[#F9F9F9] placeholder-[#52525B] outline-none font-mono"
            />
          </div>
          <p className="text-[11px] text-[#71717A]">
            Kunci API ini otomatis diproksi melalui server backend (/api/youtube/search) agar terhindar dari pemblokiran referer atau CORS.
          </p>
        </div>
      </div>

      {/* SECTION 4: TAMBAH API KEY PENYEDIA FILM & MOVIE LAINNYA */}
      <div className="bg-[#0B0B10] border border-[#1C1C26] rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#181822]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F9F9F9]">
                4. Tambah Kunci API Penyedia Film & Video Lainnya
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Simpan API Key dari Trakt.tv, JustWatch, Consumet, OpenSubtitles, RapidAPI, atau scraper pihak ketiga.
              </p>
            </div>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-lg bg-[#14141C] border border-[#22222C] text-[#A1A1AA] font-mono">
            {(formConfig.movieApiKeys || []).length} Kunci Tersimpan
          </span>
        </div>

        {/* Add API Key Form */}
        <div className="p-4 rounded-xl bg-[#07070D] border border-[#1E1E2C] space-y-3">
          <div className="text-xs font-bold text-[#F9F9F9] flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Tambah Kunci API Penyedia Baru</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
                Nama Penyedia / Layanan
              </label>
              <input
                type="text"
                value={newApiKeyProvider}
                onChange={(e) => setNewApiKeyProvider(e.target.value)}
                placeholder="Contoh: Trakt.tv, OpenSubtitles"
                className="w-full bg-[#0E0E16] border border-[#262638] px-3 py-2 rounded-lg text-xs text-[#F9F9F9] focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
                Label / Jenis Key
              </label>
              <input
                type="text"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                placeholder="Contoh: Client ID, Secret Key"
                className="w-full bg-[#0E0E16] border border-[#262638] px-3 py-2 rounded-lg text-xs text-[#F9F9F9] focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
                Nilai Kunci API / Token
              </label>
              <input
                type="password"
                value={newApiKeyValue}
                onChange={(e) => setNewApiKeyValue(e.target.value)}
                placeholder="Paste API Key / Token rahasia"
                className="w-full bg-[#0E0E16] border border-[#262638] px-3 py-2 rounded-lg text-xs text-[#F9F9F9] font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
                Endpoint URL (Opsional)
              </label>
              <input
                type="url"
                value={newApiKeyEndpoint}
                onChange={(e) => setNewApiKeyEndpoint(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full bg-[#0E0E16] border border-[#262638] px-3 py-2 rounded-lg text-xs text-[#F9F9F9] font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleAddMovieApiKey}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-950/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simpan Kunci API</span>
            </button>
          </div>
        </div>

        {/* List of Saved API Keys */}
        {(formConfig.movieApiKeys || []).length > 0 ? (
          <div className="space-y-2">
            {(formConfig.movieApiKeys || []).map((k) => {
              const isVisible = showKeySecrets[k.id] || false;
              return (
                <div
                  key={k.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    k.enabled
                      ? 'bg-[#10101C] border-purple-500/30'
                      : 'bg-[#07070B] border-[#1C1C26] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleMovieApiKey(k.id)}
                      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition ${
                        k.enabled
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : 'border-[#3F3F50] bg-transparent'
                      }`}
                    >
                      {k.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#F9F9F9] truncate">
                          {k.providerName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#1C1C2C] text-purple-300 text-[10px] font-mono border border-purple-900/40">
                          {k.keyName}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-[#8E8E93] truncate">
                        {isVisible
                          ? k.keyValue
                          : '••••••••••••••••' + k.keyValue.slice(-4)}
                      </p>
                      {k.endpointUrl && (
                        <p className="text-[10px] text-[#71717A] truncate font-mono">
                          Endpoint: {k.endpointUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleSecret(k.id)}
                      className="p-1.5 rounded-lg bg-[#181826] hover:bg-[#222234] text-[#A1A1AA] hover:text-white transition"
                      title={isVisible ? 'Sembunyikan' : 'Tampilkan Key'}
                    >
                      {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveMovieApiKey(k.id)}
                      className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 text-red-400 hover:text-red-300 transition"
                      title="Hapus Kunci API"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-[#71717A] bg-[#07070B] rounded-xl border border-dashed border-[#1E1E2C]">
            Belum ada kunci API pihak ketiga tambahan. Anda bisa menambahkan kunci API custom di atas.
          </div>
        )}
      </div>

      {/* SECTION 4: TAMBAH & KELOLA PENYEDIA SERVER / EMBED STREAMING FILM KUSTOM */}
      <div className="bg-[#0B0B10] border border-[#1C1C26] rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#181822]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F9F9F9]">
                4. Tambah & Kelola Penyedia Server Streaming Kustom (Custom Video Providers)
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Tambahkan server video embed kustom (misal: VidSrc Pro, Server VIP Indo, DoodStream, StreamSB) yang akan digenerate otomatis ke setiap film.
              </p>
            </div>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-lg bg-[#14141C] border border-[#22222C] text-[#A1A1AA] font-mono">
            {(formConfig.customProviders || []).length} Server Kustom
          </span>
        </div>

        {/* Add Custom Provider Form */}
        <div className="p-4 rounded-xl bg-[#07070D] border border-[#1E1E2C] space-y-3">
          <div className="text-xs font-bold text-[#F9F9F9] flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Tambah Server / Provider Pemutar Baru</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
                Nama Server
              </label>
              <input
                type="text"
                value={newProvName}
                onChange={(e) => setNewProvName(e.target.value)}
                placeholder="Contoh: Server VIP Indo"
                className="w-full bg-[#0E0E16] border border-[#262638] px-3 py-2 rounded-lg text-xs text-[#F9F9F9] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
                Badge / Kualitas
              </label>
              <input
                type="text"
                value={newProvBadge}
                onChange={(e) => setNewProvBadge(e.target.value)}
                placeholder="Contoh: 1080p VIP, Fast CDN"
                className="w-full bg-[#0E0E16] border border-[#262638] px-3 py-2 rounded-lg text-xs text-[#F9F9F9] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
                URL Template Embed (Gunakan {'{tmdb_id}'} atau {'{imdb_id}'})
              </label>
              <input
                type="text"
                value={newProvTemplate}
                onChange={(e) => setNewProvTemplate(e.target.value)}
                placeholder="https://myplayer.xyz/embed/movie/{tmdb_id}"
                className="w-full bg-[#0E0E16] border border-[#262638] px-3 py-2 rounded-lg text-xs text-[#F9F9F9] font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
                API Key / Token Server (Opsional, gunakan {'{api_key}'} di template)
              </label>
              <input
                type="password"
                value={newProvApiKey}
                onChange={(e) => setNewProvApiKey(e.target.value)}
                placeholder="Token akses penyedia jika diperlukan"
                className="w-full bg-[#0E0E16] border border-[#262638] px-3 py-2 rounded-lg text-xs text-[#F9F9F9] font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
                Deskripsi Singkat Server
              </label>
              <input
                type="text"
                value={newProvDesc}
                onChange={(e) => setNewProvDesc(e.target.value)}
                placeholder="Server streaming kecepatan tinggi dengan subtitle Indonesia"
                className="w-full bg-[#0E0E16] border border-[#262638] px-3 py-2 rounded-lg text-xs text-[#F9F9F9] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleAddCustomProvider}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-950/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Provider Video</span>
            </button>
          </div>
        </div>

        {/* List of Custom Video Providers */}
        {(formConfig.customProviders || []).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
              Daftar Server Kustom Anda:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(formConfig.customProviders || []).map((prov) => {
                return (
                  <div
                    key={prov.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition ${
                      prov.enabled
                        ? 'bg-[#10101A] border-blue-500/40 shadow-sm'
                        : 'bg-[#08080C] border-[#1C1C24] opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCustomProvider(prov.id)}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                            prov.enabled
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-[#3F3F50] bg-transparent'
                          }`}
                        >
                          {prov.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <span className="text-xs font-bold text-[#F9F9F9]">
                          {prov.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1C1C28] text-blue-300 border border-blue-900/40">
                          {prov.badge || 'VIP'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomProvider(prov.id)}
                          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40 transition"
                          title="Hapus Provider Kustom"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#8E8E93] truncate">
                      {prov.description}
                    </p>

                    <div className="bg-[#060609] p-2 rounded-lg border border-[#1A1A24] font-mono text-[10px] text-blue-300 truncate">
                      {prov.template}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: VIDEO STREAMING & EMBED PROVIDERS CONFIG (9 BUILT-IN) */}
      <div className="bg-[#0B0B10] border border-[#1C1C26] rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#181822]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 text-[#E50914] flex items-center justify-center border border-red-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F9F9F9]">
                5. Penyedia Server Video Bawaan (9 Built-in Embed Providers)
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Pilihan pemutar video streaming otomatis yang akan digenerate ke setiap film saat Anda melakukan import.
              </p>
            </div>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-lg bg-[#14141C] border border-[#22222C] text-[#A1A1AA] font-mono">
            {formConfig.enabledProviders.length} Aktif
          </span>
        </div>

        {/* Multi-Server Generator Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#08080E] border border-[#1C1C26]">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-[#E50914]" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#F9F9F9]">
                Otomatis Buat Multi-Server Cadangan di Setiap Film
              </p>
              <p className="text-[11px] text-[#8E8E93]">
                Saat film diimport dari TMDB, sistem otomatis menyediakan Server 1, Server 2, Server 3, dst. agar penonton bisa berganti server jika terjadi buffering.
              </p>
            </div>
          </div>
          <button
            id="toggle-multi-servers-btn"
            type="button"
            onClick={() =>
              setFormConfig({
                ...formConfig,
                autoMultiServers: !formConfig.autoMultiServers,
              })
            }
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
              formConfig.autoMultiServers ? 'bg-[#E50914]' : 'bg-[#27273A]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                formConfig.autoMultiServers ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Provider Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {EMBED_PROVIDERS.map((prov) => {
            const isEnabled = formConfig.enabledProviders.includes(prov.id);
            return (
              <div
                key={prov.id}
                onClick={() => handleToggleProvider(prov.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-2.5 ${
                  isEnabled
                    ? 'bg-[#10101A] border-[#E50914]/40 shadow-sm'
                    : 'bg-[#08080C] border-[#1C1C24] opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isEnabled
                          ? 'bg-[#E50914] border-[#E50914] text-white'
                          : 'border-[#3F3F50] bg-transparent'
                      }`}
                    >
                      {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#F9F9F9]">
                      {prov.name}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1C1C28] text-amber-300 border border-[#2E2E3E]">
                    {prov.badge}
                  </span>
                </div>

                <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                  {prov.description}
                </p>

                <div className="bg-[#060609] p-2 rounded-lg border border-[#1A1A24] font-mono text-[10px] text-[#A1A1AA] truncate">
                  {prov.template}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Embed Template Fallback */}
        <div className="space-y-2 pt-3 border-t border-[#181822]">
          <label className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Custom Embed URL Fallback Template (Player Utama Alternatif)</span>
          </label>
          <input
            id="input-custom-embed-template"
            type="text"
            value={formConfig.customEmbedTemplate}
            onChange={(e) =>
              setFormConfig({ ...formConfig, customEmbedTemplate: e.target.value })
            }
            placeholder="Contoh: https://vidsrc.xyz/embed/movie/{tmdb_id}"
            className="w-full bg-[#07070B] border border-[#1F1F2C] focus:border-[#E50914] rounded-xl px-3.5 py-2.5 text-xs text-[#F9F9F9] placeholder-[#52525B] font-mono outline-none"
          />
          <p className="text-[11px] text-[#71717A]">
            Gunakan variabel <code>&#123;tmdb_id&#125;</code> atau <code>&#123;imdb_id&#125;</code> di dalam URL template Anda.
          </p>
        </div>
      </div>

      {/* SECTION 6: LIVE PLAYER TESTER */}
      <div className="bg-[#0B0B10] border border-[#1C1C26] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#181822]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F9F9F9]">
                6. Uji Coba Video Player Embed Langsung
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Pilih provider dan masukkan TMDB ID / IMDb ID film untuk menguji respons video player secara real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Tester Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#07070B] border border-[#1E1E2C]">
          <div>
            <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
              Pilih Server / Provider
            </label>
            <select
              value={selectedTesterProviderId}
              onChange={(e) => setSelectedTesterProviderId(e.target.value)}
              className="w-full bg-[#0E0E14] border border-[#22222E] px-3 py-2 rounded-lg text-xs text-[#F9F9F9] outline-none"
            >
              <optgroup label="Server Bawaan (Built-in)">
                {EMBED_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.badge})
                  </option>
                ))}
              </optgroup>
              {(formConfig.customProviders || []).length > 0 && (
                <optgroup label="Server Kustom Anda">
                  {(formConfig.customProviders || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      ★ {p.name} ({p.badge || 'VIP'})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
              TMDB ID Contoh
            </label>
            <input
              type="text"
              value={previewTmdbId}
              onChange={(e) => setPreviewTmdbId(e.target.value)}
              placeholder="Contoh: 299534"
              className="w-full bg-[#0E0E14] border border-[#22222E] px-3 py-2 rounded-lg text-xs text-[#F9F9F9] font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
              IMDb ID Contoh (Opsional)
            </label>
            <input
              type="text"
              value={previewImdbId}
              onChange={(e) => setPreviewImdbId(e.target.value)}
              placeholder="Contoh: tt4154796"
              className="w-full bg-[#0E0E14] border border-[#22222E] px-3 py-2 rounded-lg text-xs text-[#F9F9F9] font-mono outline-none"
            />
          </div>
        </div>

        {/* Embed Preview Frame */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#A1A1AA]">
              Target URL Player:{' '}
              <strong className="text-emerald-400 font-mono truncate">
                {getTesterEmbedUrl()}
              </strong>
            </span>
          </div>
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-[#1F1F2C] relative shadow-2xl">
            <iframe
              src={getTesterEmbedUrl()}
              title="Player Tester"
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      {/* SECTION 7: DATABASE PERSISTENCE STATUS */}
      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
        <Database className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[#A1A1AA] leading-relaxed">
          <strong className="text-emerald-300 font-semibold block mb-0.5">
            Sinkronisasi Database & Server Otomatis
          </strong>
          Semua konfigurasi API Key TMDB, OMDb, third-party provider, dan daftar server kustom otomatis disimpan ke database server (<code>data/db.json</code>) serta disinkronkan ke cloud <strong>Supabase</strong> (tabel <code>app_settings</code>), sehingga langsung aktif di semua komputer dan smartphone.
        </div>
      </div>

      {/* Save Bottom Button */}
      <div className="flex justify-end pt-2">
        <button
          id="save-api-config-bottom-btn"
          type="submit"
          disabled={isSaving}
          className="px-8 py-3.5 rounded-xl bg-[#E50914] hover:bg-[#F40612] active:bg-[#B80710] text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#E50914]/30 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Menyimpan Semua ke Database...' : 'Simpan Semua Pengaturan API & Server'}</span>
        </button>
      </div>
    </form>
  );
};
