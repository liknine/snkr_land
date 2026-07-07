(() => {
  const VERSION = 'v123';
  const DATA_URLS = [
    '/snkr_land/data/products.json',
    './data/products.json',
    'data/products.json'
  ];

  // 1639462053 was already present in the project order data. 583019274 is kept as a second admin fallback.
  const DEFAULT_ADMIN_IDS = ['1639462053', '583019274'];

  let productsCache = null;
  let scheduled = false;

  function toStr(value) {
    return String(value ?? '').trim();
  }

  function normalize(value) {
    return toStr(value).toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
  }

  function getTelegramUserId() {
    try {
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      return user?.id ? String(user.id) : '';
    } catch {
      return '';
    }
  }

  function getAdminIds() {
    const config = window.SNKR_CONFIG || {};
    const raw = config.ADMIN_IDS || config.ADMIN_ID || config.adminIds || config.admin_id || DEFAULT_ADMIN_IDS;
    const list = Array.isArray(raw) ? raw : String(raw).split(/[\s,;]+/);
    return Array.from(new Set([...DEFAULT_ADMIN_IDS, ...list.map((item) => String(item).trim()).filter(Boolean)]));
  }

  function isAdmin() {
    const userId = getTelegramUserId();
    return !!userId && getAdminIds().includes(userId);
  }

  async function fetchProductsFrom(url) {
    const response = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`products fetch failed: ${response.status}`);
    const data = await response.json();
    const products = Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : []);
    return products.filter((item) => item && item.isActive !== false);
  }

  async function loadProducts() {
    if (productsCache) return productsCache;
    for (const url of DATA_URLS) {
      try {
        const products = await fetchProductsFrom(url);
        if (products.length) {
          productsCache = products;
          return productsCache;
        }
      } catch {}
    }
    productsCache = [];
    return productsCache;
  }

  function textFrom(el, selectors) {
    for (const selector of selectors) {
      const node = el.querySelector(selector);
      const text = normalize(node?.textContent || '');
      if (text) return text;
    }
    return '';
  }

  function getPriceText(el) {
    return toStr(el.querySelector('.product-price')?.textContent || '').replace(/[^0-9]/g, '');
  }

  function productName(product) {
    return normalize(product?.name || '');
  }

  function productPrice(product) {
    return toStr(product?.price || '').replace(/[^0-9]/g, '');
  }

  function productImage(product) {
    const image = Array.isArray(product?.images) ? product.images[0] : product?.image;
    return toStr(image).split('/').pop();
  }

  function getElementImageKey(el) {
    const img = el.querySelector('img[src*="/products/"], img[src*="products/"]') || el.querySelector('img');
    const src = toStr(img?.getAttribute('src') || img?.src || '');
    return src.split('?')[0].split('/').pop();
  }

  function findProductForElement(el, products, visualIndex, usedIds) {
    const title = textFrom(el, ['.product-copy h2', '.product-detail-head h1', 'h1', 'h2']);
    const price = getPriceText(el);
    const imageKey = getElementImageKey(el);

    const isUnused = (product) => {
      const rawId = toStr(product?.id);
      return !rawId || !usedIds.has(rawId);
    };

    let foundIndex = products.findIndex((product) => {
      if (!isUnused(product)) return false;
      const name = productName(product);
      const pPrice = productPrice(product);
      return name && title && name === title && (!price || !pPrice || price === pPrice);
    });

    if (foundIndex < 0 && imageKey) {
      foundIndex = products.findIndex((product) => isUnused(product) && productImage(product) === imageKey);
    }

    if (foundIndex < 0) {
      foundIndex = products.findIndex((product) => {
        if (!isUnused(product)) return false;
        const name = productName(product);
        return name && title && (name.includes(title) || title.includes(name));
      });
    }

    if (foundIndex < 0 && Number.isInteger(visualIndex) && products[visualIndex]) foundIndex = visualIndex;
    if (foundIndex < 0) return { product: null, productIndex: visualIndex || 0 };

    const product = products[foundIndex];
    const rawId = toStr(product?.id);
    if (rawId) usedIds.add(rawId);
    return { product, productIndex: foundIndex };
  }

  function getDisplayProductId(product, productIndex) {
    const directFields = [
      'adminId', 'admin_id', 'editId', 'edit_id', 'botId', 'bot_id',
      'productNumber', 'product_number', 'number', 'shortId', 'short_id', 'code'
    ];

    for (const field of directFields) {
      const value = toStr(product?.[field]);
      if (value) return value;
    }

    const rawId = toStr(product?.id);
    if (rawId && rawId.length <= 6) return rawId;

    // If product.id is a long technical timestamp, show the same short admin number by list order: 1, 2, 3...
    return String((Number(productIndex) || 0) + 1);
  }

  function placeBadge(container, product, productIndex, isDetail = false) {
    const displayId = getDisplayProductId(product, productIndex);
    if (!displayId) return;

    let badge = container.querySelector(':scope > .snkr-admin-product-id');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = `snkr-admin-product-id${isDetail ? ' snkr-admin-product-id--detail' : ''}`;

      if (isDetail) {
        const head = container.querySelector('.product-detail-head') || container;
        const title = head.querySelector('h1');
        if (title) title.insertAdjacentElement('afterend', badge);
        else head.prepend(badge);
      } else {
        const price = container.querySelector('.product-price');
        if (price?.parentElement) price.insertAdjacentElement('afterend', badge);
        else (container.querySelector('.product-copy') || container).appendChild(badge);
      }
    }

    badge.textContent = `ID: ${displayId}`;
    const rawId = toStr(product?.id);
    if (rawId) badge.dataset.productId = rawId;
  }

  async function patchAdminIds() {
    scheduled = false;
    if (!isAdmin()) return;

    const products = await loadProducts().catch(() => []);
    if (!products.length) return;

    const usedIds = new Set();
    const cards = Array.from(document.querySelectorAll('.catalog-screen .product-card'));
    cards.forEach((card, visualIndex) => {
      const { product, productIndex } = findProductForElement(card, products, visualIndex, usedIds);
      if (product) placeBadge(card, product, productIndex, false);
    });

    const detail = document.querySelector('.product-detail-screen');
    if (detail) {
      const { product, productIndex } = findProductForElement(detail, products, null, new Set());
      if (product) placeBadge(detail, product, productIndex, true);
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => requestAnimationFrame(patchAdminIds));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();

  window.addEventListener('load', schedule, { once: true });
  document.addEventListener('click', schedule, true);
  window.addEventListener('snkr:products-updated', () => { productsCache = null; schedule(); });
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });

  window.SNKR_ADMIN_ID_AND_OPEN_CARD_PHOTO_V123 = { version: VERSION, schedule };
})();
