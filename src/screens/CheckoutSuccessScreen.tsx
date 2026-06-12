import { ArrowRight, Check, ShoppingBag } from "lucide-react";

type CheckoutSuccessScreenProps = {
  onOrders: () => void;
  onCatalog: () => void;
};

export function CheckoutSuccessScreen({ onOrders, onCatalog }: CheckoutSuccessScreenProps) {
  return (
    <section className="screen success-screen" aria-labelledby="success-title">
      <div className="success-card">
        <div className="success-icon">
          <Check size={34} strokeWidth={2.1} aria-hidden="true" />
        </div>
        <p className="success-kicker">ORDER</p>
        <h1 id="success-title">Заявка отправлена</h1>
        <p className="success-text">
          Заявка отправлена. Время ожидания: 1–3 дня.
        </p>
      </div>

      <button className="product-main-button success-main" type="button" onClick={onOrders}>
        <span>МОИ ЗАКАЗЫ</span>
        <ArrowRight size={23} strokeWidth={1.55} />
      </button>

      <button className="product-fav-button success-secondary" type="button" onClick={onCatalog}>
        <ShoppingBag size={22} strokeWidth={1.55} />
        <span>ВЕРНУТЬСЯ В КАТАЛОГ</span>
      </button>
    </section>
  );
}
