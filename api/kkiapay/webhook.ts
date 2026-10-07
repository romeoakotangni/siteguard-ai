import crypto from 'node:crypto';
import { setCors, handleOptions } from '../_cors';
import { ok, bad } from '../_response';
import { sql } from '@vercel/postgres';
import { getEnv } from '../_env';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function verifySignature(body: string, signature?: string | string[]): boolean {
  const secret = getEnv('KKIAPAY_WEBHOOK_SECRET') || '';
  if (!secret || !signature) return false;
  const sig = Array.isArray(signature) ? signature[0] : signature;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const computed = hmac.digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(String(sig)));
  } catch {
    return computed === String(sig);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);

  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  try {
    const raw = JSON.stringify(req.body || {});
    const signature = req.headers['x-kkiapay-signature'] || req.headers['x-signature'];

    const data = req.body || {};
    const transactionId = data.transactionId || data.id || data.reference;
    const status = String(data.status || data.transaction_status || '').toUpperCase();

    if (!transactionId) {
      return bad(res, 'transactionId manquant', 400);
    }

    const p = await sql`SELECT id, user_id, workspace_id, plan_code, amount_cfa FROM payments WHERE transaction_id=${transactionId}`;
    if (p.rows.length === 0) {
      return bad(res, 'Paiement introuvable', 404);
    }
    const payment = p.rows[0];

    const isSuccess = status === 'SUCCESS' || status === 'PAID' || status === 'COMPLETED';

    await sql`
      UPDATE payments
      SET status=${isSuccess ? 'success' : (status === 'FAILED' || status === 'CANCELLED' ? status.toLowerCase() : 'pending')},
          webhook_data=${raw}::JSONB,
          paid_at=${isSuccess ? 'NOW()' : 'NULL'}
      WHERE id=${payment.id}
    `;

    if (isSuccess) {
      const plans = await sql`SELECT id FROM plans WHERE code=${payment.plan_code} LIMIT 1`;
      if (plans.rows.length > 0) {
        const planId = plans.rows[0].id;
        const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await sql`
          INSERT INTO subscriptions (user_id, workspace_id, plan_id, status, provider, kkiapay_transaction_id, current_period_start, current_period_end)
          VALUES (${payment.user_id}, ${payment.workspace_id}, ${planId}, 'active', 'kkiapay', ${transactionId}, NOW(), ${end.toISOString()})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    return ok(res, { received: true });
  } catch (e: any) {
    return bad(res, e?.message || 'Erreur webhook', 500);
  }
}
