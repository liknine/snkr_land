import { Menu, Search } from "lucide-react";
import logo from "../assets/images/logo-v5.png";
import brandTitle from "../assets/titles/brand-title-v5.png";
import { IconButton } from "./IconButton";

type AppHeaderProps = {
  onMenuClick: () => void;
  onSearchClick: () => void;
};

export function AppHeader({ onMenuClick, onSearchClick }: AppHeaderProps) {
  return (
    <header className="app-header">
      <IconButton label="Открыть меню" Icon={Menu} className="header-icon header-menu" onClick={onMenuClick} />

      <div className="brand-lockup" aria-label="Sneakers Land BY">
        <img className="brand-logo" src={logo} alt="" />
        <img className="brand-title-img" src={brandTitle} alt="SNEAKERS LAND BY" />
      </div>

      <IconButton label="Поиск" Icon={Search} className="header-icon header-search" onClick={onSearchClick} />
    </header>
  );
}
