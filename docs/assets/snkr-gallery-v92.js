;(() => {
  // v92: clean high-FPS product gallery. No native slow scroll-snap, no rubber-scroll.
  // One horizontal gesture = one photo. Vertical gesture = normal page scroll.
  const TRACK = '.product-detail-gallery .product-gallery-track';
  const GALLERY = '.product-detail-gallery';
  const SLIDE = '.product-gallery-slide';
  const DOT = '.product-gallery-dot';
  const PREV = '.product-gallery-prev';
  const NEXT = '.product-gallery-next';
  const IGNORE = '.product-gallery-dots,.product-gallery-prev,.product-gallery-next,button,a,input,textarea,select,label';
  const HORIZONTAL = 'snkr-v92-gallery-horizontal';

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const slides = (track) => Array.from(track?.querySelectorAll?.(SLIDE) || []);
  const maxIndex = (track) => Math.max(0, slides(track).length - 1);
  const point = (event) => {
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : { x: event.clientX || 0, y: event.clientY || 0 };
  };
  const widthOf = (track, gallery) => Math.max(1, gallery?.clientWidth || track?.clientWidth || 1);

  const state = {
    active: false,
    horizontal: false,
    track: null,
    gallery: null,
    index: 0,
    width: 1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    raf: 0,
    x: 0,
  };

  function dotIndex(gallery) {
    const dots = Array.from(gallery?.querySelectorAll?.(DOT) || []);
    const idx = dots.findIndex((dot) => dot.classList.contains('active') || dot.classList.contains('is-active'));
    return idx >= 0 ? idx : 0;
  }
  function getIndex(track, gallery) {
    const saved = Number(track?.dataset?.snkrV92Index);
    if (Number.isFinite(saved)) return clamp(Math.round(saved), 0, maxIndex(track));
    const oldSaved = Number(track?.dataset?.snkrV90Index || track?.dataset?.snkrV91Index);
    if (Number.isFinite(oldSaved)) return clamp(Math.round(oldSaved), 0, maxIndex(track));
    return clamp(dotIndex(gallery), 0, maxIndex(track));
  }
  function setDots(gallery, index) {
    Array.from(gallery?.querySelectorAll?.(DOT) || []).forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle('active', active);
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }
  function setX(track, x, animated = false) {
    if (!track) return;
    track.classList.toggle('snkr-v92-animating', animated);
    track.style.setProperty('--snkr-gallery-x', `${x.toFixed(2)}px`);
  }
  function prepare(track, gallery) {
    if (!track || !gallery) return;
    const idx = getIndex(track, gallery);
    const width = widthOf(track, gallery);
    track.dataset.snkrV92Index = String(idx);
    track.dataset.snkrGalleryPrepared = 'v92';
    // neutralize older native/transform patches if cached CSS/JS is still present
    track.scrollLeft = 0;
    track.style.removeProperty('--snkr-carousel-x');
    track.classList.remove('is-dragging','is-animating','snkr-v90-gallery-dragging','snkr-v90-gallery-animating','snkr-v83-gallery-dragging','snkr-v83-gallery-animating');
    setX(track, -idx * width, false);
    setDots(gallery, idx);
  }
  function cancelRaf() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }
  function queueX(x) {
    state.x = x;
    if (state.raf) return;
    state.raf = requestAnimationFrame(() => {
      state.raf = 0;
      setX(state.track, state.x, false);
    });
  }
  function finish() {
    const { track, gallery } = state;
    cancelRaf();
    if (track) track.classList.remove('snkr-v92-dragging');
    if (gallery) gallery.classList.remove('snkr-v92-active');
    document.documentElement.classList.remove(HORIZONTAL);
    document.body.classList.remove(HORIZONTAL);
    state.active = false;
    state.horizontal = false;
    state.track = null;
    state.gallery = null;
  }
  function animateTo(track, gallery, index) {
    if (!track || !gallery) return;
    const idx = clamp(index, 0, maxIndex(track));
    const width = widthOf(track, gallery);
    track.dataset.snkrV92Index = String(idx);
    setDots(gallery, idx);
    // CSS transition on transform is smoother in Telegram WebView than JS RAF animation.
    setX(track, -idx * width, true);
    window.setTimeout(() => {
      track.classList.remove('snkr-v92-animating');
      track.scrollLeft = 0;
      setX(track, -idx * width, false);
      if (state.track === track) finish();
    }, 330);
  }
  function beginHorizontal(event) {
    if (state.horizontal) return;
    state.horizontal = true;
    state.track.classList.add('snkr-v92-dragging');
    state.gallery.classList.add('snkr-v92-active');
    document.documentElement.classList.add(HORIZONTAL);
    document.body.classList.add(HORIZONTAL);
    if (event?.cancelable) event.preventDefault();
  }

  function onStart(event) {
    const track = event.target?.closest?.(TRACK);
    const gallery = track?.closest?.(GALLERY);
    if (!track || !gallery || slides(track).length <= 1) return;
    if (event.target?.closest?.(IGNORE)) return;

    const p = point(event);
    prepare(track, gallery);
    state.active = true;
    state.horizontal = false;
    state.track = track;
    state.gallery = gallery;
    state.index = getIndex(track, gallery);
    state.width = widthOf(track, gallery);
    state.startX = state.lastX = p.x;
    state.startY = p.y;
    state.lastT = performance.now();
    state.velocity = 0;
    state.x = -state.index * state.width;

    // Do not preventDefault here, so a vertical gesture still scrolls like a normal page.
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  }
  function onMove(event) {
    if (!state.active || !state.track || !state.gallery) return;
    const p = point(event);
    const dx = p.x - state.startX;
    const dy = p.y - state.startY;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    const now = performance.now();
    const dt = Math.max(1, now - state.lastT);
    state.velocity = (p.x - state.lastX) / dt;
    state.lastX = p.x;
    state.lastT = now;

    if (!state.horizontal) {
      // Vertical swipe: stop our tracking and let the page scroll normally.
      if (ay > 8 && ay > ax * 1.08) {
        state.active = false;
        return;
      }
      if (ax < 7 || ax < ay * 1.04) return;
      beginHorizontal(event);
    }

    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    const max = maxIndex(state.track);
    const base = -state.index * state.width;
    const edge = (state.index <= 0 && dx > 0) || (state.index >= max && dx < 0);
    const nextX = base + dx * (edge ? 0.18 : 1);
    queueX(nextX);
  }
  function onEnd(event) {
    if (!state.active || !state.track || !state.gallery) return;
    const horizontal = state.horizontal;
    const p = point(event);
    const dx = p.x - state.startX;
    const track = state.track;
    const gallery = state.gallery;
    const index = state.index;

    if (!horizontal) {
      finish();
      return;
    }
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    const threshold = Math.max(46, state.width * 0.16);
    let target = index;
    if (dx <= -threshold || state.velocity < -0.62) target = index + 1;
    else if (dx >= threshold || state.velocity > 0.62) target = index - 1;
    animateTo(track, gallery, target);
  }
  function onClick(event) {
    const gallery = event.target?.closest?.(GALLERY);
    if (!gallery) return;
    const track = gallery.querySelector(TRACK);
    if (!track) return;
    const dot = event.target?.closest?.(DOT);
    const prev = event.target?.closest?.(PREV);
    const next = event.target?.closest?.(NEXT);
    if (!dot && !prev && !next) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    prepare(track, gallery);
    const cur = getIndex(track, gallery);
    if (dot) {
      const idx = Array.from(gallery.querySelectorAll(DOT)).indexOf(dot);
      if (idx >= 0) animateTo(track, gallery, idx);
      return;
    }
    animateTo(track, gallery, cur + (next ? 1 : -1));
  }
  function init(root = document) {
    root.querySelectorAll?.(TRACK).forEach((track) => {
      const gallery = track.closest(GALLERY);
      if (gallery) prepare(track, gallery);
    });
  }

  // Capture listeners are registered before the React bundle, so the app itself does not jerk during photo swipes.
  document.addEventListener('touchstart', onStart, { capture: true, passive: true });
  document.addEventListener('touchmove', onMove, { capture: true, passive: false });
  document.addEventListener('touchend', onEnd, { capture: true, passive: false });
  document.addEventListener('touchcancel', onEnd, { capture: true, passive: false });
  document.addEventListener('mousedown', onStart, true);
  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('mouseup', onEnd, true);
  document.addEventListener('click', onClick, true);
  window.addEventListener('resize', () => init(), { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) init(node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.SNKR_GALLERY_V92 = { version: 'v92', init };
})();
