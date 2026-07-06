;(() => {
  // v98: clean filter modal manager. It never forces React state closed/open,
  // so filters can be opened repeatedly and choices remain clickable.
  const LAYER = '.filter-sheet-layer';
  const SHEET = '.filter-sheet';
  const LOCK = 'snkr-v98-filter-lock';
  let locked = false;
  let saved = null;
  let raf = 0;

  function layer() { return document.querySelector(LAYER); }
  function isOpen(node = layer()) {
    return !!node && (node.classList.contains('is-open') || node.getAttribute('aria-hidden') === 'false');
  }
  function cleanupLegacy(node = layer()) {
    if (!node) return;
    node.classList.remove('snkr-v83-force-closed','snkr-v84-force-closed','snkr-v82-force-closed','snkr-v81-force-closed');
    node.classList.remove('snkr-v83-open','snkr-v84-open','snkr-v82-open','snkr-v81-open');
  }
  function lock() {
    if (locked) return;
    locked = true;
    saved = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyTouchAction: document.body.style.touchAction,
    };
    document.documentElement.classList.add(LOCK);
    document.body.classList.add(LOCK);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }
  function unlock() {
    if (!locked) {
      document.documentElement.classList.remove(LOCK);
      document.body.classList.remove(LOCK);
      return;
    }
    locked = false;
    document.documentElement.classList.remove(LOCK);
    document.body.classList.remove(LOCK);
    document.documentElement.style.overflow = saved?.htmlOverflow || '';
    document.body.style.overflow = saved?.bodyOverflow || '';
    document.body.style.touchAction = saved?.bodyTouchAction || '';
  }
  function sync() {
    raf = 0;
    const node = layer();
    if (!node) { unlock(); return; }
    cleanupLegacy(node);
    if (isOpen(node)) lock();
    else unlock();
  }
  function schedule() {
    if (!raf) raf = requestAnimationFrame(sync);
  }
  function preventBackgroundScroll(event) {
    if (!isOpen()) return;
    if (event.target?.closest?.(SHEET)) return;
    event.preventDefault();
    event.stopPropagation();
  }
  // If a legacy force class was left in session, clear it before the native React click runs.
  window.addEventListener('pointerdown', (event) => {
    if (event.target?.closest?.('.catalog-toolbar .filter-pill')) cleanupLegacy();
  }, { capture: true, passive: true });
  document.addEventListener('touchmove', preventBackgroundScroll, { capture: true, passive: false });
  document.addEventListener('wheel', preventBackgroundScroll, { capture: true, passive: false });
  window.addEventListener('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener?.('resize', schedule, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class','aria-hidden'] });
})();
