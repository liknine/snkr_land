import { ArrowLeft, CalendarDays, Check, ChevronRight, Clock3, MapPin, MessageCircle, Package, RefreshCcw, Ruler, Tag, Truck, X } from "lucide-react";
import { useState } from "react";
import type { Order, OrderStatus } from "../lib/api";
import { statusLabels } from "../lib/api";
import { formatPrice, productImage } from "../lib/productUtils";

type OrdersScreenProps = {
  orders: Order[];
  onBack: () => void;
  onCatalog?: () => void;
  onManager?: () => void;
};

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function statusTone(status: OrderStatus): "orange" | "green" {
  return status === "ready" || status === "completed" ? "green" : "orange";
}

export function OrdersScreen({ orders, onBack, onCatalog, onManager }: OrdersScreenProps) {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  return (
    <section className="screen orders-screen" aria-labelledby="orders-page-title">
      <button className="back-row" type="button" onClick={onBack}>
        <ArrowLeft size={22} strokeWidth={1.55} aria-hidden="true" />
        <span>Назад</span>
      </button>

      <p className="detail-kicker">SERVICE</p>
      <h1 className="detail-title" id="orders-page-title">Мои заказы</h1>

      {orders.length === 0 ? (
        <div className="favorites-empty final-empty-state orders-empty-state">
          <Package size={34} strokeWidth={1.45} aria-hidden="true" />
          <h2>Заказов пока нет</h2>
          <p>После оформления покупки она появится здесь.</p>
          <button className="empty-state-button" type="button" onClick={onCatalog}>
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
          <article className="order-card-full" key={order.id}>
            <div className="order-card-main">
              <div className="order-card-image">
                <img src={productImage(order.productSnapshot)} alt={order.productSnapshot.name} />
              </div>
              <div className="order-card-info">
                <h2>{order.productSnapshot.brand} {order.productSnapshot.name}</h2>
                <div className="order-card-meta">
                  <span><Ruler size={15} strokeWidth={1.5} /> Размер: {order.size}</span>
                  <span><CalendarDays size={15} strokeWidth={1.5} /> Заказ от {formatOrderDate(order.createdAt)}</span>
                </div>
                <p className={`status-pill ${statusTone(order.status)}`}>• {statusLabels[order.status]}</p>
              </div>
            </div>
            <button className="order-card-button ghost" type="button" onClick={() => setActiveOrder(order)}>
              <span>Открыть заказ</span>
              <ChevronRight size={22} strokeWidth={1.55} />
            </button>
          </article>
          ))}
        </div>
      )}

      <button className="detail-action orders-contact" type="button" onClick={onManager}>
        <MessageCircle size={22} strokeWidth={1.55} aria-hidden="true" />
        <span>Связаться с менеджером</span>
      </button>

      <div className={`order-sheet-layer ${activeOrder ? "is-open" : ""}`} aria-hidden={!activeOrder}>
        <button className="order-sheet-backdrop" type="button" aria-label="Закрыть заказ" onClick={() => setActiveOrder(null)} />
        {activeOrder && (
          <section className="order-detail-sheet" aria-label={`Заказ #${activeOrder.orderNumber}`}>
            <button className="sheet-handle" type="button" aria-label="Закрыть заказ" onClick={() => setActiveOrder(null)} />
            <div className="order-detail-head">
              <h2>Заказ #{activeOrder.orderNumber}</h2>
              <button className="sheet-close" type="button" aria-label="Закрыть заказ" onClick={() => setActiveOrder(null)}>
                <X size={22} strokeWidth={1.55} />
              </button>
            </div>

            <div className="order-detail-product">
              <img src={productImage(activeOrder.productSnapshot)} alt={activeOrder.productSnapshot.name} />
              <div>
                <h3>{activeOrder.productSnapshot.brand} {activeOrder.productSnapshot.name}</h3>
                <p>{activeOrder.productSnapshot.color || formatPrice(activeOrder.totalPrice)}</p>
              </div>
            </div>

            <div className="order-detail-list">
              <p><Tag size={21} strokeWidth={1.5} /><span>Размер: {activeOrder.size}</span></p>
              <p><Truck size={21} strokeWidth={1.5} /><span>Статус: <b>{statusLabels[activeOrder.status]}</b></span></p>
              <p><CalendarDays size={21} strokeWidth={1.5} /><span>Дата заказа: {formatOrderDate(activeOrder.createdAt)}</span></p>
              <p><Clock3 size={21} strokeWidth={1.5} /><span>Получение: {activeOrder.deliveryType === "delivery" ? "доставка" : "самовывоз"}</span></p>
              <p><MapPin size={21} strokeWidth={1.5} /><span>Адрес самовывоза: Притыцкого 29, ТЦ «Тивали», 1 этаж, магазин №101.</span></p>
            </div>

            <div className="order-progress">
              <div className="progress-step is-done">
                <span><Check size={18} strokeWidth={2} /></span>
                <b>Подтвержден</b>
                <small>10 мая 2024</small>
              </div>
              <div className="progress-line is-active" />
              <div className="progress-step is-current">
                <span><Truck size={18} strokeWidth={1.8} /></span>
                <b>Передан в доставку</b>
                <small>11 мая 2024</small>
              </div>
              <div className="progress-line" />
              <div className="progress-step">
                <span><Package size={18} strokeWidth={1.8} /></span>
                <b>Получение</b>
                <small>12–13 мая</small>
              </div>
            </div>

            <button className="order-primary-action" type="button" onClick={onManager}>
              <MessageCircle size={22} strokeWidth={1.55} />
              <span>Связаться с менеджером</span>
            </button>
            <button className="order-secondary-action" type="button" onClick={onCatalog}>
              <RefreshCcw size={21} strokeWidth={1.55} />
              <span>Повторить заказ</span>
            </button>
          </section>
        )}
      </div>
    </section>
  );
}
