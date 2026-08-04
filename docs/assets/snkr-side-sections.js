(() => {
  const VERSION = "v101";
  const SECTIONS = [
    { id: "men", label: "Мужская обувь" },
    { id: "women", label: "Женская обувь" },
    { id: "clothes", label: "Одежда" },
    { id: "sale", label: "Скидки" },
  ];
  const ALL_SECTION = "all";
  const DEFAULT_PRODUCT_SECTION = "men";
  const STORAGE_KEY = "snkr_catalog_section_v101";
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
    productByImage: new Map(),
    productById: new Map(),
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

  function normalizePath(value) {
    return String(value || "")
      .split("?")[0]
      .replace(/^https?:\/\/[^/]+/i, "")
      .replace(/^\/snkr_land\//, "")
      .replace(/^\/+/, "");
  }

  function imageKeys(value) {
    const path = normalizePath(value);
    if (!path) return [];
    const name = path.split("/").pop();
    return name && name !== path ? [path, name] : [path];
  }

  function withProductSection(product) {
    const section = normalizeSection(product?.section || product?.category || product?.catalogSection || product?.gender || product?.group);
    return { ...product, section, category: product?.category || sectionLabel(section) };
  }

  function rebuildIndexes(products) {
    state.productByImage = new Map();
    state.productById = new Map();
    products.forEach((product) => {
      if (product?.id != null) state.productById.set(String(product.id), product);
      const images = Array.isArray(product?.images) ? product.images : [];
      images.forEach((src) => imageKeys(src).forEach((key) => {
        const candidates = state.productByImage.get(key) || [];
        candidates.push(product);
        state.productByImage.set(key, candidates);
      }));
    });
  }

  function normalizeProductsPayload(payload) {
    if (Array.isArray(payload)) {
      const products = payload.map(withProductSection);
      state.products = products;
      rebuildIndexes(products);
      return products;
    }
    if (payload && Array.isArray(payload.products)) {
      const products = payload.products.map(withProductSection);
      state.products = products;
      rebuildIndexes(products);
      return { ...payload, products };
    }
    return payload;
  }

  function shouldPatchProductsResponse(input) {
    const url = typeof input === "string" ? input : input?.url || "";
    return /\/api\/products(?:\?|$)/.test(url) || /\/data\/products\.json(?:\?|$)/.test(url);
  }

  if (typeof window.fetch === "function" && !window.__snkrSideSectionsFetchPatchedV101) {
    window.__snkrSideSectionsFetchPatchedV101 = true;
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
        return new Response(JSON.stringify(patched), { status: response.status, statusText: response.statusText, headers });
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

  function saveActiveSection(sectionId) {
    const next = sectionId === ALL_SECTION || SECTION_BY_ID[sectionId] ? sectionId : ALL_SECTION;
    try { window.sessionStorage.setItem(STORAGE_KEY, next); } catch {}
    document.documentElement.dataset.snkrCatalogSection = next;
    return next;
  }

  function setActiveSection(sectionId, options = {}) {
    const next = saveActiveSection(sectionId);
    patchSideMenuRows();
    if (!options.deferApply) applySectionFilter(true);
    if (!options.silent) {
      window.dispatchEvent(new CustomEvent("snkr:catalog-section-change", { detail: { section: next, label: sectionLabel(next) } }));
    }
  }

  function cardImagePaths(card) {
    return Array.from(card.querySelectorAll("img"))
      .flatMap((img) => imageKeys(img.getAttribute("src") || img.currentSrc || ""))
      .filter(Boolean);
  }

  function findProductForCard(card) {
    const productId = card.getAttribute("data-product-id") || card.dataset.productId;
    if (productId && state.productById.has(String(productId))) {
      return state.productById.get(String(productId));
    }

    const savedSection = normalizeText(card.getAttribute("data-snkr-section"));
    for (const key of cardImagePaths(card)) {
      const candidates = state.productByImage.get(key) || [];
      if (candidates.length === 1) return candidates[0];
      if (savedSection && SECTION_BY_ID[savedSection]) {
        const sectionMatches = candidates.filter((product) => normalizeSection(product?.section || product?.category) === savedSection);
        if (sectionMatches.length === 1) return sectionMatches[0];
      }
    }

    const text = normalizeText(card.textContent);
    if (text && state.products.length) {
      const matches = state.products.filter((product) => {
        const name = normalizeText(product?.name);
        return name && text.includes(name);
      });
      if (matches.length === 1) return matches[0];
      if (savedSection && SECTION_BY_ID[savedSection]) {
        const sectionMatches = matches.filter((product) => normalizeSection(product?.section || product?.category) === savedSection);
        if (sectionMatches.length === 1) return sectionMatches[0];
      }
    }

    return null;
  }

  function isMainCatalogProduct(product) {
    if (!product) return false;
    const section = normalizeSection(product.section || product.category);
    return section === DEFAULT_PRODUCT_SECTION && product.mainCatalogVisible !== false;
  }

  function getActiveBrandFilter() {
    const filterSections = Array.from(document.querySelectorAll(".filter-sheet .filter-section"));
    const brandSection = filterSections.find((section) => {
      const title = normalizeText(section.querySelector("h3")?.textContent);
      return title === "бренд" || title === "название";
    });
    if (brandSection) {
      const selected = brandSection.querySelector(".filter-choice.is-selected span");
      const value = normalizeText(selected?.textContent);
      return value && !["все товары", "все бренды", "все"].includes(value) ? value : "";
    }

    try {
      return normalizeText(window.sessionStorage.getItem("snkr_catalog_name_filter"));
    } catch {
      return "";
    }
  }

  function isBrandFilterActive() {
    return Boolean(getActiveBrandFilter());
  }

  function shouldShowProduct(activeSection, product, brandFilterActive = isBrandFilterActive()) {
    if (!product) return false;
    const section = normalizeSection(product.section || product.category);
    if (brandFilterActive) return section === "men" || section === "women";
    return activeSection === ALL_SECTION ? isMainCatalogProduct(product) : section === activeSection;
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
    empty.hidden = visibleCount !== 0;
  }

  function applySectionFilter(force = false) {
    if (state.applying) return;
    const grid = document.querySelector(".catalog-screen .products-grid");
    const cards = getCards();
    if (!grid && cards.length === 0) {
      patchSideMenuRows();
      return;
    }
    state.applying = true;
    window.requestAnimationFrame(() => {
      const active = getActiveSection();
      const brandFilter = getActiveBrandFilter();
      const brandFilterActive = Boolean(brandFilter);
      document.documentElement.dataset.snkrCatalogSection = active;
      document.documentElement.dataset.snkrBrandFilterActive = brandFilterActive ? "true" : "false";
      let visibleCount = 0;
      getCards().forEach((card) => {
        const product = findProductForCard(card);
        const section = normalizeSection(product?.section || product?.category || card.getAttribute("data-snkr-section"));
        card.setAttribute("data-snkr-section", section);
        const show = shouldShowProduct(active, product, brandFilterActive);
        if (card.classList.contains("snkr-hidden-by-section") === show) {
          card.classList.toggle("snkr-hidden-by-section", !show);
        }
        card.hidden = !show;
        card.style.display = show ? "" : "none";
        card.setAttribute("aria-hidden", show ? "false" : "true");
        if (show) visibleCount += 1;
      });
      ensureEmptyState(document.querySelector(".catalog-screen .products-grid"), visibleCount, active);
      patchSideMenuRows();
      state.applying = false;
      if (force) window.dispatchEvent(new CustomEvent("snkr:section-filter-applied", { detail: { active, visibleCount, brandFilter } }));
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
    const alreadyCatalog = !!document.querySelector(".catalog-screen");
    if (alreadyCatalog) {
      applySectionFilter(true);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    const button = findBottomCatalogButton();
    if (!button) return;
    state.programmaticCatalogClick = true;
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    window.setTimeout(() => applySectionFilter(true), 90);
    window.setTimeout(() => applySectionFilter(true), 260);
    window.setTimeout(() => { state.programmaticCatalogClick = false; }, 700);
  }

  function patchSideMenuRows() {
    const list = document.querySelector(".side-menu-list");
    if (!list) return;
    const active = getActiveSection();
    const kicker = document.querySelector(".side-menu-kicker");
    if (kicker) kicker.textContent = "FILTERS";
    Array.from(list.querySelectorAll(".side-menu-row")).forEach((row, index) => {
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
    if (document.__snkrSideMenuFilterClicksV101) return;
    document.__snkrSideMenuFilterClicksV101 = true;
    document.addEventListener("click", (event) => {
      const row = event.target?.closest?.(".side-menu-list .side-menu-row");
      if (!row) return;
      const section = row.dataset.snkrMenuSection;
      if (!section || !SECTION_BY_ID[section]) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      saveActiveSection(section);
      patchSideMenuRows();
      closeSideMenu();
      goCatalogAfterSectionPick();
    }, true);
  }

  function interceptBottomCatalogReset() {
    if (document.__snkrBottomCatalogResetV101) return;
    document.__snkrBottomCatalogResetV101 = true;
    document.addEventListener("click", (event) => {
      const button = event.target?.closest?.(".bottom-nav-item");
      if (!button || !normalizeText(button.textContent).includes("каталог")) return;
      if (state.programmaticCatalogClick) return;
      saveActiveSection(ALL_SECTION);
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
    window.setTimeout(() => {
      state.scheduled = false;
      initDomPatch(force);
    }, 80);
  }

  function startObserver() {
    if (state.observer) return;
    state.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.target?.matches?.(".filter-choice")) {
          queueDomPatch(true);
          return;
        }
        if (mutation.type === "childList") {
          const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
          if (nodes.some((node) => node.nodeType === 1 && (node.matches?.(".product-card,.side-menu-list,.catalog-screen") || node.querySelector?.(".product-card,.side-menu-list,.catalog-screen")))) {
            queueDomPatch(false);
            return;
          }
        }
      }
    });
    state.observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
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
    findProductForCard,
    isMainCatalogProduct,
    getActiveBrandFilter,
    isBrandFilterActive,
    shouldShowProduct,
  };
})();
