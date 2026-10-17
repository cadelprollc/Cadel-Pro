import React, { useState } from 'react';
import { User, Release, EXTENDED_DSP_STORES } from '../types.js';
import { api } from '../lib/api.js';
import {
  X,
  Radio,
  Sparkles,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Calendar,
  Layers,
  Music2,
  Plus,
  Trash2,
} from 'lucide-react';

interface Props {
  usersList: User[];
  releases?: Release[];
  currentUser?: User | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialArtistId?: string;
}

interface PlatformStreamRow {
  platform: string;
  streams: number;
  ratePerStream: number;
  estimatedEarnings: number;
  category: string;
}

const DEFAULT_PLATFORMS: Array<{ name: string; rate: number; defaultStreams: number; category: string }> = [
  { name: 'Spotify', rate: 0.0038, defaultStreams: 85000, category: 'Global Streaming' },
  { name: 'Apple Music', rate: 0.0075, defaultStreams: 42000, category: 'Global Streaming' },
  { name: 'YouTube Music', rate: 0.0025, defaultStreams: 38000, category: 'Global Streaming' },
  { name: 'Amazon Music', rate: 0.0040, defaultStreams: 15000, category: 'Global Streaming' },
  { name: 'TikTok / ByteDance', rate: 0.0018, defaultStreams: 120000, category: 'Redes Sociales & Video' },
  { name: 'Cadel Pro Network', rate: 0.0060, defaultStreams: 25000, category: 'Video Musical & Visual' },
  { name: 'Vevo', rate: 0.0065, defaultStreams: 32000, category: 'Video Musical & Visual' },
  { name: 'Deezer', rate: 0.0035, defaultStreams: 10000, category: 'Global Streaming' },
  { name: 'Tidal', rate: 0.0080, defaultStreams: 6500, category: 'Global Streaming' },
];

