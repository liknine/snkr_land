(() => {
  const VERSION = 'v103';
  const MANAGER_URL = 'https://t.me/Il_7in';
  let scheduled = false;
  let navigating = false;

  const ICONS = {
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5.2-3.2 8.8-7 10-3.8-1.2-7-4.8-7-10V6l7-3Z"/><path d="m9.2 12.2 1.9 1.9 3.8-4.2"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    rotate: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0 2 5.3"/><path d="M20 4v7h-7"/></svg>',
    defect: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.8 2.9 16.3A2 2 0 0 0 4.6 19h14.8a2 2 0 0 0 1.7-2.7L13.7 3.8a2 2 0 0 0-3.4 0Z"/></svg>',
    truck: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h8v12Z"/><path d="M10 9h5l3 3v5h-8"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/></svg>',
    manager: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"/></svg>'
  };

  function norm(value) {
    return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  }

  function tg() {
    return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  }

  function openManager() {
    try {
      const app = tg();
      if (/^https:\/\/t\.me\//i.test(MANAGER_URL) && app?.openTelegramLink) {
        app.openTelegramLink(MANAGER_URL);
        return;
      }
      if (app?.openLink) {
        app.openLink(MANAGER_URL, { try_instant_view: false });
        return;
      }
    } catch {}
    window.open(MANAGER_URL, '_blank', 'noopener,noreferrer');
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

  function serviceListRows() {
    return Array.from(document.querySelectorAll('.profile-screen .service-list .service-list-row'));
  }

  function closeGuaranteeScreen() {
    const screen = document.querySelector('.snkr-v103-guarantee-screen');
    if (screen) screen.remove();
    document.querySelectorAll('.snkr-v103-hidden-screen').forEach((el) => {
      el.classList.remove('snkr-v103-hidden-screen');
      el.removeAttribute('aria-hidden');
    });
    document.body.classList.remove('snkr-v103-guarantee-open');
  }

  function ensureGuaranteeProfileTab() {
    const profile = document.querySelector('.profile-screen');
    const list = profile?.querySelector('.service-list');
    if (!list) return;
    if (list.querySelector('[data-snkr-open-guarantee="true"]')) return;

    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'service-list-row snkr-v103-guarantee-tab';
    row.dataset.snkrOpenGuarantee = 'true';
    row.setAttribute('aria-label', 'Открыть вкладку Гарантия');
    row.innerHTML = `${ICONS.shield}<span>Гарантия</span>${ICONS.arrow}`;

    const rows = serviceListRows();
    const aboutRow = rows.find((button) => norm(button.textContent).includes('о магазине'));
    if (aboutRow) aboutRow.insertAdjacentElement('beforebegin', row);
    else list.appendChild(row);
  }

  function makeGuaranteeScreen() {
    const section = document.createElement('section');
    section.className = 'screen detail-screen snkr-v103-guarantee-screen';
    section.setAttribute('aria-labelledby', 'snkr-v103-guarantee-title');
    section.innerHTML = `
      <button class="back-row snkr-v103-guarantee-back" type="button" aria-label="Назад в профиль">
        ${ICONS.back}<span>Назад</span>
      </button>
      <p class="detail-kicker">SERVICE</p>
      <h1 class="detail-title snkr-v103-guarantee-title" id="snkr-v103-guarantee-title">Гарантия</h1>

      <div class="detail-card big-detail-card detail-card-row snkr-v103-guarantee-hero">
        <span class="snkr-v103-icon-wrap">${ICONS.shield}</span>
        <div>
          <h2>Гарантия 30 дней</h2>
          <p>В случае брака действует гарантия 30 дней. Если выявлен производственный дефект, свяжитесь с менеджером — поможем оформить обмен или решение по заказу.</p>
        </div>
      </div>

      <div class="detail-card snkr-v103-copy-card">
        <h3>Возврат и обмен</h3>
        <p>Вы можете вернуть или обменять приобретённую обувь в течение <strong>14 дней</strong> (не считая дня покупки), если она не подошла по размеру, фасону, модели, полноте или цвету.</p>
        <p>Обмен возможен на аналогичную или любую другую модель.</p>
        <p>Возврат и обмен осуществляется в соответствии с <strong>Законом Республики Беларусь «О защите прав потребителей», глава 3, ст. 28.</strong></p>
      </div>

      <div class="detail-grid snkr-v103-guarantee-grid">
        <div class="detail-card detail-card-column snkr-v103-mini-card">
          <span class="snkr-v103-icon-wrap is-small">${ICONS.rotate}</span>
          <h3>14 дней</h3>
          <p>На возврат или обмен пары, если товар не подошёл по параметрам.</p>
        </div>
        <div class="detail-card detail-card-column snkr-v103-mini-card">
          <span class="snkr-v103-icon-wrap is-small">${ICONS.defect}</span>
          <h3>30 дней</h3>
          <p>Гарантия в случае брака или производственного дефекта.</p>
        </div>
      </div>

      <div class="detail-card pickup-card detail-card-row snkr-v103-note-card">
        <span class="snkr-v103-icon-wrap is-row">${ICONS.truck}</span>
        <div>
          <h3>Важно</h3>
          <p>Если нужен возврат, обмен или решение по гарантийному случаю, напишите менеджеру и приложите номер заказа, фото и краткое описание ситуации.</p>
        </div>
      </div>

      <button class="detail-action snkr-v103-manager-action" type="button">
        ${ICONS.manager}<span>Связаться с менеджером</span>
      </button>
    `;
    return section;
  }

  function openGuaranteeScreen() {
    const slot = document.querySelector('.screen-slot');
    if (!slot) return;
    closeGuaranteeScreen();
    Array.from(slot.children).forEach((child) => {
      if (child.nodeType === 1) {
        child.classList.add('snkr-v103-hidden-screen');
        child.setAttribute('aria-hidden', 'true');
      }
    });
    slot.appendChild(makeGuaranteeScreen());
    document.body.classList.add('snkr-v103-guarantee-open');
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  function patchPaymentScreen() {
    const title = document.querySelector('#payment-title');
    const screen = title ? title.closest('.detail-screen') : null;
    if (!screen) return;
    const bigCard = screen.querySelector('.big-detail-card');
    if (!bigCard) return;
    const h2 = bigCard.querySelector('h2');
    const p = bigCard.querySelector('p');
    if (h2) h2.textContent = 'Курьерская доставка';
    if (p) p.textContent = 'Доставляем только курьерской службой. Детали доставки уточняются после оформления заказа.';
  }

  function patch() {
    scheduled = false;
    ensureGuaranteeProfileTab();
    patchPaymentScreen();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(patch);
  }

  document.addEventListener('click', (event) => {
    const tab = event.target?.closest?.('[data-snkr-open-guarantee="true"]');
    if (tab) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      openGuaranteeScreen();
      return;
    }

    const back = event.target?.closest?.('.snkr-v103-guarantee-back');
    if (back) {
      event.preventDefault();
      event.stopPropagation();
      closeGuaranteeScreen();
      return;
    }

    const manager = event.target?.closest?.('.snkr-v103-manager-action');
    if (manager) {
      event.preventDefault();
      event.stopPropagation();
      openManager();
      return;
    }

    if (event.target?.closest?.('.bottom-nav-item,.side-menu-row,.side-menu-info-button,.header-menu,.header-search,.service-list-row')) {
      const isOwnTab = !!event.target?.closest?.('[data-snkr-open-guarantee="true"]');
      if (!isOwnTab) closeGuaranteeScreen();
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const row = event.target?.closest?.('[data-snkr-open-guarantee="true"]');
    if (!row) return;
    event.preventDefault();
    row.click();
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });

  window.SNKR_GUARANTEE_V103 = { version: VERSION, openGuaranteeScreen, closeGuaranteeScreen, patchPaymentScreen };
})();
