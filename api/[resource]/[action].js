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

const ADVANCED_AGENTS = new Set(['performance', 'security', 'fix']);

function planLimits(code, rowLimits) {
  const paid = code !== 'starter';
  return {
    websites: (rowLimits && rowLimits.websites) || (paid ? 50 : 1),
    scansPerDay: paid ? 999 : 1,
    autoFixesPerMonth: paid ? Number.POSITIVE_INFINITY : 10,
    agents: paid ? 'advanced' : 'basic',
  };
}

async function getEffectivePlan(userId) {
  const now = new Date();
  const r = await sql`
    SELECT s.status, s.trial_ends_at, s.current_period_end, p.code, p.limits, p.name
    FROM subscriptions s JOIN plans p ON p.id = s.plan_id
    WHERE s.user_id=${userId} AND s.status IN ('active','trial')
    ORDER BY s.created_at DESC LIMIT 1
  `;
  const row = r.rows[0];
  const starter = { code: 'starter', name: 'Starter', status: 'none', trialEndsAt: null, limits: planLimits('starter', {}) };
  if (!row) return starter;
  const expiredTrial = row.status === 'trial' && row.trial_ends_at && new Date(row.trial_ends_at) < now;
  const expiredPeriod = row.status === 'active' && row.current_period_end && new Date(row.current_period_end) < now;
  if (expiredTrial) {
    await sql`UPDATE subscriptions SET status='expired', updated_at=NOW() WHERE user_id=${userId} AND status='trial'`;
    return starter;
  }
  if (expiredPeriod) {
    await sql`UPDATE subscriptions SET status='expired', updated_at=NOW() WHERE user_id=${userId} AND status='active'`;
    return starter;
  }
  return {
    code: row.code, name: row.name, status: row.status,
    trialEndsAt: row.trial_ends_at || null,
    limits: planLimits(row.code, row.limits),
  };
}

const paywall = (res, planData, message, status) =>
  KO(res, message, status, { upgrade: true, plan: planData.code, limit: planData.limits.websites });

const DEFAULT_AGENTS = [
  { name: 'Monitor Agent', type: 'monitor', config: { role: 'Watches availability, HTTP errors and downtime.', scope: 'Every 60 seconds' } },
  { name: 'Performance Agent', type: 'performance', config: { role: 'Tracks load speed and Core Web Vitals.', scope: 'Every hour' } },
  { name: 'SEO Agent', type: 'seo', config: { role: 'Audits sitemap, robots.txt, metadata and structure.', scope: 'Daily' } },
  { name: 'Form Agent', type: 'form', config: { role: 'Tests forms end-to-end with real submissions.', scope: 'Every 6 hours' } },
  { name: 'Security Agent', type: 'security', config: { role: 'Monitors headers, exposure and basic threats.', scope: 'Every hour' } },
  { name: 'Fix Agent', type: 'fix', config: { role: 'Prepares corrections and verifies applied fixes.', scope: 'On demand' } },
];

const DEFAULT_AUTOMATIONS = [
  { name: 'Fix broken internal links', trigger: 'monitor_404', action: { kind: 'update_link' }, enabled: true },
  { name: 'Verify after every deploy', trigger: 'deploy_webhook', action: { kind: 'full_scan' }, enabled: true },
  { name: 'Optimize oversized images', trigger: 'performance_lcp', action: { kind: 'webp' }, enabled: false },
  { name: 'Weekly client report', trigger: 'weekly', action: { kind: 'report_email' }, enabled: true },
];

async function seedWorkspaceData(workspaceId) {
  const has = await sql`SELECT 1 FROM agents WHERE workspace_id=${workspaceId} LIMIT 1`;
  if (has.rows.length === 0) {
    for (const a of DEFAULT_AGENTS) {
      await sql`INSERT INTO agents (workspace_id, name, type, config, status) VALUES (${workspaceId}, ${a.name}, ${a.type}, ${JSON.stringify(a.config)}::JSONB, 'idle')`;
    }
  }
  const hasAuto = await sql`SELECT 1 FROM automations WHERE workspace_id=${workspaceId} LIMIT 1`;
  if (hasAuto.rows.length === 0) {
    for (const r of DEFAULT_AUTOMATIONS) {
      await sql`INSERT INTO automations (workspace_id, name, enabled, trigger, action) VALUES (${workspaceId}, ${r.name}, ${r.enabled}, ${r.trigger}, ${JSON.stringify(r.action)}::JSONB)`;
    }
  }
}

let lastProviderError = null;

async function callOpenRouter(prompt, timeoutMs = 20000) {
  const key = env('OPENROUTER_API_KEY');
  if (!key) {
    lastProviderError = 'OPENROUTER_API_KEY manquante';
    return null;
  }
  const model = env('DEFAULT_AGENT_MODEL', 'nvidia/nemotron-3-ultra-550b-a55b:free');
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
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
ALTER TABLE websites ADD COLUMN IF NOT EXISTS client TEXT;
ALTER TABLE websites ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Starter';
ALTER TABLE websites ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ;
ALTER TABLE websites ADD COLUMN IF NOT EXISTS uptime TEXT DEFAULT '—';
ALTER TABLE websites ADD COLUMN IF NOT EXISTS response_ms INTEGER DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS fingerprint TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_issues_fingerprint ON issues(fingerprint) WHERE fingerprint IS NOT NULL;
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
    await seedWorkspaceData(workspace.rows[0].id);
    try {
      const pro = await sql`SELECT id FROM plans WHERE code='pro' LIMIT 1`;
      if (pro.rows[0]) {
        await sql`
          INSERT INTO subscriptions (user_id, workspace_id, plan_id, status, provider, trial_ends_at, current_period_start, current_period_end)
          VALUES (${user.id}, ${workspace.rows[0].id}, ${pro.rows[0].id}, 'trial', 'manual', NOW() + INTERVAL '14 days', NOW(), NOW() + INTERVAL '14 days')
        `;
        await sql`
          INSERT INTO notifications (user_id, title, body, type)
          VALUES (${user.id}, 'Essai Pro de 14 jours activé', 'Toutes les fonctionnalités sont disponibles pendant 14 jours. Choisissez votre plan avant la fin de l''essai pour continuer.', 'success')
        `;
      }
    } catch (e) {
      console.error('trial:', e?.message);
    }
    return OK(
      res,
      { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token, workspace: workspace.rows[0], trial: true },
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
      callback: `${appUrl()}/app/billing?status=success&tx=${transactionId}`,
      webhook: `${appUrl()}/api/kkiapay/webhook`,
      sandbox: (env('KKIAPAY_SANDBOX', 'true') || 'true').toLowerCase() === 'true',
      plan_code,
    });
  } catch (e) {
    return KO(res, e?.message || 'Erreur creation checkout', 500);
  }
}

