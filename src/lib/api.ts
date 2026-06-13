import type { Product } from "../data/products";
import { getTelegramInitData, getTelegramUserId, getTelegramUsername } from "./telegram";

export type DeliveryType = "delivery" | "pickup";
export type OrderStatus = "new" | "processing" | "accepted" | "in_transit" | "ready" | "completed" | "canceled";

export type Order = {
  id: string;
  orderNumber: number;
  clientOrderId?: string;
  telegramId?: string;
  productId: string;
  productSnapshot: Product;
  size: string;
  quantity: number;
  totalPrice: number;
  username?: string;
  phone: string;
  city?: string;
  deliveryType: DeliveryType;
  address?: string;
  comment?: string;
  status: OrderStatus;
  createdAt: string;
};

export type CartItem = {
  product: Product;
  size: string;
  quantity: number;
};

export type CheckoutPayload = {
  cartItem: CartItem;
  phone: string;
  address: string;
  comment?: string;
};

export const statusLabels: Record<OrderStatus, string> = {
  new: "Новый",
  processing: "В обработке",
  accepted: "Принят",
  in_transit: "В пути",
  ready: "Готов к выдаче",
  completed: "Завершён",
  canceled: "Отменён",
};

export const DELIVERY_NOTE = "Доставка осуществляется в любой день недели, кроме понедельника.";
export const WAITING_TIME = "1–3 дня";

declare global {
  interface Window {
    SNKR_API_BASE?: string;
  }
}

const API_BASE = String(window.SNKR_API_BASE || import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

type ApiOrderResponse = {
  order?: Order;
};

type ApiOrdersResponse = {
  orders?: Order[];
};

function normalizeUsername(username: string) {
  return username.trim().replace(/^@/, "");
}

function apiHeaders() {
  const headers = new Headers({ "Content-Type": "application/json" });
  const initData = getTelegramInitData();
  if (initData) headers.set("X-Telegram-Init-Data", initData);
  return headers;
}

function normalizeProductSnapshot(product: Partial<Product> | undefined, order: Partial<Order>): Product {
  return {
    id: String(product?.id ?? order.productId ?? order.id ?? ""),
    brand: String(product?.brand ?? ""),
    name: String(product?.name ?? "Товар"),
    color: product?.color ?? "",
    price: Number(product?.price ?? order.totalPrice ?? 0),
    sizes: Array.isArray(product?.sizes) ? product.sizes : [],
    description: product?.description ?? "",
    images: Array.isArray(product?.images) ? product.images : [],
    isFavorite: Boolean(product?.isFavorite),
    isActive: product?.isActive !== false,
    createdAt: String(product?.createdAt ?? order.createdAt ?? ""),
  };
}

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    id: String(order.id),
    orderNumber: Number(order.orderNumber || order.id || 0),
    clientOrderId: String((order as any).clientOrderId ?? (order as any).client_order_id ?? ""),
    telegramId: String((order as any).telegramId ?? (order as any).telegram_id ?? ""),
    productId: String(order.productId || order.productSnapshot?.id || ""),
    productSnapshot: normalizeProductSnapshot(order.productSnapshot, order),
    size: String(order.size || ""),
    quantity: Number(order.quantity || 1),
    totalPrice: Number(order.totalPrice || 0),
    phone: String(order.phone || ""),
    deliveryType: order.deliveryType || "delivery",
    address: order.address || "",
    comment: order.comment || "",
    status: order.status || "new",
    createdAt: order.createdAt || new Date().toISOString(),
  };
}

export function hasBackendApi() {
  return Boolean(API_BASE);
}

