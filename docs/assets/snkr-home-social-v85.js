(() => {
  const VERSION = 'v85';
  const SOCIALS = [
    { id: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@sneakers_land_by?_r=1&_t=ZS-97bjM5lZDq3' },
    { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/sneakers_land.by?igsh=MTBvbnRxbm90MXVrbw==' },
    { id: 'telegram', label: 'Telegram', url: 'https://t.me/Sneakers_land_BY' },
  ];
  let scheduled = false;
  let navigating = false;

  function text(node) {
    return String(node?.textContent || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  }

  function tg() {
    return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  }

  function openUrl(url) {
    try {
      const app = tg();
      if (/^https:\/\/t\.me\//i.test(url) && app?.openTelegramLink) {
        app.openTelegramLink(url);
        return;
      }
      if (app?.openLink) {
        app.openLink(url, { try_instant_view: false });
        return;
      }
    } catch {}
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function clickElement(el) {
    if (!el) return false;
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    return true;
  }

  function bottomNav(label) {
    const target = text({ textContent: label });
    return Array.from(document.querySelectorAll('.bottom-nav-item,button'))
      .find((button) => button.classList?.contains('bottom-nav-item') && text(button).includes(target));
  }

  function serviceRow(label) {
    const target = text({ textContent: label });
    return Array.from(document.querySelectorAll('.service-list-row,button'))
      .find((button) => button.classList?.contains('service-list-row') && text(button).includes(target));
  }

  function goCatalog() {
    if (navigating) return;
    navigating = true;
    clickElement(bottomNav('Каталог'));
    setTimeout(() => {
      if (window.SNKR_SIDE_SECTIONS?.setActiveSection) {
        window.SNKR_SIDE_SECTIONS.setActiveSection('all', { silent: true });
        window.SNKR_SIDE_SECTIONS.applySectionFilter?.(true);
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      navigating = false;
    }, 70);
  }

  function goProfileSection(sectionLabel) {
    if (navigating) return;
    navigating = true;
    clickElement(bottomNav('Профиль'));
    const tryOpen = (attempt = 0) => {
      const row = serviceRow(sectionLabel);
      if (row) {
        clickElement(row);
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        navigating = false;
        return;
      }
      if (attempt < 12) {
        setTimeout(() => tryOpen(attempt + 1), 55);
      } else {
        navigating = false;
      }
    };
    setTimeout(() => tryOpen(0), 70);
  }

  function enhanceHomeInfo() {
    document.querySelectorAll('.info-row-item').forEach((item) => {
      const t = text(item);
      let target = '';
      if (t.includes('новые дропы')) target = 'catalog';
      else if (t.includes('притыцкого') || t.includes('тивали') || t.includes('пав.')) target = 'about';
      else if (t.includes('доставка')) target = 'delivery';
      if (!target) return;
      item.classList.add('snkr-v85-home-link');
      item.dataset.snkrHomeTarget = target;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      if (target === 'catalog') item.setAttribute('aria-label', 'Открыть каталог');
      if (target === 'about') item.setAttribute('aria-label', 'Открыть раздел О магазине');
      if (target === 'delivery') item.setAttribute('aria-label', 'Открыть раздел Доставка');
    });
  }

  function socialBlock() {
    const wrap = document.createElement('section');
    wrap.className = 'snkr-v85-socials';
    wrap.setAttribute('aria-labelledby', 'snkr-v85-socials-title');
    wrap.innerHTML = `
      <div class="snkr-v85-socials-head">
        <span id="snkr-v85-socials-title">Наши соц. сети</span>
        <small>Следите за новыми дропами</small>
      </div>
      <div class="snkr-v85-socials-grid">
        ${SOCIALS.map((s) => `
          <button class="snkr-v85-social-btn snkr-v85-social-${s.id}" type="button" data-snkr-social="${s.id}" aria-label="Открыть ${s.label}">
            <span class="snkr-v85-social-icon">${s.id === 'tiktok' ? '♪' : s.id === 'instagram' ? '◎' : '✈'}</span>
            <span>${s.label}</span>
            <i aria-hidden="true">→</i>
          </button>
        `).join('')}
      </div>
    `;
    return wrap;
  }

  function patchProfileSocials() {
    const profile = document.querySelector('.profile-screen');
    if (!profile) return;
    if (profile.querySelector('.snkr-v85-socials')) return;
    const block = socialBlock();
    const serviceList = profile.querySelector('.service-list');
    const manager = profile.querySelector('.manager-row');
    if (serviceList) profile.insertBefore(block, serviceList);
    else if (manager?.nextSibling) profile.insertBefore(block, manager.nextSibling);
    else profile.appendChild(block);
  }

  function patch() {
    scheduled = false;
    enhanceHomeInfo();
    patchProfileSocials();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(patch);
  }

  document.addEventListener('click', (event) => {
    const info = event.target?.closest?.('.info-row-item[data-snkr-home-target]');
    if (info) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      const target = info.dataset.snkrHomeTarget;
      if (target === 'catalog') goCatalog();
      if (target === 'about') goProfileSection('О магазине');
      if (target === 'delivery') goProfileSection('Доставка');
      return;
    }

    const social = event.target?.closest?.('[data-snkr-social]');
    if (social) {
      event.preventDefault();
      event.stopPropagation();
      const item = SOCIALS.find((s) => s.id === social.dataset.snkrSocial);
      if (item) openUrl(item.url);
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const info = event.target?.closest?.('.info-row-item[data-snkr-home-target]');
    if (!info) return;
    event.preventDefault();
    info.click();
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.SNKR_HOME_SOCIALS_V85 = { version: VERSION, socials: SOCIALS };
})();
