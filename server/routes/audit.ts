import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authenticate, requireRole } from './auth.js';

export const auditRouter = Router();

// GET /api/audit-logs (Super Admin & Admin only)
auditRouter.get('/', authenticate, requireRole('super_admin', 'admin'), (req: Request, res: Response) => {
  const db = getDb();
  const { entity, action, limit = 100 } = req.query;

  let logs = db.auditLogs;
  if (entity && typeof entity === 'string') {
    logs = logs.filter((l) => l.entity === entity);
  }
  if (action && typeof action === 'string') {
    logs = logs.filter((l) => l.action === action);
  }

  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({ logs: logs.slice(0, Number(limit)) });
});
