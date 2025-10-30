export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function streamGroqResponse(params: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}): Promise<Response> {
  const url = 'https://api.groq.com/openai/v1/responses';
  const body = JSON.stringify({
    model: params.model,
    input: messagesToInput(params.messages),
    stream: true
  });

  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json'
    },
    body,
    signal: params.signal
  });
}

function messagesToInput(messages: ChatMessage[]) {
  // Simple concat for system+user context; Responses API accepts free-form input
  // Implementers can switch to structured content later if needed
  const parts: string[] = [];
  for (const m of messages) {
    parts.push(`${m.role.toUpperCase()}: ${m.content}`);
  }
  return parts.join('\n');
}


