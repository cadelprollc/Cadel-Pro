import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticate } from './auth.js';

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get('/', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();

  const userNotifs = db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    notifications: userNotifs,
    unreadCount: userNotifs.filter((n) => !n.read).length,
  });
});

// PUT /api/notifications/:id/read
notificationsRouter.put('/:id/read', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const notif = db.notifications.find((n) => n.id === req.params.id && n.userId === user.id);

  if (notif) {
    notif.read = true;
    saveDb();
  }

  res.json({ success: true });
});

// POST /api/notifications/read-all
notificationsRouter.post('/read-all', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  db.notifications.filter((n) => n.userId === user.id).forEach((n) => (n.read = true));
  saveDb();
  res.json({ success: true });
});
