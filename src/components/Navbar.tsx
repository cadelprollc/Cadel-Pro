import React, { useState } from 'react';
import { User, NotificationItem, Role, PlatformSettings } from '../types.js';
import {
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Mail,
  Disc,
  Plus,
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  settings: PlatformSettings | null;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  onLogout: () => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onOpenEmailPreview: (notif: NotificationItem) => void;
  onOpenNewRelease: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  settings,
  notifications,
  unreadNotificationsCount,
  onLogout,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenEmailPreview,
  onOpenNewRelease,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleLabels: Record<Role, { label: string; badge: string }> = {
    super_admin: {
      label: 'Super Admin',
      badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    },
    admin: {
      label: 'Administrador (QC)',
      badge: 'bg-purple-50 text-purple-700 border border-purple-200',
    },
    artist: {
      label: 'Artista / Cliente',
      badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
  };

  const currentRoleInfo = currentUser ? roleLabels[currentUser.role] : roleLabels.artist;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-md shadow-slate-900/10">
            <Disc className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-slate-900">
                {settings?.platformName || 'SONORA'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                Distro SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Distribución Musical Digital Profesional & Liquidación de Regalías
            </p>
          </div>
        </div>

        {/* Right: Actions, Notifications, User Info & Logout */}
        <div className="flex items-center gap-3">
          {/* New Release Button */}
          {currentUser && (
            <button
              onClick={onOpenNewRelease}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Lanzamiento
            </button>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">Notificaciones</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                        {unreadNotificationsCount} nuevas
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onMarkAllNotificationsRead}
                    className="text-[11px] text-emerald-600 font-medium hover:underline"
                  >
                    Marcar leídas
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">No hay notificaciones</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs transition hover:bg-slate-50 ${
                          !n.read ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-900">{n.title}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">{n.message}</p>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/80">
                          {n.emailSent && (
                            <button
                              onClick={() => {
                                onOpenEmailPreview(n);
                                setShowNotifications(false);
                              }}
                              className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 hover:underline"
                            >
                              <Mail className="w-3 h-3" /> Ver Email Transaccional
                            </button>
                          )}
                          {!n.read && (
                            <button
                              onClick={() => onMarkNotificationRead(n.id)}
                              className="text-[10px] text-slate-500 hover:text-slate-700 ml-auto"
                            >
                              Marcar leída
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role info */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden border border-slate-200">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="hidden md:block text-left text-xs">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-900 leading-tight">
                        {currentUser.stageName || currentUser.name}
                      </p>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${currentRoleInfo.badge}`}>
                        {currentRoleInfo.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{currentUser.email}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                      {currentUser.stageName && (
                        <p className="text-[11px] font-semibold text-emerald-600">
                          Alias: {currentUser.stageName}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                      <div className="mt-2">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${currentRoleInfo.badge}`}>
                          {currentRoleInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className="px-2 py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Explicit Logout / Switch Account Button in Header */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 text-xs font-semibold transition"
                title="Cerrar sesión o cambiar de usuario"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <UserIcon className="w-4 h-4" />
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
