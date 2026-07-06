;(() => {
  // v98: protect Telegram Mini App from closing, but do not fake/rubber-transform the page.
  const PRODUCT = '.product-detail-screen';
  const IMG = '.product-gallery-slide img, .product-detail-gallery img';
  function tg() { return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null; }
  function protect() {
    const app = tg();
    if (!app) return;
    try { app.ready && app.ready(); } catch (_) {}
    try { app.expand && app.expand(); } catch (_) {}
    try { app.disableVerticalSwipes && app.disableVerticalSwipes(); } catch (_) {}
  }
  function active() { return !!document.querySelector(PRODUCT); }
  function cleanupRubber() {
    document.body.classList.remove('snkr-v96-edge-active');
    document.documentElement.style.removeProperty('--snkr-v96-edge-y');
    document.body.style.removeProperty('--snkr-v96-edge-y');
  }
  function sync(root = document) {
    const on = active();
    document.body.classList.toggle('snkr-v98-product-active', on);
    cleanupRubber();
    if (on) protect();
    root.querySelectorAll?.(IMG).forEach((img) => {
      img.loading = 'eager';
      img.decoding = 'async';
      img.style.opacity = '1';
      img.style.visibility = 'visible';
      const src = img.currentSrc || img.src;
      if (src) { try { const warm = new Image(); warm.src = src; } catch (_) {} }
    });
  }
  window.addEventListener('touchstart', protect, { capture: true, passive: true });
  window.addEventListener('resize', () => { protect(); cleanupRubber(); }, { passive: true });
  document.addEventListener('visibilitychange', protect, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => sync(), { once: true });
  else sync();
  new MutationObserver((mutations) => {
    sync();
    for (const m of mutations) for (const node of m.addedNodes) if (node.nodeType === 1) sync(node);
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.setInterval(protect, 1800);
})();
