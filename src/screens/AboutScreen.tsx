import { ArrowLeft, Clock3, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import logo from "../assets/images/logo-v5.png";

type AboutScreenProps = {
  onBack: () => void;
};

export function AboutScreen({ onBack }: AboutScreenProps) {
  return (
    <section className="screen detail-screen" aria-labelledby="about-title">
      <button className="back-row" type="button" onClick={onBack}>
        <ArrowLeft size={22} strokeWidth={1.55} aria-hidden="true" />
        <span>Назад</span>
      </button>

      <p className="detail-kicker">SNKR LAND</p>
      <h1 className="detail-title" id="about-title">О магазине</h1>

      <div className="about-hero-card">
        <img src={logo} alt="" />
        <div>
          <h2>Sneakers Land BY</h2>
          <p>Кроссовки в центре Минска. Подбор, заказ и доставка по Беларуси.</p>
        </div>
      </div>

      <div className="detail-card pickup-card detail-card-row">
        <MapPin size={24} strokeWidth={1.45} aria-hidden="true" />
        <div>
          <h3>Адрес</h3>
          <p>Притыцкого 29, ТЦ «Тивали», 1 этаж, магазин №101.</p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card detail-card-column">
          <Clock3 size={24} strokeWidth={1.45} aria-hidden="true" />
          <h3>График</h3>
          <p>10:00–21:00 каждый день.</p>
        </div>
        <div className="detail-card detail-card-column">
          <ShieldCheck size={24} strokeWidth={1.45} aria-hidden="true" />
          <h3>Подбор</h3>
          <p>Поможем с размером и моделью.</p>
        </div>
      </div>

      <button className="detail-action" type="button">
        <MessageCircle size={22} strokeWidth={1.55} aria-hidden="true" />
        <span>Связаться с менеджером</span>
      </button>
    </section>
  );
}
