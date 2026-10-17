import React, { useState } from 'react';
import { PayoutRequest, PayoutStatus, User, WalletLedgerEntry, PayoutInvoice } from '../types.js';
import { api } from '../lib/api.js';
import {
  X,
  CreditCard,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  RefreshCcw,
  Clock,
  Ban,
  DollarSign,
} from 'lucide-react';

interface Props {
  payout: PayoutRequest;
  currentUser: User | null;
  onClose: () => void;
  onSuccess: (updatedPayout: PayoutRequest, ledgerEntry?: WalletLedgerEntry, invoice?: PayoutInvoice, message?: string) => void;
}

export const PayoutStatusModal: React.FC<Props> = ({
  payout,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
  const isOwnerArtist = currentUser?.id === payout.userId;

  // Selected new status
  const [selectedStatus, setSelectedStatus] = useState<PayoutStatus>(
    isSuperAdmin ? (payout.status === 'pending' ? 'in_review' : 'paid') : 'cancelled'
  );

  const [paymentReference, setPaymentReference] = useState(
    `TXN-SEPA-${Date.now().toString().slice(-8)}`
  );
  const [note, setNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Datos bancarios incompletos o incorrectos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.updatePayoutStatus(payout.id, {
        status: selectedStatus,
        note,
        paymentReference: selectedStatus === 'paid' ? paymentReference : undefined,
        rejectionReason:
          selectedStatus === 'rejected' || selectedStatus === 'cancelled'
            ? rejectionReason || note
            : undefined,
      });

      onSuccess(res.payout, res.ledgerEntry, res.invoice, res.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar el estado de la solicitud.');
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
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isSuperAdmin ? 'Gestionar Solicitud de Retiro' : 'Cancelar Solicitud de Retiro'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Solicitud #{payout.requestNumber || payout.id} • {payout.userName}
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Request Overview */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500 font-medium">Beneficiario:</span>
              <span className="font-bold text-slate-900">
                {payout.userName} ({payout.userEmail})
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500 font-medium">Monto a liquidar:</span>
              <span className="text-base font-black text-emerald-600">
                ${payout.amount.toFixed(2)} {payout.currency}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500 font-medium">Método de Cobro:</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                {payout.paymentMethod === 'bank' ? (
                  <>
                    <Building className="w-3.5 h-3.5 text-slate-600" />
                    Cuenta Bancaria ({payout.bankDetails?.bankName})
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                    PayPal ({payout.paypalDetails?.paypalEmail})
                  </>
                )}
              </span>
            </div>

            {payout.paymentMethod === 'bank' && payout.bankDetails && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
                <div><strong>Titular:</strong> {payout.bankDetails.accountHolder}</div>
                <div><strong>IBAN/Cuenta:</strong> {payout.bankDetails.iban || payout.bankDetails.accountNumber}</div>
                {payout.bankDetails.swift && <div><strong>SWIFT/BIC:</strong> {payout.bankDetails.swift}</div>}
                <div><strong>País:</strong> {payout.bankDetails.country}</div>
              </div>
            )}

            {payout.paymentMethod === 'paypal' && payout.paypalDetails && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-1">
                <div><strong>E-mail PayPal:</strong> {payout.paypalDetails.paypalEmail}</div>
                {payout.paypalDetails.accountHolder && (
                  <div><strong>Titular registrado:</strong> {payout.paypalDetails.accountHolder}</div>
                )}
              </div>
            )}
          </div>

          {/* Status Selection (for Super Admin) */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Seleccionar Nuevo Estado de la Solicitud *
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('in_review')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                    selectedStatus === 'in_review'
                      ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold ring-2 ring-sky-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="text-xs font-bold block">En revisión</span>
                    <span className="text-[10px] text-slate-500 font-normal">Validando datos bancarios</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('approved')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                    selectedStatus === 'approved'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="text-xs font-bold block">Aprobado</span>
                    <span className="text-[10px] text-slate-500 font-normal">Listo para emitir pago</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('paid')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                    selectedStatus === 'paid'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold block">Marcar como Pagado</span>
                    <span className="text-[10px] text-slate-500 font-normal">Genera factura fiscal</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('rejected')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                    selectedStatus === 'rejected'
                      ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <Ban className="w-4 h-4 text-rose-600" />
                  <div>
                    <span className="text-xs font-bold block">Rechazar</span>
                    <span className="text-[10px] text-rose-600 font-normal">Devuelve el saldo al artista</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* If Paid: Ask for Transaction Reference */}
          {selectedStatus === 'paid' && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Emisión de Liquidación & Factura Oficial</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Al marcar como pagado, los <strong>${payout.amount.toFixed(2)} {payout.currency}</strong> se retirarán definitivamente de los fondos retenidos del artista, pasando a &apos;Total Retirado&apos;. Se generará la Factura Oficial Sonora con código de verificación fiscal.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Número de Referencia Bancaria / Comprobante SWIFT / ID PayPal *
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ej. TXN-SEPA-948102384, PP-849204..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          {/* If Rejected or Cancelled: Notice on automatic refund */}
          {(selectedStatus === 'rejected' || selectedStatus === 'cancelled') && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <RefreshCcw className="w-4 h-4 text-rose-600" />
                <span>Reintegro Automático de Fondos al Saldo Disponible</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Los <strong>${payout.amount.toFixed(2)} {payout.currency}</strong> retenidos serán devueltos inmediatamente al saldo disponible de {payout.userName}, registrándose en el ledger como un movimiento contable de devolución.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Motivo de la {selectedStatus === 'rejected' ? 'Rechazo' : 'Cancelación'} *
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explica el motivo para notificar al artista..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Optional internal note */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Nota interna para el historial (Opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anotaciones de auditoría o seguimiento..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
              disabled={isSubmitting}
            >
              Cerrar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 shadow-lg disabled:opacity-50 ${
                selectedStatus === 'paid'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                  : selectedStatus === 'rejected' || selectedStatus === 'cancelled'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  Confirmar Estado ({selectedStatus.toUpperCase()})
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
