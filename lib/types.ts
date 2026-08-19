// Typen des SEIL Cockpit (Modul 02) – reiner Frontend-Prototyp mit Mock-Daten.

export type PhaseStatus = "abgeschlossen" | "aktiv" | "offen";

export type DokumentStatus = "vorhanden" | "in_pruefung" | "ausstehend";

export interface DatenraumDokument {
  name: string;
  status: DokumentStatus;
}

/** Datenraum-Status – kommt produktiv aus Modul 01, hier nur als Anzeige. */
export interface Datenraum {
  angefordert: boolean;
  stand?: string; // letzter Sync mit Modul 01 (ISO-Datum)
  dokumente: DatenraumDokument[];
}

export interface Objekt {
  id: string;
  name: string;
  adresse: string;
  stadt: string;
  assetklasse: string;
  flaeche: string; // Anzeigetext, z. B. "14.200 m² Mietfläche"
  kaufpreisMio: number; // Kaufpreisvorstellung in Mio. €
  auftraggeberId: string;
  zustaendigId: string;
  /** Herkunft des Objekts – Se Circle wird produktiv direkt angebunden. */
  quelle?: "Se Circle" | "Manuell";
  /** Besonderes Merkmal, z. B. Distressed Asset (Transkript: Notlagen-Immobilien). */
  merkmal?: string;
  /** Von der KI aus den Datenraum-Dokumenten ausgelesene Kennwerte (Anzeige). */
  kiExtrakt?: string[];
  /** Status der 6 Schritte auf der Eigentümerseite (Reihenfolge wie EIGENTUEMER_SCHRITTE) */
  eigentuemerPhasen: PhaseStatus[];
  /** Status der 6 Schritte auf der Investorenseite (Reihenfolge wie INVESTOREN_SCHRITTE) */
  investorenPhasen: PhaseStatus[];
  datenraum: Datenraum;
  /** Nur für Objekte in Vermarktung: Stand der Listen-Freigabe (Human-in-the-Loop) */
  freigabe?: {
    status: "ausstehend" | "erteilt";
    durchId?: string;
    am?: string;
  };
}

export interface Auftraggeber {
  id: string;
  firma: string;
  ansprechpartner: string;
  telefon: string;
  email: string;
}

export interface Investor {
  id: string;
  firma: string;
  typ: string; // z. B. Family Office, Fondsmanager …
  ansprechpartner: string;
  email: string;
  telefon: string;
  ticketMinMio: number;
  ticketMaxMio: number;
  assetklassen: string[];
  regionen: string[];
  notiz?: string;
  /** Herkunft des Kontakts – der einmalige Pipedrive-Import ist Teil von Modul 02. */
  quelle?: "Pipedrive-Import" | "Manuell";
}

/** Antwortstatus eines Investors zu einem konkreten Objekt. */
export type KontaktStatus =
  | "vorgemerkt" // im Verteiler, Versand noch nicht freigegeben
  | "angeschrieben" // versendet, bisher keine Rückmeldung
  | "interesse" // Antwort erkannt: Interesse → Broker Call
  | "preisanfrage" // Antwort erkannt: Preisanfrage → Investment-Team
  | "nda_unterzeichnet"
  | "datenraum_freigegeben"
  | "abgesagt";

export interface ObjektInvestorLink {
  objektId: string;
  investorId: string;
  status: KontaktStatus;
  followUpStufe: 0 | 1 | 2 | 3;
  letzterKontakt?: string; // ISO-Datum
  naechstesFollowUp?: string; // ISO-Datum, wenn Automatik geplant
  hinweis?: string;
}

export type AufgabenTyp =
  | "broker_call"
  | "preisanfrage"
  | "freigabe"
  | "datenraum"
  | "unterlagen"
  | "nda"
  | "sonstiges";

export interface Aufgabe {
  id: string;
  titel: string;
  typ: AufgabenTyp;
  faellig: string; // ISO-Datum
  mitarbeiterId: string;
  objektId?: string;
  investorId?: string;
  erledigt: boolean;
}

export type AktivitaetTyp =
  | "mail_ausgang"
  | "mail_eingang"
  | "anruf"
  | "system" // Automatik: Follow-up, Antworterkennung, Modul 01 …
  | "notiz";

export interface Aktivitaet {
  id: string;
  datum: string; // ISO-Datum mit Uhrzeit
  typ: AktivitaetTyp;
  text: string;
  objektId?: string;
  investorId?: string;
  auftraggeberId?: string;
  mitarbeiterId?: string;
  quelle?: "Modul 01" | "Automatik" | "KI" | "Se Circle";
}

export interface Mitarbeiter {
  id: string;
  name: string;
  kuerzel: string;
  rolle: string;
}
