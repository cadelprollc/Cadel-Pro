import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { authRouter } from './server/routes/auth.js';
import { releasesRouter } from './server/routes/releases.js';
import { providersRouter } from './server/routes/providers.js';
import { apiKeysRouter, publicApiV1Router } from './server/routes/api-keys.js';
import { usersRouter } from './server/routes/users.js';
import { settingsRouter } from './server/routes/settings.js';
import { analyticsRouter } from './server/routes/analytics.js';
import { uploadRouter } from './server/routes/upload.js';
import { notificationsRouter } from './server/routes/notifications.js';
import { auditRouter } from './server/routes/audit.js';
import { messagesRouter } from './server/routes/messages.js';
import { royaltiesRouter } from './server/routes/royalties.js';
import { videosRouter } from './server/routes/videos.js';
import { smmRouter } from './server/routes/smm.js';
import { smartlinksRouter } from './server/routes/smartlinks.js';
import { getDb, saveDb } from './server/db.js';

dotenv.config();

const PORT = 3000;
const HOST = '0.0.0.0';

async function startServer() {
  const app = express();

  // Basic security and parsing middleware
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'Sonora Digital Music Distribution API', timestamp: new Date().toISOString() });
  });

  // API Routes Mount
  app.use('/api/auth', authRouter);
  app.use('/api/releases', releasesRouter);
  app.use('/api/providers', providersRouter);
  app.use('/api/api-keys', apiKeysRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/audit-logs', auditRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/royalties', royaltiesRouter);
  app.use('/api/videos', videosRouter);
  app.use('/api/smm', smmRouter);
  app.use('/api/smartlinks', smartlinksRouter);

  // Mount Public Developer v1 API
  app.use('/api/v1', publicApiV1Router);

  // Incoming Webhook endpoint for external DSP & Distribution callbacks
  app.post('/api/webhooks/distribution', (req: Request, res: Response) => {
    const signature = req.headers['x-distro-signature'];
    const { event, externalReleaseId, status, dspCode, timestamp } = req.body;

    console.log(`[Webhook Ingestion] Event: ${event}, ReleaseId: ${externalReleaseId}, Status: ${status}`);

    const db = getDb();
    const release = db.releases.find((r) => r.externalReleaseId === externalReleaseId);

    if (release) {
      if (status === 'LIVE' || event === 'release.published') {
        release.status = 'published';
      } else if (status === 'DELIVERED') {
        release.status = 'distributed';
      }

      release.updatedAt = new Date().toISOString();
      release.distributionLogs.push({
        id: 'dist-' + Date.now(),
        timestamp: new Date().toISOString(),
        providerId: release.assignedProviderId || 'prov-01',
        providerName: dspCode || 'External DSP Webhook',
        status: status === 'LIVE' ? 'published' : 'delivered',
        externalId: externalReleaseId,
        message: `Callback recibido de ${dspCode || 'DSP'}: Estado ${status}`,
      });
      saveDb();
    }

    res.status(200).json({ received: true, acknowledgedAt: new Date().toISOString() });
  });

  // Vite middleware in dev or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`🎵 Sonora Music SaaS Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
