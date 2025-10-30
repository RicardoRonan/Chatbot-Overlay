import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAgent } from '../../../lib/agents';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id?: string };
  const agent = getAgent(String(id || 'default'));
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  const { apiKey, allowedOrigins, ...pub } = agent;
  res.status(200).json({ ...pub });
}


