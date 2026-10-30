import type { Kontakt } from "@/app/api/kontakte/route";
import type { Modul01Objekt } from "@/lib/modul01";
import type { SchrittStand } from "@/app/api/schritte/route";

/**
 * Welcher SOP-Schritt lässt sich aus den Live-Quellen ablesen?
 *
 * Diese Schritte trägt niemand von Hand ein – die Automatik weiß es besser und
 * aktueller. Alles andere bleibt Handarbeit des Teams, und zwar sichtbar:
 * lieber ein leeres Feld, in dem jemand etwas einträgt, als ein grüner Haken,
 * den niemand gesetzt hat.
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
  kontakte: Kontakt[],
  investorenGesamt: number | null,
  offeneFreigaben: number,
): Record<number, Abgeleitet> {
  const ab: Record<number, Abgeleitet> = {};
  const zaehl = (...stufen: string[]) => kontakte.filter((k) => stufen.includes(k.status)).length;

  // 9 · Datenraum aufbauen – Modul 01 weiß, wie weit er ist.
  if (datenraum) {
    const verarbeitet = wert(datenraum, "verarbeitet");
    const abgelegt = wert(datenraum, "abgelegt");
    const offen = datenraum.dokumente?.length ?? 0;
    ab[9] = {
      status: offen === 0 && abgelegt ? "done" : "in_progress",
      wert: `${abgelegt ?? 0} von ${verarbeitet ?? 0} abgelegt, ${offen} zu prüfen`,
      quelle: "Modul 01",
    };
  }

  // 14 · Matching-Liste – gibt es einen Verteiler, ist der Abgleich gelaufen.
  if (investorenGesamt !== null) {
    ab[14] =
      kontakte.length > 0
        ? { status: "done", wert: `${kontakte.length} im Verteiler`, quelle: "Abgleich" }
        : {
            status: "in_progress",
            wert: `${investorenGesamt} Investoren in der Liveliste`,
            quelle: "Liveliste",
          };
  }

  // 15 · Approach-Mailing – der Schritt mit der manuellen Freigabe.
  const angeschrieben = zaehl(
    "angeschrieben",
    "nda_angefragt",
    "nda_unterzeichnet",
    "datenraum_freigegeben",
    "interesse",
    "preisanfrage",
  );
  if (offeneFreigaben > 0) {
    ab[15] = {
      status: "in_progress",
      wert: `${offeneFreigaben} warten auf Freigabe`,
      quelle: "Freigabe-Eingang",
    };
  } else if (angeschrieben > 0) {
    ab[15] = { status: "done", wert: `${angeschrieben} angeschrieben`, quelle: "Verteiler" };
  }

  // 16 · Follow-ups, Q&A, NDA
  const nda = zaehl("nda_angefragt", "nda_unterzeichnet", "datenraum_freigegeben");
  if (nda > 0) {
    const unterzeichnet = zaehl("nda_unterzeichnet", "datenraum_freigegeben");
    ab[16] = {
      status: "in_progress",
      wert: `${unterzeichnet} von ${nda} NDA unterzeichnet`,
      quelle: "Verteiler",
    };
  }

  // 17 · Broker Call – entsteht aus dem Interesse.
  const interesse = zaehl("interesse", "preisanfrage");
  if (interesse > 0) {
    ab[17] = { status: "in_progress", wert: `${interesse} mit Interesse`, quelle: "Verteiler" };
  }

  // 18 · Datenraum Light – nach NDA freigegeben.
  const drFrei = zaehl("datenraum_freigegeben");
  if (drFrei > 0) {
    ab[18] = { status: "in_progress", wert: `${drFrei} haben Zugang`, quelle: "Verteiler" };
  }

  // 19 · Indikatives Angebot – eine Preisanfrage ist der Vorbote.
  const preis = zaehl("preisanfrage");
  if (preis > 0) {
    ab[19] = { status: "in_progress", wert: `${preis} Preisanfragen`, quelle: "Verteiler" };
  }

  return ab;
}

/** Eingetragener Stand eines Schritts, sonst „pending“. */
export function eingetragen(schritte: SchrittStand[], nr: number): SchrittStand | undefined {
  return schritte.find((s) => s.schritt === nr);
}
