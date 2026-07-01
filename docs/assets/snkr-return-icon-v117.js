(() => {
  const SVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 7H5v4"/>
      <path d="M5.5 8.5a7 7 0 1 1-1 6.8"/>
    </svg>`;

  function patchReturnIcon() {
    document.querySelectorAll('.snkr-v111-mini--return > .snkr-v111-icon--small').forEach((el) => {
      if (el.dataset.snkrReturnIconV117 === '1') return;
      el.dataset.snkrReturnIconV117 = '1';
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