async function kkiapayWebhook(req, res) {
  if (req.method === 'GET') {
    return OK(res, { webhook: 'ok' });
  }
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
    const planData = await getEffectivePlan(user.id);
    if (planData.limits.agents === 'basic' && ADVANCED_AGENTS.has(agentType)) {
      return paywall(res, planData, `Les agents ${agentType} sont réservés au plan Pro. Passez à Pro pour les débloquer.`, 402);
    }

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
    const ws = await sql`SELECT id FROM workspaces`;
    for (const w of ws.rows) {
      await seedWorkspaceData(w.id);
    }
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

function normalizeDomain(input) {
  let raw = String(input || '').trim().toLowerCase();
  raw = raw.replace(/^https?:\/\//i, '');
  raw = raw.replace(/^www\./i, '');
  raw = raw.split(/[/?#]/)[0];
  return raw;
}

function nowIso() {
  return new Date().toISOString();
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function decodeEntities(s) {
  if (!s) return '';
  const map = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };
  return String(s).replace(/&([^;]+);/g, (m, e) => (map[e.toLowerCase()] !== undefined ? map[e.toLowerCase()] : m));
}

function metaOf(body, name) {
  if (!body) return null;
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, 'i');
  const m = body.match(re);
  if (m) {
    const c = m[0].match(/content=["']([^"']*)["']/i);
    if (c) return decodeEntities(c[1]).trim();
  }
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["'][^>]*>`, 'i');
  const m2 = body.match(re2);
  return m2 ? decodeEntities(m2[1]).trim() : null;
}

function countOcc(body, re) {
  if (!body) return 0;
  return (body.match(re) || []).length;
}

async function fetchPage(url) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'SiteGuardAI-Bot/1.0 (+https://siteguard-ai-seven.vercel.app)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      },
    });
    const durationMs = Date.now() - started;
    const contentType = res.headers.get('content-type') || '';
    let body = '';
    const isHtml = contentType.includes('text/html') || /\.html?$/i.test(url);
    if (isHtml) {
      const buf = new Uint8Array(await res.arrayBuffer());
      body = new TextDecoder('utf-8', { fatal: false }).decode(buf).slice(0, 700000);
    }
    const headers = {};
    res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    return { status: res.status, statusText: res.statusText, finalUrl: res.url, durationMs, contentType, headers, body };
  } catch (e) {
    return { error: e?.name === 'TimeoutError' ? 'timeout' : String(e?.message || e), durationMs: Date.now() - started };
  }
}

async function fetchAux(domain, path) {
  try {
    const res = await fetch(`https://${domain}${path}`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(7000),
      headers: { 'User-Agent': 'SiteGuardAI-Bot/1.0 (+https://siteguard-ai-seven.vercel.app)' },
    });
    const text = await res.text().catch(() => '');
    return { status: res.status, text: text.slice(0, 40000) };
  } catch (e) {
    return { status: 0, text: '', error: String(e?.message || e) };
  }
}

