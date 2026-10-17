import React, { useState, useRef } from 'react';
import {
  X,
  Video,
  Upload,
  CheckCircle2,
  Film,
  Sparkles,
  AlertCircle,
  Play,
  Layers,
  Calendar,
  Globe,
  Tag,
  Music,
} from 'lucide-react';
import { VideoRelease, User } from '../types.js';
import { api } from '../lib/api.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (video: VideoRelease) => void;
  currentUser: User;
  initialVideo?: VideoRelease | null;
}

const VIDEO_DSP_PLATFORMS = [
  { id: 'Vevo', name: 'VEVO (YouTube Official Channel)', desc: 'Canal oficial ArtistaVEVO verificado', color: 'border-red-500/40 bg-red-500/10 text-red-700' },
  { id: 'Apple Music Video', name: 'Apple Music Video', desc: 'Distribución en catálogo oficial de Apple Music', color: 'border-purple-500/40 bg-purple-500/10 text-purple-700' },
  { id: 'Tidal Video', name: 'TIDAL Masters Video', desc: 'Alta fidelidad MQA & Dolby Atmos audiovisual', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700' },
  { id: 'YouTube OAC', name: 'YouTube Official Artist Channel', desc: 'Sincronización con canal oficial de artista', color: 'border-rose-500/40 bg-rose-500/10 text-rose-700' },
  { id: 'Cadel Pro Network', name: 'Cadel Pro Network Video', desc: 'Red audiovisual Cadel Pro y aliados globales', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700' },
  { id: 'Facebook Music', name: 'Facebook & Instagram Video', desc: 'Ingesta en catálogo audiovisual de Meta', color: 'border-blue-500/40 bg-blue-500/10 text-blue-700' },
];

export const NewVideoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  initialVideo,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState(initialVideo?.title || '');
  const [artistName, setArtistName] = useState(initialVideo?.artistName || currentUser.stageName || currentUser.name || '');
  const [featuredArtistsText, setFeaturedArtistsText] = useState(initialVideo?.featuredArtists?.join(', ') || '');
  const [genre, setGenre] = useState(initialVideo?.genre || 'Urban / Latin');
  const [director, setDirector] = useState(initialVideo?.director || '');
  const [videoProducer, setVideoProducer] = useState(initialVideo?.videoProducer || 'Cadel Pro Network / Sonora Films');
  const [vevoChannel, setVevoChannel] = useState(initialVideo?.vevoChannel || (currentUser.stageName ? `${currentUser.stageName.replace(/\s+/g, '')}VEVO` : ''));
  const [isrc, setIsrc] = useState(initialVideo?.isrc || ('US-V84-26-' + Math.floor(10000 + Math.random() * 90000)));
  const [upcLinked, setUpcLinked] = useState(initialVideo?.upcLinked || '');
  const [releaseDate, setReleaseDate] = useState(initialVideo?.releaseDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [explicit, setExplicit] = useState(initialVideo?.explicit ?? false);
  const [videoType, setVideoType] = useState<'official_music_video' | 'lyric_video' | 'visualizer' | 'live_session'>(initialVideo?.videoType || 'official_music_video');
  const [resolution, setResolution] = useState<'1080p_FHD' | '4K_UHD' | '8K'>(initialVideo?.resolution || '4K_UHD');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '21:9' | '9:16'>(initialVideo?.aspectRatio || '16:9');
  const [platforms, setPlatforms] = useState<string[]>(initialVideo?.platforms || ['Vevo', 'Apple Music Video', 'Tidal Video', 'YouTube OAC', 'Cadel Pro Network']);

  // Media files states
  const [videoUrl, setVideoUrl] = useState<string>(initialVideo?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [videoFileName, setVideoFileName] = useState<string>(initialVideo?.videoFileName || 'videoclip_master_4k.mp4');
  const [videoFileSizeMB, setVideoFileSizeMB] = useState<number>(initialVideo?.videoFileSizeMB || 650);
  const [durationSeconds, setDurationSeconds] = useState<number>(initialVideo?.durationSeconds || 210);

  const [thumbnailUrl, setThumbnailUrl] = useState<string>(initialVideo?.thumbnailUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80');
  const [thumbnailFileName, setThumbnailFileName] = useState<string>(initialVideo?.thumbnailFileName || 'thumbnail_poster_4k.jpg');

  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = parseFloat((file.size / (1024 * 1024)).toFixed(1));
    setVideoFileSizeMB(sizeMB);
    setVideoFileName(file.name);

    const objUrl = URL.createObjectURL(file);
    setVideoUrl(objUrl);

    // Read duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration) {
        setDurationSeconds(Math.round(video.duration));
      }
    };
    video.src = objUrl;
  };

  const handleThumbnailFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setThumbnailUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor introduce el título del video');
      return;
    }

    setSubmitting(true);
    setError(null);

    const featured = featuredArtistsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      artistName: artistName.trim() || currentUser.name,
      featuredArtists: featured,
      genre,
      director: director.trim() || 'Director Oficial',
      videoProducer: videoProducer.trim() || 'Sonora Films',
      vevoChannel: vevoChannel.trim() || undefined,
      isrc: isrc.trim(),
      upcLinked: upcLinked.trim() || undefined,
      releaseDate,
      explicit,
      videoType,
      resolution,
      aspectRatio,
      durationSeconds,
      videoUrl,
      videoFileName,
      videoFileSizeMB,
      thumbnailUrl,
      thumbnailFileName,
      platforms,
      status: initialVideo?.status === 'changes_requested' ? 'under_review' : (initialVideo?.status || 'under_review'),
    };

    try {
      let res;
      if (initialVideo?.id) {
        res = await api.updateVideo(initialVideo.id, payload);
      } else {
        res = await api.createVideo(payload);
      }

      onSuccess(res.video);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar la distribución del video');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePlatform = (pName: string) => {
    if (platforms.includes(pName)) {
      setPlatforms(platforms.filter((p) => p !== pName));
    } else {
      setPlatforms([...platforms, pName]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-rose-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-300">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide flex items-center gap-2">
                {initialVideo ? 'Editar Video Musical' : 'Distribuir Video Musical Oficial'}
                <span className="text-[10px] uppercase tracking-wider bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">
                  Vevo • Apple • Tidal
                </span>
              </h2>
              <p className="text-xs text-indigo-200">
                {initialVideo
                  ? 'Modifica los metadatos, archivos o canales asociados a este videoclip.'
                  : 'Entrega audiovisual directa en canales oficiales certificados y plataformas DSP.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition ${
                step === 1 ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>1.</span> Información del Video
            </button>
            <span className="text-slate-300">→</span>
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition ${
                step === 2 ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>2.</span> Subir Archivos (Video & Portada)
            </button>
            <span className="text-slate-300">→</span>
            <button
              type="button"
              onClick={() => setStep(3)}
              className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition ${
                step === 3 ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>3.</span> Redes & Confirmación
            </button>
          </div>

          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
            Paso {step} de 3
          </span>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* STEP 1: Metadata */}
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">
                    Título del Video Musical <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Neon Horizons (Official Music Video)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Artista Principal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Artistas Invitados / Colaboradores (Opcional)
                  </label>
                  <input
                    type="text"
                    value={featuredArtistsText}
                    onChange={(e) => setFeaturedArtistsText(e.target.value)}
                    placeholder="Ej. Luna Ray, Carlos Key"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Tipo de Producción Audiovisual</label>
                  <select
                    value={videoType}
                    onChange={(e) => setVideoType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs font-medium"
                  >
                    <option value="official_music_video">Video Musical Oficial (Videoclip)</option>
                    <option value="lyric_video">Lyric Video Oficial (Con Letra)</option>
                    <option value="visualizer">Visualizer Oficial (Motion Art)</option>
                    <option value="live_session">Live Session / Concierto en Vivo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Género Audiovisual</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                  >
                    <option value="Urban / Latin">Urbano / Reggaetón / Latin Trap</option>
                    <option value="Electronic / Synthwave">Electrónica / Dance / Synthwave</option>
                    <option value="Pop / Alternative">Pop / Alternativo / Indie</option>
                    <option value="Rock / Metal">Rock / Metal / Punk</option>
                    <option value="Hip Hop / Rap">Hip Hop / Rap / Trap</option>
                    <option value="Regional Mexicano">Regional Mexicano / Banda</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Director del Videoclip</label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    placeholder="Ej. Carlos Vega & Cadel Visuals"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Casa Productora / Network</label>
                  <input
                    type="text"
                    value={videoProducer}
                    onChange={(e) => setVideoProducer(e.target.value)}
                    placeholder="Ej. Cadel Pro Network Media / Sonora Films"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Código ISRC del Video
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={isrc}
                      onChange={(e) => setIsrc(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsrc('US-V84-26-' + Math.floor(10000 + Math.random() * 90000))}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px]"
                    >
                      Autogenerar
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Identificador fonográfico audiovisual único exigido por VEVO y Apple.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Canal VEVO Oficial Asociado
                  </label>
                  <input
                    type="text"
                    value={vevoChannel}
                    onChange={(e) => setVevoChannel(e.target.value)}
                    placeholder="Ej. SolerEclipseVEVO"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Fecha Oficial de Estreno Mundial
                  </label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    UPC o Código de Álbum/Single Vinculado (Opcional)
                  </label>
                  <input
                    type="text"
                    value={upcLinked}
                    onChange={(e) => setUpcLinked(e.target.value)}
                    placeholder="8435123456789"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={explicit}
                    onChange={(e) => setExplicit(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Contenido Explícito (Explicit 🔞) - Incluye lenguaje o imágenes no aptas para menores.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: File Uploads (Video and Thumbnail) */}
          {step === 2 && (
            <div className="space-y-5 text-xs">
              <input
                type="file"
                ref={videoFileInputRef}
                accept="video/mp4,video/quicktime,video/x-matroska"
                onChange={handleVideoFileUpload}
                className="hidden"
              />
              <input
                type="file"
                ref={thumbnailFileInputRef}
                accept="image/jpeg,image/png,image/webp"
                onChange={handleThumbnailFileUpload}
                className="hidden"
              />

              {/* Video master file upload */}
              <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-rose-600 rounded-lg text-white">
                      <Video className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-xs">Archivo de Video Master</h4>
                      <p className="text-[11px] text-slate-400">
                        Sube el master audiovisual en 4K UHD o 1080p Full HD sin compresión excesiva.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Examinar Video
                  </button>
                </div>

                <div
                  onClick={() => videoFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-800/60"
                >
                  <p className="font-bold text-white text-xs">
                    {videoFileName || 'Haz clic para seleccionar el archivo de video (.mp4, .mov, ProRes)'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tamaño actual: {videoFileSizeMB} MB • Duración estimada: {Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, '0')} min
                  </p>
                </div>

                {/* In-browser Video Preview Player */}
                {videoUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden bg-black border border-slate-800">
                    <div className="px-3 py-1 bg-slate-800/80 text-[10px] text-slate-300 font-semibold flex items-center justify-between">
                      <span>Previsualización del Master Audiovisual:</span>
                      <span className="text-rose-400 font-mono">{resolution}</span>
                    </div>
                    <video
                      controls
                      src={videoUrl}
                      className="w-full max-h-52 object-contain bg-black"
                    />
                  </div>
                )}

                {/* Resolution & Aspect ratio selectors */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                      Resolución Master
                    </label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                    >
                      <option value="4K_UHD">4K UHD (3840x2160 ProRes / H.264)</option>
                      <option value="1080p_FHD">Full HD 1080p (1920x1080)</option>
                      <option value="8K">8K Master Cinema (7680x4320)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                      Relación de Aspecto
                    </label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                    >
                      <option value="16:9">16:9 Panorámica Estándar (Vevo/TV)</option>
                      <option value="21:9">21:9 Anamórfico Cinematográfico</option>
                      <option value="9:16">9:16 Vertical (Reels / TikTok / Shorts)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Poster / Thumbnail upload */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Miniatura / Portada Oficial del Video</h4>
                    <p className="text-[11px] text-slate-500">
                      Imagen promocional de alta resolución (1920x1080 o 3840x2160 JPG/PNG).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => thumbnailFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Subir Portada
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-36 h-20 rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-900 shrink-0 relative group">
                    <img src={thumbnailUrl} alt="Poster" className="w-full h-full object-cover" />
                    <div
                      onClick={() => thumbnailFileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition text-white text-[10px] font-bold"
                    >
                      Cambiar
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">{thumbnailFileName}</p>
                    <p className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolución sRGB lista para ingesta en Vevo y Apple
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Platforms & Submit */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-rose-600" />
                  Redes de Distribución Audiovisual Seleccionadas ({platforms.length})
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Selecciona los servicios oficiales donde se emitirá tu videoclip musical.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {VIDEO_DSP_PLATFORMS.map((p) => {
                    const active = platforms.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-start justify-between ${
                          active
                            ? `${p.color} ring-1 ring-rose-400/50 shadow-sm`
                            : 'border-slate-200 bg-white hover:border-slate-300 opacity-60'
                        }`}
                      >
                        <div>
                          <span className="font-bold block text-xs">{p.name}</span>
                          <span className="text-[10px] text-slate-600 block mt-0.5">{p.desc}</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                            active ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {active ? '✓' : '+'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary card */}
              <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-2 text-xs">
                <span className="text-[11px] font-bold text-rose-400 block uppercase tracking-wider">
                  Resumen de Control de Calidad Audiovisual (QC):
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Videoclip:</span>
                    <strong className="text-white">{title || 'Sin título'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Artista Principal:</span>
                    <strong className="text-white">{artistName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Código ISRC:</span>
                    <strong className="font-mono text-emerald-400">{isrc}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Resolución & Formato:</span>
                    <strong className="text-indigo-300">{resolution} • {aspectRatio}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Canal VEVO:</span>
                    <strong className="text-rose-300">{vevoChannel || 'Asignación automática'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fecha Estreno:</span>
                    <strong className="text-white">{releaseDate}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition"
              >
                ← Anterior
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-medium"
              >
                Cancelar
              </button>
            )}

            <div className="flex items-center gap-2">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !title.trim()) {
                      setError('Introduce el título del video para continuar');
                      return;
                    }
                    setError(null);
                    setStep((s) => (s + 1) as any);
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black tracking-wide shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {submitting
                    ? 'Guardando...'
                    : initialVideo
                    ? 'Guardar Cambios del Video'
                    : 'Enviar Video a Distribución Oficial'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
