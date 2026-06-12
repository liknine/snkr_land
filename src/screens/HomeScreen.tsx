import { ArrowRight, Box, MapPin, Star } from "lucide-react";
import heroShoe from "../assets/images/hero-shoe-v4.png";
import homeTitle from "../assets/titles/home-title-v5.png";

type HomeScreenProps = {
  onCatalogClick: () => void;
};

export function HomeScreen({ onCatalogClick }: HomeScreenProps) {
  return (
    <section className="screen home-screen" aria-labelledby="home-title">
      <img className="home-title-img" id="home-title" src={homeTitle} alt="NEW DROP. ТВОЙ НОВЫЙ ХОД" />

      <div className="home-shoe-wrap">
        <img className="home-shoe" src={heroShoe} alt="Golden Goose Super-Star Black" />
      </div>

      <button className="cta-button" type="button" onClick={onCatalogClick}>
        <span>ПЕРЕЙТИ В КАТАЛОГ</span>
        <ArrowRight size={29} strokeWidth={1.45} aria-hidden="true" />
      </button>

      <div className="info-row" aria-label="Информация магазина">
        <div className="info-row-item">
          <Star size={16} strokeWidth={1.55} aria-hidden="true" />
          <span>Новые дропы</span>
        </div>
        <div className="info-row-item">
          <MapPin size={16} strokeWidth={1.55} aria-hidden="true" />
          <span>Притыцкого 29, Тивали</span>
        </div>
        <div className="info-row-item">
          <Box size={16} strokeWidth={1.55} aria-hidden="true" />
          <span>Доставка по РБ</span>
        </div>
      </div>
    </section>
  );
}
