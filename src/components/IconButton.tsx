import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

type IconButtonProps = {
  label: string;
  Icon: ComponentType<LucideProps>;
  className?: string;
  onClick?: () => void;
};

export function IconButton({ label, Icon, className = "", onClick }: IconButtonProps) {
  return (
    <button className={`icon-button ${className}`} type="button" aria-label={label} onClick={onClick}>
      <Icon strokeWidth={1.9} aria-hidden="true" />
    </button>
  );
}
