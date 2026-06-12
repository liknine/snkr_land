import { fallbackProducts, type Product } from "../data/products";

export type DeliveryType = "delivery" | "pickup";
export type OrderStatus = "new" | "accepted" | "in_transit" | "ready" | "completed" | "canceled";

export type Order = {
  id: string;
  orderNumber: number;
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
  accepted: "Принят",
  in_transit: "В пути",
  ready: "Готов к выдаче",
  completed: "Завершён",
  canceled: "Отменён",
};

export const DELIVERY_NOTE = "Доставка осуществляется в любой день недели, кроме понедельника.";
export const WAITING_TIME = "1–3 дня";

export async function fetchProducts(): Promise<Product[]> {
  try {
    const productsUrl = `${import.meta.env.BASE_URL}data/products.json`;
    const response = await fetch(productsUrl, { cache: "no-store" });
    if (response.ok) {
      const products = (await response.json()) as Product[];
      return products.filter((product) => product.isActive !== false);
    }
  } catch {
    // GitHub Pages can still render an empty catalog if the JSON is absent.
  }
  return fallbackProducts;
}
