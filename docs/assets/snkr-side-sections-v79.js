(() => {
  const VERSION = "v79";
  const SECTIONS = [
    { id: "men", label: "Мужская обувь" },
    { id: "women", label: "Женская обувь" },
    { id: "clothes", label: "Одежда" },
    { id: "sale", label: "Скидки" },
  ];
  const ALL_SECTION = "all";
  const DEFAULT_PRODUCT_SECTION = "men";
  const STORAGE_KEY = "snkr_catalog_section_v79";
  const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((item) => [item.id, item]));
  const LABEL_BY_ID = { all: "Все товары", ...Object.fromEntries(SECTIONS.map((item) => [item.id, item.label])) };
  const textToSection = new Map([
    ["мужская обувь", "men"], ["мужская", "men"], ["мужские", "men"], ["мужское", "men"], ["мужской", "men"], ["men", "men"], ["male", "men"],
    ["женская обувь", "women"], ["женская", "women"], ["женские", "women"], ["женское", "women"], ["женский", "women"], ["women", "women"], ["female", "women"],
    ["одежда", "clothes"], ["вещи", "clothes"], ["clothes", "clothes"], ["clothing", "clothes"],
    ["скидки", "sale"], ["скидка", "sale"], ["sale", "sale"], ["discount", "sale"], ["sales", "sale"],
  ]);
  const state = {
    products: [],
    observer: null,
    scheduled: false,
    applying: false,
    programmaticCatalogClick: false,
  };

  function normalizeText(value) {
    return String(value || "").toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
  }

  function normalizeSection(value) {
    const raw = normalizeText(value);
    if (!raw) return DEFAULT_PRODUCT_SECTION;
    return textToSection.get(raw) || (SECTION_BY_ID[raw] ? raw : DEFAULT_PRODUCT_SECTION);
  }

  function sectionLabel(sectionId) {
    return LABEL_BY_ID[sectionId] || LABEL_BY_ID[DEFAULT_PRODUCT_SECTION];
  }

  function withProductSection(product) {
    const section = normalizeSection(product?.section || product?.category || product?.catalogSection || product?.gender || product?.group);
    return { ...product, section, category: product?.category || sectionLabel(section) };
  }

  function normalizeProductsPayload(payload) {
    if (Array.isArray(payload)) {
      const products = payload.map(withProductSection);
      state.products = products;
      return products;
    }
    if (payload && Array.isArray(payload.products)) {
      const products = payload.products.map(withProductSection);
      state.products = products;
      return { ...payload, products };
    }
    return payload;
  }

  function shouldPatchProductsResponse(input) {
    const url = typeof input === "string" ? input : input?.url || "";
    return /\/api\/products(?:\?|$)/.test(url) || /\/data\/products\.json(?:\?|$)/.test(url);
  }

  if (typeof window.fetch === "function" && !window.__snkrSideSectionsFetchPatchedV79) {
    window.__snkrSideSectionsFetchPatchedV79 = true;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await nativeFetch(...args);
      if (!shouldPatchProductsResponse(args[0])) return response;
      try {
        const payload = await response.clone().json();
        const patched = normalizeProductsPayload(payload);
        const headers = new Headers(response.headers);
        headers.set("Content-Type", "application/json; charset=utf-8");
        queueDomPatch(true);
        return new Response(JSON.stringify(patched), {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch {
        return response;
      }
    };
  }

  function getActiveSection() {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY) || ALL_SECTION;
      return saved === ALL_SECTION || SECTION_BY_ID[saved] ? saved : ALL_SECTION;
    } catch {
      return ALL_SECTION;
    }
  }

  function setActiveSection(sectionId, options = {}) {
    const next = sectionId === ALL_SECTION || SECTION_BY_ID[sectionId] ? sectionId : ALL_SECTION;
    try { window.sessionStorage.setItem(STORAGE_KEY, next); } catch {}
    document.documentElement.dataset.snkrCatalogSection = next;
    patchSideMenuRows();
    applySectionFilter(true);
    if (!options.silent) {
      window.dispatchEvent(new CustomEvent("snkr:catalog-section-change", { detail: { section: next, label: sectionLabel(next) } }));
    }
  }

  function normalizePath(value) {
    return String(value || "")
      .split("?")[0]
      .replace(/^https?:\/\/[^/]+/i, "")
      .replace(/^\/snkr_land\//, "")
      .replace(/^\/+/, "");
  }

  function productImages(product) {
    const images = Array.isArray(product?.images) ? product.images : [];
    return images.map(normalizePath).filter(Boolean);
  }

  function cardImagePaths(card) {
    return Array.from(card.querySelectorAll("img"))
      .map((img) => normalizePath(img.getAttribute("src") || img.currentSrc || ""))
      .filter(Boolean);
  }

  function findProductForCard(card, index) {
    const savedSection = card.getAttribute("data-snkr-section");
    if (savedSection && SECTION_BY_ID[savedSection]) return { section: savedSection };

    const text = normalizeText(card.textContent);
    const cardImages = cardImagePaths(card);
    let best = null;
    let bestScore = -1;

    for (const product of state.products) {
      let score = 0;
      const pImages = productImages(product);
      const pImageNames = pImages.map((item) => item.split("/").pop()).filter(Boolean);
      const hasImageMatch = cardImages.some((src) => pImages.includes(src) || pImageNames.includes(src.split("/").pop()));
      if (hasImageMatch) score += 100;

      const name = normalizeText(product?.name);
      const brand = normalizeText(product?.brand);
      const color = normalizeText(product?.color);
      if (name && text.includes(name)) score += 24;
      if (brand && text.includes(brand)) score += 12;
      if (color && text.includes(color)) score += 4;

      if (score > bestScore) {
        best = product;
        bestScore = score;
      }
    }

    if (best && bestScore > 0) return best;
    return state.products[index] || null;
  }

  function getCards() {
    return Array.from(document.querySelectorAll(".catalog-screen .product-card"));
  }

  function ensureEmptyState(grid, visibleCount, activeSection) {
    if (!grid) return;
    let empty = grid.parentElement?.querySelector(".snkr-section-empty");
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "snkr-section-empty";
      empty.innerHTML = "<h2>В этом разделе пока нет товаров</h2><p>Когда админ добавит товар в этот раздел, он появится здесь.</p>";
      grid.insertAdjacentElement("afterend", empty);
    }
    empty.hidden = visibleCount !== 0 || activeSection === ALL_SECTION;
  }

  function applySectionFilter(force = false) {
    if (state.applying) return;
    state.applying = true;
    window.requestAnimationFrame(() => {
      const active = getActiveSection();
      document.documentElement.dataset.snkrCatalogSection = active;
      const cards = getCards();
      let visibleCount = 0;
      cards.forEach((card, index) => {
        const product = findProductForCard(card, index);
        const section = normalizeSection(product?.section || product?.category);
        card.setAttribute("data-snkr-section", section);
        const show = active === ALL_SECTION || section === active;
        card.classList.toggle("snkr-hidden-by-section", !show);
        card.setAttribute("aria-hidden", show ? "false" : "true");
        if (show) visibleCount += 1;
      });
      ensureEmptyState(document.querySelector(".catalog-screen .products-grid"), visibleCount, active);
      patchSideMenuRows();
      state.applying = false;
      if (force) window.dispatchEvent(new CustomEvent("snkr:section-filter-applied", { detail: { active, visibleCount } }));
    });
  }

  function closeSideMenu() {
    const closeButton = document.querySelector(".side-menu-close");
    if (closeButton) {
      closeButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      return;
    }
    const backdrop = document.querySelector(".side-menu-backdrop");
    if (backdrop) backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }

  function findBottomCatalogButton() {
    return Array.from(document.querySelectorAll(".bottom-nav-item"))
      .find((button) => normalizeText(button.textContent).includes("каталог"));
  }

  function goCatalogAfterSectionPick() {
    const button = findBottomCatalogButton();
    if (!button) return;
    state.programmaticCatalogClick = true;
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    window.setTimeout(() => { state.programmaticCatalogClick = false; }, 0);
    window.setTimeout(() => applySectionFilter(true), 60);
    window.setTimeout(() => applySectionFilter(true), 220);
  }

  function patchSideMenuRows() {
    const list = document.querySelector(".side-menu-list");
    if (!list) return;
    const active = getActiveSection();
    const kicker = document.querySelector(".side-menu-kicker");
    if (kicker) kicker.textContent = "FILTERS";

    const rows = Array.from(list.querySelectorAll(".side-menu-row"));
    rows.forEach((row, index) => {
      const section = SECTIONS[index];
      if (!section) {
        row.style.display = "none";
        return;
      }
      row.style.display = "";
      row.dataset.snkrMenuSection = section.id;
      row.setAttribute("aria-pressed", active === section.id ? "true" : "false");
      row.setAttribute("aria-label", section.label);
      row.classList.toggle("is-active", active === section.id);
      const label = row.querySelector("span");
      if (label && label.textContent !== section.label) label.textContent = section.label;
    });
  }

  function interceptSideMenuFilterClicks() {
    if (document.__snkrSideMenuFilterClicksV79) return;
    document.__snkrSideMenuFilterClicksV79 = true;
    document.addEventListener("click", (event) => {
      const row = event.target.closest(".side-menu-list .side-menu-row");
      if (!row) return;
      const section = row.dataset.snkrMenuSection;
      if (!section || !SECTION_BY_ID[section]) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      setActiveSection(section);
      closeSideMenu();
      goCatalogAfterSectionPick();
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, true);
  }

  function interceptBottomCatalogReset() {
    if (document.__snkrBottomCatalogResetV79) return;
    document.__snkrBottomCatalogResetV79 = true;
    document.addEventListener("click", (event) => {
      const button = event.target.closest(".bottom-nav-item");
      if (!button || !normalizeText(button.textContent).includes("каталог")) return;
      if (state.programmaticCatalogClick) return;
      setActiveSection(ALL_SECTION, { silent: true });
      window.setTimeout(() => applySectionFilter(true), 80);
    }, true);
  }

  function initDomPatch(force = false) {
    patchSideMenuRows();
    applySectionFilter(force);
    interceptSideMenuFilterClicks();
    interceptBottomCatalogReset();
  }

  function queueDomPatch(force = false) {
    if (state.scheduled) return;
    state.scheduled = true;
    window.requestAnimationFrame(() => {
      state.scheduled = false;
      initDomPatch(force);
    });
  }

  function startObserver() {
    if (state.observer) return;
    state.observer = new MutationObserver(() => queueDomPatch(false));
    state.observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.dataset.snkrCatalogSection = getActiveSection();
    initDomPatch();
    startObserver();
  });

  window.addEventListener("snkr:products-updated", () => applySectionFilter(true));

  window.SNKR_SIDE_SECTIONS = {
    version: VERSION,
    sections: SECTIONS,
    setActiveSection,
    getActiveSection,
    normalizeProductsPayload,
    applySectionFilter,
  };
})();




