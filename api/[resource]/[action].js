import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

const OK = (res, data = null, status = 200) => res.status(status).json({ success: true, data });
const KO = (res, error = 'Bad Request', status = 400, details) =>
  res.status(status).json({ success: false, error, details });

function setCors(req, res) {
  const allowed = [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter(Boolean);
  const origin = req.headers.origin;
  const chosen = origin && allowed.includes(origin) ? origin : allowed[0];
  if (chosen) res.setHeader('Access-Control-Allow-Origin', chosen);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const env = (name, fallback) => process.env[name] ?? fallback;
const appUrl = () => env('APP_URL', 'http://localhost:5173');
const jwtSecret = () => {
  if (!process.env.JWT_SECRET) throw new Error('Missing environment variable: JWT_SECRET');
  return process.env.JWT_SECRET;
};

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  try {
    const [salt, hash] = String(stored).split(':');
    if (!salt || !hash) return false;
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret(), { expiresIn: '30d' });
}

function verifyToken(token) {
  try {
    const p = jwt.verify(token, jwtSecret());
    return { id: p.id, email: p.email, role: p.role };
  } catch {
    return null;
  }
}

function getToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.substring(7);
  const cookie = req.headers.cookie;
  if (cookie) {
    const m = cookie.match(/auth_token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

function setAuthCookie(res, token) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  res.setHeader(
    'Set-Cookie',
    `auth_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; ${secure}`.trim()
  );
}

function requireAuth(req, res) {
  const token = getToken(req);
  const user = token ? verifyToken(token) : null;
  if (!user) {
    KO(res, 'Unauthorized', 401);
    return null;
  }
  req.user = user;
  return user;
}

async function firstWorkspace(userId) {
  const r = await sql`
    SELECT w.id FROM workspaces w
    LEFT JOIN workspace_members wm ON wm.workspace_id=w.id
    WHERE wm.user_id=${userId}
    ORDER BY w.created_at ASC
    LIMIT 1
  `;
  return r.rows[0]?.id || null;
}

async function hasActiveSubscription(userId) {
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

let lastProviderError = null;

async function callOpenRouter(prompt) {
  const key = env('OPENROUTER_API_KEY');
  if (!key) {
    lastProviderError = 'OPENROUTER_API_KEY manquante';
    return null;
  }
  const model = env('DEFAULT_AGENT_MODEL', 'nvidia/nemotron-3-ultra-550b-a55b:free');
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': appUrl(),
        'X-Title': 'SiteGuard AI',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are SiteGuard AI agent. Be precise, actionable, safe.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      lastProviderError = `OpenRouter HTTP ${r.status}: ${text.slice(0, 200)}`;
      return null;
    }
    const data = await r.json();
    const msg = data?.choices?.[0]?.message;
    let output = (msg?.content || '').trim();
    if (!output && msg?.reasoning) output = `[reasoning] ${String(msg.reasoning).trim().slice(0, 1500)}`;
    if (!output) {
      lastProviderError = `OpenRouter: reponse vide (finish=${data?.choices?.[0]?.finish_reason})`;
      return null;
    }
    return { output, model, usage: data?.usage };
  } catch (e) {
    lastProviderError = `OpenRouter exception: ${e?.message || String(e)}`;
    return null;
  }
}

function fallbackOutput(prompt) {
  return `Agent analysis (heuristic fallback):

${prompt}

Recommended actions:
- Verify HTTP status/caching/redirects
- Check Core Web Vitals (LCP/CLS/INP)
- Validate metadata, links, forms, security headers
- Propose safe, reviewable fixes with confidence
`;
}

async function runAgent({ agentType, workspaceId, websiteId, payload }) {
  const prompt = `Agent: ${agentType}
Workspace: ${workspaceId}
Website: ${websiteId || 'general'}
Payload: ${JSON.stringify(payload || {})}
Task: Analyze and return structured findings (JSON-like with findings[], actions[], confidence).`;
  const res = await callOpenRouter(prompt);
  if (res) return { ok: true, provider: 'openrouter', model: res.model, output: res.output, usage: res.usage };
  return { ok: true, provider: 'fallback', model: 'heuristic', output: fallbackOutput(prompt), debug: lastProviderError };
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  PRIMARY KEY (workspace_id, user_id)
);
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_cfa INTEGER NOT NULL DEFAULT 0,
  interval TEXT NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly','yearly')),
  features JSONB NOT NULL DEFAULT '{}'::JSONB,
  limits JSONB NOT NULL DEFAULT '{}'::JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO plans (code, name, price_cfa, interval, features, limits, sort_order) VALUES
('starter', 'Starter', 0, 'monthly', '{"websites":1,"issues":"unlimited","agents":"basic"}', '{"websites":1}', 1),
('pro', 'Pro', 50000, 'monthly', '{"websites":50,"issues":"unlimited","agents":"advanced","priority_support":true}', '{"websites":50}', 2),
('agency', 'Agency', 150000, 'monthly', '{"websites":100,"issues":"unlimited","agents":"all","white_label":true,"priority_support":true}', '{"websites":100}', 3)
ON CONFLICT (code) DO NOTHING;
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive','trial','active','past_due','cancelled','expired')),
  provider TEXT NOT NULL DEFAULT 'kkiapay' CHECK (provider IN ('kkiapay','stripe','manual')),
  kkiapay_transaction_id TEXT,
  kkiapay_reference TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_kkiapay_tx ON subscriptions(kkiapay_transaction_id);
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','scanning','healthy','warning','critical','error')),
  health_score INTEGER NOT NULL DEFAULT 0,
  issues_count INTEGER NOT NULL DEFAULT 0,
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_websites_workspace_id ON websites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON websites(domain);
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','ignored','closed')),
  impact TEXT,
  suggestion TEXT,
  auto_fixable BOOLEAN NOT NULL DEFAULT false,
  detected_by TEXT NOT NULL DEFAULT 'agent',
  path TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_issues_website_id ON issues(website_id);
CREATE INDEX IF NOT EXISTS idx_issues_workspace_id ON issues(workspace_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','running','paused','error')),
  last_run_at TIMESTAMPTZ,
  config JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agents_workspace_id ON agents(workspace_id);
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  pages_scanned INTEGER NOT NULL DEFAULT 0,
  issues_found INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scans_website_id ON scans(website_id);
CREATE INDEX IF NOT EXISTS idx_scans_workspace_id ON scans(workspace_id);
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','critical')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  trigger TEXT NOT NULL,
  action JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automations_workspace_id ON automations(workspace_id);
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL,
  amount_cfa INTEGER NOT NULL,
  provider TEXT NOT NULL DEFAULT 'kkiapay',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','cancelled','refunded')),
  transaction_id TEXT UNIQUE,
  reference TEXT,
  callback_data JSONB,
  webhook_data JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
`;

const requireMethod = (req, res, method) => {
  if (req.method !== method) {
    KO(res, 'Method not allowed', 405);
    return false;
  }
  return true;
};

async function register(req, res) {
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return KO(res, 'name, email, password requis');
    if (password.length < 8) return KO(res, 'Mot de passe >= 8 caracteres');

    const exists = await sql`SELECT id FROM users WHERE LOWER(email)=LOWER(${email})`;
    if (exists.rows.length > 0) return KO(res, 'Email deja utilise', 409);

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

    const token = signToken(user);
    setAuthCookie(res, token);
    return OK(
      res,
      { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token, workspace: workspace.rows[0] },
      201
    );
  } catch (e) {
    return KO(res, e?.message || 'Erreur inscription', 500);
  }
}

async function login(req, res) {
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return KO(res, 'email et password requis');

    const result = await sql`SELECT id, name, email, role, password_hash FROM users WHERE LOWER(email)=LOWER(${email})`;
    if (result.rows.length === 0) return KO(res, 'Identifiants invalides', 401);

    const user = result.rows[0];
    if (!verifyPassword(password, user.password_hash)) return KO(res, 'Identifiants invalides', 401);

    const token = signToken(user);
    setAuthCookie(res, token);
    const { password_hash, ...safe } = user;
    return OK(res, { user: safe, token });
  } catch (e) {
    return KO(res, e?.message || 'Erreur connexion', 500);
  }
}

async function logout(req, res) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  res.setHeader('Set-Cookie', `auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${secure}`.trim());
  return OK(res, { loggedOut: true });
}

async function me(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  try {
    const u = await sql`SELECT id, name, email, role, created_at FROM users WHERE id=${user.id}`;
    const ws = await sql`
      SELECT w.id, w.name FROM workspaces w
      LEFT JOIN workspace_members wm ON wm.workspace_id=w.id
      WHERE wm.user_id=${user.id}
      ORDER BY w.created_at ASC LIMIT 1
    `;
    return OK(res, { user: u.rows[0] || user, workspace: ws.rows[0] || null });
  } catch {
    return OK(res, { user });
  }
}

async function profile(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  try {
    if (req.method === 'GET') {
      const u = await sql`SELECT id, name, email, role, created_at FROM users WHERE id=${user.id}`;
      return OK(res, { user: u.rows[0] });
    }
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { name } = req.body || {};
      if (!name) return KO(res, 'name requis');
      const u = await sql`UPDATE users SET name=${name}, updated_at=NOW() WHERE id=${user.id} RETURNING id,name,email,role`;
      return OK(res, { user: u.rows[0] });
    }
    return KO(res, 'Method not allowed', 405);
  } catch (e) {
    return KO(res, e?.message || 'Erreur profil', 500);
  }
}

async function plans(req, res) {
  if (!requireMethod(req, res, 'GET')) return;
  try {
    const r = await sql`SELECT id, code, name, price_cfa, interval, features, limits, active, sort_order FROM plans WHERE active=true ORDER BY sort_order ASC`;
    return OK(res, { plans: r.rows });
  } catch (e) {
    return KO(res, e?.message || 'Erreur plans', 500);
  }
}

async function subscribe(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { plan_code = 'starter', tx = null } = req.body || {};
    const p = await sql`SELECT id FROM plans WHERE code=${plan_code} LIMIT 1`;
    if (p.rows.length === 0) return KO(res, 'Plan invalide', 400);
    const workspaceId = await firstWorkspace(user.id);
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    if (workspaceId) {
      await sql`UPDATE subscriptions SET status='expired', updated_at=NOW() WHERE workspace_id=${workspaceId} AND status='active'`;
    }
    const sub = await sql`
      INSERT INTO subscriptions (user_id, workspace_id, plan_id, status, provider, kkiapay_transaction_id, current_period_start, current_period_end)
      VALUES (${user.id}, ${workspaceId}, ${p.rows[0].id}, 'active', 'kkiapay', ${tx}, NOW(), ${end})
      RETURNING id, status, plan_id
    `;
    return OK(res, { subscription: sub.rows[0] }, 201);
  } catch (e) {
    return KO(res, e?.message || 'Erreur abonnement', 500);
  }
}

async function kkiapayCreateCheckout(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { plan_code = 'pro', amount_cfa = 50000 } = req.body || {};
    const transactionId = `SG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const workspaceId = await firstWorkspace(user.id);
    await sql`
      INSERT INTO payments (user_id, workspace_id, plan_code, amount_cfa, provider, status, transaction_id, reference)
      VALUES (${user.id}, ${workspaceId}, ${plan_code}, ${amount_cfa}, 'kkiapay', 'pending', ${transactionId}, ${transactionId})
    `;
    const publicKey = env('VITE_KKIAPAY_PUBLIC_KEY') || env('KKIAPAY_PUBLIC_KEY') || '';
    return OK(res, {
      transactionId,
      publicKey,
      amount_cfa,
      callback: `${appUrl()}/billing?status=success&tx=${transactionId}`,
      webhook: `${appUrl()}/api/kkiapay/webhook`,
      sandbox: (env('KKIAPAY_SANDBOX', 'true') || 'true').toLowerCase() === 'true',
      plan_code,
    });
  } catch (e) {
    return KO(res, e?.message || 'Erreur creation checkout', 500);
  }
}

