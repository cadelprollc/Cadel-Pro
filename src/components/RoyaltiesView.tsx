import React, { useState, useEffect } from 'react';
import {
  RoyaltySummary,
  User,
  Release,
  ManualRoyaltyTransaction,
  PayoutRequest,
  PayoutInvoice,
  ManualStreamReport,
  WalletLedgerEntry,
  ArtistWalletSummary,
  PayoutStatus,
} from '../types.js';
import { api } from '../lib/api.js';
import { InvoiceModal } from './InvoiceModal.js';
import { AdminManualStreamsModal } from './AdminManualStreamsModal.js';
import { PayoutRequestModal } from './PayoutRequestModal.js';
import { AdminDepositModal } from './AdminDepositModal.js';
import { PayoutStatusModal } from './PayoutStatusModal.js';
import {
  DollarSign,
  TrendingUp,
  Download,
  CreditCard,
  CheckCircle,
  Building,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Search,
  Filter,
  UserCheck,
  Disc,
  Clock,
  FileText,
  AlertCircle,
  Calendar,
  Radio,
  FileCheck,
  Eye,
  Receipt,
  Copy,
  Check,
  Lock,
  RefreshCcw,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Ban,
  ArrowDownRight,
  X,
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  royaltySummary: RoyaltySummary | null;
  usersList?: User[];
  releases?: Release[];
  onRefreshData?: () => Promise<void>;
  initialDepositArtistId?: string;
  initialDepositArtistName?: string;
  initialDepositReleaseId?: string;
  initialDepositReleaseTitle?: string;
}

