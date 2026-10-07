import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getJwtSecret } from '../_env';
import { unauthorized } from '../_response';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, getJwtSecret(), {
    expiresIn: '30d',
  });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as any;
    return { id: payload.id, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: VercelRequest): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.substring(7);
  }
  const cookie = req.headers.cookie;
  if (cookie) {
    const match = cookie.match(/auth_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<AuthUser | null> {
  const token = getTokenFromRequest(req);
  if (!token) {
    unauthorized(res);
    return null;
  }
  const user = verifyToken(token);
  if (!user) {
    unauthorized(res);
    return null;
  }
  (req as any).user = user;
  return user;
}
