import { Router, Request, Response } from 'express';
import { authenticate } from './auth.js';
import { getDb, saveDb } from '../db.js';
import { VideoRelease } from '../../src/types.js';

export const videosRouter = Router();

// GET /api/videos - List videos
videosRouter.get('/', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = (req as any).user;
  db.videos = db.videos || [];

  if (user.role === 'artist') {
    const artistVideos = db.videos.filter(
      (v) => v.userId === user.id || (user.id === 'usr-artist-01' && v.userId === 'usr-artist-01')
    );
    return res.json({ videos: artistVideos });
  }

  // Admins & Super Admins see all videos
  return res.json({ videos: db.videos });
});

// GET /api/videos/:id - Single video
videosRouter.get('/:id', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = (req as any).user;
  db.videos = db.videos || [];

  const video = db.videos.find((v) => v.id === req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video no encontrado' });
  }

  if (user.role === 'artist' && video.userId !== user.id) {
    return res.status(403).json({ error: 'No tienes permiso para ver este video' });
  }

  return res.json({ video });
});

// POST /api/videos - Create new video distribution
videosRouter.post('/', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = (req as any).user;
  db.videos = db.videos || [];

  const {
    title,
    artistName,
    featuredArtists = [],
    director = '',
    videoProducer = '',
    isrc,
    upcLinked = '',
    genre = 'Latin / Urban',
    explicit = false,
    videoType = 'official_music_video',
    resolution = '4K_UHD',
    aspectRatio = '16:9',
    durationSeconds = 180,
    videoUrl,
    videoFileName,
    videoFileSizeMB = 450,
    thumbnailUrl,
    thumbnailFileName,
    platforms = ['Vevo', 'Apple Music Video', 'Tidal Video', 'YouTube OAC'],
    vevoChannel = '',
    releaseDate,
    status = 'under_review',
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'El título del video es obligatorio' });
  }

  const newIsrc = isrc?.trim() || 'US-V84-26-' + Math.floor(10000 + Math.random() * 90000);
  const now = new Date().toISOString();

  const newVideo: VideoRelease = {
    id: 'vid-' + Date.now(),
    userId: user.id,
    artistId: user.id === 'usr-artist-01' ? 'art-01' : 'art-' + user.id,
    title: title.trim(),
    artistName: artistName?.trim() || user.stageName || user.name,
    featuredArtists: Array.isArray(featuredArtists) ? featuredArtists : [],
    director: director.trim() || 'Director Oficial',
    videoProducer: videoProducer.trim() || 'Sonora Films',
    isrc: newIsrc,
    upcLinked: upcLinked.trim() || undefined,
    genre,
    explicit: Boolean(explicit),
    videoType,
    resolution,
    aspectRatio,
    durationSeconds: Number(durationSeconds) || 180,
    videoUrl: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoFileName: videoFileName || 'music_video_master_4k.mp4',
    videoFileSizeMB: Number(videoFileSizeMB) || 450,
    thumbnailUrl:
      thumbnailUrl ||
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    thumbnailFileName: thumbnailFileName || 'video_thumbnail.jpg',
    platforms: Array.isArray(platforms) && platforms.length > 0 ? platforms : ['Vevo', 'Apple Music Video', 'YouTube OAC'],
    vevoChannel: vevoChannel.trim() || (artistName ? `${artistName.replace(/\s+/g, '')}VEVO` : undefined),
    releaseDate: releaseDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status,
    viewsCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  db.videos.unshift(newVideo);

  // Notify admins of new video submitted for QC
  const admins = db.users.filter((u) => u.role === 'admin' || u.role === 'super_admin');
  admins.forEach((admin) => {
    db.notifications.unshift({
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      userId: admin.id,
      title: 'Nuevo Video para Revisión QC',
      message: `${newVideo.artistName} envió el videoclip "${newVideo.title}" para distribución en Vevo/Apple Music.`,
      type: 'info',
      read: false,
      createdAt: now,
      emailSent: true,
      emailSubject: `[QC Sonora] Nuevo Video Musical: ${newVideo.title}`,
      emailBodyPreview: `Se ha registrado el videoclip "${newVideo.title}" (${newVideo.resolution}) con ISRC ${newVideo.isrc}.`,
    });
  });

  // Log in audit logs
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    timestamp: now,
    userId: user.id,
    userName: user.name,
    action: 'CREATE_VIDEO_RELEASE',
    entity: 'VideoRelease',
    entityId: newVideo.id,
    details: `Creó distribución de video "${newVideo.title}" con ISRC ${newVideo.isrc} para Vevo/Apple`,
    ip: req.ip || '127.0.0.1',
  });

  saveDb();
  return res.status(201).json({ video: newVideo });
});

