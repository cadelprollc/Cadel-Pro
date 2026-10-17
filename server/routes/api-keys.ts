import { Router, Request, Response, NextFunction } from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticate, requireRole } from './auth.js';
import { generateApiKey, hashApiKey, checkRateLimit } from '../security.js';
import { ApiKey, ApiRequestLog, Release } from '../../src/types.js';

export const apiKeysRouter = Router();

// GET /api/api-keys
apiKeysRouter.get('/', authenticate, requireRole('super_admin', 'admin'), (req: Request, res: Response) => {
  const db = getDb();
  const keys = db.apiKeys.map(({ keyHash, ...rest }) => rest);
  res.json({ keys });
});

// POST /api/api-keys (Create new API Key)
apiKeysRouter.post('/', authenticate, requireRole('super_admin'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const { name, permissions = ['releases:read', 'releases:write', 'artists:read'], rateLimitPerMinute = 120 } = req.body;

  if (!name) return res.status(400).json({ error: 'El nombre descriptivo de la clave es obligatorio' });

  const { fullKey, keyPrefix, keyHash } = generateApiKey();
  const newKey: ApiKey & { keyHash: string } = {
    id: 'apk-' + Date.now(),
    userId: user.id,
    userName: user.name,
    name,
    keyPrefix,
    keyHash,
    permissions,
    rateLimitPerMinute: Number(rateLimitPerMinute) || 120,
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  db.apiKeys.push(newKey);
  saveDb();

  // Return full secret ONLY ONCE
  res.status(201).json({
    key: {
      ...newKey,
      fullSecretKey: fullKey,
    },
    warning: 'Copia esta clave de inmediato. Por razones de seguridad, no volverá a mostrarse.',
  });
});

// DELETE /api/api-keys/:id (Revoke key)
apiKeysRouter.delete('/:id', authenticate, requireRole('super_admin'), (req: Request, res: Response) => {
  const db = getDb();
  const key = db.apiKeys.find((k) => k.id === req.params.id);
  if (!key) return res.status(404).json({ error: 'Clave no encontrada' });

  key.status = 'revoked';
  saveDb();
  res.json({ success: true, message: 'Clave de API revocada con éxito' });
});

// GET /api/api-logs
apiKeysRouter.get('/logs', authenticate, requireRole('super_admin'), (req: Request, res: Response) => {
  const db = getDb();
  res.json({ logs: db.apiLogs.slice(0, 100) });
});

// ============================================
// PUBLIC DEVELOPER REST API: /api/v1/...
// ============================================
export const publicApiV1Router = Router();

// Middleware: API Key Authentication + Rate Limiting
function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKeyHeader = req.headers['x-api-key'] || req.query.api_key;
  if (!apiKeyHeader || typeof apiKeyHeader !== 'string') {
    return res.status(401).json({
      error: 'API_KEY_MISSING',
      message: 'Debes enviar la cabecera "X-API-Key: snr_live_..." para consumir la API v1.',
    });
  }

  const hash = hashApiKey(apiKeyHeader);
  const db = getDb();
  const keyRecord = db.apiKeys.find((k) => k.keyHash === hash && k.status === 'active');

  if (!keyRecord) {
    return res.status(401).json({
      error: 'INVALID_API_KEY',
      message: 'Clave de API no válida o revocada.',
    });
  }

  // Check rate limit
  const allowed = checkRateLimit(keyRecord.keyPrefix, keyRecord.rateLimitPerMinute);
  res.setHeader('X-RateLimit-Limit', keyRecord.rateLimitPerMinute);

  if (!allowed) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: `Has superado el límite de ${keyRecord.rateLimitPerMinute} peticiones por minuto.`,
    });
  }

  keyRecord.lastUsedAt = new Date().toISOString();

  // Log API Request
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logItem: ApiRequestLog = {
      id: 'log-' + Date.now() + Math.random().toString(36).slice(2, 5),
      timestamp: new Date().toISOString(),
      apiKeyPrefix: keyRecord.keyPrefix,
      endpoint: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip || '127.0.0.1',
    };
    db.apiLogs.unshift(logItem);
    if (db.apiLogs.length > 300) db.apiLogs.pop();
    saveDb();
  });

  (req as any).apiKey = keyRecord;
  next();
}

