import { ArrowLeft, Check, Truck } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { DELIVERY_NOTE, WAITING_TIME, type CartItem } from "../lib/api";
import { formatPrice, productImage } from "../lib/productUtils";

type CheckoutScreenProps = {
  item: CartItem | null;
  isSubmitting: boolean;
  onBack: () => void;
  onCatalog: () => void;
  onSubmit: (payload: {
    phone: string;
    address: string;
    comment?: string;
  }) => Promise<void> | void;
};

export function CheckoutScreen({ item, isSubmitting, onBack, onCatalog, onSubmit }: CheckoutScreenProps) {
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  if (!item) {
    return (
      <section className="screen checkout-screen" aria-labelledby="checkout-empty-title">
        <button className="floating-back" type="button" aria-label="Назад" onClick={onBack}>
          <ArrowLeft size={25} strokeWidth={1.55} />
        </button>
        <h1 className="cart-title" id="checkout-empty-title">ОФОРМЛЕНИЕ</h1>
        <div className="cart-empty-card final-empty-state">
          <Truck size={36} strokeWidth={1.45} aria-hidden="true" />
          <h2>Корзина пуста</h2>
          <p>Выберите пару перед оформлением заказа.</p>
          <button className="empty-state-button" type="button" onClick={onCatalog}>
            Открыть каталог
          </button>
        </div>
      </section>
    );
  }

  const total = item.product.price * item.quantity;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextPhone = phone.trim();
    const nextAddress = address.trim();

    if (!nextPhone) {
      setError("Укажите номер телефона, чтобы менеджер мог связаться с вами.");
      return;
    }

    if (!nextAddress) {
      setError("Укажите полный адрес проживания для доставки.");
      return;
    }

    setError("");
    try {
      await onSubmit({ phone: nextPhone, address: nextAddress, comment: comment.trim() || undefined });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "";
      setError(
        message === "telegram_webapp_unavailable"
          ? "Откройте магазин внутри Telegram, чтобы отправить заявку."
          : "Не удалось отправить заявку. Попробуйте ещё раз."
      );
    }
  };

  return (
    <section className="screen checkout-screen" aria-labelledby="checkout-title">
      <button className="floating-back" type="button" aria-label="Назад" onClick={onBack}>
        <ArrowLeft size={25} strokeWidth={1.55} />
      </button>

      <h1 className="cart-title checkout-title" id="checkout-title">ОФОРМЛЕНИЕ</h1>

      <div className="checkout-summary">
        <img src={productImage(item.product)} alt={`${item.product.brand} ${item.product.name}`} />
        <div>
          <p>{item.product.brand}</p>
          <h2>{item.product.name}</h2>
          <span>Размер: {item.size} · {item.quantity} шт.</span>
          <strong>{formatPrice(total)}</strong>
        </div>
      </div>

      <form
        className="checkout-form"
        noValidate
        onSubmit={handleSubmit}
      >
        <label>
          <span>Телефон</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+375..."
            inputMode="tel"
            aria-invalid={Boolean(error && !phone.trim())}
          />
        </label>

        <label>
          <span>Полный адрес проживания</span>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Город, улица, дом, квартира"
            aria-invalid={Boolean(error && phone.trim() && !address.trim())}
          />
        </label>

        <div className="checkout-delivery-info">
          <p>График работы</p>
          <span>Вторник-воскресенье -- рабочие</span>
          <b>Понедельник — выходной день.</b>
          <small>{DELIVERY_NOTE}</small>
          <small>Время ожидания: {WAITING_TIME}.</small>
        </div>

        <label>
          <span>Комментарий</span>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Удобное время, пожелания" rows={3} />
        </label>

        {error && <p className="checkout-error" role="alert">{error}</p>}

        <button className="product-main-button cart-order-button" type="submit" disabled={isSubmitting}>
          <Check size={22} strokeWidth={1.75} />
          <span>{isSubmitting ? "ОТПРАВЛЯЕМ..." : "ОТПРАВИТЬ ЗАКАЗ"}</span>
        </button>
      </form>
    </section>
  );
}
