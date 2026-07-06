;(() => {
  // v91: do less, let the browser do the smooth work.
  // The main fix is blocking old custom touch handlers, while keeping native scroll-snap alive.
  const TRACK = '.product-gallery-track';
  const GALLERY = '.product-detail-gallery';
  const SLIDE = '.product-gallery-slide';
  const DOT = '.product-gallery-dot';
  const PREV = '.product-gallery-prev';
  const NEXT = '.product-gallery-next';
  const INTERACTIVE = '.product-gallery-dots,.product-gallery-prev,.product-gallery-next,button,a,input,textarea,select';

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const slides = (track) => Array.from(track?.querySelectorAll?.(SLIDE) || []);
  const maxIndex = (track) => Math.max(0, slides(track).length - 1);
  const widthOf = (track, gallery) => Math.max(1, track?.clientWidth || gallery?.clientWidth || 1);

  function safeTelegramSetup() {
    const tg = window.Telegram?.WebApp;
    try { tg?.ready?.(); } catch {}
    try { tg?.expand?.(); } catch {}
    // Prevent Telegram Mini App from being dragged down while the product page scrolls.
    try { tg?.disableVerticalSwipes?.(); } catch {}
  }

  function activeDotIndex(gallery) {
    const list = Array.from(gallery?.querySelectorAll?.(DOT) || []);
    const idx = list.findIndex((dot) => dot.classList.contains('active') || dot.classList.contains('is-active'));
    return idx >= 0 ? idx : 0;
  }

  function currentIndex(track, gallery) {
    const w = widthOf(track, gallery);
    const byScroll = Math.round((track?.scrollLeft || 0) / w);
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

  function normalizeTrack(track, gallery, keepPosition = true) {
    if (!track || !gallery) return;
    const w = widthOf(track, gallery);
    const idx = keepPosition ? currentIndex(track, gallery) : activeDotIndex(gallery);

    // Kill older transform-based patches/classes so they cannot visually fight native scroll.
    track.style.removeProperty('--snkr-carousel-x');
    track.style.removeProperty('transform');
    track.style.removeProperty('-webkit-transform');
    track.classList.remove('is-dragging', 'is-animating', 'snkr-v90-gallery-dragging', 'snkr-v90-gallery-animating');
    gallery.classList.remove('is-swiping', 'snkr-v90-gallery-active');

    const target = clamp(idx, 0, maxIndex(track));
    track.dataset.snkrV91Index = String(target);
    if (Math.abs((track.scrollLeft || 0) - target * w) > 2) {
      track.scrollLeft = target * w;
    }
    setDots(gallery, target);
  }

  function scrollToIndex(track, gallery, index, smooth = true) {
    if (!track || !gallery) return;
    const idx = clamp(index, 0, maxIndex(track));
    track.dataset.snkrV91Index = String(idx);
    setDots(gallery, idx);
    track.scrollTo({ left: idx * widthOf(track, gallery), behavior: smooth ? 'smooth' : 'auto' });
  }

  function guardGalleryTouch(event) {
    const track = event.target?.closest?.(TRACK);
    const gallery = track?.closest?.(GALLERY);
    if (!track || !gallery || slides(track).length <= 1) return;
    if (event.target?.closest?.(INTERACTIVE)) return;

    // Critical: stop old JS touch handlers. Do NOT preventDefault; native scroll remains buttery.
    event.stopImmediatePropagation?.();
    event.stopPropagation?.();
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

    normalizeTrack(track, gallery, true);
    if (dot) {
      const idx = Array.from(gallery.querySelectorAll(DOT)).indexOf(dot);
      if (idx >= 0) scrollToIndex(track, gallery, idx, true);
      return;
    }
    scrollToIndex(track, gallery, currentIndex(track, gallery) + (next ? 1 : -1), true);
  }

  const scrollRaf = new WeakMap();
  function onScroll(event) {
    const track = event.target?.closest?.(TRACK);
    if (!track || track !== event.target) return;
    const gallery = track.closest(GALLERY);
    if (!gallery) return;

    if (scrollRaf.get(track)) return;
    scrollRaf.set(track, requestAnimationFrame(() => {
      scrollRaf.set(track, 0);
      const idx = currentIndex(track, gallery);
      track.dataset.snkrV91Index = String(idx);
      setDots(gallery, idx);
    }));
  }

  function init(root = document) {
    root.querySelectorAll?.(TRACK).forEach((track) => {
      const gallery = track.closest(GALLERY);
      if (gallery) normalizeTrack(track, gallery, true);
    });
  }

  // Registered before the app bundle handlers, so old custom swipe code never sees gallery touches.
  document.addEventListener('touchstart', guardGalleryTouch, { capture: true, passive: true });
  document.addEventListener('touchmove', guardGalleryTouch, { capture: true, passive: true });
  document.addEventListener('touchend', guardGalleryTouch, { capture: true, passive: true });
  document.addEventListener('touchcancel', guardGalleryTouch, { capture: true, passive: true });
  document.addEventListener('click', onClick, true);
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  window.addEventListener('resize', () => init(), { passive: true });

  safeTelegramSetup();
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
