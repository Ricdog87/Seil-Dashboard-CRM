import type { Tone } from "./badge";

const tones: Record<Tone, string> = {
  neutral: "bg-seil-muted",
  accent: "bg-seil-accent",
  success: "bg-seil-success",
  warning: "bg-seil-warning",
  danger: "bg-seil-danger",
  info: "bg-seil-info",
};

/**
 * Reiner Farbpunkt - deshalb NIE allein einsetzen. Das Label daneben ist
 * Pflicht, der Punkt ist fuer Screenreader unsichtbar.
 */
export function StatusDot({ tone = "neutral", label }: { tone?: Tone; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tones[tone]}`} aria-hidden />
      <span>{label}</span>
    </span>
  );
}
