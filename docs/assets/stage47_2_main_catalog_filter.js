/* SNKR_STAGE47_2_LIVE_MAIN_CATALOG_FILTER
 * Client catalog policy: women-section products stay in the production source of truth,
 * but are excluded from the public/main catalog response before the application reads it.
 */
(function () {
  'use strict';

  var MARKER = 'SNKR_STAGE47_2_LIVE_MAIN_CATALOG_FILTER';
  if (window.__snkrStage472MainCatalogFilter === MARKER) return;
  window.__snkrStage472MainCatalogFilter = MARKER;

  function normalize(value) {
    return String(value == null ? '' : value)
      .trim()
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ');
  }

  function falseLike(value) {
    return value === false || normalize(value) === 'false' || normalize(value) === '0' || normalize(value) === 'no';
  }

  function isWomenProduct(product) {
    if (!product || typeof product !== 'object') return false;

    if (falseLike(product.mainCatalogVisible) || falseLike(product.main_catalog_visible) ||
        falseLike(product.showInMainCatalog) || falseLike(product.show_in_main_catalog)) {
      return true;
    }

    var values = [
      product.section,
      product.catalogSection,
      product.catalog_section,
      product.shoeSection,
      product.shoe_section,
      product.gender,
      product.department,
      product.group,
      product.category
    ];

    return values.some(function (rawValue) {
      var value = normalize(rawValue);
      if (!value) return false;
      return value === 'women' || value === 'woman' || value === 'female' ||
        value === 'womens' || value === "women's" || value === 'girl' || value === 'girls' ||
        value.indexOf('жен') !== -1;
    });
  }

  function isProductsRequest(input) {
    try {
      var rawUrl = typeof input === 'string' ? input : (input && input.url) || '';
      var url = new URL(rawUrl, window.location.href);
      return /(?:^|\/)(?:data\/)?products\.json$/i.test(url.pathname);
    } catch (error) {
      return false;
    }
  }

  function filterPayload(payload) {
    if (Array.isArray(payload)) {
      return payload.filter(function (product) { return !isWomenProduct(product); });
    }

    if (payload && typeof payload === 'object' && Array.isArray(payload.products)) {
      var copy = Object.assign({}, payload);
      copy.products = payload.products.filter(function (product) { return !isWomenProduct(product); });
      return copy;
    }

    return payload;
  }

  var originalFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;
  if (!originalFetch) {
    console.error('[Stage47.2] window.fetch is unavailable; main catalog filter was not installed');
    return;
  }

  window.fetch = async function () {
    var args = Array.prototype.slice.call(arguments);
    var response = await originalFetch.apply(window, args);
    if (!response || !response.ok || !isProductsRequest(args[0])) return response;

    try {
      var payload = await response.clone().json();
      var filtered = filterPayload(payload);
      var headers = new Headers(response.headers || {});
      headers.delete('content-length');
      headers.delete('content-encoding');
      headers.set('content-type', 'application/json; charset=utf-8');
      headers.set('x-snkr-catalog-filter', 'stage47.2');
      return new Response(JSON.stringify(filtered), {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
    } catch (error) {
      console.error('[Stage47.2] products.json filter failed closed', error);
      throw error;
    }
  };
})();