// PUT /api/videos/:id - Update video details
videosRouter.put('/:id', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = (req as any).user;
  db.videos = db.videos || [];

  const videoIdx = db.videos.findIndex((v) => v.id === req.params.id);
  if (videoIdx === -1) {
    return res.status(404).json({ error: 'Video no encontrado' });
  }

  const existing = db.videos[videoIdx];
  if (user.role === 'artist' && existing.userId !== user.id) {
    return res.status(403).json({ error: 'No tienes permiso para modificar este video' });
  }

  const updates = req.body;
  const updatedVideo: VideoRelease = {
    ...existing,
    ...updates,
    id: existing.id,
    userId: existing.userId,
    updatedAt: new Date().toISOString(),
  };

  db.videos[videoIdx] = updatedVideo;
  saveDb();

  return res.json({ video: updatedVideo });
});

// POST /api/videos/:id/status - Update QC status (Admin or user resubmitting)
videosRouter.post('/:id/status', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = (req as any).user;
  const { status, reviewNotes } = req.body;
  db.videos = db.videos || [];

  const video = db.videos.find((v) => v.id === req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video no encontrado' });
  }

  // Permission checks
  if (user.role === 'artist') {
    if (video.userId !== user.id && user.id !== 'usr-artist-01') {
      return res.status(403).json({ error: 'No tienes permiso para modificar este video' });
    }
    if (status !== 'under_review' && status !== 'submitted') {
      return res.status(403).json({ error: 'Los artistas solo pueden enviar o reenviar videos a revisión técnica' });
    }
  }

  const now = new Date().toISOString();
  video.status = status;
  if (reviewNotes !== undefined) {
    video.reviewNotes = reviewNotes;
  }
  video.updatedAt = now;

  // If approved or distributed, notify artist
  if (user.role !== 'artist') {
    db.notifications.unshift({
      id: 'notif-' + Date.now(),
      userId: video.userId,
      title: status === 'distributed' ? 'Video Distribuido con Éxito' : `Estado de Video: ${status.toUpperCase()}`,
      message: `Tu videoclip "${video.title}" ha sido actualizado a estado "${status}".`,
      type: status === 'distributed' || status === 'approved' ? 'success' : 'warning',
      read: false,
      createdAt: now,
      emailSent: true,
      emailSubject: `Actualización de Video Musical: ${video.title}`,
    });
  } else {
    // Artist resubmitted video for review - notify admins
    const admins = db.users.filter((u) => u.role === 'admin' || u.role === 'super_admin');
    admins.forEach((admin) => {
      db.notifications.unshift({
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        userId: admin.id,
        title: 'Video Reenviado para Revisión QC',
        message: `${video.artistName} reenvió el videoclip "${video.title}" con correcciones para revisión.`,
        type: 'info',
        read: false,
        createdAt: now,
        emailSent: true,
      });
    });
  }

  saveDb();
  return res.json({ video });
});

// DELETE /api/videos/:id - Delete a video
videosRouter.delete('/:id', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = (req as any).user;
  db.videos = db.videos || [];

  const videoIdx = db.videos.findIndex((v) => v.id === req.params.id);
  if (videoIdx === -1) {
    return res.status(404).json({ error: 'Video no encontrado' });
  }

  const existing = db.videos[videoIdx];
  if (user.role === 'artist' && existing.userId !== user.id && user.id !== 'usr-artist-01') {
    return res.status(403).json({ error: 'No tienes permiso para eliminar este video' });
  }

  db.videos.splice(videoIdx, 1);
  saveDb();

  return res.json({ success: true, message: 'Video eliminado correctamente' });
});
