import { callOpenRouter } from '../providers/openrouter';
import { callFallback } from '../providers/fallback';

export interface AgentRunParams {
  agentType: string;
  workspaceId: string;
  websiteId?: string;
  payload?: any;
}

export async function runAgent(params: AgentRunParams): Promise<any> {
  const basePrompt = `Agent: ${params.agentType}
Workspace: ${params.workspaceId}
Website: ${params.websiteId || 'general'}
Payload: ${JSON.stringify(params.payload || {})}
Task: Analyze and return structured findings (JSON-like with findings[], actions[], confidence).`;

  const res = await callOpenRouter(basePrompt);
  if (res) {
    return { ok: true, provider: 'openrouter', model: res.model, output: res.output, usage: res.usage };
  }
  const output = await callFallback(basePrompt);
  return { ok: true, provider: 'fallback', model: 'heuristic', output };
}
