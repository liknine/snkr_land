;(() => {
  // v96: do not replace the stable v69/v87 gallery. Only protect product card edges
  // from Telegram vertical collapse and preload gallery images.
  const PRODUCT = '.product-detail-screen';
  const GALLERY = '.product-detail-gallery';
  const TRACK = '.product-gallery-track';
  const IMG = '.product-gallery-slide img, .product-detail-gallery img';

  let startX = 0;
  let startY = 0;
  let touching = false;
  let edgeMode = false;
  let currentY = 0;
  let targetY = 0;
  let raf = 0;

  function app() {
    return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  }

  function protectTelegram() {
    const tg = app();
    if (!tg) return;
    try { tg.ready && tg.ready(); } catch (_) {}
    try { tg.expand && tg.expand(); } catch (_) {}
    try { tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (_) {}
  }

  function product() {
    return document.querySelector(PRODUCT);
  }

  function point(event) {
    const touch = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
    return touch ? { x: touch.clientX, y: touch.clientY } : { x: 0, y: 0 };
  }

  function scrollY() {
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function maxScrollY() {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(0, Math.max(doc.scrollHeight, body ? body.scrollHeight : 0) - window.innerHeight);
  }

  function setProductState() {
    const on = !!product();
    document.body.classList.toggle('snkr-v96-product-active', on);
    if (on) protectTelegram();
    else resetEdge(true);
  }

  function easePull(delta) {
    const sign = Math.sign(delta);
    const abs = Math.abs(delta);
    // Very soft: big finger movement becomes a small, smooth visual buffer.
    const max = 20;
    const softened = max * (1 - Math.exp(-abs / 150));
    return sign * softened;
  }

  function applyY(value) {
    document.documentElement.style.setProperty('--snkr-v96-edge-y', `${value.toFixed(2)}px`);
    document.body.style.setProperty('--snkr-v96-edge-y', `${value.toFixed(2)}px`);
  }

  function tick() {
    raf = 0;
    const diff = targetY - currentY;
    const step = edgeMode ? 0.20 : 0.11;
    if (Math.abs(diff) < 0.08) {
      currentY = targetY;
    } else {
      currentY += diff * step;
    }
    applyY(currentY);
    if (edgeMode || Math.abs(currentY) > 0.1 || Math.abs(targetY) > 0.1) {
      raf = requestAnimationFrame(tick);
    } else {
      document.body.classList.remove('snkr-v96-edge-active');
      document.documentElement.style.removeProperty('--snkr-v96-edge-y');
      document.body.style.removeProperty('--snkr-v96-edge-y');
    }
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function startEdge(delta) {
    edgeMode = true;
    targetY = easePull(delta);
    document.body.classList.add('snkr-v96-edge-active');
    schedule();
  }

  function resetEdge(immediate = false) {
    edgeMode = false;
    targetY = 0;
    if (immediate) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      currentY = 0;
      targetY = 0;
      document.body.classList.remove('snkr-v96-edge-active');
      document.documentElement.style.removeProperty('--snkr-v96-edge-y');
      document.body.style.removeProperty('--snkr-v96-edge-y');
      return;
    }
    schedule();
  }

  function isHorizontalGallery(event, dx, dy) {
    if (!event.target?.closest?.(GALLERY)) return false;
    return Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.08;
  }

  function onStart(event) {
    protectTelegram();
    setProductState();
    if (!product()) return;
    const p = point(event);
    startX = p.x;
    startY = p.y;
    touching = true;
  }

  function onMove(event) {
    if (!touching || !product()) return;
    const p = point(event);
    const dx = p.x - startX;
    const dy = p.y - startY;
    if (isHorizontalGallery(event, dx, dy)) return;

    const absY = Math.abs(dy);
    const absX = Math.abs(dx);
    if (absY < 6 || absY < absX * 1.05) return;

    const y = scrollY();
    const max = maxScrollY();
    const pullingTop = y <= 0 && dy > 0;
    const pullingBottom = y >= max - 1 && dy < 0;
    if (!pullingTop && !pullingBottom) return;

    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    startEdge(dy);
  }

  function onEnd() {
    touching = false;
    resetEdge(false);
    protectTelegram();
  }

  function preload(root = document) {
    root.querySelectorAll?.(IMG).forEach((img) => {
      img.loading = 'eager';
      img.decoding = 'async';
      img.style.visibility = 'visible';
      img.style.opacity = '1';
      const src = img.currentSrc || img.src;
      if (src) {
        try { const warm = new Image(); warm.src = src; } catch (_) {}
      }
    });
  }

  function boot(root = document) {
    setProductState();
    preload(root);
  }

  window.addEventListener('touchstart', onStart, { capture: true, passive: true });
  window.addEventListener('touchmove', onMove, { capture: true, passive: false });
  window.addEventListener('touchend', onEnd, { capture: true, passive: true });
  window.addEventListener('touchcancel', onEnd, { capture: true, passive: true });
  window.addEventListener('resize', () => { protectTelegram(); resetEdge(true); }, { passive: true });
  document.addEventListener('visibilitychange', protectTelegram, { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot(), { once: true });
  else boot();

  new MutationObserver((mutations) => {
    setProductState();
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) preload(node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.setInterval(protectTelegram, 1500);
})();
