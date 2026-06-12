import { Heart } from "lucide-react";
import type { Product } from "../data/products";
import { formatPrice, productImage } from "../lib/productUtils";

type ProductCardProps = {
  product: Product;
  isFavorite: boolean;
  onOpen?: (product: Product) => void;
  onToggleFavorite: (product: Product) => void;
};

export function ProductCard({ product, isFavorite, onOpen, onToggleFavorite }: ProductCardProps) {
  return (
    <article className="product-card" onClick={() => onOpen?.(product)}>
      <button className="product-card-hit" type="button" aria-label={`Открыть ${product.brand} ${product.name}`}>
        <span className="sr-only">Открыть товар</span>
      </button>
      <div className="product-media">
        <img src={productImage(product)} alt={`${product.brand} ${product.name}`} />
      </div>
      <div className="product-copy">
        <div>
          <p className="product-brand">{product.brand}</p>
          <h2>{product.name}</h2>
          <p className="product-price">{formatPrice(product.price)}</p>
        </div>
        <button
          className={`favorite-button ${isFavorite ? "is-active" : ""}`}
          type="button"
          aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(product);
          }}
        >
          <Heart size={25} strokeWidth={1.65} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}
