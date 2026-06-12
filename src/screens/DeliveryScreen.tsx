import { ArrowLeft, Box, Clock3, MapPin, Truck } from "lucide-react";

type DeliveryScreenProps = {
  onBack: () => void;
};

export function DeliveryScreen({ onBack }: DeliveryScreenProps) {
  return (
    <section className="screen detail-screen" aria-labelledby="delivery-title">
      <button className="back-row" type="button" onClick={onBack}>
        <ArrowLeft size={22} strokeWidth={1.55} aria-hidden="true" />
        <span>Назад</span>
      </button>

      <p className="detail-kicker">SERVICE</p>
      <h1 className="detail-title" id="delivery-title">Доставка</h1>

      <div className="detail-card big-detail-card detail-card-row">
        <Truck size={28} strokeWidth={1.45} aria-hidden="true" />
        <div>
          <h2>По всей Беларуси</h2>
          <p>Отправка заказов по РБ. Обычно доставка занимает 1–3 дня.</p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card detail-card-column">
          <Box size={24} strokeWidth={1.45} aria-hidden="true" />
          <h3>Стоимость</h3>
          <p>Доставка по РБ — 10 BYN.</p>
        </div>
        <div className="detail-card detail-card-column">
          <Clock3 size={24} strokeWidth={1.45} aria-hidden="true" />
          <h3>Срок</h3>
          <p>1–3 дня после подтверждения заказа.</p>
        </div>
      </div>

      <div className="detail-card pickup-card detail-card-row">
        <MapPin size={24} strokeWidth={1.45} aria-hidden="true" />
        <div>
          <h3>Самовывоз</h3>
          <p>Минск, Притыцкого 29, ТЦ «Тивали», 1 этаж, магазин №101.</p>
        </div>
      </div>
    </section>
  );
}
