(function () {
  const params = new URLSearchParams(location.search);
  const agentId = params.get('agent') || 'default';
  const title = params.get('title') || 'Chat';
  const color = params.get('color') || '#111827';

  document.documentElement.style.setProperty('--brand', color);
  document.getElementById('chat-title').textContent = title;

  const messagesEl = document.getElementById('messages');
  const form = document.getElementById('form');
  const promptInput = document.getElementById('prompt');
  const closeBtn = document.getElementById('close-btn');

  function appendBubble(text, role) {
    const div = document.createElement('div');
    div.className = `bubble ${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  closeBtn.addEventListener('click', function () {
    parent.postMessage({ type: 'chatbot:close' }, '*');
  });

  let controller = null;

  async function sendMessage(text) {
    if (controller) controller.abort();
    controller = new AbortController();
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, messages: [ { role: 'user', content: text } ], stream: true, origin: document.referrer || location.origin }),
      signal: controller.signal
    });

    if (!response.ok) {
      appendBubble('Error connecting to assistant.', 'assistant');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let assistantBuffer = '';
    appendBubble('', 'assistant');
    const current = messagesEl.lastChild;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data) continue;
        if (data === '[DONE]') break;
        try {
          const evt = JSON.parse(data);
          if (evt.event === 'token') {
            assistantBuffer += evt.data;
            current.textContent = assistantBuffer;
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
        } catch (_) {}
      }
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = promptInput.value.trim();
    if (!text) return;
    appendBubble(text, 'user');
    promptInput.value = '';
    sendMessage(text);
  });
})();


