import React, { useState, useEffect } from 'react';
import {
  User,
  Release,
  DistributionProvider,
  ApiKey,
  ApiRequestLog,
  NotificationItem,
  PlatformSettings,
  RoyaltySummary,
  Role,
  VideoRelease,
} from './types.js';
import { api } from './lib/api.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar, NavSection } from './components/Sidebar.js';
import { DashboardView } from './components/DashboardView.js';
import { ReleasesList } from './components/ReleasesList.js';
import { ReleaseFormWizard } from './components/ReleaseFormWizard.js';
import { AdminReviewModal } from './components/AdminReviewModal.js';
import { ArtistReleaseDetailModal } from './components/ArtistReleaseDetailModal.js';
import { ProvidersManagement } from './components/ProvidersManagement.js';
import { ApiManagement } from './components/ApiManagement.js';
import { PlatformSettingsView } from './components/PlatformSettingsView.js';
import { UsersManagement } from './components/UsersManagement.js';
import { RoyaltiesView } from './components/RoyaltiesView.js';
import { VideoDistributionView } from './components/VideoDistributionView.js';
import { SmmStoreView } from './components/SmmStoreView.js';
import { PerformanceAnalyticsView } from './components/PerformanceAnalyticsView.js';
import { MessagesView } from './components/MessagesView.js';
import { AuditLogsView } from './components/AuditLogsView.js';
import { AuthModal } from './components/AuthModal.js';
import { EmailPreviewModal } from './components/EmailPreviewModal.js';
import { Menu, Disc, Shield, Loader2, Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  // Core Platform Data
  const [releases, setReleases] = useState<Release[]>([]);
  const [videos, setVideos] = useState<VideoRelease[]>([]);
  const [providers, setProviders] = useState<DistributionProvider[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiRequestLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Modals & Active Workspaces
  const [reviewingRelease, setReviewingRelease] = useState<Release | null>(null);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [emailPreviewNotification, setEmailPreviewNotification] = useState<NotificationItem | null>(null);

  // Context triggers for direct messaging and deposits
  const [messageContext, setMessageContext] = useState<{
    artistId?: string;
    artistName?: string;
    releaseId?: string;
    releaseTitle?: string;
  } | null>(null);

  const [depositContext, setDepositContext] = useState<{
    artistId?: string;
    artistName?: string;
    releaseId?: string;
    releaseTitle?: string;
  } | null>(null);

  // Parallel platform data fetching for authenticated user
  const loadUserData = async () => {
    try {
      const [relRes, provRes, setRes, notifRes, anRes, vidRes] = await Promise.all([
        api.getReleases(),
        api.getProviders(),
        api.getSettings(),
        api.getNotifications(),
        api.getAnalytics(),
        api.getVideos().catch(() => ({ videos: [] })),
      ]);

      setReleases(relRes.releases || []);
      setProviders(provRes.providers || []);
      setSettings(setRes.settings || null);
      setNotifications(notifRes.notifications || []);
      setUnreadCount(notifRes.unreadCount || 0);
      setAnalytics(anRes || null);
      setVideos(vidRes.videos || []);
    } catch (err) {
      console.error('Error cargando datos de plataforma:', err);
    }
  };

  // Initial Data Fetching (Strict: NO auto-login)
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const token = api.getToken();
      if (!token) {
        // No session token -> Stay in login screen
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const meRes = await api.getMe();
        if (meRes?.user) {
          setCurrentUser(meRes.user);
          await loadUserData();
        } else {
          api.clearToken();
          setCurrentUser(null);
        }
      } catch {
        api.clearToken();
        setCurrentUser(null);
      }
    } catch (err) {
      api.clearToken();
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    setActiveSection('dashboard');
    setIsLoading(true);
    try {
      await loadUserData();
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch contextual section data when section changes
  useEffect(() => {
    if (activeSection === 'api-keys' && currentUser?.role === 'super_admin') {
      Promise.all([api.getApiKeys(), api.getApiLogs()]).then(([kRes, lRes]) => {
        setApiKeys(kRes.keys || []);
        setApiLogs(lRes.logs || []);
      });
    } else if (activeSection === 'audit-logs' && currentUser?.role === 'super_admin') {
      api.getAuditLogs().then((res) => setAuditLogs(res.logs || []));
    }
  }, [activeSection, currentUser]);

  // Refresh release list
  const reloadReleases = async () => {
    const res = await api.getReleases();
    setReleases(res.releases || []);
    // Also refresh notifications
    const nRes = await api.getNotifications();
    setNotifications(nRes.notifications || []);
    setUnreadCount(nRes.unreadCount || 0);
    // And refresh videos
    api.getVideos().then((vRes) => setVideos(vRes.videos || [])).catch(() => {});
  };

  const reloadVideos = async () => {
    try {
      const vRes = await api.getVideos();
      setVideos(vRes.videos || []);
    } catch {
      // ignore
    }
  };

  // Strict RBAC protection: ensure artists cannot navigate into non-permitted sections
  useEffect(() => {
    const artistAllowedSections: NavSection[] = [
      'dashboard',
      'releases',
      'new-release',
      'video-distribution',
      'smm-store',
      'performance-analytics',
      'messages',
      'royalties',
    ];
    if (currentUser?.role === 'artist' && !artistAllowedSections.includes(activeSection)) {
      setActiveSection('dashboard');
    }
  }, [currentUser?.role, activeSection]);

  // Role Switcher Handler (Fast prototype testing between Super Admin, Admin, and Artist)
  const handleSwitchRole = async (newRole: Role) => {
    setIsLoading(true);
    try {
      const res = await api.switchDemoRole(newRole);
      setCurrentUser(res.user);
      // Reset view to dashboard
      setActiveSection('dashboard');
      await reloadReleases();
    } catch (err) {
      console.error('Error cambiando rol:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Admin QC Actions
  const handleApproveRelease = async (id: string, providerId: string, notes: string) => {
    await api.approveRelease(id, providerId, notes);
    await reloadReleases();
    setReviewingRelease(null);
  };

  const handleRejectRelease = async (id: string, reason: string) => {
    await api.rejectRelease(id, reason);
    await reloadReleases();
    setReviewingRelease(null);
  };

  const handleRequestChanges = async (id: string, items: string[], notes: string) => {
    await api.requestChanges(id, items, notes);
    await reloadReleases();
    setReviewingRelease(null);
  };

  const handleAdminEdit = async (id: string, updates: Partial<Release>) => {
    const res = await api.adminEditRelease(id, updates);
    await reloadReleases();
    setReviewingRelease(res.release);
  };

  const handleSimulateWebhook = async (id: string, event: 'distributed' | 'published' | 'takedown') => {
    const res = await api.simulateDspWebhook(id, event);
    await reloadReleases();
    setReviewingRelease(res.release);
  };

  // Release Creation / Draft Flow
  const handleSaveDraft = async (payload: Partial<Release>) => {
    if (editingRelease) {
      await api.updateRelease(editingRelease.id, payload);
    } else {
      await api.createRelease(payload);
    }
    await reloadReleases();
    setActiveSection('releases');
    setEditingRelease(null);
  };

  const handleSubmitForReview = async (releaseId: string) => {
    await api.submitRelease(releaseId);
    await reloadReleases();
    setActiveSection('releases');
    setEditingRelease(null);
  };

  const handleSingleSubmit = async (releaseId: string) => {
    await api.submitRelease(releaseId);
    await reloadReleases();
  };

  // Providers Management
  const handleTestPing = async (id: string) => {
    return api.testProviderPing(id);
  };

  const handleCreateProvider = async (provider: Partial<DistributionProvider>) => {
    await api.createProvider(provider);
    const res = await api.getProviders();
    setProviders(res.providers || []);
  };

  const handleUpdateProvider = async (id: string, updates: Partial<DistributionProvider>) => {
    await api.updateProvider(id, updates);
    const res = await api.getProviders();
    setProviders(res.providers || []);
  };

  // API Management
  const handleCreateApiKey = async (name: string, permissions: string[], rateLimit: number) => {
    await api.createApiKey(name, permissions, rateLimit);
    const res = await api.getApiKeys();
    setApiKeys(res.keys || []);
  };

  const handleRevokeApiKey = async (id: string) => {
    await api.revokeApiKey(id);
    const res = await api.getApiKeys();
    setApiKeys(res.keys || []);
  };

  // Platform Settings
  const handleUpdateSettings = async (newSettings: Partial<PlatformSettings>) => {
    const res = await api.updateSettings(newSettings);
    setSettings(res.settings);
  };

  // User Management
  const [usersList, setUsersList] = useState<User[]>([]);
  useEffect(() => {
    if (activeSection === 'users' && currentUser?.role === 'super_admin') {
      api.getUsers().then((res) => setUsersList(res.users || []));
    }
  }, [activeSection, currentUser]);

  const handleCreateUser = async (data: { name: string; email: string; password: string; role: Role; stageName?: string }) => {
    await api.createUser(data);
    const res = await api.getUsers();
    setUsersList(res.users || []);
  };

  const handleUpdateUserRole = async (id: string, role: Role) => {
    await api.updateUser(id, { role });
    const res = await api.getUsers();
    setUsersList(res.users || []);
  };

  const handleSuspendUser = async (id: string) => {
    await api.suspendUser(id);
    const res = await api.getUsers();
    setUsersList(res.users || []);
  };

  // Notification actions
  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const pendingQcCount = releases.filter(
    (r) => r.status === 'submitted' || r.status === 'under_review'
  ).length;

  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center font-black animate-pulse shadow-xl shadow-emerald-900/30">
          <Disc className="w-7 h-7 text-white animate-spin" />
        </div>
        <p className="text-xs font-semibold tracking-wider text-slate-400">
          Cargando Plataforma Sonora...
        </p>
      </div>
    );
  }

  // If unauthenticated: render clean login form with email & password (no autologin)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <AuthModal
          isOpen={true}
          forced={true}
          onClose={() => {}}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        settings={settings}
        notifications={notifications}
        unreadNotificationsCount={unreadCount}
        onLogout={() => {
          api.clearToken();
          setCurrentUser(null);
          setIsAuthModalOpen(true);
        }}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onOpenEmailPreview={(notif) => setEmailPreviewNotification(notif)}
        onOpenNewRelease={() => {
          setEditingRelease(null);
          setActiveSection('new-release');
        }}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative">
        {/* Mobile menu toggle bar */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setSidebarOpenMobile(!sidebarOpenMobile)}
            className="w-12 h-12 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center border border-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar */}
        <Sidebar
          role={currentUser?.role || 'artist'}
          activeSection={activeSection}
          pendingQcCount={pendingQcCount}
          onSelectSection={(sec) => {
            setActiveSection(sec);
            if (sec !== 'new-release') setEditingRelease(null);
          }}
          isOpenMobile={sidebarOpenMobile}
          onCloseMobile={() => setSidebarOpenMobile(false)}
        />

        {/* Dynamic Section Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-5xl">
          {activeSection === 'dashboard' && (
            <DashboardView
              role={currentUser?.role || 'artist'}
              releases={releases}
              analytics={analytics}
              onOpenReview={(r) => setReviewingRelease(r)}
              onGoToQcQueue={() => setActiveSection('qc-queue')}
              onGoToNewRelease={() => {
                setEditingRelease(null);
                setActiveSection('new-release');
              }}
              onGoToPerformanceAnalytics={() => setActiveSection('performance-analytics')}
              onGoToRoyalties={() => setActiveSection('royalties')}
              onGoToVideos={() => setActiveSection('video-distribution')}
              onGoToSmmStore={() => setActiveSection('smm-store')}
            />
          )}

          {activeSection === 'qc-queue' && (
            <ReleasesList
              releases={releases}
              userRole={currentUser?.role || 'artist'}
              isQcQueueOnly={true}
              onOpenReview={(r) => setReviewingRelease(r)}
              onEditRelease={(r) => {
                setEditingRelease(r);
                setActiveSection('new-release');
              }}
              onSubmitRelease={handleSingleSubmit}
              onOpenNewRelease={() => {
                setEditingRelease(null);
                setActiveSection('new-release');
              }}
            />
          )}

          {activeSection === 'releases' && (
            <ReleasesList
              releases={releases}
              userRole={currentUser?.role || 'artist'}
              isQcQueueOnly={false}
              onOpenReview={(r) => setReviewingRelease(r)}
              onEditRelease={(r) => {
                setEditingRelease(r);
                setActiveSection('new-release');
              }}
              onSubmitRelease={handleSingleSubmit}
              onOpenNewRelease={() => {
                setEditingRelease(null);
                setActiveSection('new-release');
              }}
            />
          )}

          {activeSection === 'new-release' && (
            <ReleaseFormWizard
              initialRelease={editingRelease}
              onSaveDraft={handleSaveDraft}
              onSubmitForReview={handleSubmitForReview}
              onCancel={() => {
                setEditingRelease(null);
                setActiveSection('releases');
              }}
            />
          )}

          {activeSection === 'performance-analytics' && (
            <PerformanceAnalyticsView
              currentUser={currentUser}
              role={currentUser?.role || 'artist'}
              releases={releases}
            />
          )}

          {activeSection === 'video-distribution' && (
            <VideoDistributionView
              currentUser={currentUser}
              role={currentUser.role}
              onVideosChange={reloadVideos}
            />
          )}

          {activeSection === 'smm-store' && (
            <SmmStoreView
              currentUser={currentUser}
              role={currentUser.role}
              releases={releases}
              videos={videos}
              onNavigateToWallet={() => setActiveSection('royalties')}
            />
          )}

          {activeSection === 'providers' && (
            <ProvidersManagement
              providers={providers}
              onTestPing={handleTestPing}
              onCreateProvider={handleCreateProvider}
              onUpdateProvider={handleUpdateProvider}
            />
          )}

          {activeSection === 'api-keys' && (
            <ApiManagement
              apiKeys={apiKeys}
              apiLogs={apiLogs}
              onCreateKey={handleCreateApiKey}
              onRevokeKey={handleRevokeApiKey}
            />
          )}

          {activeSection === 'platform-settings' && settings && (
            <PlatformSettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeSection === 'users' && (
            <UsersManagement
              users={usersList}
              onCreateUser={handleCreateUser}
              onUpdateUserRole={handleUpdateUserRole}
              onSuspendUser={handleSuspendUser}
            />
          )}

          {activeSection === 'messages' && (
            <MessagesView
              currentUser={currentUser}
              usersList={usersList}
              releases={releases}
              initialRecipientId={messageContext?.artistId}
              initialRecipientName={messageContext?.artistName}
              initialReleaseId={messageContext?.releaseId}
              initialReleaseTitle={messageContext?.releaseTitle}
            />
          )}

          {activeSection === 'royalties' && (
            <RoyaltiesView
              currentUser={currentUser}
              royaltySummary={analytics?.artistRoyalty || null}
              usersList={usersList}
              releases={releases}
              onRefreshData={reloadReleases}
              initialDepositArtistId={depositContext?.artistId}
              initialDepositArtistName={depositContext?.artistName}
              initialDepositReleaseId={depositContext?.releaseId}
              initialDepositReleaseTitle={depositContext?.releaseTitle}
            />
          )}

          {activeSection === 'audit-logs' && (
            <AuditLogsView logs={auditLogs} />
          )}
        </main>
      </div>

      {/* Release Details / QC Inspector Modal */}
      {reviewingRelease && (
        currentUser?.role === 'artist' ? (
          <ArtistReleaseDetailModal
            release={reviewingRelease}
            providers={providers}
            onClose={() => setReviewingRelease(null)}
            onEditRelease={(release) => {
              setReviewingRelease(null);
              setEditingRelease(release);
              setActiveSection('new-release');
            }}
            onContactSupport={(release) => {
              setReviewingRelease(null);
              setMessageContext({
                artistId: 'super-admin-01',
                artistName: 'Super Administrador / Soporte',
                releaseId: release.id,
                releaseTitle: release.title,
              });
              setActiveSection('messages');
            }}
          />
        ) : (
          <AdminReviewModal
            release={reviewingRelease}
            providers={providers}
            onClose={() => setReviewingRelease(null)}
            onApprove={handleApproveRelease}
            onReject={handleRejectRelease}
            onRequestChanges={handleRequestChanges}
            onAdminEdit={handleAdminEdit}
            onSimulateWebhook={handleSimulateWebhook}
            onOpenMessage={(artistId, artistName, releaseId, releaseTitle) => {
              setReviewingRelease(null);
              setMessageContext({
                artistId,
                artistName,
                releaseId,
                releaseTitle,
              });
              setActiveSection('messages');
            }}
            onOpenDeposit={(artistId, artistName, releaseId, releaseTitle) => {
              setReviewingRelease(null);
              setDepositContext({
                artistId,
                artistName,
                releaseId,
                releaseTitle,
              });
              setActiveSection('royalties');
            }}
          />
        )
      )}

      {/* Auth Modal (when triggered while authenticated) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        forced={false}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Simulated Email Preview Modal */}
      <EmailPreviewModal
        notification={emailPreviewNotification}
        onClose={() => setEmailPreviewNotification(null)}
      />
    </div>
  );
}
