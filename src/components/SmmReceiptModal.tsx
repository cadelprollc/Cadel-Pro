import React, { useState } from 'react';
import {
  X,
  Receipt,
  CheckCircle2,
  Clock,
  Zap,
  ExternalLink,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  DollarSign,
  Wallet,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';
import { SmmOrder, User } from '../types.js';

interface Props {
  isOpen: boolean;
  order: SmmOrder | null;
  currentUser: User;
  onClose: () => void;
}

export const SmmReceiptModal: React.FC<Props> = ({
  isOpen,
  order,
  currentUser,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const balanceBefore = order.balanceBefore !== undefined ? order.balanceBefore : (order.totalCost + (order.balanceAfter || 0));
  const balanceAfter = order.balanceAfter !== undefined ? order.balanceAfter : Math.max(0, balanceBefore - order.totalCost);
  const deductedAmount = order.deductedAmount !== undefined ? order.deductedAmount : order.totalCost;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6 print:m-0 print:shadow-none print:border-none">
        {/* Receipt Header Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-indigo-300 uppercase block font-bold">
                  Comprobante Oficial de Compra
                </span>
                <h2 className="text-base font-black text-white">
                  Tienda de Productos SMM
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-indigo-800/40 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Nº de Pedido</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-white text-sm">
                <span>{order.orderNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="text-slate-400 hover:text-white transition print:hidden"
                  title="Copiar número de pedido"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-400 text-[10px] block">Fecha de Compra</span>
              <span className="font-mono text-slate-200">
                {new Date(order.createdAt).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Purchaser info */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Artista / Comprador
              </span>
              <span className="font-bold text-slate-800">
                {order.userName || currentUser.stageName || currentUser.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Cuenta Débito
              </span>
              <span className="font-mono text-slate-600 font-bold">
                Billetera Sonora
              </span>
            </div>
          </div>

          {/* Product details */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Detalle del Producto Adquirido:
            </span>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
                    {order.serviceCategory}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{order.serviceName}</h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-bold">Cantidad</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {order.quantity.toLocaleString('es-ES')} un.
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Enlace de Destino:</span>
                <a
                  href={order.targetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline font-mono flex items-center gap-1 max-w-[260px] truncate"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{order.targetLink}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Financial Breakdown: Cost, Deducted Balance, and Resulting Balance */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl space-y-3 shadow-sm border border-indigo-900/40">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">
              Desglose Financiero & Débito en Billetera:
            </span>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Costo Total del Producto:</span>
                <span className="font-bold text-white text-sm">
                  ${order.totalCost.toFixed(2)} USD
                </span>
              </div>

              <div className="flex items-center justify-between text-rose-400">
                <span className="flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Saldo Descontado al Artista:</span>
                </span>
                <span className="font-black text-sm">
                  -${deductedAmount.toFixed(2)} USD
                </span>
              </div>

              <div className="pt-2 border-t border-slate-700/80 space-y-1.5 font-sans">
                <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                  <span>Saldo antes de la compra:</span>
                  <span>${balanceBefore.toFixed(2)} USD</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="font-bold text-slate-200">
                    Saldo Resultante tras la Transacción:
                  </span>
                  <span className="font-mono font-black text-emerald-400 text-base bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/40">
                    ${balanceAfter.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dispatch / Fulfillment Metadata */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Estado del Pedido:</span>
              <span className="font-bold text-slate-800 capitalize flex items-center gap-1">
                {order.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {order.status === 'in_progress' && <Zap className="w-3.5 h-3.5 text-indigo-600" />}
                {order.status === 'processing' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                {order.status === 'completed' ? 'Completado' : order.status === 'in_progress' ? 'En Progreso' : order.status}
              </span>
            </div>

            {order.externalOrderId && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ID de Despacho SMM:</span>
                <span className="font-mono text-slate-700">{order.externalOrderId}</span>
              </div>
            )}

            {order.startCount !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Conteo Inicial Registrado:</span>
                <span className="font-mono text-slate-700">{order.startCount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
              <span>Registro Contable:</span>
              <span className="font-mono">Inmutable · Billetera de Artista Sonora</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Recibo</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
