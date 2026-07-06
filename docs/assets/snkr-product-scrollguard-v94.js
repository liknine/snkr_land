;(() => {
  // v94: Telegram Mini App vertical-swipe guard + product-page edge guard.
  // Keeps the v87 gallery untouched. Goal: stop accidental Mini App collapse without fake rubber transforms.
  const PRODUCT = '.product-detail-screen';
  let startY = 0;
  let startX = 0;
  let inProduct = false;
  let lastArm = 0;

  function tg() {
    return window.Telegram && window.Telegram.WebApp;
  }

  function lockTelegramVerticalSwipes() {
    const app = tg();
    if (!app) return;
    try { app.ready && app.ready(); } catch (_) {}
    try { app.expand && app.expand(); } catch (_) {}
    // Telegram WebApp API: prevents swipe-down from minimizing/closing the Mini App.
    try { app.disableVerticalSwipes && app.disableVerticalSwipes(); } catch (_) {}
  }

  function isProductScreen() {
    return !!document.querySelector(PRODUCT);
  }

  function scrollTop() {
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function maxScroll() {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(0, Math.max(doc.scrollHeight, body ? body.scrollHeight : 0) - window.innerHeight);
  }

  function armEdgeBuffer() {
    if (!isProductScreen()) return;
    const now = performance.now();
    if (now - lastArm < 120) return;
    lastArm = now;
    const max = maxScroll();
    if (max <= 2) return;
    const y = scrollTop();
    // Keep the page one pixel away from absolute WebView edges. This removes Telegram's first-pull collapse trigger.
    if (y <= 0) window.scrollTo(0, 1);
    else if (y >= max - 1) window.scrollTo(0, Math.max(0, max - 1));
  }

  function point(event) {
    const t = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
    return t ? { x: t.clientX, y: t.clientY } : { x: 0, y: 0 };
  }

  function isGalleryHorizontalSwipe(event, dx, dy) {
    return !!event.target?.closest?.('.product-detail-gallery') && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.18;
  }

  function onStart(event) {
    lockTelegramVerticalSwipes();
    inProduct = isProductScreen();
    if (!inProduct) return;
    const p = point(event);
    startX = p.x;
    startY = p.y;
    armEdgeBuffer();
  }

  function onMove(event) {
    if (!inProduct) return;
    const p = point(event);
    const dx = p.x - startX;
    const dy = p.y - startY;

    // Do not touch gallery horizontal swipes. This keeps photo smoothness exactly as in v87.
    if (isGalleryHorizontalSwipe(event, dx, dy)) return;

    const max = maxScroll();
    if (max <= 2) return;
    const y = scrollTop();
    const pullingDownAtTop = y <= 0 && dy > 0 && Math.abs(dy) > Math.abs(dx);
    const pullingUpAtBottom = y >= max - 1 && dy < 0 && Math.abs(dy) > Math.abs(dx);

    if (pullingDownAtTop || pullingUpAtBottom) {
      // Consume only the dangerous edge pull so Telegram does not minimize the app.
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      armEdgeBuffer();
    }
  }

  function onEnd() {
    inProduct = false;
    if (isProductScreen()) armEdgeBuffer();
  }

  function boot() {
    lockTelegramVerticalSwipes();
    if (isProductScreen()) armEdgeBuffer();
  }

  window.addEventListener('touchstart', onStart, { capture: true, passive: true });
  window.addEventListener('touchmove', onMove, { capture: true, passive: false });
  window.addEventListener('touchend', onEnd, { capture: true, passive: true });
  window.addEventListener('touchcancel', onEnd, { capture: true, passive: true });
  window.addEventListener('scroll', armEdgeBuffer, { passive: true });
  window.addEventListener('resize', boot, { passive: true });
  document.addEventListener('visibilitychange', boot, { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  new MutationObserver(boot).observe(document.documentElement, { childList: true, subtree: true });
})();
