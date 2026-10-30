/**
 * Das Vokabular des Transaktionsprozesses.
 *
 * Die Reihenfolge ist der Weg, den ein Investor nimmt – von vorgemerkt bis zur
 * Preisanfrage. „Abgesagt“ steht bewusst am Ende und nicht dazwischen: es ist
 * kein Zwischenschritt, sondern das Ende dieses Gesprächs.
 */
export const STUFEN = [
  "vorgemerkt",
  "angeschrieben",
  "nda_angefragt",
  "nda_unterzeichnet",
  "datenraum_freigegeben",
  "interesse",
  "preisanfrage",
  "abgesagt",
] as const;
export type Stufe = (typeof STUFEN)[number];

/** Wie die Stufen im Cockpit heißen – das Vokabular des Teams, nicht der Datenbank. */
export const STUFEN_LABEL: Record<Stufe, string> = {
  vorgemerkt: "Vorgemerkt",
  angeschrieben: "Angeschrieben",
  nda_angefragt: "NDA angefragt",
  nda_unterzeichnet: "NDA unterzeichnet",
  datenraum_freigegeben: "Datenraum frei",
  interesse: "Interesse",
  preisanfrage: "Preisanfrage",
  abgesagt: "Abgesagt",
};

/** Farbgebung: was Bewegung ist, was wartet, was vorbei ist. */
export const STUFEN_TON: Record<Stufe, string> = {
  vorgemerkt: "border-seil-line text-seil-muted",
  angeschrieben: "border-seil-line text-seil-body",
  nda_angefragt: "border-seil-warning text-seil-warning",
  nda_unterzeichnet: "border-seil-success text-seil-success",
  datenraum_freigegeben: "border-seil-success text-seil-success",
  interesse: "border-seil-accent text-seil-accent",
  preisanfrage: "border-seil-accent text-seil-accent",
  abgesagt: "border-seil-line text-seil-muted",
};
