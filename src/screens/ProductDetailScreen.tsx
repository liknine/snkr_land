import { ArrowLeft, ChevronDown, Heart } from "lucide-react";
import { useState } from "react";
import type { Product } from "../data/products";
import { formatPrice, productImage } from "../lib/productUtils";

type ProductDetailScreenProps = {
  product: Product;
  isFavorite: boolean;
  onBack: () => void;
  onCart: (size: string) => void;
  onToggleFavorite: (product: Product) => void;
};

export function ProductDetailScreen({ product, isFavorite, onBack, onCart, onToggleFavorite }: ProductDetailScreenProps) {
  const sizes = product.sizes.length ? product.sizes : ["39", "40", "41", "42", "43"];
  const [selectedSize, setSelectedSize] = useState(sizes.includes("42") ? "42" : sizes[0]);
  const [openSection, setOpenSection] = useState<"description" | "details" | null>("description");

  return (
    <section className="screen product-detail-screen" aria-labelledby="product-title">
      <button className="floating-back" type="button" aria-label="Назад" onClick={onBack}>
        <ArrowLeft size={25} strokeWidth={1.55} />
      </button>

      <div className="product-detail-hero">
        <img src={productImage(product)} alt={`${product.brand} ${product.name}`} />
      </div>

      <div className="product-detail-head">
        <div>
          <p>{product.brand}</p>
          <h1 id="product-title">{product.name}</h1>
        </div>
        <strong>{formatPrice(product.price)}</strong>
      </div>

      <p className="product-detail-description">
        {product.description || "Икона стиля. Винтажный вид, премиальное качество и комфорт на каждый день."}
      </p>

      <div className="product-size-block">
        <p>Размер</p>
        <div className="product-size-row">
          {sizes.map((size) => (
            <button
              className={`product-size ${size === selectedSize ? "is-selected" : ""}`}
              type="button"
              key={size}
              onClick={() => setSelectedSize(size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <button className="product-main-button" type="button" onClick={() => onCart(selectedSize)}>
        ОФОРМИТЬ ЗАКАЗ
      </button>
      <button className={`product-fav-button ${isFavorite ? "is-active" : ""}`} type="button" onClick={() => onToggleFavorite(product)}>
        <Heart size={22} strokeWidth={1.55} fill={isFavorite ? "currentColor" : "none"} />
        <span>{isFavorite ? "В ИЗБРАННОМ" : "В ИЗБРАННОЕ"}</span>
      </button>

      <div className="product-accordion">
        <button type="button" onClick={() => setOpenSection(openSection === "description" ? null : "description")}>
          <span>Описание</span>
          <ChevronDown className={openSection === "description" ? "is-rotated" : ""} size={20} strokeWidth={1.55} />
        </button>
        <div className={`accordion-content ${openSection === "description" ? "is-open" : ""}`}>
          <p>Лёгкая пара для ежедневного образа. Хорошо сочетается с джинсами, широкими брюками и базовыми вещами.</p>
        </div>

        <button type="button" onClick={() => setOpenSection(openSection === "details" ? null : "details")}>
          <span>Детали</span>
          <ChevronDown className={openSection === "details" ? "is-rotated" : ""} size={20} strokeWidth={1.55} />
        </button>
        <div className={`accordion-content ${openSection === "details" ? "is-open" : ""}`}>
          <p>Размер выбран: {selectedSize}. Перед отправкой менеджер подтвердит наличие и посадку.</p>
        </div>
      </div>
    </section>
  );
}