export async function fetchProducts(): Promise<Product[]> {
  if (API_BASE) {
    try {
      const response = await fetch(`${API_BASE}/api/products`, { headers: apiHeaders(), cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { products?: Product[] };
        const products = data.products ?? [];
        return products.filter((product) => product.isActive !== false);
      }
    } catch (error) {
      console.error("Products API fetch failed", error);
    }
  }

  try {
    const productsUrl = `${import.meta.env.BASE_URL}data/products.json?v=${Date.now()}`;
    const response = await fetch(productsUrl, { cache: "no-store" });
    if (response.ok) {
      const products = (await response.json()) as Product[];
      return products.filter((product) => product.isActive !== false);
    }
  } catch {
    // GitHub Pages can still render an empty catalog if the JSON is absent.
  }
  return [];
}

function normalizeOrderTelegramId(order: any) {
  return String(order.telegramId ?? order.telegram_id ?? order.telegram_user_id ?? order.user_id ?? "").trim();
}

function normalizeOrderUsername(order: any) {
  return normalizeUsername(String(order.username ?? order.customer?.username ?? ""));
}

function normalizeOrderClientId(order: any) {
  return String(order.clientOrderId ?? order.client_order_id ?? "").trim();
}

export function isOrderOwner(order: any, localClientOrderIdsInput: string[] = []) {
  const telegramId = getTelegramUserId() ?? null;
  const username = normalizeUsername(getTelegramUsername());
  const localClientOrderIds = new Set(localClientOrderIdsInput.filter(Boolean).map(String));

  const orderTelegramId = normalizeOrderTelegramId(order);
  const orderUsername = normalizeOrderUsername(order);
  const orderClientOrderId = normalizeOrderClientId(order);

  // Never show every order as a fallback. If identity is unknown, only show orders
  // created on this device/session via client_order_id.
  if (telegramId && orderTelegramId && orderTelegramId === String(telegramId)) return true;
  if (username && username !== "dev_user" && orderUsername && orderUsername === username) return true;
  if (orderClientOrderId && localClientOrderIds.has(orderClientOrderId)) return true;
  return false;
}

async function fetchJsonList(url: string): Promise<any[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];
  const data = await response.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.orders)) return data.orders;
  return [];
}

export async function fetchOrders(localClientOrderIdsInput: string[] = []): Promise<Order[]> {
  const params = new URLSearchParams();
  const telegramId = getTelegramUserId() ?? null;
  const username = normalizeUsername(getTelegramUsername());

  if (telegramId) params.set("telegram_id", String(telegramId));
  if (username && username !== "dev_user") params.set("username", username);

  if (API_BASE && params.size) {
    const response = await fetch(`${API_BASE}/api/orders?${params.toString()}`, {
      headers: apiHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`orders_fetch_failed_${response.status}`);
    }

    const data = (await response.json()) as ApiOrdersResponse;
    return (data.orders ?? []).filter((order: any) => isOrderOwner(order, localClientOrderIdsInput)).map(normalizeOrder);
  }

  try {
    const base = import.meta.env.BASE_URL;
    const urls: string[] = [];

    // Preferred: per-user public snapshot generated by the bot. This prevents the UI
    // from ever loading the global orders list when Telegram provides a user id.
    if (telegramId) urls.push(`${base}data/orders/users/${telegramId}.json?v=${Date.now()}`);

    // Fallback for already-created local session orders. This still strictly filters
    // by telegram id / username / client_order_id and never returns all orders.
    urls.push(`${base}data/orders.json?v=${Date.now()}`);

    const merged: Order[] = [];
    const seen = new Set<string>();
    for (const url of urls) {
      const list = await fetchJsonList(url);
      for (const rawOrder of list) {
        if (!isOrderOwner(rawOrder, localClientOrderIdsInput)) continue;
        const order = normalizeOrder(rawOrder as Order);
        const key = String(order.clientOrderId || order.id || order.orderNumber);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(order);
        }
      }
    }
    return merged;
  } catch (error) {
    console.error("Static orders fetch failed", error);
    return [];
  }
}

export async function createOrder(payload: Record<string, unknown>): Promise<Order | null> {
  if (!API_BASE) return null;

  const response = await fetch(`${API_BASE}/api/orders`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`order_create_failed_${response.status}`);
  }

  const data = (await response.json()) as ApiOrderResponse;
  if (!data.order) {
    throw new Error("order_create_empty_response");
  }

  return normalizeOrder(data.order);
}
