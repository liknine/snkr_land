(() => {
  const VERSION = "v72";
  const SECTIONS = [
    { id: "all", label: "Все товары" },
    { id: "men", label: "Мужская обувь" },
    { id: "women", label: "Женская обувь" },
    { id: "clothes", label: "Одежда" },
    { id: "sale", label: "Скидки" },
  ];
  const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((item) => [item.id, item]));
  const STORAGE_KEY = "snkr_catalog_section_session_v72";
  const DEFAULT_PRODUCT_SECTION = "men";

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
    return (SECTION_BY_ID[sectionId] || SECTION_BY_ID[DEFAULT_PRODUCT_SECTION]).label;
  }

  function withProductSection(product) {
    const section = normalizeSection(product?.section || product?.category || product?.catalogSection || product?.gender || product?.group);
    return {
      ...product,
      section,
      category: product?.category || sectionLabel(section),
    };
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

  if (typeof window.fetch === "function" && !window.__snkrSectionsFetchPatchedV72) {
    window.__snkrSectionsFetchPatchedV72 = true;
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
      const saved = window.sessionStorage.getItem(STORAGE_KEY) || "all";
      return SECTION_BY_ID[saved] ? saved : "all";
    } catch {
      return "all";
    }
  }

  function setActiveSection(sectionId) {
    const next = SECTION_BY_ID[sectionId] ? sectionId : "all";
    try { window.sessionStorage.setItem(STORAGE_KEY, next); } catch {}
    document.documentElement.dataset.snkrCatalogSection = next;
    applySectionFilter(true);
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
    empty.hidden = visibleCount !== 0 || activeSection === "all";
  }

  function updateToolbar() {
    const active = getActiveSection();
    const toolbar = document.querySelector(".catalog-toolbar");
    const filterButtonText = toolbar?.querySelector(".filter-pill:first-child span");
    if (filterButtonText) filterButtonText.textContent = active === "all" ? "Фильтры" : sectionLabel(active);
    if (toolbar) toolbar.dataset.activeSection = active;
  }

  function updateFilterChoices() {
    const active = getActiveSection();
    document.querySelectorAll("[data-snkr-section-choice]").forEach((button) => {
      const selected = button.getAttribute("data-snkr-section-choice") === active;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
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
        const show = active === "all" || section === active;
        card.classList.toggle("snkr-hidden-by-section", !show);
        card.setAttribute("aria-hidden", show ? "false" : "true");
        if (show) visibleCount += 1;
      });
      ensureEmptyState(document.querySelector(".catalog-screen .products-grid"), visibleCount, active);
      updateFilterChoices();
      updateToolbar();
      state.applying = false;
      if (force) window.dispatchEvent(new CustomEvent("snkr:section-filter-applied", { detail: { active, visibleCount } }));
    });
  }

  function closeFilterSheet() {
    const closeButton = document.querySelector(".filter-sheet .sheet-close");
    if (closeButton) {
      closeButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      return;
    }
    const backdrop = document.querySelector(".filter-backdrop");
    if (backdrop) backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }

  function createSectionFilters() {
    const sheet = document.querySelector(".filter-sheet");
    if (!sheet) return;
    if (!sheet.querySelector(".snkr-category-section")) {
      const block = document.createElement("div");
      block.className = "filter-section snkr-category-section";
      block.innerHTML = `
        <h3>Раздел каталога</h3>
        <div class="snkr-category-grid">
          ${SECTIONS.map((item) => `
            <button class="filter-choice snkr-category-choice" type="button" data-snkr-section-choice="${item.id}" aria-pressed="false">
              <span>${item.label}</span>
            </button>
          `).join("")}
        </div>
      `;
      const head = sheet.querySelector(".filter-sheet-head");
      if (head) head.insertAdjacentElement("afterend", block);
      else sheet.prepend(block);
      block.addEventListener("click", (event) => {
        const button = event.target.closest("[data-snkr-section-choice]");
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        setActiveSection(button.getAttribute("data-snkr-section-choice") || "all");
        closeFilterSheet();
        const catalog = document.querySelector(".catalog-screen");
        catalog?.scrollIntoView?.({ block: "start", behavior: "smooth" });
      }, true);
    }
    updateFilterChoices();
  }

  function patchFilterActions() {
    const actions = document.querySelector(".filter-actions");
    if (!actions || actions.dataset.snkrSectionsPatched === VERSION) return;
    actions.dataset.snkrSectionsPatched = VERSION;
    const reset = actions.querySelector(".filter-reset");
    const apply = actions.querySelector(".filter-apply");
    if (reset) reset.textContent = "Все товары";
    if (apply) apply.textContent = "Готово";
    actions.addEventListener("click", (event) => {
      const target = event.target.closest("button");
      if (!target) return;
      if (target.classList.contains("filter-reset")) {
        event.preventDefault();
        event.stopPropagation();
        setActiveSection("all");
      }
      if (target.classList.contains("filter-apply")) {
        event.preventDefault();
        event.stopPropagation();
        closeFilterSheet();
      }
    }, true);
  }

  function ensureSheetVisible() {
    createSectionFilters();
    patchFilterActions();
    updateFilterChoices();
    const sheet = document.querySelector(".filter-sheet");
    sheet?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
    document.body.classList.add("snkr-filters-open");
  }

  function openCatalogFilters() {
    const filterButton = document.querySelector(".catalog-screen .catalog-toolbar .filter-pill:first-child");
    if (filterButton) {
      filterButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      window.setTimeout(ensureSheetVisible, 0);
      window.setTimeout(ensureSheetVisible, 80);
    }
  }

  function interceptCatalogMenuClick() {
    if (document.__snkrCatalogMenuPatchedV72) return;
    document.__snkrCatalogMenuPatchedV72 = true;
    document.addEventListener("click", (event) => {
      const menuButton = event.target.closest(".header-menu");
      if (!menuButton || !document.querySelector(".catalog-screen")) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      openCatalogFilters();
    }, true);
  }

  function initDomPatch(force = false) {
    createSectionFilters();
    patchFilterActions();
    updateToolbar();
    applySectionFilter(force);
    interceptCatalogMenuClick();
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
    state.observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.dataset.snkrCatalogSection = getActiveSection();
    initDomPatch();
    startObserver();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeFilterSheet();
  });

  window.addEventListener("snkr:products-updated", () => applySectionFilter(true));

  window.SNKR_CATALOG_SECTIONS = {
    version: VERSION,
    sections: SECTIONS,
    setActiveSection,
    getActiveSection,
    normalizeProductsPayload,
    applySectionFilter,
    openCatalogFilters,
  };
})();
