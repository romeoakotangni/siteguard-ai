import { setCors, handleOptions } from '../_cors';
import { ok, bad } from '../_response';
import { requireAuth } from '../middleware/auth';
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);

  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const u = await sql`SELECT id, name, email, role, created_at FROM users WHERE id=${user.id}`;
    return ok(res, { user: u.rows[0] });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { name } = req.body || {};
    if (!name) return bad(res, 'name requis');
    const u = await sql`UPDATE users SET name=${name}, updated_at=NOW() WHERE id=${user.id} RETURNING id,name,email,role`;
    return ok(res, { user: u.rows[0] });
  }

  return bad(res, 'Method not allowed', 405);
}
