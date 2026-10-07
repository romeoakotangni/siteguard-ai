const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  auth: {
    register: (payload: { name: string; email: string; password: string }) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload: { email: string; password: string }) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    me: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },
  users: {
    profile: (payload?: any) => (payload ? request('/users/profile', { method: 'PUT', body: JSON.stringify(payload) }) : request('/users/profile')),
  },
  checkout: {
    plans: () => request('/checkout/plans'),
    subscribe: (payload: { plan_code?: string; tx?: string | null }) => request('/checkout/subscribe', { method: 'POST', body: JSON.stringify(payload) }),
    kkiapay: (payload: { plan_code?: string; amount_cfa?: number }) => request('/kkiapay/create-checkout', { method: 'POST', body: JSON.stringify(payload) }),
  },
  agents: {
    list: () => request('/agents/list'),
    create: (payload: { name: string; type: string; config?: any }) => request('/agents/create', { method: 'POST', body: JSON.stringify(payload) }),
    run: (agentId?: string, agentType?: string, payload?: any) => request('/agents/run', { method: 'POST', body: JSON.stringify({ agentId, agentType, payload }) }),
    stop: (agentId: string) => request('/agents/stop', { method: 'POST', body: JSON.stringify({ agentId }) }),
    status: () => request('/agents/status'),
  },
  db: {
    status: () => request('/db/status'),
    test: () => request('/db/test'),
    migrate: () => request('/db/migrate', { method: 'POST' }),
  },
};
