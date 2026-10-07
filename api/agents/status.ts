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

  if (req.method !== 'GET') return bad(res, 'Method not allowed', 405);

  try {
    const ws = await sql`SELECT w.id FROM workspaces w JOIN workspace_members wm ON wm.workspace_id=w.id WHERE wm.user_id=${user.id} ORDER BY w.created_at ASC LIMIT 1`;
    const workspaceId = ws.rows[0]?.id;
    if (!workspaceId) return ok(res, { agents: [] });

    const r = await sql`SELECT id,name,type,status,last_run_at,config FROM agents WHERE workspace_id=${workspaceId} ORDER BY created_at ASC`;
    return ok(res, { agents: r.rows });
  } catch (e: any) {
    return bad(res, e?.message || 'Erreur', 500);
  }
}
