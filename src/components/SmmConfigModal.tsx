import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Shield,
  Key,
  Globe,
  Radio,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Server,
  DollarSign,
  Percent,
} from 'lucide-react';
import { SmmPanelConfig } from '../types.js';
import { api } from '../lib/api.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (config: SmmPanelConfig) => void;
}

export const SmmConfigModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; balance?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [apiUrl, setApiUrl] = useState('https://panel-smm-api.com/api/v2');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyMasked, setApiKeyMasked] = useState('');
  const [apiMode, setApiMode] = useState<'live' | 'simulation'>('simulation');
  const [providerName, setProviderName] = useState('SMM Master Panel API v2');
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(25);
  const [autoFulfill, setAutoFulfill] = useState(true);
  const [providerBalance, setProviderBalance] = useState(485.60);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const res = await api.getSmmConfig();
        if (res.config) {
          setApiUrl(res.config.apiUrl || '');
          setApiKeyMasked(res.config.apiKeyMasked || '');
          setApiMode(res.config.apiMode || 'simulation');
          setProviderName(res.config.providerName || '');
          setProfitMarginPercent(res.config.profitMarginPercent ?? 25);
          setAutoFulfill(res.config.autoFulfill ?? true);
          setProviderBalance(res.config.providerBalance ?? 485.60);
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar la configuración SMM');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testSmmConnection({
        apiUrl: apiUrl.trim(),
        apiKey: apiKey.trim() || undefined,
      });

      setTestResult({
        success: res.connected,
        message: res.message,
        balance: res.balance,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error al conectar con la API del panel SMM.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await api.updateSmmConfig({
        apiUrl: apiUrl.trim(),
        apiKey: apiKey.trim() || undefined,
        apiMode,
        providerName: providerName.trim(),
        profitMarginPercent,
        autoFulfill,
      });

      onSaved(res.config);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Conexión API con Panel SMM
                <span className="text-[10px] uppercase tracking-wider bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Admin
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Configura el endpoint SMM para la compra automática de vistas y reproducciones.
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

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Cargando configuración de conexión...
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {testResult && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span className="font-semibold">{testResult.message}</span>
              </div>
            )}

            {/* Provider Balance Card */}
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Saldo del Proveedor SMM:
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  ${providerBalance.toFixed(2)} USD
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {apiMode === 'live' ? 'API En Vivo' : 'Modo Simulación Activo'}
              </span>
            </div>

            {/* Form Fields */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Nombre del Proveedor / Panel SMM
              </label>
              <input
                type="text"
                required
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                URL del API Endpoint SMM <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://panel-smm-api.com/api/v2"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Compatible con la API estándar de paneles SMM v2 (action: add, status, balance).
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                API Key del Panel SMM
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={apiKeyMasked || 'Introduce tu API Key del panel SMM...'}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Actual: <code className="font-mono text-slate-600">{apiKeyMasked || 'No configurada'}</code>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Modo de Operación</label>
                <select
                  value={apiMode}
                  onChange={(e) => setApiMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="simulation">Simulación (Pedidos seguros de prueba)</option>
                  <option value="live">En Vivo (Conecta con API Real SMM)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Margen de Ganancia (%)</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={profitMarginPercent}
                  onChange={(e) => setProfitMarginPercent(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={autoFulfill}
                  onChange={(e) => setAutoFulfill(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">
                  Despacho Inmediato: Enviar pedidos al panel SMM al instante tras el débito.
                </span>
              </label>
            </div>

            {/* Test Connection Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={testing}
                onClick={handleTestConnection}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{testing ? 'Probando conexión con el panel...' : 'Probar Conexión con Panel SMM'}</span>
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
