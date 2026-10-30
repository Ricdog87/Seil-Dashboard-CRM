import type { Kontakt } from "@/app/api/kontakte/route";

/**
 * Die Follow-up-Regel aus SOP Schritt 16: alle zwei Tage nachfassen, höchstens
 * drei Stufen. Danach gilt der Kontakt als stumm – nicht als abgesagt, aber als
 * jemand, bei dem Nachfassen nichts mehr bringt.
 */
export const FOLLOWUP_TAGE = 2;
export const FOLLOWUP_MAX = 3;

/** Stufen, in denen auf eine Antwort gewartet wird. */
const WARTEND = new Set(["angeschrieben", "nda_angefragt"]);

export function tageSeit(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.floor((Date.now() - d) / 86_400_000);
}

export type FollowupLage =
  | { lage: "keine" }
  | { lage: "wartet"; tage: number }
  | { lage: "faellig"; tage: number; stufe: number }
  | { lage: "stumm"; tage: number };

export function followupLage(k: Pick<Kontakt, "status" | "letzterKontakt" | "followups">): FollowupLage {
  if (!WARTEND.has(k.status)) return { lage: "keine" };
  const tage = tageSeit(k.letzterKontakt);
  if (tage === null) return { lage: "keine" };
  if ((k.followups ?? 0) >= FOLLOWUP_MAX) return { lage: "stumm", tage };
  if (tage >= FOLLOWUP_TAGE) return { lage: "faellig", tage, stufe: (k.followups ?? 0) + 1 };
  return { lage: "wartet", tage };
}
