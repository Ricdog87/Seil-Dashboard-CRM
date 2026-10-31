/**
 * Der SEIL Transaction Process – das Flowchart des Teams, Schritt für Schritt.
 *
 * Quelle: „SEIL Transaction Process Flowchart“ (Übergabe 31.10.2026), drei
 * Bahnen – Responsible, Tool, Task – und 17 Kästen von „Portfolio for
 * potential Exit“ bis „Broker Call“. Die Bezeichnungen stehen hier wörtlich,
 * damit das Team sein eigenes Diagramm wiedererkennt; `kurz` ist die deutsche
 * Kurzform für enge Spalten. Was heute statt Pipedrive das Cockpit übernimmt,
 * steht in `heute`.
 *
 * Schritt 15 („E-Mail-Communication, Standard Process“) ist im Flowchart ein
 * Kasten und im Cockpit ein eigenes Regelwerk: `lib/kommunikation.ts`, der
 * Standardprozess Kommunikation Investoren. Herkunft und Entscheidungen:
 * ANNAHMEN.md ab Punkt 107.
 */
export type SchrittVerantwortung = "extern" | "team" | "automatik" | "freigabe";

export interface ProzessSchritt {
  nr: number;
  /** Deutsche Kurzform für Spalten und Karten. */
  kurz: string;
  /** Wörtlich aus dem Flowchart (Task-Bahn). */
  lang: string;
  /** Wörtlich aus dem Flowchart (Responsible-Bahn). Mehrere Bahnen mit „ / “. */
  verantwortlich: string;
  /** Wörtlich aus dem Flowchart (Tool-Bahn). */
  tool: string;
  /** Was den Schritt heute trägt – falls nicht mehr das Tool aus dem Flowchart. */
  heute?: string;
  /** Wer ihn im Cockpit bewegt: Team von Hand, Automatik abgeleitet, Freigabe, extern. */
  verantwortung: SchrittVerantwortung;
  beschreibung: string;
}

/** Zweiteilung (Kundentermin): erst Auftraggeber-, dann Investorenseite. */
export type ProzessSeite = "auftraggeber" | "investoren";

export interface ProzessPhase {
  titel: string;
  vonNr: number;
  bisNr: number;
  seite: ProzessSeite;
  /** Pipeline-Phase eines Mandats, das in diesem Abschnitt steht. */
  mandatPhase: "akquise" | "vorbereitung" | "vermarktung";
}

/**
 * Das Flowchart kennt keine Phasen – nur die Reihenfolge. Diese vier Abschnitte
 * sind die Lesehilfe des Cockpits (Pipeline-Spalten, Fortschrittsbalken) und
 * folgen den Brüchen im Diagramm: Bewertung, Vertrag & Vorbereitung,
 * Ansprache, Kommunikation.
 */
export const PROZESS_PHASEN: readonly ProzessPhase[] = [
  { titel: "Mandat & Bewertung", vonNr: 1, bisNr: 4, seite: "auftraggeber", mandatPhase: "akquise" },
  { titel: "Vertrag & Vorbereitung", vonNr: 5, bisNr: 12, seite: "auftraggeber", mandatPhase: "vorbereitung" },
  { titel: "Investorenansprache", vonNr: 13, bisNr: 14, seite: "investoren", mandatPhase: "vermarktung" },
  { titel: "Kommunikation & Gespräche", vonNr: 15, bisNr: 17, seite: "investoren", mandatPhase: "vermarktung" },
] as const;

export const SEITEN_LABEL: Record<ProzessSeite, string> = {
  auftraggeber: "Auftraggeberseite",
  investoren: "Investorenseite",
};

