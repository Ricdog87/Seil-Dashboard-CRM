import { laufPraefix, type FaktText, type Mandat } from "./mandat";
import type { Modul01Objekt } from "./modul01";

/**
 * Vorschläge aus Modul 01 für die Projektseite.
 *
 * Modul 01 liest beim Sortieren eines Datenraums mit, was die Dokumente über
 * das Objekt sagen – Einheiten, Fläche, Miete, Baujahr … – und liefert das als
 * Vorschlag mit Quelle („6/10, mieterliste“). Ins Mandat kommt davon nichts
 * von selbst: Ein Mensch sieht den Vorschlag und übernimmt ihn mit einem Klick
 * (Termin 02.11.2026: KI schlägt vor, Mensch gibt frei).
 */
export type FaktSchluessel = "assetklasse" | "einheiten" | "flaecheQm" | "jahresnettokaltmiete" | FaktText;

export interface FaktFeld {
  schluessel: FaktSchluessel;
  label: string;
  /** zahl = eigene Spalte am Mandat, text = Eintrag in `fakten`, wahl = Auswahlfeld. */
  art: "zahl" | "text" | "wahl";
  einheit?: string;
  /** So heißt der Kennwert in der Status-API von Modul 01 (ohne „ (Vorschlag)“). */
  modul01: string;
}

export const FAKT_FELDER: readonly FaktFeld[] = [
  { schluessel: "assetklasse", label: "Assetklasse", art: "wahl", modul01: "Assetklasse" },
  { schluessel: "einheiten", label: "Einheiten", art: "zahl", modul01: "Einheiten" },
  { schluessel: "flaecheQm", label: "Mietfläche", art: "zahl", einheit: "m²", modul01: "Fläche" },
  { schluessel: "jahresnettokaltmiete", label: "Jahresnettokaltmiete", art: "zahl", einheit: "€", modul01: "Jahresnettokaltmiete" },
  { schluessel: "baujahr", label: "Baujahr", art: "text", modul01: "Baujahr" },
  { schluessel: "grundstueck", label: "Grundstücksfläche", art: "text", modul01: "Grundstücksfläche" },
  { schluessel: "einheitenMix", label: "Einheiten WE | GE", art: "text", modul01: "Einheiten WE | GE" },
  { schluessel: "leerstand", label: "Leerstand", art: "text", modul01: "Leerstand" },
  { schluessel: "adresse", label: "Objektadresse", art: "text", modul01: "Objektadresse" },
  { schluessel: "flurstuecke", label: "Flurstücke", art: "text", modul01: "Flurstücke" },
];

export interface Vorschlag {
  schluessel: FaktSchluessel;
  label: string;
  /** Wert, wie Modul 01 ihn schreibt („238,6 m²“). */
  wert: string;
  /** Als Zahl gelesen – nur bei Zahlenfeldern, sonst null. */
  zahl: number | null;
  /** Woher der Wert stammt („6/10, mieterliste“). */
  quelle: string | null;
}

/** „25.632 EUR“ → 25632 · „238,6 m²“ → 238.6 · „1.234,56“ → 1234.56 · „3“ → 3. */
export function zahlAusText(text: string | null | undefined): number | null {
  const treffer = String(text ?? "").match(/-?\d[\d.,\s]*/);
  if (!treffer) return null;
  let roh = treffer[0].replace(/\s/g, "").replace(/[.,]+$/, "");
  const punkt = roh.includes(".");
  const komma = roh.includes(",");
  if (punkt && komma) roh = roh.replace(/\./g, "").replace(",", ".");
  else if (komma) roh = roh.replace(",", ".");
  else if (punkt && /^-?\d{1,3}(\.\d{3})+$/.test(roh)) roh = roh.replace(/\./g, "");
  const zahl = Number(roh);
  return Number.isFinite(zahl) ? zahl : null;
}

/** „Modul 01 · Vorschlag (6/10, mieterliste)“ → „6/10, mieterliste“. */
function quelleKurz(quelle: string | null | undefined): string | null {
  const q = String(quelle ?? "").trim();
  if (!q) return null;
  const klammer = q.match(/\(([^)]*)\)/);
  return klammer ? klammer[1] : q.replace(/^Modul 01\s*[·-]?\s*/i, "") || null;
}

/**
 * Die Vorschläge des jüngsten Laufs zu einem Mandat. Läufe gehören über den
 * Lauf-Präfix zum Mandat (Laufname ohne Zeitstempel), so wie der Sync die
 * Mandate anlegt.
 */
export function vorschlaegeAusLaeufen(
  objekte: Modul01Objekt[],
  mandat: { name: string; laufPraefix: string | null },
): { lauf: string | null; vorschlaege: Vorschlag[] } {
  const praefix = mandat.laufPraefix ?? mandat.name;
  const laeufe = objekte
    .filter((o) => laufPraefix(o.objektName ?? "") === praefix)
    .sort((a, b) => String(b.objektName).localeCompare(String(a.objektName)));
  for (const lauf of laeufe) {
    const vorschlaege: Vorschlag[] = [];
    for (const feld of FAKT_FELDER) {
      const k = (lauf.kennwerte ?? []).find(
        (x) => String(x.feld ?? "").replace(/\s*\(Vorschlag\)\s*$/, "").trim() === feld.modul01,
      );
      const wert = String(k?.wert ?? "").trim();
      if (!k || !wert) continue;
      vorschlaege.push({
        schluessel: feld.schluessel,
        label: feld.label,
        wert,
        zahl: feld.art === "zahl" ? zahlAusText(wert) : null,
        quelle: quelleKurz(k.quelle),
      });
    }
    if (vorschlaege.length > 0) return { lauf: lauf.objektName ?? null, vorschlaege };
  }
  return { lauf: laeufe[0]?.objektName ?? null, vorschlaege: [] };
}

const gleichText = (a: string | null | undefined, b: string | null | undefined): boolean =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

/** Was am Mandat zu einem Feld steht – als Text für die Anzeige, null wenn leer. */
export function mandatWert(m: Mandat, schluessel: FaktSchluessel): string | null {
  if (schluessel === "assetklasse") return m.assetklasse || null;
  if (schluessel === "einheiten") return m.einheiten == null ? null : String(m.einheiten);
  if (schluessel === "flaecheQm") return m.flaecheQm == null ? null : String(m.flaecheQm);
  if (schluessel === "jahresnettokaltmiete") return m.jahresnettokaltmiete == null ? null : String(m.jahresnettokaltmiete);
  return m.fakten?.[schluessel] || null;
}

/** Ein Vorschlag ist offen, solange am Mandat etwas anderes (oder nichts) steht. */
export function istOffen(m: Mandat, v: Vorschlag): boolean {
  const ist = mandatWert(m, v.schluessel);
  if (ist === null) return true;
  if (v.zahl !== null) return Math.abs(Number(ist) - v.zahl) > 0.005;
  return !gleichText(ist, v.wert);
}

/** Die Änderung am Mandat, die einen Vorschlag übernimmt. */
export function uebernahme(v: Vorschlag): Partial<Mandat> | null {
  if (v.schluessel === "assetklasse") return { assetklasse: v.wert };
  if (v.schluessel === "einheiten") return v.zahl === null ? null : { einheiten: Math.round(v.zahl) };
  if (v.schluessel === "flaecheQm") return v.zahl === null ? null : { flaecheQm: v.zahl };
  if (v.schluessel === "jahresnettokaltmiete") return v.zahl === null ? null : { jahresnettokaltmiete: v.zahl };
  return { fakten: { [v.schluessel]: v.wert } };
}
