(() => {
  const VERSION = 'v121';
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
    const raw = config.ADMIN_IDS || config.ADMIN_ID || DEFAULT_ADMIN_IDS;
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
    productsCache = Array.isArray(data) ? data.filter((item) => item && item.isActive !== false) : [];
    return productsCache;
  }

  function getCardTitle(card) {
    return normalize(card.querySelector('.product-copy h2')?.textContent || '');
  }

  function getCardPrice(card) {
    return toStr(card.querySelector('.product-price')?.textContent || '').replace(/[^0-9]/g, '');
  }

  function findProductForCard(card, products, index, used) {
    const title = getCardTitle(card);
    const price = getCardPrice(card);

    let found = products.find((product) => {
      const id = String(product.id ?? '');
      if (!id || used.has(id)) return false;
      const productName = normalize(product.name);
      const productPrice = String(product.price ?? '').replace(/[^0-9]/g, '');
      return productName && title && productName === title && (!price || !productPrice || price === productPrice);
    });

    if (!found) {
      found = products.find((product) => {
        const id = String(product.id ?? '');
        if (!id || used.has(id)) return false;
        const productName = normalize(product.name);
        return productName && title && (productName.includes(title) || title.includes(productName));
      });
    }

    if (!found && products[index]) {
      const fallbackId = String(products[index].id ?? '');
      if (fallbackId && !used.has(fallbackId)) found = products[index];
    }

    const foundId = String(found?.id ?? '');
    if (foundId) used.add(foundId);
    return found;
  }

  function ensureBadge(card, product) {
    const id = toStr(product?.id);
    if (!id) return;
    const copy = card.querySelector('.product-copy');
    if (!copy) return;

    let badge = card.querySelector('.snkr-admin-product-id');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'snkr-admin-product-id';
      const price = card.querySelector('.product-price');
      if (price?.parentElement) price.insertAdjacentElement('afterend', badge);
      else copy.appendChild(badge);
    }
    badge.textContent = `ID: ${id}`;
  }

  async function patchCards() {
    scheduled = false;
    if (!isAdmin()) return;

    const grid = document.querySelector('.catalog-screen .products-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.product-card'));
    if (!cards.length) return;

    const products = await loadProducts().catch(() => []);
    if (!products.length) return;

    const used = new Set();
    cards.forEach((card, index) => {
      const product = findProductForCard(card, products, index, used);
      ensureBadge(card, product);
    });
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => requestAnimationFrame(patchCards));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
  window.addEventListener('load', schedule, { once: true });
  document.addEventListener('click', schedule, true);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });

  window.SNKR_ADMIN_CARD_V121 = { version: VERSION, schedule };
})();
