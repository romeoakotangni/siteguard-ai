import { setCors, handleOptions } from '../_cors';
import { ok, bad } from '../_response';
import { requireAuth } from '../middleware/auth';
import { sql } from '@vercel/postgres';
import { getEnv, isSandbox } from '../_env';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);

  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  try {
    const { plan_code = 'pro', amount_cfa = 50000 } = req.body || {};
    const transactionId = `SG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const ws = await sql`
      SELECT w.id FROM workspaces w
      LEFT JOIN workspace_members wm ON wm.workspace_id=w.id
      WHERE wm.user_id=${user.id}
      ORDER BY w.created_at ASC
      LIMIT 1
    `;
    const workspaceId = ws.rows[0]?.id || null;

    await sql`
      INSERT INTO payments (user_id, workspace_id, plan_code, amount_cfa, provider, status, transaction_id, reference)
      VALUES (${user.id}, ${workspaceId}, ${plan_code}, ${amount_cfa}, 'kkiapay', 'pending', ${transactionId}, ${transactionId})
    `;

    const publicKey = getEnv('VITE_KKIAPAY_PUBLIC_KEY') || getEnv('KKIAPAY_PUBLIC_KEY') || '';
    const callback = `${getEnv('APP_URL', 'http://localhost:5173')}/billing?status=success&tx=${transactionId}`;
    const webhook = `${getEnv('APP_URL', 'http://localhost:5173')}/api/kkiapay/webhook`;
    const sandbox = isSandbox();

    return ok(res, {
      transactionId,
      publicKey,
      amount_cfa,
      callback,
      webhook,
      sandbox,
      plan_code
    });
  } catch (e: any) {
    return bad(res, e?.message || 'Erreur création checkout', 500);
  }
}
