import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticate, requireRole } from './auth.js';
import { Release, Track, ReleaseAuditChange, DistributionLog } from '../../src/types.js';

export const releasesRouter = Router();

// GET /api/releases
releasesRouter.get('/', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const { status, search, limit = 50, page = 1 } = req.query;

  let list = db.releases;

  // Artists only see their own releases
  if (user.role === 'artist') {
    list = list.filter((r) => r.userId === user.id);
  }

  // Filter by status
  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter((r) => r.status === status);
  }

  // Search by title, artist, UPC or ISRC
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.mainArtist.toLowerCase().includes(q) ||
        r.upc?.toLowerCase().includes(q) ||
        r.tracks?.some((t) => t.isrc?.toLowerCase().includes(q) || t.title?.toLowerCase().includes(q))
    );
  }

  // Sort by updatedAt descending
  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  res.json({
    total: list.length,
    releases: list,
  });
});

// GET /api/releases/:id
releasesRouter.get('/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const release = db.releases.find((r) => r.id === req.params.id);

  if (!release) {
    return res.status(404).json({ error: 'Lanzamiento no encontrado' });
  }

  if (user.role === 'artist' && release.userId !== user.id) {
    return res.status(403).json({ error: 'No tienes permiso para ver este lanzamiento' });
  }

  res.json({ release });
});

// POST /api/releases (Create new release in draft)
releasesRouter.post('/', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const {
    title,
    releaseType = 'single',
    mainArtist = user.stageName || user.name,
    featuredArtists = [],
    genre = 'Pop',
    subgenre = '',
    language = 'Spanish',
    releaseDate,
    originalReleaseDate,
    label = 'Sonora Independent',
    catalogNumber = 'SNR-' + Date.now().toString().slice(-6),
    upc,
    pLine,
    cLine,
    territories = 'worldwide',
    platforms = ['Spotify', 'Apple Music', 'Amazon Music', 'YouTube Music', 'Deezer', 'Tidal'],
    explicit = false,
    coverUrl = '',
    coverFileName = '',
    tracks = [],
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'El título del lanzamiento es obligatorio' });
  }

  const releaseId = 'rel-' + Date.now();
  const now = new Date().toISOString();

  // Generate UPC if not provided
  const finalUpc = upc || '843' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

  // Normalize tracks
  const formattedTracks: Track[] = (tracks.length > 0 ? tracks : [
    {
      id: 'trk-' + Date.now(),
      releaseId,
      trackNumber: 1,
      discNumber: 1,
      title,
      isrc: 'ES-A01-26-' + Math.floor(10000 + Math.random() * 90000).toString(),
      durationSeconds: 210,
      explicit: false,
      previewStartTimeSeconds: 30,
      audioUrl: 'https://cdn.freesound.org/previews/511/511484_10672044-lq.mp3',
      audioFormat: 'WAV',
      audioBitrate: '2304 kbps',
      audioSampleRate: '48.0 kHz',
      composers: [user.name],
      lyricists: [user.name],
      producers: [user.stageName || user.name],
      mixers: [],
      masterers: [],
      featuredArtists: [],
      lyricsText: '',
      lyricsSynced: false,
      language: language || 'Spanish',
    },
  ]).map((t: any, idx: number) => ({
    ...t,
    id: t.id || `trk-${Date.now()}-${idx}`,
    releaseId,
    trackNumber: idx + 1,
    discNumber: t.discNumber || 1,
    isrc: t.isrc || 'ES-A01-26-' + Math.floor(10000 + Math.random() * 90000).toString(),
    composers: t.composers || [user.name],
    lyricists: t.lyricists || [],
    producers: t.producers || [],
    mixers: t.mixers || [],
    masterers: t.masterers || [],
    featuredArtists: t.featuredArtists || [],
    language: t.language || language,
  }));

  const newRelease: Release = {
    id: releaseId,
    userId: user.id,
    artistId: user.id,
    title,
    releaseType,
    mainArtist,
    featuredArtists,
    genre,
    subgenre,
    language,
    releaseDate: releaseDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    originalReleaseDate: originalReleaseDate || releaseDate || new Date().toISOString().split('T')[0],
    label,
    catalogNumber,
    upc: finalUpc,
    pLine: pLine || `${new Date().getFullYear()} ${label}`,
    cLine: cLine || `${new Date().getFullYear()} ${mainArtist}`,
    territories,
    platforms,
    explicit,
    coverUrl: coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80',
    coverFileName: coverFileName || 'artwork_3000x3000.jpg',
    coverDimensions: { width: 3000, height: 3000 },
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    tracks: formattedTracks,
    history: [
      {
        id: 'hist-' + Date.now(),
        timestamp: now,
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'Creó el borrador del lanzamiento',
      },
    ],
    distributionLogs: [],
  };

  db.releases.push(newRelease);
  saveDb();

  res.status(201).json({ release: newRelease });
});

