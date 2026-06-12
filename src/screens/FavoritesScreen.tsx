import { ArrowRight, Heart } from "lucide-react";
import favoritesTitle from "../assets/titles/favorites-title-v6.png";
import { ProductCard } from "../components/ProductCard";
import type { Product } from "../data/products";

type FavoritesScreenProps = {
  favorites: Product[];
  onCatalog: () => void;
  onOpenProduct: (product: Product) => void;
  onToggleFavorite: (product: Product) => void;
};

export function FavoritesScreen({ favorites, onCatalog, onOpenProduct, onToggleFavorite }: FavoritesScreenProps) {
  return (
    <section className="screen favorites-screen" aria-labelledby="favorites-title">
      <img className="favorites-title-img" id="favorites-title" src={favoritesTitle} alt="ИЗБРАННОЕ" />
      {favorites.length > 0 ? (
        <div className="products-grid favorites-grid">
          {favorites.map((product) => (
            <ProductCard
              product={product}
              key={product.id}
              isFavorite
              onOpen={onOpenProduct}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="favorites-empty final-empty-state">
          <Heart size={34} strokeWidth={1.45} aria-hidden="true" />
          <h2>Избранное пусто</h2>
          <p>Добавляйте модели, чтобы быстро вернуться к ним позже.</p>
          <button className="empty-state-button" type="button" onClick={onCatalog}>
            <span>Открыть каталог</span>
            <ArrowRight size={21} strokeWidth={1.55} />
          </button>
        </div>
      )}
    </section>
  );
}
