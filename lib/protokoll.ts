import { datenbankAktiv, dbSchreiben } from "@/lib/supabase";
import type { AktivitaetArt } from "@/lib/mandat";

/**
 * Einen Eintrag in die Spur schreiben.
 *
 * Fehlschläge werden geschluckt: ein Protokolleintrag darf nie der Grund sein,
 * dass eine Freigabe oder eine Statusänderung scheitert. Was nicht protokolliert
 * werden konnte, fehlt in der Historie – das ist das kleinere Übel.
 */
export async function protokoll(eintrag: {
  mandat?: string | null;
  investorId?: string | null;
  art: AktivitaetArt;
  text: string;
  durch?: string | null;
}): Promise<void> {
  if (!datenbankAktiv()) return;
  try {
    await dbSchreiben(
      "aktivitaet",
      [
        {
          mandat: eintrag.mandat ?? null,
          investor_id: eintrag.investorId ?? null,
          art: eintrag.art,
          text: eintrag.text,
          durch: eintrag.durch || null,
        },
      ],
      "id",
    );
  } catch {
    // bewusst still
  }
}
