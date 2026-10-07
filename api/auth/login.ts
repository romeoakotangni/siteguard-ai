import { sql } from '@vercel/postgres';
import { setCors, handleOptions } from '../_cors';
import { ok, bad, unauthorized } from '../_response';
import { verifyPassword } from '../_utils';
import { signToken } from '../middleware/auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);

  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return bad(res, 'email et password requis');
    }

    const result = await sql`SELECT id, name, email, role, password_hash FROM users WHERE LOWER(email)=LOWER(${email})`;
    if (result.rows.length === 0) {
      return unauthorized(res, 'Identifiants invalides');
    }

    const user = result.rows[0];
    if (!verifyPassword(password, user.password_hash)) {
      return unauthorized(res, 'Identifiants invalides');
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.setHeader('Set-Cookie', `auth_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; ${process.env.NODE_ENV === 'production' ? 'Secure' : ''}`);

    const { password_hash, ...safe } = user;
    return ok(res, { user: safe, token });
  } catch (e: any) {
    return bad(res, e?.message || 'Erreur connexion', 500);
  }
}
