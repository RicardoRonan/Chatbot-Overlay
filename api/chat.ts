import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAgent, validateOrigin } from '../lib/agents';
import { streamGroqResponse, type ChatMessage } from '../lib/groq';

// Simple in-memory rate limiter (per cold start instance)
const bucket: Record<string, { tokens: number; ts: number }> = {};
const WINDOW_MS = 60_000; // 1 minute
const MAX_TOKENS = 30; // 30 events per minute per ip+agent

function rateLimit(key: string): boolean {
  const now = Date.now();
  const rec = bucket[key] || { tokens: MAX_TOKENS, ts: now };
  const elapsed = now - rec.ts;
  const refill = Math.floor(elapsed / WINDOW_MS) * MAX_TOKENS;
  rec.tokens = Math.min(MAX_TOKENS, rec.tokens + refill);
  rec.ts = rec.ts + Math.floor(elapsed / WINDOW_MS) * WINDOW_MS;
  if (rec.tokens <= 0) {
    bucket[key] = rec;
    return false;
  }
  rec.tokens -= 1;
  bucket[key] = rec;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { agentId, messages, stream, origin } = req.body || {};
  const agent = getAgent(String(agentId || 'default'));
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  if (!validateOrigin(agent, origin || req.headers.origin || req.headers.referer)) {
    res.status(403).json({ error: 'Forbidden: origin not allowed' });
    return;
  }

  const limiterKey = `${req.headers['x-forwarded-for'] || req.socket.remoteAddress}-${agent.id}`;
  if (!rateLimit(limiterKey)) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  const apiKey = agent.apiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing GROQ_API_KEY' });
    return;
  }

  const history: ChatMessage[] = [];
  if (agent.systemPrompt) history.push({ role: 'system', content: agent.systemPrompt });
  if (Array.isArray(messages)) {
    for (const m of messages) {
      if (m && (m.role === 'user' || m.role === 'assistant' || m.role === 'system') && typeof m.content === 'string') {
        history.push({ role: m.role, content: m.content });
      }
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const abort = new AbortController();
  req.on('close', () => abort.abort());

  try {
    const groqResp = await streamGroqResponse({ apiKey, model: agent.model, messages: history, signal: abort.signal });
    if (!groqResp.ok || !groqResp.body) {
      res.write(`data: ${JSON.stringify({ event: 'error', data: 'Groq error' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const reader = groqResp.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // Pipe tokens as we receive chunks (best effort)
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        // Heuristic: forward raw text as tokens
        res.write(`data: ${JSON.stringify({ event: 'token', data: trimmed })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ event: 'error', data: 'Stream interrupted' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}