// PUT /api/releases/:id (Update metadata)
releasesRouter.put('/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const release = db.releases.find((r) => r.id === req.params.id);

  if (!release) {
    return res.status(404).json({ error: 'Lanzamiento no encontrado' });
  }

  // Permission check
  if (user.role === 'artist' && release.userId !== user.id) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  // Artists can only edit if status is draft or changes_requested
  if (user.role === 'artist' && !['draft', 'changes_requested'].includes(release.status)) {
    return res.status(400).json({
      error: `No puedes modificar un lanzamiento en estado '${release.status}'. Contacta a soporte para correcciones.`,
    });
  }

  const updates = req.body;
  Object.assign(release, updates);
  release.updatedAt = new Date().toISOString();

  // Audit history
  release.history.push({
    id: 'hist-' + Date.now(),
    timestamp: release.updatedAt,
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: 'Actualizó los metadatos del lanzamiento',
  });

  saveDb();
  res.json({ release });
});

// POST /api/releases/:id/submit (User submits to Admin Review queue)
releasesRouter.post('/:id/submit', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const release = db.releases.find((r) => r.id === req.params.id);

  if (!release) {
    return res.status(404).json({ error: 'Lanzamiento no encontrado' });
  }

  if (user.role === 'artist' && release.userId !== user.id) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  // Validation before submission
  if (!release.coverUrl) {
    return res.status(400).json({ error: 'Debes adjuntar la portada oficial (mínimo 3000x3000px)' });
  }

  if (!release.tracks || release.tracks.length === 0) {
    return res.status(400).json({ error: 'Debes incluir al menos una pista de audio' });
  }

  const prevStatus = release.status;
  release.status = 'submitted';
  release.updatedAt = new Date().toISOString();
  release.changeRequestItems = []; // clear prior change requests

  release.history.push({
    id: 'hist-' + Date.now(),
    timestamp: release.updatedAt,
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: 'Envió el lanzamiento a la cola de revisión de Administradores',
    previousStatus: prevStatus,
    newStatus: 'submitted',
  });

  // Notify Admins
  const adminUsers = db.users.filter((u) => u.role === 'admin' || u.role === 'super_admin');
  adminUsers.forEach((admin) => {
    db.notifications.push({
      id: 'notif-' + Date.now() + Math.random().toString(36).slice(2, 6),
      userId: admin.id,
      title: 'Nuevo lanzamiento pendiente de revisión',
      message: `El artista ${release.mainArtist} ha enviado "${release.title}" para control de calidad.`,
      type: 'info',
      link: `/admin/review/${release.id}`,
      read: false,
      createdAt: new Date().toISOString(),
      emailSent: true,
      emailSubject: `[QC Sonora] Nuevo lanzamiento pendiente: ${release.title}`,
      emailBodyPreview: `El lanzamiento "${release.title}" de ${release.mainArtist} requiere verificación de metadatos y audio.`,
    });
  });

  saveDb();
  res.json({
    success: true,
    message: 'Lanzamiento enviado a revisión exitosamente. Nuestro equipo de QC revisará los archivos en un plazo de 24 horas.',
    release,
  });
});