export const PROZESS_SCHRITTE: readonly ProzessSchritt[] = [
  { nr: 1, kurz: "Portfolio für Exit", lang: "Portfolio for potential Exit", verantwortlich: "Client", tool: "—", verantwortung: "extern",
    beschreibung: "Der Auftraggeber bringt ein Portfolio oder Objekt für einen möglichen Exit. Im Cockpit: ein Kunde der Art „Auftraggeber“ und ein neues Mandat." },
  { nr: 2, kurz: "NDA & Rent Roll", lang: "Draft NDA · Request Rent Roll / Data Room (via E-Mail)", verantwortlich: "Legal Team", tool: "Word/PDF", verantwortung: "extern",
    beschreibung: "NDA mit dem Auftraggeber entwerfen; Mieterliste und Datenraum per E-Mail anfordern. Die Checkliste am Mandat hält fest, was angefordert ist." },
  { nr: 3, kurz: "Excel-Valuation", lang: "Excel Valuation on single Property Basis", verantwortlich: "Investment Team (India)", tool: "Excel", verantwortung: "team",
    beschreibung: "Bewertung je Einzelobjekt in Excel." },
  { nr: 4, kurz: "Valuation-Präsentation", lang: "Presentation with Valuation and Sales Strategy", verantwortlich: "Investment Team (India)", tool: "PowerPoint", verantwortung: "team",
    beschreibung: "Präsentation mit Bewertung und Vermarktungsstrategie für den Auftraggeber." },
  { nr: 5, kurz: "Service Agreement", lang: "Draft Service Agreement (via E-Mail)", verantwortlich: "Legal Team", tool: "Word/PDF", verantwortung: "extern",
    beschreibung: "Service Agreement entwerfen und per E-Mail abstimmen – die Mandatsgrundlage." },
  { nr: 6, kurz: "Legitimation", lang: "Draft Legitimation (via E-Mail)", verantwortlich: "Legal Team", tool: "Word/PDF", verantwortung: "extern",
    beschreibung: "Legitimation / Vollmacht entwerfen – SEIL tritt für den Auftraggeber nach außen auf." },
  { nr: 7, kurz: "Standarddokumente anfordern", lang: "Request for Standard Documents (via E-Mail)", verantwortlich: "Investment Team (India)", tool: "Outlook", verantwortung: "team",
    beschreibung: "Die Standarddokumente beim Auftraggeber anfordern. Die zwanzig Kategorien der Datenraum-SOP stehen als Checkliste am Mandat." },
  { nr: 8, kurz: "Datenraum anlegen", lang: "Create Data Room according to Standard Structure", verantwortlich: "Investment Team (India)", tool: "OneDrive", verantwortung: "automatik",
    heute: "Modul 01", beschreibung: "Datenraum nach Standardstruktur – Modul 01 sortiert und prüft, der Stand wird hier abgeleitet." },
  { nr: 9, kurz: "Deal anlegen", lang: "Create new Deal Pipedrive", verantwortlich: "Investment Team (India)", tool: "Pipedrive", verantwortung: "automatik",
    heute: "Cockpit", beschreibung: "Der Deal ist das Mandat im Cockpit. Sobald es angelegt ist, gilt der Schritt als erledigt – Pipedrive entfällt." },
  { nr: 10, kurz: "Onepager", lang: "Create Onepager", verantwortlich: "Investment Team (India)", tool: "PowerPoint", verantwortung: "team",
    beschreibung: "Onepager / Teaser für die Ansprache erstellen." },
  { nr: 11, kurz: "Fotograf organisieren", lang: "Organize Photographers for Property Pictures", verantwortlich: "Investment Team (India)", tool: "Outlook", verantwortung: "team",
    beschreibung: "Fotografen für die Objektaufnahmen beauftragen." },
  { nr: 12, kurz: "Kickoff Call center", lang: "Kickoff with Call center · Provide relevant Information / Briefing", verantwortlich: "Broker / Call center", tool: "Teams", verantwortung: "team",
    beschreibung: "Kickoff mit dem Call center in Teams: Briefing, Unterlagen, Argumentation." },
  { nr: 13, kurz: "Matching / Investorenliste", lang: "Matching / Investors List (E-Mail-Addresses)", verantwortlich: "Investment Team (India)", tool: "Pipedrive · Excel?", verantwortung: "automatik",
    heute: "Cockpit", beschreibung: "Abgleich der Liveliste mit dem Objekt – Standort, Assetklasse, Ticket. Wer passt, kommt in den Verteiler (vorgemerkt)." },
  { nr: 14, kurz: "Approach-Mail (BCC, Teaser)", lang: "Investors Approach-E-Mail · BCC Mailing with Teaser", verantwortlich: "Investment Team (India)", tool: "Outlook", verantwortung: "freigabe",
    heute: "Cockpit → Freigabe → Versand", beschreibung: "Anschreiben an den Verteiler mit Teaser. Geht erst nach Freigabe im Cockpit raus (Human-in-the-Loop)." },
  { nr: 15, kurz: "E-Mail-Kommunikation (Standardprozess)", lang: "E-Mail-Communication (Standard Process / E-Mails): Feedbacks, Follow-Ups, Q&A, NDA, Data room", verantwortlich: "Investment Team (India)", tool: "Outlook", verantwortung: "automatik",
    heute: "Cockpit + Automatik", beschreibung: "Der Standardprozess Kommunikation Investoren: Antwort erkennen, Vorlage wählen, Follow-up-Leiter (1., 2., weitere, Final), NDA und Datenraum. Jede Antwort bewegt den Trichter." },
  { nr: 16, kurz: "Phone Call", lang: "Phone Call (Standard Process / Questions)", verantwortlich: "Call center", tool: "Pipedrive · Activities", verantwortung: "team",
    heute: "Cockpit-Aufgaben", beschreibung: "Telefonische Nachfassung durch das Call center; die Anrufe stehen als Aufgaben (Activities) am Investor." },
  { nr: 17, kurz: "Broker Call", lang: "Broker Call · Feedback on open Questions, Pricing, Site visit", verantwortlich: "Broker", tool: "Pipedrive · Activities", verantwortung: "team",
    heute: "Cockpit-Aufgaben", beschreibung: "Das Gespräch des Brokers: offene Fragen, Preis (nur telefonisch durch die Geschäftsführung), Besichtigung. Entsteht als Aufgabe aus den Antworten." },
] as const;

