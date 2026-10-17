import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticate, requireRole } from './auth.js';

export const settingsRouter = Router();

// GET /api/settings (Public / Authenticated to retrieve platform branding)
settingsRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  res.json({ settings: db.settings });
});

// PUT /api/settings (Super Admin only: logo, colors, name, comisiones, planes)
settingsRouter.put('/', authenticate, requireRole('super_admin'), (req: Request, res: Response) => {
  const db = getDb();
  const user = (req as any).user;

  Object.assign(db.settings, req.body);
  saveDb();

  db.auditLogs.push({
    id: 'aud-' + Date.now(),
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    action: 'PLATFORM_SETTINGS_UPDATED',
    entity: 'SETTINGS',
    entityId: 'global',
    details: 'El Super Admin modificó la configuración de apariencia, marca o comisiones de la plataforma.',
    ip: req.ip || '127.0.0.1',
  });

  res.json({ settings: db.settings, message: 'Configuración guardada exitosamente' });
});
