;(() => {
  // v97: only product photo smoothness. Keep every other v96 behavior unchanged.
  // Uses native horizontal scrolling for high FPS and blocks older document-level gallery handlers
  // only while a horizontal photo swipe is happening.
  const TRACK = '.product-gallery-track';
  const GALLERY = '.product-detail-gallery';
  const DOT = '.product-gallery-dot';
  const SWIPE_CLASS = 'snkr-v97-gallery-swipe';

  let active = false;
  let horizontal = false;
  let track = null;
  let gallery = null;
  let startX = 0;
  let startY = 0;
  let startIndex = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let snapTimer = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function tgProtect() {
    const tg = window.Telegram && window.Telegram.WebApp;
    if (!tg) return;
    try { tg.expand && tg.expand(); } catch (_) {}
    try { tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (_) {}
  }

  function point(event) {
    const touch = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
    return touch ? { x: touch.clientX, y: touch.clientY } : { x: event.clientX || 0, y: event.clientY || 0 };
  }

  function slides(node = track) {
    return Array.from(node?.querySelectorAll?.('.product-gallery-slide') || []);
  }

  function maxIndex(node = track) {
    return Math.max(0, slides(node).length - 1);
  }

  function width(node = track) {
    return Math.max(1, node?.clientWidth || node?.getBoundingClientRect?.().width || 1);
  }

  function index(node = track) {
    return clamp(Math.round((node?.scrollLeft || 0) / width(node)), 0, maxIndex(node));
  }

  function syncDots(node = track, activeIndex = index(node)) {
    const parent = node?.closest?.(GALLERY);
    parent?.querySelectorAll?.(DOT).forEach((dot, i) => {
      const on = i === activeIndex;
      dot.classList.toggle('is-active', on);
      dot.classList.toggle('active', on);
    });
  }

  function clearLegacyClasses() {
    document.documentElement.classList.remove(
      'snkr-gallery-v69-horizontal',
      'snkr-gallery-native-touch',
      'snkr-gallery-swiping'
    );
    document.body.classList.remove(
      'snkr-gallery-v69-horizontal',
      'snkr-gallery-native-touch',
      'snkr-gallery-swiping'
    );
    document.querySelectorAll(`${TRACK}.snkr-v69-dragging, ${TRACK}.is-dragging, ${GALLERY}.snkr-v69-swiping, ${GALLERY}.is-swiping`).forEach((node) => {
      node.classList.remove('snkr-v69-dragging', 'is-dragging', 'snkr-v69-swiping', 'is-swiping');
    });
  }

  function smoothTo(node, targetIndex) {
    if (!node) return;
    const max = maxIndex(node);
    const target = clamp(targetIndex, 0, max);
    const left = target * width(node);
    clearTimeout(snapTimer);
    clearLegacyClasses();
    syncDots(node, target);
    try {
      node.scrollTo({ left, behavior: 'smooth' });
    } catch (_) {
      node.scrollLeft = left;
    }
    snapTimer = window.setTimeout(() => {
      if (!node.isConnected) return;
      // Hard-align only at the very end to avoid half-pixel drift, not during animation.
      if (Math.abs(node.scrollLeft - left) < 3) node.scrollLeft = left;
      syncDots(node, target);
    }, 320);
  }

  function onStart(event) {
    const targetTrack = event.target?.closest?.(TRACK);
    if (!targetTrack || !targetTrack.closest(GALLERY)) return;
    if (event.target?.closest?.(`${DOT}, button, a`)) return;
    if (maxIndex(targetTrack) < 1) return;

    tgProtect();
    clearLegacyClasses();
    clearTimeout(snapTimer);

    track = targetTrack;
    gallery = targetTrack.closest(GALLERY);
    const p = point(event);
    startX = lastX = p.x;
    startY = p.y;
    startIndex = index(track);
    lastT = performance.now();
    velocity = 0;
    active = true;
    horizontal = false;
  }

  function onMove(event) {
    if (!active || !track || !gallery) return;
    const p = point(event);
    const dx = p.x - startX;
    const dy = p.y - startY;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    velocity = (p.x - lastX) / dt;
    lastX = p.x;
    lastT = now;

    if (!horizontal) {
      if (ax < 6 && ay < 6) return;
      // Vertical movement must remain normal page scroll.
      if (ay > ax * 1.08) {
        active = false;
        horizontal = false;
        document.body.classList.remove(SWIPE_CLASS);
        clearLegacyClasses();
        return;
      }
      if (ax > 7 && ax > ay * 1.04) {
        horizontal = true;
        document.body.classList.add(SWIPE_CLASS);
        tgProtect();
      }
    }

    if (!horizontal) return;
    // Let the browser perform the horizontal scroll natively (highest FPS),
    // but stop old app-level handlers from fighting it.
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    clearLegacyClasses();
  }

  function onEnd(event) {
    if (!active || !track) {
      clearLegacyClasses();
      document.body.classList.remove(SWIPE_CLASS);
      return;
    }

    const wasHorizontal = horizontal;
    const p = point(event);
    const dx = p.x - startX;
    const ax = Math.abs(dx);
    const node = track;
    let target = index(node);

    if (wasHorizontal) {
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      const w = width(node);
      const threshold = Math.max(34, w * 0.115);
      // One gesture can move only one photo from the starting photo.
      if (dx <= -threshold || velocity < -0.42) target = startIndex + 1;
      else if (dx >= threshold || velocity > 0.42) target = startIndex - 1;
      else target = Math.round(node.scrollLeft / w);
      target = clamp(target, startIndex - 1, startIndex + 1);
      target = clamp(target, 0, maxIndex(node));
      smoothTo(node, target);
    } else if (ax < 6) {
      syncDots(node);
    }

    active = false;
    horizontal = false;
    track = null;
    gallery = null;
    window.setTimeout(() => document.body.classList.remove(SWIPE_CLASS), 260);
    tgProtect();
  }

  function onScroll(event) {
    const node = event.target?.closest?.(TRACK);
    if (!node || node !== event.target) return;
    window.requestAnimationFrame(() => syncDots(node));
  }

  function onDotClick(event) {
    const dot = event.target?.closest?.(DOT);
    if (!dot) return;
    const parent = dot.closest(GALLERY);
    const node = parent?.querySelector?.(TRACK);
    if (!node) return;
    const dots = Array.from(parent.querySelectorAll(DOT));
    const target = dots.indexOf(dot);
    if (target < 0) return;
    event.preventDefault();
    event.stopPropagation();
    smoothTo(node, target);
  }

  function init(root = document) {
    root.querySelectorAll?.(TRACK).forEach((node) => {
      node.classList.add('snkr-v97-native-track');
      slides(node).forEach((slide) => slide.classList.add('snkr-v97-native-slide'));
      syncDots(node);
      node.querySelectorAll?.('img').forEach((img) => {
        img.loading = 'eager';
        img.decoding = 'async';
      });
    });
  }

  window.addEventListener('touchstart', onStart, { capture: true, passive: true });
  window.addEventListener('touchmove', onMove, { capture: true, passive: true });
  window.addEventListener('touchend', onEnd, { capture: true, passive: true });
  window.addEventListener('touchcancel', onEnd, { capture: true, passive: true });
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  document.addEventListener('click', onDotClick, true);
  window.addEventListener('resize', () => document.querySelectorAll(TRACK).forEach((node) => smoothTo(node, index(node))), { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) if (node.nodeType === 1) init(node);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
