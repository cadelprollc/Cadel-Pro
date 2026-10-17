import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Server,
  Film,
  Music,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Heart,
  Users,
  Radio,
  History,
  Link2,
  Plus,
  Trash2,
  Copy,
  Check,
  QrCode,
  Receipt,
  Wallet,
} from 'lucide-react';
import { SmmService, SmmOrder, SmmPanelConfig, User, Role, Release, VideoRelease, WalletLedgerEntry, SmartLink } from '../types.js';
import { api } from '../lib/api.js';
import { SmmOrderModal } from './SmmOrderModal.js';
import { SmmConfigModal } from './SmmConfigModal.js';
import { SmartLinkModal } from './SmartLinkModal.js';
import { SmartLinkLandingModal } from './SmartLinkLandingModal.js';
import { SmmReceiptModal } from './SmmReceiptModal.js';

interface Props {
  currentUser: User;
  role: Role;
  releases?: Release[];
  videos?: VideoRelease[];
  onNavigateToWallet?: () => void;
}

export const SmmStoreView: React.FC<Props> = ({
  currentUser,
  role,
  releases = [],
  videos = [],
  onNavigateToWallet,
}) => {
  const [services, setServices] = useState<SmmService[]>([]);
  const [orders, setOrders] = useState<SmmOrder[]>([]);
  const [smartlinks, setSmartlinks] = useState<SmartLink[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<WalletLedgerEntry[]>([]);
  const [availableBalance, setAvailableBalance] = useState<number>(100.0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'smartlinks' | 'orders' | 'ledger'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [orderCategoryFilter, setOrderCategoryFilter] = useState<string>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Modals
  const [selectedService, setSelectedService] = useState<SmmService | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSmartLinkModalOpen, setIsSmartLinkModalOpen] = useState(false);
  const [editingSmartLink, setEditingSmartLink] = useState<SmartLink | null>(null);
  const [previewLandingLink, setPreviewLandingLink] = useState<SmartLink | null>(null);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<SmmOrder | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [deletingSmartLink, setDeletingSmartLink] = useState<SmartLink | null>(null);
  const [recharging, setRecharging] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Success alert
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesRes, ordersRes, balanceRes, ledgerRes, smartlinksRes] = await Promise.all([
        api.getSmmServices().catch(() => ({ services: [] })),
        api.getSmmOrders().catch(() => ({ orders: [] })),
        api.getWalletBalance().catch(() => null),
        api.getWalletLedger().catch(() => ({ ledger: [] })),
        api.getSmartLinks().catch(() => ({ smartlinks: [] })),
      ]);

      setServices(servicesRes.services || []);
      setOrders(ordersRes.orders || []);
      setSmartlinks(smartlinksRes.smartlinks || []);
      if (balanceRes?.balance?.availableBalance !== undefined) {
        setAvailableBalance(balanceRes.balance.availableBalance);
      }
      if (ledgerRes?.ledger) {
        setLedgerEntries(ledgerRes.ledger.filter((l: WalletLedgerEntry) => l.type === 'smm_purchase'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenOrder = (svc: SmmService) => {
    setSelectedService(svc);
    setIsOrderModalOpen(true);
  };

  const handleRecharge = async (amount: number = 100) => {
    setRecharging(true);
    try {
      const res = await api.rechargeWallet(amount);
      if (res?.balance?.availableBalance !== undefined) {
        setAvailableBalance(res.balance.availableBalance);
      }
      showToast(`¡Recarga exitosa! Se han añadido $${amount.toFixed(2)} USD a tu saldo.`);
      // Reload ledger
      api.getWalletLedger().then((lRes: { ledger: WalletLedgerEntry[] }) => {
        if (lRes?.ledger) {
          setLedgerEntries(lRes.ledger.filter((l: WalletLedgerEntry) => l.type === 'smm_purchase'));
        }
      });
    } catch (err: any) {
      showToast(err.message || 'Error al recargar saldo', 'error');
    } finally {
      setRecharging(false);
    }
  };

  const handleOrderSuccess = (newOrder: SmmOrder, newBal: number) => {
    setOrders((prev) => [newOrder, ...prev]);
    setAvailableBalance(newBal);
    setOrderSuccessMsg(
      `¡Pedido #${newOrder.orderNumber} procesado exitosamente! Se debitaron $${newOrder.totalCost.toFixed(
        2
      )} USD de tu saldo. Tu nuevo saldo disponible es de $${newBal.toFixed(2)} USD.`
    );
    setTimeout(() => setOrderSuccessMsg(null), 8000);
    // Reload ledger
    api.getWalletLedger().then((res: { ledger: WalletLedgerEntry[] }) => {
      if (res?.ledger) {
        setLedgerEntries(res.ledger.filter((l: WalletLedgerEntry) => l.type === 'smm_purchase'));
      }
    });
  };

  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(`https://sonora.link/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleConfirmDeleteSmartLink = async () => {
    if (!deletingSmartLink) return;
    try {
      await api.deleteSmartLink(deletingSmartLink.id);
      setSmartlinks((prev) => prev.filter((s) => s.id !== deletingSmartLink.id));
      showToast('SmartLink eliminado correctamente.');
      setDeletingSmartLink(null);
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar SmartLink', 'error');
    }
  };

  const handleSyncOrder = async (orderId: string) => {
    setSyncingOrderId(orderId);
    try {
      const res = await api.syncSmmOrder(orderId);
      if (res.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
        showToast(`Pedido #${res.order.orderNumber} sincronizado con éxito.`);
      }
    } catch (err: any) {
      showToast(err.message || 'Error al sincronizar con el panel SMM', 'error');
    } finally {
      setSyncingOrderId(null);
    }
  };

  // Filter services
  const filteredServices = services.filter((s) => {
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filter orders (Purchases History)
  const filteredOrders = orders.filter((o) => {
    const matchesCat = orderCategoryFilter === 'all' || o.serviceCategory === orderCategoryFilter;
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.serviceName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.targetLink.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (o.externalOrderId && o.externalOrderId.toLowerCase().includes(orderSearchQuery.toLowerCase()));
    return matchesCat && matchesStatus && matchesSearch;
  });

  const totalInvestedInOrders = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const latestOrder = orders.length > 0 ? orders[0] : null;

  const categories = [
    { id: 'all', label: 'Todos los Servicios', icon: ShoppingBag },
    { id: 'YouTube', label: 'YouTube / VEVO', icon: Film },
    { id: 'Spotify', label: 'Spotify Streams', icon: Music },
    { id: 'TikTok', label: 'TikTok Virales', icon: Share2 },
    { id: 'Instagram', label: 'Instagram Reels', icon: Heart },
    { id: 'Apple Music', label: 'Apple Music', icon: Radio },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completado
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            En Progreso
          </span>
        );
      case 'processing':
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Procesando
          </span>
        );
      case 'canceled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Tienda Oficial de Productos · Marketing Musical & SmartLinks</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Tienda de Productos & Promoción
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Impulsa tus reproducciones en <strong>Spotify</strong>, vistas en <strong>YouTube/VEVO</strong>,{' '}
              likes en <strong>TikTok</strong>, e interactúa con tus fans creando <strong>SmartLinks</strong> inteligentes de pre-guardado. Todas las compras de servicios promocionales se debitan en tiempo real de tu saldo disponible.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              onClick={() => {
                setEditingSmartLink(null);
                setIsSmartLinkModalOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs border border-indigo-400/40 transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Link2 className="w-4 h-4" />
              <span>Crear SmartLink</span>
            </button>

            {(role === 'admin' || role === 'super_admin') && (
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs border border-white/20 transition flex items-center gap-2 backdrop-blur-sm"
              >
                <Server className="w-4 h-4 text-indigo-300" />
                <span>Configuración Panel SMM</span>
              </button>
            )}
          </div>
        </div>

        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Wallet Balance & Debit Rules Indicator (KEY USER REQUIREMENT) */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tu Saldo Disponible para Compras
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Débito Instantáneo
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                ${availableBalance.toFixed(2)} USD
              </span>
              <span className="text-xs text-slate-500 font-medium">
                (Saldo en billetera de artista)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              💡 <em>Regla financiera:</em> Al comprar vistas o streams, el costo se deduce directamente de este saldo (ejemplo: si tienes $100.00 y compras $10.00 de vistas, quedarán $90.00).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            disabled={recharging}
            onClick={() => handleRecharge(100)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Recargar $100 USD de saldo para compras"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{recharging ? 'Recargando...' : '+ Recargar $100 USD'}</span>
          </button>
          {onNavigateToWallet && (
            <button
              type="button"
              onClick={onNavigateToWallet}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>Billetera</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {orderSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{orderSuccessMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeTab === 'catalog'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Catálogo de Servicios SMM</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
            {services.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('smartlinks')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeTab === 'smartlinks'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>SmartLinks & Pre-Save</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-mono font-bold">
            {smartlinks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeTab === 'orders'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Historial de Compras Realizadas</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono font-bold">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeTab === 'ledger'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Débitos en Billetera (Ledger)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
            {ledgerEntries.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SMM Services Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Categories Pill Bar */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar servicio por nombre, plataforma o tipo (vistas, streams, likes, seguidores)..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
              Cargando catálogo SMM...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
              No se encontraron servicios de promoción para los filtros aplicados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    {/* Top badges */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                        {svc.category}
                      </span>

                      {svc.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {svc.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-slate-900 text-sm leading-snug">
                      {svc.name}
                    </h3>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {svc.description}
                    </p>

                    {/* Features & Specs */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">Tarifa por 1,000 un.:</span>
                        <strong className="font-mono text-sm font-black text-indigo-700">
                          ${svc.ratePer1000.toFixed(2)} USD
                        </strong>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">Velocidad:</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          {svc.averageSpeed}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">Garantía / Reposición:</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          {svc.guaranteeDays} días
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenOrder(svc)}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Comprar Promoción</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recent Purchases Quick Preview within Store View */}
          {orders.length > 0 && (
            <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-xs">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      Historial de Compras Recientes
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono font-bold">
                      {orders.length} compra{orders.length !== 1 ? 's' : ''} registrada{orders.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 text-sm mt-0.5">
                    Últimas Compras Realizadas en Tienda SMM
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Visualiza el producto, el costo y el saldo descontado a tu cuenta tras cada compra.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 text-xs shadow-xs self-start sm:self-center shrink-0"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Ver Historial Completo ({orders.length})</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-3">Pedido # & Fecha</th>
                      <th className="p-3">Producto / Servicio</th>
                      <th className="p-3">Costo de Compra</th>
                      <th className="p-3">Saldo Descontado al Artista</th>
                      <th className="p-3">Saldo tras Transacción</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {orders.slice(0, 3).map((o) => {
                      const balanceBefore = o.balanceBefore !== undefined ? o.balanceBefore : (o.totalCost + (o.balanceAfter || availableBalance));
                      const balanceAfter = o.balanceAfter !== undefined ? o.balanceAfter : availableBalance;
                      const deductedAmount = o.deductedAmount !== undefined ? o.deductedAmount : o.totalCost;

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3 font-mono font-bold text-slate-800">
                            <span>{o.orderNumber}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {new Date(o.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </td>

                          <td className="p-3 max-w-xs">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                {o.serviceCategory}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 font-bold">
                                {o.quantity.toLocaleString('es-ES')} un.
                              </span>
                            </div>
                            <span className="font-bold text-slate-900 block truncate text-xs">{o.serviceName}</span>
                            <a
                              href={o.targetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 truncate mt-0.5"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{o.targetLink}</span>
                            </a>
                          </td>

                          <td className="p-3 font-mono">
                            <span className="font-black text-slate-900 text-xs block">
                              ${o.totalCost.toFixed(2)} USD
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Tarifa por pedido
                            </span>
                          </td>

                          <td className="p-3 font-mono">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs">
                              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                              <span>-${deductedAmount.toFixed(2)} USD</span>
                            </div>
                            <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                              Debitado de billetera
                            </span>
                          </td>

                          <td className="p-3 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 text-[10px]">Previo: ${balanceBefore.toFixed(2)}</span>
                              <span className="text-slate-400">➔</span>
                              <span className="font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-xs">
                                ${balanceAfter.toFixed(2)} USD
                              </span>
                            </div>
                            <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                              Saldo resultante
                            </span>
                          </td>

                          <td className="p-3">{getStatusBadge(o.status)}</td>

                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingReceiptOrder(o)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                              title="Ver Comprobante de Compra"
                            >
                              <Receipt className="w-3 h-3 text-indigo-600" />
                              <span>Recibo</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: SmartLinks & Pre-Save */}
      {activeTab === 'smartlinks' && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] uppercase tracking-wider">
                  Landing Pages de Lanzamiento
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {smartlinks.length} enlaces activos
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-1">
                SmartLinks & Campañas de Pre-Save
              </h3>
              <p className="text-xs text-slate-500 max-w-xl mt-0.5">
                Crea una sola URL inteligente que redirige a tus seguidores a Spotify, Apple Music, YouTube Music, Deezer y registra pre-guardados previos al estreno.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingSmartLink(null);
                setIsSmartLinkModalOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo SmartLink</span>
            </button>
          </div>

          {smartlinks.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Link2 className="w-7 h-7" />
              </div>
              <h4 className="font-black text-slate-800 text-base">Aún no has creado SmartLinks</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Genera tu primera página inteligente para promocionar en Instagram Bio, TikTok, YouTube o compartir en grupos y medios.
              </p>
              <button
                onClick={() => {
                  setEditingSmartLink(null);
                  setIsSmartLinkModalOpen(true);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs inline-flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Crear mi Primer SmartLink</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {smartlinks.map((link) => {
                const fullUrl = `https://sonora.link/${link.slug}`;
                const isCopied = copiedSlug === link.slug;

                return (
                  <div
                    key={link.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition gap-4"
                  >
                    <div className="flex gap-4">
                      {/* Cover image */}
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 group">
                        <img
                          src={link.coverUrl}
                          alt={link.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        {link.isPreSave && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase shadow">
                            Pre-Save
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                            {link.releaseType}
                          </span>
                          {link.releaseDate && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {link.releaseDate}
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-slate-900 text-sm truncate">{link.title}</h4>
                        <p className="text-xs font-semibold text-slate-500 truncate">{link.artistName}</p>

                        {/* URL badge with copy */}
                        <div className="pt-1 flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-indigo-600 font-mono text-[11px] font-bold truncate max-w-[200px]">
                            sonora.link/{link.slug}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopySlug(link.slug)}
                            title="Copiar Enlace"
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition text-[11px] font-bold flex items-center gap-1 shrink-0"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Connected Platforms Bar */}
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {link.platforms.filter((p) => p.active).map((p) => (
                          <span
                            key={p.id}
                            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[10px]"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Analytics KPIs */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-bold">Visitas</span>
                        <span className="font-mono font-black text-slate-800 text-sm">
                          {link.totalVisits ?? link.analytics?.totalVisits ?? 0}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-bold">Clics DSP</span>
                        <span className="font-mono font-black text-indigo-600 text-sm">
                          {link.totalClicks ?? link.analytics?.totalClicks ?? 0}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-bold">Pre-Saves</span>
                        <span className="font-mono font-black text-emerald-600 text-sm">
                          {link.preSavesCount ?? link.analytics?.preSavesCount ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewLandingLink(link)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Landing Fan</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSmartLink(link);
                            setIsSmartLinkModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSmartLink(link)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Eliminar SmartLink"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Orders List (HISTORIAL DE COMPRAS REALIZADAS) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Top KPI Cards for Purchases */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Invertido
                </span>
                <span className="font-mono font-black text-slate-900 text-lg">
                  ${totalInvestedInOrders.toFixed(2)} USD
                </span>
                <span className="text-[10px] text-slate-500 block">Debitado en promociones</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Compras Realizadas
                </span>
                <span className="font-mono font-black text-slate-900 text-lg">
                  {orders.length} pedido{orders.length !== 1 ? 's' : ''}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block">
                  {orders.filter((o) => o.status === 'completed').length} completados
                </span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Saldo Billetera Actual
                </span>
                <span className="font-mono font-black text-emerald-600 text-lg">
                  ${availableBalance.toFixed(2)} USD
                </span>
                <span className="text-[10px] text-slate-500 block">Disponible para compras</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Última Compra
                </span>
                <span className="font-mono font-black text-slate-900 text-sm truncate block">
                  {latestOrder ? latestOrder.orderNumber : 'Sin compras'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {latestOrder ? `-$${latestOrder.totalCost.toFixed(2)} USD` : 'Ninguna'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Purchases Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            {/* Header & Controls */}
            <div className="p-5 bg-slate-50/80 border-b border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      Historial de Compras Realizadas
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {filteredOrders.length} de {orders.length} pedidos
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mt-0.5">
                    Historial de Compras & Débito en Billetera
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Registro detallado de los productos promocionales adquiridos, su costo y el saldo descontado a tu cuenta tras la transacción.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={loadData}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-1.5 text-xs transition shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>

              {/* Filters toolbar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Buscar por pedido #, producto o URL..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category filter */}
                <select
                  value={orderCategoryFilter}
                  onChange={(e) => setOrderCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todas las plataformas / categorías</option>
                  <option value="YouTube">YouTube / VEVO</option>
                  <option value="Spotify">Spotify</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Apple Music">Apple Music</option>
                </select>

                {/* Status filter */}
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todos los estados de entrega</option>
                  <option value="completed">Completados</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="processing">Procesando</option>
                  <option value="canceled">Cancelados</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {orders.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 text-sm">Aún no has realizado compras de promoción</p>
                  <p className="text-slate-400 text-xs max-w-md mx-auto">
                    Explora el catálogo de la tienda SMM y adquiere reproducciones, vistas o pre-saves. Cada compra se descontará automáticamente de tu saldo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-xs inline-flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Explorar Catálogo</span>
                </button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="font-bold text-slate-700">No hay compras que coincidan con los filtros</p>
                <p className="text-slate-400 text-xs">Intenta modificar la búsqueda o los filtros de plataforma.</p>
                <button
                  type="button"
                  onClick={() => {
                    setOrderSearchQuery('');
                    setOrderCategoryFilter('all');
                    setOrderStatusFilter('all');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/90 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-3.5">Pedido # & Fecha</th>
                      <th className="p-3.5">Producto / Servicio Adquirido</th>
                      <th className="p-3.5">Costo de Compra</th>
                      <th className="p-3.5">Saldo Descontado al Artista</th>
                      <th className="p-3.5">Saldo tras Transacción</th>
                      <th className="p-3.5">Estado & Entrega</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredOrders.map((o) => {
                      const balanceBefore = o.balanceBefore !== undefined ? o.balanceBefore : (o.totalCost + (o.balanceAfter || availableBalance));
                      const balanceAfter = o.balanceAfter !== undefined ? o.balanceAfter : availableBalance;
                      const deductedAmount = o.deductedAmount !== undefined ? o.deductedAmount : o.totalCost;

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/70 transition">
                          {/* Order Number & Date */}
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-slate-900 block text-xs">
                              {o.orderNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans block">
                              {new Date(o.createdAt).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>

                          {/* Product / Service Details */}
                          <td className="p-3.5 max-w-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                {o.serviceCategory}
                              </span>
                              <span className="text-[10px] font-mono text-slate-600 font-bold">
                                {o.quantity.toLocaleString('es-ES')} un.
                              </span>
                            </div>
                            <span className="font-bold text-slate-900 block truncate text-xs">
                              {o.serviceName}
                            </span>
                            <a
                              href={o.targetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 truncate mt-0.5"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{o.targetLink}</span>
                            </a>
                          </td>

                          {/* Cost */}
                          <td className="p-3.5 font-mono">
                            <span className="font-black text-slate-900 text-sm block">
                              ${o.totalCost.toFixed(2)} USD
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Tarifa total
                            </span>
                          </td>

                          {/* Deducted Balance (KEY USER REQUIREMENT) */}
                          <td className="p-3.5 font-mono">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs">
                              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                              <span>-${deductedAmount.toFixed(2)} USD</span>
                            </div>
                            <span className="block text-[10px] text-emerald-600 font-bold mt-0.5 font-sans">
                              Debitado de saldo artista
                            </span>
                          </td>

                          {/* Balance after transaction (KEY USER REQUIREMENT) */}
                          <td className="p-3.5">
                            <div className="p-2 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1 font-mono text-[11px] max-w-[190px]">
                              <div className="flex items-center justify-between text-slate-500">
                                <span className="text-[10px]">Saldo Previo:</span>
                                <span>${balanceBefore.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                                <span className="text-[10px] text-slate-600 font-sans">Tras compra:</span>
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-xs">
                                  ${balanceAfter.toFixed(2)} USD
                                </span>
                              </div>
                            </div>
                            <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                              Saldo remanente disponible
                            </span>
                          </td>

                          {/* Status & Delivery */}
                          <td className="p-3.5 space-y-1">
                            <div>{getStatusBadge(o.status)}</div>
                            {o.externalOrderId && (
                              <span className="font-mono text-[10px] text-slate-500 block truncate">
                                ID: {o.externalOrderId}
                              </span>
                            )}
                            {o.startCount !== undefined && (
                              <span className="text-[10px] text-slate-400 block">
                                Conteo inicial: {o.startCount.toLocaleString()}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingReceiptOrder(o)}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1"
                                title="Ver Comprobante Oficial de Compra"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Comprobante</span>
                              </button>

                              <button
                                type="button"
                                disabled={syncingOrderId === o.id}
                                onClick={() => handleSyncOrder(o.id)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition"
                                title="Sincronizar estado con panel SMM"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${syncingOrderId === o.id ? 'animate-spin' : ''}`} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Ledger Transactions View (EXPLICIT FINANCIAL INTEGRITY AUDIT) */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-black text-slate-900 text-sm">Registro Contable de Débitos (Ledger)</h3>
            <p className="text-[11px] text-slate-500">
              Cada compra en la tienda SMM genera un movimiento financiero inmutable que registra el saldo antes y después.
            </p>
          </div>

          {ledgerEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No hay movimientos contables de compras SMM registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3">Nº Transacción</th>
                    <th className="p-3">Detalle / Pedido</th>
                    <th className="p-3">Saldo Anterior</th>
                    <th className="p-3">Monto Debitado</th>
                    <th className="p-3">Saldo Resultante</th>
                    <th className="p-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium font-mono text-xs">
                  {ledgerEntries.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-bold text-slate-800">{l.transactionNumber}</td>
                      <td className="p-3 font-sans max-w-sm">
                        <span className="font-bold text-slate-800 block">{l.typeLabel}</span>
                        <span className="text-[11px] text-slate-500 block truncate">{l.description}</span>
                      </td>
                      <td className="p-3 text-slate-600">${l.balanceBefore.toFixed(2)} USD</td>
                      <td className="p-3 font-black text-rose-600">
                        {l.amount.toFixed(2)} USD
                      </td>
                      <td className="p-3 font-black text-emerald-600">
                        ${l.balanceAfter.toFixed(2)} USD
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] font-sans">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SMM Order Modal */}
      {isOrderModalOpen && selectedService && (
        <SmmOrderModal
          isOpen={isOrderModalOpen}
          service={selectedService}
          onClose={() => setIsOrderModalOpen(false)}
          onSuccess={handleOrderSuccess}
          currentUser={currentUser}
          availableBalance={availableBalance}
          releases={releases}
          videos={videos}
          onNavigateToWallet={onNavigateToWallet}
        />
      )}

      {/* SMM Admin Config Modal */}
      {isConfigModalOpen && (
        <SmmConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onSaved={() => {
            loadData();
          }}
        />
      )}

      {/* SmartLink Create & Edit Modal */}
      {isSmartLinkModalOpen && (
        <SmartLinkModal
          isOpen={isSmartLinkModalOpen}
          onClose={() => {
            setIsSmartLinkModalOpen(false);
            setEditingSmartLink(null);
          }}
          onSuccess={(savedLink) => {
            setSmartlinks((prev) => {
              const exists = prev.some((l) => l.id === savedLink.id);
              if (exists) {
                return prev.map((l) => (l.id === savedLink.id ? savedLink : l));
              }
              return [savedLink, ...prev];
            });
            setActiveTab('smartlinks');
          }}
          currentUser={currentUser}
          releases={releases}
          videos={videos}
          initialSmartLink={editingSmartLink}
        />
      )}

      {/* SmartLink Fan Landing Preview Modal */}
      {previewLandingLink && (
        <SmartLinkLandingModal
          smartlink={previewLandingLink}
          onClose={() => setPreviewLandingLink(null)}
        />
      )}

      {/* SMM Purchase Receipt Modal */}
      {viewingReceiptOrder && (
        <SmmReceiptModal
          isOpen={!!viewingReceiptOrder}
          order={viewingReceiptOrder}
          currentUser={currentUser}
          onClose={() => setViewingReceiptOrder(null)}
        />
      )}

      {/* Delete SmartLink Confirmation Modal (Replaces browser confirm) */}
      {deletingSmartLink && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-slate-900 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">¿Eliminar SmartLink?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Estás a punto de eliminar la página inteligente para <strong>"{deletingSmartLink.title}"</strong> (sonora.link/{deletingSmartLink.slug}). Los enlaces compartidos dejarán de redirigir a las tiendas.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSmartLink(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSmartLink}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Eliminar SmartLink
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-700/50 text-emerald-200'
              : 'bg-rose-950 border-rose-700/50 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
};
