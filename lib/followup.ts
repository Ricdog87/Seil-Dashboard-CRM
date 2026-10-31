import type { Kontakt } from "@/app/api/kontakte/route";
import type { Stufe } from "@/lib/crm";
import { FOLLOWUP_LEITER, followupName } from "@/lib/kommunikation";

/**
 * Die Follow-up-Regel des Standardprozesses (Flowchart Schritt 15):
 * keine Antwort → zwei Tage später nachfassen, 1. Follow Up, 2. Follow Up,
 * weitere im Wechsel, zuletzt das Final Follow up. Danach gilt der Investor
 * als stumm – das Final sagt ihm, dass wir von keinem Interesse ausgehen.
 *
 * Nach einer Preisfrage gibt es genau eine Nachfrage („haben Sie mit Herrn
 * Seil gesprochen?“); danach läuft es telefonisch.
 */
export const FOLLOWUP_TAGE = 2;
export const FOLLOWUP_MAX = FOLLOWUP_LEITER.length;

/** In welchen Stufen auf eine Antwort gewartet wird und mit welcher Leiter. */
const WARTEND: Partial<Record<Stufe, { max: number; name: (stufe: number) => string }>> = {
  angeschrieben: { max: FOLLOWUP_MAX, name: followupName },
  interesse: { max: FOLLOWUP_MAX, name: followupName },
  nda_angefragt: { max: FOLLOWUP_MAX, name: followupName },
  preisanfrage: { max: 1, name: () => "Nachfrage: mit Herrn Seil gesprochen?" },
};

export function tageSeit(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.floor((Date.now() - d) / 86_400_000);
}

export type FollowupLage =
  | { lage: "keine" }
  | { lage: "wartet"; tage: number; max: number }
  | { lage: "faellig"; tage: number; stufe: number; max: number; name: string }
  | { lage: "stumm"; tage: number; max: number };

export function followupLage(k: Pick<Kontakt, "status" | "letzterKontakt" | "followups">): FollowupLage {
  const regel = WARTEND[k.status];
  if (!regel) return { lage: "keine" };
  const tage = tageSeit(k.letzterKontakt);
  if (tage === null) return { lage: "keine" };
  const bisher = k.followups ?? 0;
  if (bisher >= regel.max) return { lage: "stumm", tage, max: regel.max };
  if (tage >= FOLLOWUP_TAGE) return { lage: "faellig", tage, stufe: bisher + 1, max: regel.max, name: regel.name(bisher + 1) };
  return { lage: "wartet", tage, max: regel.max };
}
