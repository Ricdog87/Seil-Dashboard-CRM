import type { LucideIcon } from "lucide-react";
import { ICON_SM, ICON_STROKE } from "./icon";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

/** Farbe traegt nie allein die Information - jedes Badge fuehrt Text, oft zusaetzlich ein Icon. */
const tones: Record<Tone, string> = {
  neutral: "bg-seil-card-alt text-seil-muted",
  accent: "bg-seil-accent-bg text-seil-accent",
  success: "bg-seil-success-bg text-seil-success",
  warning: "bg-seil-warning-bg text-seil-warning",
  danger: "bg-seil-danger-bg text-seil-danger",
  info: "bg-seil-info-bg text-seil-info",
};

export function Badge({
  tone = "neutral",
  icon: Icon,
  children,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-seil px-2 py-0.5 text-kicker whitespace-nowrap ${tones[tone]}`}
    >
      {Icon ? <Icon size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden /> : null}
      {children}
    </span>
  );
}
