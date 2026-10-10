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
    const err: any = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.upgrade = Boolean(data?.details?.upgrade);
    err.code = data?.details?.plan || null;
    err.limit = data?.details?.limit || null;
    throw err;
  }
  return (data && typeof data === 'object' && 'data' in data ? data.data : data) as T;
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
  websites: {
    list: () => request('/websites/list'),
    create: (payload: { url: string; name?: string; client?: string }) => request('/websites/create', { method: 'POST', body: JSON.stringify(payload) }),
    scan: (websiteId: string) => request('/websites/scan', { method: 'POST', body: JSON.stringify({ websiteId }) }),
    delete: (websiteId: string) => request('/websites/delete', { method: 'POST', body: JSON.stringify({ websiteId }) }),
  },
  issues: {
    list: (params?: { site?: string; status?: string; severity?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return request(`/issues/list${qs ? `?${qs}` : ''}`);
    },
    update: (payload: { issueId: string; status: string }) => request('/issues/update', { method: 'POST', body: JSON.stringify(payload) }),
    fix: (payload: { issueId: string }) => request('/issues/fix', { method: 'POST', body: JSON.stringify(payload) }),
  },
  github: {
    link: (payload: { websiteId: string; repo: string; branch?: string }) => request('/github/link', { method: 'POST', body: JSON.stringify(payload) }),
    status: (params: { websiteId: string }) => request(`/github/status?${new URLSearchParams(params).toString()}`),
    apply: (payload: { issueId: string }) => request('/github/apply', { method: 'POST', body: JSON.stringify(payload) }),
  },
  notifications: {
    list: () => request('/notifications/list'),
    read: (id?: string) => request('/notifications/read', { method: 'POST', body: JSON.stringify({ id }) }),
  },
  dashboard: {
    overview: () => request('/dashboard/overview'),
    activity: () => request('/dashboard/activity'),
  },
  billing: {
    summary: () => request('/billing/summary'),
  },
  automations: {
    list: () => request('/automations/list'),
    update: (payload: { id: string; enabled: boolean }) => request('/automations/update', { method: 'POST', body: JSON.stringify(payload) }),
  },
  db: {
    status: () => request('/db/status'),
    test: () => request('/db/test'),
    migrate: () => request('/db/migrate', { method: 'POST' }),
  },
};
