/**
 * Mandate, Aufgaben, Notizen, Aktivitäten – die Begriffe des CRM.
 *
 * Ein Mandat ist nicht dasselbe wie ein Datenraum-Lauf. Es lebt länger: es hat
 * einen Namen, eine Stadt und einen Zuständigen, bevor der erste Ordner
 * hochgeladen wird, und es bleibt bestehen, wenn ein zweiter Lauf kommt.
 */

export const PHASEN = [
  "akquise",
  "vorbereitung",
  "vermarktung",
  "angebote",
  "abschluss",
  "ruht",
  "verloren",
] as const;
export type Phase = (typeof PHASEN)[number];

export const PHASE_LABEL: Record<Phase, string> = {
  akquise: "Akquise",
  vorbereitung: "Vorbereitung",
  vermarktung: "Vermarktung",
  angebote: "Angebote",
  abschluss: "Abschluss",
  ruht: "Ruht",
  verloren: "Verloren",
};

export const PHASE_TON: Record<Phase, string> = {
  akquise: "border-seil-line text-seil-muted",
  vorbereitung: "border-seil-line text-seil-body",
  vermarktung: "border-seil-accent text-seil-accent",
  angebote: "border-seil-accent text-seil-accent",
  abschluss: "border-seil-success text-seil-success",
  ruht: "border-seil-line text-seil-muted",
  verloren: "border-seil-line text-seil-muted",
};

export interface Mandat {
  id: string;
  name: string;
  stadt: string | null;
  assetklasse: string | null;
  auftraggeber: string | null;
  phase: Phase;
  zustaendig: string | null;
  laufPraefix: string | null;
  notiz: string | null;
  erstellt: string | null;
  geaendert: string | null;
  geaendertDurch: string | null;
}

export interface Aufgabe {
  id: string;
  titel: string;
  objekt: string | null;
  investorId: string | null;
  zustaendig: string | null;
  faellig: string | null;
  erledigt: boolean;
  quelle: string;
  notiz: string | null;
  erstellt: string | null;
}

export interface Notiz {
  id: string;
  objekt: string;
  text: string;
  autor: string | null;
  erstellt: string | null;
}

export const AKTIVITAET_ARTEN = [
  "mandat",
  "schritt",
  "kontakt",
  "versand",
  "freigabe",
  "aufgabe",
  "notiz",
  "datenraum",
] as const;
export type AktivitaetArt = (typeof AKTIVITAET_ARTEN)[number];

export interface Aktivitaet {
  id: string;
  mandat: string | null;
  investorId: string | null;
  art: AktivitaetArt;
  text: string;
  durch: string | null;
  erstellt: string;
}

/** "Portfolio-Otto-Probe-30-10_20261030-070222" → Name ohne Zeitstempel. */
export function laufPraefix(roh: string): string {
  return roh.replace(/_\d{8}-\d{6}$/, "");
}

/** Fällig heute oder früher – und noch offen. */
export function istFaellig(a: Aufgabe, heute = new Date()): boolean {
  if (a.erledigt || !a.faellig) return false;
  const d = new Date(a.faellig);
  const t = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  return d.getTime() <= t.getTime() + 86_400_000 - 1;
}

/** Überfällig – gestern oder früher. */
export function istUeberfaellig(a: Aufgabe, heute = new Date()): boolean {
  if (a.erledigt || !a.faellig) return false;
  const d = new Date(a.faellig);
  const t = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  return d.getTime() < t.getTime();
}

export function fmtDatum(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function fmtZeitpunkt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}