function analyzeHtml(body) {
  const title = ((body || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.replace(/\s+/g, ' ').trim() || '';
  const imgs = (body || '').match(/<img[\s>]/gi) || [];
  const forms = (body || '').match(/<form[\s>][^>]*>/gi) || [];
  const faviconMatch = /<link[^>]*rel=["'](?:shortcut )?icon["']/i.test(body || '');
  const langAttr = ((body || '').match(/<html[^>]*\blang=["']?([a-zA-Z-]+)/i) || [])[1] || '';
  return {
    title,
    description: metaOf(body, 'description'),
    ogTitle: metaOf(body, 'og:title'),
    ogDesc: metaOf(body, 'og:description'),
    ogImage: metaOf(body, 'og:image'),
    viewport: metaOf(body, 'viewport'),
    h1s: countOcc(body, /<h1[\s>]/gi),
    imgs: imgs.length,
    imgsNoAlt: countOcc(body, /<img(?![^>]*\balt=)[^>]*>/gi),
    links: countOcc(body, /<a[\s>]/gi),
    forms: forms.length,
    formsNoAction: forms.filter((f) => !/action=["']?[^"'\s>]/.test(f)).length,
    scripts: countOcc(body, /<script[\s>]/gi),
    inlineScripts: countOcc(body, /<script(?![^>]*\bsrc=)[^>]*>/gi),
    stylesheets: countOcc(body, /<link[^>]*rel=["']stylesheet["']/gi),
    inputsEmail: countOcc(body, /type=["']email["']/gi),
    langAttr,
    byteSize: Buffer.byteLength(body || '', 'utf8'),
    favicon: faviconMatch,
    hreflang: countOcc(body, /hreflang=/gi),
  };
}

function securityChecks(headers) {
  const h = headers || {};
  const csp = h['content-security-policy'] || h['content-security-policy-report-only'] || '';
  return {
    hsts: !!h['strict-transport-security'],
    csp: !!csp,
    nosniff: (h['x-content-type-options'] || '').toLowerCase().includes('nosniff'),
    xfo: /deny|sameorigin/i.test(h['x-frame-options'] || '') || /frame-ancestors/i.test(csp),
    referrerPolicy: !!h['referrer-policy'],
    permissionsPolicy: !!h['permissions-policy'] || !!h['feature-policy'],
    server: h['server'] || '',
    poweredBy: h['x-powered-by'] || '',
  };
}

function makeTimeline(detectedAt, agent, label) {
  const t = fmtTime(detectedAt);
  return [
    { time: t, agent, label, state: 'done' },
    { time: t, agent: 'AI diagnosis', label: 'Root cause identified', state: 'done' },
    { time: t, agent: 'Fix Agent', label: 'Correction generated · confidence high', state: 'done' },
    { time: '—', agent: 'Workflow', label: 'Waiting for your approval', state: 'current' },
    { time: '—', agent: 'Fix Agent', label: 'Apply correction', state: 'pending' },
    { time: '—', agent, label: 'Verify fix · confirm healthy', state: 'pending' },
    { time: '—', agent: 'Workflow', label: 'Issue resolved', state: 'pending' },
  ];
}

function dbSeverity(sev) {
  if (sev === 'critical') return 'critical';
  if (sev === 'warning') return 'high';
  return 'low';
}

function makeFinding(site, data) {
  const detectedAt = nowIso();
  return {
    key: data.key,
    title: data.title,
    severity: data.severity,
    category: data.category,
    status: 'open',
    siteId: site.id,
    path: data.path || '/',
    impact: data.impact || 'Medium',
    detectedAt,
    detectedBy: data.agent || 'Monitor Agent',
    diagnosis: data.diagnosis || 'Issue detected during automated audit.',
    evidence: data.evidence || [],
    recommendedFix: data.recommendedFix || 'Review and apply the recommended correction.',
    fixDetail: data.fixDetail || '',
    confidence: data.confidence ?? 85,
    before: data.before || { label: 'Before', value: 'not healthy', tone: 'critical' },
    after: data.after || { label: 'After', value: 'healthy', tone: 'healthy' },
    affectedPages: data.affectedPages ?? 1,
    seoImpact: data.seoImpact || 'None',
    autoFixable: Boolean(data.autoFixable),
    timeline: makeTimeline(detectedAt, data.agent || 'Monitor Agent', data.timelineLabel || data.title),
    domain: site.domain,
  };
}

function buildFindings(site, metrics) {
  const { page, html, sec, robots, sitemap, domain, durationMs } = metrics;
  const findings = [];
  const f = (d) => findings.push(makeFinding(site, d));

  if (!page || page.error || page.status === 0) {
    f({
      key: 'reachability',
      agent: 'Monitor Agent',
      category: 'Monitoring',
      title: 'Website unreachable',
      severity: 'critical',
      impact: 'High',
      evidence: [{ label: `GET https://${domain}`, value: page?.error === 'timeout' ? 'timeout (15s)' : page && page.status ? `HTTP ${page.status}` : 'connection error' }],
      diagnosis: 'The site did not respond to an HTTPS request within the timeout. Visitors cannot reach the website, which directly impacts revenue, leads and SEO.',
      recommendedFix: 'Check DNS records, hosting status and origin server health.',
      fixDetail: 'Verify A/AAAA record for ' + domain + ', hosting incident page, and that the origin does not block automated requests.',
      confidence: 92,
      autoFixable: false,
      seoImpact: 'High',
    });
  } else if (page.status >= 500 || page.status === 429) {
    f({
      key: 'server_error',
      agent: 'Monitor Agent',
      category: 'Monitoring',
      title: `Server error: HTTP ${page.status}`,
      severity: 'critical',
      impact: 'High',
      evidence: [{ label: `GET https://${domain}`, value: `HTTP ${page.status}` }, { label: 'Status text', value: page.statusText || '—' }],
      diagnosis: `The homepage returned HTTP ${page.status}. This is a server-side failure affecting all visitors and search engines.`,
      recommendedFix: 'Investigate origin logs and deploy a fix.',
      fixDetail: `HTTP ${page.status} from https://${domain} — check hosting status and application error logs.`,
      confidence: 90,
      autoFixable: false,
      seoImpact: 'High',
    });
  } else if (page.status >= 400 && page.status !== 404) {
    f({
      key: 'client_error',
      agent: 'Monitor Agent',
      category: 'Monitoring',
      title: `Homepage error: HTTP ${page.status}`,
      severity: 'warning',
      impact: 'Medium',
      evidence: [{ label: `GET https://${domain}`, value: `HTTP ${page.status}` }],
      diagnosis: `The homepage returned HTTP ${page.status}. The page may still load if a redirect or CDN fallback exists but this needs review.`,
      recommendedFix: 'Check the endpoint configuration and redirects.',
      fixDetail: `HTTP ${page.status} on https://${domain} — verify routing and caching rules.`,
      confidence: 85,
      autoFixable: false,
      seoImpact: 'Medium',
    });
  }

  if (durationMs > 2200) {
    f({
      key: 'ttfb_slow',
      agent: 'Performance Agent',
      category: 'Performance',
      title: 'Very slow response time',
      severity: 'warning',
      impact: 'Medium',
      evidence: [{ label: 'Response time', value: `${Math.round(durationMs)} ms` }, { label: 'Recommendation', value: '< 2000 ms' }],
      diagnosis: `The page took ${Math.round(durationMs)} ms to respond. Slow TTFB degrades Core Web Vitals (LCP) and user experience on mobile.`,
      recommendedFix: 'Enable caching, use a CDN, and optimize the origin.',
      fixDetail: 'Add page/asset caching and a CDN; profile slow queries on the origin.',
      confidence: 88,
      autoFixable: false,
      seoImpact: 'Medium',
    });
  } else if (durationMs > 1200) {
    f({
      key: 'ttfb_ok',
      agent: 'Performance Agent',
      category: 'Performance',
      title: 'Response time above target',
      severity: 'optimization',
      impact: 'Low',
      evidence: [{ label: 'Response time', value: `${Math.round(durationMs)} ms` }],
      diagnosis: `Response time of ${Math.round(durationMs)} ms is acceptable but above the 1200 ms target.`,
      recommendedFix: 'Optimize caching and server configuration.',
      fixDetail: 'Enable compression, cache static assets, tune server timeouts.',
      confidence: 80,
      autoFixable: true,
      seoImpact: 'Low',
    });
  }

  if (html.byteSize > 1000000) {
    f({
      key: 'html_heavy',
      agent: 'Performance Agent',
      category: 'Performance',
      title: 'Large HTML payload',
      severity: 'optimization',
      impact: 'Low',
      evidence: [{ label: 'HTML size', value: `${(html.byteSize / 1024).toFixed(0)} KB` }],
      diagnosis: `The HTML document weighs ~${(html.byteSize / 1024).toFixed(0)} KB. Large documents slow down parsing and render on low-end devices.`,
      recommendedFix: 'Trim inline assets and server-render only critical content.',
      fixDetail: 'Move inline scripts/styles to external files and paginate long content.',
      confidence: 84,
      autoFixable: true,
      seoImpact: 'Low',
    });
  }

  if (!sec.hsts) {
    f({
      key: 'hsts',
      agent: 'Security Agent',
      category: 'Security',
      title: 'Missing HSTS header',
      severity: 'warning',
      impact: 'Medium',
      evidence: [{ label: 'Strict-Transport-Security', value: 'absent' }],
      diagnosis: 'The Strict-Transport-Security header is not sent. HTTPS can be downgraded on hostile networks.',
      recommendedFix: 'Add the header at the edge:',
      fixDetail: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
      confidence: 99,
      autoFixable: true,
    });
  }

  if (!sec.csp) {
    f({
      key: 'csp',
      agent: 'Security Agent',
      category: 'Security',
      title: 'No Content-Security-Policy',
      severity: 'warning',
      impact: 'Medium',
      evidence: [{ label: 'Content-Security-Policy', value: 'absent' }],
      diagnosis: 'No Content-Security-Policy header detected, increasing the risk of XSS and data injection attacks.',
      recommendedFix: 'Serve a reporting CSP first, then enforce:',
      fixDetail: 'Content-Security-Policy: default-src \'self\'; base-uri \'self\'; frame-ancestors \'self\'',
      confidence: 96,
      autoFixable: true,
    });
  }

  if (!sec.nosniff) {
    f({
      key: 'nosniff',
      agent: 'Security Agent',
      category: 'Security',
      title: 'Missing X-Content-Type-Options',
      severity: 'warning',
      impact: 'Low',
      evidence: [{ label: 'X-Content-Type-Options', value: 'absent' }],
      diagnosis: 'The X-Content-Type-Options: nosniff header is missing, allowing some browsers to MIME-sniff responses.',
      recommendedFix: 'Add the header:',
      fixDetail: 'X-Content-Type-Options: nosniff',
      confidence: 99,
      autoFixable: true,
    });
  }

  if (!sec.xfo) {
    f({
      key: 'xfo',
      agent: 'Security Agent',
      category: 'Security',
      title: 'Clickjacking protection missing',
      severity: 'optimization',
      impact: 'Low',
      evidence: [{ label: 'X-Frame-Options / frame-ancestors', value: 'absent' }],
      diagnosis: 'No clickjacking protection header or CSP frame-ancestors directive was detected.',
      recommendedFix: 'Add the header or CSP directive:',
      fixDetail: 'X-Frame-Options: SAMEORIGIN  (or frame-ancestors \'self\')',
      confidence: 98,
      autoFixable: true,
    });
  }

  if (!sec.referrerPolicy) {
    f({
      key: 'referrer_policy',
      agent: 'Security Agent',
      category: 'Security',
      title: 'Referrer-Policy not set',
      severity: 'optimization',
      impact: 'Low',
      evidence: [{ label: 'Referrer-Policy', value: 'absent' }],
      diagnosis: 'The Referrer-Policy header is not set, so full URLs may leak in the Referer header.',
      recommendedFix: 'Add the header:',
      fixDetail: 'Referrer-Policy: strict-origin-when-cross-origin',
      confidence: 97,
      autoFixable: true,
    });
  }

  if (sec.poweredBy) {
    f({
      key: 'powered_by',
      agent: 'Security Agent',
      category: 'Security',
      title: 'Technology stack exposed',
      severity: 'optimization',
      impact: 'Low',
      evidence: [{ label: 'X-Powered-By', value: sec.poweredBy }],
      diagnosis: `The ${sec.poweredBy} value is exposed in response headers, revealing the technology stack to attackers.`,
      recommendedFix: 'Remove the header server-side.',
      fixDetail: 'Disable X-Powered-By / Server version output.',
      confidence: 95,
      autoFixable: false,
    });
  }

  if (!html.title) {
    f({
      key: 'missing_title',
      agent: 'SEO Agent',
      category: 'SEO',
      title: 'Missing <title> tag',
      severity: 'warning',
      impact: 'Medium',
      evidence: [{ label: '<title>', value: 'missing' }],
      diagnosis: 'The page has no <title> tag. Search engines use the title as the primary clickable headline in results.',
      recommendedFix: 'Add a descriptive title:',
      fixDetail: `<title>${site.name || domain} — official website</title>`,
      confidence: 92,
      autoFixable: true,
      seoImpact: 'Medium',
    });
  }

  if (!html.description) {
    f({
      key: 'missing_description',
      agent: 'SEO Agent',
      category: 'SEO',
      title: 'Missing meta description',
      severity: 'optimization',
      impact: 'Low',
      evidence: [{ label: 'meta[name=description]', value: 'missing' }],
      diagnosis: 'The page has no meta description, so search engines generate a snippet from body text. Expected CTR loss on branded queries.',
      recommendedFix: 'Add a generated description:',
      fixDetail: `Meta description summing up ${site.name || domain} services, value proposition and CTA (135–160 characters).`,
      confidence: 91,
      autoFixable: true,
      seoImpact: 'Low',
    });
  }

  if (!html.ogTitle || !html.ogDesc || !html.ogImage) {
    f({
      key: 'open_graph',
      agent: 'SEO Agent',
      category: 'SEO',
      title: 'Incomplete social sharing (Open Graph)',
      severity: 'optimization',
      impact: 'Low',
      evidence: [{ label: 'og:title', value: html.ogTitle ? 'present' : 'missing' }, { label: 'og:description', value: html.ogDesc ? 'present' : 'missing' }, { label: 'og:image', value: html.ogImage ? 'present' : 'missing' }],
      diagnosis: 'Social networks may render a poor preview because Open Graph tags are incomplete.',
      recommendedFix: 'Add the missing og: tags to the <head>.',
      fixDetail: 'og:title, og:description and a 1200×630 og:image.',
      confidence: 90,
      autoFixable: true,
      seoImpact: 'Low',
    });
  }

  if (!html.viewport) {
    f({
      key: 'viewport',
      agent: 'SEO Agent',
      category: 'SEO',
      title: 'Missing viewport meta tag',
      severity: 'critical',
      impact: 'High',
      evidence: [{ label: 'meta[name=viewport]', value: 'missing' }],
      diagnosis: 'No viewport meta tag means the page renders in desktop width on mobile, breaking responsive layout and hurting mobile rankings.',
      recommendedFix: 'Add the tag:',
      fixDetail: '<meta name="viewport" content="width=device-width, initial-scale=1">',
      confidence: 98,
      autoFixable: true,
      seoImpact: 'High',
    });
  }

  if (html.h1s === 0) {
    f({
      key: 'no_h1',
      agent: 'SEO Agent',
      category: 'SEO',
      title: 'No H1 heading on the page',
      severity: 'warning',
      impact: 'Medium',
      evidence: [{ label: 'H1 count', value: '0' }],
      diagnosis: 'The page has no H1 heading, which weakens the semantic structure search engines rely on.',
      recommendedFix: 'Add one H1 that matches the page topic.',
      fixDetail: 'Insert a single descriptive <h1> near the top of the page.',
      confidence: 88,
      autoFixable: true,
      seoImpact: 'Medium',
    });
  } else if (html.h1s > 1) {
    f({
      key: 'multiple_h1',
      agent: 'SEO Agent',
      category: 'SEO',
      title: 'Multiple H1 headings',
      severity: 'optimization',
      impact: 'Low',
      evidence: [{ label: 'H1 count', value: String(html.h1s) }],
      diagnosis: `${html.h1s} H1 headings were found. A single H1 per page is the recommended practice.`,
      recommendedFix: 'Convert the extra H1s to H2/H3.',
      fixDetail: `${html.h1s} H1 → keep one, demote the rest.`,
      confidence: 85,
      autoFixable: true,
      seoImpact: 'Low',
    });
  }

  if (html.imgsNoAlt > 0 && html.imgsNoAlt >= Math.max(1, Math.floor(html.imgs * 0.2))) {
    f({
      key: 'images_alt',
      agent: 'SEO Agent',
      category: 'SEO',
      title: 'Images missing alt text',
      severity: 'warning',
      impact: 'Medium',
      evidence: [{ label: 'Images without alt', value: `${html.imgsNoAlt} of ${html.imgs}` }],
      diagnosis: `${html.imgsNoAlt} images are missing alt text, hurting accessibility and image SEO.`,
      recommendedFix: 'Add descriptive alt attributes.',
      fixDetail: `alt="..." on the ${html.imgsNoAlt} flagged images.`,
      confidence: 84,
      autoFixable: true,
      seoImpact: 'Medium',
    });
  }

  if (!html.favicon) {
    f({
      key: 'favicon',
      agent: 'SEO Agent',
      category: 'SEO',
      title: 'No favicon declared',
      severity: 'optimization',
      impact: 'Low',
      evidence: [{ label: '<link rel="icon">', value: 'missing' }],
      diagnosis: 'No favicon is declared, producing a default icon in browser tabs and bookmarks.',
      recommendedFix: 'Add a favicon link:',
      fixDetail: '<link rel="icon" type="image/x-icon" href="/favicon.ico">',
      confidence: 96,
      autoFixable: true,
    });
  }

  if (robots && robots.status === 404) {
    f({
      key: 'robots_missing',
      agent: 'SEO Agent',
      category: 'SEO',
      title: 'robots.txt not found',
      severity: 'optimization',
      impact: 'Low',
      evidence: [{ label: 'GET /robots.txt', value: '404' }],
      diagnosis: 'robots.txt is missing. Default crawl behavior applies, but important directives (Disallow, Sitemap) cannot be communicated.',
      recommendedFix: 'Create robots.txt at the site root.',
      fixDetail: 'https://' + domain + '/robots.txt with User-agent: * and a Sitemap line.',
      confidence: 88,
      autoFixable: true,
      seoImpact: 'Low',
    });
  }

  if (sitemap && sitemap.status === 404) {
    f({
      key: 'sitemap_missing',
      agent: 'SEO Agent',
      category: 'SEO',
      title: 'sitemap.xml not found',
      severity: 'optimization',
      impact: 'Low',
      evidence: [{ label: 'GET /sitemap.xml', value: '404' }],
      diagnosis: 'No XML sitemap was found, which can slow down discovery of new pages.',
      recommendedFix: 'Generate a sitemap and reference it in robots.txt.',
      fixDetail: 'Submit https://' + domain + '/sitemap.xml in Google Search Console.',
      confidence: 86,
      autoFixable: true,
      seoImpact: 'Low',
    });
  }

  if (html.formsNoAction > 0) {
    f({
      key: 'form_no_action',
      agent: 'Form Agent',
      category: 'Forms',
      title: 'Forms without a submission target',
      severity: 'warning',
      impact: 'High',
      evidence: [{ label: 'Forms without action', value: `${html.formsNoAction} of ${html.forms}` }],
      diagnosis: `${html.formsNoAction} form(s) have no action attribute or handler, so submissions may be silently lost.`,
      recommendedFix: 'Ensure every <form> posts to a valid endpoint.',
      fixDetail: `Wire the ${html.formsNoAction} flagged form(s) to a working handler.`,
      confidence: 82,
      autoFixable: false,
      seoImpact: 'None',
    });
  }

  return findings;
}

function scoreFromFindings(findings) {
  let score = 100;
  for (const f of findings) {
    if (f.severity === 'critical') score -= 22;
    else if (f.severity === 'warning') score -= 8;
    else score -= 3;
  }
  score = Math.max(0, Math.min(100, score));
  const status = score >= 90 ? 'healthy' : score >= 70 ? 'warning' : 'critical';
  return { score, status, critical: findings.filter((f) => f.severity === 'critical').length, warning: findings.filter((f) => f.severity === 'warning').length, optimization: findings.filter((f) => f.severity === 'optimization').length };
}

function extractJson(text) {
  const a = String(text || '').indexOf('[');
  const z = String(text || '').lastIndexOf(']');
  if (a === -1 || z === -1) return null;
  try {
    return JSON.parse(text.slice(a, z + 1));
  } catch {
    return null;
  }
}

async function enrichFindingsWithAI(domain, findings) {
  const prompt =
    `You run automated website audits for SiteGuard AI. Here is the homepage analysis of ${domain}:\n` +
    JSON.stringify(findings.map((f) => ({ key: f.key, title: f.title, severity: f.severity, category: f.category, evidence: f.evidence }))) +
    '\nReturn ONLY a JSON array with one object per finding (same order): {"key": string, "diagnosis": string, "recommendedFix": string, "fixDetail": string, "confidence": number (0-100), "impact": "High"|"Medium"|"Low"}. No markdown, no extra text.';
  const res = await callOpenRouter(prompt);
  if (!res) return null;
  const list = extractJson(res.output);
  if (!Array.isArray(list)) return null;
  const byKey = {};
  for (const item of list) if (item && item.key) byKey[item.key] = item;
  return byKey;
}

async function persistScan(workspace, website, findings, durationMs, domain) {
  const { score, status, critical, warning, optimization } = scoreFromFindings(findings);
  await sql`
    INSERT INTO scans (website_id, workspace_id, status, pages_scanned, issues_found, duration_ms, completed_at, error)
    VALUES (${website.id}, ${workspace.id}, 'completed', 1, ${findings.length}, ${durationMs}, NOW(), NULL)
  `;
  const keys = findings.filter((f) => f.key).map((f) => website.id + ':' + f.key);
  for (const f of findings) {
    const payload = { ...f, domain };
    await sql`
      INSERT INTO issues (website_id, workspace_id, title, description, category, severity, status, impact, suggestion, auto_fixable, detected_by, path, payload, fingerprint)
      VALUES (${website.id}, ${workspace.id}, ${f.title}, ${f.diagnosis}, ${f.category}, ${dbSeverity(f.severity)}, 'open', ${f.impact}, ${f.recommendedFix}, ${Boolean(f.autoFixable)}, ${f.detectedBy}, ${f.path}, ${JSON.stringify(payload)}::JSONB, ${website.id + ':' + f.key})
      ON CONFLICT (fingerprint) WHERE fingerprint IS NOT NULL
      DO UPDATE SET updated_at=NOW(), detected_at=NOW(), status='open', payload=EXCLUDED.payload, severity=EXCLUDED.severity
    `;
  }
  if (keys.length > 0) {
    await sql`
      UPDATE issues SET status='resolved', resolved_at=NOW(), updated_at=NOW(),
        payload = COALESCE(payload, '{}'::JSONB) || '{"resolvedReason":"no longer detected on recent scan"}'::JSONB
      WHERE website_id=${website.id} AND status IN ('open','in_progress') AND (fingerprint IS NOT NULL AND NOT (fingerprint = ANY(${keys})))
    `;
  } else {
    await sql`
      UPDATE issues SET status='resolved', resolved_at=NOW(), updated_at=NOW(),
        payload = COALESCE(payload, '{}'::JSONB) || '{"resolvedReason":"no longer detected on recent scan"}'::JSONB
      WHERE website_id=${website.id} AND status IN ('open','in_progress')
    `;
  }
  const owner = await sql`SELECT owner_id FROM workspaces WHERE id=${workspace.id}`;
  const ownerId = owner.rows[0]?.owner_id;
  for (const f of findings.filter((x) => x.severity === 'critical' || x.severity === 'warning')) {
    if (ownerId) {
      const dup = await sql`
        SELECT 1 FROM notifications WHERE user_id=${ownerId} AND title=${f.title} AND LOWER(body) LIKE ${'%' + domain.toLowerCase() + '%'} AND created_at > NOW() - INTERVAL '24 hours' LIMIT 1
      `;
      if (dup.rows.length === 0) {
        await sql`
          INSERT INTO notifications (user_id, workspace_id, title, body, type)
          VALUES (${ownerId}, ${workspace.id}, ${f.title}, ${f.title + ' · ' + domain + ' · ' + f.path}, ${f.severity === 'critical' ? 'critical' : 'warning'})
        `;
      }
    }
  }
  await sql`
    UPDATE websites SET health_score=${score}, status=${status}, issues_count=${critical + warning + optimization}, response_ms=${durationMs}, last_scan_at=NOW(), updated_at=NOW()
    WHERE id=${website.id}
  `;
  return { score, status, critical, warning, optimization };
}

async function runSmartScan(workspace, website) {
  const domain = normalizeDomain(website.domain);
  const page = await fetchPage(`https://${domain}`);
  const [robots, sitemap] = await Promise.all([fetchAux(domain, '/robots.txt'), fetchAux(domain, '/sitemap.xml')]);
  const html = analyzeHtml(page.body);
  const sec = securityChecks(page.headers);
  const sitemapCount = (sitemap.text.match(/<loc>/g) || []).length;
  const metrics = { page, html, sec, robots: robots.status === 0 ? null : { ...robots, count: robots.text.includes('Disallow: /') ? -1 : 0 }, sitemap: sitemap.status === 0 ? null : { ...sitemap, count: sitemapCount }, domain, durationMs: page.durationMs };
  let findings = buildFindings(website, metrics);
  const enriched = await enrichFindingsWithAI(domain, findings);
  if (enriched) {
    findings = findings.map((f) => {
      const e = enriched[f.key];
      if (!e) return f;
      return {
        ...f,
        diagnosis: e.diagnosis || f.diagnosis,
        recommendedFix: e.recommendedFix || f.recommendedFix,
        fixDetail: e.fixDetail || f.fixDetail,
        confidence: typeof e.confidence === 'number' ? Math.max(0, Math.min(100, Math.round(e.confidence))) : f.confidence,
        impact: e.impact || f.impact,
      };
    });
  }
  const result = await persistScan(workspace, website, findings, page.durationMs, domain);
  return { domain, ...result, findings, provider: enriched ? 'ai' : 'heuristic' };
}

async function websitesList(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'GET')) return;
  try {
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return OK(res, { websites: [] });
    const rows = await sql`
      SELECT w.*,
        (SELECT count(*) FROM scans s WHERE s.website_id = w.id) AS scan_count,
        (SELECT count(*) FROM scans s WHERE s.website_id = w.id AND s.status='completed' AND s.error IS NULL) AS scan_ok
      FROM websites w WHERE w.workspace_id=${workspaceId} ORDER BY w.created_at ASC
    `;
    return OK(res, { websites: rows.rows });
  } catch (e) {
    return KO(res, e?.message || 'Erreur liste sites', 500);
  }
}

async function websitesCreate(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { url, name, client } = req.body || {};
    const domain = normalizeDomain(url);
    if (!domain || !domain.includes('.') || domain.length < 4) return KO(res, 'URL de site invalide');
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return KO(res, 'Workspace introuvable', 404);

    const planData = await getEffectivePlan(user.id);

    const dup = await sql`SELECT id FROM websites WHERE workspace_id=${workspaceId} AND domain=${domain}`;
    if (dup.rows.length > 0) {
      const wid = dup.rows[0].id;
      const site = await sql`SELECT * FROM websites WHERE id=${wid}`;
      await sql`UPDATE websites SET status='scanning', updated_at=NOW() WHERE id=${wid}`;
      const scan = await runSmartScan({ id: workspaceId, owner_id: user.id }, site.rows[0]);
      const refreshed = await sql`SELECT * FROM websites WHERE id=${wid}`;
      return OK(res, { website: refreshed.rows[0], scan, scanned: true }, 201);
    }

    const count = await sql`SELECT count(*)::int AS n FROM websites WHERE workspace_id=${workspaceId}`;
    if ((count.rows[0]?.n || 0) >= planData.limits.websites) {
      return paywall(res, planData, `Limite du plan ${planData.name} : ${planData.limits.websites} site(s) surveillé(s). Passez à Pro pour en suivre davantage.`, 402);
    }

    const planName = planData.code[0]?.toUpperCase?.() + (planData.code ? planData.code.slice(1) : '') || 'Starter';
    const insert = await sql`
      INSERT INTO websites (workspace_id, domain, name, client, status, health_score, plan, connected_at, response_ms, uptime)
      VALUES (${workspaceId}, ${domain}, ${name || domain}, ${client || ''}, 'scanning', 0, ${planName}, NOW(), 0, '—')
      RETURNING *
    `;
    const website = insert.rows[0];
    try {
      const scan = await runSmartScan({ id: workspaceId, owner_id: user.id }, website);
      const refreshed = await sql`SELECT * FROM websites WHERE id=${website.id}`;
      return OK(res, { website: refreshed.rows[0], scan }, 201);
    } catch (scanErr) {
      await sql`UPDATE websites SET status='error', updated_at=NOW() WHERE id=${website.id}`;
      return OK(res, { website: { ...website, status: 'error' }, scanError: String(scanErr?.message || scanErr) }, 201);
    }
  } catch (e) {
    return KO(res, e?.message || 'Erreur creation site', 500);
  }
}

async function websitesScan(req, res, direct) {
  const user = requireAuth(req, res);
  if (!user) return;
  const websiteId = req.body?.websiteId || direct?.websiteId;
  try {
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return KO(res, 'Workspace introuvable', 404);
    const site = await sql`SELECT * FROM websites WHERE id=${websiteId} AND workspace_id=${workspaceId}`;
    if (site.rows.length === 0) return KO(res, 'Site introuvable', 404);
    const planData = await getEffectivePlan(user.id);
    if (planData.limits.scansPerDay < 999 && site.rows[0].last_scan_at) {
      const hoursSince = (Date.now() - new Date(site.rows[0].last_scan_at).getTime()) / 3.6e6;
      if (hoursSince < 24) {
        return paywall(res, planData, `Scans limités à 1 par jour sur le plan ${planData.name}. Passez à Pro pour des scans fréquents (24 h restantes).`, 429);
      }
    }
    await sql`UPDATE websites SET status='scanning', updated_at=NOW() WHERE id=${websiteId}`;
    const scan = await runSmartScan({ id: workspaceId, owner_id: user.id }, site.rows[0]);
    const refreshed = await sql`SELECT * FROM websites WHERE id=${websiteId}`;
    return OK(res, { website: refreshed.rows[0], scan });
  } catch (e) {
    await sql`UPDATE websites SET status='error', updated_at=NOW() WHERE id=${websiteId}`;
    return KO(res, e?.message || 'Erreur scan', 500);
  }
}

async function websitesDelete(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { websiteId } = req.body || {};
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return KO(res, 'Workspace introuvable', 404);
    await sql`DELETE FROM websites WHERE id=${websiteId} AND workspace_id=${workspaceId}`;
    return OK(res, { deleted: true });
  } catch (e) {
    return KO(res, e?.message || 'Erreur suppression', 500);
  }
}

async function issuesList(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'GET')) return;
  try {
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return OK(res, { issues: [] });
    const { site, status, severity } = req.query || {};
    let rows;
    if (site) {
      rows = await sql`SELECT * FROM issues WHERE workspace_id=${workspaceId} AND website_id=${site} ORDER BY detected_at DESC LIMIT 200`;
    } else {
      rows = await sql`SELECT * FROM issues WHERE workspace_id=${workspaceId} ORDER BY detected_at DESC LIMIT 200`;
    }
    let out = rows.rows;
    if (status) out = out.filter((r) => r.status === status);
    if (severity) out = out.filter((r) => r.severity === severity);
    return OK(res, { issues: out });
  } catch (e) {
    return KO(res, e?.message || 'Erreur liste issues', 500);
  }
}

async function issuesUpdate(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { issueId, status } = req.body || {};
    if (!issueId || !status) return KO(res, 'issueId et status requis');
    const allowed = { open: 'open', approval: 'in_progress', in_progress: 'in_progress', resolved: 'resolved', ignored: 'ignored', closed: 'resolved' };
    const dbStatus = allowed[status];
    if (!dbStatus) return KO(res, 'Statut invalide');
    const workspaceId = await firstWorkspace(user.id);
    let r;
    if (dbStatus === 'resolved') {
      r = await sql`
        UPDATE issues SET status=${dbStatus}, updated_at=NOW(), resolved_at=NOW()
        WHERE id=${issueId} AND workspace_id=${workspaceId} RETURNING *
      `;
    } else {
      r = await sql`
        UPDATE issues SET status=${dbStatus}, updated_at=NOW(), resolved_at=NULL
        WHERE id=${issueId} AND workspace_id=${workspaceId} RETURNING *
      `;
    }
    if (r.rows.length === 0) return KO(res, 'Issue introuvable', 404);
    return OK(res, { issue: r.rows[0] });
  } catch (e) {
    return KO(res, e?.message || 'Erreur mise a jour issue', 500);
  }
}

async function issuesFix(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { issueId } = req.body || {};
    if (!issueId) return KO(res, 'issueId requis');
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return KO(res, 'Workspace introuvable', 404);
    const rows = await sql`SELECT * FROM issues WHERE id=${issueId} AND workspace_id=${workspaceId}`;
    if (rows.rows.length === 0) return KO(res, 'Issue introuvable', 404);
    const issue = rows.rows[0];
    const payload = issue.payload || {};

    const planData = await getEffectivePlan(user.id);
    if (planData.limits.autoFixesPerMonth < Number.POSITIVE_INFINITY) {
      const used = await sql`
        SELECT count(*)::int AS n FROM issues
        WHERE workspace_id=${workspaceId} AND (payload->>'patch') IS NOT NULL
          AND (payload->>'patchGeneratedAt')::timestamptz >= NOW() - interval '30 days'
      `;
      if ((used.rows[0]?.n || 0) >= planData.limits.autoFixesPerMonth) {
        return paywall(res, planData, `Quota d'autocorrections atteint (${planData.limits.autoFixesPerMonth}/mois). Passez à Pro pour des corrections illimitées.`, 402);
      }
    }

    if (payload.patch) return OK(res, { issue, patch: payload.patch });

    const site = await sql`SELECT domain FROM websites WHERE id=${issue.website_id}`;
    const domain = site.rows[0]?.domain || 'votre-site.com';
    const patch = await generatePatch({ issue, payload, domain });

    const updated = await sql`
      UPDATE issues SET payload = payload || ${JSON.stringify({ patch, patchGeneratedAt: new Date().toISOString() })}::JSONB, updated_at=NOW()
      WHERE id=${issueId} AND workspace_id=${workspaceId} RETURNING *
    `;
    return OK(res, { issue: updated.rows[0], patch });
  } catch (e) {
    return KO(res, e?.message || 'Erreur generation correction', 500);
  }
}

async function generatePatch({ issue, payload, domain }) {
  const fallbackAfter =
    payload.after?.value || 'healthy';
  const prompt = `Tu es le Fix Agent de SiteGuard AI. Génère une correction RÉELLE et prête à appliquer pour le problème détecté.

Site: ${domain}
Problème: ${issue.title} (${issue.impact || 'Medium'})
Chemin: ${issue.path || '/'}
Diagnostic: ${payload.diagnosis || issue.description || ''}
Preuves: ${JSON.stringify(payload.evidence || [])}
Correction recommandée: ${payload.recommendedFix || issue.suggestion || ''}
Détail proposé: ${payload.fixDetail || ''}

Réponds UNIQUEMENT avec un objet JSON valide sur UNE SEULE LIGNE, en moins de 400 tokens, sans markdown et sans texte autour. Le champ "after" doit contenir LE CODE ou LA CONFIGURATION EXACTE à mettre en place (fichier complet ou bloc), pas une description. Structure :
{"file":"nom du fichier/config cible (ex: vercel.json, nginx.conf, index.html, robots.txt, sitemap.xml)","change":"résumé court de la modification","before":"contenu actuel exact ou 'absent'","after":"CODE/CONFIG exact à appliquer","instructions":"étapes concrètes numérotées 1. 2. 3. pour l'appliquer"}`;
  const raw = await callOpenRouter(prompt, 45000);
  const rawText = raw ? String(raw.output || '').trim() : '';
  const parsed = tryParsePatch(rawText);
  if (parsed) {
    return {
      file: String(parsed.file || 'voir instructions'),
      change: String(parsed.change || `Correction appliquée : ${payload.recommendedFix || ''}`),
      before: String(parsed.before ?? 'absent'),
      after: String(parsed.after || fallbackAfter),
      instructions: String(parsed.instructions || payload.recommendedFix || ''),
      generatedBy: 'Fix Agent (LLM)',
    };
  }
  return {
    file: 'voir instructions',
    change: `Correction appliquée : ${payload.recommendedFix || 'problème corrigé'}`,
    before: 'absent',
    after: payload.fixDetail || fallbackAfter,
    instructions: payload.recommendedFix || 'Appliquez le détail fourni par le diagnostic.',
    generatedBy: 'Fix Agent',
    raw: rawText.substring(0, 500),
  };
}

function tryParsePatch(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  const body = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(body);
  } catch (e) {
    const grab = (key) => {
      const m = new RegExp('"' + key + '"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|[^,}]+)').exec(body);
      if (!m) return '';
      const v = m[1].trim();
      if (v.startsWith('"')) {
        try {
          return JSON.parse(v);
        } catch (e2) {
          return v;
        }
      }
      return v;
    };
    const out = { file: grab('file'), change: grab('change'), before: grab('before'), after: grab('after'), instructions: grab('instructions') };
    return out.after || out.file ? out : null;
  }
}

async function notificationsList(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'GET')) return;
  try {
    const rows = await sql`SELECT * FROM notifications WHERE user_id=${user.id} ORDER BY created_at DESC LIMIT 100`;
    return OK(res, { notifications: rows.rows });
  } catch (e) {
    return KO(res, e?.message || 'Erreur notifications', 500);
  }
}

async function notificationsRead(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { id } = req.body || {};
    if (id) await sql`UPDATE notifications SET read_at=NOW() WHERE id=${id} AND user_id=${user.id}`;
    else await sql`UPDATE notifications SET read_at=NOW() WHERE user_id=${user.id} AND read_at IS NULL`;
    return OK(res, { read: true });
  } catch (e) {
    return KO(res, e?.message || 'Erreur lecture notifications', 500);
  }
}

