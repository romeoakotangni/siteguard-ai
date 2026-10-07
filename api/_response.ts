import type { VercelResponse } from '@vercel/node';

export function ok(res: VercelResponse, data?: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function bad(res: VercelResponse, message = 'Bad Request', status = 400, details?: any) {
  return res.status(status).json({ success: false, error: message, details });
}

export function unauthorized(res: VercelResponse, message = 'Unauthorized') {
  return res.status(401).json({ success: false, error: message });
}

export function forbidden(res: VercelResponse, message = 'Forbidden') {
  return res.status(403).json({ success: false, error: message });
}

export function notFound(res: VercelResponse, message = 'Not Found') {
  return res.status(404).json({ success: false, error: message });
}