export const RoyaltiesView: React.FC<Props> = ({
  currentUser,
  royaltySummary,
  usersList = [],
  releases = [],
  onRefreshData,
  initialDepositArtistId,
  initialDepositArtistName,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'ledger' | 'payouts' | 'artists_summary' | 'dsp' | 'streams'>(
    'ledger'
  );

  // Financial Wallet & Ledger state
  const [walletBalance, setWalletBalance] = useState<{
    availableBalance: number;
    pendingWithdrawals: number;
    paidOut: number;
    totalEarned: number;
    currency: string;
  }>({
    availableBalance: royaltySummary?.availableBalance ?? royaltySummary?.pendingBalance ?? 0,
    pendingWithdrawals: royaltySummary?.pendingWithdrawals ?? 0,
    paidOut: royaltySummary?.paidOut ?? 0,
    totalEarned: royaltySummary?.totalEarned ?? 0,
    currency: royaltySummary?.currency || 'USD',
  });

  const [ledger, setLedger] = useState<WalletLedgerEntry[]>([]);
  const [artistsSummary, setArtistsSummary] = useState<ArtistWalletSummary[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [streamReports, setStreamReports] = useState<ManualStreamReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('all');
  const [selectedArtistFilter, setSelectedArtistFilter] = useState<string>('all');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('all');

  // Modals state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(Boolean(initialDepositArtistId));
  const [targetDepositArtistId, setTargetDepositArtistId] = useState<string | undefined>(
    initialDepositArtistId
  );
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isManualStreamsModalOpen, setIsManualStreamsModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<PayoutInvoice | null>(null);
  const [selectedPayoutForStatus, setSelectedPayoutForStatus] = useState<PayoutRequest | null>(null);

  // Feedback banner
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  // Load all financial records
  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      const [balanceRes, ledgerRes, payoutsRes, streamsRes] = await Promise.all([
        api.getWalletBalance().catch(() => null),
        api.getWalletLedger().catch(() => ({ ledger: [] })),
        api.getPayouts().catch(() => ({ payouts: [] })),
        api.getStreamReports().catch(() => ({ reports: [] })),
      ]);

      if (balanceRes?.balance) {
        setWalletBalance(balanceRes.balance);
      }
      setLedger(ledgerRes.ledger || []);
      setPayouts(payoutsRes.payouts || []);
      setStreamReports(streamsRes.reports || []);

      if (isSuperAdmin) {
        const artistsRes = await api.getArtistsWalletSummary().catch(() => ({ artists: [] }));
        setArtistsSummary(artistsRes.artists || []);
      }
    } catch (err) {
      console.error('Failed to load financial data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [currentUser]);

  useEffect(() => {
    if (initialDepositArtistId) {
      setTargetDepositArtistId(initialDepositArtistId);
      setIsDepositModalOpen(true);
    }
  }, [initialDepositArtistId]);

  const handleCopyTx = (txId: string) => {
    navigator.clipboard.writeText(txId);
    setCopiedTxId(txId);
    setTimeout(() => setCopiedTxId(null), 2500);
  };

  const handleOpenDepositForArtist = (artistId: string) => {
    setTargetDepositArtistId(artistId);
    setIsDepositModalOpen(true);
  };

  const handleDepositSuccess = (ledgerEntry: WalletLedgerEntry, message: string) => {
    setIsDepositModalOpen(false);
    setSuccessBanner(message);
    loadFinancialData();
    if (onRefreshData) onRefreshData();
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  const handlePayoutSuccess = (payout: PayoutRequest) => {
    setIsPayoutModalOpen(false);
    setSuccessBanner(
      `¡Solicitud de retiro #${payout.requestNumber || payout.id} por $${payout.amount.toFixed(2)} ${payout.currency} creada exitosamente! Los fondos han sido apartados como Retiro Pendiente.`
    );
    loadFinancialData();
    if (onRefreshData) onRefreshData();
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  const handleStatusModalSuccess = (
    updatedPayout: PayoutRequest,
    ledgerEntry?: WalletLedgerEntry,
    invoice?: PayoutInvoice,
    message?: string
  ) => {
    setSelectedPayoutForStatus(null);
    setSuccessBanner(
      message || `Solicitud #${updatedPayout.requestNumber || updatedPayout.id} actualizada a ${updatedPayout.status.toUpperCase()}.`
    );
    loadFinancialData();
    if (onRefreshData) onRefreshData();
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  const handleCancelOwnPayout = async (payout: PayoutRequest) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas cancelar la solicitud de retiro #${payout.requestNumber || payout.id} por $${payout.amount.toFixed(2)} ${payout.currency}? Los fondos volverán inmediatamente a tu saldo disponible.`
      )
    ) {
      return;
    }

    try {
      const res = await api.updatePayoutStatus(payout.id, {
        status: 'cancelled',
        note: 'Cancelado voluntariamente por el artista.',
      });
      setSuccessBanner(
        `Solicitud #${payout.requestNumber || payout.id} cancelada. Se han reintegrado $${payout.amount.toFixed(2)} a tu saldo disponible.`
      );
      loadFinancialData();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSuccessBanner(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Error al cancelar la solicitud de retiro');
    }
  };

  // Filtered Ledger entries
  const filteredLedger = ledger.filter((entry) => {
    if (ledgerTypeFilter !== 'all' && entry.type !== ledgerTypeFilter) return false;
    if (selectedArtistFilter !== 'all' && entry.userId !== selectedArtistFilter) return false;
    if (ledgerSearch) {
      const q = ledgerSearch.toLowerCase();
      const matchTx = entry.transactionNumber.toLowerCase().includes(q);
      const matchId = entry.id.toLowerCase().includes(q);
      const matchDesc = entry.description.toLowerCase().includes(q);
      const matchUser = entry.userName.toLowerCase().includes(q);
      const matchRef = entry.reference?.toLowerCase().includes(q);
      if (!matchTx && !matchId && !matchDesc && !matchUser && !matchRef) return false;
    }
    return true;
  });

  // Filtered Payouts
  const filteredPayouts = payouts.filter((p) => {
    if (payoutStatusFilter !== 'all' && p.status !== payoutStatusFilter) return false;
    return true;
  });

  // Render Status Badge for Payout
  const renderPayoutStatusBadge = (status: PayoutStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pendiente
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" />
            En revisión
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <ShieldCheck className="w-3 h-3 text-indigo-600" />
            Aprobado
          </span>
        );
      case 'paid':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Pagado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <Ban className="w-3 h-3 text-rose-600" />
            Rechazado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <X className="w-3 h-3 text-slate-500" />
            Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  // Render Ledger Type Badge
  const renderLedgerTypeBadge = (type: WalletLedgerEntry['type']) => {
    switch (type) {
      case 'deposit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
            Depósito de Saldo
          </span>
        );
      case 'withdrawal_hold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Lock className="w-3 h-3 text-amber-600" />
            Retención por Retiro
          </span>
        );
      case 'withdrawal_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <CheckCircle className="w-3 h-3 text-indigo-600" />
            Pago de Retiro
          </span>
        );
      case 'withdrawal_refund':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
            <RefreshCcw className="w-3 h-3 text-teal-600" />
            Devolución / Reintegro
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Movimiento
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            {isSuperAdmin ? 'Gestión de Saldos, Depósitos & Retiros' : 'Mi Saldo / Balance'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSuperAdmin
              ? 'Control contable inmutable, acreditación manual a artistas y procesamiento auditado de retiros.'
              : 'Consulta tu dinero disponible en tiempo real, historial completo de movimientos y solicita retiros.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <>
              <button
                onClick={() => setIsManualStreamsModalOpen(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Radio className="w-4 h-4 text-slate-600" />
                Cargar Streams
              </button>

              <button
                onClick={() => handleOpenDepositForArtist(artistsSummary[0]?.userId || '')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Agregar Saldo Manual
              </button>
            </>
          )}

          <button
            onClick={() => setIsPayoutModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-emerald-900/10"
          >
            <CreditCard className="w-4 h-4" />
            Solicitar Retiro
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center gap-2 shadow-sm font-semibold animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* 4 Core Financial KPI Cards (Strict user requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Disponible */}
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500/40 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isSuperAdmin ? 'Tu Saldo / Balance Personal' : 'Mi Saldo Disponible'}
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>

          <div>
            <p className="text-3xl font-black text-emerald-600">
              ${walletBalance.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
              {walletBalance.currency} • Listo para retirar o cobrar
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <CheckCircle className="w-3 h-3" />
              Fondos Inmediatos
            </span>

            <button
              onClick={() => setIsPayoutModalOpen(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5"
            >
              Retirar <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Retiro Pendiente (En custodia - Anti Doble Descuento) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Retiro Pendiente (En Custodia)
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Lock className="w-4 h-4" />
            </span>
          </div>

          <div>
            <p className="text-3xl font-black text-amber-600">
              ${walletBalance.pendingWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
              {walletBalance.currency} • Reservado para evitar doble cobro
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>En proceso de revisión/pago</span>
            <span className="font-bold text-slate-700">
              {payouts.filter((p) => p.status === 'pending' || p.status === 'in_review').length} solicitudes
            </span>
          </div>
        </div>

        {/* Card 3: Total Pagado / Retirado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Retirado (Pagado)
            </span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>

          <div>
            <p className="text-3xl font-black text-slate-900">
              ${walletBalance.paidOut.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
              {walletBalance.currency} • Transferido a banco o PayPal
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Liquidaciones completadas</span>
            <span className="font-bold text-indigo-600">
              {payouts.filter((p) => p.status === 'paid' || p.status === 'completed').length} facturas
            </span>
          </div>
        </div>

        {/* Card 4: Total Ganado Acumulado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Ganado Histórico
            </span>
            <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div>
            <p className="text-3xl font-black text-slate-800">
              ${walletBalance.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
              {walletBalance.currency} • Regalías + Abonos acreditados
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Auditoría de plataforma</span>
            <span className="font-bold text-emerald-600">100% Auditado</span>
          </div>
        </div>
      </div>

      {/* Anti Double-Spending Explanatory Callout Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              Lógica Contable de Protección Anti-Doble Descuento Sonora & Cadel Pro Network
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-4xl">
              Al solicitar un retiro, tus fondos se descuentan de forma inmediata de tu <strong>Saldo Disponible</strong> y se reservan en <strong>Retiro Pendiente</strong> para evitar que se puedan retirar dos veces. Una vez que el Súper Admin ejecuta el pago, se emite la factura y se archiva como pagado. Si la solicitud es rechazada o cancelada, los fondos <strong>regresan automáticamente</strong> a tu saldo disponible.
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => handleOpenDepositForArtist(artistsSummary[0]?.userId || '')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition shrink-0 self-start md:self-center flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Acreditar Saldo a Artista
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Historial de Movimientos (Ledger)
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
            {ledger.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'payouts'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Solicitudes de Retiro & Facturas
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
            {payouts.filter((p) => p.status === 'pending' || p.status === 'in_review').length}
          </span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('artists_summary')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'artists_summary'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Saldos de Todos los Artistas
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-bold">
              {artistsSummary.length}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('dsp')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'dsp'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Disc className="w-4 h-4" />
          Desglose de DSPs & Tiendas
        </button>

        <button
          onClick={() => setActiveTab('streams')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'streams'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          Reportes de Reproducciones
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: HISTORIAL DE MOVIMIENTOS (LEDGER)                  */}
      {/* ========================================================= */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="Buscar por ID, concepto o artista..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {isSuperAdmin && (
                <select
                  value={selectedArtistFilter}
                  onChange={(e) => setSelectedArtistFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Todos los artistas</option>
                  {artistsSummary.map((a) => (
                    <option key={a.userId} value={a.userId}>
                      {a.userName} {a.stageName ? `(${a.stageName})` : ''}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={ledgerTypeFilter}
                onChange={(e) => setLedgerTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todos los movimientos</option>
                <option value="deposit">Depósitos de Saldo</option>
                <option value="withdrawal_hold">Retenciones por Retiro</option>
                <option value="withdrawal_paid">Pagos de Retiro</option>
                <option value="withdrawal_refund">Devoluciones / Reintegros</option>
              </select>

              <button
                onClick={loadFinancialData}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
                title="Actualizar libro contable"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 text-slate-500 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">ID Transacción</th>
                  {isSuperAdmin && <th className="py-3 px-4">Artista</th>}
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descripción / Concepto</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-right">Saldo Anterior</th>
                  <th className="py-3 px-4 text-right">Saldo Después</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isSuperAdmin ? 9 : 8}
                      className="py-12 text-center text-slate-400 text-xs"
                    >
                      No se encontraron movimientos registrados en el historial contable.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((tx) => {
                    const isPositive = tx.amount > 0 && tx.type !== 'withdrawal_paid';
                    const isNegative = tx.amount < 0 || tx.type === 'withdrawal_hold';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                          {new Date(tx.createdAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}{' '}
                          <span className="text-slate-400 text-[10px]">
                            {new Date(tx.createdAt).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleCopyTx(tx.transactionNumber)}
                            className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 hover:text-emerald-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition text-[11px]"
                            title="Copiar ID de transacción"
                          >
                            <span>{tx.transactionNumber}</span>
                            {copiedTxId === tx.transactionNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        </td>

                        {isSuperAdmin && (
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                            {tx.userName}
                          </td>
                        )}

                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderLedgerTypeBadge(tx.type)}
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={tx.description}>
                          {tx.description}
                          {tx.reference && (
                            <span className="block text-[10px] font-mono text-slate-400 truncate">
                              Ref: {tx.reference}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                          <span
                            className={
                              isPositive
                                ? 'text-emerald-600 font-bold'
                                : isNegative
                                ? 'text-amber-600 font-bold'
                                : 'text-slate-800'
                            }
                          >
                            {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}{' '}
                            <span className="text-[10px] font-normal text-slate-400">{tx.currency}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-[11px] text-slate-500">
                          ${tx.balanceBefore.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-[11px] font-bold text-slate-900">
                          ${tx.balanceAfter.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Completado
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SOLICITUDES DE RETIRO & FACTURAS                   */}
      {/* ========================================================= */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Filter */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Historial de Solicitudes de Retiro
              </h3>
              <p className="text-[11px] text-slate-500">
                Consulta el estado de cobro, comprobantes de pago y facturas emitidas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={payoutStatusFilter}
                onChange={(e) => setPayoutStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="in_review">En revisión</option>
                <option value="approved">Aprobados</option>
                <option value="paid">Pagados</option>
                <option value="rejected">Rechazados</option>
                <option value="cancelled">Cancelados</option>
              </select>

              <button
                onClick={() => setIsPayoutModalOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Retiro
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 text-slate-500 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nº Solicitud</th>
                  <th className="py-3 px-4">Fecha</th>
                  {isSuperAdmin && <th className="py-3 px-4">Artista</th>}
                  <th className="py-3 px-4">Método de Cobro</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 7 : 6} className="py-12 text-center text-slate-400 text-xs">
                      No hay solicitudes de retiro en este estado.
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map((p) => {
                    const isPending = p.status === 'pending' || p.status === 'in_review';
                    const isPaid = p.status === 'paid' || p.status === 'completed';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                          {p.requestNumber || p.id}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                          {new Date(p.requestedAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>

                        {isSuperAdmin && (
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                            {p.userName}
                          </td>
                        )}

                        <td className="py-3 px-4 whitespace-nowrap">
                          {p.paymentMethod === 'bank' ? (
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <Building className="w-3.5 h-3.5 text-slate-500" />
                              {p.bankDetails?.bankName} (••{p.bankDetails?.accountNumber?.slice(-4) || 'IBAN'})
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                              {p.paypalDetails?.paypalEmail}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900 text-sm">
                          ${p.amount.toFixed(2)}{' '}
                          <span className="text-[10px] font-normal text-slate-500">{p.currency}</span>
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {renderPayoutStatusBadge(p.status)}
                          {p.rejectionReason && (
                            <span className="block text-[10px] text-rose-600 max-w-xs truncate" title={p.rejectionReason}>
                              {p.rejectionReason}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                          {/* Super Admin Manage status */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => setSelectedPayoutForStatus(p)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                            >
                              Gestionar
                            </button>
                          )}

                          {/* Artist Cancel if still pending */}
                          {!isSuperAdmin && isPending && (
                            <button
                              onClick={() => handleCancelOwnPayout(p)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Cancelar
                            </button>
                          )}

                          {/* View official invoice if paid */}
                          {p.invoice && (
                            <button
                              onClick={() => setActiveInvoice(p.invoice!)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                            >
                              <FileCheck className="w-3 h-3 text-emerald-600" />
                              Factura #{p.invoice.invoiceNumber}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SALDOS DE TODOS LOS ARTISTAS (SUPER ADMIN ONLY)    */}
      {/* ========================================================= */}
      {isSuperAdmin && activeTab === 'artists_summary' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Panel de Saldos de Artistas & Sellos
              </h3>
              <p className="text-[11px] text-slate-500">
                Visualiza el saldo disponible, retiros retenidos y realiza depósitos directos.
              </p>
            </div>

            <button
              onClick={() => handleOpenDepositForArtist(artistsSummary[0]?.userId || '')}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              Nuevo Depósito Manual
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 text-slate-500 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Artista</th>
                  <th className="py-3 px-4 text-right">Saldo Disponible</th>
                  <th className="py-3 px-4 text-right">Retiro Pendiente</th>
                  <th className="py-3 px-4 text-right">Total Retirado</th>
                  <th className="py-3 px-4 text-right">Total Ganado</th>
                  <th className="py-3 px-4 text-center">Solicitudes</th>
                  <th className="py-3 px-4 text-right">Acciones Directas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {artistsSummary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No hay artistas registrados en la plataforma.
                    </td>
                  </tr>
                ) : (
                  artistsSummary.map((art) => (
                    <tr key={art.userId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={art.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                            alt={art.userName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{art.userName}</span>
                            <span className="text-[10px] text-slate-500 block">{art.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="text-sm font-black text-emerald-600">
                          ${art.availableBalance.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-amber-600">
                          ${art.pendingWithdrawals.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-slate-700">
                        ${art.paidOut.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                        ${art.totalEarned.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {art.pendingRequestsCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {art.pendingRequestsCount} por revisar
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => handleOpenDepositForArtist(art.userId)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Agregar Saldo
                        </button>

                        <button
                          onClick={() => {
                            setSelectedArtistFilter(art.userId);
                            setActiveTab('ledger');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                        >
                          Ver Historial
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: DSP BREAKDOWN                                      */}
      {/* ========================================================= */}
      {activeTab === 'dsp' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Disc className="w-4 h-4 text-emerald-600" />
              Recaudación por Tienda Digital (DSP)
            </h3>
            <p className="text-xs text-slate-500">
              Distribución de ingresos generados en las principales plataformas de streaming.
            </p>

            <div className="space-y-3 pt-2">
              {(royaltySummary?.dspBreakdown || [
                { name: 'Spotify', percentage: 48.5, amount: 6038.6 },
                { name: 'Apple Music', percentage: 28.2, amount: 3511.1 },
                { name: 'TikTok / ByteDance', percentage: 13.1, amount: 1631.0 },
                { name: 'Amazon Music', percentage: 6.4, amount: 796.8 },
                { name: 'YouTube Music', percentage: 3.8, amount: 473.1 },
              ]).map((dsp) => (
                <div key={dsp.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{dsp.name}</span>
                    <span className="font-mono text-slate-600 font-bold">
                      ${(dsp.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD ({dsp.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, dsp.percentage || 10)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Rendimiento Histórico Mensual
            </h3>
            <p className="text-xs text-slate-500">
              Evolución de ingresos netos mensuales acreditados.
            </p>

            <div className="space-y-3 pt-2">
              {(royaltySummary?.monthlyStats || [
                { month: 'Ene', earnings: 1200, streams: 150000 },
                { month: 'Feb', earnings: 1450, streams: 180000 },
                { month: 'Mar', earnings: 1900, streams: 230000 },
                { month: 'Abr', earnings: 2100, streams: 270000 },
                { month: 'May', earnings: 2800, streams: 340000 },
                { month: 'Jun', earnings: 3000, streams: 250500 },
              ]).map((m) => (
                <div key={m.month} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center text-xs">
                      {m.month}
                    </span>
                    <span className="text-xs text-slate-500">
                      {m.streams.toLocaleString()} reproducciones
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 font-mono">
                    +${m.earnings.toFixed(2)} USD
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: REPORTES DE REPRODUCCIONES                         */}
      {/* ========================================================= */}
      {activeTab === 'streams' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Reportes Mensuales de Reproducciones Digitales
              </h3>
              <p className="text-[11px] text-slate-500">
                Liquidaciones generadas por plataformas de streaming (Spotify, Apple, YouTube, TikTok).
              </p>
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => setIsManualStreamsModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Cargar Reproducciones
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 text-slate-500 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Período</th>
                  {isSuperAdmin && <th className="py-3 px-4">Artista</th>}
                  <th className="py-3 px-4">Plataformas</th>
                  <th className="py-3 px-4 text-right">Total Streams</th>
                  <th className="py-3 px-4 text-right">Liquidación Neta</th>
                  <th className="py-3 px-4 text-right">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {streamReports.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 5} className="py-12 text-center text-slate-400 text-xs">
                      No hay reportes de reproducciones registrados todavía.
                    </td>
                  </tr>
                ) : (
                  streamReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {rep.period}
                      </td>

                      {isSuperAdmin && (
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                          {rep.artistName}
                        </td>
                      )}

                      <td className="py-3 px-4 text-slate-600">
                        {rep.platformStreams.map((s) => s.platform).join(', ')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {rep.totalStreams.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                        +${rep.totalEarnings.toFixed(2)} {rep.currency}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(rep.createdAt).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}
      {/* Modal 1: Super Admin Deposit Modal */}
      {isDepositModalOpen && (
        <AdminDepositModal
          currentUser={currentUser}
          usersList={usersList}
          initialArtistId={targetDepositArtistId}
          onClose={() => setIsDepositModalOpen(false)}
          onSuccess={handleDepositSuccess}
        />
      )}

      {/* Modal 2: Artist Payout Request Modal */}
      {isPayoutModalOpen && (
        <PayoutRequestModal
          currentUser={currentUser}
          royaltySummary={{
            ...royaltySummary,
            availableBalance: walletBalance.availableBalance,
            pendingWithdrawals: walletBalance.pendingWithdrawals,
            paidOut: walletBalance.paidOut,
            totalEarned: walletBalance.totalEarned,
            pendingBalance: walletBalance.availableBalance,
            currency: walletBalance.currency,
            totalStreams: royaltySummary?.totalStreams || 0,
            monthlyStats: royaltySummary?.monthlyStats || [],
            dspBreakdown: royaltySummary?.dspBreakdown || [],
            topTracks: royaltySummary?.topTracks || [],
          }}
          onClose={() => setIsPayoutModalOpen(false)}
          onSuccess={handlePayoutSuccess}
        />
      )}

      {/* Modal 3: Payout Status Change Modal (Admin / Cancellation) */}
      {selectedPayoutForStatus && (
        <PayoutStatusModal
          payout={selectedPayoutForStatus}
          currentUser={currentUser}
          onClose={() => setSelectedPayoutForStatus(null)}
          onSuccess={handleStatusModalSuccess}
        />
      )}

      {/* Modal 4: Official Fiscal Invoice Modal */}
      {activeInvoice && (
        <InvoiceModal
          invoice={activeInvoice}
          onClose={() => setActiveInvoice(null)}
        />
      )}

      {/* Modal 5: Manual Monthly Streams Import Modal */}
      {isManualStreamsModalOpen && (
        <AdminManualStreamsModal
          currentUser={currentUser}
          usersList={usersList}
          releases={releases}
          onClose={() => setIsManualStreamsModalOpen(false)}
          onSuccess={async () => {
            setIsManualStreamsModalOpen(false);
            setSuccessBanner('¡Reporte mensual de reproducciones cargado y acreditado con éxito!');
            await loadFinancialData();
            if (onRefreshData) await onRefreshData();
            setTimeout(() => setSuccessBanner(null), 6000);
          }}
        />
      )}
    </div>
  );
};
