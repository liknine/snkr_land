(() => {
  const VERSION = "v75";
  const SECTIONS = [
    { id: "men", label: "Мужская обувь" },
    { id: "women", label: "Женская обувь" },
    { id: "clothes", label: "Одежда" },
    { id: "sale", label: "Скидки" },
  ];
  const ALL_SECTION = "all";
  const DEFAULT_PRODUCT_SECTION = "men";
  const STORAGE_KEY = "snkr_catalog_section_v75";
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

  if (typeof window.fetch === "function" && !window.__snkrSideSectionsFetchPatchedV75) {
    window.__snkrSideSectionsFetchPatchedV75 = true;
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
    if (document.__snkrSideMenuFilterClicksV75) return;
    document.__snkrSideMenuFilterClicksV75 = true;
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
    if (document.__snkrBottomCatalogResetV75) return;
    document.__snkrBottomCatalogResetV75 = true;
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
  // v75: final simple smooth gallery. Owns photo touch events before old handlers, vertical scroll stays native.
  const TRACK = '.product-gallery-track';
  const SLIDE = '.product-gallery-slide';
  const DOT = '.product-gallery-dot';
  const DRAG_CLASS = 'snkr-v75-dragging';
  const ACTIVE_CLASS = 'snkr-gallery-v75-horizontal';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  let active = false;
  let horizontal = false;
  let track = null;
  let gallery = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastT = 0;
  let startLeft = 0;
  let startIndex = 0;
  let velocity = 0;
  let raf = 0;
  let queuedLeft = null;
  let anim = 0;

  function slides(node = track) {
    return Array.from(node?.querySelectorAll?.(SLIDE) || []);
  }

  function width(node = track) {
    const host = node?.closest?.('.product-detail-gallery') || gallery;
    return Math.max(1, node?.clientWidth || host?.clientWidth || 1);
  }

  function maxIndex(node = track) {
    return Math.max(0, slides(node).length - 1);
  }

  function point(event) {
    const touch = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
    return touch ? { x: touch.clientX, y: touch.clientY } : { x: event.clientX || 0, y: event.clientY || 0 };
  }

  function dots(host = gallery) {
    return Array.from(host?.querySelectorAll?.(DOT) || []);
  }

  function getIndex(node = track) {
    return clamp(Math.round((node?.scrollLeft || 0) / width(node)), 0, maxIndex(node));
  }

  function syncDots(host = gallery, index = getIndex(host?.querySelector?.(TRACK) || track)) {
    dots(host).forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.classList.toggle('active', i === index);
    });
  }

  function clearLegacyLocks() {
    document.documentElement.classList.remove('snkr-gallery-native-touch', 'snkr-gallery-swiping', 'snkr-gallery-v69-horizontal');
    document.body.classList.remove('snkr-gallery-native-touch', 'snkr-gallery-swiping', 'snkr-gallery-v69-horizontal');
    document.querySelectorAll('.product-gallery-track.is-dragging, .product-gallery-track.snkr-v69-dragging, .product-detail-gallery.is-swiping, .product-detail-gallery.snkr-v69-swiping').forEach((node) => {
      node.classList.remove('is-dragging', 'snkr-v69-dragging', 'is-swiping', 'snkr-v69-swiping');
    });
  }

  function cancelAnimation() {
    if (anim) cancelAnimationFrame(anim);
    if (raf) cancelAnimationFrame(raf);
    anim = 0;
    raf = 0;
    queuedLeft = null;
  }

  function setLeft(left) {
    if (!track) return;
    queuedLeft = clamp(left, 0, maxIndex() * width());
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!track || queuedLeft == null) return;
      track.scrollLeft = queuedLeft;
      syncDots();
      queuedLeft = null;
    });
  }

  function startHorizontal() {
    if (!track || !gallery || horizontal) return;
    horizontal = true;
    cancelAnimation();
    clearLegacyLocks();
    track.classList.add(DRAG_CLASS);
    document.documentElement.classList.add(ACTIVE_CLASS);
    document.body.classList.add(ACTIVE_CLASS);
  }

  function cleanup() {
    track?.classList.remove(DRAG_CLASS, 'snkr-v69-dragging', 'is-dragging');
    gallery?.classList.remove('snkr-v69-swiping', 'is-swiping');
    document.documentElement.classList.remove(ACTIVE_CLASS, 'snkr-gallery-native-touch', 'snkr-gallery-swiping', 'snkr-gallery-v69-horizontal');
    document.body.classList.remove(ACTIVE_CLASS, 'snkr-gallery-native-touch', 'snkr-gallery-swiping', 'snkr-gallery-v69-horizontal');
  }

  function animateTo(index, node = track, host = gallery) {
    if (!node) return;
    cancelAnimation();
    const max = maxIndex(node);
    const targetIndex = clamp(index, 0, max);
    const to = targetIndex * width(node);
    const from = node.scrollLeft;
    const distance = Math.abs(to - from);
    if (distance < 1) {
      node.scrollLeft = to;
      syncDots(host, targetIndex);
      return;
    }
    const duration = clamp(240 + distance * 0.16, 260, 420);
    const started = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const frame = (now) => {
      const p = Math.min(1, (now - started) / duration);
      node.scrollLeft = from + (to - from) * ease(p);
      syncDots(host, clamp(Math.round(node.scrollLeft / width(node)), 0, max));
      if (p < 1) anim = requestAnimationFrame(frame);
      else {
        anim = 0;
        node.scrollLeft = to;
        syncDots(host, targetIndex);
      }
    };
    anim = requestAnimationFrame(frame);
  }

  function onStart(event) {
    const targetTrack = event.target?.closest?.(TRACK);
    const targetGallery = targetTrack?.closest?.('.product-detail-gallery');
    if (!targetTrack || !targetGallery) return;
    if (event.target?.closest?.('.product-gallery-dots, button, a')) return;
    if (slides(targetTrack).length <= 1) return;

    // Stop older gallery patches from also handling the same gesture. Default vertical scroll is still allowed.
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    track = targetTrack;
    gallery = targetGallery;
    cancelAnimation();
    clearLegacyLocks();
    const p = point(event);
    startX = lastX = p.x;
    startY = p.y;
    startLeft = track.scrollLeft;
    startIndex = getIndex(track);
    lastT = performance.now();
    velocity = 0;
    horizontal = false;
    active = true;
  }

  function onMove(event) {
    const targetTrack = event.target?.closest?.(TRACK);
    if (!active || !track || targetTrack !== track) return;

    const p = point(event);
    const dx = p.x - startX;
    const dy = p.y - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    velocity = (p.x - lastX) / dt;
    lastX = p.x;
    lastT = now;

    // Keep old handlers away, but do not block native vertical scroll unless this is a real horizontal swipe.
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    if (!horizontal) {
      if (absX < 6 && absY < 6) return;
      if (absY > absX * 1.05) {
        active = false;
        cleanup();
        return;
      }
      if (absX > 7 && absX > absY * 1.08) startHorizontal();
    }

    if (!horizontal) return;
    if (event.cancelable) event.preventDefault();

    const edge = maxIndex() * width();
    let nextLeft = startLeft - dx;
    if (nextLeft < 0) nextLeft *= 0.22;
    if (nextLeft > edge) nextLeft = edge + (nextLeft - edge) * 0.22;
    setLeft(nextLeft);
  }

  function onEnd(event) {
    if (!active || !track) {
      clearLegacyLocks();
      return;
    }

    const wasHorizontal = horizontal;
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    if (!wasHorizontal) {
      active = false;
      cleanup();
      syncDots();
      return;
    }

    if (event.cancelable) event.preventDefault();
    const p = point(event);
    const dx = p.x - startX;
    const threshold = Math.max(34, width() * 0.115);
    let target = startIndex;
    if (dx <= -threshold || velocity < -0.34) target = startIndex + 1;
    else if (dx >= threshold || velocity > 0.34) target = startIndex - 1;
    else target = getIndex(track);

    const currentTrack = track;
    const currentGallery = gallery;
    animateTo(target, currentTrack, currentGallery);
    window.setTimeout(() => {
      currentTrack?.classList.remove(DRAG_CLASS);
      cleanup();
      active = false;
      horizontal = false;
    }, 430);
  }

  function onDotClick(event) {
    const dot = event.target?.closest?.(DOT);
    const host = dot?.closest?.('.product-detail-gallery');
    const node = host?.querySelector?.(TRACK);
    if (!dot || !host || !node) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    const index = dots(host).indexOf(dot);
    if (index >= 0) animateTo(index, node, host);
  }

  function init(root = document) {
    root.querySelectorAll?.(TRACK).forEach((node) => {
      const host = node.closest('.product-detail-gallery');
      if (!host) return;
      node.classList.add('snkr-v75-gallery-ready');
      syncDots(host, getIndex(node));
    });
  }

  document.addEventListener('touchstart', onStart, { capture: true, passive: true });
  document.addEventListener('touchmove', onMove, { capture: true, passive: false });
  document.addEventListener('touchend', onEnd, { capture: true, passive: false });
  document.addEventListener('touchcancel', onEnd, { capture: true, passive: false });
  document.addEventListener('click', onDotClick, true);
  document.addEventListener('scroll', (event) => {
    const node = event.target?.closest?.(TRACK);
    if (node && event.target === node) requestAnimationFrame(() => syncDots(node.closest('.product-detail-gallery'), getIndex(node)));
  }, { capture: true, passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) if (node.nodeType === 1) init(node);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
