import React, { useState } from 'react';
import { DistributionProvider, EXTENDED_DSP_STORES } from '../types.js';
import {
  Radio,
  Plus,
  Activity,
  CheckCircle2,
  XCircle,
  Settings2,
  Globe,
  Trash2,
  ExternalLink,
  Shield,
  Zap,
  Search,
  Layers,
  Sparkles,
} from 'lucide-react';

interface Props {
  providers: DistributionProvider[];
  onTestPing: (id: string) => Promise<{ status: string; httpStatus: number; latencyMs: number; message: string }>;
  onCreateProvider: (provider: Partial<DistributionProvider>) => Promise<void>;
  onUpdateProvider: (id: string, updates: Partial<DistributionProvider>) => Promise<void>;
}

export const ProvidersManagement: React.FC<Props> = ({
  providers,
  onTestPing,
  onCreateProvider,
  onUpdateProvider,
}) => {
  const [pingResults, setPingResults] = useState<Record<string, { latency: number; status: number; message: string; ok: boolean }>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<DistributionProvider | null>(null);
  const [dspCategoryFilter, setDspCategoryFilter] = useState('all');
  const [dspSearchQuery, setDspSearchQuery] = useState('');

  const [form, setForm] = useState({
    name: '',
    code: '',
    apiEndpoint: '',
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    integrationType: 'REST_JSON' as DistributionProvider['integrationType'],
    status: 'active' as DistributionProvider['status'],
  });

  const handlePing = async (id: string) => {
    setTestingId(id);
    try {
      const res = await onTestPing(id);
      setPingResults((prev) => ({
        ...prev,
        [id]: {
          latency: res.latencyMs,
          status: res.httpStatus,
          message: res.message,
          ok: res.httpStatus === 200,
        },
      }));
    } catch (err: any) {
      setPingResults((prev) => ({
        ...prev,
        [id]: {
          latency: 0,
          status: 500,
          message: err.message || 'Error de conexión',
          ok: false,
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingProvider(null);
    setForm({
      name: '',
      code: '',
      apiEndpoint: 'https://api.distrohub.example.com/v2',
      apiKey: 'snr_live_' + Math.random().toString(36).substring(2, 12),
      apiSecret: 'sec_' + Math.random().toString(36).substring(2, 16),
      webhookUrl: 'https://api.sonoradistro.com/webhooks/dsp-callback',
      integrationType: 'REST_JSON',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: DistributionProvider) => {
    setEditingProvider(p);
    setForm({
      name: p.name,
      code: p.code,
      apiEndpoint: p.apiEndpoint || p.endpoint,
      apiKey: p.apiKey || '',
      apiSecret: p.apiSecret || '',
      webhookUrl: p.webhookUrl || '',
      integrationType: p.integrationType,
      status: p.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProvider) {
      await onUpdateProvider(editingProvider.id, form);
    } else {
      await onCreateProvider({
        ...form,
        supportedDsps: ['Spotify', 'Apple Music', 'Amazon Music', 'YouTube Music', 'Deezer', 'Tidal', 'TikTok'],
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            Proveedores de Distribución Digital & Gateways DDEX
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuración de endpoints, protocolos de entrega (DDEX ERN 4.2 / REST) y credenciales de agregadores.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Conectar Nuevo Proveedor
        </button>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const ping = pingResults[provider.id];
          const isPinging = testingId === provider.id;

          return (
            <div
              key={provider.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {provider.code.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{provider.name}</h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      Protocolo: {provider.integrationType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      provider.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {provider.status}
                  </span>

                  <button
                    onClick={() => handleOpenEdit(provider)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Endpoint Details */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Endpoint REST:</span>
                  <span className="text-slate-700 truncate max-w-[200px]">{provider.apiEndpoint || provider.endpoint}</span>
                </div>
                {provider.webhookUrl && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Webhook DSP:</span>
                    <span className="text-slate-700 truncate max-w-[200px]">{provider.webhookUrl}</span>
                  </div>
                )}
              </div>

              {/* Supported DSPs tags */}
              <div>
                <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                  Tiendas Soportadas ({(provider.supportedDsps || []).length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {(provider.supportedDsps || []).slice(0, 5).map((dsp: string) => (
                    <span
                      key={dsp}
                      className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      {dsp}
                    </span>
                  ))}
                  {(provider.supportedDsps || []).length > 5 && (
                    <span className="text-[10px] text-slate-500 font-medium px-1 py-0.5">
                      +{(provider.supportedDsps || []).length - 5} más
                    </span>
                  )}
                </div>
              </div>

              {/* Ping Result Box if available */}
              {ping && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    ping.ok ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {ping.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold">{ping.message}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold">
                    {ping.latency} ms • HTTP {ping.status}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  {provider.lastSyncAt ? `Última sincronización: ${new Date(provider.lastSyncAt).toLocaleTimeString()}` : 'Listo'}
                </span>

                <button
                  onClick={() => handlePing(provider.id)}
                  disabled={isPinging}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Zap className={`w-3.5 h-3.5 ${isPinging ? 'animate-bounce text-amber-500' : 'text-slate-500'}`} />
                  {isPinging ? 'Probando...' : 'Test Ping & Latencia'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded DSP Stores Catalog */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Red Global de Tiendas Digitales y DSPs Integrados ({EXTENDED_DSP_STORES.length})
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                100% ACTIVAS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Protocolos de entrega automática DDEX ERN 4.3, APIs directas y sincronización por lote compatibles con todas las tiendas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={dspSearchQuery}
                onChange={(e) => setDspSearchQuery(e.target.value)}
                placeholder="Buscar plataforma o tienda..."
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
              />
            </div>

            <select
              value={dspCategoryFilter}
              onChange={(e) => setDspCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas las Categorías</option>
              <option value="Global Streaming">Global Streaming</option>
              <option value="Social & Video">Redes Sociales & Video</option>
              <option value="Electronic & DJ">Música Electrónica & DJ</option>
              <option value="Regional & Emerging">Regional & Emergente</option>
              <option value="Radio & Discovery">Radio & Discovery</option>
            </select>
          </div>
        </div>

        {/* DSP Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {EXTENDED_DSP_STORES.filter((store) => {
            if (dspCategoryFilter !== 'all' && store.category !== dspCategoryFilter) return false;
            if (dspSearchQuery) {
              const q = dspSearchQuery.toLowerCase();
              return (
                store.name.toLowerCase().includes(q) ||
                store.description.toLowerCase().includes(q) ||
                store.territories.toLowerCase().includes(q)
              );
            }
            return true;
          }).map((store) => (
            <div
              key={store.id}
              className="bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-slate-300 p-4 rounded-xl transition shadow-xs flex flex-col justify-between gap-3 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${store.iconBg} shrink-0`} />
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition">
                      {store.name}
                    </h4>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold shrink-0">
                    ACTIVO
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                  {store.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{store.category}</span>
                <span className="truncate max-w-[110px]">{store.territories}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Creating / Editing Provider */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              {editingProvider ? `Editar Proveedor: ${editingProvider.name}` : 'Conectar Nuevo Proveedor de Distribución'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre del Agregador</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. FUGA Global / The Orchard"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código Único</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. FUGA / ORCHARD"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Endpoint de la API</label>
                <input
                  type="url"
                  required
                  value={form.apiEndpoint}
                  onChange={(e) => setForm({ ...form, apiEndpoint: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">API Key / Token</label>
                  <input
                    type="text"
                    value={form.apiKey}
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">API Secret</label>
                  <input
                    type="password"
                    value={form.apiSecret}
                    onChange={(e) => setForm({ ...form, apiSecret: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Integración</label>
                  <select
                    value={form.integrationType}
                    onChange={(e) => setForm({ ...form, integrationType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="REST_JSON">REST API (JSON)</option>
                    <option value="DDEX_ERN_4">DDEX ERN 4.2 (XML)</option>
                    <option value="CUSTOM_API">Custom Gateway API</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Activo (Producción)</option>
                    <option value="sandbox">Sandbox (Pruebas)</option>
                    <option value="maintenance">Mantenimiento</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-sm"
                >
                  {editingProvider ? 'Guardar Cambios' : 'Crear Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
