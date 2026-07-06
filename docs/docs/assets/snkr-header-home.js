(() => {
  const VERSION = 'v99';
  function norm(value) {
    return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  }
  function homeButton() {
    return Array.from(document.querySelectorAll('.bottom-nav-item'))
      .find((button) => norm(button.textContent).includes('главная'));
  }
  function closeSideMenu() {
    const close = document.querySelector('.side-menu-close');
    if (close) close.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }
  function goHome() {
    closeSideMenu();
    const button = homeButton();
    if (button) button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 40);
  }
  function markHeader() {
    document.querySelectorAll('.app-header .brand-lockup, .app-header .brand-logo, .app-header .brand-title-text').forEach((el) => {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', 'Перейти на главную');
      el.dataset.snkrHeaderHome = 'true';
    });
  }
  document.addEventListener('click', (event) => {
    const target = event.target?.closest?.('[data-snkr-header-home="true"], .app-header .brand-lockup, .app-header .brand-logo, .app-header .brand-title-text');
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    goHome();
  }, true);
  document.addEventListener('keydown', (event) => {
    const target = event.target?.closest?.('[data-snkr-header-home="true"]');
    if (!target || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    goHome();
  });
  const observer = new MutationObserver(() => markHeader());
  document.addEventListener('DOMContentLoaded', () => {
    markHeader();
    observer.observe(document.body, { childList: true, subtree: true });
  });
  window.SNKR_HEADER_HOME = { version: VERSION, goHome };
})();
