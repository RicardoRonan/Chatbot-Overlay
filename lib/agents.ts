export type AgentConfig = {
  id: string;
  name: string;
  title?: string;
  color?: string;
  greeting?: string;
  model: string;
  systemPrompt?: string;
  allowedOrigins?: string[];
  apiKey?: string; // optional per-agent key override
};

// For quick start, load from bundled JSON at build/runtime in serverless
import agents from '../agents.json';

export function getAgent(id: string): AgentConfig | undefined {
  return (agents as AgentConfig[]).find(a => a.id === id);
}

export function validateOrigin(agent: AgentConfig, origin: string | undefined): boolean {
  if (!agent.allowedOrigins || agent.allowedOrigins.length === 0) return true;
  if (!origin) return false;
  try {
    const o = new URL(origin).origin;
    return agent.allowedOrigins.some(allowed => allowed === '*' || allowed === o);
  } catch (_e) {
    return false;
  }
}


