import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'sonora-super-secret-key-music-distro-2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'artist';
  sessionId: string;
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

export function generateToken(payload: TokenPayload, expiresInMinutes = 60 * 24): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function generateApiKey(): { fullKey: string; keyPrefix: string; keyHash: string } {
  const prefix = 'snr_live_' + crypto.randomBytes(4).toString('hex');
  const secret = crypto.randomBytes(24).toString('hex');
  const fullKey = `${prefix}_${secret}`;
  const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');
  return { fullKey, keyPrefix: prefix, keyHash };
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// In-memory rate limiter per IP/Key
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}
const rateBuckets = new Map<string, RateLimitBucket>();

export function checkRateLimit(key: string, limitPerMinute = 120): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { tokens: limitPerMinute, lastRefill: now };

  const timePassed = now - bucket.lastRefill;
  const refill = Math.floor(timePassed / (60 * 1000 / limitPerMinute));

  if (refill > 0) {
    bucket.tokens = Math.min(limitPerMinute, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    rateBuckets.set(key, bucket);
    return true; // Allowed
  }

  rateBuckets.set(key, bucket);
  return false; // Rate limited
}

export function sanitizeInput(str: string): string {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
