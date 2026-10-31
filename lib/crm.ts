/**
 * Das Vokabular des Investoren-Trichters – die Investorenseite des Flowcharts.
 *
 * Die Reihenfolge ist der Weg eines Investors durch die Schritte 13 bis 17:
 * aus dem Matching vorgemerkt, mit der Approach-Mail angeschrieben, dann der
 * Standardprozess – Anfrage und Exposé, NDA, Datenraum, Preisfrage,
 * Besichtigung. „Abgesagt“ steht am Ende und nicht dazwischen: es ist kein
 * Zwischenschritt, sondern das Ende dieses Gesprächs – und laut Standardprozess
 * der Anlass, nach den Investment-Kriterien zu fragen.
 */
export const STUFEN = [
  "vorgemerkt",
  "angeschrieben",
  "interesse",
  "nda_angefragt",
  "nda_unterzeichnet",
  "datenraum_freigegeben",
  "preisanfrage",
  "besichtigung",
  "abgesagt",
] as const;
export type Stufe = (typeof STUFEN)[number];

/** Wie die Stufen im Cockpit heißen – das Vokabular des Teams, nicht der Datenbank. */
export const STUFEN_LABEL: Record<Stufe, string> = {
  vorgemerkt: "Vorgemerkt",
  angeschrieben: "Angeschrieben",
  interesse: "Anfrage / Exposé",
  nda_angefragt: "NDA angefragt",
  nda_unterzeichnet: "NDA unterzeichnet",
  datenraum_freigegeben: "Datenraum frei",
  preisanfrage: "Preisfrage",
  besichtigung: "Besichtigung",
  abgesagt: "Abgesagt",
};

/** Welcher Schritt des Flowcharts hinter der Stufe steht. */
export const STUFEN_SOP: Record<Stufe, string> = {
  vorgemerkt: "SOP 13 · Matching / Investorenliste",
  angeschrieben: "SOP 14 · Approach-Mail mit Teaser",
  interesse: "SOP 15 · Anfrage kommt rein → Exposé",
  nda_angefragt: "SOP 15 · NDA unterwegs",
  nda_unterzeichnet: "SOP 15 · NDA liegt vor",
  datenraum_freigegeben: "SOP 15 · Datenraum freigegeben",
  preisanfrage: "SOP 16/17 · Pricing – nur telefonisch",
  besichtigung: "SOP 17 · Site visit",
  abgesagt: "Standardprozess · Kriterien erfragen",
};

/** Rang im Trichter: Antworten bewegen nur vorwärts, außer bei Absage. */
export const RANG: Record<Stufe, number> = STUFEN.reduce(
  (acc, s, i) => ({ ...acc, [s]: s === "abgesagt" ? 99 : i }),
  {} as Record<Stufe, number>,
);

/** Farbgebung: was Bewegung ist, was wartet, was vorbei ist. */
export const STUFEN_TON: Record<Stufe, string> = {
  vorgemerkt: "border-seil-line text-seil-muted",
  angeschrieben: "border-seil-line text-seil-body",
  interesse: "border-seil-accent text-seil-accent",
  nda_angefragt: "border-seil-warning text-seil-warning",
  nda_unterzeichnet: "border-seil-success text-seil-success",
  datenraum_freigegeben: "border-seil-success text-seil-success",
  preisanfrage: "border-seil-accent text-seil-accent",
  besichtigung: "border-seil-accent text-seil-accent",
  abgesagt: "border-seil-line text-seil-muted",
};

/** Stufen, in denen der Investor geantwortet hat (für Quoten). */
export const GEANTWORTET: readonly Stufe[] = [
  "interesse",
  "nda_angefragt",
  "nda_unterzeichnet",
  "datenraum_freigegeben",
  "preisanfrage",
  "besichtigung",
];

/** Stufen ab der Approach-Mail (für „angeschrieben“-Zählungen). */
export const ANGESCHRIEBEN: readonly Stufe[] = ["angeschrieben", ...GEANTWORTET];
