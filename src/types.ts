export type Role = 'super_admin' | 'admin' | 'artist';

export type ReleaseStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'approved'
  | 'scheduled'
  | 'in_distribution'
  | 'distributed'
  | 'published'
  | 'rejected'
  | 'takedown';

export type ReleaseType = 'single' | 'ep' | 'album' | 'music_video';

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  current?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  isVerified: boolean;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
  sessions: UserSession[];
  stageName?: string;
}

export interface ArtistProfile {
  id: string;
  userId: string;
  stageName: string;
  legalName: string;
  spotifyId?: string;
  appleMusicId?: string;
  bio?: string;
  country: string;
  instagram?: string;
  website?: string;
  avatarUrl?: string;
  verified: boolean;
  totalReleases?: number;
}

export interface TrackContributor {
  name: string;
  role: 'composer' | 'lyricist' | 'producer' | 'mixer' | 'masterer' | 'featured_artist';
  ipiNumber?: string;
}

export interface Track {
  id: string;
  releaseId: string;
  trackNumber: number;
  discNumber: number;
  title: string;
  version?: string; // e.g. Radio Edit, Extended, Remix
  isrc: string;
  durationSeconds: number;
  explicit: boolean;
  previewStartTimeSeconds: number;
  audioUrl?: string;
  audioFileName?: string;
  audioFormat?: 'WAV' | 'FLAC' | 'MP3_320';
  audioBitrate?: string;
  audioSampleRate?: string;
  composers: string[];
  lyricists: string[];
  producers: string[];
  mixers: string[];
  masterers: string[];
  featuredArtists: string[];
  lyricsText?: string;
  lyricsSynced?: boolean;
  language: string;
}

export interface ReleaseAuditChange {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  previousStatus?: string;
  newStatus?: string;
  details?: string;
}

export interface DistributionLog {
  id: string;
  timestamp: string;
  providerId: string;
  providerName: string;
  status: 'pending' | 'delivered' | 'processing' | 'published' | 'failed';
  externalId?: string;
  message: string;
  detailsJson?: string;
}

export interface Release {
  id: string;
  userId: string;
  artistId: string;
  title: string;
  releaseType: ReleaseType;
  mainArtist: string;
  featuredArtists: string[];
  genre: string;
  subgenre: string;
  language: string;
  releaseDate: string;
  originalReleaseDate: string;
  label: string;
  catalogNumber: string;
  upc: string;
  pLine: string; // ℗ Phonographic copyright
  cLine: string; // © Copyright
  territories: 'worldwide' | string[];
  platforms: string[]; // Spotify, Apple Music, Deezer, etc.
  explicit: boolean;
  coverUrl: string;
  coverFileName?: string;
  coverDimensions?: { width: number; height: number };
  status: ReleaseStatus;
  reviewNotes?: string;
  changeRequestItems?: string[];
  rejectionReason?: string;
  assignedProviderId?: string | null;
  externalReleaseId?: string | null;
  createdAt: string;
  updatedAt: string;
  tracks: Track[];
  history: ReleaseAuditChange[];
  distributionLogs: DistributionLog[];
  videoDetails?: {
    isrcVideo?: string;
    videoIsrc?: string;
    videoType?: 'official_music_video' | 'lyric_video' | 'visualizer' | 'spotify_canvas';
    resolution?: '1080p' | '4K' | 'ProRes_422' | '1080p_FHD' | '4K_UHD' | '8K';
    videoResolution?: '1080p_FHD' | '4K_UHD' | '8K';
    vevoChannel?: string;
    cadelNetworkId?: string;
    director?: string;
    producer?: string;
    videoProducer?: string;
    videoPlatforms?: string[];
    videoDurationSeconds?: number;
    aspectRatio?: string;
    cleanVersionAvailable?: boolean;
  };
}

