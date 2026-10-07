import { setCors, handleOptions } from '../_cors';
import { ok, bad } from '../_response';
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);

  try {
    const r = await sql`SELECT NOW() as now, 1+1 as calc`;
    return ok(res, { rows: r.rows });
  } catch (e: any) {
    return bad(res, e?.message || 'DB test failed', 500);
  }
}
