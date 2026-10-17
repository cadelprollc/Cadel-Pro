import React, { useState } from 'react';
import { Release, DistributionProvider, Track } from '../types.js';
import { ReleaseStatusBadge } from './ReleaseStatusBadge.js';
import { ReleaseStatusTracker } from './ReleaseStatusTracker.js';
import {
  X,
  Play,
  Pause,
  Disc,
  Calendar,
  Barcode,
  Radio,
  Globe,
  History,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
  MessageSquare,
  Edit3,
  Music2,
  ExternalLink,
  ShieldCheck,
  FileText,
  Info,
  Clock,
  Send,
} from 'lucide-react';

interface Props {
  release: Release;
  providers: DistributionProvider[];
  onClose: () => void;
  onEditRelease?: (release: Release) => void;
  onContactSupport?: (release: Release) => void;
}

export const ArtistReleaseDetailModal: React.FC<Props> = ({
  release,
  providers,
  onClose,
  onEditRelease,
  onContactSupport,
}) => {
  const [activeTab, setActiveTab] = useState<'distribution' | 'tracks' | 'dsps' | 'history'>('distribution');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Find assigned provider details
  const assignedProvider = providers.find((p) => p.id === release.assignedProviderId) || {
    id: release.assignedProviderId || 'fuga',
    name: release.assignedProviderId ? 'Gateway B2B Oficial' : 'Pendiente de Asignación por Super Admin',
    type: 'ddex_ern',
    status: 'active',
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleAudioToggle = (trackId: string) => {
    if (isPlaying === trackId) {
      setIsPlaying(null);
    } else {
      setIsPlaying(trackId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div
        id="artist-release-detail-modal"
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-sm">
              <Disc className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{release.title}</h2>
                <ReleaseStatusBadge status={release.status} size="sm" />
              </div>
              <p className="text-xs text-slate-500">
                Por <span className="font-semibold text-slate-700">{release.mainArtist}</span> • {release.releaseType.toUpperCase()} • ID:{' '}
                <code className="bg-slate-200/70 px-1.5 py-0.5 rounded text-[11px] font-mono">{release.id}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onContactSupport && (
              <button
                type="button"
                onClick={() => onContactSupport(release)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-blue-200 shadow-sm"
                title="Enviar mensaje al Super Admin sobre este lanzamiento"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Consultar con Admin</span>
              </button>
            )}

            {(release.status === 'draft' || release.status === 'changes_requested') && onEditRelease && (
              <button
                type="button"
                onClick={() => onEditRelease(release)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Borrador</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition"
              title="Cerrar ficha"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Tracker & QC Notice */}
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-200">
          <ReleaseStatusTracker
            status={release.status}
            rejectionReason={release.rejectionReason}
            changeRequestItems={release.changeRequestItems}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-xs sm:text-sm font-medium bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'distribution'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Detalles de Distribución (Asignados)
          </button>
          <button
            onClick={() => setActiveTab('tracks')}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'tracks'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Music2 className="w-4 h-4" />
            Pistas & Códigos ISRC ({release.tracks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('dsps')}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'dsps'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            Tiendas Digitales & DSPs ({release.platforms?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            Historial de Distribución
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
          {/* TAB 1: DISTRIBUTION DETAILS ASSIGNED BY SUPER ADMIN */}
          {activeTab === 'distribution' && (
            <div className="space-y-6">
              {/* Highlight Card: Official Distribution Metadata */}
              <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-400/30">
                      Ficha de Distribución Oficial
                    </span>
                    <h3 className="text-xl font-black mt-2 tracking-tight">
                      Detalles Asignados por el Administrador
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      El Super Admin ha procesado este fonograma, asignando los identificadores de la industria digital y enlazándolo con los canales de entrega DDEX.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-2 rounded-xl border border-white/10 shrink-0">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-300">Proveedor Asignado</p>
                      <p className="text-xs font-bold text-white">{assignedProvider.name}</p>
                    </div>
                  </div>
                </div>

                {/* 3-Pillar Codes Display */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
                  {/* Pillar 1: UPC */}
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Barcode className="w-4 h-4 text-emerald-400" />
                        Código UPC Oficial
                      </span>
                      {release.upc && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(release.upc || '', 'upc')}
                          className="hover:text-white transition flex items-center gap-1 text-[11px]"
                          title="Copiar código UPC"
                        >
                          {copiedText === 'upc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedText === 'upc' ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      )}
                    </div>
                    <p className="text-lg font-mono font-bold tracking-wider text-emerald-300">
                      {release.upc || 'Pendiente de Asignación por QC'}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      Código de barras global único para tiendas físicas y digitales
                    </span>
                  </div>

                  {/* Pillar 2: Release Date & Schedule */}
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        Fecha de Lanzamiento
                      </span>
                    </div>
                    <p className="text-lg font-bold tracking-tight text-white">
                      {release.releaseDate || 'Inmediata'}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      Programación horaria: 00:00 AM (Zona horaria local del oyente)
                    </span>
                  </div>

                  {/* Pillar 3: Record Label */}
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Disc className="w-4 h-4 text-purple-400" />
                        Sello Discográfico
                      </span>
                    </div>
                    <p className="text-lg font-bold tracking-tight text-purple-200 truncate">
                      {release.label || 'Independiente'}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      Catálogo Nº: <code className="font-mono text-white">{release.catalogNumber || 'N/A'}</code>
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid: Metadata Details & Admin Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Release Details & Copyright */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100 text-sm">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Metadatos y Derechos Fonográficos
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 font-medium block">Género Principal:</span>
                      <span className="font-bold text-slate-800">{release.genre}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">Subgénero:</span>
                      <span className="font-bold text-slate-800">{release.subgenre || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">Idioma del Lanzamiento:</span>
                      <span className="font-bold text-slate-800">{release.language || 'Español'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">Formato Fonograma:</span>
                      <span className="font-bold text-slate-800 uppercase">{release.releaseType}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div>
                      <span className="text-slate-500 font-medium block">Línea Fonográfica ℗ (P-Line):</span>
                      <span className="font-mono text-slate-700 font-semibold">{release.pLine || `℗ ${new Date().getFullYear()} ${release.label || release.mainArtist}`}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">Línea de Copyright © (C-Line):</span>
                      <span className="font-mono text-slate-700 font-semibold">{release.cLine || `© ${new Date().getFullYear()} ${release.label || release.mainArtist}`}</span>
                    </div>
                  </div>
                </div>

                {/* Cover & Technical Specs */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100 text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Portada y Validación de Archivos
                  </h4>

                  <div className="flex items-center gap-4">
                    <img
                      src={release.coverUrl}
                      alt={release.title}
                      className="w-24 h-24 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                    />
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p className="font-semibold text-slate-900">Carátula Oficial Verificada</p>
                      <p>Resolución: 3000 x 3000 px (1:1 RGB)</p>
                      <p>Formato de entrega: JPG / PNG sin compresión</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Cumple estándares Apple Music & Spotify
                      </span>
                    </div>
                  </div>

                  {/* Super Admin Evaluation / Notes */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500 font-medium block mb-1">Dictamen del Super Administrador:</span>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-sans text-xs">
                      {release.status === 'approved' || release.status === 'in_distribution' || release.status === 'published' || release.status === 'distributed' ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Aprobado por el Super Admin
                          </div>
                          <p className="text-slate-600">
                            Fonograma auditado satisfactoriamente. Audios WAV conformes con estándares de masterización (44.1kHz / 24-bit), metadatos DDEX aprobados y códigos UPC/ISRC asignados.
                          </p>
                        </div>
                      ) : release.status === 'changes_requested' ? (
                        <div className="space-y-1 text-rose-700">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Correcciones Solicitadas
                          </div>
                          <p className="text-rose-600">
                            Por favor revisa la pestaña de avisos o el botón de editar para ajustar los metadatos o archivos señalados por el equipo de calidad.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1 text-slate-600">
                          <div className="flex items-center gap-1.5 font-semibold text-amber-600">
                            <Clock className="w-3.5 h-3.5" />
                            En Cola de Control de Calidad
                          </div>
                          <p>
                            Tu fonograma está siendo verificado por el Super Admin antes de programar la entrega a los DSPs.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRACKS & ASSIGNED ISRC CODES */}
          {activeTab === 'tracks' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-blue-600" />
                    Códigos ISRC Asignados por Canción
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cada pista cuenta con su identificador internacional ISRC único para el rastreo y recaudo de regalías.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                  {release.tracks?.length || 0} Pista(s) Registrada(s)
                </span>
              </div>

              <div className="space-y-3">
                {release.tracks?.map((track, idx) => (
                  <div
                    key={track.id || idx}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleAudioToggle(track.id)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition shadow-sm ${
                            isPlaying === track.id
                              ? 'bg-blue-600 text-white animate-pulse'
                              : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                          title={isPlaying === track.id ? 'Pausar audio master' : 'Escuchar audio master'}
                        >
                          {isPlaying === track.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-400">#{track.trackNumber}</span>
                            <h4 className="font-bold text-slate-900 text-sm">{track.title}</h4>
                            {track.version && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                                {track.version}
                              </span>
                            )}
                            {track.explicit && (
                              <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                                EXPLICIT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {release.mainArtist} • Duración: {Math.floor((track.durationSeconds || 210) / 60)}:{String((track.durationSeconds || 210) % 60).padStart(2, '0')} • Formato: {track.audioFormat || 'WAV 24-bit 44.1kHz'}
                          </p>
                        </div>
                      </div>

                      {/* Assigned ISRC Box */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 flex items-center justify-between sm:justify-end gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                            Código ISRC Asignado
                          </span>
                          <span className="font-mono font-bold text-sm text-emerald-950">
                            {track.isrc || 'Pendiente de QC'}
                          </span>
                        </div>

                        {track.isrc && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(track.isrc, `isrc-${idx}`)}
                            className="p-1.5 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100/70 rounded-lg transition"
                            title="Copiar código ISRC"
                          >
                            {copiedText === `isrc-${idx}` ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Authors Details */}
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-700">Compositores: </span>
                        <span>{track.composers?.join(', ') || 'No especificado'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Letristas / Autores: </span>
                        <span>{track.lyricists?.join(', ') || 'No especificado'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Productores: </span>
                        <span>{track.producers?.join(', ') || 'No especificado'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DSP STORES & DIGITAL PLATFORMS */}
          {activeTab === 'dsps' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Plataformas y Tiendas Digitales (DSPs) Seleccionadas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  El fonograma es entregado a los servidores de streaming y redes sociales globales a través del lote DDEX ERN.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(release.platforms && release.platforms.length > 0
                  ? release.platforms
                  : ['spotify', 'apple_music', 'amazon_music', 'youtube_music', 'deezer', 'tiktok', 'meta_audio']
                ).map((dspKey: string) => {
                  const dspNameFormatted = dspKey
                    .split('_')
                    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');

                  const isLive = release.status === 'published';
                  const isDelivered = release.status === 'distributed' || isLive;

                  return (
                    <div
                      key={dspKey}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {dspKey.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">{dspNameFormatted}</p>
                          <span className="text-[10px] text-slate-400">Entrega DDEX 4.3</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          isLive
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDelivered
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isLive ? 'En Vivo' : isDelivered ? 'Entregado' : 'Programado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: DISTRIBUTION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  Línea de Tiempo y Auditoría de Distribución
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro cronológico de eventos registrados por el sistema y el Super Administrador.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {release.history && release.history.length > 0 ? (
                    release.history.map((event, idx) => (
                      <div key={idx} className="relative flex items-start gap-4 text-xs">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-sm">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 pt-0.5 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                              {event.action}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-600">{event.details || 'Evento procesado'}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Usuario: {event.userName} ({event.role})
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-4">
                      <div className="relative flex items-start gap-4 text-xs">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-sm">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Lanzamiento Creado y Registrado</p>
                          <p className="text-slate-500">El artista completó el asistente de metadatos y subió los archivos master.</p>
                        </div>
                      </div>

                      <div className="relative flex items-start gap-4 text-xs">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-sm">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Enviado a Control de Calidad</p>
                          <p className="text-slate-500">Pendiente de auditoría técnica por el Super Administrador.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ficha oficial protegida y certificada por Sonora SaaS</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
