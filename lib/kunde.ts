/**
 * Die Kundenebene des CRM.
 *
 * Die Stammdaten der Investoren stehen in der Liveliste in OneDrive und bleiben
 * dort – der Vertrieb pflegt sie, wo er ohnehin arbeitet. Was die Liste nicht
 * kann, steht in der Datenbank und wird darübergelegt: wer betreut, wie weit
 * das Verhältnis ist, was zuletzt besprochen wurde.
 *
 * Ein Kunde kann also aus zwei Quellen stammen. Welche es ist, bleibt sichtbar.
 */

export const ARTEN = ["investor", "auftraggeber", "interessent", "partner"] as const;
export type Art = (typeof ARTEN)[number];

export const ART_LABEL: Record<Art, string> = {
  investor: "Investor",
  auftraggeber: "Auftraggeber",
  interessent: "Interessent",
  partner: "Partner",
};

export const STUFEN = ["neu", "kontaktiert", "aktiv", "bestand", "ruht", "kein_interesse"] as const;
export type Stufe = (typeof STUFEN)[number];

export const STUFE_LABEL: Record<Stufe, string> = {
  neu: "Neu",
  kontaktiert: "Kontaktiert",
  aktiv: "Aktiv im Deal",
  bestand: "Bestandskunde",
  ruht: "Ruht",
  kein_interesse: "Kein Interesse",
};

export const STUFE_TON: Record<Stufe, string> = {
  neu: "border-seil-line text-seil-muted",
  kontaktiert: "border-seil-line text-seil-body",
  aktiv: "border-seil-accent text-seil-accent",
  bestand: "border-seil-success text-seil-success",
  ruht: "border-seil-line text-seil-muted",
  kein_interesse: "border-seil-line text-seil-muted",
};

export interface Kunde {
  id: string;
  investorId: string | null;
  firma: string;
  ansprechpartner: string | null;
  email: string | null;
  telefon: string | null;
  art: Art;
  stufe: Stufe;
  betreuer: string | null;
  regionen: string[];
  assetklassen: string[];
  notiz: string | null;
  quelle: "liveliste" | "cockpit";
  geaendert: string | null;
  geaendertDurch: string | null;
}

/**
 * Was im Cockpit angezeigt wird: die Liveliste, über die der CRM-Stand gelegt
 * ist. Einträge ohne CRM-Zeile sind nicht schlechter – sie sind nur noch nicht
 * angefasst worden, und genau das soll man ihnen ansehen.
 */
export interface KundeAnsicht {
  id: string;
  firma: string;
  ansprechpartner: string | null;
  email: string | null;
  telefon: string | null;
  regionen: string[];
  assetklassen: string[];
  ticketMinMio: number | null;
  ticketMaxMio: number | null;
  letzteAnkaeufe: string[];
  art: Art;
  stufe: Stufe;
  betreuer: string | null;
  notiz: string | null;
  /** „liveliste“ = steht in OneDrive, „cockpit“ = hier angelegt, „beides“ = hier gepflegt. */
  herkunft: "liveliste" | "cockpit" | "beides";
}
