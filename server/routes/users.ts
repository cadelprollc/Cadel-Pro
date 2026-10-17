import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticate, requireRole } from './auth.js';
import { hashPassword, sanitizeInput } from '../security.js';
import { User, Role } from '../../src/types.js';

export const usersRouter = Router();

// GET /api/users (Super Admin & Admin)
usersRouter.get('/', authenticate, requireRole('super_admin', 'admin'), (req: Request, res: Response) => {
  const db = getDb();
  const safeUsers: User[] = db.users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    avatarUrl: u.avatarUrl,
    twoFactorEnabled: u.twoFactorEnabled,
    isVerified: u.isVerified,
    status: u.status,
    createdAt: u.createdAt,
    sessions: u.sessions || [],
    stageName: u.stageName,
  }));
  res.json({ users: safeUsers });
});

// POST /api/users (Super Admin creates user)
usersRouter.post('/', authenticate, requireRole('super_admin'), (req: Request, res: Response) => {
  const db = getDb();
  const { name, email, password, role = 'artist', stageName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'El email ya se encuentra registrado' });
  }

  const { hash, salt } = hashPassword(password);
  const userId = 'usr-' + Date.now();
  const newUser = {
    id: userId,
    email: sanitizeInput(email),
    name: sanitizeInput(name),
    role: role as Role,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    twoFactorEnabled: false,
    isVerified: true,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    sessions: [],
    stageName: stageName ? sanitizeInput(stageName) : sanitizeInput(name),
    passwordHash: hash,
    salt,
  };

  db.users.push(newUser);
  saveDb();

  res.status(201).json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      avatarUrl: newUser.avatarUrl,
      twoFactorEnabled: newUser.twoFactorEnabled,
      isVerified: newUser.isVerified,
      status: newUser.status,
      createdAt: newUser.createdAt,
      sessions: [],
      stageName: newUser.stageName,
    },
  });
});

// PUT /api/users/:id (Edit user / role / status)
usersRouter.put('/:id', authenticate, requireRole('super_admin'), (req: Request, res: Response) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { name, role, status, stageName, password } = req.body;
  if (name) user.name = sanitizeInput(name);
  if (role) user.role = role as Role;
  if (status) user.status = status;
  if (stageName !== undefined) user.stageName = sanitizeInput(stageName);

  if (password && password.length >= 8) {
    const { hash, salt } = hashPassword(password);
    user.passwordHash = hash;
    user.salt = salt;
  }

  saveDb();
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      twoFactorEnabled: user.twoFactorEnabled,
      isVerified: user.isVerified,
      status: user.status,
      createdAt: user.createdAt,
      sessions: user.sessions || [],
      stageName: user.stageName,
    },
  });
});

// DELETE /api/users/:id (Suspend/Delete user)
usersRouter.delete('/:id', authenticate, requireRole('super_admin'), (req: Request, res: Response) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  user.status = 'suspended';
  saveDb();
  res.json({ success: true, message: 'Usuario suspendido' });
});
