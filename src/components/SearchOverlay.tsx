import { ArrowRight, Search, X } from "lucide-react";
import type { Product } from "../data/products";
import { formatPrice, productImage } from "../lib/productUtils";

type SearchOverlayProps = {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onCatalog: () => void;
  onOpenProduct: (product: Product) => void;
};

const quickItems = ["Golden Goose", "Adidas Samba", "Nike Dunk", "New Balance", "Asics"];

export function SearchOverlay({ isOpen, products, onClose, onCatalog, onOpenProduct }: SearchOverlayProps) {
  const searchResults = products.slice(0, 3);

  return (
    <div className={`search-layer ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
      <button className="search-backdrop" type="button" aria-label="Закрыть поиск" onClick={onClose} />
      <section className="search-panel" aria-label="Поиск">
        <div className="search-panel-head">
          <div className="search-input-shell">
            <Search size={20} strokeWidth={1.55} aria-hidden="true" />
            <input placeholder="Найти кроссовки" autoComplete="off" />
          </div>
          <button className="search-close" type="button" aria-label="Закрыть поиск" onClick={onClose}>
            <X size={22} strokeWidth={1.55} aria-hidden="true" />
          </button>
        </div>

        <p className="search-kicker">БЫСТРЫЙ ПОИСК</p>

        <div className="search-chips">
          {quickItems.map((item) => (
            <button className="search-chip" type="button" key={item} onClick={onCatalog}>
              {item}
            </button>
          ))}
        </div>

        <div className="search-results">
          {searchResults.map((product) => (
            <button className="search-result-row" type="button" key={product.id} onClick={() => onOpenProduct(product)}>
              <img src={productImage(product)} alt="" />
              <span>
                <b>{product.brand}</b>
                <small>{product.name}</small>
              </span>
              <strong>{formatPrice(product.price)}</strong>
            </button>
          ))}
        </div>

        <button className="search-big-card" type="button" onClick={onCatalog}>
          <div>
            <h2>Открыть каталог</h2>
            <p>Все модели, новые дропы и избранное в одном месте.</p>
          </div>
          <ArrowRight size={26} strokeWidth={1.45} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
