import type { LucideIcon } from "lucide-react";
import { ICON_SM, ICON_STROKE } from "./icon";
import type { Tone } from "./badge";

const tones: Record<Tone, string> = {
  neutral: "border-seil-line bg-seil-card-alt text-seil-body",
  accent: "border-seil-accent bg-seil-accent-bg text-seil-text",
  success: "border-seil-success bg-seil-success-bg text-seil-success",
  warning: "border-seil-warning bg-seil-warning-bg text-seil-warning",
  danger: "border-seil-danger bg-seil-danger-bg text-seil-danger",
  info: "border-seil-info bg-seil-info-bg text-seil-info",
};

/** Inline-Rueckmeldung, kein Overlay - das Cockpit verdeckt nie seine eigenen Daten. */
export function Toast({
  tone = "neutral",
  icon: Icon,
  children,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={`inline-flex items-center gap-2 rounded-seil border px-3 py-1.5 text-body ${tones[tone]}`}
    >
      {Icon ? <Icon size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden /> : null}
      {children}
    </div>
  );
}
