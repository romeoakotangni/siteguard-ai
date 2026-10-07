import { sql } from '@vercel/postgres';
import { setCors, handleOptions } from '../_cors';
import { ok, bad, unauthorized } from '../_response';
import { hashPassword, generateId } from '../_utils';
import { signToken } from '../middleware/auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);

  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return bad(res, 'name, email, password requis');
    }
    if (password.length < 8) {
      return bad(res, 'Mot de passe >= 8 caractères');
    }

    const exists = await sql`SELECT id FROM users WHERE LOWER(email)=LOWER(${email})`;
    if (exists.rows.length > 0) {
      return bad(res, 'Email déjà utilisé', 409);
    }

    const password_hash = hashPassword(password);
    const result = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${password_hash})
      RETURNING id, name, email, role, created_at
    `;

    const user = result.rows[0];
    const workspace = await sql`
      INSERT INTO workspaces (name, owner_id)
      VALUES (${name + "'s Workspace"}, ${user.id})
      RETURNING id
    `;
    await sql`
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES (${workspace.rows[0].id}, ${user.id}, 'owner')
    `;

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.setHeader('Set-Cookie', `auth_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; ${process.env.NODE_ENV === 'production' ? 'Secure' : ''}`);

    return ok(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token, workspace: workspace.rows[0] }, 201);
  } catch (e: any) {
    return bad(res, e?.message || 'Erreur inscription', 500);
  }
}
