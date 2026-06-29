;(() => {
  // v88: product card edge rubber. Keeps Telegram Mini App from jumping/collapsing on edge pulls.
  const DETAIL = '.product-detail-screen';
  const IGNORE = '.filter-sheet-layer,.side-menu-layer,input,textarea,select';
  const HORIZONTAL_GALLERY = '.product-detail-gallery .product-gallery-track, .product-detail-gallery';
  const MAX_PULL = 78;

  let tracking = false;
  let rubbering = false;
  let startX = 0;
  let startY = 0;
  let screen = null;
  let releaseTimer = 0;

  function getScreen(target) {
    return target?.closest?.(DETAIL) || document.querySelector(DETAIL);
  }

  function scroller() {
    return document.scrollingElement || document.documentElement || document.body;
  }

  function metrics() {
    const el = scroller();
    const y = Math.max(0, window.scrollY || el.scrollTop || document.body.scrollTop || 0);
    const full = Math.max(el.scrollHeight || 0, document.body.scrollHeight || 0, document.documentElement.scrollHeight || 0);
    const view = window.innerHeight || document.documentElement.clientHeight || 1;
    const max = Math.max(0, full - view);
    return { y, max };
  }

  function point(event) {
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : { x: event.clientX || 0, y: event.clientY || 0 };
  }

  function pullValue(delta) {
    const abs = Math.abs(delta);
    const eased = Math.min(MAX_PULL, Math.pow(abs, 0.72) * 2.75);
    return delta < 0 ? -eased : eased;
  }

  function applyPull(value) {
    if (!screen) return;
    clearTimeout(releaseTimer);
    screen.classList.remove('snkr-product-rubber-release');
    screen.classList.add('snkr-product-rubber-active');
    screen.style.setProperty('--snkr-product-rubber-y', `${value.toFixed(2)}px`);
  }

  function release() {
    if (!screen) return;
    const current = screen;
    current.classList.remove('snkr-product-rubber-active');
    current.classList.add('snkr-product-rubber-release');
    current.style.setProperty('--snkr-product-rubber-y', '0px');
    releaseTimer = setTimeout(() => {
      current.classList.remove('snkr-product-rubber-release');
      current.style.removeProperty('--snkr-product-rubber-y');
    }, 420);
  }

  function cleanup() {
    if (rubbering) release();
    tracking = false;
    rubbering = false;
    screen = null;
  }

  function start(event) {
    const target = event.target;
    if (!target || target.closest?.(IGNORE)) return;
    const detail = getScreen(target);
    if (!detail) return;
    const p = point(event);
    tracking = true;
    rubbering = false;
    screen = detail;
    startX = p.x;
    startY = p.y;
    document.documentElement.classList.add('snkr-product-edge-guard');
    document.body.classList.add('snkr-product-edge-guard');
  }

  function move(event) {
    if (!tracking || !screen) return;
    const p = point(event);
    const dx = p.x - startX;
    const dy = p.y - startY;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    // Horizontal photo swipe must stay untouched.
    if (!rubbering && event.target?.closest?.(HORIZONTAL_GALLERY) && ax > 14 && ax > ay * 1.14) return;
    if (ay < 7 || ay < ax * 1.08) return;

    const { y, max } = metrics();
    const atTop = y <= 1;
    const atBottom = y >= max - 1;
    const pullDown = dy > 0;
    const pullUp = dy < 0;
    const shouldRubber = (atTop && pullDown) || (atBottom && pullUp);

    if (!shouldRubber) {
      if (rubbering) cleanup();
      return;
    }

    rubbering = true;
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    applyPull(pullValue(dy));
  }

  function end() {
    cleanup();
    setTimeout(() => {
      if (!document.querySelector(DETAIL)) {
        document.documentElement.classList.remove('snkr-product-edge-guard');
        document.body.classList.remove('snkr-product-edge-guard');
      }
    }, 80);
  }

  function observe() {
    const on = !!document.querySelector(DETAIL);
    document.documentElement.classList.toggle('snkr-product-edge-guard', on);
    document.body.classList.toggle('snkr-product-edge-guard', on);
  }

  document.addEventListener('touchstart', start, { capture: true, passive: true });
  document.addEventListener('touchmove', move, { capture: true, passive: false });
  document.addEventListener('touchend', end, { capture: true, passive: true });
  document.addEventListener('touchcancel', end, { capture: true, passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
  new MutationObserver(observe).observe(document.documentElement, { childList: true, subtree: true });
})();
