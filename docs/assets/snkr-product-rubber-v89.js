;(() => {
  // v89: much softer product-card rubber. Prevents Telegram jump without jerky jumps.
  const DETAIL = '.product-detail-screen';
  const IGNORE = '.filter-sheet-layer,.side-menu-layer,input,textarea,select,button,a';
  const HORIZONTAL_GALLERY = '.product-detail-gallery .product-gallery-track, .product-detail-gallery';
  const MAX_PULL = 42;

  let tracking = false;
  let rubbering = false;
  let startX = 0;
  let startY = 0;
  let edgeStartY = 0;
  let screen = null;
  let raf = 0;
  let targetPull = 0;
  let currentPull = 0;
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
    // Very soft compression: big finger movement gives small, calm visual movement.
    const eased = Math.min(MAX_PULL, Math.log1p(abs) * 8.2);
    return delta < 0 ? -eased : eased;
  }
  function renderLoop() {
    raf = 0;
    if (!screen) return;
    currentPull += (targetPull - currentPull) * 0.22;
    if (Math.abs(targetPull - currentPull) < 0.08) currentPull = targetPull;
    screen.style.setProperty('--snkr-product-rubber-y', `${currentPull.toFixed(2)}px`);
    if (rubbering && Math.abs(targetPull - currentPull) > 0.08) {
      raf = requestAnimationFrame(renderLoop);
    }
  }
  function scheduleRender() {
    if (!raf) raf = requestAnimationFrame(renderLoop);
  }
  function applyPull(value) {
    if (!screen) return;
    clearTimeout(releaseTimer);
    screen.classList.remove('snkr-product-rubber-release');
    screen.classList.add('snkr-product-rubber-active');
    targetPull = value;
    scheduleRender();
  }
  function release() {
    if (!screen) return;
    const current = screen;
    rubbering = false;
    targetPull = 0;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    current.classList.remove('snkr-product-rubber-active');
    current.classList.add('snkr-product-rubber-release');
    current.style.setProperty('--snkr-product-rubber-y', '0px');
    currentPull = 0;
    releaseTimer = setTimeout(() => {
      current.classList.remove('snkr-product-rubber-release');
      current.style.removeProperty('--snkr-product-rubber-y');
    }, 680);
  }
  function cleanup() {
    if (rubbering || Math.abs(currentPull) > 0.1) release();
    tracking = false;
    rubbering = false;
    screen = null;
    edgeStartY = 0;
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
    edgeStartY = p.y;
    targetPull = 0;
    currentPull = 0;
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

    // Horizontal photo swipe is handled by the gallery patch. Do not fight it.
    if (!rubbering && event.target?.closest?.(HORIZONTAL_GALLERY) && ax > 12 && ax > ay * 1.10) return;
    if (ay < 8 || ay < ax * 1.08) return;

    const { y, max } = metrics();
    const atTop = y <= 1;
    const atBottom = y >= max - 1;
    const pullDown = dy > 0;
    const pullUp = dy < 0;
    const shouldRubber = (atTop && pullDown) || (atBottom && pullUp);

    if (!shouldRubber) {
      edgeStartY = p.y;
      if (rubbering) release();
      return;
    }

    if (!rubbering) {
      rubbering = true;
      edgeStartY = p.y; // prevents the first frame jump when the scroll just reached an edge
      currentPull = 0;
      targetPull = 0;
    }

    const edgeDelta = p.y - edgeStartY;
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    applyPull(pullValue(edgeDelta));
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