async function kkiapayWebhook(req, res) {
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const raw = JSON.stringify(req.body || {});
    const data = req.body || {};
    const transactionId = data.transactionId || data.id || data.reference || data.transaction_id;
    const status = String(data.status || data.transaction_status || data.state || '').toUpperCase();
    const isSuccess =
      status === 'SUCCESS' || status === 'PAID' || status === 'COMPLETED' || data.success === true;

    if (transactionId) {
      const p = await sql`SELECT id, user_id, workspace_id, plan_code FROM payments WHERE transaction_id=${transactionId}`;
      if (p.rows.length > 0) {
        const payment = p.rows[0];
        if (isSuccess) {
          await sql`UPDATE payments SET status='success', webhook_data=${raw}::JSONB, paid_at=NOW() WHERE id=${payment.id}`;
        } else {
          const st = status === 'FAILED' || status === 'CANCELLED' ? status.toLowerCase() : 'pending';
          await sql`UPDATE payments SET status=${st}, webhook_data=${raw}::JSONB WHERE id=${payment.id}`;
        }

        if (isSuccess) {
          const pl = await sql`SELECT id FROM plans WHERE code=${payment.plan_code} LIMIT 1`;
          if (pl.rows.length > 0) {
            const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            await sql`UPDATE subscriptions SET status='expired', updated_at=NOW() WHERE user_id=${payment.user_id} AND status='active'`;
            await sql`
              INSERT INTO subscriptions (user_id, workspace_id, plan_id, status, provider, kkiapay_transaction_id, current_period_start, current_period_end)
              VALUES (${payment.user_id}, ${payment.workspace_id}, ${pl.rows[0].id}, 'active', 'kkiapay', ${transactionId}, NOW(), ${end})
            `;
          }
        }
      }
    }
    return OK(res, { received: true });
  } catch (e) {
    return KO(res, e?.message || 'Webhook error', 500);
  }
}

