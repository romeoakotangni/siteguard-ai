import { getEnv, getOpenRouterKey, getDefaultModel } from '../../_env';

export interface ProviderResult {
  output: string;
  model: string;
  cost?: number;
  usage?: any;
}

export async function callOpenRouter(prompt: string, options?: any): Promise<ProviderResult | null> {
  const key = getOpenRouterKey();
  if (!key) return null;

  const model = options?.model || getDefaultModel();
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': getEnv('APP_URL', 'http://localhost:5173') || 'http://localhost:5173',
        'X-Title': 'SiteGuard AI',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are SiteGuard AI agent. Be precise, actionable, safe.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const output = data?.choices?.[0]?.message?.content || '';
    return { output, model, usage: data?.usage };
  } catch (e) {
    return null;
  }
}
