import { setCors, handleOptions } from '../_cors';
import { ok } from '../_response';
import { requireAuth } from '../middleware/auth';
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const u = await sql`SELECT id, name, email, role, created_at FROM users WHERE id=${user.id}`;
    const ws = await sql`
      SELECT w.id, w.name
      FROM workspaces w
      LEFT JOIN workspace_members wm ON wm.workspace_id=w.id
      WHERE wm.user_id=${user.id}
      ORDER BY w.created_at ASC
      LIMIT 1
    `;
    return ok(res, { user: u.rows[0] || user, workspace: ws.rows[0] || null });
  } catch {
    return ok(res, { user });
  }
}
