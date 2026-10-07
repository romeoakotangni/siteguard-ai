import crypto from 'node:crypto';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

export function isSandbox(): boolean {
  return (getEnv('KKIAPAY_SANDBOX', 'true') || 'true').toLowerCase() === 'true';
}

export function getAppUrl(): string {
  return getEnv('APP_URL', 'http://localhost:5173') || 'http://localhost:5173';
}

export function getJwtSecret(): string {
  return requireEnv('JWT_SECRET');
}

export function getSessionSecret(): string {
  return getEnv('SESSION_SECRET') || getEnv('JWT_SECRET') || crypto.randomUUID();
}

export function getOpenRouterKey(): string | undefined {
  return getEnv('OPENROUTER_API_KEY');
}

export function getDefaultModel(): string {
  return getEnv('DEFAULT_AGENT_MODEL', 'anthropic/claude-3.5-sonnet') || 'anthropic/claude-3.5-sonnet';
}
