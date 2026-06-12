import { ArrowLeft, Check, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import type { CartItem } from "../lib/api";
import { formatPrice, productImage } from "../lib/productUtils";

type CartScreenProps = {
  item: CartItem | null;
  onBack: () => void;
  onCatalog: () => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onCheckout: () => void;
};

export function CartScreen({ item, onBack, onCatalog, onQuantityChange, onRemove, onCheckout }: CartScreenProps) {
  const [isEmpty, setIsEmpty] = useState(false);

  if (isEmpty || !item) {
    return (
      <section className="screen cart-screen" aria-labelledby="cart-empty-title">
        <button className="floating-back" type="button" aria-label="Назад" onClick={onBack}>
          <ArrowLeft size={25} strokeWidth={1.55} />
        </button>
        <h1 className="cart-title" id="cart-empty-title">КОРЗИНА</h1>
        <div className="cart-empty-card final-empty-state">
          <ShoppingBag size={36} strokeWidth={1.45} aria-hidden="true" />
          <h2>Корзина пуста</h2>
          <p>Выберите пару в каталоге и оформите заказ.</p>
          <button className="empty-state-button" type="button" onClick={onCatalog}>
            Открыть каталог
          </button>
        </div>
      </section>
    );
  }

  const { product, size, quantity } = item;
  const productsTotal = product.price * quantity;
  const total = productsTotal;
  const setQuantity = (next: number) => {
    onQuantityChange(next);
  };

  return (
    <section className="screen cart-screen" aria-labelledby="cart-title">
      <button className="floating-back" type="button" aria-label="Назад" onClick={onBack}>
        <ArrowLeft size={25} strokeWidth={1.55} />
      </button>

      <h1 className="cart-title" id="cart-title">КОРЗИНА</h1>

      <div className="cart-item-card">
        <button className="cart-remove" type="button" aria-label="Удалить товар" onClick={() => { setIsEmpty(true); onRemove(); }}>
          <X size={22} strokeWidth={1.55} />
        </button>
        <img src={productImage(product)} alt={`${product.brand} ${product.name}`} />
        <div className="cart-item-copy">
          <p>{product.brand}</p>
          <span>{product.name}</span>
          <strong>{formatPrice(product.price)}</strong>
          <div className="cart-controls">
            <div className="cart-size">Размер: <b>{size}</b></div>
            <div className="cart-qty">
              <button type="button" aria-label="Уменьшить" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus size={18} strokeWidth={1.6} />
              </button>
              <span>{quantity}</span>
              <button type="button" aria-label="Увеличить" onClick={() => setQuantity(quantity + 1)}>
                <Plus size={18} strokeWidth={1.6} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="cart-total-card">
        <p><span>Товары</span><b>{formatPrice(productsTotal)}</b></p>
        <p><span>Доставка</span><b>Курьер</b></p>
        <i />
        <p className="cart-total"><span>Итого</span><b>{formatPrice(total)}</b></p>
      </div>

      <button className="product-main-button cart-order-button" type="button" onClick={onCheckout}>
        <Check size={22} strokeWidth={1.75} />
        <span>ОФОРМИТЬ ЗАКАЗ</span>
      </button>
      <button className="product-fav-button" type="button" onClick={onCatalog}>
        ПРОДОЛЖИТЬ ПОКУПКИ
      </button>
    </section>
  );
}
