;(() => {
  // v92: clean filter modal behavior. Let React open/close, only lock background and keep it usable every time.
  const LAYER = '.filter-sheet-layer';
  const SHEET = '.filter-sheet';
  const TRIGGER = '.catalog-toolbar .filter-pill';
  const OPEN_CLASS = 'snkr-filters-open';
  const LOCK_CLASS = 'snkr-page-scroll-locked';
  let raf = 0;
  let locked = false;
  let scrollY = 0;
  let saved = null;

  function norm(text){ return String(text || '').toLowerCase().replace(/ё/g,'е').trim(); }
  function isFilterTrigger(el){
    const btn = el?.closest?.(TRIGGER);
    if (!btn) return null;
    const text = norm(btn.textContent);
    return text.includes('фильтр') ? btn : null;
  }
  function layer(){ return document.querySelector(LAYER); }
  function isOpen(l = layer()){
    return !!l && (l.classList.contains('is-open') || l.getAttribute('aria-hidden') === 'false') && !l.classList.contains('snkr-v92-closed');
  }
  function lock(){
    if (locked) return;
    locked = true;
    scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    saved = { htmlOverflow: document.documentElement.style.overflow, bodyOverflow: document.body.style.overflow, bodyTouch: document.body.style.touchAction };
    document.documentElement.classList.add(LOCK_CLASS);
    document.body.classList.add(OPEN_CLASS, LOCK_CLASS);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  function unlock(){
    if (!locked) {
      document.documentElement.classList.remove(LOCK_CLASS);
      document.body.classList.remove(OPEN_CLASS, LOCK_CLASS);
      return;
    }
    locked = false;
    document.documentElement.classList.remove(LOCK_CLASS);
    document.body.classList.remove(OPEN_CLASS, LOCK_CLASS);
    document.documentElement.style.overflow = saved?.htmlOverflow || '';
    document.body.style.overflow = saved?.bodyOverflow || '';
    document.body.style.touchAction = saved?.bodyTouch || '';
    window.scrollTo(0, scrollY);
  }
  function sync(){
    raf = 0;
    const l = layer();
    const open = isOpen(l);
    if (!l) { unlock(); return; }
    l.classList.toggle('snkr-v92-open', open);
    if (open) lock(); else unlock();
  }
  function schedule(){ if (!raf) raf = requestAnimationFrame(sync); }
  function forceOpen(){
    const l = layer();
    if (!l) return schedule();
    l.classList.remove('snkr-v92-closed','snkr-v83-force-closed','snkr-v84-force-closed');
    l.classList.add('is-open','snkr-v92-open');
    l.setAttribute('aria-hidden','false');
    schedule();
  }
  function forceClose(){
    const l = layer();
    if (!l) return schedule();
    l.classList.add('snkr-v92-closed');
    l.classList.remove('is-open','snkr-v92-open','snkr-v83-open','snkr-v84-open');
    l.setAttribute('aria-hidden','true');
    unlock();
    schedule();
  }
  function onClick(event){
    const trigger = isFilterTrigger(event.target);
    if (trigger) {
      // Wait for React click first, then make sure the sheet is really open, every time.
      window.setTimeout(forceOpen, 0);
      window.setTimeout(schedule, 80);
      return;
    }
    const close = event.target?.closest?.('.sheet-close,.filter-backdrop,.filter-apply');
    if (close && close.closest?.(LAYER)) {
      // Do not rely on stale React state from earlier patches.
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      forceClose();
    }
  }
  function onTouchMove(event){
    if (!isOpen()) return;
    const sheet = event.target?.closest?.(SHEET);
    if (!sheet) {
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
    }
  }
  function onKey(event){ if (event.key === 'Escape' && isOpen()) forceClose(); }

  document.addEventListener('click', onClick, true);
  document.addEventListener('touchmove', onTouchMove, { capture:true, passive:false });
  document.addEventListener('wheel', onTouchMove, { capture:true, passive:false });
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('resize', schedule, { passive:true });
  window.visualViewport?.addEventListener?.('resize', schedule, { passive:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once:true });
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{ childList:true, subtree:true, attributes:true, attributeFilter:['class','aria-hidden'] });
})();