publicApiV1Router.use(authenticateApiKey);

// GET /api/v1/releases
publicApiV1Router.get('/releases', (req: Request, res: Response) => {
  const db = getDb();
  const { status, limit = 20 } = req.query;
  let list = db.releases;
  if (status) list = list.filter((r) => r.status === status);
  res.json({
    data: list.slice(0, Number(limit)),
    meta: { count: list.length, apiVersion: 'v1.2' },
  });
});

// GET /api/v1/releases/:id
publicApiV1Router.get('/releases/:id', (req: Request, res: Response) => {
  const db = getDb();
  const release = db.releases.find((r) => r.id === req.params.id);
  if (!release) return res.status(404).json({ error: 'Release not found' });
  res.json({ data: release });
});

// GET /api/v1/artists
publicApiV1Router.get('/artists', (req: Request, res: Response) => {
  const db = getDb();
  res.json({ data: db.artists });
});

// POST /api/v1/releases (Create via API)
publicApiV1Router.post('/releases', (req: Request, res: Response) => {
  const key: ApiKey = (req as any).apiKey;
  if (!key.permissions.includes('releases:write')) {
    return res.status(403).json({ error: 'PERMISSION_DENIED', message: 'Tu clave no tiene permiso releases:write' });
  }

  const db = getDb();
  const { title, mainArtist, genre = 'Pop', tracks = [] } = req.body;
  if (!title || !mainArtist) {
    return res.status(400).json({ error: 'Fields "title" and "mainArtist" are mandatory.' });
  }

  const releaseId = 'rel-api-' + Date.now();
  const now = new Date().toISOString();
  const newRel: Release = {
    id: releaseId,
    userId: key.userId,
    artistId: 'art-01',
    title,
    releaseType: 'single',
    mainArtist,
    featuredArtists: [],
    genre,
    subgenre: '',
    language: 'Spanish',
    releaseDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    originalReleaseDate: new Date().toISOString().split('T')[0],
    label: 'API Ingestion Label',
    catalogNumber: 'API-' + Date.now().toString().slice(-5),
    upc: '843' + Math.floor(1000000000 + Math.random() * 9000000000),
    pLine: `${new Date().getFullYear()} Sonora Group`,
    cLine: `${new Date().getFullYear()} ${mainArtist}`,
    territories: 'worldwide',
    platforms: ['Spotify', 'Apple Music', 'Amazon Music'],
    explicit: false,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80',
    coverDimensions: { width: 3000, height: 3000 },
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    tracks: tracks.length > 0 ? tracks : [
      {
        id: 'trk-' + Date.now(),
        releaseId,
        trackNumber: 1,
        discNumber: 1,
        title,
        isrc: 'ES-A01-26-' + Math.floor(10000 + Math.random() * 90000),
        durationSeconds: 180,
        explicit: false,
        previewStartTimeSeconds: 30,
        composers: [mainArtist],
        lyricists: [],
        producers: [mainArtist],
        mixers: [],
        masterers: [],
        featuredArtists: [],
        language: 'Spanish',
      },
    ],
    history: [
      {
        id: 'hist-' + Date.now(),
        timestamp: now,
        userId: key.userId,
        userName: `API Key (${key.name})`,
        role: 'super_admin',
        action: 'Creado mediante REST API v1',
      },
    ],
    distributionLogs: [],
  };

  db.releases.push(newRel);
  saveDb();
  res.status(201).json({ data: newRel, message: 'Lanzamiento creado exitosamente en modo borrador vía API.' });
});
