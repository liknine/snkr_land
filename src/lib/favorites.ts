import type { Product } from "../data/products";

export const FAVORITES_KEY = "snkr_favorites";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getFavorites(): Product[] {
  if (!canUseStorage()) return [];
  try {
    const value = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFavorites(items: Product[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
}

export function isFavorite(productId: string | number, items: Product[]): boolean {
  return items.some((item) => String(item.id) === String(productId));
}

export function toggleFavorite(product: Product): Product[] {
  const current = getFavorites();
  const exists = isFavorite(product.id, current);
  const next = exists
    ? current.filter((item) => String(item.id) !== String(product.id))
    : [...current, product];

  saveFavorites(next);
  return next;
}
