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

  const { plan_code = 'starter', tx = null } = req.body || {};
  try {
    const p = await sql`SELECT id FROM plans WHERE code=${plan_code} LIMIT 1`;
    if (p.rows.length === 0) return bad(res, 'Plan invalide', 400);
    const ws = await sql`SELECT w.id FROM workspaces w JOIN workspace_members wm ON wm.workspace_id=w.id WHERE wm.user_id=${user.id} ORDER BY w.created_at ASC LIMIT 1`;
    const planId = p.rows[0].id;
    const workspaceId = ws.rows[0]?.id || null;
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const sub = await sql`
      INSERT INTO subscriptions (user_id, workspace_id, plan_id, status, provider, kkiapay_transaction_id, current_period_start, current_period_end)
      VALUES (${user.id}, ${workspaceId}, ${planId}, 'active', 'kkiapay', ${tx}, NOW(), ${end.toISOString()})
      RETURNING id, status, plan_id
    `;
    return ok(res, { subscription: sub.rows[0] }, 201);
  } catch (e: any) {
    return bad(res, e?.message || 'Erreur abonnement', 500);
  }
}