/** Index (0-basiert) des Human-in-the-Loop-Schritts: die Approach-Mail geht erst nach Freigabe raus. */
export const FREIGABE_SCHRITT_INDEX = 13;

/** Farben der Tool-Bahn, wie im Flowchart – damit die Kacheln so aussehen wie das Diagramm. */
export const TOOL_FARBE: Record<string, { bg: string; fg: string }> = {
  "Word/PDF": { bg: "#00b0f0", fg: "#ffffff" },
  Excel: { bg: "#1e6b2e", fg: "#ffffff" },
  PowerPoint: { bg: "#c00000", fg: "#ffffff" },
  Outlook: { bg: "#4a86d0", fg: "#ffffff" },
  OneDrive: { bg: "#bde3f5", fg: "#1a1a1e" },
  Pipedrive: { bg: "#7f7f7f", fg: "#ffffff" },
  Teams: { bg: "#4b1f4e", fg: "#ffffff" },
};

/** Farben der Responsible-Bahn, wie im Flowchart. */
export const LANE_FARBE: Record<string, { bg: string; fg: string }> = {
  Client: { bg: "#ffffff", fg: "#1a1a1e" },
  "Legal Team": { bg: "#d9d9d9", fg: "#1a1a1e" },
  "Investment Team (India)": { bg: "#fbe5d6", fg: "#1a1a1e" },
  Broker: { bg: "#c6efce", fg: "#1a1a1e" },
  "Call center": { bg: "#e8cfef", fg: "#1a1a1e" },
};

/** Erste Tool-Nennung eines Schritts („Pipedrive · Activities“ → „Pipedrive“). */
export function toolBasis(tool: string): string {
  return tool.split(/\s*[·?]\s*/)[0]?.trim() || tool;
}

/** Abschnitt eines Schritts. */
export function phaseVon(nr: number): ProzessPhase | undefined {
  return PROZESS_PHASEN.find((p) => nr >= p.vonNr && nr <= p.bisNr);
}

// ---------------------------------------------------------------------------
// Datenraum-SOP: die Standarddokumente (Schritt 7) und der Datenraum light (Schritt 15, nach NDA)
// ---------------------------------------------------------------------------

/** Die 20 Kategorien der SOP „Anlage und Standardisierung eines SEIL REAL ESTATE
 *  Datenraums“ (18.02.2026), in der Reihenfolge der Terminologie-Tabelle. Die
 *  Namen sind die Ordnernamen der SOP – bewusst wortgetreu, damit die Lückenliste
 *  dieselben Begriffe zeigt wie der Datenraum selbst (ANNAHMEN.md, Punkt 57). */
export const STANDARD_DOKUMENTE = [
  "Mieterliste",
  "Altlasten",
  "Baulasten",
  "Denkmalschutz",
  "Grundbuch",
  "Grundrisse",
  "Ansichten",
  "Schnitte",
  "Kataster",
  "Bilder",
  "Betriebskosten",
  "Mietverträge",
  "Energienachweis",
  "Versicherungen",
  "Bauakte",
  "Mietrückstände",
  "Grundsteuer",
  "Brandschutz",
  "Wartungs- und Serviceverträge",
  "Gutachten",
] as const;

/** Der 00_Datenraum light ist keine eigene Struktur, sondern ein reduzierter und
 *  geschwärzter Ausschnitt des 99_Datenraums (SOP, Abschnitt 1). Diese elf
 *  Kategorien gehören laut Terminologie-Tabelle hinein. */
export const LIGHT_KATEGORIEN: readonly string[] = [
  "Mieterliste",
  "Altlasten",
  "Baulasten",
  "Denkmalschutz",
  "Grundbuch",
  "Grundrisse",
  "Ansichten",
  "Schnitte",
  "Kataster",
  "Bilder",
  "Energienachweis",
];

/** Stand eines Standarddokuments beim Auftraggeber (Schritt 7). */
export const DOKUMENT_STATUS = ["fehlt", "angefordert", "liegt_vor", "nicht_noetig"] as const;
export type DokumentStatus = (typeof DOKUMENT_STATUS)[number];
