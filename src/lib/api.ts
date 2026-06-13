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

const MY_ORDER_IDS_KEY = "snkr_land_my_order_ids_v2";

export function getMyOrderIds(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(MY_ORDER_IDS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function saveMyOrderId(clientOrderId?: string) {
  if (!clientOrderId) return;
  try {
    const ids = new Set(getMyOrderIds());
    ids.add(String(clientOrderId));
    window.localStorage.setItem(MY_ORDER_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore storage errors
  }
}

function sameIdentity(order: any, telegramId: number | null, username: string) {
  const orderTelegramId = String(order.telegramId ?? order.telegram_id ?? order.telegram_user_id ?? order.user_id ?? "").trim();
  const orderUsername = normalizeUsername(String(order.username ?? order.customer?.username ?? "")).toLowerCase();
  const orderClientId = String(order.clientOrderId ?? order.client_order_id ?? "").trim();
  const normalizedUsername = normalizeUsername(username || "").toLowerCase();
  const myOrderIds = new Set(getMyOrderIds());

  if (telegramId && orderTelegramId && orderTelegramId === String(telegramId)) return true;
  if (normalizedUsername && normalizedUsername !== "dev_user" && orderUsername && orderUsername === normalizedUsername) return true;
  if (orderClientId && myOrderIds.has(orderClientId)) return true;

  return false;
}

export async function fetchOrders(): Promise<Order[]> {
  const params = new URLSearchParams();
  const telegramId = getTelegramUserId() ?? null;
  const username = normalizeUsername(getTelegramUsername());

  if (telegramId) params.set("telegram_id", String(telegramId));
  if (username) params.set("username", username);

  if (API_BASE && params.size) {
    const response = await fetch(`${API_BASE}/api/orders?${params.toString()}`, {
      headers: apiHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`orders_fetch_failed_${response.status}`);
    }

    const data = (await response.json()) as ApiOrdersResponse;
    return (data.orders ?? []).map(normalizeOrder);
  }

  // Static GitHub Pages mode: the bot publishes docs/data/orders.json after every order/status update.
  // This makes "Мои заказы" persistent even without a public backend URL.
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/orders.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.orders ?? []);
    return list.filter((order: any) => sameIdentity(order, telegramId, username)).map(normalizeOrder);
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
