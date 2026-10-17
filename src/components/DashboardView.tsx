import React from 'react';
import { Release, Role, RoyaltySummary } from '../types.js';
import { ReleaseStatusBadge } from './ReleaseStatusBadge.js';
import {
  TrendingUp,
  Disc,
  Clock,
  DollarSign,
  Radio,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Users,
  Eye,
  Sparkles,
  Layers,
  Video,
  ShoppingBag,
  Link2,
} from 'lucide-react';

interface Props {
  role: Role;
  releases: Release[];
  analytics: {
    kpis: any;
    artistRoyalty: RoyaltySummary;
    releaseStatusDistribution: Array<{ name: string; count: number; color: string }>;
    monthlyActivity: Array<{ month: string; releases: number; streams: number; revenue: number }>;
  } | null;
  onOpenReview: (release: Release) => void;
  onGoToQcQueue: () => void;
  onGoToNewRelease: () => void;
  onGoToPerformanceAnalytics?: () => void;
  onGoToRoyalties?: () => void;
  onGoToVideos?: () => void;
  onGoToSmmStore?: () => void;
}

export const DashboardView: React.FC<Props> = ({
  role,
  releases,
  analytics,
  onOpenReview,
  onGoToQcQueue,
  onGoToNewRelease,
  onGoToPerformanceAnalytics,
  onGoToRoyalties,
  onGoToVideos,
  onGoToSmmStore,
}) => {
  const pendingReleases = releases.filter(
    (r) => r.status === 'submitted' || r.status === 'under_review'
  );

  const totalStreams = analytics?.kpis?.totalStreams || 1420500;
  const totalRevenue = analytics?.kpis?.monthlyRevenue || 4850.25;

  return (
    <div className="space-y-6">
      {/* Welcome & Role Context Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
              {role === 'super_admin' ? 'Super Administrador' : role === 'admin' ? 'Control de Calidad' : 'Panel de Artista'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Centro de Operaciones Sonora
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Plataforma integral de ingestión, control de calidad y distribución digital de fonogramas hacia Spotify, Apple Music, Amazon y más de 40 tiendas.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(role === 'super_admin' || role === 'admin') && pendingReleases.length > 0 && (
            <button
              onClick={onGoToQcQueue}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
            >
              <Clock className="w-4 h-4" />
              <span>{pendingReleases.length} Canciones por Revisar</span>
            </button>
          )}

          <button
            onClick={onGoToNewRelease}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-blue-600/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Nuevo Lanzamiento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Streams */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Reproducciones Totales</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {Number(totalStreams ?? 0).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +18.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Streams acumulados en DSPs mundiales</p>
        </div>

        {/* KPI 2: Royalties & Balance */}
        <div
          onClick={onGoToRoyalties}
          className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 transition ${
            onGoToRoyalties ? 'cursor-pointer hover:border-emerald-300 hover:shadow-md' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {role === 'artist' ? 'Mi Saldo / Balance' : 'Saldos & Cobros'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ${Number(totalRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> Ver saldo
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {role === 'artist' ? 'Clic para ver movimientos y retiros' : 'Gestión contable y liquidaciones'}
          </p>
        </div>

        {/* KPI 3: Total Catalog */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lanzamientos Totales</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Disc className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {releases.length}
            </span>
            <span className="text-xs font-medium text-slate-400">en catálogo activo</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {releases.filter((r) => r.status === 'published').length} en vivo en Spotify & Apple
          </p>
        </div>

        {/* KPI 4: Pending QC Queue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pendientes de Aprobación</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 tracking-tight">
              {pendingReleases.length}
            </span>
            <span className="text-xs font-medium text-slate-400">en cola de QC</span>
          </div>
          <p className="text-[11px] text-slate-400">Validación de audio y derechos previa a DSP</p>
        </div>
      </div>

      {/* QC Alert Banner if there are pending reviews for Admins */}
      {(role === 'super_admin' || role === 'admin') && pendingReleases.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Atención requerida: Hay {pendingReleases.length} lanzamiento(s) esperando revisión de Control de Calidad
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Recuerda que ningún usuario puede enviar música a las tiendas sin tu aprobación previa.
              </p>
            </div>
          </div>

          <button
            onClick={onGoToQcQueue}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm shrink-0"
          >
            Abrir Cola de Revisión Técnica
          </button>
        </div>
      )}

      {/* Performance Analytics Quick Access Banner */}
      {onGoToPerformanceAnalytics && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-500/30">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-600/30 text-blue-300 rounded-xl border border-blue-400/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Métricas de Rendimiento & Crecimiento de Audiencia
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
                  +14.8% Streams MoM
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Consulta la evolución detallada de reproducciones mensuales, correlación con ingresos en USD y cuota de mercado por tienda digital.
              </p>
            </div>
          </div>

          <button
            onClick={onGoToPerformanceAnalytics}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-md shrink-0 border border-blue-400/40"
          >
            <span>Explorar Performance Analytics</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Video Distribution & Tienda de Productos Quick Access for Artists & Admins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Video Distribution Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md border border-indigo-800/40 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Video className="w-3 h-3" />
                <span>Distribución Visual VEVO & DSPs</span>
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">Apple Music · YouTube · Tidal</span>
            </div>
            <h3 className="text-base font-black text-white">Distribución de Videos Musicales</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Distribuye y monetiza tus videos oficiales, videoclips en 4K/1080p, metadata ISRC y sincronización con canales VEVO y Apple Music.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {onGoToVideos && (
              <button
                type="button"
                onClick={onGoToVideos}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Abrir Distribución de Videos</span>
              </button>
            )}
          </div>
        </div>

        {/* Tienda de Productos & SmartLinks Card */}
        <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-5 rounded-2xl text-white shadow-md border border-purple-800/40 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                <span>Tienda Sonora & SmartLinks</span>
              </span>
              <span className="text-[11px] text-indigo-200 font-semibold">Débito en Billetera</span>
            </div>
            <h3 className="text-base font-black text-white">Tienda de Productos & Pre-Save</h3>
            <p className="text-xs text-indigo-200/90 leading-relaxed">
              Adquiere vistas, likes y streams para Spotify y YouTube debitados de tu saldo disponible, y crea páginas inteligentes SmartLink para fans.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {onGoToSmmStore && (
              <button
                type="button"
                onClick={onGoToSmmStore}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ir a Tienda de Productos</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mid Section: Recent Releases Queue + DSP Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Activity / Quick Review List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lanzamientos Recientes</h3>
              <p className="text-xs text-slate-500">Últimas cargas en la plataforma</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {releases.slice(0, 5).map((release) => (
              <div
                key={release.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={release.coverUrl}
                    alt={release.title}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs truncate">{release.title}</p>
                    <p className="text-slate-500 text-[11px] truncate">
                      {release.mainArtist} • {release.releaseType.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <ReleaseStatusBadge status={release.status} size="sm" />
                  {(role === 'admin' || role === 'super_admin') ? (
                    <button
                      onClick={() => onOpenReview(release)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Revisar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenReview(release)}
                      className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs font-semibold flex items-center gap-1 border border-slate-200 shadow-sm"
                      title="Ver ficha y detalles de distribución asignados por el Super Admin"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ver Ficha</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: DSP Breakdown & Integration Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Distribución por Tiendas (DSPs)</h3>
            <p className="text-xs text-slate-500">Cuota de reproducciones e ingresos</p>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Spotify', share: '48.5%', color: 'bg-emerald-500', streams: '688,940 streams' },
              { name: 'Apple Music', share: '28.2%', color: 'bg-rose-500', streams: '400,580 streams' },
              { name: 'TikTok / ByteDance', share: '13.1%', color: 'bg-sky-500', streams: '186,080 videos' },
              { name: 'Amazon Music', share: '6.4%', color: 'bg-amber-500', streams: '90,910 streams' },
              { name: 'YouTube Music', share: '3.8%', color: 'bg-red-500', streams: '53,990 views' },
            ].map((dsp) => (
              <div key={dsp.name} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{dsp.name}</span>
                  <span className="font-bold text-slate-900">{dsp.share}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`${dsp.color} h-full rounded-full`} style={{ width: dsp.share }} />
                </div>
                <span className="text-[10px] text-slate-400 block">{dsp.streams}</span>
              </div>
            ))}
          </div>

          {/* Provider Pipeline Status */}
          <div className="pt-3 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Gateway FUGA DDEX:</span>
              </div>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                Operacional (99.9%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
