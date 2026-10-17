import React, { useState, useEffect } from 'react';
import { Release, DistributionProvider, Track } from '../types.js';
import { ReleaseStatusBadge } from './ReleaseStatusBadge.js';
import {
  X,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit3,
  Globe,
  Music2,
  FileText,
  History,
  ShieldCheck,
  Disc,
  Calendar,
  Volume2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  Barcode,
  DollarSign,
  MessageSquare,
  Sparkles,
  Save,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  release: Release;
  providers: DistributionProvider[];
  onClose: () => void;
  onApprove: (id: string, providerId: string, notes: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onRequestChanges: (id: string, items: string[], notes: string) => Promise<void>;
  onAdminEdit: (id: string, updates: Partial<Release>) => Promise<void>;
  onSimulateWebhook: (id: string, event: 'distributed' | 'published' | 'takedown') => Promise<void>;
  onOpenMessage?: (artistId: string, artistName: string, releaseId?: string, releaseTitle?: string) => void;
  onOpenDeposit?: (artistId: string, artistName: string, releaseId?: string, releaseTitle?: string) => void;
}

export const AdminReviewModal: React.FC<Props> = ({
  release,
  providers,
  onClose,
  onApprove,
  onReject,
  onRequestChanges,
  onAdminEdit,
  onSimulateWebhook,
  onOpenMessage,
  onOpenDeposit,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tracks' | 'codes' | 'history' | 'dsp' | 'edit'>('overview');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<number>(0);

  // Modals / Action States
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'changes' | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    release.assignedProviderId || (providers[0]?.id || 'prov-01')
  );
  const [approvalNotes, setApprovalNotes] = useState('Conformidad técnica en audio WAV 24-bit, portada 3000x3000px y metadatos ISRC/UPC.');
  const [rejectReason, setRejectReason] = useState('');
  const [changeItems, setChangeItems] = useState<string[]>([
    'Subir portada en resolución de al menos 3000x3000 píxeles, formato cuadrado 1:1, RGB sin bordes ni marcas de agua.',
    'Corregir información del compositor y letrista en la pista 1.',
  ]);
  const [customChangeInput, setCustomChangeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual ISRC & UPC code state for Super Admin
  const [editableTracks, setEditableTracks] = useState<Track[]>(
    release.tracks ? JSON.parse(JSON.stringify(release.tracks)) : []
  );
  const [editableUpc, setEditableUpc] = useState<string>(release.upc || '');
  const [codesSavedSuccess, setCodesSavedSuccess] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2500);
    }
  };

  useEffect(() => {
    if (release.tracks) {
      setEditableTracks(JSON.parse(JSON.stringify(release.tracks)));
    }
    if (release.upc) {
      setEditableUpc(release.upc);
      setEditForm((prev) => ({ ...prev, upc: release.upc }));
    }
  }, [release.id, release.upc, release.tracks]);

  const generateOfficialUpc = () => {
    const generated = '843' + Math.floor(1000000000 + Math.random() * 9000000000);
    setEditableUpc(generated);
    setEditForm((prev) => ({ ...prev, upc: generated }));
  };

  const generateOfficialIsrc = (trackIndex: number) => {
    const generated = 'ES-A01-26-' + Math.floor(10000 + Math.random() * 90000);
    setEditableTracks((prev) => {
      const next = [...prev];
      next[trackIndex] = { ...next[trackIndex], isrc: generated };
      return next;
    });
  };

  const generateAllMissingCodes = () => {
    if (!editableUpc || editableUpc === 'PENDIENTE') {
      generateOfficialUpc();
    }
    setEditableTracks((prev) =>
      prev.map((t) => ({
        ...t,
        isrc: !t.isrc || t.isrc === 'PENDIENTE' ? 'ES-A01-26-' + Math.floor(10000 + Math.random() * 90000) : t.isrc,
      }))
    );
  };

  const handleSaveCodesAndDetails = async () => {
    setIsSubmitting(true);
    try {
      await onAdminEdit(release.id, {
        upc: editableUpc,
        tracks: editableTracks,
      });
      setCodesSavedSuccess('¡Códigos ISRC (IRS) y UPC guardados exitosamente en la base de datos!');
      setTimeout(() => setCodesSavedSuccess(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSingleTrackIsrc = async (trackIndex: number) => {
    setIsSubmitting(true);
    try {
      await onAdminEdit(release.id, {
        upc: editableUpc,
        tracks: editableTracks,
      });
      const trackTitle = editableTracks[trackIndex]?.title || `Pista ${trackIndex + 1}`;
      setCodesSavedSuccess(`¡Código ISRC de "${trackTitle}" guardado exitosamente!`);
      setTimeout(() => setCodesSavedSuccess(null), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick edit form state
  const [editForm, setEditForm] = useState({
    title: release.title,
    mainArtist: release.mainArtist,
    genre: release.genre,
    subgenre: release.subgenre,
    label: release.label,
    catalogNumber: release.catalogNumber,
    upc: release.upc,
    pLine: release.pLine,
    cLine: release.cLine,
    releaseDate: release.releaseDate,
    language: release.language,
  });

  const handleAudioToggle = (trackId: string) => {
    if (isPlaying === trackId) {
      setIsPlaying(null);
    } else {
      setIsPlaying(trackId);
      // simulate progressive playback
      setAudioProgress(25);
    }
  };

  const handleApproveSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editableUpc !== release.upc || JSON.stringify(editableTracks) !== JSON.stringify(release.tracks)) {
        await onAdminEdit(release.id, {
          upc: editableUpc,
          tracks: editableTracks,
        });
      }
      await onApprove(release.id, selectedProviderId, approvalNotes);
      setActionModal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return;
    setIsSubmitting(true);
    try {
      await onReject(release.id, rejectReason);
      setActionModal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangesSubmit = async () => {
    if (changeItems.length === 0) return;
    setIsSubmitting(true);
    try {
      await onRequestChanges(release.id, changeItems, 'Por favor revisa los puntos señalados arriba para aprobar tu distribución.');
      setActionModal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAdminEdit(release.id, editForm);
      setActiveTab('overview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCustomChange = () => {
    if (customChangeInput.trim()) {
      setChangeItems([...changeItems, customChangeInput.trim()]);
      setCustomChangeInput('');
    }
  };

  const removeChangeItem = (index: number) => {
    setChangeItems(changeItems.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div
        id="admin-review-modal"
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{release.title}</h2>
                <ReleaseStatusBadge status={release.status} size="sm" />
              </div>
              <p className="text-xs text-slate-500">
                Por <span className="font-medium text-slate-700">{release.mainArtist}</span> • ID:{' '}
                <code className="bg-slate-200/70 px-1.5 py-0.5 rounded text-[11px]">{release.id}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenMessage && (
              <button
                type="button"
                onClick={() => onOpenMessage(release.userId, release.mainArtist, release.id, release.title)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-blue-200 shadow-sm"
                title="Enviar mensaje o notificación oficial al artista"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Mensaje
              </button>
            )}

            {onOpenDeposit && (
              <button
                type="button"
                onClick={() => onOpenDeposit(release.userId, release.mainArtist, release.id, release.title)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-emerald-200 shadow-sm"
                title="Depositar o acreditar regalías a este artista"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Acreditar Saldo
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-sm font-medium bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Disc className="w-4 h-4" />
            Resumen & Metadatos
          </button>
          <button
            onClick={() => setActiveTab('tracks')}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'tracks'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Music2 className="w-4 h-4" />
            Pistas ({release.tracks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'codes'
                ? 'border-emerald-600 text-emerald-700 font-semibold bg-emerald-50/50 px-2.5 rounded-t-lg'
                : 'border-transparent text-emerald-700 hover:text-emerald-900'
            }`}
          >
            <Barcode className="w-4 h-4 text-emerald-600" />
            Asignar ISRC & UPC
          </button>
          <button
            onClick={() => setActiveTab('dsp')}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'dsp'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            DSPs & Distribución
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            Historial ({release.history?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'edit'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Editar Todo
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cover Column */}
              <div className="space-y-4">
                <div className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-900 shadow-md">
                  <img
                    src={release.coverUrl}
                    alt={release.title}
                    className="w-full h-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                    <span className="text-[11px] font-mono text-white bg-black/40 backdrop-blur px-2 py-1 rounded">
                      3000 x 3000 px • 1:1 RGB
                    </span>
                  </div>
                </div>

                {/* Technical Verification Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5 text-xs">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Validación Técnica de Archivos
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Resolución Portada:</span>
                      <span className="font-semibold text-emerald-600">3000x3000px (Conforme)</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Aspect Ratio:</span>
                      <span className="font-semibold text-emerald-600">1:1 Cuadrado</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Audio Master:</span>
                      <span className="font-semibold text-emerald-600">WAV PCM 24-bit / 48kHz</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Código UPC Oficial:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {editableUpc || <span className="text-amber-600 font-sans font-normal">Sin asignar</span>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata Details Column */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    Ficha de Metadatos del Lanzamiento
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Título del Álbum / Single</span>
                      <p className="font-semibold text-slate-800 text-sm">{release.title}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Artista Principal</span>
                      <p className="font-semibold text-slate-800 text-sm">{release.mainArtist}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Tipo de Formato</span>
                      <p className="font-medium text-slate-800 uppercase tracking-wider">{release.releaseType}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Género Musical</span>
                      <p className="font-medium text-slate-800">{release.genre} {release.subgenre ? `• ${release.subgenre}` : ''}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Idioma</span>
                      <p className="font-medium text-slate-800">{release.language}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Fecha de Salida Oficial</span>
                      <p className="font-medium text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {release.releaseDate}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Sello Discográfico</span>
                      <p className="font-medium text-slate-800">{release.label || 'Independiente'}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Número de Catálogo</span>
                      <p className="font-mono text-slate-800">{release.catalogNumber}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Contenido Explícito</span>
                      <p className="font-medium text-slate-800">
                        {release.explicit ? (
                          <span className="text-rose-600 font-semibold">Sí (Explicit 🔞)</span>
                        ) : (
                          <span className="text-slate-600">No (Clean / Para todos)</span>
                        )}
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block mb-0.5">Línea Fonográfica ℗</span>
                      <p className="font-medium text-slate-700">℗ {release.pLine}</p>
                    </div>

                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-slate-400 block mb-0.5">Línea de Copyright ©</span>
                      <p className="font-medium text-slate-700">© {release.cLine}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Audio Preview in Overview */}
                {release.tracks?.[0] && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                    <button
                      onClick={() => handleAudioToggle(release.tracks[0].id)}
                      className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow-sm shrink-0"
                    >
                      {isPlaying === release.tracks[0].id ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800 truncate">
                          Pista 1: {release.tracks[0].title}
                        </span>
                        <span className="text-slate-500 font-mono">
                          ISRC: {release.tracks[0].isrc}
                        </span>
                      </div>
                      {/* Audio waveform simulator */}
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex items-center px-1 gap-0.5">
                        {Array.from({ length: 48 }).map((_, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all ${
                              i < (audioProgress * 48) / 100
                                ? 'bg-blue-600'
                                : 'bg-slate-300'
                            }`}
                            style={{ height: `${Math.max(20, (Math.sin(i * 0.4) + 1.2) * 40)}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Editable UPC & ISRC Control Box in Overview */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Barcode className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          Identificadores Únicos Oficiales (UPC & ISRC)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Asigna o corrige manualmente los identificadores para este lanzamiento y cada pista antes del despacho.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={generateAllMissingCodes}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Autogenerar Faltantes
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCodesAndDetails}
                        disabled={isSubmitting}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSubmitting ? 'Guardando...' : 'Guardar Códigos'}
                      </button>
                    </div>
                  </div>

                  {codesSavedSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{codesSavedSuccess}</span>
                    </div>
                  )}

                  {/* Editable UPC Row */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-blue-600" />
                        Código UPC / EAN del Lanzamiento:
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={generateOfficialUpc}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                        >
                          <Sparkles className="w-3 h-3" /> Generar UPC
                        </button>
                        {editableUpc && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(editableUpc, 'overview-upc')}
                            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                          >
                            {copiedText === 'overview-upc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            Copiar
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editableUpc}
                        onChange={(e) => {
                          setEditableUpc(e.target.value);
                          setEditForm((prev) => ({ ...prev, upc: e.target.value }));
                        }}
                        placeholder="Ej. 8435123456789 (12 o 13 dígitos)"
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className={`text-[11px] font-mono px-2 py-1 rounded shrink-0 ${
                        editableUpc && (editableUpc.length === 12 || editableUpc.length === 13)
                          ? 'bg-emerald-100 text-emerald-800 font-bold'
                          : editableUpc
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {editableUpc ? `${editableUpc.length} dígitos` : 'Sin asignar'}
                      </span>
                    </div>
                  </div>

                  {/* Editable Tracks ISRC in Overview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Music2 className="w-3.5 h-3.5 text-emerald-600" />
                        Códigos ISRC ("IRS") por Canción ({editableTracks.length}):
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Formato: ES-A01-26-XXXXX
                      </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {editableTracks.map((trk, idx) => (
                        <div
                          key={trk.id || idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 text-xs transition"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {trk.trackNumber || idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 truncate block">
                                {trk.title}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {Math.floor((trk.durationSeconds || 180) / 60)}:
                                {String((trk.durationSeconds || 180) % 60).padStart(2, '0')} min • {trk.audioFormat || 'WAV 24-bit'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="text"
                              value={trk.isrc || ''}
                              onChange={(e) => {
                                const next = [...editableTracks];
                                next[idx] = { ...next[idx], isrc: e.target.value.toUpperCase() };
                                setEditableTracks(next);
                              }}
                              placeholder="ES-A01-26-XXXXX"
                              className="w-36 sm:w-44 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold tracking-wider text-slate-900 uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => generateOfficialIsrc(idx)}
                              className="p-1.5 text-emerald-700 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                              title="Generar ISRC Oficial para esta pista"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            {trk.isrc && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(trk.isrc, `ov-isrc-${idx}`)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg transition"
                                title="Copiar código ISRC"
                              >
                                {copiedText === `ov-isrc-${idx}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSaveSingleTrackIsrc(idx)}
                              disabled={isSubmitting}
                              className="px-2 py-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition shrink-0"
                              title="Guardar código de esta pista"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tracks' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Lista de Canciones, Créditos y Códigos ISRC ({release.tracks?.length || 0})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Puedes editar o generar directamente el código ISRC ("IRS") y créditos de cada pista.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={generateAllMissingCodes}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Autogenerar Faltantes
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCodesAndDetails}
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Guardando...' : 'Guardar Todos'}
                  </button>
                </div>
              </div>

              {codesSavedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{codesSavedSuccess}</span>
                </div>
              )}

              <div className="space-y-3">
                {release.tracks?.map((track, idx) => (
                  <div
                    key={track.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                          {track.trackNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-800 text-sm truncate">{track.title}</h4>
                            {track.version && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {track.version}
                              </span>
                            )}
                            {track.explicit && (
                              <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded">
                                EXPLICIT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono">
                            ISRC Actual: <span className="font-bold text-slate-700">{editableTracks[idx]?.isrc || track.isrc || 'Sin asignar'}</span> • {Math.floor(track.durationSeconds / 60)}:
                            {(track.durationSeconds % 60).toString().padStart(2, '0')} min • {track.audioFormat || 'WAV 24-bit'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAudioToggle(track.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
                        >
                          {isPlaying === track.id ? (
                            <>
                              <Pause className="w-3.5 h-3.5" /> Pausar
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" /> Escuchar Master
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Panel Editable de Código ISRC ("IRS") Oficial */}
                    <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Barcode className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs font-bold text-slate-800">
                              Código ISRC ("IRS") Oficial de la Pista:
                            </label>
                            {editableTracks[idx]?.isrc && editableTracks[idx].isrc !== 'PENDIENTE' ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded">
                                Asignado
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                Sin asignar
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Identificador único para recolección de regalías en streaming y ventas (Formato: ES-A01-26-XXXXX).
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="text"
                          value={editableTracks[idx]?.isrc || ''}
                          onChange={(e) => {
                            const next = [...editableTracks];
                            next[idx] = { ...next[idx], isrc: e.target.value.toUpperCase() };
                            setEditableTracks(next);
                          }}
                          placeholder="ES-A01-26-XXXXX"
                          className="w-40 sm:w-48 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold tracking-wider text-slate-900 uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => generateOfficialIsrc(idx)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          title="Generar ISRC Oficial"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Generar
                        </button>
                        {editableTracks[idx]?.isrc && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(editableTracks[idx].isrc, `track-tab-isrc-${idx}`)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition"
                            title="Copiar ISRC"
                          >
                            {copiedText === `track-tab-isrc-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSaveSingleTrackIsrc(idx)}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" />
                          Guardar
                        </button>
                      </div>
                    </div>

                    {/* Detailed Credits & Contributors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[11px]">Compositores:</span>
                        <p className="font-medium text-slate-800 truncate">
                          {track.composers?.join(', ') || 'No especificado'}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[11px]">Letristas:</span>
                        <p className="font-medium text-slate-800 truncate">
                          {track.lyricists?.join(', ') || 'Sin letra'}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[11px]">Productores:</span>
                        <p className="font-medium text-slate-800 truncate">
                          {track.producers?.join(', ') || 'No especificado'}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[11px]">Mastering / Mezcla:</span>
                        <p className="font-medium text-slate-800 truncate">
                          {[...(track.mixers || []), ...(track.masterers || [])].join(', ') || 'Estudio no acreditado'}
                        </p>
                      </div>
                    </div>

                    {/* Lyrics Preview if available */}
                    {track.lyricsText && (
                      <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 text-xs text-slate-700">
                        <span className="font-semibold text-amber-900 block mb-0.5">Letra de la canción:</span>
                        <p className="whitespace-pre-line line-clamp-3 text-slate-600 italic font-serif">
                          "{track.lyricsText}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'codes' && (
            <div className="space-y-5">
              {codesSavedSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{codesSavedSuccess}</span>
                </div>
              )}

              {/* Header Info Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-emerald-700" />
                    Asignación Manual de Códigos ISRC ("IRS") y UPC
                  </h3>
                  <p className="text-xs text-emerald-800/80 mt-0.5">
                    Como Super Admin, puedes registrar, corregir y asignar directamente los códigos oficiales y créditos de cada tema antes del despacho a tiendas.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={generateAllMissingCodes}
                    className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Autogenerar Faltantes
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCodesAndDetails}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Guardando...' : 'Guardar Códigos'}
                  </button>
                </div>
              </div>

              {/* UPC Code Box */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Barcode className="w-4 h-4 text-blue-600" />
                      Código de Barras UPC / EAN del Lanzamiento Completo
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Identificador de 12 o 13 dígitos para el álbum/single exigido por Spotify, Apple Music y DSPs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={generateOfficialUpc}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-md transition"
                    >
                      <Sparkles className="w-3 h-3" /> Generar UPC Oficial
                    </button>
                    {editableUpc && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(editableUpc, 'codes-tab-upc')}
                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md transition border border-slate-200"
                        title="Copiar código UPC"
                      >
                        {copiedText === 'codes-tab-upc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        Copiar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveCodesAndDetails}
                      disabled={isSubmitting}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-md transition shadow-sm disabled:opacity-50 flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" /> Guardar UPC
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editableUpc}
                    onChange={(e) => {
                      setEditableUpc(e.target.value);
                      setEditForm((prev) => ({ ...prev, upc: e.target.value }));
                    }}
                    placeholder="Ej. 8435123456789 (12 o 13 dígitos)"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className={`text-[11px] font-mono px-2 py-1 rounded ${
                    editableUpc && (editableUpc.length === 12 || editableUpc.length === 13)
                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                      : editableUpc
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {editableUpc ? `${editableUpc.length} dígitos` : 'Sin código'}
                  </span>
                </div>
              </div>

              {/* Tracks ISRC Assignment List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Music2 className="w-4 h-4 text-emerald-600" />
                    Códigos ISRC ("IRS") y Metadatos Técnicos por Canción ({editableTracks.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Formato estándar internacional: ES-A01-26-XXXXX
                  </span>
                </div>

                <div className="space-y-3">
                  {editableTracks.map((trk, idx) => (
                    <div key={trk.id || idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                            {trk.trackNumber || idx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{trk.title}</span>
                          {trk.version && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {trk.version}
                            </span>
                          )}
                          {trk.explicit && (
                            <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded">
                              EXPLICIT
                            </span>
                          )}
                          {trk.isrc && trk.isrc !== 'PENDIENTE' ? (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              ISRC ASIGNADO
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              ISRC PENDIENTE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => generateOfficialIsrc(idx)}
                            className="text-xs text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-1 rounded font-semibold flex items-center gap-1 transition border border-emerald-200"
                          >
                            <Sparkles className="w-3 h-3" /> Generar ISRC Oficial
                          </button>
                          {trk.isrc && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(trk.isrc, `codes-trk-isrc-${idx}`)}
                              className="text-xs text-slate-500 hover:text-slate-800 p-1 rounded transition"
                              title="Copiar ISRC"
                            >
                              {copiedText === `codes-trk-isrc-${idx}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSaveSingleTrackIsrc(idx)}
                            disabled={isSubmitting}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded transition shadow-sm disabled:opacity-50 flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" /> Guardar
                          </button>
                        </div>
                      </div>

                      {/* Fields grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">
                            Código ISRC ("IRS")
                          </label>
                          <input
                            type="text"
                            value={trk.isrc}
                            onChange={(e) => {
                              const next = [...editableTracks];
                              next[idx] = { ...next[idx], isrc: e.target.value.toUpperCase() };
                              setEditableTracks(next);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1">
                            Título de la Canción
                          </label>
                          <input
                            type="text"
                            value={trk.title}
                            onChange={(e) => {
                              const next = [...editableTracks];
                              next[idx] = { ...next[idx], title: e.target.value };
                              setEditableTracks(next);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1">
                            Versión (Mix / Edit)
                          </label>
                          <input
                            type="text"
                            value={trk.version || ''}
                            onChange={(e) => {
                              const next = [...editableTracks];
                              next[idx] = { ...next[idx], version: e.target.value };
                              setEditableTracks(next);
                            }}
                            placeholder="Original Mix, Radio Edit..."
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1">
                            Compositores (Letra/Música)
                          </label>
                          <input
                            type="text"
                            value={trk.composers?.join(', ') || ''}
                            onChange={(e) => {
                              const next = [...editableTracks];
                              next[idx] = {
                                ...next[idx],
                                composers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                              };
                              setEditableTracks(next);
                            }}
                            placeholder="Nombre real del autor..."
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={handleSaveCodesAndDetails}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Guardando en Base de Datos...' : 'Guardar Todos los Códigos ISRC & UPC'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dsp' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Tiendas & Plataformas Seleccionadas ({release.platforms?.length || 0})
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {release.platforms?.map((platform) => (
                    <div
                      key={platform}
                      className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{platform}</span>
                    </div>
                  ))}
                </div>

                {/* Distribution Engine & Provider Logs */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">Proveedor de Distribución Asignado</h4>
                      <p className="text-xs text-slate-500">
                        {release.assignedProviderId
                          ? providers.find((p) => p.id === release.assignedProviderId)?.name || 'FUGA Gateway'
                          : 'Pendiente de asignación al aprobar'}
                      </p>
                    </div>
                    {release.externalReleaseId && (
                      <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">
                        ID Ext: {release.externalReleaseId}
                      </span>
                    )}
                  </div>

                  {/* Simulator for testing delivery callbacks */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      Simulador de Respuestas de DSPs / Webhooks:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onSimulateWebhook(release.id, 'distributed')}
                        className="text-xs px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg transition"
                      >
                        Simular "Entregado a Tiendas"
                      </button>
                      <button
                        onClick={() => onSimulateWebhook(release.id, 'published')}
                        className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-1"
                      >
                        <Globe className="w-3.5 h-3.5" /> Simular "En Vivo en Spotify"
                      </button>
                    </div>
                  </div>

                  {/* Distribution Logs */}
                  {release.distributionLogs?.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <h5 className="text-xs font-semibold text-slate-700">Registro de Transmisión:</h5>
                      {release.distributionLogs.map((log) => (
                        <div key={log.id} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                          <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                            <span className="text-blue-600 font-semibold">{log.providerName}</span>
                          </div>
                          <p className="text-slate-700 mt-1">{log.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Historial de Auditoría & Trazabilidad de Cambios
              </h3>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                {release.history?.map((item) => (
                  <div key={item.id} className="p-3.5 hover:bg-slate-50/80 transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">
                        {item.userName} <span className="text-slate-400 font-normal">({item.role})</span>
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700">{item.action}</p>
                    {item.oldValue && item.newValue && (
                      <div className="mt-1 bg-slate-50 p-2 rounded border border-slate-200 font-mono text-[11px]">
                        <span className="text-rose-600 line-through mr-2">{item.oldValue}</span>
                        <span className="text-emerald-600 font-bold">{item.newValue}</span>
                      </div>
                    )}
                    {item.details && <p className="text-slate-500 mt-1 italic">{item.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <form onSubmit={handleAdminEditSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Edición Directa de Administrador</h3>
                  <p className="text-xs text-slate-500">Cualquier corrección se registrará automáticamente en el historial de auditoría.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Título del Lanzamiento</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Artista Principal</label>
                  <input
                    type="text"
                    value={editForm.mainArtist}
                    onChange={(e) => setEditForm({ ...editForm, mainArtist: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Género</label>
                  <input
                    type="text"
                    value={editForm.genre}
                    onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Subgénero</label>
                  <input
                    type="text"
                    value={editForm.subgenre}
                    onChange={(e) => setEditForm({ ...editForm, subgenre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Sello Discográfico (Record Label)</label>
                  <input
                    type="text"
                    value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Código UPC</label>
                  <input
                    type="text"
                    value={editForm.upc}
                    onChange={(e) => setEditForm({ ...editForm, upc: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Línea Fonográfica ℗ (P-Line)</label>
                  <input
                    type="text"
                    value={editForm.pLine}
                    onChange={(e) => setEditForm({ ...editForm, pLine: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Línea de Copyright © (C-Line)</label>
                  <input
                    type="text"
                    value={editForm.cLine}
                    onChange={(e) => setEditForm({ ...editForm, cLine: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition shadow-sm"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar y Registrar en Auditoría'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions - ALWAYS ACCESSIBLE */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-t border-slate-200 bg-white gap-3">
          <div className="text-xs text-slate-500">
            Revisión técnica realizada bajo los estándares DDEX y lineamientos de tiendas digitales.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActionModal('changes')}
              className="px-4 py-2 border border-rose-300 text-rose-700 bg-rose-50/50 hover:bg-rose-100/70 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Solicitar Cambios
            </button>

            <button
              onClick={() => setActionModal('reject')}
              className="px-4 py-2 border border-red-300 text-red-700 bg-red-50/50 hover:bg-red-100/70 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Rechazar
            </button>

            <button
              onClick={() => setActionModal('approve')}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Aprobar y Distribuir
            </button>
          </div>
        </div>

        {/* Action Modal Sub-Dialogs */}
        {actionModal === 'approve' && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Aprobar y Enviar a Distribución</h3>
                  <p className="text-xs text-slate-500">El paquete de entrega será despachado al proveedor seleccionado.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Seleccionar Proveedor de Distribución:
                </label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.integrationType} • {p.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Verification of UPC & ISRCs */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-blue-600" />
                    Código UPC Asignado:
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {editableUpc || <span className="text-amber-600 font-sans font-medium">Sin asignar</span>}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Music2 className="w-3.5 h-3.5 text-emerald-600" />
                    Pistas con ISRC ("IRS"):
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {editableTracks.filter((t) => t.isrc && t.isrc !== 'PENDIENTE').length} / {editableTracks.length} asignadas
                  </span>
                </div>

                {(!editableUpc || editableTracks.some((t) => !t.isrc || t.isrc === 'PENDIENTE')) && (
                  <button
                    type="button"
                    onClick={generateAllMissingCodes}
                    className="w-full mt-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Autogenerar códigos UPC/ISRC faltantes antes de enviar
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notas de Aprobación (Internas / Auditoría):
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApproveSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? 'Transmitiendo...' : 'Confirmar y Despachar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {actionModal === 'reject' && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Rechazar Lanzamiento</h3>
                  <p className="text-xs text-slate-500">El usuario recibirá una notificación con el motivo detallado.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Motivo del Rechazo (Obligatorio):
                </label>
                <textarea
                  rows={4}
                  placeholder="Ej: Violación de derechos de autor, muestras no autorizadas, contenido fraudulento o incumplimiento grave de pautas de tiendas..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason.trim() || isSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-red-600/20"
                >
                  {isSubmitting ? 'Procesando...' : 'Rechazar Definitivamente'}
                </button>
              </div>
            </div>
          </div>
        )}

        {actionModal === 'changes' && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Solicitar Modificaciones al Artista</h3>
                  <p className="text-xs text-slate-500">El lanzamiento volverá al usuario para que corrija estos puntos específicos.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Puntos a corregir:</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {changeItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs border border-slate-200">
                      <span className="text-slate-700 flex-1 mr-2">{item}</span>
                      <button
                        onClick={() => removeChangeItem(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Escribir nuevo punto de corrección..."
                    value={customChangeInput}
                    onChange={(e) => setCustomChangeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomChange())}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={addCustomChange}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium"
                  >
                    Añadir
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangesSubmit}
                  disabled={changeItems.length === 0 || isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-amber-600/20"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Requerimiento'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
