# Groq Chatbot Overlay (Vercel + Vanilla JS)

Embeddable bottom-right chat widget that works on any website (including web builders). Messages are proxied through a Vercel serverless function to the Groq Responses API, keeping API keys secure and allowing per-agent configuration.

## Quick Start

1. Create a project on Vercel and import this repository.
2. Set environment variable `GROQ_API_KEY` in Vercel Project Settings.
3. Optionally edit `agents.json` to add per-site agents. You can set a per-agent `apiKey` to override the default.
4. Deploy.

### Embed snippet
```html
<script src="https://YOUR-VERCEL-DOMAIN.vercel.app/public/widget.js" data-agent="default" data-title="Assistant" data-color="#111827"></script>
```
- Only `data-agent` is required.
- Color is any CSS color string.

### Agent config (`agents.json`)
- `allowedOrigins` may include `*` or exact origins like `https://example.com`.
- `model` should be a Groq model ID. Example: `openai/gpt-oss-20b` (see Groq docs).

### API
- `POST /api/chat` with body `{ agentId, messages: [{role, content}], stream: true, origin }` streams SSE tokens.
- `GET /api/agents/:id` returns public data for the widget.

## Local Dev
- Use Vercel CLI: `npm i -g vercel` then `vercel dev`.
- Open `http://localhost:3000/public/demo.html`.

## Security
- Origin allowlist per agent.
- Basic in-memory rate limiter.

## Groq Docs
- See Groq OpenAI-compatible Responses API: [console.groq.com/docs/overview](https://console.groq.com/docs/overview)


