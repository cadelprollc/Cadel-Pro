import React, { useState } from 'react';
import {
  X,
  Link2,
  Sparkles,
  Music,
  Share2,
  Calendar,
  Check,
  Disc,
  Globe,
  Radio,
  ExternalLink,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { SmartLink, SmartLinkPlatform, Release, VideoRelease, User } from '../types.js';
import { api } from '../lib/api.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (smartlink: SmartLink) => void;
  currentUser: User;
  releases?: Release[];
  videos?: VideoRelease[];
  initialSmartLink?: SmartLink | null;
}

const DEFAULT_PLATFORMS: SmartLinkPlatform[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    url: 'https://open.spotify.com',
    actionText: 'Escuchar',
    iconKey: 'spotify',
    active: true,
  },
  {
    id: 'appleMusic',
    name: 'Apple Music',
    url: 'https://music.apple.com',
    actionText: 'Escuchar',
    iconKey: 'appleMusic',
    active: true,
  },
  {
    id: 'youtube',
    name: 'YouTube Music / Vevo',
    url: 'https://youtube.com',
    actionText: 'Ver Video',
    iconKey: 'youtube',
    active: true,
  },
  {
    id: 'amazonMusic',
    name: 'Amazon Music',
    url: 'https://music.amazon.com',
    actionText: 'Escuchar',
    iconKey: 'amazonMusic',
    active: true,
  },
  {
    id: 'deezer',
    name: 'Deezer',
    url: 'https://deezer.com',
    actionText: 'Escuchar',
    iconKey: 'deezer',
    active: true,
  },
  {
    id: 'tiktok',
    name: 'TikTok Sound',
    url: 'https://tiktok.com',
    actionText: 'Usar Audio',
    iconKey: 'tiktok',
    active: true,
  },
];

