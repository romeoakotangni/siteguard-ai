import crypto from 'node:crypto';
import type { VercelRequest } from '@vercel/node';

export function getClientIp(req: VercelRequest): string | undefined {
  const ip = (req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || req.socket?.remoteAddress;
  return ip ? ip.split(',')[0].trim() : undefined;
}

export function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}