export const AdminManualStreamsModal: React.FC<Props> = ({
  usersList,
  releases = [],
  onClose,
  onSuccess,
  initialArtistId,
}) => {
  const artists = usersList.filter((u) => u.role === 'artist');
  const [selectedArtistId, setSelectedArtistId] = useState(
    initialArtistId || (artists.length > 0 ? artists[0].id : '')
  );

  // Month & Period
  const dateObj = new Date();
  dateObj.setMonth(dateObj.getMonth() - 1); // Last month by default
  const defaultMonthName = dateObj.toLocaleString('es-ES', { month: 'long' });
  const capitalizedMonth = defaultMonthName.charAt(0).toUpperCase() + defaultMonthName.slice(1);
  const defaultYear = dateObj.getFullYear();

  const [period, setPeriod] = useState(`${capitalizedMonth} ${defaultYear}`);
  const [month, setMonth] = useState(capitalizedMonth);
  const [year, setYear] = useState(defaultYear);
  const [selectedReleaseId, setSelectedReleaseId] = useState('');
  const [creditEarnings, setCreditEarnings] = useState(true);
  const [notes, setNotes] = useState(
    `Reporte oficial de streaming del mes pasado (${capitalizedMonth} ${defaultYear}) ingresado por administración.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Platform Streams state
  const [platformRows, setPlatformRows] = useState<PlatformStreamRow[]>(() =>
    DEFAULT_PLATFORMS.map((p) => ({
      platform: p.name,
      streams: p.defaultStreams,
      ratePerStream: p.rate,
      estimatedEarnings: Number((p.defaultStreams * p.rate).toFixed(2)),
      category: p.category,
    }))
  );

  const selectedArtistReleases = releases.filter(
    (r) => !selectedArtistId || r.userId === selectedArtistId
  );

  const handleStreamsChange = (index: number, val: string) => {
    const streamsNum = Math.max(0, parseInt(val, 10) || 0);
    setPlatformRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        streams: streamsNum,
        estimatedEarnings: Number((streamsNum * copy[index].ratePerStream).toFixed(2)),
      };
      return copy;
    });
  };

  const handleRateChange = (index: number, val: string) => {
    const rateNum = Math.max(0, parseFloat(val) || 0);
    setPlatformRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        ratePerStream: rateNum,
        estimatedEarnings: Number((copy[index].streams * rateNum).toFixed(2)),
      };
      return copy;
    });
  };

  const handleEarningsChange = (index: number, val: string) => {
    const earnNum = Math.max(0, parseFloat(val) || 0);
    setPlatformRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        estimatedEarnings: earnNum,
      };
      return copy;
    });
  };

  const handleRemoveRow = (index: number) => {
    setPlatformRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddCustomPlatform = () => {
    const name = prompt('Nombre de la plataforma o canal de video (ej. Pandora, Beatport, Apple Music Video):');
    if (!name) return;
    setPlatformRows((prev) => [
      ...prev,
      {
        platform: name.trim(),
        streams: 1000,
        ratePerStream: 0.0035,
        estimatedEarnings: 3.5,
        category: 'Personalizado',
      },
    ]);
  };

  // Calculations
  const totalStreams = platformRows.reduce((sum, r) => sum + r.streams, 0);
  const totalEarnings = platformRows.reduce((sum, r) => sum + r.estimatedEarnings, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtistId) {
      setErrorMsg('Por favor selecciona un artista beneficiario.');
      return;
    }

    if (platformRows.length === 0) {
      setErrorMsg('Debes incluir al menos una plataforma en el reporte.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.recordManualStreams({
        artistId: selectedArtistId,
        period,
        month,
        year: Number(year),
        releaseId: selectedReleaseId || undefined,
        platformStreams: platformRows.map((r) => ({
          platform: r.platform,
          streams: r.streams,
          ratePerStream: r.ratePerStream,
          estimatedEarnings: r.estimatedEarnings,
        })),
        notes,
        creditEarnings,
      });

      onSuccess(res.message);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el reporte de reproducciones.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentArtist = artists.find((a) => a.id === selectedArtistId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Carga Manual de Reproducciones por Plataformas
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingresa cuántas reproducciones generó el catálogo del artista el mes pasado por tienda digital (Spotify, Apple, Vevo, Cadel Pro, etc.).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Top Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            {/* Artist Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Artista o Sello Beneficiario *
              </label>
              <select
                value={selectedArtistId}
                onChange={(e) => setSelectedArtistId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              >
                {artists.map((art) => (
                  <option key={art.id} value={art.id}>
                    {art.stageName ? `${art.stageName} (${art.name})` : art.name} - {art.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Period / Month */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Período Liquidado (Mes Pasado) *
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value);
                  setMonth(e.target.value.split(' ')[0]);
                }}
                placeholder="Ej. Agosto 2026"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Specific Release (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Lanzamiento Asociado (Opcional)
              </label>
              <select
                value={selectedReleaseId}
                onChange={(e) => setSelectedReleaseId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Todo el catálogo del artista</option>
                {selectedArtistReleases.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.releaseType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Total Reproducciones del Mes
                </span>
                <p className="text-2xl font-black text-emerald-950 mt-0.5">
                  {Number(totalStreams ?? 0).toLocaleString()} <span className="text-xs font-normal text-emerald-700">streams</span>
                </p>
              </div>
              <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-sm">
                <Radio className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Ingresos Totales a Acreditar
                </span>
                <p className="text-2xl font-black text-white mt-0.5">
                  ${Number(totalEarnings ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">USD</span>
                </p>
              </div>
              <div className="p-3 bg-slate-800 text-emerald-400 rounded-xl border border-slate-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Platforms Streams Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Desglose de Reproducciones y Tarifas por Plataforma
              </span>

              <button
                type="button"
                onClick={handleAddCustomPlatform}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir Otra Plataforma
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Plataforma / Canal</th>
                    <th className="py-3 px-4 text-right">Reproducciones (Mes Pasado)</th>
                    <th className="py-3 px-4 text-right">Tarifa ($/stream)</th>
                    <th className="py-3 px-4 text-right">Ganancia Calculada</th>
                    <th className="py-3 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {platformRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <div>
                          <span>{row.platform}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">{row.category}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row.streams}
                          onChange={(e) => handleStreamsChange(idx, e.target.value)}
                          className="w-32 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          value={row.ratePerStream}
                          onChange={(e) => handleRateChange(idx, e.target.value)}
                          className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                        />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400 font-mono">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.estimatedEarnings}
                            onChange={(e) => handleEarningsChange(idx, e.target.value)}
                            className="w-28 px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-700 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/40"
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Eliminar plataforma"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Credit Checkbox & Notes */}
          <div className="space-y-4 pt-2">
            <label className="flex items-start gap-3 p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={creditEarnings}
                onChange={(e) => setCreditEarnings(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <div className="text-xs">
                <span className="font-bold text-emerald-950 block">
                  Acreditar automáticamente ${totalEarnings.toFixed(2)} USD al saldo disponible del artista
                </span>
                <span className="text-emerald-800 text-[11px] block mt-0.5">
                  Si marcas esta casilla, el usuario verá reflejadas inmediatamente estas ganancias en su balance y podrá solicitar el cobro vía Banco o PayPal.
                </span>
              </div>
            </label>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Notas de Liquidación y Auditoría Interna
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Observaciones de la carga mensual..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Beneficiario: <strong className="text-slate-800">{currentArtist?.name}</strong>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting || totalStreams === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md"
              >
                {isSubmitting ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar y Acreditar Reproducciones</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