export const SmartLinkModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  releases = [],
  videos = [],
  initialSmartLink,
}) => {
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>(initialSmartLink?.releaseId || '');
  const [title, setTitle] = useState(initialSmartLink?.title || '');
  const [artistName, setArtistName] = useState(initialSmartLink?.artistName || currentUser.stageName || currentUser.name);
  const [releaseType, setReleaseType] = useState<SmartLink['releaseType']>(initialSmartLink?.releaseType || 'single');
  const [coverUrl, setCoverUrl] = useState(initialSmartLink?.coverUrl || '');
  const [customSlug, setCustomSlug] = useState(initialSmartLink?.slug || '');
  const [description, setDescription] = useState(initialSmartLink?.description || '');
  const [releaseDate, setReleaseDate] = useState(initialSmartLink?.releaseDate || '');
  const [isPreSave, setIsPreSave] = useState(initialSmartLink?.isPreSave || false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(initialSmartLink?.audioPreviewUrl || '');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(initialSmartLink?.videoPreviewUrl || '');
  const [themeColor, setThemeColor] = useState(initialSmartLink?.themeColor || '#6366f1');

  const [platforms, setPlatforms] = useState<SmartLinkPlatform[]>(
    initialSmartLink?.platforms || DEFAULT_PLATFORMS
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-fill from release
  const handleSelectRelease = (relId: string) => {
    setSelectedReleaseId(relId);
    if (!relId) return;

    const rel = releases.find((r) => r.id === relId);
    if (rel) {
      setTitle(rel.title);
      setArtistName(rel.mainArtist);
      setReleaseType(rel.releaseType);
      setCoverUrl(rel.coverUrl || '');
      const slugCandidate = `${rel.mainArtist}-${rel.title}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-');
      setCustomSlug(slugCandidate);
      setReleaseDate((rel as any).digitalReleaseDate || rel.originalReleaseDate || '');
      setIsPreSave(rel.status === 'submitted' || rel.status === 'under_review' || rel.status === 'scheduled');
      if (rel.tracks && rel.tracks[0]?.audioUrl) {
        setAudioPreviewUrl(rel.tracks[0].audioUrl);
      }
      // Populate DSP links if exists in metadata
      setPlatforms((prev) =>
        prev.map((p) => {
          if (p.id === 'spotify') {
            return {
              ...p,
              url: `https://open.spotify.com/search/${encodeURIComponent(rel.title + ' ' + rel.mainArtist)}`,
            };
          }
          if (p.id === 'appleMusic') {
            return {
              ...p,
              url: `https://music.apple.com/search?term=${encodeURIComponent(rel.title + ' ' + rel.mainArtist)}`,
            };
          }
          if (p.id === 'youtube') {
            return {
              ...p,
              url: `https://youtube.com/results?search_query=${encodeURIComponent(rel.title + ' ' + rel.mainArtist)}`,
            };
          }
          return p;
        })
      );
    }
  };

  const handleUpdatePlatformUrl = (idx: number, url: string) => {
    setPlatforms((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, url } : p))
    );
  };

  const handleTogglePlatform = (idx: number) => {
    setPlatforms((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, active: !p.active } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artistName.trim()) {
      setErrorMsg('Por favor completa el título y el nombre del artista.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        title,
        artistName,
        releaseId: selectedReleaseId || undefined,
        releaseType,
        coverUrl: coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        customSlug: customSlug || undefined,
        description: description || undefined,
        releaseDate: releaseDate || undefined,
        isPreSave,
        audioPreviewUrl: audioPreviewUrl || undefined,
        videoPreviewUrl: videoPreviewUrl || undefined,
        platforms: platforms.filter((p) => p.active),
        themeColor,
      };

      let res;
      if (initialSmartLink?.id) {
        res = await api.updateSmartLink(initialSmartLink.id, payload);
      } else {
        res = await api.createSmartLink(payload);
      }

      onSuccess(res.smartlink);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el SmartLink');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-900 to-purple-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                {initialSmartLink ? 'Editar SmartLink Musical' : 'Crear Nuevo SmartLink & Pre-Save'}
              </h2>
              <p className="text-xs text-indigo-200">
                Página de aterrizaje inteligente para conectar a tus fans con Spotify, Apple Music, YouTube y más.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Import from catalog */}
          {releases.length > 0 && !initialSmartLink && (
            <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1.5">
              <label className="font-black text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Importar datos de tu catálogo (Opcional)</span>
              </label>
              <select
                value={selectedReleaseId}
                onChange={(e) => handleSelectRelease(e.target.value)}
                className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Seleccionar un lanzamiento para auto-rellenar --</option>
                {releases.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} — {r.mainArtist} ({r.releaseType.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Basic metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Título de la Canción o Álbum *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Neon Horizons"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Artista Principal *</label>
              <input
                type="text"
                required
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Ej. Soler Eclipse"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo de Lanzamiento</label>
              <select
                value={releaseType}
                onChange={(e) => setReleaseType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="single">Single / Sencillo</option>
                <option value="ep">EP</option>
                <option value="album">Álbum</option>
                <option value="music_video">Video Musical</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">URL de Portada (Artwork)</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Custom slug preview */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Enlace Personalizado (Slug)</label>
            <div className="flex items-center">
              <span className="p-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-mono text-[11px]">
                sonora.link/
              </span>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                placeholder="mi-tema-musical"
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Pre-save & release date */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-black text-slate-900 block">Modo Pre-Save (Campaña Previa)</span>
                <span className="text-[11px] text-slate-500">
                  Activa el modo pre-guardado si la canción aún no se estrena y deseas captar fans por adelantado.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPreSave}
                onChange={(e) => setIsPreSave(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            {isPreSave && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha Oficial de Lanzamiento</label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            )}
          </div>

          {/* Platforms configuration */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                Tiendas & Plataformas Conectadas
              </h3>
              <span className="text-[11px] text-slate-400">
                {platforms.filter((p) => p.active).length} activas
              </span>
            </div>

            <div className="space-y-2">
              {platforms.map((platform, idx) => (
                <div
                  key={platform.id}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition ${
                    platform.active
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50 border-slate-200/60 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={platform.active}
                    onChange={() => handleTogglePlatform(idx)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />

                  <div className="w-24 font-bold text-slate-800 shrink-0">
                    {platform.name}
                  </div>

                  <input
                    type="url"
                    disabled={!platform.active}
                    value={platform.url}
                    onChange={(e) => handleUpdatePlatformUrl(idx, e.target.value)}
                    placeholder={`Enlace en ${platform.name}`}
                    className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono disabled:opacity-50"
                  />

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                    {isPreSave ? 'Pre-Guardar' : platform.actionText}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audio preview (optional) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">URL de Audio de Vista Previa (MP3)</label>
            <input
              type="url"
              value={audioPreviewUrl}
              onChange={(e) => setAudioPreviewUrl(e.target.value)}
              placeholder="https://.../preview.mp3"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Guardando...' : initialSmartLink ? 'Guardar Cambios' : 'Publicar SmartLink'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
