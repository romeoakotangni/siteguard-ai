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

  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  const { name, type, config = {} } = req.body || {};
  if (!name || !type) return bad(res, 'name et type requis');

  const ws = await sql`
    SELECT w.id FROM workspaces w
    LEFT JOIN workspace_members wm ON wm.workspace_id=w.id
    WHERE wm.user_id=${user.id}
    ORDER BY w.created_at ASC
    LIMIT 1
  `;
  const workspaceId = ws.rows[0]?.id;
  if (!workspaceId) return bad(res, 'Workspace introuvable', 404);

  const r = await sql`
    INSERT INTO agents (workspace_id, name, type, config, status)
    VALUES (${workspaceId}, ${name}, ${type}, ${JSON.stringify(config)}::JSONB, 'idle')
    RETURNING *
  `;
  return ok(res, { agent: r.rows[0] }, 201);
}
