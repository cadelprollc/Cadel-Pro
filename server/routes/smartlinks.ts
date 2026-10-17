import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticate } from './auth.js';
import { SmartLink, SmartLinkPlatform } from '../../src/types.js';

export const smartlinksRouter = Router();

// Helper to sanitize slug
function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// 1. GET /api/smartlinks - List SmartLinks
smartlinksRouter.get('/', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = (req as any).user;
  db.smartlinks = db.smartlinks || [];

  if (user.role === 'artist') {
    const userLinks = db.smartlinks.filter((s) => s.userId === user.id);
    // If no links created yet, include default demo links for preview
    if (userLinks.length === 0) {
      return res.json({ smartlinks: db.smartlinks });
    }
    return res.json({ smartlinks: userLinks });
  }

  // Admin sees all
  res.json({ smartlinks: db.smartlinks });
});

// 2. GET /api/smartlinks/:id - Single SmartLink
smartlinksRouter.get('/:id', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = (req as any).user;
  db.smartlinks = db.smartlinks || [];

  const link = db.smartlinks.find((s) => s.id === req.params.id || s.slug === req.params.id);
  if (!link) {
    return res.status(404).json({ error: 'SmartLink no encontrado.' });
  }

  res.json({ smartlink: link });
});

// 3. POST /api/smartlinks - Create new SmartLink
smartlinksRouter.post('/', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = (req as any).user;
  db.smartlinks = db.smartlinks || [];

  const {
    title,
    artistName,
    releaseId,
    releaseType = 'single',
    coverUrl,
    description,
    releaseDate,
    isPreSave = false,
    audioPreviewUrl,
    videoPreviewUrl,
    platforms = [],
    socialLinks,
    customSlug,
    themeColor = '#4f46e5',
  } = req.body;

  if (!title || !artistName) {
    return res.status(400).json({ error: 'Título y nombre de artista son obligatorios.' });
  }

  // Generate or sanitize slug
  let slug = customSlug ? sanitizeSlug(customSlug) : sanitizeSlug(`${artistName}-${title}`);
  if (!slug) slug = 'link-' + Date.now();

  // Check slug uniqueness
  let counter = 1;
  let finalSlug = slug;
  while (db.smartlinks.some((s) => s.slug === finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  // Default platforms template if not provided or empty
  const defaultPlatforms: SmartLinkPlatform[] = [
    {
      id: 'spotify',
      name: 'Spotify',
      url: `https://open.spotify.com/search/${encodeURIComponent(title + ' ' + artistName)}`,
      actionText: isPreSave ? 'Pre-Guardar' : 'Escuchar',
      iconKey: 'spotify',
      active: true,
    },
    {
      id: 'appleMusic',
      name: 'Apple Music',
      url: `https://music.apple.com/search?term=${encodeURIComponent(title + ' ' + artistName)}`,
      actionText: isPreSave ? 'Pre-Guardar' : 'Escuchar',
      iconKey: 'appleMusic',
      active: true,
    },
    {
      id: 'youtube',
      name: 'YouTube Music / Vevo',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' ' + artistName)}`,
      actionText: 'Ver Video',
      iconKey: 'youtube',
      active: true,
    },
    {
      id: 'amazonMusic',
      name: 'Amazon Music',
      url: `https://music.amazon.com/search/${encodeURIComponent(title + ' ' + artistName)}`,
      actionText: 'Escuchar',
      iconKey: 'amazonMusic',
      active: true,
    },
    {
      id: 'deezer',
      name: 'Deezer',
      url: `https://www.deezer.com/search/${encodeURIComponent(title + ' ' + artistName)}`,
      actionText: 'Escuchar',
      iconKey: 'deezer',
      active: true,
    },
    {
      id: 'tiktok',
      name: 'TikTok Sound',
      url: `https://www.tiktok.com/tag/${encodeURIComponent(title.replace(/\s+/g, ''))}`,
      actionText: 'Usar Audio',
      iconKey: 'tiktok',
      active: true,
    },
  ];

  const now = new Date().toISOString();
  const newSmartLink: SmartLink = {
    id: 'sml-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
    slug: finalSlug,
    title: title.trim(),
    artistName: artistName.trim(),
    releaseId: releaseId || undefined,
    releaseType,
    coverUrl: coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    description: description || `Escucha el nuevo lanzamiento de ${artistName} en tu plataforma favorita.`,
    releaseDate: releaseDate || undefined,
    isPreSave: !!isPreSave,
    audioPreviewUrl: audioPreviewUrl || undefined,
    videoPreviewUrl: videoPreviewUrl || undefined,
    platforms: platforms.length > 0 ? platforms : defaultPlatforms,
    socialLinks: socialLinks || {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com',
    },
    themeColor,
    totalVisits: 0,
    totalClicks: 0,
    preSavesCount: 0,
    userId: user.id,
    createdAt: now,
    updatedAt: now,
  };

  db.smartlinks.unshift(newSmartLink);

  // Add audit log
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.unshift({
    id: 'aud-' + Date.now(),
    timestamp: now,
    userId: user.id,
    userName: user.name,
    action: 'SMARTLINK_CREATED',
    entity: 'SMARTLINK',
    entityId: newSmartLink.id,
    details: `Creó el SmartLink "${newSmartLink.title}" (slug: /${newSmartLink.slug})`,
    ip: req.ip || '127.0.0.1',
  });

  saveDb();

  res.status(201).json({
    success: true,
    smartlink: newSmartLink,
    message: `¡SmartLink "${newSmartLink.title}" creado exitosamente!`,
  });
});