async function agentList(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'GET')) return;
  try {
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return OK(res, { agents: [] });
    const r = await sql`SELECT * FROM agents WHERE workspace_id=${workspaceId} ORDER BY created_at ASC`;
    return OK(res, { agents: r.rows });
  } catch (e) {
    return KO(res, e?.message || 'Erreur', 500);
  }
}

async function agentCreate(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { name, type, config = {} } = req.body || {};
    if (!name || !type) return KO(res, 'name et type requis');
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return KO(res, 'Workspace introuvable', 404);
    const r = await sql`
      INSERT INTO agents (workspace_id, name, type, config, status)
      VALUES (${workspaceId}, ${name}, ${type}, ${JSON.stringify(config)}::JSONB, 'idle')
      RETURNING *
    `;
    return OK(res, { agent: r.rows[0] }, 201);
  } catch (e) {
    return KO(res, e?.message || 'Erreur creation agent', 500);
  }
}

async function agentRun(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { agentId, agentType, websiteId, payload = {} } = req.body || {};
    if (!agentId && !agentType) return KO(res, 'agentId ou agentType requis');

    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return KO(res, 'Workspace introuvable', 404);
    if (!(await hasActiveSubscription(user.id)))
      return KO(res, 'Abonnement requis pour utiliser cet outil', 403);

    if (agentId) {
      const a = await sql`SELECT id, type, status FROM agents WHERE id=${agentId} AND workspace_id=${workspaceId}`;
      if (a.rows.length === 0) return KO(res, 'Agent introuvable', 404);
      await sql`UPDATE agents SET status='running', last_run_at=NOW() WHERE id=${agentId}`;
      const result = await runAgent({ agentType: a.rows[0].type, workspaceId, websiteId, payload });
      await sql`UPDATE agents SET status='idle' WHERE id=${agentId}`;
      return OK(res, { agentId, ...result });
    }

    const result = await runAgent({ agentType, workspaceId, websiteId, payload });
    return OK(res, result);
  } catch (e) {
    return KO(res, e?.message || "Erreur execution agent", 500);
  }
}

