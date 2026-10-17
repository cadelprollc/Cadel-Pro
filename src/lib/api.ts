import {
  User,
  Release,
  DistributionProvider,
  ApiKey,
  ApiRequestLog,
  NotificationItem,
  PlatformSettings,
  RoyaltySummary,
  FileValidationResult,
  Role,
  DirectMessage,
  ManualRoyaltyTransaction,
  PayoutRequest,
  PayoutInvoice,
  ManualStreamReport,
  WalletLedgerEntry,
  SavedPaymentMethod,
  ArtistWalletSummary,
  PayoutStatus,
  VideoRelease,
  SmmService,
  SmmOrder,
  SmmPanelConfig,
  SmartLink,
} from '../types.js';

const TOKEN_KEY = 'sonora_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error en la petición al servidor');
    }

    return data as T;
  },

  // Auth endpoints
  async login(email: string, password: string, twoFactorCode?: string) {
    const res = await this.request<{ token?: string; user?: User; requiresTwoFactor?: boolean; message?: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, twoFactorCode }),
      }
    );
    if (res.token) this.setToken(res.token);
    return res;
  },

  async register(name: string, email: string, password: string, stageName?: string, role?: Role) {
    const res = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, stageName, role }),
    });
    if (res.token) this.setToken(res.token);
    return res;
  },

  async getMe() {
    return this.request<{ user: User }>('/api/auth/me');
  },

  async switchDemoRole(role: Role) {
    const res = await this.request<{ token: string; user: User }>('/api/auth/switch-demo-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    if (res.token) this.setToken(res.token);
    return res;
  },

  async forgotPassword(email: string) {
    return this.request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async toggle2FA() {
    return this.request<{ twoFactorEnabled: boolean; message: string }>('/api/auth/toggle-2fa', {
      method: 'POST',
    });
  },

  // Releases
  async getReleases(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return this.request<{ total: number; releases: Release[] }>(`/api/releases?${query.toString()}`);
  },

  async getRelease(id: string) {
    return this.request<{ release: Release }>(`/api/releases/${id}`);
  },

  async createRelease(payload: Partial<Release>) {
    return this.request<{ release: Release }>('/api/releases', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateRelease(id: string, payload: Partial<Release>) {
    return this.request<{ release: Release }>(`/api/releases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async submitRelease(id: string) {
    return this.request<{ success: boolean; message: string; release: Release }>(`/api/releases/${id}/submit`, {
      method: 'POST',
    });
  },

  // Admin QC review actions
  async startReview(id: string) {
    return this.request<{ release: Release }>(`/api/releases/${id}/review/start`, {
      method: 'POST',
    });
  },

  async approveRelease(id: string, providerId?: string, reviewNotes?: string) {
    return this.request<{ success: boolean; message: string; release: Release }>(`/api/releases/${id}/review/approve`, {
      method: 'POST',
      body: JSON.stringify({ providerId, reviewNotes }),
    });
  },

  async rejectRelease(id: string, reason: string) {
    return this.request<{ release: Release }>(`/api/releases/${id}/review/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async requestChanges(id: string, items: string[], notes?: string) {
    return this.request<{ release: Release }>(`/api/releases/${id}/review/request-changes`, {
      method: 'POST',
      body: JSON.stringify({ items, notes }),
    });
  },

  async adminEditRelease(id: string, updates: Partial<Release>) {
    return this.request<{ success: boolean; message: string; release: Release }>(`/api/releases/${id}/admin-edit`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async simulateDspWebhook(id: string, event: 'distributed' | 'published' | 'takedown') {
    return this.request<{ success: boolean; release: Release }>(`/api/releases/${id}/simulate-webhook`, {
      method: 'POST',
      body: JSON.stringify({ event }),
    });
  },

  // Providers
  async getProviders() {
    return this.request<{ providers: DistributionProvider[] }>('/api/providers');
  },

  async createProvider(provider: Partial<DistributionProvider>) {
    return this.request<{ provider: DistributionProvider }>('/api/providers', {
      method: 'POST',
      body: JSON.stringify(provider),
    });
  },

  async updateProvider(id: string, updates: Partial<DistributionProvider>) {
    return this.request<{ provider: DistributionProvider }>(`/api/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteProvider(id: string) {
    return this.request<{ success: boolean }>(`/api/providers/${id}`, {
      method: 'DELETE',
    });
  },

  async testProviderPing(id: string) {
    return this.request<{ status: string; httpStatus: number; latencyMs: number; message: string; capabilities: string[] }>(
      `/api/providers/${id}/test-ping`,
      { method: 'POST' }
    );
  },

  // API Keys
  async getApiKeys() {
    return this.request<{ keys: ApiKey[] }>('/api/api-keys');
  },

  async createApiKey(name: string, permissions: string[], rateLimitPerMinute: number) {
    return this.request<{ key: ApiKey; warning: string }>('/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, permissions, rateLimitPerMinute }),
    });
  },

  async revokeApiKey(id: string) {
    return this.request<{ success: boolean }>(`/api/api-keys/${id}`, {
      method: 'DELETE',
    });
  },

  async getApiLogs() {
    return this.request<{ logs: ApiRequestLog[] }>('/api/api-keys/logs');
  },

  // Users
  async getUsers() {
    return this.request<{ users: User[] }>('/api/users');
  },

  async createUser(user: { name: string; email: string; password: string; role: Role; stageName?: string }) {
    return this.request<{ user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  async updateUser(id: string, updates: Partial<User & { password?: string }>) {
    return this.request<{ user: User }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async suspendUser(id: string) {
    return this.request<{ success: boolean }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Platform Settings
  async getSettings() {
    return this.request<{ settings: PlatformSettings }>('/api/settings');
  },

  async updateSettings(settings: Partial<PlatformSettings>) {
    return this.request<{ settings: PlatformSettings; message: string }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Analytics
  async getAnalytics(params?: { artistId?: string; releaseId?: string; timeframe?: string }) {
    const query = new URLSearchParams();
    if (params?.artistId) query.append('artistId', params.artistId);
    if (params?.releaseId) query.append('releaseId', params.releaseId);
    if (params?.timeframe) query.append('timeframe', params.timeframe);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    return this.request<{
      kpis: any;
      artistRoyalty: RoyaltySummary;
      performanceTrend: Array<{
        period: string;
        month: string;
        streams: number;
        revenue: number;
        cumulativeRevenue: number;
        cumulativeStreams: number;
        spotify: number;
        appleMusic: number;
        youtube: number;
        amazon: number;
        tiktok: number;
        vevo: number;
        momGrowthStreams: number;
        momGrowthRevenue: number;
        rpm: number;
        listeners: number;
      }>;
      releasesPerformance: Array<{
        id: string;
        title: string;
        coverUrl: string;
        releaseType: string;
        status: string;
        releaseDate: string;
        totalStreams: number;
        monthlyStreams: number;
        revenue: number;
        growthMoM: number;
        topDsp: string;
      }>;
      territoryPerformance: Array<{
        country: string;
        code: string;
        flag: string;
        percentage: number;
        streams: number;
        revenue: number;
      }>;
      releaseStatusDistribution: Array<{ name: string; count: number; color: string }>;
      monthlyActivity: Array<{ month: string; releases: number; streams: number; revenue: number }>;
    }>(`/api/analytics${queryString}`);
  },

  // Notifications
  async getNotifications() {
    return this.request<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications');
  },

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  async markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    });
  },

  // Audit Logs
  async getAuditLogs(params?: { entity?: string; action?: string }) {
    const q = new URLSearchParams();
    if (params?.entity) q.append('entity', params.entity);
    if (params?.action) q.append('action', params.action);
    return this.request<{ logs: any[] }>(`/api/audit-logs?${q.toString()}`);
  },

  // Validation
  async validateCover(data: { fileName: string; width?: number; height?: number; fileSizeMB?: number; mimeType?: string }) {
    return this.request<{ result: FileValidationResult }>('/api/upload/validate-cover', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async validateAudio(data: { fileName: string; fileSizeMB?: number; mimeType?: string; duration?: number; sampleRate?: string; bitrate?: string }) {
    return this.request<{ result: FileValidationResult }>('/api/upload/validate-audio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Direct Messages & Comunicados
  async getMessages() {
    return this.request<{ messages: DirectMessage[]; unreadCount: number }>('/api/messages');
  },

  async sendMessage(data: {
    recipientId: string;
    recipientName?: string;
    subject: string;
    content?: string;
    body?: string;
    releaseId?: string;
    relatedReleaseId?: string;
    releaseTitle?: string;
    relatedReleaseTitle?: string;
    priority?: string;
  }) {
    const payload = {
      recipientId: data.recipientId,
      recipientName: data.recipientName,
      subject: data.subject,
      content: data.content || data.body || '',
      releaseId: data.releaseId || data.relatedReleaseId,
      releaseTitle: data.releaseTitle || data.relatedReleaseTitle,
      priority: data.priority,
    };
    return this.request<{ message: DirectMessage; success: boolean }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async markMessageRead(id: string) {
    return this.request<{ success: boolean; message: DirectMessage }>(`/api/messages/${id}/read`, {
      method: 'PUT',
    });
  },

  // Manual Royalty Deposits & Transactions
  async getRoyaltyTransactions() {
    return this.request<{ transactions: ManualRoyaltyTransaction[] }>('/api/royalties/transactions');
  },

  async depositRoyalty(data: {
    artistId: string;
    artistName?: string;
    releaseId?: string;
    releaseTitle?: string;
    trackTitle?: string;
    amount: number;
    currency?: string;
    sourceDsp: string;
    period: string;
    type?: string;
    notes?: string;
  }) {
    return this.request<{ success: boolean; transaction: ManualRoyaltyTransaction; updatedRoyalty: RoyaltySummary; message: string }>(
      '/api/royalties/deposit',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  // Manual Platform Streams
  async recordManualStreams(data: {
    artistId: string;
    period?: string;
    month?: string;
    year?: number;
    releaseId?: string;
    platformStreams: Array<{ platform: string; streams: number; ratePerStream?: number; estimatedEarnings?: number }>;
    notes?: string;
    creditEarnings?: boolean;
  }) {
    return this.request<{
      success: boolean;
      streamReport: ManualStreamReport;
      updatedRoyalty: RoyaltySummary;
      message: string;
    }>('/api/royalties/manual-streams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getStreamReports() {
    return this.request<{ reports: ManualStreamReport[] }>('/api/royalties/streams');
  },

  // Wallet & Financial Ledger
  async getWalletBalance() {
    return this.request<{
      balance: {
        availableBalance: number;
        pendingWithdrawals: number;
        paidOut: number;
        totalEarned: number;
        currency: string;
        pendingBalance: number;
      };
      royalty: RoyaltySummary;
    }>('/api/royalties/balance');
  },

  async rechargeWallet(amount: number = 100, currency: string = 'USD') {
    return this.request<{
      success: boolean;
      balance: {
        availableBalance: number;
        balanceBefore: number;
        added: number;
        currency: string;
      };
      ledgerEntry: WalletLedgerEntry;
      message: string;
    }>('/api/royalties/recharge', {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    });
  },

  async getWalletLedger(params?: { artistId?: string; type?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.artistId) query.append('artistId', params.artistId);
    if (params?.type && params.type !== 'all') query.append('type', params.type);
    if (params?.search) query.append('search', params.search);
    return this.request<{ ledger: WalletLedgerEntry[] }>(`/api/royalties/ledger?${query.toString()}`);
  },

  async getArtistsWalletSummary() {
    return this.request<{ artists: ArtistWalletSummary[] }>('/api/royalties/artists-summary');
  },

  async updatePayoutStatus(
    id: string,
    data: {
      status: PayoutStatus;
      note?: string;
      paymentReference?: string;
      rejectionReason?: string;
    }
  ) {
    return this.request<{
      success: boolean;
      payout: PayoutRequest;
      ledgerEntry?: WalletLedgerEntry;
      invoice?: PayoutInvoice;
      updatedRoyalty: RoyaltySummary;
      balance: {
        availableBalance: number;
        pendingWithdrawals: number;
        paidOut: number;
        totalEarned: number;
        currency: string;
      };
      message: string;
    }>(`/api/royalties/payouts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getSavedPaymentMethods() {
    return this.request<{ methods: SavedPaymentMethod[] }>('/api/royalties/payment-methods');
  },

  async savePaymentMethod(data: Partial<SavedPaymentMethod>) {
    return this.request<{ success: boolean; method: SavedPaymentMethod }>('/api/royalties/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deletePaymentMethod(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/royalties/payment-methods/${id}`, {
      method: 'DELETE',
    });
  },

  // Payout Requests & Invoices
  async requestPayout(data: {
    amount: number;
    currency?: string;
    paymentMethod: 'bank' | 'paypal';
    bankDetails?: {
      bankName: string;
      accountHolder: string;
      accountNumber: string;
      iban?: string;
      swift?: string;
      country: string;
    };
    paypalDetails?: {
      paypalEmail: string;
      accountHolder?: string;
    };
    notes?: string;
    savePaymentMethod?: boolean;
  }) {
    return this.request<{
      success: boolean;
      payout: PayoutRequest;
      ledgerEntry: WalletLedgerEntry;
      updatedRoyalty: RoyaltySummary;
      balance: {
        availableBalance: number;
        pendingWithdrawals: number;
        paidOut: number;
        totalEarned: number;
        currency: string;
      };
      message: string;
    }>('/api/royalties/request-payout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPayouts() {
    return this.request<{ payouts: PayoutRequest[] }>('/api/royalties/payouts');
  },

  // Music Video Distribution
  async getVideos() {
    return this.request<{ videos: VideoRelease[] }>('/api/videos');
  },

  async getVideo(id: string) {
    return this.request<{ video: VideoRelease }>(`/api/videos/${id}`);
  },

  async createVideo(data: Partial<VideoRelease>) {
    return this.request<{ video: VideoRelease }>('/api/videos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateVideo(id: string, data: Partial<VideoRelease>) {
    return this.request<{ video: VideoRelease }>(`/api/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateVideoStatus(id: string, status: string, reviewNotes?: string) {
    return this.request<{ video: VideoRelease }>(`/api/videos/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reviewNotes }),
    });
  },

  async deleteVideo(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/videos/${id}`, {
      method: 'DELETE',
    });
  },

  // SMM Marketing Store & Panel API
  async getSmmServices() {
    return this.request<{ services: SmmService[] }>('/api/smm/services');
  },

  async getSmmOrders() {
    return this.request<{ orders: SmmOrder[] }>('/api/smm/orders');
  },

  async createSmmOrder(data: { serviceId: string; targetLink: string; quantity: number }) {
    return this.request<{
      success: boolean;
      order: SmmOrder;
      ledgerEntry: WalletLedgerEntry;
      balance: {
        availableBalance: number;
        balanceBefore: number;
        deducted: number;
        currency: string;
      };
      message: string;
    }>('/api/smm/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async syncSmmOrder(id: string) {
    return this.request<{ success: boolean; order: SmmOrder }>(`/api/smm/orders/${id}/sync`, {
      method: 'POST',
    });
  },

  async getSmmConfig() {
    return this.request<{ config: SmmPanelConfig }>('/api/smm/config');
  },

  async updateSmmConfig(config: Partial<SmmPanelConfig>) {
    return this.request<{ success: boolean; config: SmmPanelConfig; message: string }>('/api/smm/config', {
      method: 'PATCH',
      body: JSON.stringify(config),
    });
  },

  async testSmmConnection(data?: { apiUrl?: string; apiKey?: string }) {
    return this.request<{
      success: boolean;
      connected: boolean;
      mode?: string;
      balance?: number;
      message: string;
      response?: any;
    }>('/api/smm/test-connection', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  // SmartLinks & Pre-Save
  async getSmartLinks() {
    return this.request<{ smartlinks: SmartLink[] }>('/api/smartlinks');
  },

  async getSmartLink(id: string) {
    return this.request<{ smartlink: SmartLink }>(`/api/smartlinks/${id}`);
  },

  async createSmartLink(data: Partial<SmartLink> & { customSlug?: string }) {
    return this.request<{ success: boolean; smartlink: SmartLink; message: string }>('/api/smartlinks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSmartLink(id: string, data: Partial<SmartLink> & { customSlug?: string }) {
    return this.request<{ success: boolean; smartlink: SmartLink; message: string }>(`/api/smartlinks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteSmartLink(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/smartlinks/${id}`, {
      method: 'DELETE',
    });
  },

  async clickSmartLink(id: string) {
    return this.request<{ success: boolean; totalClicks: number }>(`/api/smartlinks/${id}/click`, {
      method: 'POST',
    });
  },

  async presaveSmartLink(id: string, email?: string) {
    return this.request<{ success: boolean; preSavesCount: number; message: string }>(`/api/smartlinks/${id}/presave`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};
