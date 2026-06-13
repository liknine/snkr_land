import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";
import { SearchOverlay } from "./components/SearchOverlay";
import { SideMenu } from "./components/SideMenu";
import { AboutScreen } from "./screens/AboutScreen";
import { CatalogScreen } from "./screens/CatalogScreen";
import { CheckoutScreen } from "./screens/CheckoutScreen";
import { DeliveryScreen } from "./screens/DeliveryScreen";
import { FavoritesScreen } from "./screens/FavoritesScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { OrdersScreen } from "./screens/OrdersScreen";
import { PaymentScreen } from "./screens/PaymentScreen";
import { ProductDetailScreen } from "./screens/ProductDetailScreen";
import { CartScreen } from "./screens/CartScreen";
import { CheckoutSuccessScreen } from "./screens/CheckoutSuccessScreen";
import type { Product } from "./data/products";
import { createOrder, DELIVERY_NOTE, fetchOrders, fetchProducts, hasBackendApi, saveMyOrderId, WAITING_TIME, type CartItem, type Order } from "./lib/api";
import { getFavorites, isFavorite, toggleFavorite } from "./lib/favorites";
import { getTelegramUserId, getTelegramUsername, getTelegramWebApp, sendTelegramData } from "./lib/telegram";
import { ProfileScreen } from "./screens/ProfileScreen";
import type { Screen } from "./types";


const LOCAL_ORDERS_KEY = "snkr_land_my_orders_v2";

