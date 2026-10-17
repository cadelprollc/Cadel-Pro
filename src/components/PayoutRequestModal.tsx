import React, { useState, useEffect } from 'react';
import { User, RoyaltySummary, PayoutRequest, PayoutInvoice, SavedPaymentMethod } from '../types.js';
import { api } from '../lib/api.js';
import {
  X,
  CreditCard,
  Building,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Info,
  DollarSign,
  Lock,
  PlusCircle,
  Bookmark,
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  royaltySummary: RoyaltySummary | null;
  onClose: () => void;
  onSuccess: (payout: PayoutRequest, invoice?: PayoutInvoice) => void;
}

export const PayoutRequestModal: React.FC<Props> = ({
  currentUser,
  royaltySummary,
  onClose,
  onSuccess,
}) => {
  const availableBalance = royaltySummary?.availableBalance ?? royaltySummary?.pendingBalance ?? 0;
  const currency = royaltySummary?.currency || 'USD';

  // Saved Payment Methods
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState<string>('new');
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);

  // Form State
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'paypal'>('bank');
  const [withdrawAmount, setWithdrawAmount] = useState(
    availableBalance > 0 ? (availableBalance >= 100 ? '100.00' : availableBalance.toFixed(2)) : '50.00'
  );
  const [saveMethodForFuture, setSaveMethodForFuture] = useState(true);

  // Bank Form State
  const [bankName, setBankName] = useState('Banco Santander / Chase');
  const [accountHolder, setAccountHolder] = useState(currentUser?.name || '');
  const [accountNumber, setAccountNumber] = useState('ES91 0049 1500 0512 3456 7890');
  const [iban, setIban] = useState('ES9100491500051234567890');
  const [swift, setSwift] = useState('BSCHESMMXXX');
  const [country, setCountry] = useState('España');

  // PayPal Form State
  const [paypalEmail, setPaypalEmail] = useState(currentUser?.email || '');
  const [paypalHolder, setPaypalHolder] = useState(currentUser?.name || '');

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load saved payment methods
  useEffect(() => {
    const fetchMethods = async () => {
      setIsLoadingMethods(true);
      try {
        const res = await api.getSavedPaymentMethods();
        if (res.methods && res.methods.length > 0) {
          setSavedMethods(res.methods);
          const defaultMethod = res.methods.find((m) => m.isDefault) || res.methods[0];
          setSelectedSavedMethodId(defaultMethod.id);
          applySavedMethod(defaultMethod);
        }
      } catch (err) {
        console.error('Failed to load saved payment methods', err);
      } finally {
        setIsLoadingMethods(false);
      }
    };
    fetchMethods();
  }, []);

  const applySavedMethod = (method: SavedPaymentMethod) => {
    setPaymentMethod(method.type);
    if (method.type === 'bank' && method.bankDetails) {
      setBankName(method.bankDetails.bankName || '');
      setAccountHolder(method.bankDetails.accountHolder || '');
      setAccountNumber(method.bankDetails.accountNumber || '');
      setIban(method.bankDetails.iban || '');
      setSwift(method.bankDetails.swift || '');
      setCountry(method.bankDetails.country || 'España');
    } else if (method.type === 'paypal' && method.paypalDetails) {
      setPaypalEmail(method.paypalDetails.paypalEmail || '');
      setPaypalHolder(method.paypalDetails.accountHolder || currentUser?.name || '');
    }
  };

  const handleSelectSavedMethod = (methodId: string) => {
    setSelectedSavedMethodId(methodId);
    if (methodId === 'new') {
      return;
    }
    const found = savedMethods.find((m) => m.id === methodId);
    if (found) {
      applySavedMethod(found);
    }
  };

  const numAmount = parseFloat(withdrawAmount) || 0;
  const remainingAvailable = Math.max(0, Number((availableBalance - numAmount).toFixed(2)));

  const handleSetMax = () => {
    setWithdrawAmount(availableBalance.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMsg('El monto a retirar debe ser mayor a 0.');
      return;
    }

    if (numAmount > availableBalance) {
      setErrorMsg(
        `Saldo insuficiente. Tu saldo disponible actual es de $${availableBalance.toFixed(2)} ${currency}.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        amount: numAmount,
        currency,
        paymentMethod,
        notes,
        savePaymentMethod: selectedSavedMethodId === 'new' ? saveMethodForFuture : false,
      };

      if (paymentMethod === 'bank') {
        payload.bankDetails = {
          bankName,
          accountHolder,
          accountNumber,
          iban,
          swift,
          country,
        };
      } else {
        payload.paypalDetails = {
          paypalEmail,
          accountHolder: paypalHolder,
        };
      }

      const res = await api.requestPayout(payload);
      onSuccess(res.payout);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la solicitud de retiro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Solicitar Retiro de Saldo</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Transfiere tus fondos disponibles a tu cuenta bancaria o PayPal con auditoría garantizada.
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
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Balance Breakdown Banner */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
                  Tu Saldo Disponible Actual
                </span>
                <p className="text-3xl font-black text-white mt-0.5">
                  ${Number(availableBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                  <span className="text-sm font-normal text-emerald-400">{currency}</span>
                </p>
              </div>

              {availableBalance > 0 && (
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition shrink-0"
                >
                  Retirar Todo ($ {availableBalance.toFixed(2)})
                </button>
              )}
            </div>

            {/* Live Calculation Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-800 text-xs">
              <div className="bg-slate-800/70 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Retiro Solicitado</span>
                <span className="font-bold text-amber-400 text-sm">
                  ${numAmount.toFixed(2)} {currency}
                </span>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Nuevo Saldo Disponible</span>
                <span className="font-bold text-emerald-400 text-sm">
                  ${remainingAvailable.toFixed(2)} {currency}
                </span>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Retiro Pendiente (En custodia)</span>
                <span className="font-bold text-sky-400 text-sm">
                  ${numAmount.toFixed(2)} {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Anti Double-Spending Explanatory Callout */}
          <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="text-xs text-sky-900 leading-relaxed">
              <span className="font-bold block text-sky-950">Lógica de protección anti doble descuento:</span>
              Al confirmar esta solicitud, los <strong>${numAmount.toFixed(2)} {currency}</strong> se reservarán inmediatamente de tu saldo disponible y pasarán a <strong>Retiro pendiente</strong>. No podrás utilizarlos mientras estén en proceso. Si la solicitud es rechazada o cancelada, los fondos volverán automáticamente a tu saldo disponible.
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Monto que deseas retirar ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                max={availableBalance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-20 py-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />
              <span className="absolute right-4 top-3 text-xs font-semibold text-slate-400">
                {currency}
              </span>
            </div>
            {numAmount > availableBalance && (
              <p className="text-[11px] text-rose-600 font-medium">
                El monto excede tu saldo disponible actual (${availableBalance.toFixed(2)} {currency}).
              </p>
            )}
          </div>

          {/* Saved Payment Methods (if any) */}
          {savedMethods.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Cuentas de Cobro Guardadas
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedMethods.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => handleSelectSavedMethod(m.id)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      selectedSavedMethodId === m.id
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700 shrink-0">
                        {m.type === 'bank' ? <Building className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 block truncate">{m.label}</span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {m.type === 'bank'
                            ? `${m.bankDetails?.accountHolder} • ${m.bankDetails?.bankName}`
                            : m.paypalDetails?.paypalEmail}
                        </span>
                      </div>
                    </div>
                    {selectedSavedMethodId === m.id && (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                    )}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setSelectedSavedMethodId('new')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                    selectedSavedMethodId === 'new'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">Ingresar otra cuenta...</span>
                </button>
              </div>
            </div>
          )}

          {/* Payment Method Tabs (Active when entering or editing) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Método de Pago *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('bank');
                  if (selectedSavedMethodId !== 'new') {
                    const firstBank = savedMethods.find((m) => m.type === 'bank');
                    if (firstBank) applySavedMethod(firstBank);
                  }
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                  paymentMethod === 'bank'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl ${
                    paymentMethod === 'bank'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Transferencia Bancaria</div>
                  <div className="text-[11px] opacity-75 font-normal">Cuenta SEPA / SWIFT / ACH</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('paypal');
                  if (selectedSavedMethodId !== 'new') {
                    const firstPaypal = savedMethods.find((m) => m.type === 'paypal');
                    if (firstPaypal) applySavedMethod(firstPaypal);
                  }
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                  paymentMethod === 'paypal'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl ${
                    paymentMethod === 'paypal'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">PayPal</div>
                  <div className="text-[11px] opacity-75 font-normal">Depósito directo por e-mail</div>
                </div>
              </button>
            </div>
          </div>

          {/* Form Fields: Bank */}
          {paymentMethod === 'bank' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Nombre del Banco *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ej. BBVA, Santander, Chase"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Nombre del Titular *</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Nombre completo o razón social"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Número de Cuenta / IBAN *</label>
                  <input
                    type="text"
                    value={iban || accountNumber}
                    onChange={(e) => {
                      setIban(e.target.value);
                      setAccountNumber(e.target.value);
                    }}
                    placeholder="ES91 0000 0000 0000 0000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Código SWIFT / BIC</label>
                  <input
                    type="text"
                    value={swift}
                    onChange={(e) => setSwift(e.target.value)}
                    placeholder="BSCHESMMXXX"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">País de la Cuenta *</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="España, Estados Unidos, México, Colombia, etc."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Form Fields: PayPal */}
          {paymentMethod === 'paypal' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Correo Electrónico de PayPal *</label>
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="tu-cuenta@paypal.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Nombre del Titular en PayPal</label>
                <input
                  type="text"
                  value={paypalHolder}
                  onChange={(e) => setPaypalHolder(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Save method checkbox */}
          {selectedSavedMethodId === 'new' && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium select-none">
              <input
                type="checkbox"
                checked={saveMethodForFuture}
                onChange={(e) => setSaveMethodForFuture(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                Guardar estos datos de pago para futuros retiros
              </span>
            </label>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Notas adicionales para el Administrador (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Prioridad fin de mes, referencia de factura propia..."
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
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || numAmount <= 0 || numAmount > availableBalance}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Procesando Solicitud...
                </>
              ) : (
                <>
                  Confirmar Retiro (${numAmount.toFixed(2)})
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
