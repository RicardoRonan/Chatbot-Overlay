(() => {
  const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const agentId = currentScript.getAttribute('data-agent') || 'default';
  const title = currentScript.getAttribute('data-title') || 'Chat';
  const color = currentScript.getAttribute('data-color') || '#111827';

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.right = '16px';
  container.style.bottom = '16px';
  container.style.zIndex = '2147483000';
  container.style.width = '72px';
  container.style.height = '72px';
  container.style.borderRadius = '36px';

  const button = document.createElement('button');
  button.setAttribute('aria-label', 'Open chat');
  button.style.width = '100%';
  button.style.height = '100%';
  button.style.border = 'none';
  button.style.borderRadius = '50%';
  button.style.background = color;
  button.style.color = '#fff';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)';
  button.innerHTML = '💬';

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '16px';
  iframe.style.bottom = '96px';
  iframe.style.width = '360px';
  iframe.style.height = '560px';
  iframe.style.maxHeight = 'calc(100vh - 112px)';
  iframe.style.border = '0';
  iframe.style.borderRadius = '12px';
  iframe.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)';
  iframe.style.display = 'none';
  iframe.allow = 'clipboard-write;';

  // Adjust iframe position to stay within viewport
  function adjustIframePosition() {
    const viewportHeight = window.innerHeight;
    const iframeHeight = 560;
    const buttonHeight = 72;
    const buttonBottom = 16; // Button distance from bottom
    const spacing = 8; // Spacing between button top and iframe bottom
    const minTop = 16; // Minimum distance from top
    
    const bottomPosition = buttonBottom + buttonHeight + spacing; // 16 + 72 + 8 = 96px
    const maxBottom = viewportHeight - minTop; // Maximum bottom position
    
    // If iframe would go off the top, adjust bottom position
    if (iframeHeight + bottomPosition > viewportHeight) {
      const adjustedBottom = Math.max(minTop, viewportHeight - iframeHeight - spacing);
      iframe.style.bottom = adjustedBottom + 'px';
    } else {
      iframe.style.bottom = bottomPosition + 'px';
    }
  }

  // Adjust on window resize
  window.addEventListener('resize', adjustIframePosition);
  // Initial adjustment
  adjustIframePosition();

  const srcBase = new URL(currentScript.src, window.location.href);
  // Resolve widget origin to same host root for /embed
  const baseOrigin = srcBase.origin;
  iframe.src = `${baseOrigin}/embed?agent=${encodeURIComponent(agentId)}&title=${encodeURIComponent(title)}&color=${encodeURIComponent(color)}`;

  function toggle() {
    const open = iframe.style.display !== 'none';
    if (open) {
      iframe.style.display = 'none';
      button.setAttribute('aria-expanded', 'false');
    } else {
      adjustIframePosition(); // Recalculate position before showing
      iframe.style.display = 'block';
      button.setAttribute('aria-expanded', 'true');
    }
  }

  button.addEventListener('click', toggle);

  window.addEventListener('message', (event) => {
    if (typeof event.data !== 'object' || !event.data) return;
    if (event.data.type === 'chatbot:close') toggle();
  });

  container.appendChild(button);
  document.body.appendChild(container);
  document.body.appendChild(iframe);
})();


