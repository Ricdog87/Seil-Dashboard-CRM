import type { Phase } from "@/lib/mandat";

/**
 * Leistung: Ziel gegen Ist, für jede Person und für das Team.
 *
 * Sechs Kennzahlen, die ein Makler-Team wirklich bewegen kann – vom Anschreiben
 * bis zum realisierten Honorar. Umsatz ist realisiertes Honorar am Abschlusstag,
 * nicht Hoffnung. Hoffnung heißt hier Pipeline-Wert und ist nach Phase
 * gewichtet, wie es in der Branche üblich ist.
 */
export const KPI_ARTEN = ["umsatz", "abschluesse", "mandate", "anschreiben", "nda", "broker_calls"] as const;
export type KpiArt = (typeof KPI_ARTEN)[number];

export const KPI_META: Record<KpiArt, { label: string; einheit: "eur" | "anzahl"; kurz: string; woher: string }> = {
  umsatz: { label: "Umsatz", einheit: "eur", kurz: "realisiertes Honorar", woher: "Honorar realisiert am Mandat, am Abschlusstag" },
  abschluesse: { label: "Abschlüsse", einheit: "anzahl", kurz: "Signings", woher: "Mandate mit Abschlussdatum im Zeitraum" },
  mandate: { label: "Neue Mandate", einheit: "anzahl", kurz: "gewonnen", woher: "Mandate, die im Zeitraum angelegt wurden" },
  anschreiben: { label: "Anschreiben", einheit: "anzahl", kurz: "Investoren angeschrieben", woher: "Anschreiben, die du zur Freigabe gegeben hast" },
  nda: { label: "NDAs", einheit: "anzahl", kurz: "unterzeichnet", woher: "Investoren, die im Trichter auf „NDA unterzeichnet“ gingen" },
  broker_calls: { label: "Broker Calls", einheit: "anzahl", kurz: "geführt", woher: "erledigte Aufgaben „Broker Call“" },
};

/** Gewichtung des erwarteten Honorars nach Phase – Branchenüblich, mit SEIL abzustimmen. */
export const PHASEN_GEWICHT: Record<Phase, number> = {
  akquise: 0.1,
  vorbereitung: 0.25,
  vermarktung: 0.5,
  angebote: 0.75,
  abschluss: 1,
  ruht: 0,
  verloren: 0,
};

export interface PersonLeistung {
  /** null = das ganze Team */
  kuerzel: string | null;
  name: string;
  ist: Record<KpiArt, number>;
  ziel: Partial<Record<KpiArt, number>>;
  /** Summe erwartetes Honorar aktiver Mandate, ungewichtet. */
  pipelineWert: number;
  /** Nach Phase gewichtet – die ehrlichere Zahl. */
  pipelineGewichtet: number;
  aktiveMandate: number;
}

export interface Leistung {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  zeitraum: string;
  zeitraumLabel: string;
  /** Anteil des Zeitraums, der schon vorbei ist – zum Vergleich mit dem Zielerreichungsgrad. */
  zeitAnteil: number;
  team: PersonLeistung;
  /** Geschäftsführung: alle. Sonst: nur die eigene Zeile. */
  personen: PersonLeistung[];
  darfAlles: boolean;
}

/** "2026-Q4" | "2026" | "2026-11" */
export function aktuellerZeitraum(art: "quartal" | "jahr" | "monat" = "quartal", d = new Date()): string {
  const j = d.getFullYear();
  if (art === "jahr") return String(j);
  if (art === "monat") return `${j}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${j}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}

export function zeitraumGrenzen(z: string): { von: Date; bis: Date; label: string } {
  const q = /^(\d{4})-Q([1-4])$/.exec(z);
  if (q) {
    const j = Number(q[1]), n = Number(q[2]);
    const von = new Date(j, (n - 1) * 3, 1);
    const bis = new Date(j, n * 3, 1);
    return { von, bis, label: `Q${n} ${j}` };
  }
  const m = /^(\d{4})-(\d{2})$/.exec(z);
  if (m) {
    const j = Number(m[1]), mo = Number(m[2]);
    const von = new Date(j, mo - 1, 1);
    return { von, bis: new Date(j, mo, 1), label: von.toLocaleDateString("de-DE", { month: "long", year: "numeric" }) };
  }
  const j = Number(z) || new Date().getFullYear();
  return { von: new Date(j, 0, 1), bis: new Date(j + 1, 0, 1), label: String(j) };
}

export function zeitAnteil(z: string, jetzt = new Date()): number {
  const { von, bis } = zeitraumGrenzen(z);
  const a = (jetzt.getTime() - von.getTime()) / (bis.getTime() - von.getTime());
  return Math.max(0, Math.min(1, a));
}

export function fmtEur(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 2 })} Mio. €`;
  if (Math.abs(n) >= 10_000) return `${Math.round(n / 1000).toLocaleString("de-DE")} T€`;
  return `${Math.round(n).toLocaleString("de-DE")} €`;
}

export function fmtKpi(art: KpiArt, n: number): string {
  return KPI_META[art].einheit === "eur" ? fmtEur(n) : String(Math.round(n));
}

/** Zielerreichung in Prozent, gedeckelt bei 999, damit ein Nullziel nichts sprengt. */
export function erreichung(ist: number, ziel: number | undefined): number | null {
  if (!ziel || ziel <= 0) return null;
  return Math.min(999, Math.round((ist / ziel) * 100));
}

/**
 * Ein Satz, der motiviert, ohne zu flunkern. Kein Konfetti – ein klarer Blick
 * darauf, wo man steht und was noch fehlt.
 */
export function motivation(art: KpiArt, ist: number, ziel: number | undefined, anteil: number): string {
  if (!ziel || ziel <= 0) return "Noch kein Ziel gesetzt.";
  const p = ist / ziel;
  const fehlt = Math.max(0, ziel - ist);
  const fehltText = KPI_META[art].einheit === "eur" ? fmtEur(fehlt) : String(Math.ceil(fehlt));
  if (p >= 1) return p >= 1.2 ? "Ziel deutlich übertroffen." : "Ziel erreicht.";
  if (p >= anteil) return `Vor dem Plan – noch ${fehltText} bis zum Ziel.`;
  if (p >= anteil * 0.7) return `Auf Kurs, knapp hinter dem Plan – noch ${fehltText}.`;
  return `Noch ${fehltText} bis zum Ziel – der Zeitraum ist zu ${Math.round(anteil * 100)} % vorbei.`;
}
