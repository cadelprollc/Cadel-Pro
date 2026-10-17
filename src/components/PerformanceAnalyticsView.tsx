import React, { useState, useEffect, useMemo } from 'react';
import { User, Release, Role, EXTENDED_DSP_STORES } from '../types.js';
import { api } from '../lib/api.js';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  Headphones,
  Music2,
  Globe,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Printer,
  Sparkles,
  Info,
  CheckCircle2,
  Disc,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Props {
  currentUser: User | null;
  role: Role;
  releases: Release[];
}

const DSP_COLORS: Record<string, string> = {
  Spotify: '#1DB954',
  'Apple Music': '#FA2D48',
  'YouTube Music': '#FF0000',
  'Amazon Music': '#25D1DA',
  'TikTok / ByteDance': '#000000',
  'Vevo & Video': '#E61B24',
  Deezer: '#A238FF',
  Tidal: '#00FFFF',
};

const PIE_COLORS = ['#1DB954', '#FA2D48', '#FF0000', '#25D1DA', '#6366F1', '#EC4899', '#8B5CF6'];

export const PerformanceAnalyticsView: React.FC<Props> = ({
  currentUser,
  role,
  releases,
}) => {
  // Filters state
  const [timeframe, setTimeframe] = useState<'6m' | '12m' | 'all'>('12m');
  const [selectedArtistId, setSelectedArtistId] = useState<string>(
    role === 'artist' ? (currentUser?.id || 'usr-artist-01') : 'all'
  );
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'streams' | 'revenue' | 'correlation' | 'platforms' | 'territories'>('streams');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Available artists for admin switching
  const [artistsList, setArtistsList] = useState<User[]>([]);

  useEffect(() => {
    if (role === 'super_admin' || role === 'admin') {
      api.getUsers().then((res) => {
        const artists = (res.users || []).filter((u) => u.role === 'artist');
        setArtistsList(artists);
      }).catch(console.error);
    }
  }, [role]);

  // Load analytics data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAnalytics({
        artistId: selectedArtistId,
        releaseId: selectedReleaseId !== 'all' ? selectedReleaseId : undefined,
        timeframe,
      });
      setAnalyticsData(res);
    } catch (err) {
      console.error('Error al cargar analíticas de rendimiento:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedArtistId, selectedReleaseId, timeframe]);

  // Filtered releases for dropdown
  const artistReleases = useMemo(() => {
    if (selectedArtistId === 'all') return releases;
    return releases.filter((r) => r.userId === selectedArtistId);
  }, [releases, selectedArtistId]);

  // Fallback / Normalized Data
  const trendData = analyticsData?.performanceTrend || [];
  const kpis = analyticsData?.kpis || {};
  const releasesPerformance = analyticsData?.releasesPerformance || [];
  const territoryPerformance = analyticsData?.territoryPerformance || [];
  const dspBreakdown = analyticsData?.artistRoyalty?.dspBreakdown || [];

  // Summary Metrics calculations
  const totalStreamsFormatted = Number(kpis.artistTotalStreams ?? kpis.totalStreams ?? 924510).toLocaleString();
  const totalRevenueFormatted = `$${Number(kpis.artistTotalRevenue ?? kpis.platformRevenue ?? 3480.45).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const avgRpmFormatted = `$${Number(kpis.averageRpm || 3.77).toFixed(2)}`;
  const monthlyListenersFormatted = Number(kpis.artistMonthlyListeners || 152000).toLocaleString();
  const peakMonth = kpis.peakMonth || 'Septiembre 2026';

  // Format currency tooltip
  const formatCurrency = (val: number | undefined | null) => `$${Number(val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatStreams = (val: number | undefined | null) => `${Number(val ?? 0).toLocaleString()} streams`;

  // Export CSV handler
  const handleExportCSV = () => {
    if (!trendData.length) return;
    const headers = ['Mes', 'Streams Totales', 'Ingresos USD', 'Spotify', 'Apple Music', 'YouTube', 'Amazon', 'RPM USD'];
    const rows = trendData.map((d: any) => [
      d.month,
      d.streams,
      d.revenue.toFixed(2),
      d.spotify,
      d.appleMusic,
      d.youtube,
      d.amazon,
      d.rpm.toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `performance_analytics_${selectedArtistId}_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-blue-400" />
              Motor de Métricas & Visualización
            </span>
            <span className="text-xs text-indigo-300 font-medium">
              Datos auditados de DSPs & liquidaciones
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            Performance Analytics
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Monitorea el crecimiento de audiencia, velocidad de reproducciones mensuales y evolución de ingresos del catálogo musical a lo largo del tiempo.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Informe</span>
          </button>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Artist Selector for Super Admin / Admin */}
          {(role === 'super_admin' || role === 'admin') && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                <Music2 className="w-3.5 h-3.5 text-blue-600" />
                Artista:
              </label>
              <select
                value={selectedArtistId}
                onChange={(e) => {
                  setSelectedArtistId(e.target.value);
                  setSelectedReleaseId('all');
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">🌐 Todos los Artistas (Plataforma Global)</option>
                <option value="usr-artist-01">SOLER ECLIPSE (Mateo Soler)</option>
                {artistsList
                  .filter((a) => a.id !== 'usr-artist-01')
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.stageName || a.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Release Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
              <Disc className="w-3.5 h-3.5 text-indigo-600" />
              Lanzamiento:
            </label>
            <select
              value={selectedReleaseId}
              onChange={(e) => setSelectedReleaseId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
            >
              <option value="all">Todo el Catálogo Acumulado</option>
              {artistReleases.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.releaseType.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Horizon Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start lg:self-auto">
          <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Período:
          </span>
          <button
            onClick={() => setTimeframe('6m')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              timeframe === '6m'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Últimos 6 Meses
          </button>
          <button
            onClick={() => setTimeframe('12m')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              timeframe === '12m'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            12 Meses (Anual)
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              timeframe === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Histórico Completo
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Streams */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Reproducciones Totales</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Headphones className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {totalStreamsFormatted}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <ArrowUpRight className="w-3 h-3" />
            <span>+14.8% vs. mes anterior</span>
          </div>
        </div>

        {/* KPI 2: Total Revenue Growth */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Ingresos Generados</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {totalRevenueFormatted}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <ArrowUpRight className="w-3 h-3" />
            <span>+14.3% crecimiento MoM</span>
          </div>
        </div>

        {/* KPI 3: Monetization RPM */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>RPM Promedio (por 1k)</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {avgRpmFormatted}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">USD</span>
          </div>
          <p className="text-[11px] text-slate-500">Tasa promedio multitienda</p>
        </div>

        {/* KPI 4: Active Listeners */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Oyentes Mensuales</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {monthlyListenersFormatted}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">En 85+ países de distribución</p>
        </div>

        {/* KPI 5: Peak Performance Month */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pico Máximo</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
              {peakMonth}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold">Récord histórico de streams</p>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Visualizer Mode Tabs */}
        <div className="border-b border-slate-200 px-6 pt-4 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center space-x-1 sm:space-x-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('streams')}
              className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'streams'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Tendencia de Reproducciones Mensuales</span>
            </button>

            <button
              onClick={() => setActiveTab('revenue')}
              className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'revenue'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Crecimiento de Ingresos del Artista</span>
            </button>

            <button
              onClick={() => setActiveTab('correlation')}
              className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'correlation'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Correlación Streams vs. Ingresos (RPM)</span>
            </button>

            <button
              onClick={() => setActiveTab('platforms')}
              className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'platforms'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Desglose por Plataforma (DSPs)</span>
            </button>

            <button
              onClick={() => setActiveTab('territories')}
              className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'territories'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Distribución Geográfica</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 pb-3 hidden sm:block">
            Motor de Gráficos Recharts v3.10
          </div>
        </div>

        {/* Visualizer Canvas Area */}
        <div className="p-6">
          {isLoading ? (
            <div className="h-80 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Sincronizando métricas desde el motor analítico...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: Monthly Streams Trend */}
              {activeTab === 'streams' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Volumen y Aceleración de Reproducciones Mensuales</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                          {timeframe === '6m' ? 'Últimos 6 meses' : timeframe === '12m' ? 'Últimos 12 meses' : 'Histórico completo'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Evolución mensual en Spotify, Apple Music, YouTube Music, Amazon Music, TikTok y canales de video.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-blue-600" />
                        <span className="text-slate-600 font-medium">Streams Totales</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-500" />
                        <span className="text-slate-600 font-medium">Spotify</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-rose-500" />
                        <span className="text-slate-600 font-medium">Apple Music</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-80 sm:h-96 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="spotifyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="month"
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#CBD5E1' }}
                        />
                        <YAxis
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-48">
                                  <div className="flex items-center justify-between border-b border-slate-700 pb-1 font-bold text-indigo-200">
                                    <span>{label}</span>
                                    <span className="text-[10px] text-emerald-400">
                                      {d.momGrowthStreams >= 0 ? `+${d.momGrowthStreams}% MoM` : `${d.momGrowthStreams}% MoM`}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-slate-300">
                                    <span>Total Streams:</span>
                                    <span className="font-bold text-white">{Number(d.streams ?? 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-emerald-400">
                                    <span>Spotify (50%):</span>
                                    <span className="font-bold">{Number(d.spotify ?? 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-rose-400">
                                    <span>Apple Music (25%):</span>
                                    <span className="font-bold">{Number(d.appleMusic ?? 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-amber-400">
                                    <span>YouTube Music:</span>
                                    <span className="font-bold">{Number(d.youtube ?? 0).toLocaleString()}</span>
                                  </div>
                                  <div className="pt-1 border-t border-slate-800 flex justify-between text-slate-400 text-[10px]">
                                    <span>Oyentes únicos:</span>
                                    <span>{Number(d.listeners ?? 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="streams"
                          name="Total Streams"
                          stroke="#2563EB"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#streamGrad)"
                        />
                        <Area
                          type="monotone"
                          dataKey="spotify"
                          name="Spotify"
                          stroke="#10B981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#spotifyGrad)"
                        />
                        <Line
                          type="monotone"
                          dataKey="appleMusic"
                          name="Apple Music"
                          stroke="#F43F5E"
                          strokeWidth={2}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* TAB 2: Revenue Growth */}
              {activeTab === 'revenue' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Crecimiento de Ingresos y Liquidaciones Mensuales</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                          Moneda: USD ($)
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Evolución de las regalías mensuales devengadas vs. ingresos acumulados históricos.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-600" />
                        <span className="text-slate-600 font-medium">Ingreso Mensual ($)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-indigo-600" />
                        <span className="text-slate-600 font-medium">Acumulado Histórico ($)</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-80 sm:h-96 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="month"
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#CBD5E1' }}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#6366F1"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-48">
                                  <div className="flex items-center justify-between border-b border-slate-700 pb-1 font-bold text-emerald-300">
                                    <span>{label}</span>
                                    <span className="text-[10px] text-emerald-400">
                                      {d.momGrowthRevenue >= 0 ? `+${d.momGrowthRevenue}% Ingresos` : `${d.momGrowthRevenue}%`}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-emerald-300 font-bold text-sm">
                                    <span>Mes Actual:</span>
                                    <span>{formatCurrency(d.revenue)}</span>
                                  </div>
                                  <div className="flex justify-between text-indigo-300">
                                    <span>Acumulado Catálogo:</span>
                                    <span className="font-bold">{formatCurrency(d.cumulativeRevenue)}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>RPM Generado:</span>
                                    <span>${d.rpm.toFixed(2)} USD</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          name="Ingreso Mensual"
                          stroke="#10B981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#revenueGrad)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="cumulativeRevenue"
                          name="Acumulado Histórico"
                          stroke="#6366F1"
                          strokeWidth={2.5}
                          strokeDasharray="4 4"
                          dot={{ r: 3, fill: '#6366F1' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* TAB 3: Streams vs Revenue Correlation (RPM) */}
              {activeTab === 'correlation' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Correlación entre Volumen de Reproducción y Rentabilidad</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold">
                          Eficacia de Monetización (RPM)
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Compara cómo el incremento en reproducciones impacta directamente la facturación neta mensual.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-blue-500" />
                        <span className="text-slate-600 font-medium">Streams (Eje Izq.)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-500" />
                        <span className="text-slate-600 font-medium">Ingresos (Eje Der.)</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-80 sm:h-96 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="month"
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#CBD5E1' }}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#3B82F6"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#10B981"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-44">
                                  <span className="font-bold text-indigo-300 block border-b border-slate-700 pb-1">
                                    {label}
                                  </span>
                                  <div className="flex justify-between text-blue-400">
                                    <span>Reproducciones:</span>
                                    <span className="font-bold">{Number(d.streams ?? 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-emerald-400">
                                    <span>Ingreso Bruto:</span>
                                    <span className="font-bold">{formatCurrency(d.revenue)}</span>
                                  </div>
                                  <div className="flex justify-between text-purple-300 pt-1 border-t border-slate-800">
                                    <span>Tasa Real por Stream:</span>
                                    <span className="font-mono">${Number(d.streams ? d.revenue / d.streams : 0.0038).toFixed(5)}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="streams"
                          name="Streams"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="revenue"
                          name="Ingreso USD"
                          stroke="#10B981"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#10B981' }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* TAB 4: Platform Breakdown */}
              {activeTab === 'platforms' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-6 h-80 flex flex-col items-center justify-center">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Participación de Mercado por Tienda Digital
                    </h4>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={dspBreakdown}
                          dataKey="streams"
                          nameKey="dsp"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                          label={({ name, percent }: any) => `${name || ''} ${(((percent as number) || 0) * 100).toFixed(0)}%`}
                        >
                          {dspBreakdown.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={DSP_COLORS[entry.dsp] || PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any, item: any) => [
                            `${Number(value ?? 0).toLocaleString()} streams (${formatCurrency(item?.payload?.revenue ?? item?.payload?.amount ?? 0)})`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="lg:col-span-6 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Desglose de Rendimiento por DSP
                    </h4>
                    <div className="space-y-2">
                      {(dspBreakdown || []).map((item: any, idx: number) => {
                        const dspName = item.dsp || item.name || 'Plataforma';
                        const color = DSP_COLORS[dspName] || PIE_COLORS[idx % PIE_COLORS.length];
                        const streamsCount = item.streams ?? (item.amount ? Math.round(item.amount / 0.0038) : 0);
                        const revenueAmount = item.revenue ?? item.amount ?? 0;
                        const sharePct = item.share ?? item.percentage ?? 0;
                        return (
                          <div
                            key={dspName + idx}
                            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <div>
                                <span className="font-bold text-slate-800 block">{dspName}</span>
                                <span className="text-[11px] text-slate-500">
                                  {Number(streamsCount).toLocaleString()} reproducciones
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-bold text-emerald-600 block text-sm">
                                {formatCurrency(revenueAmount)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {sharePct}% cuota global
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Geographic Distribution */}
              {activeTab === 'territories' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Audiencia y Distribución por Territorio</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                          Global Worldwide
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Top de países con mayor consumo de streams e ingresos por regalías.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {territoryPerformance.map((t: any) => (
                      <div
                        key={t.code}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{t.flag}</span>
                            <span className="font-bold text-xs text-slate-800">{t.country}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-[10px] rounded-full">
                            {t.percentage}%
                          </span>
                        </div>

                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${t.percentage}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                          <span>{Number(t.streams ?? 0).toLocaleString()} streams</span>
                          <span className="font-bold text-emerald-600">{formatCurrency(t.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Top Performing Releases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Disc className="w-4 h-4 text-blue-600" />
              <span>Rendimiento por Lanzamiento del Catálogo</span>
            </h3>
            <p className="text-xs text-slate-500">
              Desglose detallado de streams acumulados, facturación mensual y tienda líder.
            </p>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {releasesPerformance.length} lanzamientos analizados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-3 font-semibold">Lanzamiento</th>
                <th className="py-2.5 px-3 font-semibold">Tipo</th>
                <th className="py-2.5 px-3 font-semibold">Streams Acumulados</th>
                <th className="py-2.5 px-3 font-semibold">Streams Este Mes</th>
                <th className="py-2.5 px-3 font-semibold">Ingresos Totales</th>
                <th className="py-2.5 px-3 font-semibold">Tienda Top</th>
                <th className="py-2.5 px-3 font-semibold">Tendencia MoM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {releasesPerformance.map((rel: any) => (
                <tr
                  key={rel.id}
                  onClick={() => setSelectedReleaseId(rel.id === selectedReleaseId ? 'all' : rel.id)}
                  className={`hover:bg-blue-50/40 transition cursor-pointer ${
                    selectedReleaseId === rel.id ? 'bg-blue-50/70 font-semibold' : ''
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rel.coverUrl}
                        alt={rel.title}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{rel.title}</span>
                        <span className="text-[10px] text-slate-400">Fecha: {rel.releaseDate}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px] uppercase">
                      {rel.releaseType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {Number(rel.totalStreams ?? 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-medium text-blue-600">
                    {Number(rel.monthlyStreams ?? 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-600">
                    {formatCurrency(rel.revenue)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {rel.topDsp}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-0.5 font-bold text-[11px] ${
                        rel.growthMoM >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {rel.growthMoM >= 0 ? (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5" /> +{rel.growthMoM}%
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3.5 h-3.5" /> {rel.growthMoM}%
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
