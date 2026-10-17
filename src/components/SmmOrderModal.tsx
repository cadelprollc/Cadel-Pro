import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  DollarSign,
  Music,
} from 'lucide-react';
import { SmmService, SmmOrder, User, Release, VideoRelease } from '../types.js';
import { api } from '../lib/api.js';

interface Props {
  isOpen: boolean;
  service: SmmService | null;
  onClose: () => void;
  onSuccess: (order: SmmOrder, newBalance: number) => void;
  currentUser: User;
  availableBalance: number;
  releases?: Release[];
  videos?: VideoRelease[];
  onNavigateToWallet?: () => void;
}

export const SmmOrderModal: React.FC<Props> = ({
  isOpen,
  service,
  onClose,
  onSuccess,
  currentUser,
  availableBalance,
  releases = [],
  videos = [],
  onNavigateToWallet,
}) => {
  if (!isOpen || !service) return null;

  const [quantity, setQuantity] = useState<number>(service.minQuantity || 1000);
  const [targetLink, setTargetLink] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recharging, setRecharging] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(availableBalance);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setCurrentBalance(availableBalance);
  }, [availableBalance]);

  // Calculate order cost in USD
  const totalCost = Math.round(((service.ratePer1000 * (quantity || 0)) / 1000) * 100) / 100;
  const balanceRemaining = Math.round((currentBalance - totalCost) * 100) / 100;
  const isInsufficientFunds = currentBalance < totalCost;

  const handleQuickQuantity = (qty: number) => {
    const clamped = Math.max(service.minQuantity, Math.min(service.maxQuantity, qty));
    setQuantity(clamped);
  };

  const handleSelectFromCatalog = (url: string) => {
    setTargetLink(url);
  };

  const handleQuickRecharge = async (amt: number = 100) => {
    setRecharging(true);
    try {
      const res = await api.rechargeWallet(amt);
      if (res?.balance?.availableBalance !== undefined) {
        setCurrentBalance(res.balance.availableBalance);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Error al recargar saldo');
    } finally {
      setRecharging(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLink.trim()) {
      setError('Por favor introduce el enlace (URL) de destino para la promoción.');
      return;
    }

    if (quantity < service.minQuantity || quantity > service.maxQuantity) {
      setError(
        `La cantidad debe estar entre ${service.minQuantity.toLocaleString('es-ES')} y ${service.maxQuantity.toLocaleString('es-ES')}.`
      );
      return;
    }

    if (isInsufficientFunds) {
      setError(
        `Saldo insuficiente. Tu saldo es de $${currentBalance.toFixed(2)} USD y el pedido cuesta $${totalCost.toFixed(2)} USD.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.createSmmOrder({
        serviceId: service.id,
        targetLink: targetLink.trim(),
        quantity,
      });

      onSuccess(res.order, res.balance.availableBalance);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la compra en el panel SMM.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                  {service.category}
                </span>
                <span className="text-[10px] text-indigo-200 font-mono">
                  ${service.ratePer1000.toFixed(2)} / 1k
                </span>
              </div>
              <h3 className="text-sm font-black text-white line-clamp-1">{service.name}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <span className="font-bold block">{error}</span>
                {isInsufficientFunds && (
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      disabled={recharging}
                      onClick={() => handleQuickRecharge(100)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                    >
                      {recharging ? 'Recargando...' : '+ Recargar $100 USD Ahora'}
                    </button>
                    {onNavigateToWallet && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToWallet();
                        }}
                        className="text-rose-800 underline font-semibold text-[11px]"
                      >
                        Ir a mi billetera →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Specs summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Velocidad de Entrega:</span>
              <strong className="text-slate-800 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {service.averageSpeed}
              </strong>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Garantía / Reposición (Refill):</span>
              <strong className="text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {service.guaranteeDays} días sin caídas
              </strong>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              {service.description}
            </p>
          </div>

          {/* Target Link Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                Enlace / URL de Destino <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Ej. YouTube, Spotify, TikTok
              </span>
            </div>
            <input
              type="url"
              required
              value={targetLink}
              onChange={(e) => setTargetLink(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... o https://open.spotify.com/track/..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs"
            />

            {/* Quick autofill from artist releases or videos */}
            {(videos.length > 0 || releases.length > 0) && (
              <div className="pt-1">
                <span className="text-[10px] text-slate-500 block mb-1">
                  O autocompleta con uno de tus videoclips/tracks:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {videos.slice(0, 3).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectFromCatalog(`https://youtube.com/watch?v=vevo_${v.id}`)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] text-slate-700 truncate max-w-[200px]"
                      title={v.title}
                    >
                      🎬 {v.title}
                    </button>
                  ))}
                  {releases.slice(0, 3).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectFromCatalog(`https://open.spotify.com/album/${r.upc || r.id}`)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] text-slate-700 truncate max-w-[200px]"
                      title={r.title}
                    >
                      🎵 {r.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                Cantidad deseada ({service.type}):
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Mín: {service.minQuantity.toLocaleString('es-ES')} | Máx: {service.maxQuantity.toLocaleString('es-ES')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={service.minQuantity}
                max={service.maxQuantity}
                step={100}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm font-bold"
              />
              <span className="text-slate-500 text-xs font-semibold uppercase">
                {service.type}
              </span>
            </div>

            {/* Quantity quick buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[1000, 2500, 5000, 10000, 25000, 50000].map((preset) => {
                if (preset >= service.minQuantity && preset <= service.maxQuantity) {
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleQuickQuantity(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                        quantity === preset
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.toLocaleString('es-ES')}
                    </button>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Real-time Balance Debit Breakdown (USER'S EXPLICIT REQUIREMENT) */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl space-y-3 shadow-md border border-indigo-900/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">
              Desglose Financiero de la Compra:
            </span>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Saldo disponible actual:</span>
                <span className="font-bold text-white">${currentBalance.toFixed(2)} USD</span>
              </div>

              <div className="flex items-center justify-between text-rose-400">
                <span>Costo del pedido ({quantity.toLocaleString()} un.):</span>
                <span className="font-bold">-${totalCost.toFixed(2)} USD</span>
              </div>

              <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-sm">
                <span className="text-slate-200 font-sans font-bold">Saldo restante tras la compra:</span>
                <span
                  className={`font-black ${
                    isInsufficientFunds ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  ${balanceRemaining.toFixed(2)} USD
                </span>
              </div>
            </div>

            {isInsufficientFunds ? (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-[11px] text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>
                    Te faltan <strong>${Math.abs(balanceRemaining).toFixed(2)} USD</strong> para este pedido.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={recharging}
                  onClick={() => handleQuickRecharge(100)}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-xs shrink-0"
                >
                  {recharging ? 'Añadiendo...' : '+ Añadir $100 USD'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Saldo suficiente para debitar automáticamente e iniciar el pedido SMM.</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || isInsufficientFunds || !quantity || !targetLink.trim()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-black text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {loading
                ? 'Conectando con Panel SMM...'
                : `Debitar $${totalCost.toFixed(2)} USD y Comprar`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
