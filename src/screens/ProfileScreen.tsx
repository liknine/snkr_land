import { ArrowRight, Box, CalendarDays, CreditCard, Heart, Info, Ruler } from "lucide-react";
import orderShoe from "../assets/images/order-shoe-v4.png";
import profileTitle from "../assets/titles/profile-title-v5.png";
import type { Order } from "../lib/api";
import { openManagerChat } from "../lib/managerLink";
import { productImage } from "../lib/productUtils";
import type { Screen } from "../types";

type ProfileScreenProps = {
  latestOrder?: Order;
  onNavigate: (screen: Screen) => void;
};

const serviceItems: Array<{ label: string; Icon: typeof Heart; screen?: Screen }> = [
  { label: "Избранное", Icon: Heart, screen: "favorites" },
  { label: "Оплата", Icon: CreditCard, screen: "payment" },
  { label: "Доставка", Icon: Box, screen: "delivery" },
  { label: "О магазине", Icon: Info, screen: "about" },
];

function formatOrderDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function ProfileScreen({ latestOrder, onNavigate }: ProfileScreenProps) {
  return (
    <section className="screen profile-screen" aria-labelledby="profile-title">
      <img className="profile-title-img" id="profile-title" src={profileTitle} alt="SERVICE. ПРОФИЛЬ" />

      <button className="orders-panel orders-panel-button" type="button" aria-labelledby="orders-title" onClick={() => onNavigate("orders")}>
        <div className="panel-heading">
          <h2 id="orders-title">Мои заказы</h2>
          <ArrowRight size={27} strokeWidth={1.45} aria-hidden="true" />
        </div>
        {latestOrder ? (
          <div className="order-preview">
            <img src={productImage(latestOrder.productSnapshot)} alt={latestOrder.productSnapshot.name} />
            <div className="order-copy">
              <h3>{latestOrder.productSnapshot.brand} {latestOrder.productSnapshot.name}</h3>
              <p>
                <Ruler size={16} strokeWidth={1.55} aria-hidden="true" />
                <span>Размер: {latestOrder.size}</span>
              </p>
              <p>
                <CalendarDays size={16} strokeWidth={1.55} aria-hidden="true" />
                <span>Заказ от {formatOrderDate(latestOrder.createdAt)}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="order-preview">
            <img src={orderShoe} alt="" />
            <div className="order-copy">
              <h3>Заказов пока нет</h3>
              <p>
                <CalendarDays size={16} strokeWidth={1.55} aria-hidden="true" />
                <span>После покупки появится здесь</span>
              </p>
            </div>
          </div>
        )}
      </button>

      <button className="manager-row" type="button" onClick={openManagerChat}>
        <span>Связаться с менеджером</span>
        <ArrowRight size={27} strokeWidth={1.45} aria-hidden="true" />
      </button>

      <div className="service-list">
        {serviceItems.map(({ label, Icon, screen }) => (
          <button className="service-list-row" type="button" key={label} onClick={() => screen && onNavigate(screen)}>
            <Icon size={24} strokeWidth={1.55} aria-hidden="true" />
            <span>{label}</span>
            <ArrowRight size={25} strokeWidth={1.45} aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
