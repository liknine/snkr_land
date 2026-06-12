import { ArrowLeft, BadgeCheck, CreditCard, MapPin, MessageCircle, PackageCheck, ReceiptText } from "lucide-react";

type PaymentScreenProps = {
  onBack: () => void;
};

export function PaymentScreen({ onBack }: PaymentScreenProps) {
  return (
    <section className="screen detail-screen" aria-labelledby="payment-title">
      <button className="back-row" type="button" onClick={onBack}>
        <ArrowLeft size={22} strokeWidth={1.55} aria-hidden="true" />
        <span>Назад</span>
      </button>

      <p className="detail-kicker">SERVICE</p>
      <h1 className="detail-title" id="payment-title">Оплата</h1>

      <div className="detail-card big-detail-card detail-card-row">
        <PackageCheck size={28} strokeWidth={1.45} aria-hidden="true" />
        <div>
          <h2>Наложенный платёж</h2>
          <p>Отправляем наложенным платежом по почте. Оплата после получения заказа.</p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card detail-card-column">
          <CreditCard size={24} strokeWidth={1.45} aria-hidden="true" />
          <h3>В магазине</h3>
          <p>Можно оплатить наличными или картой при самовывозе.</p>
        </div>
        <div className="detail-card detail-card-column">
          <ReceiptText size={24} strokeWidth={1.45} aria-hidden="true" />
          <h3>Чек</h3>
          <p>После оплаты подтверждаем заказ и детали выдачи.</p>
        </div>
      </div>

      <div className="detail-card pickup-card detail-card-row">
        <MapPin size={24} strokeWidth={1.45} aria-hidden="true" />
        <div>
          <h3>Самовывоз</h3>
          <p>Оплата в магазине: Минск, Притыцкого 29, ТЦ «Тивали», 1 этаж, магазин №101.</p>
        </div>
      </div>

      <div className="detail-card pickup-card detail-card-row">
        <BadgeCheck size={24} strokeWidth={1.45} aria-hidden="true" />
        <div>
          <h3>Подтверждение</h3>
          <p>Менеджер уточнит размер, наличие и удобный способ оплаты перед отправкой.</p>
        </div>
      </div>

      <button className="detail-action" type="button">
        <MessageCircle size={22} strokeWidth={1.55} aria-hidden="true" />
        <span>Связаться с менеджером</span>
      </button>
    </section>
  );
}
