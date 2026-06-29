;(() => {
  // v93: Product page scroll guard for Telegram Mini App.
  // Goal: prevent accidental app collapse on top/bottom pull, without jerky fake transforms.
  const PRODUCT = '.product-detail-screen';
  const GALLERY = '.product-detail-gallery';
  const TRACK = '.product-gallery-track';
  const HORIZONTAL_CLASS = 'snkr-product-horizontal-swipe';
  let startX = 0;
  let startY = 0;
  let mode = 'idle';
  let touchingProduct = false;
  let lastNudge = 0;

  const point = (event) => {
    const t = event.touches?.[0] || event.changedTouches?.[0];
    return t ? { x: t.clientX, y: t.clientY } : { x: event.clientX || 0, y: event.clientY || 0 };
  };
  const productScreen = () => document.querySelector(PRODUCT);
  const getScrollTop = () => window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const getMaxScroll = () => Math.max(0, (document.documentElement.scrollHeight || document.body.scrollHeight || 0) - (window.innerHeight || document.documentElement.clientHeight || 0));
  function nudgeFromEdge() {
    const now = performance.now();
    if (now - lastNudge < 120) return;
    lastNudge = now;
    const top = getScrollTop();
    const max = getMaxScroll();
    if (max <= 2) return;
    if (top <= 0) window.scrollTo(0, 1);
    else if (top >= max) window.scrollTo(0, Math.max(0, max - 1));
  }
  function isInteractive(target) {
    return !!target?.closest?.('button,a,input,textarea,select,label,.product-gallery-dots,.product-gallery-prev,.product-gallery-next');
  }
  function onStart(event) {
    const product = event.target?.closest?.(PRODUCT);
    touchingProduct = !!product;
    mode = touchingProduct ? 'pending' : 'idle';
    if (!touchingProduct) return;
    const p = point(event);
    startX = p.x;
    startY = p.y;
    nudgeFromEdge();
  }
  function onMove(event) {
    if (!touchingProduct) return;
    const p = point(event);
    const dx = p.x - startX;
    const dy = p.y - startY;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    if (mode === 'pending') {
      if (event.target?.closest?.(GALLERY) && !isInteractive(event.target) && ax > 12 && ax > ay * 1.18) {
        mode = 'horizontal';
        document.documentElement.classList.add(HORIZONTAL_CLASS);
        document.body.classList.add(HORIZONTAL_CLASS);
        return;
      }
      if (ay > 6 && ay >= ax) mode = 'vertical';
    }

    if (mode === 'horizontal') return;

    // Boundary guard: when the product page is at the very top/bottom, consume only the extra pull.
    // This stops Telegram from collapsing the mini app while preserving normal page scroll inside the card.
    const top = getScrollTop();
    const max = getMaxScroll();
    if (max <= 0) return;
    const pullingDownAtTop = top <= 0 && dy > 0;
    const pullingUpAtBottom = top >= max - 1 && dy < 0;
    if (pullingDownAtTop || pullingUpAtBottom) {
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      nudgeFromEdge();
    }
  }
  function onEnd() {
    touchingProduct = false;
    mode = 'idle';
    document.documentElement.classList.remove(HORIZONTAL_CLASS);
    document.body.classList.remove(HORIZONTAL_CLASS);
    if (productScreen()) nudgeFromEdge();
  }
  function onScroll() {
    if (productScreen()) nudgeFromEdge();
  }
  function init() {
    if (!productScreen()) return;
    nudgeFromEdge();
    document.querySelectorAll(TRACK).forEach((track) => {
      // Keep old transform-based patches neutralized if Telegram cache still contains them.
      track.style.removeProperty('--snkr-gallery-x');
      track.classList.remove('snkr-v92-dragging','snkr-v92-animating');
    });
  }

  document.addEventListener('touchstart', onStart, { capture: true, passive: true });
  document.addEventListener('touchmove', onMove, { capture: true, passive: false });
  document.addEventListener('touchend', onEnd, { capture: true, passive: true });
  document.addEventListener('touchcancel', onEnd, { capture: true, passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', init, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  new MutationObserver(init).observe(document.documentElement, { childList: true, subtree: true });
})();