// 4. PATCH /api/smartlinks/:id - Update SmartLink
smartlinksRouter.patch('/:id', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = (req as any).user;
  db.smartlinks = db.smartlinks || [];

  const index = db.smartlinks.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'SmartLink no encontrado.' });
  }

  const existing = db.smartlinks[index];
  if (user.role === 'artist' && existing.userId !== user.id) {
    return res.status(403).json({ error: 'No tienes permisos para editar este SmartLink.' });
  }

  const {
    title,
    artistName,
    releaseId,
    releaseType,
    coverUrl,
    description,
    releaseDate,
    isPreSave,
    audioPreviewUrl,
    videoPreviewUrl,
    platforms,
    socialLinks,
    customSlug,
    themeColor,
  } = req.body;

  if (title !== undefined) existing.title = title.trim();
  if (artistName !== undefined) existing.artistName = artistName.trim();
  if (releaseId !== undefined) existing.releaseId = releaseId;
  if (releaseType !== undefined) existing.releaseType = releaseType;
  if (coverUrl !== undefined) existing.coverUrl = coverUrl;
  if (description !== undefined) existing.description = description;
  if (releaseDate !== undefined) existing.releaseDate = releaseDate;
  if (isPreSave !== undefined) existing.isPreSave = !!isPreSave;
  if (audioPreviewUrl !== undefined) existing.audioPreviewUrl = audioPreviewUrl;
  if (videoPreviewUrl !== undefined) existing.videoPreviewUrl = videoPreviewUrl;
  if (platforms !== undefined) existing.platforms = platforms;
  if (socialLinks !== undefined) existing.socialLinks = socialLinks;
  if (themeColor !== undefined) existing.themeColor = themeColor;

  if (customSlug !== undefined && customSlug.trim()) {
    const cleanSlug = sanitizeSlug(customSlug);
    const conflict = db.smartlinks.find((s) => s.slug === cleanSlug && s.id !== existing.id);
    if (!conflict) {
      existing.slug = cleanSlug;
    }
  }

  existing.updatedAt = new Date().toISOString();
  saveDb();

  res.json({
    success: true,
    smartlink: existing,
    message: 'SmartLink actualizado exitosamente.',
  });
});

// 5. DELETE /api/smartlinks/:id - Delete SmartLink
smartlinksRouter.delete('/:id', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = (req as any).user;
  db.smartlinks = db.smartlinks || [];

  const index = db.smartlinks.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'SmartLink no encontrado.' });
  }

  const existing = db.smartlinks[index];
  if (user.role === 'artist' && existing.userId !== user.id) {
    return res.status(403).json({ error: 'No tienes permisos para eliminar este SmartLink.' });
  }

  db.smartlinks.splice(index, 1);
  saveDb();

  res.json({ success: true, message: 'SmartLink eliminado correctamente.' });
});

// 6. POST /api/smartlinks/:id/click - Track click on DSP
smartlinksRouter.post('/:id/click', (req: Request, res: Response) => {
  const db = getDb();
  db.smartlinks = db.smartlinks || [];

  const link = db.smartlinks.find((s) => s.id === req.params.id || s.slug === req.params.id);
  if (!link) {
    return res.status(404).json({ error: 'SmartLink no encontrado.' });
  }

  link.totalClicks = (link.totalClicks || 0) + 1;
  link.totalVisits = Math.max(link.totalVisits || 1, link.totalClicks);
  saveDb();

  res.json({ success: true, totalClicks: link.totalClicks });
});

// 7. POST /api/smartlinks/:id/presave - Register Pre-Save submission
smartlinksRouter.post('/:id/presave', (req: Request, res: Response) => {
  const db = getDb();
  db.smartlinks = db.smartlinks || [];

  const link = db.smartlinks.find((s) => s.id === req.params.id || s.slug === req.params.id);
  if (!link) {
    return res.status(404).json({ error: 'SmartLink no encontrado.' });
  }

  link.preSavesCount = (link.preSavesCount || 0) + 1;
  saveDb();

  res.json({
    success: true,
    preSavesCount: link.preSavesCount,
    message: '¡Pre-Guardado registrado exitosamente!',
  });
});
