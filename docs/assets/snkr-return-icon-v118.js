(() => {
  const SVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 6H6v4"/>
      <path d="M6.6 9.2A7.5 7.5 0 1 0 9.3 5.9"/>
    </svg>`;

  function patchReturnIcon() {
    document.querySelectorAll('.snkr-v111-mini--return > .snkr-v111-icon--small').forEach((el) => {
      el.innerHTML = SVG;
      el.dataset.snkrReturnIconV118 = '1';
    });
  }

  function schedulePatch() {
    requestAnimationFrame(() => requestAnimationFrame(patchReturnIcon));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedulePatch, { once: true });
  } else {
    schedulePatch();
  }

  window.addEventListener('load', schedulePatch, { once: true });
  document.addEventListener('click', schedulePatch, true);
  new MutationObserver(schedulePatch).observe(document.documentElement, { childList: true, subtree: true });
})();
