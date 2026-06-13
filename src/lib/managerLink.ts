const MANAGER_URL = "https://t.me/Il_7in?text=%D0%B5%D1%81%D1%82%D1%8C%20%D0%B2%D0%BE%D0%BF%D1%80%D0%BE%D1%81%20%D0%BF%D0%BE%20%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7%D1%83";

export function openManagerChat() {
  const telegram = window.Telegram?.WebApp as any;
  if (telegram?.openTelegramLink) {
    telegram.openTelegramLink(MANAGER_URL);
    return;
  }
  window.open(MANAGER_URL, "_blank", "noopener,noreferrer");
}
