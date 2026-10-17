import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authenticate } from './auth.js';

export const analyticsRouter = Router();

// GET /api/analytics
analyticsRouter.get('/', authenticate, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const db = getDb();
  const queryArtistId = req.query.artistId as string | undefined;
  const queryReleaseId = req.query.releaseId as string | undefined;
  const timeframe = (req.query.timeframe as string) || '12m';

  const totalUsers = db.users.length;
  const totalArtists = db.artists.length;
  const totalReleases = db.releases.length;

  const pendingReleases = db.releases.filter((r) => r.status === 'submitted' || r.status === 'under_review').length;
  const approvedReleases = db.releases.filter((r) => r.status === 'approved' || r.status === 'scheduled').length;
  const inDistributionReleases = db.releases.filter((r) => r.status === 'in_distribution' || r.status === 'distributed').length;
  const publishedReleases = db.releases.filter((r) => r.status === 'published').length;
  const rejectedReleases = db.releases.filter((r) => r.status === 'rejected').length;
  const changesRequestedReleases = db.releases.filter((r) => r.status === 'changes_requested').length;

  const totalTracks = db.releases.reduce((acc, r) => acc + (r.tracks?.length || 0), 0);
  const activeDSPs = db.providers.filter((p) => p.status === 'active').reduce((acc, p) => acc + p.supportedDspCount, 0);
  const apiErrors = db.apiLogs.filter((l) => l.statusCode >= 400).length;

  // Determine target artist ID
  let targetUserId = currentUser.id;
  if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
    if (queryArtistId && queryArtistId !== 'all') {
      targetUserId = queryArtistId;
    }
  }

  // User/Artist specific royalties
  const rawRoyalty = db.royalties[targetUserId] || db.royalties['usr-artist-01'];
  const artistRoyalty = {
    totalEarned: rawRoyalty?.totalEarned ?? 3480.45,
    pendingBalance: rawRoyalty?.pendingBalance ?? 420.12,
    paidOut: rawRoyalty?.paidOut ?? 3060.33,
    currency: rawRoyalty?.currency ?? 'USD',
    totalStreams: rawRoyalty?.totalStreams ?? 924510,
    monthlyStats: rawRoyalty?.monthlyStats || [
      { month: 'Oct 2025', earnings: 380.2, streams: 98000 },
      { month: 'Nov 2025', earnings: 420.5, streams: 110000 },
      { month: 'Dic 2025', earnings: 510.0, streams: 135000 },
      { month: 'Ene 2026', earnings: 490.8, streams: 128000 },
      { month: 'Feb 2026', earnings: 550.4, streams: 145000 },
      { month: 'Mar 2026', earnings: 580.6, streams: 152000 },
      { month: 'Abr 2026', earnings: 620.1, streams: 165000 },
      { month: 'May 2026', earnings: 710.4, streams: 190000 },
      { month: 'Jun 2026', earnings: 840.2, streams: 220000 },
      { month: 'Jul 2026', earnings: 950.8, streams: 255000 },
      { month: 'Ago 2026', earnings: 1120.5, streams: 298000 },
      { month: 'Sep 2026', earnings: 1280.9, streams: 342000 },
    ],
    dspBreakdown: [
      { name: 'Spotify', dsp: 'Spotify', percentage: 50, share: 50, amount: 1756.55, revenue: 1756.55, streams: 462250 },
      { name: 'Apple Music', dsp: 'Apple Music', percentage: 25, share: 25, amount: 1733.4, revenue: 1733.4, streams: 231120 },
      { name: 'YouTube Music', dsp: 'YouTube Music', percentage: 12, share: 12, amount: 277.35, revenue: 277.35, streams: 110940 },
      { name: 'Amazon Music', dsp: 'Amazon Music', percentage: 7, share: 7, amount: 258.84, revenue: 258.84, streams: 64710 },
      { name: 'TikTok / ByteDance', dsp: 'TikTok / ByteDance', percentage: 4, share: 4, amount: 92.45, revenue: 92.45, streams: 36980 },
      { name: 'Vevo & Video', dsp: 'Vevo & Video', percentage: 2, share: 2, amount: 148.08, revenue: 148.08, streams: 18510 },
    ],
    topTracks: rawRoyalty?.topTracks || [
      { title: 'Cyberpunk Dawn', streams: 385000, earnings: 1463.0, revenue: 1463.0 },
      { title: 'Neon Reflections', streams: 290000, earnings: 1102.0, revenue: 1102.0 },
      { title: 'Retrowave Pulse', streams: 145000, earnings: 551.0, revenue: 551.0 },
      { title: 'Synthetic Soul', streams: 104510, earnings: 397.14, revenue: 397.14 },
    ],
  };

  // Detailed 12-Month Performance Trends for the Artist
  const performanceTrend = [
    {
      period: 'Oct 2025',
      month: 'Oct 2025',
      streams: 98000,
      revenue: 380.2,
      cumulativeRevenue: 380.2,
      cumulativeStreams: 98000,
      spotify: 49000,
      appleMusic: 24500,
      youtube: 11760,
      amazon: 6860,
      tiktok: 3920,
      vevo: 1960,
      momGrowthStreams: 0,
      momGrowthRevenue: 0,
      rpm: 3.88,
      listeners: 42100,
    },
    {
      period: 'Nov 2025',
      month: 'Nov 2025',
      streams: 110000,
      revenue: 420.5,
      cumulativeRevenue: 800.7,
      cumulativeStreams: 208000,
      spotify: 55000,
      appleMusic: 27500,
      youtube: 13200,
      amazon: 7700,
      tiktok: 4400,
      vevo: 2200,
      momGrowthStreams: 12.2,
      momGrowthRevenue: 10.6,
      rpm: 3.82,
      listeners: 47800,
    },
    {
      period: 'Dic 2025',
      month: 'Dic 2025',
      streams: 135000,
      revenue: 510.0,
      cumulativeRevenue: 1310.7,
      cumulativeStreams: 343000,
      spotify: 67500,
      appleMusic: 33750,
      youtube: 16200,
      amazon: 9450,
      tiktok: 5400,
      vevo: 2700,
      momGrowthStreams: 22.7,
      momGrowthRevenue: 21.3,
      rpm: 3.78,
      listeners: 58200,
    },
    {
      period: 'Ene 2026',
      month: 'Ene 2026',
      streams: 128000,
      revenue: 490.8,
      cumulativeRevenue: 1801.5,
      cumulativeStreams: 471000,
      spotify: 64000,
      appleMusic: 32000,
      youtube: 15360,
      amazon: 8960,
      tiktok: 5120,
      vevo: 2560,
      momGrowthStreams: -5.2,
      momGrowthRevenue: -3.8,
      rpm: 3.83,
      listeners: 55900,
    },
    {
      period: 'Feb 2026',
      month: 'Feb 2026',
      streams: 145000,
      revenue: 550.4,
      cumulativeRevenue: 2351.9,
      cumulativeStreams: 616000,
      spotify: 72500,
      appleMusic: 36250,
      youtube: 17400,
      amazon: 10150,
      tiktok: 5800,
      vevo: 2900,
      momGrowthStreams: 13.3,
      momGrowthRevenue: 12.1,
      rpm: 3.80,
      listeners: 63100,
    },
    {
      period: 'Mar 2026',
      month: 'Mar 2026',
      streams: 152000,
      revenue: 580.6,
      cumulativeRevenue: 2932.5,
      cumulativeStreams: 768000,
      spotify: 76000,
      appleMusic: 38000,
      youtube: 18240,
      amazon: 10640,
      tiktok: 6080,
      vevo: 3040,
      momGrowthStreams: 4.8,
      momGrowthRevenue: 5.5,
      rpm: 3.82,
      listeners: 66400,
    },
    {
      period: 'Abr 2026',
      month: 'Abr 2026',
      streams: 165000,
      revenue: 620.1,
      cumulativeRevenue: 3552.6,
      cumulativeStreams: 933000,
      spotify: 82500,
      appleMusic: 41250,
      youtube: 19800,
      amazon: 11550,
      tiktok: 6600,
      vevo: 3300,
      momGrowthStreams: 8.6,
      momGrowthRevenue: 6.8,
      rpm: 3.76,
      listeners: 71800,
    },
    {
      period: 'May 2026',
      month: 'May 2026',
      streams: 190000,
      revenue: 710.4,
      cumulativeRevenue: 4263.0,
      cumulativeStreams: 1123000,
      spotify: 95000,
      appleMusic: 47500,
      youtube: 22800,
      amazon: 13300,
      tiktok: 7600,
      vevo: 3800,
      momGrowthStreams: 15.2,
      momGrowthRevenue: 14.6,
      rpm: 3.74,
      listeners: 82500,
    },
    {
      period: 'Jun 2026',
      month: 'Jun 2026',
      streams: 220000,
      revenue: 840.2,
      cumulativeRevenue: 5103.2,
      cumulativeStreams: 1343000,
      spotify: 110000,
      appleMusic: 55000,
      youtube: 26400,
      amazon: 15400,
      tiktok: 8800,
      vevo: 4400,
      momGrowthStreams: 15.8,
      momGrowthRevenue: 18.3,
      rpm: 3.82,
      listeners: 96000,
    },
    {
      period: 'Jul 2026',
      month: 'Jul 2026',
      streams: 255000,
      revenue: 950.8,
      cumulativeRevenue: 6054.0,
      cumulativeStreams: 1598000,
      spotify: 127500,
      appleMusic: 63750,
      youtube: 30600,
      amazon: 17850,
      tiktok: 10200,
      vevo: 5100,
      momGrowthStreams: 15.9,
      momGrowthRevenue: 13.2,
      rpm: 3.73,
      listeners: 112000,
    },
    {
      period: 'Ago 2026',
      month: 'Ago 2026',
      streams: 298000,
      revenue: 1120.5,
      cumulativeRevenue: 7174.5,
      cumulativeStreams: 1896000,
      spotify: 149000,
      appleMusic: 74500,
      youtube: 35760,
      amazon: 20860,
      tiktok: 11920,
      vevo: 5960,
      momGrowthStreams: 16.9,
      momGrowthRevenue: 17.8,
      rpm: 3.76,
      listeners: 131500,
    },
    {
      period: 'Sep 2026',
      month: 'Sep 2026',
      streams: 342000,
      revenue: 1280.9,
      cumulativeRevenue: 8455.4,
      cumulativeStreams: 2238000,
      spotify: 171000,
      appleMusic: 85500,
      youtube: 41040,
      amazon: 23940,
      tiktok: 13680,
      vevo: 6840,
      momGrowthStreams: 14.8,
      momGrowthRevenue: 14.3,
      rpm: 3.75,
      listeners: 152000,
    },
  ];

  // Filter timeframe if requested
  const filteredTrend = timeframe === '6m' ? performanceTrend.slice(-6) : performanceTrend;

  // Release-specific performance breakdown
  const releasesPerformance = db.releases
    .filter((r) => (targetUserId === 'all' ? true : r.userId === targetUserId))
    .map((r, idx) => {
      const baseStreams = (idx + 1) * 185000 + 42000;
      const baseRevenue = baseStreams * 0.0038;
      return {
        id: r.id,
        title: r.title,
        coverUrl: r.coverUrl,
        releaseType: r.releaseType,
        status: r.status,
        releaseDate: r.releaseDate,
        totalStreams: baseStreams,
        monthlyStreams: Math.round(baseStreams * 0.28),
        revenue: Math.round(baseRevenue * 100) / 100,
        growthMoM: Math.round(((idx % 2 === 0 ? 1 : -1) * 8.5 + 14.2) * 10) / 10,
        topDsp: idx % 2 === 0 ? 'Spotify' : 'Apple Music',
      };
    });

  // Territory breakdown
  const territoryPerformance = [
    { country: 'España (ES)', code: 'ES', flag: '🇪🇸', percentage: 38, streams: 850440, revenue: 3213.0 },
    { country: 'México (MX)', code: 'MX', flag: '🇲🇽', percentage: 24, streams: 537120, revenue: 2029.0 },
    { country: 'Estados Unidos (US)', code: 'US', flag: '🇺🇸', percentage: 16, streams: 358080, revenue: 1352.0 },
    { country: 'Colombia (CO)', code: 'CO', flag: '🇨🇴', percentage: 9, streams: 201420, revenue: 760.0 },
    { country: 'Argentina (AR)', code: 'AR', flag: '🇦🇷', percentage: 7, streams: 156660, revenue: 591.0 },
    { country: 'Resto del Mundo', code: 'ROW', flag: '🌐', percentage: 6, streams: 134280, revenue: 510.4 },
  ];

  res.json({
    kpis: {
      totalUsers,
      totalArtists,
      totalReleases,
      pendingReleases,
      approvedReleases,
      inDistributionReleases,
      publishedReleases,
      rejectedReleases,
      changesRequestedReleases,
      totalTracks,
      activeDSPs,
      apiErrors,
      totalStreams: 1420500,
      monthlyRevenue: 4850.25,
      platformRevenue: 14250.8,
      paidRoyalties: 48920.5,
      // Artist-specific summary KPIs
      artistTotalStreams: artistRoyalty.totalStreams || 924510,
      artistTotalRevenue: artistRoyalty.totalEarned || 3480.45,
      artistPendingBalance: artistRoyalty.pendingBalance || 420.12,
      artistMonthlyListeners: 152000,
      averageRpm: 3.77,
      streamGrowthRate: 14.8,
      revenueGrowthRate: 14.3,
      peakMonth: 'Septiembre 2026',
    },
    artistRoyalty,
    performanceTrend: filteredTrend,
    releasesPerformance,
    territoryPerformance,
    releaseStatusDistribution: [
      { name: 'Publicados', count: publishedReleases, color: '#10B981' },
      { name: 'En Distribución', count: inDistributionReleases, color: '#3B82F6' },
      { name: 'Pendientes Revisión', count: pendingReleases, color: '#F59E0B' },
      { name: 'Cambios Solicitados', count: changesRequestedReleases, color: '#EC4899' },
      { name: 'Rechazados', count: rejectedReleases, color: '#EF4444' },
      { name: 'Borradores', count: db.releases.filter((r) => r.status === 'draft').length, color: '#6B7280' },
    ],
    monthlyActivity: [
      { month: 'Abr', releases: 12, streams: 420000, revenue: 1850 },
      { month: 'May', releases: 19, streams: 580000, revenue: 2420 },
      { month: 'Jun', releases: 28, streams: 790000, revenue: 3150 },
      { month: 'Jul', releases: 35, streams: 1100000, revenue: 4200 },
      { month: 'Ago', releases: 48, streams: 1450000, revenue: 5300 },
      { month: 'Sep', releases: 54, streams: 1820000, revenue: 6450 },
    ],
  });
});
