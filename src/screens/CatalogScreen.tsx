import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import catalogTitle from "../assets/titles/catalog-title-v6.png";
import { ProductCard } from "../components/ProductCard";
import type { Product } from "../data/products";

const brands = ["Golden Goose", "Adidas", "Nike", "New Balance"];
const sizes = [38, 39, 40, 41, 42, 43, 44, 45];
const sortItems = ["Сначала новые", "Сначала популярные", "По цене: по возрастанию", "По цене: по убыванию"];

type CatalogScreenProps = {
  products: Product[];
  favoriteIds: Set<string>;
  onOpenProduct: (product: Product) => void;
  onToggleFavorite: (product: Product) => void;
};

export function CatalogScreen({ products, favoriteIds, onOpenProduct, onToggleFavorite }: CatalogScreenProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("snkr-filters-open", filtersOpen);

    return () => {
      document.body.classList.remove("snkr-filters-open");
    };
  }, [filtersOpen]);
  const [selectedBrand, setSelectedBrand] = useState("Golden Goose");
  const [selectedSize, setSelectedSize] = useState(42);
  const [selectedSort, setSelectedSort] = useState(sortItems[0]);

  const resetFilters = () => {
    setSelectedBrand("Golden Goose");
    setSelectedSize(42);
    setSelectedSort(sortItems[0]);
  };

  return (
    <section className="screen catalog-screen" aria-labelledby="catalog-title">
      <img className="catalog-title-img" id="catalog-title" src={catalogTitle} alt="КАТАЛОГ" />

      <div className="catalog-toolbar">
        <button className="filter-pill" type="button" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>Фильтр</span>
        </button>
        <button className="filter-pill sort-pill" type="button" onClick={() => setFiltersOpen(true)}>
          <span>{selectedSort}</span>
          <ChevronDown size={18} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </div>

      {products.length > 0 ? (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              product={product}
              key={product.id}
              isFavorite={favoriteIds.has(String(product.id))}
              onOpen={onOpenProduct}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="favorites-empty final-empty-state catalog-empty-state">
          <h2>Каталог пуст</h2>
          <p>Добавьте настоящий товар, и он появится здесь без тестовых карточек.</p>
        </div>
      )}

      <div className={`filter-sheet-layer ${filtersOpen ? "is-open" : ""}`} aria-hidden={!filtersOpen}>
        <button className="filter-backdrop" type="button" aria-label="Закрыть фильтры" onClick={() => setFiltersOpen(false)} />
        <section className="filter-sheet" aria-label="Фильтры каталога">
          <button className="sheet-handle" type="button" aria-label="Закрыть фильтры" onClick={() => setFiltersOpen(false)} />
          <div className="filter-sheet-head">
            <h2>Фильтры</h2>
            <button type="button" className="sheet-close" aria-label="Закрыть фильтры" onClick={() => setFiltersOpen(false)}>
              <X size={22} strokeWidth={1.55} />
            </button>
          </div>

          <div className="filter-section">
            <h3>Бренд</h3>
            <div className="filter-chips">
              {brands.map((brand) => (
                <button
                  className={`filter-choice ${selectedBrand === brand ? "is-selected" : ""}`}
                  type="button"
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                >
                  <span>{brand}</span>
                  {selectedBrand === brand && <Check size={15} strokeWidth={1.9} />}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>Размер</h3>
            <div className="size-grid">
              {sizes.map((size) => (
                <button
                  className={`size-choice ${selectedSize === size ? "is-selected" : ""}`}
                  type="button"
                  key={size}
                  onClick={() => setSelectedSize(size)}
                >
                  <span>{size}</span>
                  {selectedSize === size && <Check size={13} strokeWidth={2} />}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>Цена</h3>
            <div className="price-range" aria-hidden="true">
              <span />
              <i />
              <i />
            </div>
            <div className="price-labels">
              <span>250 BYN</span>
              <span>2 500 BYN</span>
            </div>
          </div>

          <div className="filter-section">
            <h3>Сортировка</h3>
            <div className="sort-grid">
              {sortItems.map((item) => (
                <button
                  className={`sort-choice ${selectedSort === item ? "is-selected" : ""}`}
                  type="button"
                  key={item}
                  onClick={() => setSelectedSort(item)}
                >
                  <span />
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-actions">
            <button className="filter-reset" type="button" onClick={resetFilters}>Сбросить</button>
            <button className="filter-apply" type="button" onClick={() => setFiltersOpen(false)}>Показать товары</button>
          </div>
        </section>
      </div>
    </section>
  );
}
