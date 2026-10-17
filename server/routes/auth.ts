import { Router, Request, Response, NextFunction } from 'express';
import { getDb, saveDb } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  TokenPayload,
  sanitizeInput,
} from '../security.js';
import { Role, User } from '../../src/types.js';

export const authRouter = Router();

// Middleware to extract authenticated user
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado: token ausente' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  const db = getDb();
  const user = db.users.find((u) => u.id === payload.userId && u.status === 'active');
  if (!user) {
    return res.status(401).json({ error: 'Usuario inexistente o suspendido' });
  }

  (req as any).user = user;
  (req as any).tokenPayload = payload;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user: User = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        error: `Acceso restringido: requiere rol ${roles.join(' o ')}`,
      });
    }
    next();
  };
}

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password, twoFactorCode } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Tu cuenta ha sido suspendida. Contacta a soporte.' });
  }

  // Allow standard demo passwords or hash verification
  const isDefaultDemoPass =
    password === 'admin123' ||
    password === 'artist123' ||
    password === 'password123' ||
    password === 'AdminPass123!' ||
    password === 'ReviewerPass123!' ||
    password === 'ArtistPass123!';
  const validPassword = isDefaultDemoPass || verifyPassword(password, user.passwordHash, user.salt);
  if (!validPassword) {
    return res.status(401).json({ error: 'Credenciales inválidas. Comprueba tu correo y contraseña.' });
  }

  // 2FA check if enabled (Demo allows direct login with demo passwords or code)
  if (user.twoFactorEnabled && !twoFactorCode && !isDefaultDemoPass) {
    return res.status(200).json({
      requiresTwoFactor: true,
      message: 'Ingresa el código de autenticación en dos pasos (2FA). (Demo: usa 123456)',
    });
  }

  if (user.twoFactorEnabled && twoFactorCode && twoFactorCode !== '123456') {
    return res.status(401).json({ error: 'Código 2FA incorrecto (Usa 123456 para demo)' });
  }

  // Generate session
  const sessionId = 'sess-' + Date.now();
  const session = {
    id: sessionId,
    device: req.headers['user-agent']?.includes('Mobile') ? 'Dispositivo Móvil' : 'Navegador Web / Desktop',
    browser: req.headers['user-agent'] || 'Desconocido',
    ip: req.ip || '127.0.0.1',
    lastActive: new Date().toISOString(),
    current: true,
  };

  user.sessions = [session, ...(user.sessions || []).slice(0, 4)];
  saveDb();

  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId,
  };

  const token = generateToken(tokenPayload);

  // Return safe user without hash/salt
  const safeUser: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    twoFactorEnabled: user.twoFactorEnabled,
    isVerified: user.isVerified,
    status: user.status,
    createdAt: user.createdAt,
    sessions: user.sessions,
    stageName: user.stageName,
  };

  res.json({ token, user: safeUser });
});

// POST /api/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  const { name, email, password, stageName, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const db = getDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico' });
  }

  const { hash, salt } = hashPassword(password);
  const userId = 'usr-' + Date.now();
  const assignedRole: Role = role === 'admin' ? 'admin' : 'artist';

  const newUser = {
    id: userId,
    email: sanitizeInput(email),
    name: sanitizeInput(name),
    role: assignedRole,
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    twoFactorEnabled: false,
    isVerified: true, // auto-verified for onboarding ease
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    sessions: [],
    stageName: stageName ? sanitizeInput(stageName) : sanitizeInput(name),
    passwordHash: hash,
    salt,
  };

  db.users.push(newUser);

  // If artist, create profile
  if (assignedRole === 'artist') {
    const artistId = 'art-' + Date.now();
    db.artists.push({
      id: artistId,
      userId,
      stageName: newUser.stageName,
      legalName: newUser.name,
      country: 'España',
      verified: true,
      totalReleases: 0,
    });
  }

  // Add welcome notification
  db.notifications.push({
    id: 'notif-' + Date.now(),
    userId,
    title: '¡Bienvenido a Sonora!',
    message: 'Tu cuenta ha sido creada exitosamente. Ya puedes configurar tu perfil de artista y subir tu primer lanzamiento.',
    type: 'success',
    read: false,
    createdAt: new Date().toISOString(),
    emailSent: true,
    emailSubject: 'Bienvenido a la plataforma de distribución musical Sonora',
    emailBodyPreview: `Hola ${newUser.name}, tu registro ha sido completado con éxito.`,
  });

  saveDb();

  const tokenPayload: TokenPayload = {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
    sessionId: 'sess-' + Date.now(),
  };

  const token = generateToken(tokenPayload);

  const safeUser: User = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    avatarUrl: newUser.avatarUrl,
    twoFactorEnabled: newUser.twoFactorEnabled,
    isVerified: newUser.isVerified,
    status: newUser.status,
    createdAt: newUser.createdAt,
    sessions: newUser.sessions,
    stageName: newUser.stageName,
  };

  res.status(201).json({ token, user: safeUser });
});

// GET /api/auth/me
authRouter.get('/me', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const safeUser: User = {
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
  };
  res.json({ user: safeUser });
});

// POST /api/auth/logout
authRouter.post('/logout', authenticate, (req: Request, res: Response) => {
  res.json({ success: true, message: 'Sesión finalizada correctamente' });
});

// POST /api/auth/switch-demo-role (Convenience endpoint for role testing)
authRouter.post('/switch-demo-role', (req: Request, res: Response) => {
  const { role } = req.body;
  const db = getDb();
  let targetUser: any = null;

  if (role === 'super_admin') {
    targetUser = db.users.find((u) => u.role === 'super_admin');
  } else if (role === 'admin') {
    targetUser = db.users.find((u) => u.role === 'admin');
  } else {
    targetUser = db.users.find((u) => u.role === 'artist');
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'Usuario para el rol no encontrado' });
  }

  const tokenPayload: TokenPayload = {
    userId: targetUser.id,
    email: targetUser.email,
    role: targetUser.role,
    sessionId: 'sess-' + Date.now(),
  };

  const token = generateToken(tokenPayload);

  const safeUser: User = {
    id: targetUser.id,
    email: targetUser.email,
    name: targetUser.name,
    role: targetUser.role,
    avatarUrl: targetUser.avatarUrl,
    twoFactorEnabled: targetUser.twoFactorEnabled,
    isVerified: targetUser.isVerified,
    status: targetUser.status,
    createdAt: targetUser.createdAt,
    sessions: targetUser.sessions || [],
    stageName: targetUser.stageName,
  };

  res.json({ token, user: safeUser });
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  // Always return success to prevent email enumeration attacks
  res.json({
    success: true,
    message: 'Si el correo está registrado, recibirás un enlace seguro para restablecer tu contraseña.',
    previewToken: 'snr_rst_' + Date.now(),
  });
});

// POST /api/auth/toggle-2fa
authRouter.post('/toggle-2fa', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const target = db.users.find((u) => u.id === user.id);
  if (target) {
    target.twoFactorEnabled = !target.twoFactorEnabled;
    saveDb();
    res.json({
      twoFactorEnabled: target.twoFactorEnabled,
      message: target.twoFactorEnabled
        ? 'Autenticación en dos pasos (2FA) activada'
        : 'Autenticación en dos pasos (2FA) desactivada',
    });
  } else {
    res.status(404).json({ error: 'Usuario no encontrado' });
  }
});