// POST /api/releases/:id/review/start (Admin begins QC)
releasesRouter.post('/:id/review/start', authenticate, requireRole('admin', 'super_admin'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const release = db.releases.find((r) => r.id === req.params.id);

  if (!release) return res.status(404).json({ error: 'Lanzamiento no encontrado' });

  const prevStatus = release.status;
  release.status = 'under_review';
  release.updatedAt = new Date().toISOString();

  release.history.push({
    id: 'hist-' + Date.now(),
    timestamp: release.updatedAt,
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: 'Inició el proceso de control de calidad y revisión',
    previousStatus: prevStatus,
    newStatus: 'under_review',
  });

  saveDb();
  res.json({ release });
});

// POST /api/releases/:id/review/approve (Admin APPROVES release -> Triggers Distribution)
releasesRouter.post('/:id/review/approve', authenticate, requireRole('admin', 'super_admin'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const release = db.releases.find((r) => r.id === req.params.id);
  const { providerId, reviewNotes } = req.body;

  if (!release) return res.status(404).json({ error: 'Lanzamiento no encontrado' });

  const assignedProvider = db.providers.find((p) => p.id === (providerId || release.assignedProviderId || db.settings.defaultProviderId || 'prov-01'));
  const providerName = assignedProvider ? assignedProvider.name : 'FUGA Music Technology';

  const prevStatus = release.status;
  release.status = 'in_distribution';
  release.assignedProviderId = assignedProvider?.id || 'prov-01';
  release.reviewNotes = reviewNotes || 'Aprobado con conformidad en metadatos, audio y derechos fonográficos.';
  release.updatedAt = new Date().toISOString();

  // Generate external release ID
  const externalId = 'EXT-' + (assignedProvider?.code || 'DSP') + '-' + Math.floor(100000 + Math.random() * 900000);
  release.externalReleaseId = externalId;

  // Add history
  release.history.push({
    id: 'hist-' + Date.now(),
    timestamp: release.updatedAt,
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: `Lanzamiento APROBADO por administrador. Enviado a ${providerName}.`,
    previousStatus: prevStatus,
    newStatus: 'in_distribution',
    details: release.reviewNotes,
  });

  // Log distribution transaction
  const distLog: DistributionLog = {
    id: 'dist-' + Date.now(),
    timestamp: release.updatedAt,
    providerId: release.assignedProviderId,
    providerName,
    status: 'delivered',
    externalId,
    message: `Paquete de entrega DDEX/JSON generado exitosamente y transmitido al endpoint ${assignedProvider?.endpoint || 'API'}.`,
    detailsJson: JSON.stringify({
      packageType: assignedProvider?.integrationType || 'REST_JSON',
      upc: release.upc,
      tracksDelivered: release.tracks.length,
      dspsTarget: release.platforms,
      responseCode: 202,
      receiptStatus: 'ACCEPTED_QUEUED_FOR_TRANSCODING',
    }),
  };
  release.distributionLogs.push(distLog);

  // Notify Artist
  db.notifications.push({
    id: 'notif-' + Date.now(),
    userId: release.userId,
    title: '¡Lanzamiento Aprobado! 🚀',
    message: `Tu lanzamiento "${release.title}" ha superado el control de calidad y está en proceso de entrega a ${release.platforms.length} plataformas digitales.`,
    type: 'success',
    link: `/releases/${release.id}`,
    read: false,
    createdAt: release.updatedAt,
    emailSent: true,
    emailSubject: `¡Tu lanzamiento "${release.title}" ha sido APROBADO!`,
    emailBodyPreview: `Enhorabuena, tu música está en camino a Spotify, Apple Music y todas las tiendas seleccionadas.`,
  });

  // Audit log
  db.auditLogs.push({
    id: 'aud-' + Date.now(),
    timestamp: release.updatedAt,
    userId: user.id,
    userName: user.name,
    action: 'RELEASE_APPROVED',
    entity: 'RELEASE',
    entityId: release.id,
    details: `Aprobó "${release.title}" y despachó al proveedor ${providerName} (ID Externo: ${externalId})`,
    ip: req.ip || '127.0.0.1',
  });

  saveDb();
  res.json({
    success: true,
    message: `Lanzamiento aprobado exitosamente. Se ha transmitido la entrega a ${providerName}.`,
    release,
  });
});

