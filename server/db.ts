import fs from 'fs';
import path from 'path';
import {
  User,
  ArtistProfile,
  Release,
  DistributionProvider,
  ApiKey,
  ApiRequestLog,
  NotificationItem,
  PlatformSettings,
  RoyaltySummary,
  DirectMessage,
  ManualRoyaltyTransaction,
  PayoutRequest,
  ManualStreamReport,
  WalletLedgerEntry,
  SavedPaymentMethod,
  VideoRelease,
  SmmService,
  SmmOrder,
  SmmPanelConfig,
  SmartLink,
} from '../src/types.js';
import { hashPassword } from './security.js';

interface DatabaseSchema {
  users: Array<User & { passwordHash: string; salt: string }>;
  artists: ArtistProfile[];
  releases: Release[];
  videos: VideoRelease[];
  smartlinks: SmartLink[];
  smmServices: SmmService[];
  smmOrders: SmmOrder[];
  smmConfig: SmmPanelConfig;
  providers: DistributionProvider[];
  apiKeys: Array<ApiKey & { keyHash: string }>;
  apiLogs: ApiRequestLog[];
  notifications: NotificationItem[];
  directMessages: DirectMessage[];
  manualRoyaltyTransactions: ManualRoyaltyTransaction[];
  payoutRequests: PayoutRequest[];
  manualStreamReports: ManualStreamReport[];
  walletLedger: WalletLedgerEntry[];
  savedPaymentMethods: SavedPaymentMethod[];
  settings: PlatformSettings;
  royalties: Record<string, RoyaltySummary>;
  auditLogs: Array<{
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    entity: string;
    entityId: string;
    details: string;
    ip: string;
  }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // fallback
    }
  }
}

