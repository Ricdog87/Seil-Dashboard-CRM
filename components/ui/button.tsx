import type { LucideIcon } from "lucide-react";
import { ICON_SM, ICON_STROKE } from "./icon";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-seil-accent text-seil-bg hover:bg-seil-accent-dk border border-transparent",
  secondary: "border border-seil-line bg-seil-card-alt text-seil-body hover:text-seil-text",
  ghost: "border border-transparent text-seil-muted hover:text-seil-text",
};

export function Button({
  variant = "secondary",
  icon: Icon,
  active = false,
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: LucideIcon;
  active?: boolean;
}) {
  const state = active
    ? "border-seil-accent bg-seil-accent-bg text-seil-text"
    : variants[variant];
  return (
    <button
      type="button"
      className={`inline-flex h-control items-center gap-1.5 rounded-seil px-3 text-body whitespace-nowrap transition-colors ${state} ${className}`}
      {...rest}
    >
      {Icon ? <Icon size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden /> : null}
      {children}
    </button>
  );
}
