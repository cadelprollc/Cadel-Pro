import React, { useState } from 'react';
import { ApiKey, ApiRequestLog } from '../types.js';
import {
  Key,
  Plus,
  Trash2,
  Terminal,
  Shield,
  Copy,
  Check,
  Play,
  Clock,
  Code,
  FileCode,
} from 'lucide-react';

interface Props {
  apiKeys: ApiKey[];
  apiLogs: ApiRequestLog[];
  onCreateKey: (name: string, permissions: string[], rateLimit: number) => Promise<void>;
  onRevokeKey: (id: string) => Promise<void>;
}

export const ApiManagement: React.FC<Props> = ({
  apiKeys,
  apiLogs,
  onCreateKey,
  onRevokeKey,
}) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'docs' | 'logs'>('keys');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'releases:read',
    'releases:write',
    'analytics:read',
  ]);
  const [rateLimit, setRateLimit] = useState(120);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Interactive cURL test runner
  const [curlEndpoint, setCurlEndpoint] = useState('/api/v1/releases');
  const [curlResponse, setCurlResponse] = useState<string | null>(null);
  const [isLoadingCurl, setIsLoadingCurl] = useState(false);

  const availablePermissions = [
    { id: 'releases:read', label: 'Consultar catálogo y estados de lanzamientos' },
    { id: 'releases:write', label: 'Crear y actualizar lanzamientos vía API' },
    { id: 'distribution:write', label: 'Despachar paquetes DDEX a distribuidores' },
    { id: 'artists:read', label: 'Consultar perfiles y metadatos de artistas' },
    { id: 'analytics:read', label: 'Consultar métricas de streaming y regalías' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTogglePermission = (pId: string) => {
    if (selectedPermissions.includes(pId)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== pId));
    } else {
      setSelectedPermissions([...selectedPermissions, pId]);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    await onCreateKey(keyName, selectedPermissions, rateLimit);
    setKeyName('');
    setIsCreateModalOpen(false);
  };

  const handleRunCurl = async () => {
    setIsLoadingCurl(true);
    setCurlResponse(null);
    try {
      const token = localStorage.getItem('sonora_auth_token');
      const res = await fetch(curlEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      setCurlResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setCurlResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsLoadingCurl(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            API & Integraciones para Desarrolladores (REST & Webhooks)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Emisión de API Keys seguras, límites de tasa (rate limiting) y documentación OpenAPI para ingesta automatizada.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Generar Nueva API Key
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('keys')}
          className={`py-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'keys'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key className="w-4 h-4" /> Claves API Activas ({apiKeys.length})
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`py-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'docs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code className="w-4 h-4" /> Documentación & Probador cURL
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" /> Registro de Peticiones API ({apiLogs.length})
        </button>
      </div>

      {/* TAB 1: Keys List */}
      {activeTab === 'keys' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {apiKeys.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No hay API Keys generadas.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {apiKeys.map((key) => (
                <div key={key.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{key.name}</span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
                        {key.keyPrefix || key.prefix}••••••••••••
                      </span>
                      <button
                        onClick={() => handleCopy(`${key.keyPrefix || key.prefix}live_${key.id.replace(/-/g, '')}`, key.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition"
                        title="Copiar prefijo"
                      >
                        {copiedKey === key.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {key.permissions.map((p) => (
                        <span key={p} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-mono">
                          {p}
                        </span>
                      ))}
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                        Límite: {key.rateLimitPerMinute} req/min
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Creada: {new Date(key.createdAt).toLocaleDateString()} • {key.requestCount || 0} peticiones procesadas
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onRevokeKey(key.id)}
                      className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Revocar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Documentation & cURL */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-semibold">Sonora Public API v1 — Probador en Tiempo Real</span>
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={curlEndpoint}
                onChange={(e) => setCurlEndpoint(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
              >
                <option value="/api/v1/releases">GET /api/v1/releases (Listar catálogo)</option>
                <option value="/api/v1/artists">GET /api/v1/artists (Listar artistas)</option>
                <option value="/api/v1/analytics">GET /api/v1/analytics (Métricas)</option>
              </select>

              <button
                onClick={handleRunCurl}
                disabled={isLoadingCurl}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isLoadingCurl ? 'Consultando...' : 'Ejecutar Petición'}
              </button>
            </div>

            {/* Simulated cURL command preview */}
            <div className="p-3 bg-black/60 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto">
              curl -X GET "https://api.sonoradistro.com{curlEndpoint}" \<br />
              &nbsp;&nbsp;-H "Authorization: Bearer snr_live_9f83a0bc..." \<br />
              &nbsp;&nbsp;-H "Content-Type: application/json"
            </div>

            {/* Output Box */}
            {curlResponse && (
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-slate-400">Respuesta HTTP 200 OK (JSON):</span>
                <pre className="p-4 bg-black/80 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto max-h-64">
                  {curlResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Request Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Últimas Peticiones Recibidas en la API</span>
            <span className="text-[11px] text-slate-400 font-mono">Tasa promedio: 14 req/min</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Endpoint</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Latencia</th>
                  <th className="p-3">Dirección IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apiLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 font-bold text-blue-600">{log.method}</td>
                    <td className="p-3 text-slate-800">{log.endpoint}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.statusCode < 300
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.statusCode === 429
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{log.responseTimeMs ?? log.durationMs ?? 15} ms</td>
                    <td className="p-3 text-slate-400">{log.ipAddress || log.ip || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Generate New API Key */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Crear Nueva Clave de API</h3>
                <p className="text-xs text-slate-500">Asigna un nombre descriptivo y permisos.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la Aplicación o Servicio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mobile App Backend / Ingestion Bot"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Permisos Granulares (Scopes):</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {availablePermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => handleTogglePermission(perm.id)}
                        className="rounded text-blue-600 mt-0.5"
                      />
                      <div>
                        <span className="font-mono text-blue-700 font-semibold block">{perm.id}</span>
                        <span className="text-[11px] text-slate-500">{perm.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Límite de Tasa (Rate Limit)</label>
                <select
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={60}>60 peticiones / minuto</option>
                  <option value={120}>120 peticiones / minuto (Estándar)</option>
                  <option value={300}>300 peticiones / minuto (High Volume)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm"
                >
                  Generar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
