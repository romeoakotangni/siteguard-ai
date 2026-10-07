import crypto from 'node:crypto';
import { setCors, handleOptions } from '../_cors';
import { ok, bad } from '../_response';
import { sql } from '@vercel/postgres';
import { getEnv } from '../_env';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);
  if (req.method !== 'POST') return bad(res, 'Method not allowed', 405);

  try {
    const raw = JSON.stringify(req.body || {});
    const data = req.body || {};
    const transactionId = data.transactionId || data.id || data.reference || data.transaction_id;
    const status = String(data.status || data.transaction_status || data.state || '').toUpperCase();
    const isSuccess = status === 'SUCCESS' || status === 'PAID' || status === 'COMPLETED' || data.success === true;

    if (transactionId) {
      const p = await sql`SELECT id,user_id,workspace_id,plan_code FROM payments WHERE transaction_id=${transactionId}`;
      if (p.rows.length > 0) {
        const payment = p.rows[0];
        await sql`
          UPDATE payments
          SET status=${isSuccess ? 'success' : (status === 'FAILED' || status === 'CANCELLED' ? status.toLowerCase() : 'pending')},
              webhook_data=${raw}::JSONB,
              paid_at=${isSuccess ? 'NOW()' : 'NULL'}
          WHERE id=${payment.id}
        `;
        if (isSuccess) {
          const pl = await sql`SELECT id FROM plans WHERE code=${payment.plan_code} LIMIT 1`;
          if (pl.rows.length > 0) {
            const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await sql`
              INSERT INTO subscriptions (user_id,workspace_id,plan_id,status,provider,kkiapay_transaction_id,current_period_start,current_period_end)
              VALUES (${payment.user_id},${payment.workspace_id},${pl.rows[0].id},'active','kkiapay',${transactionId},NOW(),${end.toISOString()})
            `;
          }
        }
      }
    }
    return ok(res, { received: true });
  } catch (e: any) {
    return bad(res, e?.message || 'Webhook error', 500);
  }
}
