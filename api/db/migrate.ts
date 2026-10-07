import { sql } from '@vercel/postgres';
import fs from 'node:fs';
import path from 'node:path';
import { setCors, handleOptions } from '../_cors';
import { ok, bad } from '../_response';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);

  try {
    const schemaPath = path.join(process.cwd(), 'api/db/schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    await sql.query(sqlContent);
    return ok(res, { migrated: true });
  } catch (e: any) {
    return bad(res, e?.message || 'Migration failed', 500);
  }
}
