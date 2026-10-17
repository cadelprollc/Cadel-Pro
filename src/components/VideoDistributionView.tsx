import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Search,
  Filter,
  Play,
  Film,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Trash2,
  Check,
  Copy,
  ExternalLink,
  Tv,
  Globe,
  MonitorPlay,
  X,
} from 'lucide-react';
import { VideoRelease, User, Role } from '../types.js';
import { api } from '../lib/api.js';
import { NewVideoModal } from './NewVideoModal.js';

interface Props {
  currentUser: User;
  role: Role;
  onVideosChange?: () => void;
}

export const VideoDistributionView: React.FC<Props> = ({ currentUser, role, onVideosChange }) => {
  const [videos, setVideos] = useState<VideoRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoRelease | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoRelease | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<VideoRelease | null>(null);
  const [changeRequestVideo, setChangeRequestVideo] = useState<VideoRelease | null>(null);
  const [changeNotes, setChangeNotes] = useState('');
  const [copiedIsrc, setCopiedIsrc] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await api.getVideos();
      setVideos(res.videos || []);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleCopyIsrc = (isrc: string) => {
    navigator.clipboard.writeText(isrc);
    setCopiedIsrc(isrc);
    setTimeout(() => setCopiedIsrc(null), 2000);
  };

  const handleUpdateStatus = async (videoId: string, newStatus: string, notes?: string) => {
    setActionLoadingId(videoId);
    try {
      const res = await api.updateVideoStatus(videoId, newStatus, notes);
      setVideos((prev) => prev.map((v) => (v.id === videoId ? res.video : v)));
      onVideosChange?.();
      showToast(
        newStatus === 'distributed'
          ? '¡Videoclip aprobado y distribuido exitosamente!'
          : newStatus === 'under_review'
          ? '¡Videoclip enviado a revisión QC correctamente!'
          : 'Estado del video actualizado correctamente.'
      );
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar el estado del video', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingVideo) return;
    const videoId = deletingVideo.id;
    setActionLoadingId(videoId);
    try {
      await api.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      onVideosChange?.();
      showToast('Video eliminado correctamente del catálogo.');
      setDeletingVideo(null);
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar el video', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmChangeRequest = async () => {
    if (!changeRequestVideo || !changeNotes.trim()) {
      showToast('Por favor introduce las notas de los cambios requeridos', 'error');
      return;
    }
    await handleUpdateStatus(changeRequestVideo.id, 'changes_requested', changeNotes.trim());
    setChangeRequestVideo(null);
    setChangeNotes('');
  };

  // Filtered videos
  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.isrc.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalVideos = videos.length;
  const underReviewCount = videos.filter((v) => v.status === 'under_review' || v.status === 'submitted').length;
  const distributedCount = videos.filter((v) => v.status === 'distributed' || v.status === 'published').length;
  const totalViews = videos.reduce((sum, v) => sum + (v.viewsCount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'distributed':
      case 'published':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Distribuido en VEVO/Apple
          </span>
        );
      case 'under_review':
      case 'submitted':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            En Revisión QC
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Aprobado para Ingesta
          </span>
        );
      case 'changes_requested':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Cambios Requeridos
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-700/50 text-emerald-200'
              : 'bg-rose-950 border-rose-700/50 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-rose-800/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
              <Film className="w-3.5 h-3.5" />
              <span>Distribución Audiovisual Oficial de Alta Calidad</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Distribución de Videos Musicales
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Distribuye tus videoclips oficiales directamente a <strong>VEVO</strong>,{' '}
              <strong>Apple Music Video</strong>, <strong>Tidal Masters</strong>,{' '}
              <strong>YouTube Official Artist Channel</strong> y <strong>Cadel Pro Network</strong> con ingesta máster en 4K UHD.
            </p>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="self-start md:self-center px-5 py-3 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg hover:shadow-rose-600/30 transition flex items-center gap-2 shrink-0 transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Distribuir Nuevo Video</span>
          </button>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Videos
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-800">{totalVideos}</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
            En Revisión QC
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-600">{underReviewCount}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
            Distribuidos VEVO/Apple
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-600">{distributedCount}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
            Visualizaciones Totales
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-rose-600">
              {totalViews.toLocaleString('es-ES')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por videoclip, artista o código ISRC..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-xs text-slate-700"
          >
            <option value="all">Todos los estados ({videos.length})</option>
            <option value="under_review">En Revisión QC</option>
            <option value="approved">Aprobados</option>
            <option value="distributed">Distribuidos</option>
            <option value="changes_requested">Cambios Requeridos</option>
          </select>
        </div>
      </div>

      {/* Videos List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
          Cargando catálogo audiovisual...
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <Film className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No se encontraron videos musicales</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Aún no has distribuido videos musicales oficiales. Pulsa el botón inferior para comenzar a distribuir en VEVO y Apple Music Video.
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Distribuir Primer Video Musical
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col justify-between"
            >
              {/* Thumbnail & Video Banner */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden group">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/40 flex flex-col justify-between p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black rounded-lg border border-white/20">
                      {video.resolution} • {video.aspectRatio}
                    </span>

                    <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                      {video.videoType === 'official_music_video'
                        ? 'Videoclip Oficial'
                        : video.videoType === 'lyric_video'
                        ? 'Lyric Video'
                        : 'Visualizer'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setPreviewVideo(video)}
                      className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-lg transition backdrop-blur-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Reproducir Video
                    </button>

                    <span className="text-white text-[11px] font-mono bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                      {Math.floor(video.durationSeconds / 60)}:
                      {String(video.durationSeconds % 60).padStart(2, '0')} min
                    </span>
                  </div>
                </div>
              </div>

              {/* Content info */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm leading-snug">
                        {video.title}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        {video.artistName}
                        {video.featuredArtists && video.featuredArtists.length > 0 && (
                          <span className="text-slate-400 font-normal">
                            {' '}feat. {video.featuredArtists.join(', ')}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="shrink-0">{getStatusBadge(video.status)}</div>
                  </div>

                  {/* Metadata tags */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Código ISRC:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                        <span>{video.isrc}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyIsrc(video.isrc)}
                          className="text-slate-400 hover:text-slate-700"
                          title="Copiar ISRC"
                        >
                          {copiedIsrc === video.isrc ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Director & Productora:</span>
                      <span className="font-semibold truncate block text-slate-800">
                        {video.director || video.videoProducer}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Canal VEVO:</span>
                      <span className="font-mono text-rose-700 font-bold">
                        {video.vevoChannel || 'Canal Pendiente'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Estreno Mundial:</span>
                      <span className="font-semibold text-slate-800">{video.releaseDate}</span>
                    </div>
                  </div>

                  {/* Platforms distributed */}
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-1">
                      Plataformas Audiovisuales:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {video.platforms.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {video.reviewNotes && (
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                      <strong>Nota QC:</strong> {video.reviewNotes}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewVideo(video)}
                      className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5 transition"
                    >
                      <MonitorPlay className="w-3.5 h-3.5 text-rose-600" />
                      <span>Ver Detalles</span>
                    </button>

                    <button
                      onClick={() => setEditingVideo(video)}
                      className="px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition"
                      title="Editar metadatos o archivos del video"
                    >
                      Editar
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Artist Actions when changes requested */}
                    {role === 'artist' && video.status === 'changes_requested' && (
                      <button
                        disabled={actionLoadingId === video.id}
                        onClick={() =>
                          handleUpdateStatus(
                            video.id,
                            'under_review',
                            'Reenviado con correcciones por el artista para revisión técnica.'
                          )
                        }
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Reenviar a QC</span>
                      </button>
                    )}

                    {/* Admin Actions */}
                    {(role === 'admin' || role === 'super_admin') && (
                      <>
                        {video.status !== 'distributed' && (
                          <button
                            disabled={actionLoadingId === video.id}
                            onClick={() =>
                              handleUpdateStatus(
                                video.id,
                                'distributed',
                                'Aprobado y distribuido a Vevo, Apple Music Video y redes aliadas.'
                              )
                            }
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aprobar Vevo</span>
                          </button>
                        )}
                        {video.status === 'under_review' && (
                          <button
                            disabled={actionLoadingId === video.id}
                            onClick={() => {
                              setChangeRequestVideo(video);
                              setChangeNotes('');
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition border border-amber-200"
                          >
                            Solicitar Cambios
                          </button>
                        )}
                      </>
                    )}

                    <button
                      disabled={actionLoadingId === video.id}
                      onClick={() => setDeletingVideo(video)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Eliminar Video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-800 overflow-hidden shadow-2xl text-white">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-white">{previewVideo.title}</h3>
                <p className="text-xs text-slate-400">
                  {previewVideo.artistName} • ISRC: {previewVideo.isrc} • {previewVideo.resolution}
                </p>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                controls
                autoPlay
                src={previewVideo.videoUrl}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 bg-slate-900 text-xs space-y-2 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">
                    {previewVideo.resolution}
                  </span>
                  <span className="text-slate-300">
                    Canal Vevo: <strong>{previewVideo.vevoChannel || 'SolerEclipseVEVO'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Plataformas:</span>
                  <span className="text-white font-semibold">
                    {previewVideo.platforms.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Replaces browser confirm) */}
      {deletingVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-slate-900 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">¿Eliminar Video Musical?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Estás a punto de eliminar el videoclip <strong>"{deletingVideo.title}"</strong> ({deletingVideo.isrc}). Esta acción cancelará las solicitudes de ingesta pendientes.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingVideo(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QC Change Request Modal (Replaces browser prompt) */}
      {changeRequestVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-slate-900 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Solicitar Modificaciones QC</h3>
                  <p className="text-xs text-slate-500 truncate max-w-xs">{changeRequestVideo.title}</p>
                </div>
              </div>
              <button
                onClick={() => setChangeRequestVideo(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Observaciones y cambios requeridos al artista:
              </label>
              <textarea
                rows={4}
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="Describe qué aspectos técnicos deben ajustarse (p. ej. relación de aspecto, nivel de audio -14 LUFS, compresión de video, o canal VEVO)..."
                className="w-full p-3 border border-slate-300 rounded-2xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setChangeRequestVideo(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmChangeRequest}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Enviar Solicitud al Artista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Video Distribution Modal */}
      {isNewModalOpen && (
        <NewVideoModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          currentUser={currentUser}
          onSuccess={(newVid) => {
            setVideos((prev) => [newVid, ...prev]);
            onVideosChange?.();
            showToast('¡Videoclip enviado a control de calidad QC con éxito!');
          }}
        />
      )}

      {/* Edit Video Distribution Modal */}
      {editingVideo && (
        <NewVideoModal
          isOpen={!!editingVideo}
          initialVideo={editingVideo}
          onClose={() => setEditingVideo(null)}
          currentUser={currentUser}
          onSuccess={(updatedVid) => {
            setVideos((prev) => prev.map((v) => (v.id === updatedVid.id ? updatedVid : v)));
            onVideosChange?.();
            setEditingVideo(null);
            showToast('¡Detalles del videoclip actualizados correctamente!');
          }}
        />
      )}
    </div>
  );
};