function readLocalOrders(): Order[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalOrders(orders: Order[]) {
  try {
    window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore private mode/storage errors
  }
}

function mergeOrders(primary: Order[], secondary: Order[]) {
  const seen = new Set<string>();
  return [...primary, ...secondary].filter((order) => {
    const key = String(order.clientOrderId || order.id || order.orderNumber);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const screens: Record<Screen, string> = {
  home: "Главная",
  catalog: "Каталог",
  favorites: "Избранное",
  profile: "Профиль",
  delivery: "Доставка",
  about: "О магазине",
  orders: "Мои заказы",
  payment: "Оплата",
  product: "Товар",
  cart: "Корзина",
  checkout: "Оформление",
  checkoutSuccess: "Заказ оформлен",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItem, setCartItem] = useState<CartItem | null>(null);
  const [orders, setOrders] = useState<Order[]>(() => readLocalOrders());
  const [favorites, setFavorites] = useState<Product[]>(() => getFavorites());
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [screen]);

  useEffect(() => {
    getTelegramWebApp()?.ready?.();
    getTelegramWebApp()?.expand?.();

    let isMounted = true;

    const loadProducts = async () => {
      try {
        const nextProducts = await fetchProducts();
        if (!isMounted) return;
        setProducts(nextProducts);
        setSelectedProduct((current) => nextProducts.find((product) => product.id === current?.id) ?? nextProducts[0] ?? null);
      } catch (error) {
        console.error("Products fetch failed", error);
      }
    };

    loadProducts();
    const productsTimer = window.setInterval(loadProducts, 15000);

    const loadOrders = async () => {
      try {
        const nextOrders = await fetchOrders();
        if (isMounted) setOrders((current) => mergeOrders(nextOrders, current));
      } catch (error) {
        console.error("Orders history fetch failed", error);
      }
    };
    loadOrders();

    const refreshTimer = window.setInterval(loadOrders, 15000);
    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
      window.clearInterval(productsTimer);
    };
  }, []);

  const navigate = (nextScreen: Screen) => {
    setScreen(nextScreen);
  };

  const addToCart = (product: Product, size: string) => {
    setCartItem({ product, size, quantity: 1 });
    setScreen("cart");
  };

  useEffect(() => {
    writeLocalOrders(orders);
  }, [orders]);

  const favoriteIds = useMemo(() => new Set(favorites.map((product) => String(product.id))), [favorites]);

  const handleToggleFavorite = (product: Product) => {
    setFavorites(toggleFavorite(product));
  };

  const handleCheckoutSubmit = async (payload: {
    phone: string;
    address: string;
    comment?: string;
  }) => {
    if (!cartItem) return;

    setIsSubmittingOrder(true);
    try {
      const clientOrderId = `snkr-${Date.now()}`;
      const orderPayload = {
        type: "order",
        source: "snkr_land_webapp",
        client_order_id: clientOrderId,
        product_id: cartItem.product.id,
        product_name: cartItem.product.name,
        brand: cartItem.product.brand,
        size: cartItem.size,
        quantity: cartItem.quantity,
        price_byn: cartItem.product.price,
        total: cartItem.product.price * cartItem.quantity,
        delivery: "Курьер",
        delivery_method: "Курьер",
        delivery_note: DELIVERY_NOTE,
        waiting_time: WAITING_TIME,
        phone: payload.phone,
        address: payload.address,
        customer: {
          phone: payload.phone,
          address: payload.address,
        },
        comment: payload.comment,
        username: getTelegramUsername(),
        telegram_id: getTelegramUserId(),
        product: {
          id: cartItem.product.id,
          brand: cartItem.product.brand,
          name: cartItem.product.name,
          color: cartItem.product.color,
          price: cartItem.product.price,
          image: cartItem.product.images[0] ?? "",
          images: cartItem.product.images,
          sizes: cartItem.product.sizes,
        },
      };

      saveMyOrderId(clientOrderId);

      const localOrder: Order = {
        id: clientOrderId,
        orderNumber: Date.now() % 100000,
        clientOrderId,
        telegramId: String(getTelegramUserId() ?? ""),
        productId: cartItem.product.id,
        productSnapshot: cartItem.product,
        size: cartItem.size,
        quantity: cartItem.quantity,
        totalPrice: cartItem.product.price * cartItem.quantity,
        username: getTelegramUsername(),
        phone: payload.phone,
        deliveryType: "delivery",
        address: payload.address,
        comment: payload.comment,
        status: "new",
        createdAt: new Date().toISOString(),
      };

      setOrders((current) => mergeOrders([localOrder], current));
      writeLocalOrders(mergeOrders([localOrder], readLocalOrders()));

      let completed = false;
      try {
        const backendOrder = await createOrder(orderPayload);
        if (backendOrder) {
          setOrders((current) => mergeOrders([backendOrder], current));
          completed = true;
        }
      } catch (error) {
        console.error("Backend order create failed, trying Telegram sendData", error);
      }

      if (!completed) {
        const sendResult = sendTelegramData(orderPayload);
        if (!sendResult.ok) {
          if (sendResult.reason === "no_webapp" || sendResult.reason === "no_sendData") {
            getTelegramWebApp()?.showAlert?.("Откройте магазин внутри Telegram, чтобы отправить заявку.");
            throw new Error("telegram_webapp_unavailable");
          }
          console.error("Telegram.WebApp.sendData failed", sendResult.error);
          throw new Error("telegram_send_failed");
        }
      }

      setCartItem(null);
      setScreen("checkoutSuccess");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="app-canvas">
      <div className="mini-app" aria-label={`Sneakers Land BY: ${screens[screen]}`}>
        <AppHeader onMenuClick={() => setMenuOpen(true)} onSearchClick={() => setSearchOpen(true)} />
        <main className="screen-slot" key={screen}>
          {screen === "home" && <HomeScreen onCatalogClick={() => setScreen("catalog")} />}
          {screen === "catalog" && <CatalogScreen products={products} favoriteIds={favoriteIds} searchQuery={catalogSearchQuery} onClearSearch={() => setCatalogSearchQuery("")} onOpenProduct={(product) => { setSelectedProduct(product); setScreen("product"); }} onToggleFavorite={handleToggleFavorite} />}
          {screen === "favorites" && <FavoritesScreen favorites={favorites} onCatalog={() => setScreen("catalog")} onOpenProduct={(product) => { setSelectedProduct(product); setScreen("product"); }} onToggleFavorite={handleToggleFavorite} />}
          {screen === "profile" && <ProfileScreen latestOrder={orders[0]} onNavigate={setScreen} />}
          {screen === "delivery" && <DeliveryScreen onBack={() => setScreen("profile")} />}
          {screen === "payment" && <PaymentScreen onBack={() => setScreen("profile")} />}
          {screen === "about" && <AboutScreen onBack={() => setScreen("profile")} />}
          {screen === "orders" && <OrdersScreen orders={orders} onBack={() => setScreen("profile")} onCatalog={() => setScreen("catalog")} onManager={() => setScreen("about")} />}
          {screen === "product" && selectedProduct && <ProductDetailScreen product={selectedProduct} isFavorite={isFavorite(selectedProduct.id, favorites)} onBack={() => setScreen("catalog")} onCart={(size) => addToCart(selectedProduct, size)} onToggleFavorite={handleToggleFavorite} />}
          {screen === "cart" && (
            <CartScreen
              item={cartItem}
              onBack={() => setScreen("product")}
              onCatalog={() => setScreen("catalog")}
              onQuantityChange={(quantity) => setCartItem((current) => current ? { ...current, quantity } : current)}
              onRemove={() => setCartItem(null)}
              onCheckout={() => setScreen("checkout")}
            />
          )}
          {screen === "checkout" && (
            <CheckoutScreen
              item={cartItem}
              isSubmitting={isSubmittingOrder}
              onBack={() => setScreen("cart")}
              onCatalog={() => setScreen("catalog")}
              onSubmit={handleCheckoutSubmit}
            />
          )}
          {screen === "checkoutSuccess" && <CheckoutSuccessScreen onOrders={() => setScreen("orders")} onCatalog={() => setScreen("catalog")} />}
        </main>
        <BottomNav activeScreen={screen} onNavigate={navigate} />
        <SideMenu isOpen={menuOpen} activeScreen={screen} onClose={() => setMenuOpen(false)} onNavigate={navigate} />
        <SearchOverlay isOpen={searchOpen} products={products} onClose={() => setSearchOpen(false)} onCatalog={() => { setCatalogSearchQuery(""); setSearchOpen(false); setScreen("catalog"); }} onCatalogSearch={(query) => { setCatalogSearchQuery(query); setSearchOpen(false); setScreen("catalog"); }} onOpenProduct={(product) => { setSelectedProduct(product); setSearchOpen(false); setScreen("product"); }} />
      </div>
    </div>
  );
}
