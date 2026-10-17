import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticate } from './auth.js';
import { DirectMessage } from '../../src/types.js';

export const messagesRouter = Router();

// GET /api/messages
messagesRouter.get('/', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();

  let userMessages: DirectMessage[] = [];

  if (user.role === 'super_admin' || user.role === 'admin') {
    // Admins see all messages
    userMessages = [...db.directMessages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else {
    // Artist sees messages sent to them, sent to 'all', or sent by them
    userMessages = db.directMessages
      .filter(
        (m) =>
          m.recipientId === user.id ||
          m.recipientId === 'all' ||
          m.senderId === user.id
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const unreadCount = userMessages.filter((m) => !m.isRead && m.recipientId === user.id).length;

  res.json({
    messages: userMessages,
    unreadCount,
  });
});

// POST /api/messages (Send new direct message or announcement)
messagesRouter.post('/', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const { recipientId, subject, content, releaseId, releaseTitle, priority } = req.body;

  if (!subject || !content) {
    return res.status(400).json({ error: 'Asunto y contenido del mensaje son obligatorios' });
  }

  let recipientName = 'Todos los Artistas';
  if (recipientId && recipientId !== 'all') {
    const targetUser = db.users.find((u) => u.id === recipientId);
    if (targetUser) {
      recipientName = targetUser.stageName || targetUser.name;
    }
  }

  const newMessage: DirectMessage = {
    id: 'msg-' + Date.now(),
    senderId: user.id,
    senderName: user.stageName || user.name,
    senderRole: user.role,
    recipientId: recipientId || 'all',
    recipientName,
    subject,
    content,
    releaseId: releaseId || undefined,
    releaseTitle: releaseTitle || undefined,
    isRead: false,
    priority: priority || 'normal',
    createdAt: new Date().toISOString(),
  };

  db.directMessages.unshift(newMessage);

  // If specific recipient, notify them
  if (recipientId && recipientId !== 'all') {
    db.notifications.push({
      id: 'notif-' + Date.now(),
      userId: recipientId,
      title: `Nuevo mensaje de ${user.name} (${user.role === 'super_admin' ? 'Super Admin' : 'Admin'})`,
      message: subject,
      type: priority === 'urgent' ? 'error' : priority === 'important' ? 'warning' : 'info',
      link: '/messages',
      read: false,
      createdAt: new Date().toISOString(),
      emailSent: true,
      emailSubject: `[Sonora] Nuevo comunicado oficial: ${subject}`,
      emailBodyPreview: content.substring(0, 150) + '...',
    });
  } else {
    // Notify all active artists
    const artistUsers = db.users.filter((u) => u.role === 'artist');
    artistUsers.forEach((artist) => {
      db.notifications.push({
        id: 'notif-' + Date.now() + Math.random().toString(36).substring(2, 5),
        userId: artist.id,
        title: `Comunicado General de Sonora: ${subject}`,
        message: content.substring(0, 100) + '...',
        type: 'info',
        link: '/messages',
        read: false,
        createdAt: new Date().toISOString(),
        emailSent: true,
        emailSubject: `[Sonora] Comunicado para sellos y artistas: ${subject}`,
        emailBodyPreview: content.substring(0, 150) + '...',
      });
    });
  }

  // Audit log
  db.auditLogs.push({
    id: 'aud-' + Date.now(),
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    action: 'DIRECT_MESSAGE_SENT',
    entity: 'MESSAGE',
    entityId: newMessage.id,
    details: `Envió mensaje "${subject}" a ${recipientName}`,
    ip: req.ip || '127.0.0.1',
  });

  saveDb();

  res.status(201).json({
    message: newMessage,
    success: true,
  });
});

// PUT /api/messages/:id/read (Mark as read)
messagesRouter.put('/:id/read', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const msg = db.directMessages.find((m) => m.id === req.params.id);

  if (!msg) {
    return res.status(404).json({ error: 'Mensaje no encontrado' });
  }

  msg.isRead = true;
  saveDb();

  res.json({ success: true, message: msg });
});
