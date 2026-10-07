import { setCors, handleOptions } from '../_cors';
import { ok } from '../_response';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  setCors(req, res);

  res.setHeader('Set-Cookie', `auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${process.env.NODE_ENV === 'production' ? 'Secure' : ''}`);
  return ok(res, { loggedOut: true });
}
