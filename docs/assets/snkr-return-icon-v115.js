(() => {
  const SVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 11.5a7 7 0 1 0 1.7 4.6"/>
      <path d="M19 5v6h-6"/>
    </svg>`;

  function patchReturnIcon() {
    document.querySelectorAll('.snkr-v111-mini--return > .snkr-v111-icon--small').forEach((el) => {
      if (el.dataset.snkrReturnIconV115 === '1') return;
      el.dataset.snkrReturnIconV115 = '1';
      el.innerHTML = SVG;
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

  const observer = new MutationObserver(schedulePatch);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
