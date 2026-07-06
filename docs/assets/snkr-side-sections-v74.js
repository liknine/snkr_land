(() => {
  const VERSION = "v74";
  const SECTIONS = [
    { id: "men", label: "Мужская обувь" },
    { id: "women", label: "Женская обувь" },
    { id: "clothes", label: "Одежда" },
    { id: "sale", label: "Скидки" },
  ];
  const ALL_SECTION = "all";
  const DEFAULT_PRODUCT_SECTION = "men";
  const STORAGE_KEY = "snkr_catalog_section_v74";
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

  if (typeof window.fetch === "function" && !window.__snkrSideSectionsFetchPatchedV74) {
    window.__snkrSideSectionsFetchPatchedV74 = true;
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
    if (document.__snkrSideMenuFilterClicksV74) return;
    document.__snkrSideMenuFilterClicksV74 = true;
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
    if (document.__snkrBottomCatalogResetV74) return;
    document.__snkrBottomCatalogResetV74 = true;
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