;(() => {
  // v79: very smooth product gallery. One gesture = one photo. Vertical gesture = normal page scroll.
  const TRACK = '.product-detail-gallery .product-gallery-track';
  const SLIDE = '.product-gallery-slide';
  const DOT = '.product-gallery-dot';
  const DRAG = 'snkr-v79-gallery-dragging';
  const ANIM = 'snkr-v79-gallery-animating';
  const MOVED = 'snkr-v79-gallery-moved';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const state = {
    active: false,
    mode: 'idle',
    track: null,
    host: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    startScroll: 0,
    startIndex: 0,
    raf: 0,
    movedUntil: 0,
  };

  function point(event) {
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : { x: event.clientX || 0, y: event.clientY || 0 };
  }
  function slides(track = state.track) { return Array.from(track?.querySelectorAll?.(SLIDE) || []); }
  function galleryWidth(track = state.track) {
    if (!track) return 1;
    const slide = track.querySelector(SLIDE);
    const rect = slide?.getBoundingClientRect?.();
    return Math.max(1, Math.round(rect?.width || track.clientWidth || track.closest?.('.product-detail-gallery')?.clientWidth || 1));
  }
  function maxIndex(track = state.track) { return Math.max(0, slides(track).length - 1); }
  function indexOf(track = state.track) { return clamp(Math.round((track?.scrollLeft || 0) / galleryWidth(track)), 0, maxIndex(track)); }
  function dots(host = state.host) { return Array.from(host?.querySelectorAll?.(DOT) || []); }
  function syncDots(host = state.host, index = indexOf(host?.querySelector?.('.product-gallery-track') || state.track)) {
    dots(host).forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
  }
  function cancelAnim(track = state.track) {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    track?.classList.remove(ANIM);
  }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function animateTo(track, targetIndex, duration = 590) {
    if (!track) return;
    cancelAnim(track);
    const host = track.closest('.product-detail-gallery');
    const w = galleryWidth(track);
    const max = maxIndex(track);
    const target = clamp(targetIndex, 0, max);
    const from = track.scrollLeft;
    const to = target * w;
    if (Math.abs(to - from) < 0.75) {
      track.scrollLeft = to;
      syncDots(host, target);
      track.classList.remove(DRAG, ANIM, MOVED);
      return;
    }
    track.classList.add(ANIM);
    const start = performance.now();
    const ms = clamp(duration, 480, 720);
    const frame = (now) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = easeOutCubic(p);
      track.scrollLeft = from + (to - from) * eased;
      syncDots(host, clamp(Math.round(track.scrollLeft / w), 0, max));
      if (p < 1) {
        state.raf = requestAnimationFrame(frame);
      } else {
        state.raf = 0;
        track.scrollLeft = to;
        track.classList.remove(DRAG, ANIM, MOVED);
        syncDots(host, target);
      }
    };
    state.raf = requestAnimationFrame(frame);
  }
  window.__snkrSmoothGallerySnap = (track, targetIndex) => animateTo(track, targetIndex, 590);

  function cleanup() {
    state.track?.classList.remove(DRAG);
    state.active = false;
    state.mode = 'idle';
    state.track = null;
    state.host = null;
  }
  function clearLegacyLocks() {
    const classes = [
      'snkr-gallery-native-touch','snkr-gallery-swiping','snkr-gallery-v69-horizontal','snkr-gallery-v75-horizontal','snkr-gallery-v76-horizontal','snkr-gallery-v77-horizontal','snkr-gallery-v78-horizontal'
    ];
    document.documentElement.classList.remove(...classes);
    document.body.classList.remove(...classes);
    document.querySelectorAll('.product-gallery-track.is-dragging,.product-gallery-track.snkr-v69-dragging,.product-gallery-track.snkr-v75-dragging,.product-gallery-track.snkr-v76-dragging,.product-gallery-track.snkr-v77-gallery-dragging,.product-gallery-track.snkr-v78-gallery-dragging,.product-detail-gallery.is-swiping,.product-detail-gallery.snkr-v69-swiping')
      .forEach((node) => node.classList.remove('is-dragging','snkr-v69-dragging','snkr-v75-dragging','snkr-v76-dragging','snkr-v77-gallery-dragging','snkr-v78-gallery-dragging','is-swiping','snkr-v69-swiping'));
  }

  function start(event) {
    const track = event.target?.closest?.(TRACK);
    const host = track?.closest?.('.product-detail-gallery');
    if (!track || !host || slides(track).length <= 1) return;
    if (event.target?.closest?.('.product-gallery-dots,button,a')) return;

    clearLegacyLocks();
    cancelAnim(track);
    const p = point(event);
    state.active = true;
    state.mode = 'pending';
    state.track = track;
    state.host = host;
    state.startX = state.lastX = p.x;
    state.startY = p.y;
    state.lastT = performance.now();
    state.velocity = 0;
    state.startIndex = indexOf(track);
    state.startScroll = state.startIndex * galleryWidth(track);
    track.scrollLeft = state.startScroll;
    syncDots(host, state.startIndex);
  }

  function move(event) {
    if (!state.active || !state.track) return;
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

    if (state.mode === 'pending') {
      if (ax < 7 && ay < 7) return;
      if (ay > ax * 1.12) {
        // Vertical gesture: let the page scroll exactly like a normal page.
        cleanup();
        return;
      }
      if (ax > 12 && ax > ay * 1.16) {
        state.mode = 'horizontal';
        state.track.classList.add(DRAG, MOVED);
        state.movedUntil = performance.now() + 500;
      }
    }

    if (state.mode !== 'horizontal') return;
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    const w = galleryWidth(state.track);
    const max = maxIndex(state.track);
    const minLeft = Math.max(0, (state.startIndex - 1) * w);
    const maxLeft = Math.min(max * w, (state.startIndex + 1) * w);
    let next = state.startScroll - dx;
    if (next < minLeft) next = minLeft + (next - minLeft) * 0.18;
    if (next > maxLeft) next = maxLeft + (next - maxLeft) * 0.18;
    state.track.scrollLeft = next;
    syncDots(state.host, clamp(Math.round(next / w), 0, max));
  }

  function end(event) {
    if (!state.active || !state.track) return;
    const track = state.track;
    const host = state.host;
    const p = point(event);
    const dx = p.x - state.startX;
    const dy = p.y - state.startY;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    if (state.mode !== 'horizontal' || ay > ax * 1.2) {
      syncDots(host, indexOf(track));
      cleanup();
      return;
    }

    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    const w = galleryWidth(track);
    const threshold = Math.max(58, w * 0.20);
    let target = state.startIndex;
    if (dx <= -threshold || (dx < -28 && state.velocity < -0.82)) target = state.startIndex + 1;
    else if (dx >= threshold || (dx > 28 && state.velocity > 0.82)) target = state.startIndex - 1;
    target = clamp(target, 0, maxIndex(track));
    state.movedUntil = performance.now() + 650;
    cleanup();
    animateTo(track, target, 590);
  }

  function dotClick(event) {
    const dot = event.target?.closest?.(DOT);
    const host = dot?.closest?.('.product-detail-gallery');
    const track = host?.querySelector?.('.product-gallery-track');
    if (!dot || !host || !track) return;
    const i = dots(host).indexOf(dot);
    if (i < 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    animateTo(track, i, 540);
  }

  function suppressGhostClick(event) {
    const track = event.target?.closest?.(TRACK);
    if (!track) return;
    if (performance.now() < state.movedUntil || track.classList.contains(MOVED)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
  }

  function init(root = document) {
    root.querySelectorAll?.(TRACK).forEach((track) => {
      clearLegacyLocks();
      const i = indexOf(track);
      track.scrollLeft = i * galleryWidth(track);
      syncDots(track.closest('.product-detail-gallery'), i);
    });
  }

  document.addEventListener('touchstart', start, { capture: true, passive: true });
  document.addEventListener('touchmove', move, { capture: true, passive: false });
  document.addEventListener('touchend', end, { capture: true, passive: false });
  document.addEventListener('touchcancel', end, { capture: true, passive: false });
  document.addEventListener('mousedown', start, true);
  document.addEventListener('mousemove', move, true);
  document.addEventListener('mouseup', end, true);
  document.addEventListener('click', suppressGhostClick, true);
  document.addEventListener('click', dotClick, true);
  document.addEventListener('scroll', (event) => {
    const track = event.target?.closest?.(TRACK);
    if (!track || event.target !== track) return;
    requestAnimationFrame(() => syncDots(track.closest('.product-detail-gallery'), indexOf(track)));
  }, { capture: true, passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) if (node.nodeType === 1) init(node);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();

;(() => {
  // v79: catalog filter modal. Background is locked; the modal is always fully inside the viewport.
  const LAYER = '.filter-sheet-layer';
  const SHEET = '.filter-sheet';
  const OPEN_CLASS = 'snkr-filters-open';
  const LOCK_CLASS = 'snkr-page-scroll-locked';
  let raf = 0;
  let locked = false;
  let lockY = 0;
  let savedBody = null;
  let savedHtmlOverflow = '';

  function isOpen(layer = document.querySelector(LAYER)) {
    return !!layer && (layer.classList.contains('is-open') || layer.getAttribute('aria-hidden') === 'false');
  }
  function lockPage() {
    if (locked) return;
    locked = true;
    lockY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    savedBody = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    savedHtmlOverflow = document.documentElement.style.overflow;
    document.documentElement.classList.add(LOCK_CLASS);
    document.body.classList.add(OPEN_CLASS, LOCK_CLASS);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }
  function unlockPage() {
    if (!locked) {
      document.body.classList.remove(OPEN_CLASS, LOCK_CLASS);
      document.documentElement.classList.remove(LOCK_CLASS);
      return;
    }
    locked = false;
    document.documentElement.classList.remove(LOCK_CLASS);
    document.body.classList.remove(OPEN_CLASS, LOCK_CLASS);
    document.documentElement.style.overflow = savedHtmlOverflow || '';
    if (savedBody) {
      document.body.style.position = savedBody.position;
      document.body.style.top = savedBody.top;
      document.body.style.left = savedBody.left;
      document.body.style.right = savedBody.right;
      document.body.style.width = savedBody.width;
      document.body.style.overflow = savedBody.overflow;
    }
    window.scrollTo(0, lockY);
  }
  function apply() {
    raf = 0;
    const layer = document.querySelector(LAYER);
    const open = isOpen(layer);
    if (!layer) {
      unlockPage();
      return;
    }
    layer.classList.toggle('snkr-v79-open', open);
    document.body.classList.toggle(OPEN_CLASS, open);
    if (!open) {
      unlockPage();
      return;
    }
    lockPage();
    const viewportH = Math.max(520, window.innerHeight || document.documentElement.clientHeight || 720);
    const maxH = Math.max(420, viewportH - 46);
    layer.style.setProperty('--snkr-filter-modal-max-height', `${maxH}px`);
  }
  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(apply);
  }
  function preventBackgroundTouch(event) {
    if (!isOpen()) return;
    const sheet = event.target?.closest?.(SHEET);
    if (!sheet) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(schedule, 80), { passive: true });
  document.addEventListener('touchmove', preventBackgroundTouch, { capture: true, passive: false });
  document.addEventListener('wheel', preventBackgroundTouch, { capture: true, passive: false });
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') { schedule(); return; }
      if (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'aria-hidden')) { schedule(); return; }
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-hidden'] });
})();