async function agentStop(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { agentId } = req.body || {};
    if (!agentId) return KO(res, 'agentId requis');
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return KO(res, 'Workspace introuvable', 404);
    await sql`UPDATE agents SET status='idle' WHERE id=${agentId} AND workspace_id=${workspaceId}`;
    return OK(res, { agentId, stopped: true });
  } catch (e) {
    return KO(res, e?.message || "Erreur arret agent", 500);
  }
}

async function dbMigrate(req, res) {
  try {
    await sql.query(SCHEMA_SQL);
    return OK(res, { migrated: true });
  } catch (e) {
    return KO(res, e?.message || 'Migration failed', 500);
  }
}

async function dbStatus(req, res) {
  try {
    const result = await sql`SELECT 1 as ok`;
    return OK(res, { db: result.rows.length > 0 ? 'ok' : 'down' });
  } catch (e) {
    return KO(res, e?.message || 'DB error', 500);
  }
}

async function dbTest(req, res) {
  try {
    const r = await sql`SELECT NOW() as now, 1+1 as calc`;
    return OK(res, { rows: r.rows });
  } catch (e) {
    return KO(res, e?.message || 'DB test failed', 500);
  }
}

const ROUTES = {
  'auth/register': register,
  'auth/login': login,
  'auth/logout': logout,
  'auth/me': me,
  'users/profile': profile,
  'checkout/plans': plans,
  'checkout/subscribe': subscribe,
  'kkiapay/create-checkout': kkiapayCreateCheckout,
  'kkiapay/webhook': kkiapayWebhook,
  'webhooks/kkiapay': kkiapayWebhook,
  'agents/list': agentList,
  'agents/create': agentCreate,
  'agents/run': agentRun,
  'agents/stop': agentStop,
  'agents/status': agentList,
  'db/migrate': dbMigrate,
  'db/status': dbStatus,
  'db/test': dbTest,
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(req, res);
    return res.status(200).end();
  }
  setCors(req, res);

  const resource = String(req.query?.resource || '').replace(/[^a-z0-9-]/gi, '');
  const action = String(req.query?.action || '').replace(/[^a-z0-9-]/gi, '');
  const route = ROUTES[`${resource}/${action}`];

  if (!route) {
    return KO(res, `Route /api/${resource}/${action} not found`, 404);
  }

  try {
    return await route(req, res);
  } catch (e) {
    return KO(res, e?.message || 'Server error', 500);
  }
}