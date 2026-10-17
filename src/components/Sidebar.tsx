import React from 'react';
import { Role } from '../types.js';
import {
  LayoutDashboard,
  Clock,
  Disc,
  Radio,
  Key,
  Users,
  DollarSign,
  Settings,
  ShieldCheck,
  Music,
  BarChart3,
  UserCheck,
  PlusCircle,
  History,
  MessageSquare,
  TrendingUp,
  Video,
  ShoppingBag,
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'qc-queue'
  | 'releases'
  | 'new-release'
  | 'video-distribution'
  | 'smm-store'
  | 'performance-analytics'
  | 'messages'
  | 'royalties'
  | 'providers'
  | 'api-keys'
  | 'users'
  | 'platform-settings'
  | 'audit-logs';

interface Props {
  role: Role;
  activeSection: NavSection;
  pendingQcCount: number;
  onSelectSection: (section: NavSection) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  role,
  activeSection,
  pendingQcCount,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
}) => {
  interface NavItem {
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
    roles: Role[];
  }

  const items: NavItem[] = [
    // Global & Artist
    {
      id: 'dashboard',
      label: role === 'artist' ? 'Panel de Artista' : 'Dashboard General',
      icon: LayoutDashboard,
      roles: ['super_admin', 'admin', 'artist'],
    },
    // QC Queue - Crucial for Admins and Super Admins
    {
      id: 'qc-queue',
      label: 'Cola de Revisión (QC)',
      icon: Clock,
      badge: pendingQcCount,
      badgeColor: 'bg-amber-500 text-white',
      roles: ['super_admin', 'admin'],
    },
    // Releases list
    {
      id: 'releases',
      label: role === 'artist' ? 'Sus Lanzamientos' : 'Catálogo de Música',
      icon: Disc,
      roles: ['super_admin', 'admin', 'artist'],
    },
    // Dedicated Video Distribution
    {
      id: 'video-distribution',
      label: 'Distribución de Videos',
      icon: Video,
      roles: ['super_admin', 'admin', 'artist'],
    },
    // Products & SMM Marketing Store
    {
      id: 'smm-store',
      label: 'Tienda de Productos',
      icon: ShoppingBag,
      roles: ['super_admin', 'admin', 'artist'],
    },
    // Performance Analytics
    {
      id: 'performance-analytics',
      label: 'Performance Analytics',
      icon: TrendingUp,
      roles: ['super_admin', 'admin', 'artist'],
    },
    // Create new release
    {
      id: 'new-release',
      label: role === 'artist' ? 'Crear Lanzamientos' : 'Crear Lanzamiento',
      icon: PlusCircle,
      roles: ['artist', 'super_admin', 'admin'],
    },
    // Messages & Announcements
    {
      id: 'messages',
      label: role === 'artist' ? 'Mensajes Recibidos' : 'Centro de Mensajes',
      icon: MessageSquare,
      roles: ['super_admin', 'admin', 'artist'],
    },
    // Royalties & Artist Balance
    {
      id: 'royalties',
      label: role === 'artist' ? 'Mi Saldo / Balance' : 'Saldos & Retiros de Artistas',
      icon: DollarSign,
      roles: ['super_admin', 'admin', 'artist'],
    },
    // Providers
    {
      id: 'providers',
      label: 'Proveedores & DSPs',
      icon: Radio,
      roles: ['super_admin', 'admin'],
    },
    // API & Integrations
    {
      id: 'api-keys',
      label: 'API & Integraciones',
      icon: Key,
      roles: ['super_admin'],
    },
    // Users Management
    {
      id: 'users',
      label: 'Gestión de Usuarios',
      icon: Users,
      roles: ['super_admin'],
    },
    // Platform Settings
    {
      id: 'platform-settings',
      label: 'Configuración SaaS',
      icon: Settings,
      roles: ['super_admin'],
    },
    // Audit & Security Logs
    {
      id: 'audit-logs',
      label: 'Auditoría & Seguridad',
      icon: History,
      roles: ['super_admin'],
    },
  ];

  const filteredItems = items.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 w-64 bg-slate-50 border-r border-slate-200 z-30 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Navegación
          </div>

          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-blue-600' : item.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Platform Plan Info */}
        <div className="p-4 border-t border-slate-200 bg-white m-3 rounded-2xl border">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-800">Plan Sonora Pro</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
              Activo
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-2">
            100% regalías retenidas • Distribución ilimitada
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full w-3/4" />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>Uso de APIs</span>
            <span>75% capacidad</span>
          </div>
        </div>
      </aside>
    </>
  );
};
