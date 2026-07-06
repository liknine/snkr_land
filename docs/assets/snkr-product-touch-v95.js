;(() => {
  // v95: one clean touch layer. Blocks old gallery handlers at window-capture level,
  // keeps vertical page scroll native, adds a soft edge buffer so Telegram does not collapse.
  const PRODUCT = '.product-detail-screen';
  const GALLERY = '.product-detail-gallery';
  const TRACK = '.product-gallery-track';
  const SLIDE = '.product-gallery-slide';
  const DOT = '.product-gallery-dot';
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const isTouchEvent = (e) => e && (e.touches || e.changedTouches);

  let active = null;
  let edge = null;
  let raf = 0;
  let queuedX = null;
  let productVisible = false;

  function tg() {
    return window.Telegram && window.Telegram.WebApp;
  }

  function protectTelegram() {
    const app = tg();
    if (!app) return;
    try { app.ready && app.ready(); } catch (_) {}
    try { app.expand && app.expand(); } catch (_) {}
    try { app.disableVerticalSwipes && app.disableVerticalSwipes(); } catch (_) {}
  }

  function point(e) {
    const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    return t ? { x: t.clientX, y: t.clientY } : { x: e.clientX || 0, y: e.clientY || 0 };
  }

  function product() {
    return document.querySelector(PRODUCT);
  }

  function scrollY() {
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function maxScrollY() {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(0, Math.max(doc.scrollHeight, body ? body.scrollHeight : 0) - window.innerHeight);
  }

  function updateProductState() {
    const yes = !!product();
    if (yes !== productVisible) {
      productVisible = yes;
      document.body.classList.toggle('snkr-v95-product-active', yes);
    } else if (yes) {
      document.body.classList.add('snkr-v95-product-active');
    } else {
      document.body.classList.remove('snkr-v95-product-active', 'snkr-v95-edge-pull');
      document.documentElement.style.removeProperty('--snkr-v95-overscroll-y');
      document.body.style.removeProperty('--snkr-v95-overscroll-y');
    }
    if (yes) protectTelegram();
  }

  function slides(track) {
    return Array.from(track?.querySelectorAll?.(SLIDE) || []);
  }

  function galleryOf(track) {
    return track?.closest?.(GALLERY) || null;
  }

  function dots(gallery) {
    return Array.from(gallery?.querySelectorAll?.(DOT) || []);
  }

  function width(track) {
    const gallery = galleryOf(track);
    return Math.max(1, track?.clientWidth || gallery?.clientWidth || 1);
  }

  function maxIndex(track) {
    return Math.max(0, slides(track).length - 1);
  }

  function readIndex(track) {
    const saved = Number(track?.dataset?.snkrV95Index || 0);
    if (Number.isFinite(saved)) return clamp(Math.round(saved), 0, maxIndex(track));
    return 0;
  }

  function writeIndex(track, index) {
    if (!track) return;
    track.dataset.snkrV95Index = String(clamp(index, 0, maxIndex(track)));
  }

  function xFor(track, index) {
    return -clamp(index, 0, maxIndex(track)) * width(track);
  }

  function setX(track, x) {
    if (!track) return;
    track.style.setProperty('--snkr-v95-gallery-x', `${x}px`);
  }

  function setXFrame(track, x) {
    queuedX = x;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!track || queuedX == null) return;
      setX(track, queuedX);
      queuedX = null;
    });
  }

  function syncDots(track, index = readIndex(track)) {
    const gallery = galleryOf(track);
    dots(gallery).forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.classList.toggle('active', i === index);
    });
  }

  function preload(track) {
    slides(track).forEach((slide) => {
      slide.style.visibility = 'visible';
      const img = slide.querySelector('img');
      if (!img || !img.src) return;
      img.loading = 'eager';
      img.decoding = 'async';
      try { const pre = new Image(); pre.src = img.currentSrc || img.src; } catch (_) {}
    });
  }

  function initTrack(track) {
    if (!track || track.__snkrV95Ready) return;
    track.__snkrV95Ready = true;
    preload(track);
    let initial = 0;
    if (track.scrollLeft) initial = clamp(Math.round(track.scrollLeft / width(track)), 0, maxIndex(track));
    writeIndex(track, initial);
    track.scrollLeft = 0;
    setX(track, xFor(track, initial));
    syncDots(track, initial);
  }

  function init(root = document) {
    updateProductState();
    root.querySelectorAll?.(TRACK).forEach(initTrack);
  }

  function lockOldHandlers(e) {
    // Stop the old document-level gallery patches from fighting this clean layer.
    e.stopPropagation();
    e.stopImmediatePropagation?.();
  }

  function beginEdge(e, startY) {
    edge = { startY, value: 0, raf: 0 };
    document.body.classList.add('snkr-v95-edge-pull');
    setEdge(0);
  }

  function setEdge(value) {
    const softened = Math.sign(value) * Math.min(34, Math.pow(Math.abs(value), 0.82) * 0.72);
    if (!edge) return;
    edge.value = softened;
    if (edge.raf) return;
    edge.raf = requestAnimationFrame(() => {
      if (!edge) return;
      edge.raf = 0;
      document.documentElement.style.setProperty('--snkr-v95-overscroll-y', `${edge.value}px`);
      document.body.style.setProperty('--snkr-v95-overscroll-y', `${edge.value}px`);
    });
  }

  function endEdge() {
    if (!edge) return;
    if (edge.raf) cancelAnimationFrame(edge.raf);
    edge = null;
    document.body.classList.remove('snkr-v95-edge-pull');
    document.documentElement.style.setProperty('--snkr-v95-overscroll-y', '0px');
    document.body.style.setProperty('--snkr-v95-overscroll-y', '0px');
    window.setTimeout(() => {
      if (!edge) {
        document.documentElement.style.removeProperty('--snkr-v95-overscroll-y');
        document.body.style.removeProperty('--snkr-v95-overscroll-y');
      }
    }, 390);
  }

  function maybeEdgeGuard(e, startY, currentY, dx) {
    if (!product()) return false;
    const dy = currentY - startY;
    const absY = Math.abs(dy);
    if (absY < 5 || absY < Math.abs(dx) * 1.08) return false;
    const y = scrollY();
    const max = maxScrollY();
    const atTop = y <= 0 && dy > 0;
    const atBottom = y >= max - 1 && dy < 0;
    if (!atTop && !atBottom) return false;

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    if (!edge) beginEdge(e, startY);
    setEdge(dy);
    return true;
  }

  function endGallery() {
    if (!active) return;
    active.track?.classList.remove('snkr-v95-dragging', 'snkr-v95-animating');
    document.documentElement.classList.remove('snkr-v95-gallery-lock');
    document.body.classList.remove('snkr-v95-gallery-lock', 'snkr-gallery-swiping', 'snkr-gallery-native-touch');
    document.querySelectorAll('.product-gallery-track.is-dragging,.product-detail-gallery.is-swiping').forEach((node) => node.classList.remove('is-dragging', 'is-swiping'));
    active = null;
  }

  function animateTo(track, targetIndex) {
    if (!track) return endGallery();
    const index = clamp(targetIndex, 0, maxIndex(track));
    writeIndex(track, index);
    track.classList.add('snkr-v95-animating');
    track.classList.remove('snkr-v95-dragging');
    setX(track, xFor(track, index));
    syncDots(track, index);
    const done = () => {
      track.classList.remove('snkr-v95-animating');
      track.removeEventListener('transitionend', done);
      setX(track, xFor(track, index));
      syncDots(track, index);
      endGallery();
    };
    track.addEventListener('transitionend', done, { once: true });
    window.setTimeout(done, 260);
  }

  function onTouchStart(e) {
    protectTelegram();
    updateProductState();
    if (!isTouchEvent(e)) return;
    const p = point(e);
    const track = e.target?.closest?.(TRACK);
    if (track && galleryOf(track) && slides(track).length > 1) {
      initTrack(track);
      lockOldHandlers(e);
      active = {
        track,
        startX: p.x,
        startY: p.y,
        lastX: p.x,
        lastT: performance.now(),
        velocity: 0,
        index: readIndex(track),
        mode: 'pending'
      };
      preload(track);
      return;
    }
    if (product()) {
      active = { track: null, startX: p.x, startY: p.y, mode: 'page' };
    }
  }

  function onTouchMove(e) {
    if (!active || !isTouchEvent(e)) return;
    const p = point(e);
    const dx = p.x - active.startX;
    const dy = p.y - active.startY;

    if (active.track) {
      lockOldHandlers(e);
      if (active.mode === 'pending') {
        const ax = Math.abs(dx), ay = Math.abs(dy);
        if (ax < 5 && ay < 5) return;
        if (ay > ax * 1.08) {
          active.mode = 'vertical';
        } else if (ax > 7 && ax > ay * 1.05) {
          active.mode = 'horizontal';
          active.track.classList.add('snkr-v95-dragging');
          document.documentElement.classList.add('snkr-v95-gallery-lock');
          document.body.classList.add('snkr-v95-gallery-lock');
        }
      }

      if (active.mode === 'vertical') {
        maybeEdgeGuard(e, active.startY, p.y, dx);
        return;
      }

      if (active.mode === 'horizontal') {
        if (e.cancelable) e.preventDefault();
        const now = performance.now();
        const dt = Math.max(1, now - active.lastT);
        active.velocity = (p.x - active.lastX) / dt;
        active.lastX = p.x;
        active.lastT = now;
        const w = width(active.track);
        const max = maxIndex(active.track);
        let limitedDx = clamp(dx, -w * 0.72, w * 0.72);
        if ((active.index <= 0 && limitedDx > 0) || (active.index >= max && limitedDx < 0)) limitedDx *= 0.26;
        setXFrame(active.track, -active.index * w + limitedDx);
      }
      return;
    }

    maybeEdgeGuard(e, active.startY, p.y, dx);
  }

  function onTouchEnd(e) {
    endEdge();
    if (!active) return;
    if (active.track) {
      lockOldHandlers(e);
      const p = point(e);
      const dx = p.x - active.startX;
      if (active.mode !== 'horizontal') return endGallery();
      if (e.cancelable) e.preventDefault();
      const w = width(active.track);
      const threshold = Math.max(36, w * 0.12);
      let target = active.index;
      if (dx <= -threshold || active.velocity < -0.32) target += 1;
      else if (dx >= threshold || active.velocity > 0.32) target -= 1;
      animateTo(active.track, target);
      return;
    }
    active = null;
  }

  function onClick(e) {
    const dot = e.target?.closest?.(DOT);
    if (!dot) return;
    const gallery = dot.closest(GALLERY);
    const track = gallery?.querySelector?.(TRACK);
    if (!track) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    initTrack(track);
    const index = dots(gallery).indexOf(dot);
    if (index >= 0) {
      active = { track, index: readIndex(track), mode: 'horizontal', startX: 0, startY: 0, lastX: 0, lastT: performance.now(), velocity: 0 };
      animateTo(track, index);
    }
  }

  function onResize() {
    document.querySelectorAll(TRACK).forEach((track) => {
      const idx = readIndex(track);
      setX(track, xFor(track, idx));
      syncDots(track, idx);
    });
    protectTelegram();
  }

  window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
  window.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
  window.addEventListener('touchend', onTouchEnd, { capture: true, passive: false });
  window.addEventListener('touchcancel', onTouchEnd, { capture: true, passive: false });
  window.addEventListener('click', onClick, true);
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', protectTelegram, { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();
  new MutationObserver((mutations) => {
    updateProductState();
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) if (node.nodeType === 1) init(node);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.setInterval(protectTelegram, 1800);
})();
