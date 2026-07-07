(() => {
  const VERSION = 'v122';
  const DATA_URL = '/snkr_land/data/products.json';
  const DEFAULT_ADMIN_IDS = ['1639462053'];
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

  async function loadProducts() {
    if (productsCache) return productsCache;
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: 'no-store' });
    const data = await response.json();
    const products = Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : []);
    productsCache = products.filter((item) => item && item.isActive !== false);
    return productsCache;
  }

  function getCardTitle(card) {
    return normalize(card.querySelector('.product-copy h2')?.textContent || card.querySelector('h2')?.textContent || '');
  }

  function getCardPrice(card) {
    return toStr(card.querySelector('.product-price')?.textContent || '').replace(/[^0-9]/g, '');
  }

  function productName(product) {
    return normalize(product?.name || '');
  }

  function productPrice(product) {
    return toStr(product?.price || '').replace(/[^0-9]/g, '');
  }

  function findProductForCard(card, products, visualIndex, usedIds) {
    const title = getCardTitle(card);
    const price = getCardPrice(card);

    let foundIndex = products.findIndex((product) => {
      const rawId = String(product?.id ?? '');
      if (rawId && usedIds.has(rawId)) return false;
      const name = productName(product);
      const pPrice = productPrice(product);
      return name && title && name === title && (!price || !pPrice || price === pPrice);
    });

    if (foundIndex < 0) {
      foundIndex = products.findIndex((product) => {
        const rawId = String(product?.id ?? '');
        if (rawId && usedIds.has(rawId)) return false;
        const name = productName(product);
        return name && title && (name.includes(title) || title.includes(name));
      });
    }

    if (foundIndex < 0 && products[visualIndex]) foundIndex = visualIndex;
    if (foundIndex < 0) return { product: null, productIndex: visualIndex };

    const product = products[foundIndex];
    const rawId = String(product?.id ?? '');
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

    return String((Number(productIndex) || 0) + 1);
  }

  function ensureBadge(card, product, productIndex) {
    const displayId = getDisplayProductId(product, productIndex);
    if (!displayId) return;

    const copy = card.querySelector('.product-copy') || card;
    let badge = card.querySelector('.snkr-admin-product-id');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'snkr-admin-product-id';
      const price = card.querySelector('.product-price');
      if (price?.parentElement) price.insertAdjacentElement('afterend', badge);
      else copy.appendChild(badge);
    }

    badge.textContent = `ID: ${displayId}`;
    const rawId = toStr(product?.id);
    if (rawId) badge.dataset.productId = rawId;
  }

  async function patchCatalogAdminIds() {
    scheduled = false;
    if (!isAdmin()) return;

    const grid = document.querySelector('.catalog-screen .products-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.product-card'));
    if (!cards.length) return;

    const products = await loadProducts().catch(() => []);
    if (!products.length) return;

    const usedIds = new Set();
    cards.forEach((card, visualIndex) => {
      const { product, productIndex } = findProductForCard(card, products, visualIndex, usedIds);
      if (product) ensureBadge(card, product, productIndex);
    });
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => requestAnimationFrame(patchCatalogAdminIds));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();

  window.addEventListener('load', schedule, { once: true });
  document.addEventListener('click', schedule, true);
  window.addEventListener('snkr:products-updated', () => { productsCache = null; schedule(); });
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });

  window.SNKR_ADMIN_ID_AND_OPEN_CARD_PHOTO_V122 = { version: VERSION, schedule };
})();