export interface VideoRelease {
  id: string;
  userId: string;
  artistId: string;
  title: string;
  artistName: string;
  featuredArtists: string[];
  director: string;
  videoProducer: string;
  isrc: string;
  upcLinked?: string;
  genre: string;
  explicit: boolean;
  videoType: 'official_music_video' | 'lyric_video' | 'visualizer' | 'live_session';
  resolution: '1080p_FHD' | '4K_UHD' | '8K';
  aspectRatio: '16:9' | '21:9' | '9:16';
  durationSeconds: number;
  videoUrl: string;
  videoFileName: string;
  videoFileSizeMB: number;
  thumbnailUrl: string;
  thumbnailFileName?: string;
  platforms: string[];
  vevoChannel?: string;
  releaseDate: string;
  status: ReleaseStatus;
  reviewNotes?: string;
  viewsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionProvider {
  id: string;
  name: string;
  code: string;
  endpoint: string;
  apiEndpoint?: string;
  apiKey?: string;
  apiKeyMasked: string;
  apiSecret?: string;
  status: 'active' | 'inactive' | 'sandbox';
  integrationType: 'REST_JSON' | 'DDEX_ERN_4' | 'CUSTOM_API';
  webhookUrl: string;
  supportedDsps?: string[];
  supportedDspCount: number;
  deliveryLatencyMinutes: number;
  description: string;
  lastSyncAt?: string;
}

export interface ApiKey {
  id: string;
  userId: string;
  userName: string;
  name: string;
  keyPrefix: string;
  prefix?: string;
  permissions: string[];
  rateLimitPerMinute: number;
  createdAt: string;
  lastUsedAt?: string;
  requestCount?: number;
  status: 'active' | 'revoked';
  fullSecretKey?: string; // only available when created
}

export interface ApiRequestLog {
  id: string;
  timestamp: string;
  apiKeyPrefix: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  responseTimeMs?: number;
  ip: string;
  ipAddress?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  read: boolean;
  createdAt: string;
  emailSent: boolean;
  emailSubject?: string;
  emailBodyPreview?: string;
}

export interface PlatformSettings {
  platformName: string;
  platformLogoText: string;
  primaryColor: string;
  accentColor: string;
  domain: string;
  contactEmail: string;
  supportPhone: string;
  commissionPercentage: number; // e.g. 15% platform takes, 85% to artist
  payoutThreshold: number; // e.g. $50
  defaultProviderId?: string;
  autoDistributeOnApproval: boolean;
  require2FAForAdmins: boolean;
  maxUploadAudioSizeMB: number;
  minCoverResolution: number;
  dpidPartyId?: string;
  defaultLabel?: string;
  defaultPLine?: string;
  defaultCLine?: string;
  isrcCountryCode?: string;
  isrcRegistrantCode?: string;
  defaultUpcPrefix?: string;
  currency?: string;
  plans: Array<{
    id: string;
    name: string;
    priceMonthly: number;
    artistCommission: number;
    releasesAllowed: string;
    features: string[];
  }>;
}

export interface RoyaltySummary {
  totalEarned: number;
  pendingBalance: number;
  availableBalance?: number;
  pendingWithdrawals?: number;
  paidOut: number;
  currency: string;
  totalStreams: number;
  monthlyStats: Array<{ month: string; earnings: number; streams: number }>;
  dspBreakdown: Array<{ name: string; percentage: number; amount: number; dsp?: string; revenue?: number; share?: number; streams?: number }>;
  topTracks: Array<{ title: string; streams: number; earnings: number; revenue?: number }>;
}

export type WalletLedgerType =
  | 'deposit'
  | 'withdrawal_hold'
  | 'withdrawal_paid'
  | 'withdrawal_refund'
  | 'adjustment'
  | 'smm_purchase';

export interface SmmService {
  id: string;
  smmServiceId: number;
  name: string;
  category: 'YouTube' | 'Spotify' | 'TikTok' | 'Instagram' | 'Apple Music' | 'SoundCloud';
  type: 'views' | 'likes' | 'subscribers' | 'streams' | 'monthly_listeners' | 'saves' | 'followers' | 'comments';
  ratePer1000: number; // USD per 1000 units
  minQuantity: number;
  maxQuantity: number;
  averageSpeed: string;
  guaranteeDays: number;
  description: string;
  badge?: string;
  active: boolean;
}

export interface SmmOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  targetLink: string;
  quantity: number;
  totalCost: number;
  currency: string;
  status: 'pending' | 'processing' | 'in_progress' | 'completed' | 'partial' | 'canceled';
  startCount?: number;
  remains?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  deductedAmount?: number;
  externalOrderId?: string;
  smmApiEndpoint?: string;
  smmStatusResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmmPanelConfig {
  apiUrl: string;
  apiKeyMasked: string;
  apiKey?: string;
  apiMode: 'live' | 'simulation';
  providerName: string;
  providerBalance: number;
  profitMarginPercent: number;
  autoFulfill: boolean;
}

export interface SmartLinkPlatform {
  id: string;
  name: string;
  url: string;
  actionText: string;
  iconKey: string;
  active: boolean;
}

export interface SmartLink {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  releaseId?: string;
  releaseType: 'single' | 'ep' | 'album' | 'music_video';
  coverUrl: string;
  description?: string;
  releaseDate?: string;
  isPreSave: boolean;
  audioPreviewUrl?: string;
  videoPreviewUrl?: string;
  platforms: SmartLinkPlatform[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
  };
  customDomain?: string;
  themeColor?: string;
  totalVisits: number;
  totalClicks: number;
  preSavesCount: number;
  analytics?: {
    totalVisits?: number;
    totalClicks?: number;
    preSavesCount?: number;
  };
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletLedgerEntry {
  id: string; // e.g. TX-1727000...
  transactionNumber: string; // e.g. MOV-2026-0042
  userId: string;
  userName: string;
  userRole?: Role | string;
  type: WalletLedgerType;
  typeLabel: string;
  description: string;
  amount: number; // Positive (+100) for deposits/refunds, negative (-100) for withdrawal holds
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  status: 'completed' | 'pending' | 'cancelled' | 'rejected';
  payoutRequestId?: string;
  reference?: string;
  performedByUserId: string;
  performedByName: string;
  performedByRole: Role | string;
  createdAt: string;
}

export interface SavedPaymentMethod {
  id: string;
  userId: string;
  type: 'bank' | 'paypal';
  label: string;
  isDefault?: boolean;
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
  createdAt: string;
}

export interface ArtistWalletSummary {
  userId: string;
  userName: string;
  stageName?: string;
  email: string;
  avatarUrl?: string;
  availableBalance: number;
  pendingWithdrawals: number;
  paidOut: number;
  totalEarned: number;
  currency: string;
  pendingRequestsCount: number;
  lastMovementAt?: string;
}

export type PayoutStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'paid'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface PayoutStatusLog {
  status: PayoutStatus;
  changedAt: string;
  changedByName: string;
  changedByRole: Role | string;
  note?: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  recipientId: string; // 'all' or user ID
  recipientName: string;
  subject: string;
  content: string;
  body?: string;
  releaseId?: string;
  releaseTitle?: string;
  relatedReleaseId?: string;
  relatedReleaseTitle?: string;
  isRead: boolean;
  read?: boolean;
  priority: 'normal' | 'urgent' | 'important';
  createdAt: string;
}

export interface ManualRoyaltyTransaction {
  id: string;
  artistId: string;
  artistName: string;
  releaseId?: string;
  releaseTitle?: string;
  trackId?: string;
  trackTitle?: string;
  amount: number;
  currency: string;
  sourceDsp: string; // e.g. Spotify, Apple Music, Sello / Anticipo, YouTube Content ID
  period: string; // e.g. "Agosto 2026", "Q3 2026"
  type: 'deposit' | 'advance' | 'bonus' | 'adjustment';
  notes: string;
  recordedByAdminName: string;
  createdAt: string;
}

export interface DspStoreInfo {
  id: string;
  name: string;
  category: 'Global Streaming' | 'Redes Sociales & Video' | 'Música Electrónica & DJ' | 'Regional & Emergente' | 'Radio & Discovery' | 'Video Musical & Visual';
  description: string;
  iconBg: string;
  territories: string;
}

export const EXTENDED_DSP_STORES: DspStoreInfo[] = [
  // Video Distribution Networks
  { id: 'vevo', name: 'Vevo', category: 'Video Musical & Visual', description: 'Canal oficial Vevo y red de distribución global en YouTube Vevo', iconBg: 'bg-red-600', territories: 'Global (Red Vevo / YouTube)' },
  { id: 'cadel_pro_network', name: 'Cadel Pro Network', category: 'Video Musical & Visual', description: 'Red premium y syndication de videos musicales Cadel Pro', iconBg: 'bg-emerald-600', territories: 'Global (Cadel Pro TV & Web)' },
  { id: 'apple_music_video', name: 'Apple Music Video', category: 'Video Musical & Visual', description: 'Distribución de videos musicales oficiales en HD/4K en Apple Music', iconBg: 'bg-rose-600', territories: 'Global (167 países)' },
  { id: 'spotify_video', name: 'Spotify Video & Canvas', category: 'Video Musical & Visual', description: 'Videos oficiales y bucles verticales Canvas interactivos para Spotify', iconBg: 'bg-emerald-500', territories: 'Global (180+ países)' },

  { id: 'spotify', name: 'Spotify', category: 'Global Streaming', description: 'Líder global con más de 600M de oyentes', iconBg: 'bg-emerald-500', territories: 'Global (180+ países)' },
  { id: 'apple_music', name: 'Apple Music', category: 'Global Streaming', description: 'Audio espacial y streaming lossless en 167 países', iconBg: 'bg-rose-500', territories: 'Global (167 países)' },
  { id: 'amazon_music', name: 'Amazon Music', category: 'Global Streaming', description: 'Integración completa con dispositivos Alexa y Prime', iconBg: 'bg-cyan-600', territories: 'Global (50+ países)' },
  { id: 'youtube_music', name: 'YouTube Music', category: 'Global Streaming', description: 'Ecosistema de video musical y streaming de Google', iconBg: 'bg-red-600', territories: 'Global (100+ países)' },
  { id: 'deezer', name: 'Deezer', category: 'Global Streaming', description: 'Presencia masiva en Europa, América Latina y África', iconBg: 'bg-purple-600', territories: 'Global (180 países)' },
  { id: 'tidal', name: 'Tidal', category: 'Global Streaming', description: 'Alta fidelidad Master Quality Authenticated (MQA)', iconBg: 'bg-black', territories: 'Global (60+ países)' },
  { id: 'qobuz', name: 'Qobuz', category: 'Global Streaming', description: 'Servicio audiófilo con descargas en Hi-Res 24-bit', iconBg: 'bg-slate-800', territories: 'Europa, USA, Japón, LatAm' },
  { id: 'napster', name: 'Napster', category: 'Global Streaming', description: 'Pionero de música digital disponible en más de 30 países', iconBg: 'bg-blue-700', territories: 'Global (34 países)' },

  { id: 'tiktok', name: 'TikTok / ByteDance', category: 'Redes Sociales & Video', description: 'Monetización por creaciones virales y clips de video', iconBg: 'bg-slate-900', territories: 'Global (150+ países)' },
  { id: 'meta_audio', name: 'Instagram & Facebook Reels', category: 'Redes Sociales & Video', description: 'Biblioteca de audio para Stories, Reels y posts', iconBg: 'bg-pink-600', territories: 'Global (Meta Eco)' },
  { id: 'youtube_cid', name: 'YouTube Content ID', category: 'Redes Sociales & Video', description: 'Huella digital acústica para monetizar videos de terceros', iconBg: 'bg-red-700', territories: 'Global Digital ID' },
  { id: 'shazam', name: 'Shazam', category: 'Redes Sociales & Video', description: 'Reconocimiento acústico para descubrimiento instantáneo', iconBg: 'bg-blue-500', territories: 'Global (Apple)' },
  { id: 'snapchat', name: 'Snapchat Sounds', category: 'Redes Sociales & Video', description: 'Catálogo oficial de música para Snaps y Spotlight', iconBg: 'bg-amber-400', territories: 'Global' },

  { id: 'beatport', name: 'Beatport', category: 'Música Electrónica & DJ', description: 'Tienda número 1 para DJs de EDM, Techno y House', iconBg: 'bg-emerald-600', territories: 'Global DJ Market' },
  { id: 'traxsource', name: 'Traxsource', category: 'Música Electrónica & DJ', description: 'Especializada en Deep House, Nu-Disco y Soulful', iconBg: 'bg-orange-600', territories: 'Global Underground' },
  { id: 'juno_download', name: 'Juno Download', category: 'Música Electrónica & DJ', description: 'Tienda especializada para club culture y DJs independientes', iconBg: 'bg-yellow-600', territories: 'Reino Unido & Global' },

  { id: 'claro_musica', name: 'Claro Música', category: 'Regional & Emergente', description: 'Presencia dominante en toda Latinoamérica y Caribe', iconBg: 'bg-red-500', territories: 'Latinoamérica (16 países)' },
  { id: 'boomplay', name: 'Boomplay', category: 'Regional & Emergente', description: 'La mayor plataforma de streaming en África (+100M)', iconBg: 'bg-blue-600', territories: 'África Subsahariana' },
  { id: 'anghami', name: 'Anghami', category: 'Regional & Emergente', description: 'Líder absoluto de streaming en Medio Oriente y Norte de África', iconBg: 'bg-purple-700', territories: 'MENA (19 países)' },
  { id: 'netease', name: 'NetEase Cloud Music', category: 'Regional & Emergente', description: 'Una de las dos mayores plataformas digitales de China (+800M)', iconBg: 'bg-rose-700', territories: 'China Continental' },
  { id: 'tencent_qq', name: 'Tencent / QQ Music', category: 'Regional & Emergente', description: 'El gigante del streaming chino integrado con WeChat', iconBg: 'bg-green-600', territories: 'China Continental' },
  { id: 'joox', name: 'Joox', category: 'Regional & Emergente', description: 'Plataforma líder en Hong Kong, Malasia, Indonesia y Tailandia', iconBg: 'bg-lime-600', territories: 'Sudeste Asiático' },
  { id: 'jiosaavn', name: 'JioSaavn', category: 'Regional & Emergente', description: 'Plataforma más usada en la India con catálogo multilingüe', iconBg: 'bg-emerald-700', territories: 'India & Diáspora' },

  { id: 'pandora', name: 'Pandora', category: 'Radio & Discovery', description: 'Radio digital personalizada líder en Estados Unidos', iconBg: 'bg-blue-800', territories: 'Estados Unidos' },
  { id: 'iheartradio', name: 'iHeartRadio', category: 'Radio & Discovery', description: 'Red de radio digital y podcasts más escuchada en Norteamérica', iconBg: 'bg-rose-600', territories: 'USA, Canadá, Australia, NZ' },
  { id: 'audiomack', name: 'Audiomack', category: 'Radio & Discovery', description: 'Comunidad clave para Hip-Hop, Afrobeats y música urbana', iconBg: 'bg-amber-500', territories: 'Global Urban' },
  { id: 'soundcloud_go', name: 'SoundCloud Go', category: 'Radio & Discovery', description: 'Distribución oficial y monetización en SoundCloud', iconBg: 'bg-orange-500', territories: 'Global (+190 países)' },
];

export interface PayoutInvoice {
  invoiceNumber: string; // e.g. FAC-2026-0042
  issueDate: string;
  period: string;
  platformName: string;
  platformTaxId: string;
  platformAddress: string;
  platformEmail: string;
  beneficiaryName: string;
  beneficiaryStageName?: string;
  beneficiaryEmail: string;
  paymentMethod: 'bank' | 'paypal';
  paymentDetails: {
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    iban?: string;
    swift?: string;
    country?: string;
    paypalEmail?: string;
  };
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  status: 'paid' | 'processing';
  verificationHash: string;
  transactionRef: string;
}

export interface PayoutRequest {
  id: string;
  requestNumber?: string; // e.g. RET-2026-0012
  userId: string;
  userName: string;
  userEmail: string;
  artistStageName?: string;
  amount: number;
  currency: string;
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
  status: PayoutStatus;
  statusHistory?: PayoutStatusLog[];
  requestedAt: string;
  processedAt?: string;
  reviewedAt?: string;
  paidAt?: string;
  paymentReference?: string;
  processedByAdminName?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  notes?: string;
  invoice?: PayoutInvoice;
}

export interface PlatformStreamEntry {
  platform: string;
  streams: number;
  ratePerStream: number;
  estimatedEarnings: number;
}

export interface ManualStreamReport {
  id: string;
  artistId: string;
  artistName: string;
  period: string; // e.g. "Agosto 2026", "Mes Pasado"
  month: string;
  year: number;
  platformStreams: PlatformStreamEntry[];
  totalStreams: number;
  totalEarnings: number;
  currency: string;
  releaseId?: string;
  releaseTitle?: string;
  recordedByAdminName: string;
  createdAt: string;
  notes?: string;
}

export interface FileValidationResult {
  valid: boolean;
  fileName: string;
  fileSizeMB: number;
  fileType: string;
  details: {
    dimensions?: { width: number; height: number };
    isSquare?: boolean;
    duration?: number;
    sampleRate?: string;
    bitrate?: string;
    formatOk?: boolean;
  };
  errors: string[];
  warnings: string[];
}
