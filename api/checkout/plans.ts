import { setCors, handleOptions } from '../_cors';
import { ok } from '../_response';
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const r = await sql`SELECT id, code, name, price_cfa, interval, features, limits, active, sort_order FROM plans WHERE active=true ORDER BY sort_order ASC`;
  return ok(res, { plans: r.rows });
}
