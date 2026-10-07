import { setCors, handleOptions } from '../_cors';
import { ok, bad } from '../_response';
import { requireAuth } from '../middleware/auth';
import { sql } from '@vercel/postgres';
import { runAgent } from './runtime/runner';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);

  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method !== 'POST') return bad(res, 'Method not allowed', 405);

  const { agentId, agentType, websiteId, payload = {} } = req.body || {};
  if (!agentId && !agentType) return bad(res, 'agentId ou agentType requis');

  try {
    const ws = await sql`
      SELECT w.id FROM workspaces w
      JOIN workspace_members wm ON wm.workspace_id=w.id
      WHERE wm.user_id=${user.id}
      ORDER BY w.created_at ASC
      LIMIT 1
    `;
    const workspaceId = ws.rows[0]?.id;
    if (!workspaceId) return bad(res, 'Workspace introuvable', 404);

    if (agentId) {
      const a = await sql`SELECT id,type,status FROM agents WHERE id=${agentId} AND workspace_id=${workspaceId}`;
      if (a.rows.length === 0) return bad(res, 'Agent introuvable', 404);
      await sql`UPDATE agents SET status='running', last_run_at=NOW() WHERE id=${agentId}`;
      const result = await runAgent({ agentType: a.rows[0].type, workspaceId, websiteId, payload });
      await sql`UPDATE agents SET status='idle' WHERE id=${agentId}`;
      return ok(res, { agentId, ...result });
    }

    const result = await runAgent({ agentType, workspaceId, websiteId, payload });
    return ok(res, result);
  } catch (e: any) {
    return bad(res, e?.message || 'Erreur exécution agent', 500);
  }
}
