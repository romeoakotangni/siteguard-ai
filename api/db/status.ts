import { setCors, handleOptions } from '../_cors';
import { ok, bad } from '../_response';
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);

  try {
    const result = await sql`SELECT 1 as ok`;
    return ok(res, { db: result.rows.length > 0 ? 'ok' : 'down' });
  } catch (e: any) {
    return bad(res, e?.message || 'DB error', 500);
  }
}