async function dashboardOverview(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'GET')) return;
  try {
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return OK(res, {
      websites: 0, healthy: 0, issues: 0, approvals: 0, healthScore: 0, trend: '—',
      metrics: [
        { label: 'Availability', value: '—', percent: 0, tone: 'neutral', hint: '-' },
        { label: 'Performance', value: '—', percent: 0, tone: 'neutral', hint: '-' },
        { label: 'Security', value: '—', percent: 0, tone: 'neutral', hint: '-' },
        { label: 'SEO', value: '—', percent: 0, tone: 'neutral', hint: '-' },
        { label: 'Forms', value: '—', percent: 0, tone: 'neutral', hint: '-' },
      ],
    });

    const [sites, openIssues, approvals, scans] = await Promise.all([
      sql`SELECT status, health_score FROM websites WHERE workspace_id=${workspaceId}`,
      sql`SELECT severity, category FROM issues WHERE workspace_id=${workspaceId} AND status IN ('open','in_progress')`,
      sql`SELECT count(*)::int AS n FROM issues WHERE workspace_id=${workspaceId} AND status='in_progress'`,
      sql`SELECT status, error FROM scans WHERE workspace_id=${workspaceId}`,
    ]);

    const total = sites.rows.length;
    const healthy = sites.rows.filter((s) => s.status === 'healthy').length;
    const avgHealth = total ? Math.round(sites.rows.reduce((a, s) => a + (s.health_score || 0), 0) / total) : 0;
    const open = openIssues.rows;
    const counts = { critical: open.filter((i) => i.severity === 'critical').length, warning: open.filter((i) => i.severity === 'high' || i.severity === 'medium').length, optimization: open.filter((i) => i.severity === 'low').length };
    const byCategory = (cat) => open.filter((i) => i.category === cat).length;

    const availRows = scans.rows;
    const availPct = availRows.length ? Math.round(100 * availRows.filter((s) => s.status === 'completed' && !s.error).length / availRows.length) : 100;

    const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
    return OK(res, {
      websites: total,
      healthy,
      issues: open.length,
      approvals: approvals.rows[0]?.n || 0,
      healthScore: avgHealth,
      trend: `${healthy}/${total} healthy`,
      metrics: [
        { label: 'Availability', value: `${availPct.toFixed(2)}%`.replace('.00', ''), percent: availPct, tone: availPct >= 99 ? 'healthy' : availPct >= 95 ? 'warning' : 'critical', hint: 'scan success rate' },
        { label: 'Performance', value: 'n/a', percent: 0, tone: 'neutral', hint: 'connect a site' },
        { label: 'Security', value: `${clamp(100 - counts.critical * 25 - counts.warning * 10)}/100`, percent: clamp(100 - counts.critical * 25 - counts.warning * 10), tone: counts.critical > 0 ? 'critical' : counts.warning > 0 ? 'warning' : 'healthy', hint: byCategory('Security') ? `${byCategory('Security')} open security issues` : 'no open security issues' },
        { label: 'SEO', value: `${clamp(100 - counts.optimization * 6)}/100`, percent: clamp(100 - counts.optimization * 6), tone: counts.optimization > 4 ? 'warning' : 'healthy', hint: byCategory('SEO') ? `${byCategory('SEO')} open SEO issues` : 'no open SEO issues' },
        { label: 'Forms', value: `${clamp(100 - counts.warning * 12)}/100`, percent: clamp(100 - counts.warning * 12), tone: byCategory('Forms') ? 'warning' : 'healthy', hint: byCategory('Forms') ? `${byCategory('Forms')} open form issues` : 'all forms healthy' },
      ],
    });
  } catch (e) {
    return KO(res, e?.message || 'Erreur dashboard', 500);
  }
}

