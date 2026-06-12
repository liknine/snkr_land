import type { Product } from "../data/products";

export function formatPrice(price: number | string): string {
  const value = typeof price === "number" ? price : Number(String(price).replace(/[^\d]/g, ""));
  if (!Number.isFinite(value) || value <= 0) {
    return "0 BYN";
  }
  return `${Math.round(value).toLocaleString("ru-RU").replace(/\u00a0/g, " ")} BYN`;
}

export function productImage(product: Pick<Product, "images">): string {
  return product.images[0] || "./images/products/placeholder.svg";
}

export function productTitle(product: Pick<Product, "brand" | "name" | "color">): string {
  return [product.brand, product.name, product.color].filter(Boolean).join(" ");
}
