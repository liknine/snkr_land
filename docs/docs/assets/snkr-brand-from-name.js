;(() => {
  // v100: brand filters must work even when products have empty brand field.
  // We infer brand from product name before React builds the filter list.
  const KNOWN_MULTI = [
    ['maison margiela', 'Maison Margiela'],
    ['new balance', 'New Balance'],
    ['louis vuitton', 'Louis Vuitton'],
    ['off white', 'Off-White'],
    ['off-white', 'Off-White'],
    ['air jordan', 'Jordan'],
    ['alexander mcqueen', 'Alexander McQueen'],
    ['dolce gabbana', 'Dolce & Gabbana'],
    ['dolce & gabbana', 'Dolce & Gabbana'],
    ['fear of god', 'Fear of God'],
    ['stone island', 'Stone Island'],
    ['the north face', 'The North Face'],
    ['dr. martens', 'Dr. Martens'],
    ['dr martens', 'Dr. Martens'],
  ];
  const KNOWN_SINGLE = new Map([
    ['nike', 'Nike'], ['adidas', 'Adidas'], ['jordan', 'Jordan'], ['yeezy', 'Yeezy'],
    ['puma', 'Puma'], ['reebok', 'Reebok'], ['asics', 'Asics'], ['vans', 'Vans'],
    ['converse', 'Converse'], ['salomon', 'Salomon'], ['balenciaga', 'Balenciaga'],
    ['dior', 'Dior'], ['gucci', 'Gucci'], ['prada', 'Prada'], ['lv', 'Louis Vuitton'],
    ['fila', 'Fila'], ['lacoste', 'Lacoste'], ['tnf', 'The North Face'],
    ['supreme', 'Supreme'], ['stussy', 'Stussy'], ['carhartt', 'Carhartt'],
    ['arc\'teryx', 'Arc\'teryx'], ['arcteryx', 'Arc\'teryx'],
  ]);

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[ё]/g, 'е')
      .replace(/[^a-zа-я0-9&.'\-\s]+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function titleCase(token) {
    const value = String(token || '').trim();
    if (!value) return '';
    if (/^[A-Z0-9]{2,}$/.test(value)) return value;
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  function isJunkToken(token) {
    const value = String(token || '').trim();
    if (!value) return true;
    if (/^\d+$/.test(value)) return true;
    const letters = value.replace(/[^a-zа-яё]/gi, '');
    if (letters.length < 2) return true;
    if (letters.length >= 3 && new Set(letters.toLowerCase().split('')).size === 1) return true;
    return false;
  }

  function inferBrand(name) {
    const raw = String(name || '').trim();
    const clean = normalize(raw);
    if (!clean) return '';
    for (const [needle, label] of KNOWN_MULTI) {
      if (clean === needle || clean.startsWith(needle + ' ')) return label;
    }
    const first = clean.split(' ')[0] || '';
    if (KNOWN_SINGLE.has(first)) return KNOWN_SINGLE.get(first);
    if (isJunkToken(first)) return '';
    return titleCase(first);
  }

  function normalizeProduct(product) {
    if (!product || typeof product !== 'object') return product;
    const copy = { ...product };
    const brand = String(copy.brand || '').trim() || inferBrand(copy.name);
    if (brand) copy.brand = brand;
    return copy;
  }

  function normalizePayload(payload) {
    try {
      if (Array.isArray(payload)) return payload.map(normalizeProduct);
      if (payload && typeof payload === 'object') {
        if (Array.isArray(payload.products)) return { ...payload, products: payload.products.map(normalizeProduct) };
        if (Array.isArray(payload.items)) return { ...payload, items: payload.items.map(normalizeProduct) };
      }
    } catch (_) {}
    return payload;
  }

  window.__snkrInferBrandFromName = inferBrand;
  window.__snkrNormalizeProductsBrand = normalizePayload;

  const originalFetch = window.fetch;
  if (typeof originalFetch !== 'function' || originalFetch.__snkrBrandV100) return;

  async function patchedFetch(input, init) {
    const response = await originalFetch.call(this, input, init);
    try {
      const url = String(typeof input === 'string' ? input : input?.url || '');
      const shouldPatch = /\/api\/products(?:\?|$)/.test(url) || /\/data\/products\.json(?:\?|$)/.test(url) || /products\.json(?:\?|$)/.test(url);
      if (!shouldPatch || !response || !response.ok) return response;
      const clone = response.clone();
      const data = await clone.json();
      const patched = normalizePayload(data);
      return new Response(JSON.stringify(patched), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (_) {
      return response;
    }
  }
  patchedFetch.__snkrBrandV100 = true;
  window.fetch = patchedFetch;
})();