async function activityList(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'GET')) return;
  try {
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return OK(res, { activity: [] });
    const [scans, issues, payments] = await Promise.all([
      sql`SELECT s.*, w.domain FROM scans s JOIN websites w ON w.id = s.website_id WHERE s.workspace_id=${workspaceId} ORDER BY s.created_at DESC LIMIT 40`,
      sql`SELECT i.*, w.domain FROM issues i JOIN websites w ON w.id = i.website_id WHERE i.workspace_id=${workspaceId} AND i.status='open' ORDER BY i.detected_at DESC LIMIT 30`,
      sql`SELECT p.* FROM payments p WHERE p.workspace_id=${workspaceId} AND p.status='success' ORDER BY p.paid_at DESC LIMIT 20`,
    ]);
    const events = [];
    for (const s of scans.rows) {
      events.push({
        id: `scan-${s.id}`,
        time: s.created_at,
        agent: 'Monitor Agent',
        message: `Scanned ${s.domain} · ${s.issues_found} issue(s) in ${s.duration_ms} ms`,
        kind: s.issues_found > 0 ? 'detect' : 'verify',
        site: s.domain,
      });
    }
    for (const i of issues.rows) {
      events.push({
        id: `issue-${i.id}`,
        time: i.detected_at,
        agent: i.detected_by || 'AI diagnosis',
        message: `${i.title} · ${i.domain}${i.path && i.path !== '/' ? ' ' + i.path : ''}`,
        kind: 'detect',
        site: i.domain,
      });
    }
    for (const p of payments.rows) {
      events.push({
        id: `pay-${p.id}`,
        time: p.paid_at,
        agent: 'Billing',
        message: `Payment received · ${(p.amount_cfa / 1000).toFixed(0)}k FCFA (${p.plan_code})`,
        kind: 'verify',
      });
    }
    events.sort((a, b) => new Date(b.time) - new Date(a.time));
    return OK(res, { activity: events.slice(0, 50) });
  } catch (e) {
    return KO(res, e?.message || 'Erreur activite', 500);
  }
}

