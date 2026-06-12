import { Grid2X2, Heart, Home, UserRound } from "lucide-react";
import type { Screen } from "../types";

type BottomNavProps = {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
};

const normalizeScreen = (screen: Screen): Screen => {
  if (screen === "product" || screen === "cart") return "catalog";
  if (screen === "delivery" || screen === "about" || screen === "orders" || screen === "payment") return "profile";
  return screen;
};

const items = [
  { id: "home", label: "Главная", Icon: Home },
  { id: "catalog", label: "Каталог", Icon: Grid2X2 },
  { id: "favorites", label: "Избранное", Icon: Heart },
  { id: "profile", label: "Профиль", Icon: UserRound },
] satisfies Array<{ id: Screen; label: string; Icon: typeof Home }>;

export function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav-wrap" aria-label="Основная навигация">
      <div className="bottom-nav">
        {items.map(({ id, label, Icon }) => {
          const active = normalizeScreen(activeScreen) === id;

          return (
            <button
              className={`bottom-nav-item ${active ? "is-active" : ""}`}
              type="button"
              key={id}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate(id)}
            >
              <Icon size={25} strokeWidth={1.65} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