// Initial Seeds
function getInitialSeedData(): DatabaseSchema {
  const superAdminHash = hashPassword('AdminPass123!');
  const adminHash = hashPassword('ReviewerPass123!');
  const artistHash = hashPassword('ArtistPass123!');

  const now = new Date().toISOString();

  const users: DatabaseSchema['users'] = [
    {
      id: 'usr-superadmin-01',
      email: 'admin@sonoradistro.com',
      name: 'Elena Rostova',
      role: 'super_admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
      isVerified: true,
      status: 'active',
      createdAt: '2026-01-10T10:00:00Z',
      sessions: [
        {
          id: 'sess-01',
          device: 'MacBook Pro 16"',
          browser: 'Chrome 128 / macOS',
          ip: '192.168.1.45',
          lastActive: now,
          current: true,
        },
      ],
      passwordHash: superAdminHash.hash,
      salt: superAdminHash.salt,
    },
    {
      id: 'usr-superadmin-02',
      email: 'cadelpro33@gmail.com',
      name: 'Alex Rivera (Super Admin)',
      role: 'super_admin',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
      isVerified: true,
      status: 'active',
      createdAt: '2026-01-15T10:00:00Z',
      sessions: [],
      passwordHash: superAdminHash.hash,
      salt: superAdminHash.salt,
    },
    {
      id: 'usr-admin-01',
      email: 'review@sonoradistro.com',
      name: 'Carlos Mendoza',
      role: 'admin',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
      isVerified: true,
      status: 'active',
      createdAt: '2026-02-01T12:00:00Z',
      sessions: [
        {
          id: 'sess-02',
          device: 'ThinkPad X1 Carbon',
          browser: 'Firefox 130 / Linux',
          ip: '192.168.1.92',
          lastActive: now,
        },
      ],
      passwordHash: adminHash.hash,
      salt: adminHash.salt,
    },
    {
      id: 'usr-artist-01',
      email: 'artist@sonoradistro.com',
      name: 'Mateo Soler',
      role: 'artist',
      stageName: 'SOLER ECLIPSE',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
      isVerified: true,
      status: 'active',
      createdAt: '2026-03-01T14:30:00Z',
      sessions: [
        {
          id: 'sess-03',
          device: 'iPhone 15 Pro Max',
          browser: 'Mobile Safari 17',
          ip: '185.220.101.5',
          lastActive: now,
        },
      ],
      passwordHash: artistHash.hash,
      salt: artistHash.salt,
    },
  ];

  const artists: ArtistProfile[] = [
    {
      id: 'art-01',
      userId: 'usr-artist-01',
      stageName: 'SOLER ECLIPSE',
      legalName: 'Mateo Soler Navarro',
      spotifyId: 'spotify:artist:4Z8W4fKeB5Yx6vf2vFL2tY',
      appleMusicId: '1548902123',
      bio: 'Productor y compositor de música electrónica ambiental y synthwave moderno afincado en Madrid.',
      country: 'España',
      instagram: '@soler_eclipse',
      website: 'https://solereclipse.music',
      avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
      verified: true,
      totalReleases: 4,
    },
  ];

  const providers: DistributionProvider[] = [
    {
      id: 'prov-01',
      name: 'FUGA Music Technology',
      code: 'FUGA_PROD',
      endpoint: 'https://api.fuga.com/v2/ingestion',
      apiKeyMasked: 'fg_live_••••••••90a4',
      status: 'active',
      integrationType: 'REST_JSON',
      webhookUrl: 'https://api.sonoradistro.com/webhooks/fuga',
      supportedDspCount: 85,
      deliveryLatencyMinutes: 15,
      description: 'Proveedor tier-1 conectado con Spotify Direct, Apple Music XML, Amazon, Deezer y Tidal.',
    },
    {
      id: 'prov-02',
      name: 'The Orchard DDEX Gateway',
      code: 'ORCHARD_DDEX',
      endpoint: 'https://ddex.theorchard.com/ern43/batch',
      apiKeyMasked: 'orch_sec_••••••••412e',
      status: 'active',
      integrationType: 'DDEX_ERN_4',
      webhookUrl: 'https://api.sonoradistro.com/webhooks/orchard',
      supportedDspCount: 120,
      deliveryLatencyMinutes: 30,
      description: 'Estándar industrial DDEX ERN 4.3 para entrega de catálogos masivos y metadatos sin pérdidas.',
    },
    {
      id: 'prov-03',
      name: 'Revelator Global Cloud',
      code: 'REVELATOR_SANDBOX',
      endpoint: 'https://sandbox.revelator.com/api/v1/deliveries',
      apiKeyMasked: 'rev_test_••••••••78b1',
      status: 'sandbox',
      integrationType: 'REST_JSON',
      webhookUrl: 'https://api.sonoradistro.com/webhooks/revelator',
      supportedDspCount: 60,
      deliveryLatencyMinutes: 5,
      description: 'Entorno de pruebas certificado para simulación de entregas y pruebas de control de calidad.',
    },
  ];

  const releases: Release[] = [
    {
      id: 'rel-pending-01',
      userId: 'usr-artist-01',
      artistId: 'art-01',
      title: 'Neon Horizons',
      releaseType: 'single',
      mainArtist: 'SOLER ECLIPSE',
      featuredArtists: ['Luna Ray'],
      genre: 'Electronic',
      subgenre: 'Synthwave',
      language: 'Spanish',
      releaseDate: '2026-10-15',
      originalReleaseDate: '2026-10-15',
      label: 'Sonora Independent Records',
      catalogNumber: 'SNR-2026-089',
      upc: '8435123456789',
      pLine: '2026 Sonora Music Group',
      cLine: '2026 Mateo Soler Navarro',
      territories: 'worldwide',
      platforms: ['Spotify', 'Apple Music', 'Amazon Music', 'YouTube Music', 'Deezer', 'Tidal', 'TikTok', 'Instagram/Facebook'],
      explicit: false,
      coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
      coverFileName: 'neon_horizons_3000x3000_rgb.png',
      coverDimensions: { width: 3000, height: 3000 },
      status: 'under_review',
      reviewNotes: 'Pendiente de confirmación de ISRC y revisión de autoría de Luna Ray.',
      changeRequestItems: [],
      assignedProviderId: 'prov-01',
      createdAt: '2026-09-20T11:00:00Z',
      updatedAt: '2026-09-21T09:15:00Z',
      tracks: [
        {
          id: 'trk-01',
          releaseId: 'rel-pending-01',
          trackNumber: 1,
          discNumber: 1,
          title: 'Neon Horizons (Original Mix)',
          version: 'Original Mix',
          isrc: 'ES-A01-26-00123',
          durationSeconds: 218,
          explicit: false,
          previewStartTimeSeconds: 45,
          audioUrl: 'https://cdn.freesound.org/previews/511/511484_10672044-lq.mp3',
          audioFileName: '01_Neon_Horizons_24bit_48kHz.wav',
          audioFormat: 'WAV',
          audioBitrate: '2304 kbps',
          audioSampleRate: '48.0 kHz',
          composers: ['Mateo Soler Navarro', 'Elena Gomez Santos'],
          lyricists: ['Mateo Soler Navarro'],
          producers: ['SOLER ECLIPSE'],
          mixers: ['Adrian Vance'],
          masterers: ['Sterling Sound Lab'],
          featuredArtists: ['Luna Ray'],
          lyricsText: 'Luces de neón en la autopista infinita,\nLa señal se pierde en la colina,\nVolveremos antes de que amanezca,\nCielo de cobalto y sintetizador.',
          lyricsSynced: true,
          language: 'Spanish',
        },
      ],
      history: [
        {
          id: 'hist-01',
          timestamp: '2026-09-20T11:00:00Z',
          userId: 'usr-artist-01',
          userName: 'Mateo Soler',
          role: 'artist',
          action: 'Creó el borrador del lanzamiento',
        },
        {
          id: 'hist-02',
          timestamp: '2026-09-20T16:20:00Z',
          userId: 'usr-artist-01',
          userName: 'Mateo Soler',
          role: 'artist',
          action: 'Envió el lanzamiento a revisión',
          previousStatus: 'draft',
          newStatus: 'submitted',
        },
        {
          id: 'hist-03',
          timestamp: '2026-09-21T09:15:00Z',
          userId: 'usr-admin-01',
          userName: 'Carlos Mendoza',
          role: 'admin',
          action: 'Tomó el lanzamiento para control de calidad',
          previousStatus: 'submitted',
          newStatus: 'under_review',
        },
      ],
      distributionLogs: [],
    },
    {
      id: 'rel-changes-02',
      userId: 'usr-artist-01',
      artistId: 'art-01',
      title: 'Midnight Reverie',
      releaseType: 'single',
      mainArtist: 'SOLER ECLIPSE',
      featuredArtists: [],
      genre: 'Ambient',
      subgenre: 'Chillout',
      language: 'Instrumental',
      releaseDate: '2026-11-01',
      originalReleaseDate: '2026-11-01',
      label: 'Sonora Independent Records',
      catalogNumber: 'SNR-2026-090',
      upc: '8435123456790',
      pLine: '2026 Sonora Music Group',
      cLine: '2026 Mateo Soler Navarro',
      territories: 'worldwide',
      platforms: ['Spotify', 'Apple Music', 'Amazon Music', 'Deezer', 'Tidal'],
      explicit: false,
      coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      coverFileName: 'reverie_lowres.jpg',
      coverDimensions: { width: 1400, height: 1400 },
      status: 'changes_requested',
      reviewNotes: 'La portada no cumple con la resolución mínima de 3000x3000px y falta especificar el masterizador.',
      changeRequestItems: [
        'Subir portada en resolución de al menos 3000x3000 píxeles, formato cuadrado perfecto 1:1, RGB sin compresión excesiva.',
        'Agregar información del ingeniero de masterización en la pista 1.',
      ],
      assignedProviderId: null,
      createdAt: '2026-09-15T10:00:00Z',
      updatedAt: '2026-09-18T14:00:00Z',
      tracks: [
        {
          id: 'trk-02',
          releaseId: 'rel-changes-02',
          trackNumber: 1,
          discNumber: 1,
          title: 'Midnight Reverie',
          isrc: 'ES-A01-26-00124',
          durationSeconds: 195,
          explicit: false,
          previewStartTimeSeconds: 30,
          audioUrl: 'https://cdn.freesound.org/previews/511/511484_10672044-lq.mp3',
          audioFileName: 'Midnight_Reverie_master.wav',
          audioFormat: 'WAV',
          audioBitrate: '1411 kbps',
          audioSampleRate: '44.1 kHz',
          composers: ['Mateo Soler Navarro'],
          lyricists: [],
          producers: ['SOLER ECLIPSE'],
          mixers: ['Mateo Soler'],
          masterers: [],
          featuredArtists: [],
          lyricsText: '',
          lyricsSynced: false,
          language: 'Instrumental',
        },
      ],
      history: [
        {
          id: 'hist-04',
          timestamp: '2026-09-15T10:00:00Z',
          userId: 'usr-artist-01',
          userName: 'Mateo Soler',
          role: 'artist',
          action: 'Creó el lanzamiento',
        },
        {
          id: 'hist-05',
          timestamp: '2026-09-18T14:00:00Z',
          userId: 'usr-admin-01',
          userName: 'Carlos Mendoza',
          role: 'admin',
          action: 'Solicitó cambios de metadata y portada',
          previousStatus: 'under_review',
          newStatus: 'changes_requested',
          details: 'Portada < 3000px y masterizador ausente.',
        },
      ],
      distributionLogs: [],
    },
    {
      id: 'rel-published-03',
      userId: 'usr-artist-01',
      artistId: 'art-01',
      title: 'Solar Winds (EP)',
      releaseType: 'ep',
      mainArtist: 'SOLER ECLIPSE',
      featuredArtists: ['Kaelen'],
      genre: 'Electronic',
      subgenre: 'Deep Melodic House',
      language: 'English',
      releaseDate: '2026-08-01',
      originalReleaseDate: '2026-08-01',
      label: 'Sonora Independent Records',
      catalogNumber: 'SNR-2026-071',
      upc: '8435123456711',
      pLine: '2026 Sonora Records',
      cLine: '2026 Mateo Soler',
      territories: 'worldwide',
      platforms: ['Spotify', 'Apple Music', 'Amazon Music', 'YouTube Music', 'Deezer', 'Tidal', 'Pandora', 'TikTok'],
      explicit: false,
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80',
      coverFileName: 'solar_winds_ep_3000x3000.png',
      coverDimensions: { width: 3000, height: 3000 },
      status: 'published',
      assignedProviderId: 'prov-01',
      externalReleaseId: 'EXT-FUGA-892143',
      createdAt: '2026-07-10T12:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
      tracks: [
        {
          id: 'trk-03',
          releaseId: 'rel-published-03',
          trackNumber: 1,
          discNumber: 1,
          title: 'Solar Winds',
          isrc: 'ES-A01-26-00091',
          durationSeconds: 242,
          explicit: false,
          previewStartTimeSeconds: 60,
          audioUrl: 'https://cdn.freesound.org/previews/511/511484_10672044-lq.mp3',
          audioFormat: 'WAV',
          audioBitrate: '2304 kbps',
          audioSampleRate: '48.0 kHz',
          composers: ['Mateo Soler'],
          lyricists: ['Kaelen Miller'],
          producers: ['SOLER ECLIPSE'],
          mixers: ['Adrian Vance'],
          masterers: ['Sterling Sound'],
          featuredArtists: ['Kaelen'],
          lyricsText: 'Riding on the solar winds tonight\nLeaving all the gravity behind...',
          lyricsSynced: true,
          language: 'English',
        },
        {
          id: 'trk-04',
          releaseId: 'rel-published-03',
          trackNumber: 2,
          discNumber: 1,
          title: 'Coronal Mass',
          isrc: 'ES-A01-26-00092',
          durationSeconds: 275,
          explicit: false,
          previewStartTimeSeconds: 40,
          audioUrl: 'https://cdn.freesound.org/previews/511/511484_10672044-lq.mp3',
          audioFormat: 'WAV',
          audioBitrate: '2304 kbps',
          audioSampleRate: '48.0 kHz',
          composers: ['Mateo Soler'],
          lyricists: [],
          producers: ['SOLER ECLIPSE'],
          mixers: ['Adrian Vance'],
          masterers: ['Sterling Sound'],
          featuredArtists: [],
          lyricsText: '',
          lyricsSynced: false,
          language: 'Instrumental',
        },
      ],
      history: [
        {
          id: 'hist-06',
          timestamp: '2026-07-10T12:00:00Z',
          userId: 'usr-artist-01',
          userName: 'Mateo Soler',
          role: 'artist',
          action: 'Creó el lanzamiento',
        },
        {
          id: 'hist-07',
          timestamp: '2026-07-15T09:30:00Z',
          userId: 'usr-admin-01',
          userName: 'Carlos Mendoza',
          role: 'admin',
          action: 'Aprobó el lanzamiento para distribución',
          previousStatus: 'under_review',
          newStatus: 'approved',
        },
        {
          id: 'hist-08',
          timestamp: '2026-07-15T09:32:00Z',
          userId: 'system',
          userName: 'Sistema Automatizado',
          role: 'super_admin',
          action: 'Empaquetó metadatos DDEX y envió a FUGA Music Technology',
          previousStatus: 'approved',
          newStatus: 'in_distribution',
          details: 'ID Externo asignado: EXT-FUGA-892143',
        },
        {
          id: 'hist-09',
          timestamp: '2026-08-01T00:00:00Z',
          userId: 'system',
          userName: 'FUGA Webhook',
          role: 'super_admin',
          action: 'Publicación exitosa en Spotify, Apple Music, Tidal',
          previousStatus: 'distributed',
          newStatus: 'published',
        },
      ],
      distributionLogs: [
        {
          id: 'dist-01',
          timestamp: '2026-07-15T09:32:00Z',
          providerId: 'prov-01',
          providerName: 'FUGA Music Technology',
          status: 'delivered',
          externalId: 'EXT-FUGA-892143',
          message: 'Paquete de entrega JSON/WAV validado por el DSP Gateway con 0 errores.',
        },
        {
          id: 'dist-02',
          timestamp: '2026-08-01T00:00:00Z',
          providerId: 'prov-01',
          providerName: 'FUGA Music Technology',
          status: 'published',
          externalId: 'EXT-FUGA-892143',
          message: 'Lanzamiento en vivo en 85 tiendas digitales a nivel mundial.',
        },
      ],
    },
  ];

  const apiKeys: DatabaseSchema['apiKeys'] = [
    {
      id: 'apk-01',
      userId: 'usr-superadmin-01',
      userName: 'Elena Rostova',
      name: 'Integración CMS & ERP',
      keyPrefix: 'snr_live_8a4f',
      keyHash: 'd3b07384d113edec49eaa6238ad5ff00',
      permissions: ['releases:read', 'releases:write', 'artists:read', 'analytics:read', 'webhooks:listen'],
      rateLimitPerMinute: 300,
      createdAt: '2026-03-01T10:00:00Z',
      lastUsedAt: '2026-09-21T18:42:10Z',
      status: 'active',
    },
  ];

  const apiLogs: ApiRequestLog[] = [
    {
      id: 'log-01',
      timestamp: '2026-09-21T18:42:10Z',
      apiKeyPrefix: 'snr_live_8a4f',
      endpoint: '/api/v1/releases/rel-published-03/status',
      method: 'GET',
      statusCode: 200,
      durationMs: 42,
      ip: '54.210.12.88',
    },
    {
      id: 'log-02',
      timestamp: '2026-09-21T18:40:02Z',
      apiKeyPrefix: 'snr_live_8a4f',
      endpoint: '/api/v1/artists',
      method: 'GET',
      statusCode: 200,
      durationMs: 35,
      ip: '54.210.12.88',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-01',
      userId: 'usr-artist-01',
      title: 'Lanzamiento en Revisión',
      message: 'Tu lanzamiento "Neon Horizons" ha sido recibido por el equipo de control de calidad.',
      type: 'info',
      link: '/releases/rel-pending-01',
      read: false,
      createdAt: '2026-09-21T09:15:00Z',
      emailSent: true,
      emailSubject: 'Tu lanzamiento está siendo revisado por Sonora',
      emailBodyPreview: 'Hola Mateo, el equipo de administración ha iniciado la verificación técnica de "Neon Horizons".',
    },
    {
      id: 'notif-02',
      userId: 'usr-artist-01',
      title: 'Modificaciones Solicitadas',
      message: 'Se requieren ajustes en la portada y metadatos de "Midnight Reverie".',
      type: 'warning',
      link: '/releases/rel-changes-02',
      read: true,
      createdAt: '2026-09-18T14:00:00Z',
      emailSent: true,
      emailSubject: 'Acción requerida: cambios en tu lanzamiento "Midnight Reverie"',
      emailBodyPreview: 'Hola Mateo, tu lanzamiento requiere una portada de al menos 3000x3000px y el crédito del masterizador.',
    },
    {
      id: 'notif-03',
      userId: 'usr-admin-01',
      title: 'Nuevo Lanzamiento Enviado',
      message: 'El artista SOLER ECLIPSE ha enviado "Neon Horizons" para revisión.',
      type: 'info',
      link: '/admin/review',
      read: false,
      createdAt: '2026-09-20T16:20:00Z',
      emailSent: false,
    },
  ];

  const settings: PlatformSettings = {
    platformName: 'Sonora Digital',
    platformLogoText: 'SONORA',
    primaryColor: '#2563EB',
    accentColor: '#10B981',
    domain: 'sonoradistro.com',
    contactEmail: 'soporte@sonoradistro.com',
    supportPhone: '+34 910 882 100',
    commissionPercentage: 15,
    payoutThreshold: 50,
    autoDistributeOnApproval: true,
    require2FAForAdmins: true,
    maxUploadAudioSizeMB: 250,
    minCoverResolution: 3000,
    plans: [
      {
        id: 'plan-free',
        name: 'Starter Artist',
        priceMonthly: 0,
        artistCommission: 80,
        releasesAllowed: 'Hasta 3 lanzamientos/año',
        features: ['Distribución a Spotify & Apple Music', 'Códigos ISRC y UPC gratuitos', 'Liquidación mensual'],
      },
      {
        id: 'plan-pro',
        name: 'Pro Musician',
        priceMonthly: 19,
        artistCommission: 90,
        releasesAllowed: 'Lanzamientos ilimitados',
        features: ['Distribución a 120+ plataformas', 'Soporte prioritario 24h', 'Letras sincronizadas en Instagram & TikTok', 'Entrega rápida en 48 horas'],
      },
      {
        id: 'plan-label',
        name: 'Record Label Hub',
        priceMonthly: 69,
        artistCommission: 100,
        releasesAllowed: 'Artistas y lanzamientos ilimitados',
        features: ['100% regalías para tu catálogo', 'Acceso directo a API REST y DDEX', 'División automática de regalías (Splits)', 'Gestor de cuenta dedicado'],
      },
    ],
  };

  const royalties: Record<string, RoyaltySummary> = {
    'usr-artist-01': {
      totalEarned: 3480.45,
      pendingBalance: 420.12,
      paidOut: 3060.33,
      currency: 'EUR',
      totalStreams: 924510,
      monthlyStats: [
        { month: 'Mayo 2026', earnings: 620.1, streams: 165000 },
        { month: 'Junio 2026', earnings: 710.4, streams: 190000 },
        { month: 'Julio 2026', earnings: 840.2, streams: 220000 },
        { month: 'Agosto 2026', earnings: 950.8, streams: 255000 },
        { month: 'Septiembre 2026', earnings: 358.95, streams: 94510 },
      ],
      dspBreakdown: [
        { name: 'Spotify', percentage: 58, amount: 2018.66 },
        { name: 'Apple Music', percentage: 24, amount: 835.31 },
        { name: 'Amazon Music', percentage: 9, amount: 313.24 },
        { name: 'YouTube Music', percentage: 6, amount: 208.83 },
        { name: 'Otros (Tidal, Deezer)', percentage: 3, amount: 104.41 },
      ],
      topTracks: [
        { title: 'Solar Winds (Original Mix)', streams: 540200, earnings: 2030.15 },
        { title: 'Coronal Mass', streams: 384310, earnings: 1450.3 },
      ],
    },
  };

  const auditLogs: DatabaseSchema['auditLogs'] = [
    {
      id: 'aud-01',
      timestamp: '2026-09-21T09:15:00Z',
      userId: 'usr-admin-01',
      userName: 'Carlos Mendoza',
      action: 'REVIEW_STARTED',
      entity: 'RELEASE',
      entityId: 'rel-pending-01',
      details: 'El administrador inició la revisión técnica de "Neon Horizons".',
      ip: '192.168.1.92',
    },
    {
      id: 'aud-02',
      timestamp: '2026-09-20T16:20:00Z',
      userId: 'usr-artist-01',
      userName: 'Mateo Soler',
      action: 'RELEASE_SUBMITTED',
      entity: 'RELEASE',
      entityId: 'rel-pending-01',
      details: 'Lanzamiento enviado a revisión por el artista.',
      ip: '185.220.101.5',
    },
  ];

  const directMessages: DatabaseSchema['directMessages'] = [
    {
      id: 'msg-01',
      senderId: 'usr-superadmin-01',
      senderName: 'Admin Central Sonora',
      senderRole: 'super_admin',
      recipientId: 'usr-artist-01',
      recipientName: 'Mateo Soler',
      subject: '¡Bienvenido a Sonora! Tu catálogo ha sido asignado a nuestro sello',
      content: 'Hola Mateo, hemos recibido los metadatos de tu nuevo single "Neon Horizons". Nuestro equipo de control de calidad ha asignado el código UPC y los ISRC para cada track. Si necesitas liquidaciones de regalías personalizadas o anticipos, contáctanos directamente por este canal.',
      releaseId: 'rel-pending-01',
      releaseTitle: 'Neon Horizons',
      isRead: false,
      priority: 'important',
      createdAt: '2026-09-21T09:30:00Z',
    },
  ];

  const manualRoyaltyTransactions: DatabaseSchema['manualRoyaltyTransactions'] = [
    {
      id: 'roy-tx-01',
      artistId: 'usr-artist-01',
      artistName: 'Mateo Soler',
      releaseId: 'rel-active-01',
      releaseTitle: 'Solar Eclipse',
      trackTitle: 'Solar Winds (Original Mix)',
      amount: 450.0,
      currency: 'USD',
      sourceDsp: 'Spotify Streams',
      period: 'Agosto 2026',
      type: 'deposit',
      notes: 'Liquidación manual de regalías correspondiente al mes de Agosto 2026 en Spotify.',
      recordedByAdminName: 'Admin Central Sonora',
      createdAt: '2026-09-20T12:00:00Z',
    },
    {
      id: 'roy-tx-02',
      artistId: 'usr-artist-01',
      artistName: 'Mateo Soler',
      releaseId: 'rel-active-01',
      releaseTitle: 'Solar Eclipse',
      amount: 300.0,
      currency: 'USD',
      sourceDsp: 'Apple Music & TikTok',
      period: 'Agosto 2026',
      type: 'deposit',
      notes: 'Ingresos por sincronización en TikTok y reproducciones en Apple Music.',
      recordedByAdminName: 'Admin Central Sonora',
      createdAt: '2026-09-20T12:10:00Z',
    },
  ];

  return {
    users,
    artists,
    releases,
    providers,
    apiKeys,
    apiLogs,
    notifications,
    directMessages,
    manualRoyaltyTransactions,
    payoutRequests: [
      {
        id: 'payout-seed-01',
        userId: 'usr-artist-01',
        userName: 'Mateo Soler',
        userEmail: 'artist@sonoradistro.com',
        amount: 1200.0,
        currency: 'USD',
        paymentMethod: 'bank',
        bankDetails: {
          bankName: 'Santander International / Banco Santander España',
          accountHolder: 'Mateo Soler Ruiz',
          accountNumber: 'ES91 0049 1500 0512 3456 7890',
          iban: 'ES9100491500051234567890',
          swift: 'BSCHESMMXXX',
          country: 'España',
        },
        status: 'completed',
        requestedAt: '2026-08-15T10:30:00Z',
        processedAt: '2026-08-16T14:22:00Z',
        processedByAdminName: 'Elena Rostova (Super Admin)',
        notes: 'Liquidación procesada mediante transferencia SEPA con éxito.',
        invoice: {
          invoiceNumber: 'FAC-2026-0042',
          issueDate: '2026-08-16T14:22:00Z',
          period: 'Julio 2026',
          platformName: 'Sonora Music Distribution & Cadel Pro Network Media',
          platformTaxId: 'ES-B88741920 / US-EIN-94-3829104',
          platformAddress: 'Paseo de la Castellana 216, 28046 Madrid, España / 742 Evergreen, Miami, FL, USA',
          platformEmail: 'finance@sonoradistro.com',
          beneficiaryName: 'Mateo Soler Ruiz',
          beneficiaryStageName: 'SOLER ECLIPSE',
          beneficiaryEmail: 'artist@sonoradistro.com',
          paymentMethod: 'bank',
          paymentDetails: {
            bankName: 'Santander International',
            accountHolder: 'Mateo Soler Ruiz',
            accountNumber: '•••••••• 7890',
            iban: 'ES91 •••• •••• •••• 7890',
            swift: 'BSCHESMMXXX',
            country: 'España',
          },
          grossAmount: 1200.0,
          feeAmount: 0.0,
          netAmount: 1200.0,
          currency: 'USD',
          status: 'paid',
          verificationHash: '9a7f3c4e1b82d0e65f3a8b29c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8',
          transactionRef: 'TXN-SEPA-948102384',
        },
      },
    ],
    manualStreamReports: [],
    walletLedger: [
      {
        id: 'tx-seed-01',
        transactionNumber: 'MOV-2026-0001',
        userId: 'usr-artist-01',
        userName: 'Mateo Soler',
        userRole: 'artist',
        type: 'deposit',
        typeLabel: 'Depósito inicial de regalías',
        description: 'Acreditación por liquidación de streaming Q1 2026',
        amount: 1500.0,
        balanceBefore: 0.0,
        balanceAfter: 1500.0,
        currency: 'USD',
        status: 'completed',
        performedByUserId: 'usr-superadmin-01',
        performedByName: 'Elena Rostova',
        performedByRole: 'super_admin',
        createdAt: '2026-08-10T14:30:00Z',
      },
      {
        id: 'tx-seed-02',
        transactionNumber: 'MOV-2026-0002',
        userId: 'usr-artist-01',
        userName: 'Mateo Soler',
        userRole: 'artist',
        type: 'withdrawal_hold',
        typeLabel: 'Retención por solicitud de retiro',
        description: 'Retención por solicitud de retiro #RET-2026-0001',
        amount: -1200.0,
        balanceBefore: 1500.0,
        balanceAfter: 300.0,
        currency: 'USD',
        status: 'completed',
        payoutRequestId: 'payout-seed-01',
        performedByUserId: 'usr-artist-01',
        performedByName: 'Mateo Soler',
        performedByRole: 'artist',
        createdAt: '2026-08-15T10:00:00Z',
      },
      {
        id: 'tx-seed-03',
        transactionNumber: 'MOV-2026-0003',
        userId: 'usr-artist-01',
        userName: 'Mateo Soler',
        userRole: 'artist',
        type: 'withdrawal_paid',
        typeLabel: 'Pago de retiro completado',
        description: 'Pago transferido a cuenta bancaria Santander. Factura #FAC-2026-0001',
        amount: 1200.0,
        balanceBefore: 300.0,
        balanceAfter: 300.0,
        currency: 'USD',
        status: 'completed',
        payoutRequestId: 'payout-seed-01',
        reference: 'TXN-SEPA-948102384',
        performedByUserId: 'usr-superadmin-01',
        performedByName: 'Elena Rostova',
        performedByRole: 'super_admin',
        createdAt: '2026-08-16T12:00:00Z',
      },
      {
        id: 'tx-seed-04',
        transactionNumber: 'MOV-2026-0004',
        userId: 'usr-artist-01',
        userName: 'Mateo Soler',
        userRole: 'artist',
        type: 'deposit',
        typeLabel: 'Depósito de saldo',
        description: 'Abono manual realizado por Súper Admin (Adelanto de regalías)',
        amount: 120.12,
        balanceBefore: 300.0,
        balanceAfter: 420.12,
        currency: 'USD',
        status: 'completed',
        performedByUserId: 'usr-superadmin-01',
        performedByName: 'Elena Rostova',
        performedByRole: 'super_admin',
        createdAt: '2026-09-01T09:00:00Z',
      },
    ],
    savedPaymentMethods: [
      {
        id: 'pm-seed-01',
        userId: 'usr-artist-01',
        type: 'bank',
        label: 'Banco Santander (Principal)',
        isDefault: true,
        bankDetails: {
          bankName: 'Banco Santander España',
          accountHolder: 'Mateo Soler Navarro',
          accountNumber: 'ES91 0049 1500 0512 3456 7890',
          iban: 'ES9100491500051234567890',
          swift: 'BSCHESMMXXX',
          country: 'España',
        },
        createdAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'pm-seed-02',
        userId: 'usr-artist-01',
        type: 'paypal',
        label: 'PayPal Personal',
        isDefault: false,
        paypalDetails: {
          paypalEmail: 'artist@sonoradistro.com',
          accountHolder: 'Mateo Soler',
        },
        createdAt: '2026-08-02T10:00:00Z',
      },
    ],
    videos: [
      {
        id: 'vid-01',
        userId: 'usr-artist-01',
        artistId: 'art-01',
        title: 'Neon Horizons (Official Music Video)',
        artistName: 'SOLER ECLIPSE',
        featuredArtists: ['Luna Ray'],
        director: 'Carlos Vega & Cadel Visuals',
        videoProducer: 'Sonora Films / Cadel Pro Network',
        isrc: 'US-V84-26-00121',
        genre: 'Electronic / Synthwave',
        explicit: false,
        videoType: 'official_music_video',
        resolution: '4K_UHD',
        aspectRatio: '16:9',
        durationSeconds: 218,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoFileName: 'neon_horizons_official_4k_prores.mp4',
        videoFileSizeMB: 840,
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        thumbnailFileName: 'neon_horizons_thumb_4k.jpg',
        platforms: ['Vevo', 'Apple Music Video', 'Tidal Video', 'YouTube OAC', 'Cadel Pro Network'],
        vevoChannel: 'SolerEclipseVEVO',
        releaseDate: '2026-10-15',
        status: 'distributed',
        viewsCount: 48200,
        createdAt: '2026-09-10T12:00:00Z',
        updatedAt: '2026-09-12T15:00:00Z',
      },
      {
        id: 'vid-02',
        userId: 'usr-artist-01',
        artistId: 'art-01',
        title: 'Midnight Overdrive (Official Visualizer)',
        artistName: 'SOLER ECLIPSE',
        featuredArtists: [],
        director: 'Cadel Visual Lab',
        videoProducer: 'Sonora Media Lab',
        isrc: 'US-V84-26-00122',
        genre: 'Synthwave',
        explicit: false,
        videoType: 'visualizer',
        resolution: '4K_UHD',
        aspectRatio: '16:9',
        durationSeconds: 195,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        videoFileName: 'midnight_overdrive_visualizer_4k.mp4',
        videoFileSizeMB: 620,
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
        thumbnailFileName: 'midnight_thumb.jpg',
        platforms: ['Vevo', 'Apple Music Video', 'Spotify Video'],
        vevoChannel: 'SolerEclipseVEVO',
        releaseDate: '2026-10-22',
        status: 'under_review',
        reviewNotes: 'Revisión técnica de color grading y niveles de volumen -14 LUFS para Vevo.',
        viewsCount: 0,
        createdAt: '2026-09-21T18:30:00Z',
        updatedAt: '2026-09-22T08:00:00Z',
      },
    ],
    smmServices: [
      {
        id: 'smm-srv-yt-01',
        smmServiceId: 1042,
        name: 'YouTube Vistas HQ - Alta Retención (VEVO & Ads Safe)',
        category: 'YouTube',
        type: 'views',
        ratePer1000: 2.20,
        minQuantity: 1000,
        maxQuantity: 500000,
        averageSpeed: '25,000 / día',
        guaranteeDays: 60,
        description: 'Vistas reales monetizables para videoclips y canales oficiales VEVO. Sin caídas con 60 días de reposición.',
        badge: 'Más Vendido Vevo',
        active: true,
      },
      {
        id: 'smm-srv-yt-02',
        smmServiceId: 1045,
        name: 'YouTube Vistas Google Discovery Ads (Audiencia 100% Real)',
        category: 'YouTube',
        type: 'views',
        ratePer1000: 4.80,
        minQuantity: 500,
        maxQuantity: 200000,
        averageSpeed: '10,000 / día',
        guaranteeDays: 90,
        description: 'Impulso mediante campañas oficiales de anuncios de YouTube. Excelente para mejorar el algoritmo de recomendación.',
        badge: 'Google Ads',
        active: true,
      },
      {
        id: 'smm-srv-yt-03',
        smmServiceId: 1088,
        name: 'YouTube Likes Reales Orgánicos',
        category: 'YouTube',
        type: 'likes',
        ratePer1000: 4.00,
        minQuantity: 50,
        maxQuantity: 50000,
        averageSpeed: '2,000 / día',
        guaranteeDays: 30,
        description: 'Likes de perfiles activos para mejorar la tasa de interacción (engagement) de tu videoclip.',
        badge: 'Calidad Alta',
        active: true,
      },
      {
        id: 'smm-srv-sp-01',
        smmServiceId: 2011,
        name: 'Spotify Streams - Playlists Curadas Algorítmicas (Royalty Eligible)',
        category: 'Spotify',
        type: 'streams',
        ratePer1000: 3.20,
        minQuantity: 1000,
        maxQuantity: 1000000,
        averageSpeed: '15,000 / día',
        guaranteeDays: 30,
        description: 'Reproducciones premium elegibles para cobro de regalías en Spotify. Tráfico distribuido por regiones clave.',
        badge: 'Regalías Elegibles',
        active: true,
      },
      {
        id: 'smm-srv-sp-02',
        smmServiceId: 2045,
        name: 'Spotify Oyentes Mensuales (Monthly Listeners)',
        category: 'Spotify',
        type: 'monthly_listeners',
        ratePer1000: 3.80,
        minQuantity: 500,
        maxQuantity: 250000,
        averageSpeed: '5,000 / día',
        guaranteeDays: 30,
        description: 'Aumenta los oyentes mensuales de tu perfil de artista verificado en Spotify. Visibles en tu perfil público.',
        badge: 'Perfil Artista',
        active: true,
      },
      {
        id: 'smm-srv-sp-03',
        smmServiceId: 2070,
        name: 'Spotify Saves a Biblioteca & Playlist Adds',
        category: 'Spotify',
        type: 'saves',
        ratePer1000: 5.50,
        minQuantity: 100,
        maxQuantity: 20000,
        averageSpeed: '1,000 / día',
        guaranteeDays: 30,
        description: 'Canción guardada en biblioteca personal de usuarios para disparar el algoritmo Release Radar.',
        badge: 'Algoritmo Boost',
        active: true,
      },
      {
        id: 'smm-srv-tk-01',
        smmServiceId: 3001,
        name: 'TikTok Vistas Virales Ultra Rápidas',
        category: 'TikTok',
        type: 'views',
        ratePer1000: 0.80,
        minQuantity: 1000,
        maxQuantity: 1000000,
        averageSpeed: '100,000 / día',
        guaranteeDays: 30,
        description: 'Reproducciones instantáneas para impulsar tendencias y sonidos de tus canciones en TikTok.',
        badge: 'Ultra Rápido',
        active: true,
      },
      {
        id: 'smm-srv-tk-02',
        smmServiceId: 3020,
        name: 'TikTok Likes de Alta Calidad',
        category: 'TikTok',
        type: 'likes',
        ratePer1000: 2.80,
        minQuantity: 100,
        maxQuantity: 50000,
        averageSpeed: '5,000 / día',
        guaranteeDays: 30,
        description: 'Likes genuinos para dar credibilidad y posicionar clips musicales en el feed Para Ti (FYP).',
        active: true,
      },
      {
        id: 'smm-srv-ig-01',
        smmServiceId: 4010,
        name: 'Instagram Reels Vistas HQ',
        category: 'Instagram',
        type: 'views',
        ratePer1000: 1.20,
        minQuantity: 500,
        maxQuantity: 500000,
        averageSpeed: '50,000 / día',
        guaranteeDays: 30,
        description: 'Vistas para tus Reels y lanzamientos musicales en Instagram con tasa de inicio inmediata.',
        active: true,
      },
      {
        id: 'smm-srv-am-01',
        smmServiceId: 5010,
        name: 'Apple Music Streams Globales',
        category: 'Apple Music',
        type: 'streams',
        ratePer1000: 6.50,
        minQuantity: 500,
        maxQuantity: 50000,
        averageSpeed: '2,000 / día',
        guaranteeDays: 30,
        description: 'Reproducciones para posicionar tus temas en el ecosistema Apple Music y charts regionales.',
        badge: 'Apple Music',
        active: true,
      },
    ],
    smmOrders: [
      {
        id: 'ord-smm-01',
        orderNumber: 'SMM-2026-0001',
        userId: 'usr-artist-01',
        userName: 'Soler Eclipse',
        serviceId: 'smm-srv-yt-01',
        serviceName: 'YouTube Vistas HQ - Alta Retención (VEVO & Ads Safe)',
        serviceCategory: 'YouTube',
        targetLink: 'https://youtube.com/watch?v=example_vevo_video_01',
        quantity: 5000,
        totalCost: 11.00,
        balanceBefore: 120.00,
        balanceAfter: 109.00,
        deductedAmount: 11.00,
        currency: 'USD',
        status: 'completed',
        startCount: 1420,
        remains: 0,
        externalOrderId: 'SMM-EXT-849201',
        smmApiEndpoint: 'https://panel-smm-api.com/api/v2',
        smmStatusResponse: 'Completed - Order successfully finished',
        createdAt: '2026-09-18T14:30:00Z',
        updatedAt: '2026-09-19T10:00:00Z',
      },
    ],
    smmConfig: {
      apiUrl: 'https://panel-smm-api.com/api/v2',
      apiKeyMasked: 'smm_live_********************',
      apiKey: 'smm_live_demo_key_9941a82f',
      apiMode: 'simulation',
      providerName: 'SMM Master Panel API v2',
      providerBalance: 485.60,
      profitMarginPercent: 25,
      autoFulfill: true,
    },
    smartlinks: [
      {
        id: 'sml-01',
        slug: 'neon-horizons',
        title: 'Neon Horizons',
        artistName: 'SOLER ECLIPSE',
        releaseId: 'rel-active-01',
        releaseType: 'single',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        description: 'Escucha ya el nuevo single synthwave "Neon Horizons". Disponible en todas las tiendas.',
        releaseDate: '2026-10-15',
        isPreSave: false,
        audioPreviewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        videoPreviewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        platforms: [
          {
            id: 'spotify',
            name: 'Spotify',
            url: 'https://open.spotify.com/album/4Z8W4fKeB5Yx6vf2vFL2tY',
            actionText: 'Escuchar',
            iconKey: 'spotify',
            active: true,
          },
          {
            id: 'appleMusic',
            name: 'Apple Music',
            url: 'https://music.apple.com/album/neon-horizons/1548902123',
            actionText: 'Escuchar',
            iconKey: 'appleMusic',
            active: true,
          },
          {
            id: 'youtube',
            name: 'YouTube / VEVO',
            url: 'https://youtube.com/watch?v=example_vevo_video_01',
            actionText: 'Ver Video',
            iconKey: 'youtube',
            active: true,
          },
          {
            id: 'amazonMusic',
            name: 'Amazon Music',
            url: 'https://music.amazon.com/albums/B09XYZ123',
            actionText: 'Escuchar',
            iconKey: 'amazonMusic',
            active: true,
          },
          {
            id: 'deezer',
            name: 'Deezer',
            url: 'https://www.deezer.com/album/neon-horizons',
            actionText: 'Escuchar',
            iconKey: 'deezer',
            active: true,
          },
          {
            id: 'tiktok',
            name: 'TikTok Sound',
            url: 'https://www.tiktok.com/tag/neonhorizons',
            actionText: 'Usar Audio',
            iconKey: 'tiktok',
            active: true,
          },
        ],
        socialLinks: {
          instagram: 'https://instagram.com/soler_eclipse',
          youtube: 'https://youtube.com/c/SolerEclipseVEVO',
        },
        themeColor: '#6366f1',
        totalVisits: 1420,
        totalClicks: 890,
        preSavesCount: 340,
        userId: 'usr-artist-01',
        createdAt: '2026-09-15T12:00:00Z',
        updatedAt: '2026-09-20T10:00:00Z',
      },
    ],
    settings,
    royalties,
    auditLogs,
  };
}