async function billingSummary(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'GET')) return;
  try {
    const workspaceId = await firstWorkspace(user.id);
    const planData = await getEffectivePlan(user.id);
    const sub = await sql`
      SELECT s.status, s.current_period_end, s.cancel_at_period_end, s.provider, s.trial_ends_at, p.code, p.name, p.price_cfa, p.features, p.limits
      FROM subscriptions s JOIN plans p ON p.id = s.plan_id
      WHERE s.user_id=${user.id} ORDER BY s.created_at DESC LIMIT 1
    `;
    const payments = await sql`SELECT * FROM payments WHERE user_id=${user.id} ORDER BY created_at DESC LIMIT 50`;
    const sites = await sql`SELECT count(*)::int AS n FROM websites WHERE workspace_id=${workspaceId}`;
    const scans = await sql`SELECT count(*)::int AS n FROM scans WHERE workspace_id=${workspaceId} AND created_at > date_trunc('month', NOW())`;
    const openIssues = await sql`SELECT count(*)::int AS n FROM issues WHERE workspace_id=${workspaceId} AND status IN ('open','in_progress')`;
    const resolved = await sql`SELECT count(*)::int AS n FROM issues WHERE workspace_id=${workspaceId} AND status='resolved'`;
    const s = sub.rows[0];
    const hasEntitlement = planData.status !== 'none';
    return OK(res, {
      subscription: hasEntitlement
        ? { status: planData.status, planCode: planData.code, planName: planData.name, priceCfa: s?.price_cfa ?? (planData.code === 'starter' ? 0 : 50000), periodEnd: s?.current_period_end ?? planData.trialEndsAt, trialEndsAt: planData.trialEndsAt, cancelAtPeriodEnd: s?.cancel_at_period_end ?? false, provider: s?.provider ?? 'manual' }
        : null,
      payments: payments.rows,
      usage: {
        websites: sites.rows[0]?.n || 0,
        websitesMax: planData.limits.websites,
        scans: scans.rows[0]?.n || 0,
        openIssues: openIssues.rows[0]?.n || 0,
        resolved: resolved.rows[0]?.n || 0,
      },
    });
  } catch (e) {
    return KO(res, e?.message || 'Erreur billing', 500);
  }
}

