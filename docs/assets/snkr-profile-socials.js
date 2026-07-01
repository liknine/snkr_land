(() => {
  const VERSION = 'v87';
  const SOCIALS = [
    { id: 'tiktok', label: 'TikTok', note: 'Видео, дропы и быстрые обзоры', url: 'https://www.tiktok.com/@sneakers_land_by?_r=1&_t=ZS-97bjM5lZDq3', icon: 'play' },
    { id: 'instagram', label: 'Instagram', note: 'Фото, сторис и новые поступления', url: 'https://www.instagram.com/sneakers_land.by?igsh=MTBvbnRxbm90MXVrbw==', icon: 'camera' },
    { id: 'telegram', label: 'Telegram', note: 'Канал магазина и актуальные товары', url: 'https://t.me/Sneakers_land_BY', icon: 'send' },
  ];

  let scheduled = false;
  let navigating = false;

  const ICONS = {
    socials: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.7"/><circle cx="6" cy="12" r="2.7"/><circle cx="18" cy="19" r="2.7"/><path d="M8.4 10.7 15.6 6.3"/><path d="M8.4 13.3 15.6 17.7"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 8.5v7l6-3.5-6-3.5Z"/><path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Z"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.8h.01"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m21 3-7.5 18-4.3-8.2L1 8.5 21 3Z"/><path d="M9.2 12.8 21 3"/></svg>',
  };

  function norm(value) {
    return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
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
    const target = norm(label);
    return Array.from(document.querySelectorAll('.bottom-nav-item'))
      .find((button) => norm(button.textContent).includes(target));
  }

  function serviceRow(label) {
    const target = norm(label);
    return Array.from(document.querySelectorAll('.service-list-row'))
      .find((button) => norm(button.textContent).includes(target));
  }

  function closeSocialScreen() {
    const screen = document.querySelector('.snkr-v87-social-screen');
    if (screen) screen.remove();
    document.querySelectorAll('.snkr-v87-hidden-screen').forEach((el) => {
      el.classList.remove('snkr-v87-hidden-screen');
      el.removeAttribute('aria-hidden');
    });
    document.body.classList.remove('snkr-v87-social-open');
  }

  function goCatalog() {
    if (navigating) return;
    navigating = true;
    closeSocialScreen();
    clickElement(bottomNav('Каталог'));
    setTimeout(() => {
      if (window.SNKR_SIDE_SECTIONS?.setActiveSection) {
        window.SNKR_SIDE_SECTIONS.setActiveSection('all', { silent: true });
        window.SNKR_SIDE_SECTIONS.applySectionFilter?.(true);
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      navigating = false;
    }, 80);
  }

  function goProfileSection(sectionLabel) {
    if (navigating) return;
    navigating = true;
    closeSocialScreen();
    clickElement(bottomNav('Профиль'));
    const tryOpen = (attempt = 0) => {
      const row = serviceRow(sectionLabel);
      if (row) {
        clickElement(row);
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        navigating = false;
        return;
      }
      if (attempt < 14) setTimeout(() => tryOpen(attempt + 1), 55);
      else navigating = false;
    };
    setTimeout(() => tryOpen(0), 80);
  }

  function enhanceHomeInfo() {
    document.querySelectorAll('.info-row-item').forEach((item) => {
      const t = norm(item.textContent);
      let target = '';
      if (t.includes('новые дропы')) target = 'catalog';
      else if (t.includes('притыцкого') || t.includes('тивали') || t.includes('пав.')) target = 'about';
      else if (t.includes('доставка')) target = 'delivery';
      if (!target) return;
      item.dataset.snkrHomeTarget = target;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      if (target === 'catalog') item.setAttribute('aria-label', 'Открыть каталог');
      if (target === 'about') item.setAttribute('aria-label', 'Открыть раздел О магазине');
      if (target === 'delivery') item.setAttribute('aria-label', 'Открыть раздел Доставка');
    });
  }

  function ensureSocialProfileTab() {
    const profile = document.querySelector('.profile-screen');
    const list = profile?.querySelector('.service-list');
    if (!list) return;

    // remove old v85 inline block if it was left in cached DOM
    profile.querySelectorAll('.snkr-v85-socials,.snkr-v86-social-tab').forEach((el) => el.remove());

    if (list.querySelector('[data-snkr-open-socials="true"]')) return;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'service-list-row snkr-v87-social-tab';
    row.dataset.snkrOpenSocials = 'true';
    row.setAttribute('aria-label', 'Открыть вкладку Наши соц. сети');
    row.innerHTML = `${ICONS.socials}<span>Наши соц. сети</span>${ICONS.arrow}`;
    list.appendChild(row);
  }

  function makeSocialScreen() {
    const section = document.createElement('section');
    section.className = 'screen detail-screen snkr-v87-social-screen';
    section.setAttribute('aria-labelledby', 'snkr-v87-social-title');
    section.innerHTML = `
      <button class="back-row snkr-v87-social-back" type="button" aria-label="Назад в профиль">
        ${ICONS.back}<span>Назад</span>
      </button>
      <p class="detail-kicker">SNKR LAND</p>
      <h1 class="detail-title snkr-v87-social-title" id="snkr-v87-social-title">Наши соц. сети</h1>
      <div class="about-hero-card snkr-v87-social-hero">
        <img src="/snkr_land/assets/logo-snkr-circle-v7.png" alt="" />
        <div>
          <h2>Sneakers Land BY</h2>
          <p>Подписывайтесь, чтобы первыми видеть новые дропы, наличие и обновления магазина.</p>
        </div>
      </div>
      <div class="snkr-v87-social-list" aria-label="Социальные сети Sneakers Land">
        ${SOCIALS.map((item) => `
          <button class="detail-card detail-card-row snkr-v87-social-link snkr-v87-social-link-${item.id}" type="button" data-snkr-social="${item.id}" aria-label="Открыть ${item.label}">
            <span class="snkr-v87-social-link-icon">${ICONS[item.icon]}</span>
            <span class="snkr-v87-social-link-copy">
              <strong>${item.label}</strong>
              <small>${item.note}</small>
            </span>
            <span class="snkr-v87-social-link-arrow">${ICONS.arrow}</span>
          </button>
        `).join('')}
      </div>
    `;
    return section;
  }

  function openSocialScreen() {
    const slot = document.querySelector('.screen-slot');
    if (!slot) return;
    closeSocialScreen();
    Array.from(slot.children).forEach((child) => {
      if (child.nodeType === 1) {
        child.classList.add('snkr-v87-hidden-screen');
        child.setAttribute('aria-hidden', 'true');
      }
    });
    slot.appendChild(makeSocialScreen());
    document.body.classList.add('snkr-v87-social-open');
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  function patch() {
    scheduled = false;
    enhanceHomeInfo();
    ensureSocialProfileTab();
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

    const profileTab = event.target?.closest?.('[data-snkr-open-socials="true"]');
    if (profileTab) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      openSocialScreen();
      return;
    }

    const back = event.target?.closest?.('.snkr-v87-social-back');
    if (back) {
      event.preventDefault();
      event.stopPropagation();
      closeSocialScreen();
      return;
    }

    const social = event.target?.closest?.('[data-snkr-social]');
    if (social) {
      event.preventDefault();
      event.stopPropagation();
      const item = SOCIALS.find((s) => s.id === social.dataset.snkrSocial);
      if (item) openUrl(item.url);
      return;
    }

    if (event.target?.closest?.('.bottom-nav-item,.side-menu-row,.side-menu-info-button,.header-menu,.header-search')) {
      closeSocialScreen();
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const info = event.target?.closest?.('.info-row-item[data-snkr-home-target]');
    const row = event.target?.closest?.('[data-snkr-open-socials="true"]');
    if (!info && !row) return;
    event.preventDefault();
    (info || row).click();
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });

  window.SNKR_PROFILE_SOCIALS_V87 = { version: VERSION, socials: SOCIALS, openSocialScreen, closeSocialScreen };
})();
