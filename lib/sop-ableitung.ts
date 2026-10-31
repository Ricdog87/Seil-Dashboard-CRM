import type { Kontakt } from "@/app/api/kontakte/route";
import type { Modul01Objekt } from "@/lib/modul01";
import type { SchrittStand } from "@/app/api/schritte/route";
import { ANGESCHRIEBEN, GEANTWORTET } from "@/lib/crm";

/**
 * Welcher Schritt des Flowcharts lässt sich aus den Live-Quellen ablesen?
 *
 * Diese Schritte trägt niemand von Hand ein – die Automatik weiß es besser und
 * aktueller. Alles andere bleibt Handarbeit des Teams, und zwar sichtbar:
 * lieber ein leeres Feld, in dem jemand etwas einträgt, als ein grüner Haken,
 * den niemand gesetzt hat.
 *
 * Nummern wie im Flowchart: 8 Datenraum · 9 Deal · 13 Matching · 14 Approach ·
 * 15 E-Mail-Kommunikation · 16 Phone Call · 17 Broker Call.
 */
export type Stand = "done" | "in_progress" | "pending" | "na";

export interface Abgeleitet {
  status: Stand;
  /** Was auf dem Schritt steht – die Zahl, die ihn belegt. */
  wert: string;
  /** Woher die Zahl kommt, in einem Halbsatz. */
  quelle: string;
}

function wert(o: Modul01Objekt | undefined, feld: string): number | null {
  const roh = o?.kennwerte?.find((k) => k.feld === feld)?.wert;
  const n = Number(roh);
  return roh === undefined || Number.isNaN(n) ? null : n;
}

export function ableiten(
  datenraum: Modul01Objekt | undefined,
  kontakte: Pick<Kontakt, "status" | "letzteAntwort">[],
  investorenGesamt: number | null,
  offeneFreigaben: number,
  mandatAngelegt = true,
): Record<number, Abgeleitet> {
  const ab: Record<number, Abgeleitet> = {};
  const zaehl = (...stufen: readonly string[]) => kontakte.filter((k) => stufen.includes(k.status)).length;

  // 8 · Create Data Room – Modul 01 weiß, wie weit er ist.
  if (datenraum) {
    const verarbeitet = wert(datenraum, "verarbeitet");
    const abgelegt = wert(datenraum, "abgelegt");
    const offen = datenraum.dokumente?.length ?? 0;
    ab[8] = {
      status: offen === 0 && abgelegt ? "done" : "in_progress",
      wert: `${abgelegt ?? 0} von ${verarbeitet ?? 0} abgelegt, ${offen} zu prüfen`,
      quelle: "Modul 01",
    };
  }

  // 9 · Create new Deal – das Mandat im Cockpit ist der Deal.
  if (mandatAngelegt) {
    ab[9] = { status: "done", wert: "Mandat im Cockpit angelegt", quelle: "Cockpit" };
  }

  // 13 · Matching / Investors List – gibt es einen Verteiler, ist der Abgleich gelaufen.
  if (investorenGesamt !== null || kontakte.length > 0) {
    ab[13] =
      kontakte.length > 0
        ? { status: "done", wert: `${kontakte.length} im Verteiler`, quelle: "Abgleich" }
        : {
            status: "in_progress",
            wert: `${investorenGesamt} Investoren in der Liveliste`,
            quelle: "Liveliste",
          };
  }

  // 14 · Investors Approach-E-Mail – der Schritt mit der Freigabe.
  const angeschrieben = zaehl(...ANGESCHRIEBEN);
  if (offeneFreigaben > 0) {
    ab[14] = { status: "in_progress", wert: `${offeneFreigaben} warten auf Freigabe`, quelle: "Freigabe-Eingang" };
  } else if (angeschrieben > 0) {
    ab[14] = { status: "done", wert: `${angeschrieben} angeschrieben`, quelle: "Verteiler" };
  }

  // 15 · E-Mail-Communication (Standard Process): Feedbacks, Follow-Ups, Q&A, NDA, Data room
  const geantwortet = zaehl(...GEANTWORTET);
  const nda = zaehl("nda_unterzeichnet", "datenraum_freigegeben", "preisanfrage", "besichtigung");
  const dr = zaehl("datenraum_freigegeben", "preisanfrage", "besichtigung");
  if (angeschrieben > 0) {
    ab[15] = {
      status: "in_progress",
      wert: `${geantwortet} geantwortet · ${nda} NDA · ${dr} Datenraum`,
      quelle: "Standardprozess",
    };
  }

  // 16 · Phone Call – Telefonate aus dem Standardprozess: Preisfragen und Rückrufwünsche.
  const anrufe = kontakte.filter((k) => k.status === "preisanfrage" || k.letzteAntwort === "telefonat" || k.letzteAntwort === "preisfrage").length;
  if (anrufe > 0) {
    ab[16] = { status: "in_progress", wert: `${anrufe} Rückrufe`, quelle: "Standardprozess" };
  }

  // 17 · Broker Call – Feedback, Pricing, Site visit.
  const gespraech = zaehl("preisanfrage", "besichtigung");
  const besichtigung = zaehl("besichtigung");
  if (gespraech > 0) {
    ab[17] = {
      status: "in_progress",
      wert: `${gespraech} im Gespräch · ${besichtigung} Besichtigung`,
      quelle: "Verteiler",
    };
  }

  return ab;
}

/** Eingetragener Stand eines Schritts, sonst „pending“. */
export function eingetragen(schritte: SchrittStand[], nr: number): SchrittStand | undefined {
  return schritte.find((s) => s.schritt === nr);
}