// POST /api/releases/:id/review/reject (Admin REJECTS release)
releasesRouter.post('/:id/review/reject', authenticate, requireRole('admin', 'super_admin'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const release = db.releases.find((r) => r.id === req.params.id);
  const { reason } = req.body;

  if (!release) return res.status(404).json({ error: 'Lanzamiento no encontrado' });
  if (!reason) return res.status(400).json({ error: 'Debes indicar el motivo del rechazo' });

  const prevStatus = release.status;
  release.status = 'rejected';
  release.rejectionReason = reason;
  release.updatedAt = new Date().toISOString();

  release.history.push({
    id: 'hist-' + Date.now(),
    timestamp: release.updatedAt,
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: 'Lanzamiento RECHAZADO por el administrador',
    previousStatus: prevStatus,
    newStatus: 'rejected',
    details: reason,
  });

  // Notify Artist
  db.notifications.push({
    id: 'notif-' + Date.now(),
    userId: release.userId,
    title: 'Lanzamiento Rechazado',
    message: `El lanzamiento "${release.title}" ha sido rechazado. Motivo: ${reason}`,
    type: 'error',
    link: `/releases/${release.id}`,
    read: false,
    createdAt: release.updatedAt,
    emailSent: true,
    emailSubject: `Actualización sobre tu lanzamiento: "${release.title}"`,
    emailBodyPreview: `Lamentablemente tu lanzamiento no ha podido ser aprobado. Motivo: ${reason}`,
  });

  saveDb();
  res.json({ release });
});

// POST /api/releases/:id/review/request-changes (Admin REQUESTS CHANGES)
releasesRouter.post('/:id/review/request-changes', authenticate, requireRole('admin', 'super_admin'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const release = db.releases.find((r) => r.id === req.params.id);
  const { items, notes } = req.body;

  if (!release) return res.status(404).json({ error: 'Lanzamiento no encontrado' });
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Debes especificar al menos un cambio requerido' });
  }

  const prevStatus = release.status;
  release.status = 'changes_requested';
  release.changeRequestItems = items;
  release.reviewNotes = notes || '';
  release.updatedAt = new Date().toISOString();

  release.history.push({
    id: 'hist-' + Date.now(),
    timestamp: release.updatedAt,
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: 'Solicitó modificaciones técnicas/metadatos al artista',
    previousStatus: prevStatus,
    newStatus: 'changes_requested',
    details: items.join(' | '),
  });

  // Notify Artist
  db.notifications.push({
    id: 'notif-' + Date.now(),
    userId: release.userId,
    title: 'Se requieren cambios en tu lanzamiento',
    message: `El equipo de revisión ha solicitado ${items.length} corrección(es) en "${release.title}".`,
    type: 'warning',
    link: `/releases/${release.id}`,
    read: false,
    createdAt: release.updatedAt,
    emailSent: true,
    emailSubject: `Acción requerida: modifica los datos de "${release.title}"`,
    emailBodyPreview: `Por favor revisa las instrucciones del equipo de control de calidad para poder continuar con la distribución.`,
  });

  saveDb();
  res.json({ release });
});

