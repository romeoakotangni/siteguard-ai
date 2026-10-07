import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { forbidden } from '../_response';

export async function hasActiveSubscription(userId: string, workspaceId?: string | null): Promise<boolean> {
  const r = await sql`
    SELECT 1 FROM subscriptions
    WHERE user_id=${userId}
      AND status='active'
      AND (current_period_end IS NULL OR current_period_end > NOW())
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return r.rows.length > 0;
}

export async function requireSubscription(req: VercelRequest, res: VercelResponse, user: any, workspaceId?: string | null): Promise<boolean> {
  if (await hasActiveSubscription(user.id, workspaceId)) return true;
  forbidden(res, 'Abonnement requis pour utiliser cet outil');
  return false;
}
