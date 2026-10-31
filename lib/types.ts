// Typen des SEIL Cockpit (Modul 02) – reiner Frontend-Prototyp mit Mock-Daten.

/** Statusvokabular der Team-Excel: Done / In Progress / Pending / N.A.
 *  Das dort vereinzelt genutzte „In Vorbereitung" wird im Prototyp auf
 *  Pending abgebildet (siehe ANNAHMEN.md Punkt 3). */
export type SchrittStatus = "done" | "in_progress" | "pending" | "na";

/** Vier Zustände. `unklar` kommt aus SOP 8.1: Das Dokument liegt im richtigen
 *  Ordner, aber eine benötigte Angabe war nicht sicher auffindbar – im Dateinamen
 *  steht dann UNBEKANNT, und der Fall gehört auf die QC-Liste. */
export type DokumentStatus = "vorhanden" | "unklar" | "in_pruefung" | "ausstehend";

export interface DatenraumDokument {
  name: string;
  status: DokumentStatus;
  /** Nur bei `unklar`: welche Angabe fehlt. Wird zum Eintrag auf der QC-Liste. */
  qcHinweis?: string;
}

/** Datenraum-Status – kommt produktiv aus Modul 01, hier nur als Anzeige.
 *  Zwei Stufen nach der SOP vom 18.02.2026, Abschnitt 1:
 *  – `light` (00_Datenraum light): geht raus, **nachdem das NDA unterzeichnet ist**;
 *    reduzierter Ausschnitt mit elf Kategorien, eigentümerbezogene Angaben geschwärzt.
 *  – `full` (99_Datenraum): vollständig, ohne Schwärzung, typischerweise **nach
 *    Abgabe eines indikativen Angebots**.
 *  Light ist keine eigene Struktur, sondern ein Auszug aus Full. */
export type DatenraumStufe = "light" | "full";

export interface Datenraum {
  angefordert: boolean;
  stand?: string; // letzter Sync mit Modul 01 (ISO-Datum)
  /** Welche Stufe Modul 01 bereits aufgebaut hat. */
  stufe?: DatenraumStufe;
  /** Pflichtschritt vor der Bereitstellung des Light-Datenraums (SOP 1.1):
   *  eigentümerbezogene Informationen schwärzen oder entfernen. Solange das
   *  offen ist, darf der Light-Datenraum nicht raus. */
  schwaerzung?: "offen" | "erledigt";
  dokumente: DatenraumDokument[];
}

/** Ein von der KI aus einem Datenraum-Dokument extrahierter Kennwert. */
export interface KiFeld {
  feld: string;
  wert: string;
  quelleDokument: string;
  status: "uebernommen" | "pruefen";
  hinweis?: string;
}

/** Anzeige-Stand der Se-Circle-Anbindung (Kundentermin; Umsetzung als Ausbaustufe). */
export interface SeCircleSync {
  letzterSync: string; // ISO-Datum mit Uhrzeit
  richtung: string; // z. B. "Se Circle → Cockpit"
  feldgruppen: string[];
}

/** Pipeline-Stand von Teaser & Listing: KI-Entwurf → menschliche Pruefung → Versand. */
export interface TeaserStatus {
  stand: "entwurf_pruefung" | "freigegeben" | "versendet";
  entwurfVom: string; // ISO-Datum
  geprueftDurchId?: string;
  versendetAm?: string;
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
  /** Wer die Preisauskunft gibt. Der Standardprozess kennt zwei Varianten und
   *  begründet sie je Mandat („kümmert sich persönlich um dieses Mandat“):
   *  Regelfall ist der Head of Sales, Ausnahme die Geschäftsführung. Preise
   *  werden nie schriftlich beantwortet – dieser Wert steuert, für wen WF 06
   *  die Rückruf-Aufgabe anlegt und welche Vorlage greift. */
  preisauskunftId?: string;
  /** Herkunft des Objekts – die Se-Circle-Anbindung ist als Ausbaustufe vorgesehen. */
  quelle?: "Se Circle" | "Manuell";
  /** Besonderes Merkmal, z. B. Distressed Asset (Transkript: Notlagen-Immobilien). */
  merkmal?: string;
  /** Von der KI aus den Datenraum-Dokumenten ausgelesene Kennwerte (Anzeige).
   *  Jeder Wert traegt seine Quelle und einen Pruefstatus - Uebernahme ins CRM
   *  ist wie die Listen-Freigabe ein Human-in-the-Loop-Schritt. */
  kiFelder?: KiFeld[];
  /** Nur fuer Se-Circle-Objekte: Stand der Plattform-Anbindung (Anzeige). */
  seCircleSync?: SeCircleSync;
  /** Stand von Teaser & Listing - produktiv KI-generiert mit Pruefschritt. */
  teaser?: TeaserStatus;
  /** Status je Prozessschritt (Reihenfolge wie PROZESS_SCHRITTE, 17 Einträge).
   *  Mehrere Schritte können gleichzeitig in Arbeit sein – wie in der Team-Excel. */
  schritte: SchrittStatus[];
  /** Vertretung des Projekt-Leads (Team-Excel: Lead + Vertretung je Objekt). */
  vertretungId?: string;
  /** Freitext-Notiz zum Stand – Pendant zur Notizspalte der Team-Excel. */
  standNotiz?: string;
  /** Kennzahlen aus der Objektliste (Auszug der Excel-Spalten). */
  kennzahlen?: {
    renditeProzent?: number;
    baujahr?: number;
    einheiten?: number;
    leerstandProzent?: number;
    jnkmIstEuro?: number;
    jnkmSollEuro?: number;
  };
  datenraum: Datenraum;
  /** Mehrere Ansprechpartner je Objekt (Unterlagen, Besichtigung vor Ort …), 28.09. */
  ansprechpartner?: Ansprechpartner[];
  /** Herkunft des Datenraum-Status: Demodaten oder live aus Modul 01 (siehe lib/modul01.ts). */
  datenquelle?: "demo" | "modul01";
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
  /** Herkunft des Kontakts – der einmalige Pipedrive-Import ist Teil von Modul 02.
   *  „Liveliste“: Satz stammt aus der täglich gepflegten Investorenliste (OneDrive). */
  quelle?: "Pipedrive-Import" | "Manuell" | "Liveliste";
  /** Die letzten Ankäufe aus der Liveliste – laut Sales-Update 28.09. das Kriterium,
   *  auf das der Vertrieb tatsächlich schaut; ersetzt das feste Ankaufsprofil. */
  letzteAnkaeufe?: { objekt: string; assetklasse: string; region: string; jahr: number }[];
  /** Stand des Liveliste-Satzes (ISO-Datum) – die Liste wird täglich aktualisiert. */
  listeStand?: string;
}

