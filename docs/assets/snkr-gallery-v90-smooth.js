;(() => {
  // v90: GPU-transform gallery. One swipe = one photo, vertical page scroll stays native.
  const TRACK = '.product-gallery-track';
  const GALLERY = '.product-detail-gallery';
  const SLIDE = '.product-gallery-slide';
  const DOT = '.product-gallery-dot';
  const PREV = '.product-gallery-prev';
  const NEXT = '.product-gallery-next';
  const IGNORE = '.product-gallery-dots,button,a,input,textarea,select';
  const HORIZONTAL_CLASS = 'snkr-v90-gallery-horizontal';

  const state = {
    active: false,
    horizontal: false,
    track: null,
    gallery: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    index: 0,
    width: 1,
    raf: 0,
    anim: 0,
    targetX: 0,
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const slides = (track) => Array.from(track?.querySelectorAll?.(SLIDE) || []);
  const maxIndex = (track) => Math.max(0, slides(track).length - 1);
  const widthOf = (track, gallery) => Math.max(1, track?.clientWidth || gallery?.clientWidth || 1);
  const point = (event) => {
    const t = event.touches?.[0] || event.changedTouches?.[0];
    return t ? { x: t.clientX, y: t.clientY } : { x: event.clientX || 0, y: event.clientY || 0 };
  };

  function activeDotIndex(gallery) {
    const list = Array.from(gallery?.querySelectorAll?.(DOT) || []);
    const idx = list.findIndex((dot) => dot.classList.contains('active') || dot.classList.contains('is-active'));
    return idx >= 0 ? idx : 0;
  }

  function getIndex(track, gallery) {
    const saved = Number(track?.dataset?.snkrV90Index);
    if (Number.isFinite(saved)) return clamp(Math.round(saved), 0, maxIndex(track));
    const byDot = activeDotIndex(gallery);
    if (byDot) return clamp(byDot, 0, maxIndex(track));
    const byScroll = Math.round((track?.scrollLeft || 0) / widthOf(track, gallery));
    return clamp(byScroll, 0, maxIndex(track));
  }

  function setDots(gallery, index) {
    Array.from(gallery?.querySelectorAll?.(DOT) || []).forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle('active', active);
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function setX(track, x) {
    if (!track) return;
    track.style.setProperty('--snkr-carousel-x', `${x.toFixed(2)}px`);
  }

  function prepare(track, gallery) {
    if (!track || !gallery) return;
    const idx = getIndex(track, gallery);
    const w = widthOf(track, gallery);
    track.dataset.snkrV90Index = String(idx);
    track.scrollLeft = 0;
    setX(track, -idx * w);
    setDots(gallery, idx);
  }

  function stopAnim() {
    if (state.anim) cancelAnimationFrame(state.anim);
    if (state.raf) cancelAnimationFrame(state.raf);
    state.anim = 0;
    state.raf = 0;
  }

  function queueX(x) {
    state.targetX = x;
    if (state.raf) return;
    state.raf = requestAnimationFrame(() => {
      state.raf = 0;
      setX(state.track, state.targetX);
    });
  }

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3.35);
  }

  function finish() {
    const { track, gallery } = state;
    if (track) track.classList.remove('snkr-v90-gallery-dragging', 'snkr-v90-gallery-animating');
    if (gallery) gallery.classList.remove('snkr-v90-gallery-active');
    document.documentElement.classList.remove(HORIZONTAL_CLASS, 'snkr-gallery-swiping', 'snkr-gallery-native-touch', 'snkr-gallery-v69-horizontal');
    document.body.classList.remove(HORIZONTAL_CLASS, 'snkr-gallery-swiping', 'snkr-gallery-native-touch', 'snkr-gallery-v69-horizontal');
    state.active = false;
    state.horizontal = false;
  }

  function animateTo(nextIndex) {
    const { track, gallery } = state;
    if (!track || !gallery) return finish();
    stopAnim();
    const max = maxIndex(track);
    const idx = clamp(nextIndex, 0, max);
    const w = widthOf(track, gallery);
    const from = Number.parseFloat(getComputedStyle(track).getPropertyValue('--snkr-carousel-x')) || -state.index * w;
    const to = -idx * w;
    const distance = Math.abs(to - from);
    track.classList.add('snkr-v90-gallery-animating');

    if (distance < 0.5) {
      track.dataset.snkrV90Index = String(idx);
      state.index = idx;
      setX(track, to);
      setDots(gallery, idx);
      finish();
      return;
    }

    // Longer transform animation feels smoother on Telegram WebView than scrollLeft animation.
    const duration = Math.min(560, Math.max(420, 360 + distance * 0.16));
    const started = performance.now();
    const frame = (now) => {
      const p = clamp((now - started) / duration, 0, 1);
      const x = from + (to - from) * easeOut(p);
      setX(track, x);
      if (p < 1) {
        state.anim = requestAnimationFrame(frame);
      } else {
        state.anim = 0;
        state.index = idx;
        track.dataset.snkrV90Index = String(idx);
        track.scrollLeft = 0;
        setX(track, to);
        setDots(gallery, idx);
        finish();
      }
    };
    state.anim = requestAnimationFrame(frame);
  }

  function beginHorizontal() {
    if (state.horizontal) return;
    state.horizontal = true;
    stopAnim();
    state.track.classList.add('snkr-v90-gallery-dragging');
    state.gallery.classList.add('snkr-v90-gallery-active');
    document.documentElement.classList.add(HORIZONTAL_CLASS);
    document.body.classList.add(HORIZONTAL_CLASS);
  }

  function onStart(event) {
    const track = event.target?.closest?.(TRACK);
    const gallery = track?.closest?.(GALLERY);
    if (!track || !gallery || slides(track).length <= 1) return;
    if (event.target?.closest?.(IGNORE) && !event.target?.closest?.(DOT)) return;

    const p = point(event);
    stopAnim();
    prepare(track, gallery);
    state.active = true;
    state.horizontal = false;
    state.track = track;
    state.gallery = gallery;
    state.startX = state.lastX = p.x;
    state.startY = p.y;
    state.lastT = performance.now();
    state.velocity = 0;
    state.index = getIndex(track, gallery);
    state.width = widthOf(track, gallery);
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

    // Vertical gesture = normal page scroll. Do not lock the app.
    if (!state.horizontal && ay > 9 && ay > ax * 1.12) {
      state.active = false;
      return;
    }

    if (!state.horizontal) {
      if (ax < 8 || ax < ay * 1.08) return;
      beginHorizontal();
    }

    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    const max = maxIndex(state.track);
    const base = -state.index * state.width;
    let x = base + dx;
    if ((state.index <= 0 && dx > 0) || (state.index >= max && dx < 0)) {
      x = base + dx * 0.22;
    } else {
      // small friction makes the drag calmer and removes the feeling of low FPS/jumpiness
      x = base + dx * 0.98;
    }
    queueX(x);
  }

  function onEnd(event) {
    if (!state.active || !state.track || !state.gallery) return;
    const wasHorizontal = state.horizontal;
    const p = point(event);
    const dx = p.x - state.startX;

    if (!wasHorizontal) {
      finish();
      return;
    }

    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    const threshold = Math.max(42, state.width * 0.14);
    let target = state.index;
    if (dx <= -threshold || state.velocity < -0.48) target = state.index + 1;
    else if (dx >= threshold || state.velocity > 0.48) target = state.index - 1;
    animateTo(target);
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
    state.track = track;
    state.gallery = gallery;
    state.index = getIndex(track, gallery);
    state.width = widthOf(track, gallery);

    if (dot) {
      const idx = Array.from(gallery.querySelectorAll(DOT)).indexOf(dot);
      if (idx >= 0) animateTo(idx);
      return;
    }
    animateTo(state.index + (next ? 1 : -1));
  }

  function init(root = document) {
    root.querySelectorAll?.(TRACK).forEach((track) => {
      const gallery = track.closest(GALLERY);
      if (gallery) prepare(track, gallery);
    });
  }

  document.addEventListener('touchstart', onStart, { capture: true, passive: true });
  document.addEventListener('touchmove', onMove, { capture: true, passive: false });
  document.addEventListener('touchend', onEnd, { capture: true, passive: false });
  document.addEventListener('touchcancel', onEnd, { capture: true, passive: false });
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
})();
