const MANAGER_USERNAME = "Il_7in";
const MANAGER_TEXT = "есть вопрос по заказу";

export function getManagerUrl(): string {
  return `https://t.me/${MANAGER_USERNAME}?text=${encodeURIComponent(MANAGER_TEXT)}`;
}

export function openManagerChat(): void {
  const url = getManagerUrl();
  const tg = window.Telegram?.WebApp;

  if (tg && typeof (tg as any).openTelegramLink === "function") {
    (tg as any).openTelegramLink(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