async function automationsList(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'GET')) return;
  try {
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return OK(res, { automations: [] });
    const rows = await sql`SELECT * FROM automations WHERE workspace_id=${workspaceId} ORDER BY created_at ASC`;
    return OK(res, { automations: rows.rows });
  } catch (e) {
    return KO(res, e?.message || 'Erreur automations', 500);
  }
}

async function automationsUpdate(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const { id, enabled } = req.body || {};
    const workspaceId = await firstWorkspace(user.id);
    if (!workspaceId) return KO(res, 'Workspace introuvable', 404);
    const r = await sql`UPDATE automations SET enabled=${Boolean(enabled)}, updated_at=NOW() WHERE id=${id} AND workspace_id=${workspaceId} RETURNING *`;
    if (r.rows.length === 0) return KO(res, 'Automation introuvable', 404);
    return OK(res, { automation: r.rows[0] });
  } catch (e) {
    return KO(res, e?.message || 'Erreur automation', 500);
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
  'websites/list': websitesList,
  'websites/create': websitesCreate,
  'websites/scan': websitesScan,
  'websites/delete': websitesDelete,
  'issues/list': issuesList,
  'issues/update': issuesUpdate,
  'issues/fix': issuesFix,
  'notifications/list': notificationsList,
  'notifications/read': notificationsRead,
  'dashboard/overview': dashboardOverview,
  'dashboard/activity': activityList,
  'billing/summary': billingSummary,
  'automations/list': automationsList,
  'automations/update': automationsUpdate,
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