/** Antwortstatus eines Investors zu einem konkreten Objekt. */
export type KontaktStatus =
  | "vorgemerkt" // im Verteiler, Versand noch nicht freigegeben
  | "angeschrieben" // versendet, bisher keine Rückmeldung
  | "interesse" // Antwort erkannt: Interesse → Broker Call
  | "preisanfrage" // Antwort erkannt: Preisanfrage → Rückruf durch die Geschäftsführung (Standardprozess: nur telefonisch)
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
  quelle?: "Modul 01" | "Automatik" | "KI" | "Se Circle" | "Superchat";
}

/** Sichtebene im Cockpit – Beschluss Sales-Update 28.09.: drei Stufen statt zwei.
 *  team = eigene Projekte · leitung = Portfolio über alle Mandate · fuehrung = Gesamtperformance.
 *  stab = Management-Funktionen ohne eigene Mandate (nicht im „Arbeiten als“-Umschalter). */
export type Sichtebene = "team" | "leitung" | "fuehrung" | "stab";

export interface Mitarbeiter {
  id: string;
  name: string;
  kuerzel: string;
  rolle: string;
  ebene: Sichtebene;
  /** Bereich laut Teamübersicht: Management, Sales Leadership oder Staff. */
  bereich?: string;
  /** Funktionen laut Teamübersicht (Buyer Communication, Valuation, Data Room Management …). */
  funktionen?: string[];
  /** Rolle besteht, Stelle ist offen. Die Aufgaben bleiben sichtbar – genau das
   *  ist die Arbeit, die die Automatik tragen muss (ANNAHMEN.md, Punkt 55). */
  unbesetzt?: boolean;
}

/** Ein wartender Mail-Entwurf. Beschluss Sales-Update 28.09.: Entwürfe werden
 *  GESAMMELT im Dashboard freigegeben, nicht einzeln – das Vier-Augen-Prinzip
 *  bleibt (Human in the Loop), der Klickaufwand sinkt. */
export type EntwurfArt = "presound" | "teaser" | "antwort" | "followup";

export interface MailEntwurf {
  id: string;
  objektId: string;
  investorId: string;
  art: EntwurfArt;
  betreff: string;
  erstelltAm: string; // ISO-Datum mit Uhrzeit
  /** Follow-up-Stufe, falls der Entwurf aus der Nachfass-Kette stammt. */
  stufe?: number;
}

/** Tagespriorität eines Mitarbeiters – für die Morgenabstimmung (Wunsch Leitung Sales, 28.09.). */
export interface Tagespriorität {
  id: string;
  mitarbeiterId: string;
  text: string;
  objektId?: string;
  erledigt: boolean;
}

/** Ansprechpartner am Objekt. Besichtigungen laufen oft über Hausverwaltung oder
 *  Hausmeister, Unterlagen über eine andere Person – daher mehrere je Objekt (28.09.). */
export interface Ansprechpartner {
  name: string;
  rolle: string; // z. B. Unterlagen, Besichtigung vor Ort, Eigentümervertretung
  organisation?: string;
  extern?: boolean;
}

/** Eingegangene Antwort aus der Antworterkennung – der Posteingang des Cockpits. */
// Kategorien der Antworterkennung – seit 31.08. deckungsgleich mit dem Entscheidungsbaum
// des Standardprozesses Investorenkommunikation (unterlagen, telefonat ergänzt).
export type SignalArt =
  | "interesse"
  | "preisanfrage"
  | "besichtigung"
  | "frage"
  | "absage"
  | "profil"
  | "unterlagen"
  | "telefonat";

export interface Signal {
  id: string;
  eingegangen: string; // ISO-Datum mit Uhrzeit
  objektId: string;
  investorId: string;
  art: SignalArt;
  auszug: string; // erkannter Kern der Antwort
  empfehlung: string; // was die Automatik vorschlägt
  status: "offen" | "verarbeitet";
  verarbeitungsHinweis?: string; // z. B. "Aufgabe Broker Call erstellt (KV)"
}
