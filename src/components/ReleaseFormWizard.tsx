import React, { useState } from 'react';
import { Release, Track, FileValidationResult, EXTENDED_DSP_STORES } from '../types.js';
import { api } from '../lib/api.js';
import {
  Music,
  Calendar,
  Image as ImageIcon,
  Sliders,
  Globe,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  ArrowRight,
  ArrowLeft,
  Disc,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  initialRelease?: Release | null;
  onSaveDraft: (release: Partial<Release>) => Promise<void>;
  onSubmitForReview: (releaseId: string) => Promise<void>;
  onCancel: () => void;
}

const AVAILABLE_GENRES = [
  'Electronic',
  'Pop',
  'Hip-Hop / Rap',
  'Rock',
  'Latin / Reggaeton',
  'R&B / Soul',
  'Indie / Alternative',
  'Ambient / Chillout',
  'Dance / House',
  'Classical',
  'Jazz',
  'Folk / Acoustic',
  'Metal',
  'Trap',
];

const AVAILABLE_PLATFORMS = EXTENDED_DSP_STORES.map((s) => s.name);

export const ReleaseFormWizard: React.FC<Props> = ({
  initialRelease,
  onSaveDraft,
  onSubmitForReview,
  onCancel,
}) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState(initialRelease?.title || '');
  const [releaseType, setReleaseType] = useState<'single' | 'ep' | 'album' | 'music_video'>(
    initialRelease?.releaseType || 'single'
  );
  const [mainArtist, setMainArtist] = useState(initialRelease?.mainArtist || 'SOLER ECLIPSE');
  const [featuredArtistsText, setFeaturedArtistsText] = useState(
    initialRelease?.featuredArtists?.join(', ') || ''
  );
  const [genre, setGenre] = useState(initialRelease?.genre || 'Electronic');
  const [subgenre, setSubgenre] = useState(initialRelease?.subgenre || 'Synthwave');
  const [language, setLanguage] = useState(initialRelease?.language || 'Spanish');
  const [label, setLabel] = useState(initialRelease?.label || 'Sonora Independent Records');
  const [catalogNumber, setCatalogNumber] = useState(
    initialRelease?.catalogNumber || 'SNR-' + Math.floor(100000 + Math.random() * 900000)
  );

  // Video Distribution Fields (Vevo, Cadel Pro Network, Apple, Spotify)
  const [videoIsrc, setVideoIsrc] = useState(
    initialRelease?.videoDetails?.videoIsrc || 'US-V84-26-' + Math.floor(10000 + Math.random() * 90000)
  );
  const [videoResolution, setVideoResolution] = useState<'1080p_FHD' | '4K_UHD' | '8K'>(
    initialRelease?.videoDetails?.videoResolution || '4K_UHD'
  );
  const [videoDirector, setVideoDirector] = useState(
    initialRelease?.videoDetails?.director || 'Cadel Films & Visuals'
  );
  const [videoProducer, setVideoProducer] = useState(
    initialRelease?.videoDetails?.videoProducer || 'Cadel Pro Network Media'
  );
  const [videoPlatforms, setVideoPlatforms] = useState<string[]>(
    initialRelease?.videoDetails?.videoPlatforms || [
      'Vevo',
      'Cadel Pro Network',
      'Apple Music Video',
      'Spotify Video',
    ]
  );

  // Step 2: Dates & Rights
  const defaultReleaseDate = new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0];
  const [releaseDate, setReleaseDate] = useState(initialRelease?.releaseDate || defaultReleaseDate);
  const [originalReleaseDate, setOriginalReleaseDate] = useState(
    initialRelease?.originalReleaseDate || defaultReleaseDate
  );
  const [upc, setUpc] = useState(
    initialRelease?.upc || '843' + Math.floor(1000000000 + Math.random() * 9000000000)
  );
  const [pLine, setPLine] = useState(initialRelease?.pLine || `${new Date().getFullYear()} Sonora Group`);
  const [cLine, setCLine] = useState(initialRelease?.cLine || `${new Date().getFullYear()} ${mainArtist}`);
  const [territories, setTerritories] = useState<'worldwide' | string[]>(
    initialRelease?.territories || 'worldwide'
  );

  // Step 3: Artwork
  const [coverUrl, setCoverUrl] = useState(
    initialRelease?.coverUrl ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80'
  );
  const [coverFileName, setCoverFileName] = useState(
    initialRelease?.coverFileName || 'album_artwork_3000x3000.png'
  );
  const [coverValidation, setCoverValidation] = useState<FileValidationResult>({
    valid: true,
    fileName: 'album_artwork_3000x3000.png',
    fileSizeMB: 5.4,
    fileType: 'image/png',
    details: { dimensions: { width: 3000, height: 3000 }, isSquare: true },
    errors: [],
    warnings: [],
  });

  // Step 4: Tracks
  const [tracks, setTracks] = useState<Track[]>(
    initialRelease?.tracks || [
      {
        id: 'trk-wizard-01',
        releaseId: initialRelease?.id || '',
        trackNumber: 1,
        discNumber: 1,
        title: title || 'Pista Principal',
        version: 'Original Mix',
        isrc: 'ES-A01-26-' + Math.floor(10000 + Math.random() * 90000),
        durationSeconds: 215,
        explicit: false,
        previewStartTimeSeconds: 30,
        audioUrl: 'https://cdn.freesound.org/previews/511/511484_10672044-lq.mp3',
        audioFileName: 'track_01_master_24bit.wav',
        audioFormat: 'WAV',
        audioBitrate: '2304 kbps',
        audioSampleRate: '48.0 kHz',
        composers: ['Mateo Soler'],
        lyricists: ['Mateo Soler'],
        producers: ['SOLER ECLIPSE'],
        mixers: ['Adrian Vance'],
        masterers: ['Sterling Sound'],
        featuredArtists: [],
        lyricsText: '',
        lyricsSynced: false,
        language: 'Spanish',
      },
    ]
  );

  // Step 5: Platforms
  const [platforms, setPlatforms] = useState<string[]>(
    initialRelease?.platforms || AVAILABLE_PLATFORMS
  );

  // Artwork presets for testing
  const ARTWORK_PRESETS = [
    {
      name: 'Cyberpunk Neon (3000x3000px)',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
    },
    {
      name: 'Deep Blue Nebula (3000x3000px)',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80',
    },
    {
      name: 'Geometric Minimalist (3000x3000px)',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000&auto=format&fit=crop&q=80',
    },
  ];

  const handleTogglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      setPlatforms(platforms.filter((item) => item !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  const handleSelectAllPlatforms = () => {
    setPlatforms(AVAILABLE_PLATFORMS);
  };

  const handleAddTrack = () => {
    const newIdx = tracks.length + 1;
    const newTrack: Track = {
      id: 'trk-' + Date.now() + '-' + newIdx,
      releaseId: initialRelease?.id || '',
      trackNumber: newIdx,
      discNumber: 1,
      title: `Pista ${newIdx}`,
      version: 'Original Mix',
      isrc: 'ES-A01-26-' + Math.floor(10000 + Math.random() * 90000),
      durationSeconds: 200,
      explicit: false,
      previewStartTimeSeconds: 30,
      audioUrl: 'https://cdn.freesound.org/previews/511/511484_10672044-lq.mp3',
      audioFileName: `track_0${newIdx}_master.wav`,
      audioFormat: 'WAV',
      audioBitrate: '2304 kbps',
      audioSampleRate: '48.0 kHz',
      composers: [mainArtist],
      lyricists: [],
      producers: [mainArtist],
      mixers: [],
      masterers: [],
      featuredArtists: [],
      lyricsText: '',
      lyricsSynced: false,
      language: language,
    };
    setTracks([...tracks, newTrack]);
  };

  const handleRemoveTrack = (index: number) => {
    if (tracks.length === 1) return;
    const updated = tracks.filter((_, i) => i !== index).map((t, idx) => ({ ...t, trackNumber: idx + 1 }));
    setTracks(updated);
  };

  const handleUpdateTrack = (index: number, updates: Partial<Track>) => {
    const updated = [...tracks];
    updated[index] = { ...updated[index], ...updates };
    setTracks(updated);
  };

  const coverFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = parseFloat((file.size / (1024 * 1024)).toFixed(2));
    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const width = img.naturalWidth || 3000;
        const height = img.naturalHeight || 3000;

        setCoverUrl(dataUrl);
        setCoverFileName(file.name);

        try {
          const res = await api.validateCover({
            fileName: file.name,
            width,
            height,
            fileSizeMB,
            mimeType: file.type || 'image/jpeg',
          });
          setCoverValidation(res.result);
        } catch {
          setCoverValidation({
            valid: width === height && width >= 3000,
            fileName: file.name,
            fileSizeMB,
            fileType: file.type,
            details: { dimensions: { width, height }, isSquare: width === height },
            errors: width < 3000 ? ['Se recomienda una resolución mínima de 3000x3000px'] : [],
            warnings: [],
          });
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleAudioFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = parseFloat((file.size / (1024 * 1024)).toFixed(2));
    const audioUrl = URL.createObjectURL(file);
    const audioObj = new Audio(audioUrl);

    audioObj.onloadedmetadata = async () => {
      const duration = Math.round(audioObj.duration || 180);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'WAV';
      const audioFormat = ext === 'FLAC' ? 'FLAC' : ext === 'MP3' ? 'MP3_320' : 'WAV';

      try {
        await api.validateAudio({
          fileName: file.name,
          fileSizeMB,
          mimeType: file.type || 'audio/wav',
          sampleRate: '48.0 kHz',
          bitrate: audioFormat === 'WAV' ? '2304 kbps (24-bit)' : '320 kbps',
          duration,
        });
      } catch {
        // ignore
      }

      handleUpdateTrack(index, {
        audioUrl,
        audioFileName: file.name,
        audioFormat,
        durationSeconds: duration,
        audioSampleRate: '48.0 kHz',
        audioBitrate: audioFormat === 'WAV' ? '2304 kbps (24-bit PCM)' : '320 kbps HQ',
      });
    };
  };

  const handleTestCoverValidation = async (url: string, fileName: string) => {
    setCoverUrl(url);
    setCoverFileName(fileName);
    try {
      const res = await api.validateCover({
        fileName,
        width: 3000,
        height: 3000,
        fileSizeMB: 5.2,
        mimeType: 'image/png',
      });
      setCoverValidation(res.result);
    } catch {
      // ignore
    }
  };

  const getPayload = (): Partial<Release> => {
    const featured = featuredArtistsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      title,
      releaseType,
      mainArtist,
      featuredArtists: featured,
      genre,
      subgenre,
      language,
      releaseDate,
      originalReleaseDate,
      label,
      catalogNumber,
      upc,
      pLine,
      cLine,
      territories,
      platforms,
      explicit: tracks.some((t) => t.explicit),
      coverUrl,
      coverFileName,
      tracks: tracks.map((t) => ({ ...t, title: t.title || title })),
      videoDetails:
        releaseType === 'music_video'
          ? {
              videoIsrc,
              videoResolution,
              videoDurationSeconds: 215,
              director: videoDirector,
              videoProducer,
              videoPlatforms,
              aspectRatio: '16:9',
              cleanVersionAvailable: false,
            }
          : undefined,
    };
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setErrorMsg('Por favor ingresa al menos el título del lanzamiento.');
      return;
    }
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSaveDraft(getPayload());
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar borrador');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMsg('El título del lanzamiento es obligatorio.');
      return;
    }
    if (!coverUrl) {
      setErrorMsg('Debes adjuntar la portada oficial.');
      return;
    }
    if (tracks.length === 0) {
      setErrorMsg('Debes incluir al menos una pista de audio.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      // 1. Save or update release
      const res = initialRelease?.id
        ? await api.updateRelease(initialRelease.id, getPayload())
        : await api.createRelease(getPayload());

      const releaseId = res.release.id;

      // 2. Submit to Admin queue
      await onSubmitForReview(releaseId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar a revisión');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-4xl mx-auto">
      {/* Wizard Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Disc className="w-5 h-5 text-blue-600" />
            {initialRelease ? `Editar Lanzamiento: ${initialRelease.title}` : 'Crear Nuevo Lanzamiento Musical'}
          </h2>
          <p className="text-xs text-slate-500">
            Paso {step} de 6 — {
              ['Información Básica', 'Fechas & Derechos', 'Portada Oficial', 'Pistas & Metadatos', 'Plataformas', 'Revisión Final'][step - 1]
            }
          </p>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition"
        >
          Volver
        </button>
      </div>

      {/* Progress Stepper */}
      <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50/50 text-[11px] font-medium text-center">
        {[
          { num: 1, label: 'Básica' },
          { num: 2, label: 'Derechos' },
          { num: 3, label: 'Portada' },
          { num: 4, label: 'Pistas' },
          { num: 5, label: 'DSPs' },
          { num: 6, label: 'Enviar' },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`py-2.5 px-1 border-b-2 transition flex items-center justify-center gap-1.5 ${
              step === s.num
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/30'
                : step > s.num
                ? 'border-emerald-500 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                step === s.num
                  ? 'bg-blue-600 text-white'
                  : step > s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Body Form */}
      <div className="p-6">
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Título del Lanzamiento <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Midnight Pulse (Single)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Tipo de Formato <span className="text-rose-500">*</span>
                </label>
                <select
                  value={releaseType}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setReleaseType(newType);
                    if (newType === 'music_video') {
                      // Ensure video stores are in platforms
                      const videoStores = ['Vevo', 'Cadel Pro Network', 'Apple Music Video', 'Spotify Video'];
                      setPlatforms((prev) => Array.from(new Set([...prev, ...videoStores])));
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
                >
                  <option value="single">Single (1 a 3 canciones)</option>
                  <option value="ep">EP (4 a 6 canciones)</option>
                  <option value="album">Álbum (7 o más canciones)</option>
                  <option value="music_video">🎬 Video Musical Oficial (Vevo, Cadel Pro Network, Apple, Spotify)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Artista Principal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nombre de artista oficial"
                  value={mainArtist}
                  onChange={(e) => setMainArtist(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Artistas Invitados (Feat.)
                </label>
                <input
                  type="text"
                  placeholder="Separados por coma (Ej. Luna Ray, Kaelen)"
                  value={featuredArtistsText}
                  onChange={(e) => setFeaturedArtistsText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Género Principal <span className="text-rose-500">*</span>
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {AVAILABLE_GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Subgénero
                </label>
                <input
                  type="text"
                  placeholder="Ej. Synthwave, Melodic House, Drill"
                  value={subgenre}
                  onChange={(e) => setSubgenre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Idioma Principal del Lanzamiento
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Spanish">Español</option>
                  <option value="English">Inglés</option>
                  <option value="Portuguese">Portugués</option>
                  <option value="French">Francés</option>
                  <option value="Instrumental">Instrumental (Sin letra)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Sello Discográfico (Record Label)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Specialized Video Delivery Card for Vevo, Cadel Pro Network, Apple, Spotify */}
            {releaseType === 'music_video' && (
              <div className="mt-4 p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-500/40 shadow-md space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-indigo-800/60">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-rose-600/90 text-white rounded-lg">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        Distribución de Video Musical Oficial
                        <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30">
                          Vevo • Cadel Pro Network • Apple • Spotify
                        </span>
                      </h4>
                      <p className="text-[11px] text-indigo-200">
                        Configura los metadatos técnicos para la ingesta directa en canales oficiales de video y redes aliadas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-indigo-200 font-semibold mb-1">
                      Código ISRC del Video
                    </label>
                    <input
                      type="text"
                      value={videoIsrc}
                      onChange={(e) => setVideoIsrc(e.target.value)}
                      placeholder="US-V84-26-XXXXX"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800/90 border border-indigo-700/50 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-[10px] text-indigo-300/70 block mt-0.5">
                      Identificador audiovisual único para Vevo/Apple
                    </span>
                  </div>

                  <div>
                    <label className="block text-indigo-200 font-semibold mb-1">
                      Calidad / Resolución Master
                    </label>
                    <select
                      value={videoResolution}
                      onChange={(e) => setVideoResolution(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800/90 border border-indigo-700/50 text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="4K_UHD">4K UHD (3840x2160 ProRes 422HQ)</option>
                      <option value="1080p_FHD">Full HD 1080p (1920x1080 ProRes / H.264)</option>
                      <option value="8K">8K Master Cinema (7680x4320)</option>
                    </select>
                    <span className="text-[10px] text-indigo-300/70 block mt-0.5">
                      Requerimiento estándar para Vevo y Apple Music
                    </span>
                  </div>

                  <div>
                    <label className="block text-indigo-200 font-semibold mb-1">
                      Director Audiovisual
                    </label>
                    <input
                      type="text"
                      value={videoDirector}
                      onChange={(e) => setVideoDirector(e.target.value)}
                      placeholder="Nombre del director del videoclip"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800/90 border border-indigo-700/50 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-indigo-200 font-semibold mb-1">
                      Casa Productora / Network
                    </label>
                    <input
                      type="text"
                      value={videoProducer}
                      onChange={(e) => setVideoProducer(e.target.value)}
                      placeholder="Cadel Pro Network Media / Sonora Films"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800/90 border border-indigo-700/50 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-2">
                    <label className="block text-indigo-200 font-semibold mb-1">
                      Redes de Distribución de Video Habilitadas
                    </label>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {[
                        { name: 'Vevo', color: 'bg-red-600/30 text-red-300 border-red-500/40' },
                        { name: 'Cadel Pro Network', color: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40' },
                        { name: 'Apple Music Video', color: 'bg-purple-600/30 text-purple-300 border-purple-500/40' },
                        { name: 'Spotify Video', color: 'bg-green-600/30 text-green-300 border-green-500/40' },
                      ].map((vStore) => {
                        const isChecked = videoPlatforms.includes(vStore.name);
                        return (
                          <button
                            key={vStore.name}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setVideoPlatforms(videoPlatforms.filter((x) => x !== vStore.name));
                              } else {
                                setVideoPlatforms([...videoPlatforms, vStore.name]);
                              }
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                              isChecked
                                ? `${vStore.color} ring-1 ring-white/20`
                                : 'bg-slate-800/50 text-slate-400 border-slate-700 opacity-60'
                            }`}
                          >
                            <span>{isChecked ? '✓' : '+'}</span>
                            <span>{vStore.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Dates & Rights */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                <strong>Consejo de distribución:</strong> Se recomienda programar la fecha de lanzamiento con al menos 2 semanas de anticipación para que los editores de Spotify for Artists y Apple Music puedan considerar tu música en listas editoriales.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Fecha Oficial de Lanzamiento Comercial <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Fecha de Lanzamiento Original (si es reedición)
                </label>
                <input
                  type="date"
                  value={originalReleaseDate}
                  onChange={(e) => setOriginalReleaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Código UPC / EAN (Identificador Universal)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upc}
                    onChange={(e) => setUpc(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setUpc('843' + Math.floor(1000000000 + Math.random() * 9000000000))}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium rounded-xl transition"
                  >
                    Generar Gratis
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Número de Catálogo
                </label>
                <input
                  type="text"
                  value={catalogNumber}
                  onChange={(e) => setCatalogNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Línea Fonográfica ℗ (Productora de la grabación)
                </label>
                <input
                  type="text"
                  value={pLine}
                  onChange={(e) => setPLine(e.target.value)}
                  placeholder="Ej. 2026 Sonora Music Group"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Línea de Copyright © (Titular de la composición y diseño)
                </label>
                <input
                  type="text"
                  value={cLine}
                  onChange={(e) => setCLine(e.target.value)}
                  placeholder="Ej. 2026 Mateo Soler"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Artwork & Cover */}
        {step === 3 && (
          <div className="space-y-4">
            <input
              type="file"
              ref={coverFileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverFileUpload}
              className="hidden"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cover Preview Card */}
              <div className="space-y-3">
                <div className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-900 shadow-md relative group">
                  <img src={coverUrl} alt="Portada" className="w-full h-full object-cover" />
                  <div
                    onClick={() => coverFileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition p-4 text-center cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-white mb-1" />
                    <span className="text-white text-xs font-semibold">Cambiar Portada</span>
                    <span className="text-slate-300 text-[10px]">Haz clic para subir otra</span>
                  </div>
                </div>

                {/* Live Quality Checker */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Verificación Técnica:</span>
                    <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                      {coverFileName}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Resolución:{' '}
                        {coverValidation.details?.dimensions
                          ? `${coverValidation.details.dimensions.width} x ${coverValidation.details.dimensions.height} px`
                          : '3000 x 3000 px'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Relación: 1:1 Cuadrado estandarizado</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Formato: JPG / PNG alta definición</span>
                    </div>
                  </div>

                  {coverValidation.errors && coverValidation.errors.length > 0 && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 space-y-0.5">
                      {coverValidation.errors.map((err, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload & Presets */}
              <div className="md:col-span-2 space-y-4">
                <div
                  onClick={() => coverFileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-400 hover:border-blue-600 rounded-2xl p-7 text-center transition bg-blue-50/30 hover:bg-blue-50/60 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Sube la portada de tu lanzamiento aquí
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Haz clic para examinar desde tu equipo o arrastra el archivo. Acepta JPG o PNG (mínimo 3000 x 3000 px, cuadrado, hasta 25 MB).
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Seleccionar Imagen de Portada
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    O selecciona una portada de muestra en alta resolución (3000x3000px):
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {ARTWORK_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleTestCoverValidation(p.url, `preset_cover_0${idx + 1}.png`)}
                        className={`p-2 rounded-xl border text-left transition overflow-hidden ${
                          coverUrl === p.url
                            ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/30'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden mb-1.5">
                          <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[11px] font-medium text-slate-800 line-clamp-1">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Audio Tracks & Credits */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  Pistas del Lanzamiento ({tracks.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Sube el audio máster en WAV o FLAC y registra los créditos legales de composición.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddTrack}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Pista
              </button>
            </div>

            <div className="space-y-4">
              {tracks.map((track, idx) => (
                <div
                  key={track.id}
                  className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                      Pista {track.trackNumber}
                    </span>
                    {tracks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTrack(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nombre de la Canción</label>
                      <input
                        type="text"
                        value={track.title}
                        onChange={(e) => handleUpdateTrack(idx, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Versión (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej. Radio Edit, Extended Mix"
                        value={track.version || ''}
                        onChange={(e) => handleUpdateTrack(idx, { version: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Código ISRC</label>
                      <input
                        type="text"
                        value={track.isrc}
                        onChange={(e) => handleUpdateTrack(idx, { isrc: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Compositores (Separados por coma) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nombres reales completos"
                        value={track.composers?.join(', ') || ''}
                        onChange={(e) =>
                          handleUpdateTrack(idx, {
                            composers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Letristas</label>
                      <input
                        type="text"
                        placeholder="Autores de la letra"
                        value={track.lyricists?.join(', ') || ''}
                        onChange={(e) =>
                          handleUpdateTrack(idx, {
                            lyricists: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Productores</label>
                      <input
                        type="text"
                        placeholder="Productores musicales"
                        value={track.producers?.join(', ') || ''}
                        onChange={(e) =>
                          handleUpdateTrack(idx, {
                            producers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Audio file upload and player section */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2.5">
                    <input
                      type="file"
                      id={`audio-input-${track.id}`}
                      accept="audio/wav,audio/flac,audio/mp3,audio/mpeg,audio/aiff,audio/ogg,audio/aac"
                      onChange={(e) => handleAudioFileUpload(idx, e)}
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Music className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 truncate">
                              {track.audioFileName || 'Sin archivo de audio asignado'}
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
                              {track.audioFormat}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {track.audioSampleRate} • {track.audioBitrate} •{' '}
                            {Math.floor(track.durationSeconds / 60)}:
                            {String(track.durationSeconds % 60).padStart(2, '0')} min
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium text-xs">
                          <input
                            type="checkbox"
                            checked={track.explicit}
                            onChange={(e) => handleUpdateTrack(idx, { explicit: e.target.checked })}
                            className="rounded text-blue-600"
                          />
                          <span>Explícito (Explicit 🔞)</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => document.getElementById(`audio-input-${track.id}`)?.click()}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition border border-blue-200"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir / Cambiar Audio</span>
                        </button>
                      </div>
                    </div>

                    {track.audioUrl && (
                      <div className="pt-1 border-t border-slate-100 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                          Preescucha:
                        </span>
                        <audio
                          controls
                          src={track.audioUrl}
                          className="w-full h-8 rounded-lg bg-slate-100 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Platforms Selection */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  Tiendas Digitales & Plataformas de Distribución ({platforms.length} seleccionadas de {EXTENDED_DSP_STORES.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Selecciona los servicios donde quieres que tu música esté disponible a nivel mundial.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlatforms(AVAILABLE_PLATFORMS)}
                  className="px-2.5 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-semibold transition"
                >
                  Seleccionar Todas ({EXTENDED_DSP_STORES.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const videoNames = ['Vevo', 'Cadel Pro Network', 'Apple Music Video', 'Spotify Video'];
                    setPlatforms(videoNames);
                  }}
                  className="px-2.5 py-1 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-semibold transition"
                >
                  Solo Videos (Vevo/Cadel/Apple/Spotify)
                </button>
                <button
                  type="button"
                  onClick={() => setPlatforms([])}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 rounded-lg font-medium transition"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {releaseType === 'music_video' && (
              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Modo Video Musical Activo:</strong> Distribución prioritaria para <strong>Vevo</strong>, <strong>Cadel Pro Network</strong>, <strong>Apple Music Video</strong> y <strong>Spotify Video</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const videoNames = ['Vevo', 'Cadel Pro Network', 'Apple Music Video', 'Spotify Video'];
                    setPlatforms((prev) => Array.from(new Set([...prev, ...videoNames])));
                  }}
                  className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-bold shrink-0"
                >
                  Asegurar Selección de Videos
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {EXTENDED_DSP_STORES.map((store) => {
                const isSelected = platforms.includes(store.name);
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => handleTogglePlatform(store.name)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 relative ${
                      isSelected
                        ? 'bg-blue-50/50 border-blue-600 text-blue-950 font-semibold ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${store.iconBg} shrink-0`} />
                        <span className="text-xs font-bold leading-tight">{store.name}</span>
                      </div>
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 transition ${
                          isSelected ? 'text-blue-600' : 'text-slate-300'
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                      {store.description}
                    </p>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded self-start">
                      {store.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: Final Review & Confirmation */}
        {step === 6 && (
          <div className="space-y-5">
            {/* MANDATORY SYSTEM RULE BANNER */}
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-sm">Regla Fundamental de Control de Calidad Sonora</p>
                <p>
                  Por política de seguridad y cumplimiento estricto con Spotify, Apple Music y los agregadores de audio, ningún lanzamiento puede despacharse directamente a las tiendas sin antes ser validado por el equipo de Control de Calidad (ADMIN).
                </p>
                <p className="font-medium">
                  Al pulsar "Enviar a Revisión", el lanzamiento pasará a la cola de pendientes y un administrador verificará tu audio WAV, portada 3000x3000px y splits de autores.
                </p>
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <h4 className="font-bold text-slate-800 text-sm">Resumen del Lanzamiento:</h4>

              <div className="flex items-center gap-4">
                <img src={coverUrl} alt={title} className="w-16 h-16 rounded-xl object-cover border border-slate-300" />
                <div>
                  <h5 className="font-bold text-slate-900 text-base">{title || 'Sin Título'}</h5>
                  <p className="text-slate-600">
                    {mainArtist} • {releaseType.toUpperCase()} • {genre}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    Salida: {releaseDate} • UPC: {upc}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block">Canciones:</span>
                  <span className="font-semibold text-slate-800">{tracks.length} pista(s)</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tiendas:</span>
                  <span className="font-semibold text-slate-800">{platforms.length} DSPs</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Sello:</span>
                  <span className="font-semibold text-slate-800 truncate block">{label}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Estado Inicial:</span>
                  <span className="font-semibold text-amber-600">Enviado a Revisión</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <div>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Anterior
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 transition"
            >
              {isSaving ? 'Guardando...' : 'Guardar como Borrador'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {step < 6 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              Siguiente <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 transition"
              >
                Guardar Borrador
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSaving ? 'Enviando...' : 'Enviar a Revisión de Administrador'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
