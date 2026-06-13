import { ArrowRight, Box, CreditCard, Heart, Home, Info, MapPin, MessageCircle, ShoppingBag, Truck, X } from "lucide-react";
import logo from "../assets/images/logo-v5.png";
import brandTitle from "../assets/titles/brand-title-v5.png";
import type { Screen } from "../types";
import { openManagerChat } from "../lib/managerLink";

type SideMenuProps = {
  isOpen: boolean;
  activeScreen: Screen;
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
};

const mainItems = [
  { id: "home", label: "Главная", Icon: Home },
  { id: "catalog", label: "Каталог", Icon: ShoppingBag },
  { id: "favorites", label: "Избранное", Icon: Heart },
  { id: "profile", label: "Профиль", Icon: Box },
] satisfies Array<{ id: Screen; label: string; Icon: typeof Home }>;

const serviceItems: Array<{ label: string; Icon: typeof MapPin; screen?: Screen }> = [
  { label: "Притыцкого 29, Тивали", Icon: MapPin, screen: "about" },
  { label: "Доставка по РБ", Icon: Truck, screen: "delivery" },
  { label: "Оплата", Icon: CreditCard, screen: "payment" },
  { label: "О магазине", Icon: Info, screen: "about" },
  { label: "Связаться с менеджером", Icon: MessageCircle, screen: undefined },
];

export function SideMenu({ isOpen, activeScreen, onClose, onNavigate }: SideMenuProps) {
  return (
    <div className={`side-menu-layer ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
      <button className="side-menu-backdrop" type="button" aria-label="Закрыть меню" onClick={onClose} />

      <aside className="side-menu" aria-label="Боковое меню">
        <div className="side-menu-head">
          <div className="side-menu-brand">
            <img src={logo} alt="" />
            <img src={brandTitle} alt="SNEAKERS LAND BY" />
          </div>
          <button className="side-menu-close" type="button" aria-label="Закрыть меню" onClick={onClose}>
            <X size={24} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>

        <p className="side-menu-kicker">MENU</p>

        <div className="side-menu-list">
          {mainItems.map(({ id, label, Icon }) => (
            <button
              className={`side-menu-row ${activeScreen === id ? "is-active" : ""}`}
              type="button"
              key={id}
              onClick={() => {
                onNavigate(id);
                onClose();
              }}
            >
              <Icon size={22} strokeWidth={1.55} aria-hidden="true" />
              <span>{label}</span>
              <ArrowRight size={22} strokeWidth={1.45} aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="side-menu-card">
          {serviceItems.map(({ label, Icon, screen }) => (
            <button
              className="side-menu-info side-menu-info-button"
              type="button"
              key={label}
              onClick={() => {
                if (label === "Связаться с менеджером") {
                  openManagerChat();
                } else if (screen) {
                  onNavigate(screen);
                }
                onClose();
              }}
            >
              <Icon size={18} strokeWidth={1.55} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