let dbInstance: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (dbInstance) return dbInstance;
  ensureDataDir();

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbInstance = JSON.parse(content);
      if (dbInstance) {
        const initialSeeds = getInitialSeedData();
        dbInstance.videos = dbInstance.videos && dbInstance.videos.length > 0
          ? dbInstance.videos
          : initialSeeds.videos;
        dbInstance.smartlinks = dbInstance.smartlinks && dbInstance.smartlinks.length > 0
          ? dbInstance.smartlinks
          : initialSeeds.smartlinks;
        dbInstance.directMessages = dbInstance.directMessages || [];
        dbInstance.manualRoyaltyTransactions = dbInstance.manualRoyaltyTransactions || [];
        dbInstance.payoutRequests = dbInstance.payoutRequests || [];
        dbInstance.manualStreamReports = dbInstance.manualStreamReports || [];
        dbInstance.walletLedger = dbInstance.walletLedger || [];
        dbInstance.savedPaymentMethods = dbInstance.savedPaymentMethods || [];

        // Ensure SMM collections
        dbInstance.smmServices = dbInstance.smmServices && dbInstance.smmServices.length > 0
          ? dbInstance.smmServices
          : initialSeeds.smmServices;
        dbInstance.smmOrders = dbInstance.smmOrders || initialSeeds.smmOrders;
        dbInstance.smmConfig = dbInstance.smmConfig || initialSeeds.smmConfig;

        // Synchronize royalties wallet balances
        if (dbInstance.royalties) {
          Object.keys(dbInstance.royalties).forEach((userId) => {
            const r = dbInstance!.royalties[userId];
            if (r) {
              if (r.availableBalance === undefined) {
                r.availableBalance = r.pendingBalance ?? 0;
              }
              if (r.pendingWithdrawals === undefined) {
                r.pendingWithdrawals = 0;
              }
              // Keep pendingBalance synchronized with availableBalance
              r.pendingBalance = r.availableBalance;
            }
          });
        }

        // Ensure users have available balance to purchase SMM / promotion products
        dbInstance.users.forEach((u) => {
          if (dbInstance!.royalties) {
            if (!dbInstance!.royalties[u.id] || (dbInstance!.royalties[u.id].availableBalance || 0) < 50) {
              dbInstance!.royalties[u.id] = {
                availableBalance: 150.00,
                pendingBalance: 150.00,
                pendingWithdrawals: 0,
                paidOut: 0,
                totalEarned: 150.00,
                currency: 'USD',
                totalStreams: 45000,
                monthlyStats: [],
                dspBreakdown: [{ name: 'Spotify', amount: 95, percentage: 65 }, { name: 'Apple Music', amount: 55, percentage: 35 }],
                topTracks: [],
              };
            }
          }
        });

        return dbInstance;
      }
    } catch {
      // corrupt or read error, regenerate
    }
  }

  dbInstance = getInitialSeedData();
  saveDb();
  return dbInstance!;
}

export function saveDb(): void {
  if (!dbInstance) return;
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbInstance, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}
