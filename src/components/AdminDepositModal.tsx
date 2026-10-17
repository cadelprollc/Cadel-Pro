import React, { useState, useEffect } from 'react';
import { User, RoyaltySummary, WalletLedgerEntry } from '../types.js';
import { api } from '../lib/api.js';
import {
  X,
  DollarSign,
  UserCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Receipt,
  FileText,
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  usersList: User[];
  initialArtistId?: string;
  onClose: () => void;
  onSuccess: (ledgerEntry: WalletLedgerEntry, message: string) => void;
}

export const AdminDepositModal: React.FC<Props> = ({
  currentUser,
  usersList,
  initialArtistId,
  onClose,
  onSuccess,
}) => {
  const artistsList = usersList.filter((u) => u.role === 'artist');

  const [selectedArtistId, setSelectedArtistId] = useState(
    initialArtistId || (artistsList.length > 0 ? artistsList[0].id : '')
  );
  const [depositAmount, setDepositAmount] = useState('100.00');
  const [currency, setCurrency] = useState('USD');
  const [concept, setConcept] = useState('Depósito manual de saldo por Súper Admin');
  const [period, setPeriod] = useState(
    `${new Date().toLocaleString('es-ES', { month: 'long' })} ${new Date().getFullYear()}`
  );
  const [sourceDsp, setSourceDsp] = useState('Abono Directo Súper Admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Artist current balance preview
  const [artistCurrentBalance, setArtistCurrentBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const selectedArtist = artistsList.find((a) => a.id === selectedArtistId);

  // Fetch target artist's current balance
  useEffect(() => {
    if (!selectedArtistId) return;
    let isMounted = true;
    setIsLoadingBalance(true);
    api
      .getArtistsWalletSummary()
      .then((res) => {
        if (!isMounted) return;
        const found = res.artists.find((a) => a.userId === selectedArtistId);
        if (found) {
          setArtistCurrentBalance(found.availableBalance);
        } else {
          setArtistCurrentBalance(0);
        }
      })
      .catch(() => {
        if (isMounted) setArtistCurrentBalance(0);
      })
      .finally(() => {
        if (isMounted) setIsLoadingBalance(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedArtistId]);

  const numAmount = parseFloat(depositAmount) || 0;
  const currentBal = artistCurrentBalance ?? 0;
  const projectedBalance = Number((currentBal + numAmount).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtistId) {
      setErrorMsg('Debes seleccionar un artista beneficiario.');
      return;
    }

    if (numAmount <= 0) {
      setErrorMsg('El monto a depositar debe ser mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.depositRoyalty({
        artistId: selectedArtistId,
        artistName: selectedArtist?.stageName || selectedArtist?.name,
        amount: numAmount,
        currency,
        sourceDsp,
        period,
        notes: concept,
      });

      onSuccess(
        (res as any).ledgerEntry || (res as any).transaction,
        `¡Depósito de $${numAmount.toFixed(2)} ${currency} acreditado exitosamente a ${selectedArtist?.name}! Saldo actualizado: $${projectedBalance.toFixed(2)} ${currency}.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el depósito.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Agregar Saldo a Artista</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Acredita saldo manualmente a la cuenta de cualquier artista con registro en el ledger.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Select Artist */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Seleccionar Artista / Sello *
            </label>
            <select
              value={selectedArtistId}
              onChange={(e) => setSelectedArtistId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {artistsList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.stageName ? `(${a.stageName})` : ''} — {a.email}
                </option>
              ))}
            </select>
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Monto a Depositar *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="100.00"
                  className="w-full pl-8 pr-12 py-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="MXN">MXN ($)</option>
              </select>
            </div>
          </div>

          {/* Real-time Math Preview Card (Matches exact user specification) */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
              Previsualización Contable en Tiempo Real
            </span>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-800/80 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Saldo Anterior</span>
                <span className="font-bold text-slate-200 text-sm">
                  {isLoadingBalance ? '...' : `$${currentBal.toFixed(2)}`}
                </span>
              </div>

              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/30 rounded-xl">
                <span className="text-emerald-400 block text-[10px] uppercase font-mono">Nuevo Depósito</span>
                <span className="font-bold text-emerald-400 text-sm">
                  +${numAmount.toFixed(2)}
                </span>
              </div>

              <div className="p-2.5 bg-emerald-900/90 rounded-xl">
                <span className="text-emerald-200 block text-[10px] uppercase font-mono">Nuevo Saldo Total</span>
                <span className="font-bold text-white text-sm">
                  ${projectedBalance.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              El saldo se reflejará inmediatamente en la cuenta del artista y generará un ID de transacción único.
            </p>
          </div>

          {/* Concept / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Concepto / Descripción del Movimiento *
            </label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej. Depósito de saldo manual, adelanto de regalías, bono..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Origin / Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Origen / DSP
              </label>
              <input
                type="text"
                value={sourceDsp}
                onChange={(e) => setSourceDsp(e.target.value)}
                placeholder="Abono Directo, Spotify, Apple..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Período Contable
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Septiembre 2026"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || numAmount <= 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Acreditando Saldo...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  Acreditar ${numAmount.toFixed(2)} {currency}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