// PUT /api/releases/:id/admin-edit (Admin edits metadata directly with change tracking)
releasesRouter.put('/:id/admin-edit', authenticate, requireRole('admin', 'super_admin'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const release = db.releases.find((r) => r.id === req.params.id);

  if (!release) return res.status(404).json({ error: 'Lanzamiento no encontrado' });

  const editableFields = [
    'title',
    'mainArtist',
    'genre',
    'subgenre',
    'language',
    'releaseDate',
    'label',
    'catalogNumber',
    'upc',
    'pLine',
    'cLine',
    'explicit',
    'platforms',
  ];

  const changesDetected: string[] = [];
  const now = new Date().toISOString();

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined && req.body[field] !== (release as any)[field]) {
      const oldVal = String((release as any)[field]);
      const newVal = String(req.body[field]);
      (release as any)[field] = req.body[field];

      changesDetected.push(`${field}: "${oldVal}" → "${newVal}"`);

      release.history.push({
        id: 'hist-' + Date.now() + Math.random().toString(36).slice(2, 5),
        timestamp: now,
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: `Modificó campo de metadata: ${field}`,
        field,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  });

  // Track updates
  if (req.body.tracks && Array.isArray(req.body.tracks)) {
    release.tracks = req.body.tracks;
    changesDetected.push('Pistas y créditos de audio actualizados');
    release.history.push({
      id: 'hist-' + Date.now(),
      timestamp: now,
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'Actualizó información de pistas/compositores/ISRC',
    });
  }

  release.updatedAt = now;

  // Log in global audit log
  db.auditLogs.push({
    id: 'aud-' + Date.now(),
    timestamp: now,
    userId: user.id,
    userName: user.name,
    action: 'METADATA_MANUAL_OVERRIDE',
    entity: 'RELEASE',
    entityId: release.id,
    details: `El administrador ${user.name} editó: ${changesDetected.join(', ')}`,
    ip: req.ip || '127.0.0.1',
  });

  saveDb();
  res.json({
    success: true,
    message: 'Metadatos actualizados y registrados en el historial de auditoría.',
    release,
  });
});

// POST /api/releases/:id/simulate-webhook (Simulate live DSP ingestion / confirmation)
releasesRouter.post('/:id/simulate-webhook', authenticate, requireRole('admin', 'super_admin'), (req: Request, res: Response) => {
  const db = getDb();
  const release = db.releases.find((r) => r.id === req.params.id);
  const { event = 'published' } = req.body;

  if (!release) return res.status(404).json({ error: 'Lanzamiento no encontrado' });

  const now = new Date().toISOString();
  let statusUpdate = release.status;
  let message = '';

  if (event === 'distributed') {
    statusUpdate = 'distributed';
    message = 'DSP Gateway confirmó recepción e inicio de procesamiento en plataformas destino.';
  } else if (event === 'published') {
    statusUpdate = 'published';
    message = 'Lanzamiento oficialmente PUBLICADO y en streaming activo en Spotify, Apple Music y demás tiendas.';
  } else if (event === 'takedown') {
    statusUpdate = 'takedown';
    message = 'Petición de retirada (takedown) procesada con éxito en todos los DSPs.';
  }

  const prev = release.status;
  release.status = statusUpdate;
  release.updatedAt = now;

  release.history.push({
    id: 'hist-' + Date.now(),
    timestamp: now,
    userId: 'system-webhook',
    userName: 'Webhook Receptor de DSP',
    role: 'super_admin',
    action: `Evento Webhook recibido: ${event.toUpperCase()}`,
    previousStatus: prev,
    newStatus: statusUpdate,
    details: message,
  });

  release.distributionLogs.push({
    id: 'dist-' + Date.now(),
    timestamp: now,
    providerId: release.assignedProviderId || 'prov-01',
    providerName: 'FUGA / DSP Gateway',
    status: event === 'published' ? 'published' : 'delivered',
    externalId: release.externalReleaseId || 'EXT-AUTO',
    message,
  });

  // Notify Artist
  db.notifications.push({
    id: 'notif-' + Date.now(),
    userId: release.userId,
    title: event === 'published' ? '🎉 ¡Tu música ya está en vivo!' : 'Actualización de distribución',
    message: message,
    type: 'success',
    link: `/releases/${release.id}`,
    read: false,
    createdAt: now,
    emailSent: true,
    emailSubject: `Actualización de distribución: ${release.title}`,
    emailBodyPreview: message,
  });

  saveDb();
  res.json({ success: true, release });
});
