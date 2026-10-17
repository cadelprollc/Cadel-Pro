import React, { useState } from 'react';
import { PlatformSettings } from '../types.js';
import {
  Settings,
  Save,
  CheckCircle,
  Sliders,
  DollarSign,
  Shield,
  Palette,
  Package,
  Barcode,
  Radio,
  FileMusic,
  Globe,
} from 'lucide-react';

interface Props {
  settings: PlatformSettings;
  onUpdateSettings: (settings: Partial<PlatformSettings>) => Promise<void>;
}

export const PlatformSettingsView: React.FC<Props> = ({ settings, onUpdateSettings }) => {
  const [form, setForm] = useState<PlatformSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await onUpdateSettings(form);
      setSuccessMsg('Configuración de la plataforma actualizada con éxito.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Configuración Global de Plataforma SaaS (White-Label)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalización de marca, comisiones de distribución, reglas de seguridad y planes de suscripción.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Identity & Branding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Palette className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800">Identidad de Marca & Dominio</h3>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nombre Comercial de la Plataforma</label>
            <input
              type="text"
              value={form.platformName}
              onChange={(e) => setForm({ ...form, platformName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Texto del Logotipo</label>
            <input
              type="text"
              value={form.platformLogoText}
              onChange={(e) => setForm({ ...form, platformLogoText: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Color Primario</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Color Secundario</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dominio de la Plataforma</label>
            <input
              type="text"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Correo de Soporte y Notificaciones</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        {/* Pillar 2: Financial & Quality Rules */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800">Modelo de Negocio & Comisiones</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Comisión Plataforma (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={form.commissionPercentage}
                onChange={(e) => setForm({ ...form, commissionPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400">
                El artista retiene el {100 - form.commissionPercentage}%
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Umbral Mínimo Cobro ($)</label>
              <input
                type="number"
                min="5"
                value={form.payoutThreshold}
                onChange={(e) => setForm({ ...form, payoutThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400">Mínimo para solicitar transferencia</span>
            </div>
          </div>

          {/* Quality & Security Toggles */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              Reglas de Control de Calidad y Seguridad
            </h4>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Exigir 2FA para Administradores</span>
                <span className="text-[11px] text-slate-500">Obliga autenticación de dos factores al iniciar sesión</span>
              </div>
              <input
                type="checkbox"
                checked={form.require2FAForAdmins}
                onChange={(e) => setForm({ ...form, require2FAForAdmins: e.target.checked })}
                className="rounded text-indigo-600 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Despacho Automático a Proveedor tras Aprobar</span>
                <span className="text-[11px] text-slate-500">Transmite inmediatamente a FUGA / Orchard al pulsar Aprobar</span>
              </div>
              <input
                type="checkbox"
                checked={form.autoDistributeOnApproval}
                onChange={(e) => setForm({ ...form, autoDistributeOnApproval: e.target.checked })}
                className="rounded text-indigo-600 w-4 h-4"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Pillar 3: Technical DDEX, ISRC, UPC & Audio Rules */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Barcode className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">
            Identificadores de la Industria DDEX, Códigos ISRC & UPC Oficiales
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              DDEX DPID (Identificador de Parte Digital)
            </label>
            <input
              type="text"
              value={form.dpidPartyId || 'PADPIDA20260101'}
              onChange={(e) => setForm({ ...form, dpidPartyId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
              placeholder="PADPIDA20260101"
            />
            <span className="text-[10px] text-slate-400">Identificador global asignado por DDEX Secretariat</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Prefijo Registrador ISRC
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={form.isrcCountryCode || 'ES'}
                onChange={(e) => setForm({ ...form, isrcCountryCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                placeholder="ES (País)"
                maxLength={2}
              />
              <input
                type="text"
                value={form.isrcRegistrantCode || 'A01'}
                onChange={(e) => setForm({ ...form, isrcRegistrantCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                placeholder="A01 (Registrador)"
                maxLength={3}
              />
            </div>
            <span className="text-[10px] text-slate-400">Formato: [País]-[Registrador]-[Año]-[Secuencial]</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Prefijo Código de Barras UPC
            </label>
            <input
              type="text"
              value={form.defaultUpcPrefix || '8439120'}
              onChange={(e) => setForm({ ...form, defaultUpcPrefix: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
              placeholder="8439120"
            />
            <span className="text-[10px] text-slate-400">Prefijo de GS1 para generación automática de UPC</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Sello Discográfico Predeterminado
            </label>
            <input
              type="text"
              value={form.defaultLabel || 'Sonora Music Worldwide'}
              onChange={(e) => setForm({ ...form, defaultLabel: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              placeholder="Sonora Music Worldwide"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Línea Fonográfica ℗ Predeterminada
            </label>
            <input
              type="text"
              value={form.defaultPLine || '℗ 2026 Sonora Music Group'}
              onChange={(e) => setForm({ ...form, defaultPLine: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
              placeholder="℗ 2026 Sonora Music Group"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Línea de Copyright © Predeterminada
            </label>
            <input
              type="text"
              value={form.defaultCLine || '© 2026 Sonora Music Group'}
              onChange={(e) => setForm({ ...form, defaultCLine: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
              placeholder="© 2026 Sonora Music Group"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Moneda Base de Liquidación
            </label>
            <select
              value={form.currency || 'USD'}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              <option value="USD">USD ($) - Dólares Americanos</option>
              <option value="EUR">EUR (€) - Euros</option>
              <option value="GBP">GBP (£) - Libras Esterlinas</option>
              <option value="MXN">MXN ($) - Pesos Mexicanos</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tamaño Máx. Audio WAV (MB)
            </label>
            <input
              type="number"
              value={form.maxUploadAudioSizeMB || 500}
              onChange={(e) => setForm({ ...form, maxUploadAudioSizeMB: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
            <span className="text-[10px] text-slate-400">Límite por pista de audio sin compresión</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Resolución Mínima Carátula (px)
            </label>
            <input
              type="number"
              value={form.minCoverResolution || 3000}
              onChange={(e) => setForm({ ...form, minCoverResolution: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
            <span className="text-[10px] text-slate-400">Requerimiento 3000x3000px estándar de DSPs</span>
          </div>
        </div>
      </div>

      {/* Pillar 4: Subscription Plans */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Package className="w-4 h-4 text-purple-600" />
          <h3 className="font-bold text-slate-800 text-sm">Planes de Suscripción del SaaS</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {form.plans?.map((plan, idx) => (
            <div key={plan.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{plan.name}</span>
                <span className="font-bold text-indigo-600 text-sm">${plan.priceMonthly}/mes</span>
              </div>
              <p className="text-slate-600">Comisión Artista: {plan.artistCommission}%</p>
              <p className="text-slate-500">Lanzamientos: {plan.releasesAllowed}</p>

              <ul className="pt-2 border-t border-slate-200 space-y-1 text-[11px] text-slate-500">
                {plan.features.map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};
