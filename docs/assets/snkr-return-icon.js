(() => {
  const SVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8.4 8.2H5.6V5.4"/>
      <path d="M5.9 8A7.1 7.1 0 1 0 8.7 5.4"/>
    </svg>`;

  function patchReturnIcon() {
    document.querySelectorAll('.snkr-v111-mini--return > .snkr-v111-icon--small').forEach((el) => {
      el.innerHTML = SVG;
      el.dataset.snkrReturnIconFixed = '1';
    });
  }

  const run = () => requestAnimationFrame(() => requestAnimationFrame(patchReturnIcon));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  window.addEventListener('load', run, { once: true });
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });
})();
