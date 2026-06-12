export type TelegramUser = {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  ready?: () => void;
  expand?: () => void;
  sendData?: (data: string) => void;
  showAlert?: (message: string) => void;
};

export type SendTelegramDataResult =
  | { ok: true }
  | { ok: false; reason: "no_webapp" | "no_sendData" | "send_error"; error?: unknown };

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const mockUser: TelegramUser = {
  username: "dev_user",
  first_name: "Dev",
  last_name: "User",
};

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function isTelegramEnvironment(): boolean {
  return Boolean(getTelegramWebApp()?.initData);
}

export function getTelegramUser(): TelegramUser {
  return getTelegramWebApp()?.initDataUnsafe?.user ?? mockUser;
}

export function getTelegramInitData(): string {
  return getTelegramWebApp()?.initData ?? "";
}

export function getTelegramUsername(): string {
  const username = getTelegramUser().username?.trim();
  return username ? `@${username.replace(/^@/, "")}` : "@dev_user";
}

export function sendTelegramData(payload: unknown): SendTelegramDataResult {
  const tg = window.Telegram?.WebApp;
  if (!tg) return { ok: false, reason: "no_webapp" };
  if (typeof tg.sendData !== "function") return { ok: false, reason: "no_sendData" };

  try {
    tg.ready?.();
    tg.expand?.();
    tg.sendData(JSON.stringify(payload));
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "send_error", error };
  }
}
