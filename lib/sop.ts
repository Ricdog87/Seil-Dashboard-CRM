/**
 * Der SEIL-Transaktionsprozess – 26 Schritte in vier Phasen.
 *
 * Das ist keine Demo und kein Entwurf: es ist die SOP des Teams, aus deren
 * Excel übernommen und im Kundentermin bestätigt. Deshalb steht sie hier und
 * nicht mehr zwischen den Beispieldaten. Das Cockpit bildet diesen Ablauf ab,
 * nicht einen eigenen.
 *
 * Herkunft und Abweichungen von der Excel sind in ANNAHMEN.md Punkt 2
 * beschrieben (zusammengefasste Schritte, Nummerierung, Phasentitel).
 */
export type SchrittVerantwortung = "team" | "backoffice" | "automatik" | "freigabe" | "extern";

export interface ProzessSchritt {
  nr: number;
  kurz: string;
  lang: string;
  verantwortlich: string; // wie in der Excel: Client, Legal Team, Investment Team …
  verantwortung: SchrittVerantwortung;
  tool: string; // heutiges Werkzeug lt. Excel
  beschreibung: string;
}

/** Zweiteilung des Prozesses (Kundentermin): erst Auftraggeber-, dann Investorenseite. */
export type ProzessSeite = "auftraggeber" | "investoren";

export interface ProzessPhase {
  titel: string;
  vonNr: number;
  bisNr: number;
  seite: ProzessSeite;
}

export const PROZESS_PHASEN: readonly ProzessPhase[] = [
  { titel: "PHASE 1 · Mandat & Bewertung", vonNr: 1, bisNr: 7, seite: "auftraggeber" },
  { titel: "PHASE 2 · Vermarktungsvorbereitung", vonNr: 8, bisNr: 14, seite: "auftraggeber" },
  { titel: "PHASE 3 · Aktive Vermarktung", vonNr: 15, bisNr: 18, seite: "investoren" },
  { titel: "PHASE 4 · Angebote & Reporting (laufend)", vonNr: 19, bisNr: 26, seite: "investoren" },
] as const;

/** Sichtbare Benennung der beiden Prozessseiten – siehe ANNAHMEN.md Punkt 47. */
export const SEITEN_LABEL: Record<ProzessSeite, string> = {
  auftraggeber: "Auftraggeberseite",
  investoren: "Investorenseite",
};

export const PROZESS_SCHRITTE: readonly ProzessSchritt[] = [
  { nr: 1, kurz: "Portfolio für Exit", lang: "Portfolio for potential Exit", verantwortlich: "Client", verantwortung: "extern", tool: "Word/PDF", beschreibung: "Der Auftraggeber liefert das Portfolio bzw. Objekt für einen möglichen Exit – Ausgangspunkt jedes Mandats." },
  { nr: 2, kurz: "NDA Auftraggeber", lang: "Draft NDA", verantwortlich: "Legal Team", verantwortung: "extern", tool: "Word/PDF", beschreibung: "NDA mit dem Auftraggeber – Grundlage für den Austausch vertraulicher Unterlagen." },
  { nr: 3, kurz: "Rent Roll anfordern", lang: "Request Rent Roll / Data Room (via E-Mail)", verantwortlich: "Backoffice", verantwortung: "backoffice", tool: "Outlook", beschreibung: "Mieterliste und erste Datenraum-Unterlagen beim Auftraggeber anfordern – seit Demo-Check (20.08.) Aufgabe des Backoffice." },
  { nr: 4, kurz: "Excel-Valuation", lang: "Excel Valuation on single Property Basis", verantwortlich: "Investment Team", verantwortung: "team", tool: "Excel", beschreibung: "Bewertung je Einzelobjekt – künftig mit KI-extrahierten Kennwerten aus dem Datenraum." },
  { nr: 5, kurz: "Valuation-Präsentation", lang: "Presentation with Valuation and Sales Strategy", verantwortlich: "Team", verantwortung: "team", tool: "PowerPoint", beschreibung: "Präsentation mit Bewertung und Vermarktungsstrategie für den Auftraggeber." },
  { nr: 6, kurz: "Service Agreement", lang: "Draft Service Agreement (via E-Mail)", verantwortlich: "Legal Team", verantwortung: "extern", tool: "Word/PDF", beschreibung: "Internes Service Agreement – Mandatsgrundlage." },
  { nr: 7, kurz: "Legitimation", lang: "Draft Legitimation (via E-Mail)", verantwortlich: "Legal Team", verantwortung: "extern", tool: "Word/PDF", beschreibung: "Externe Legitimation/Vollmacht – SEIL vertritt den Auftraggeber nach außen." },
  { nr: 8, kurz: "Standarddokumente", lang: "Request for Standard Documents (via E-Mail)", verantwortlich: "Backoffice", verantwortung: "backoffice", tool: "Outlook", beschreibung: "Standard-Dokumentenliste beim Auftraggeber anfordern – Backoffice bereitet vor, den Eingang prüft künftig Modul 01." },
  { nr: 9, kurz: "Datenraum aufbauen", lang: "Create Data Room according to Standard Structure", verantwortlich: "Backoffice", verantwortung: "backoffice", tool: "OneDrive", beschreibung: "Datenraum nach Standardstruktur aufbauen – Backoffice-Aufgabe; Status und Checkliste liefert künftig Modul 01. Der Vertrieb steigt erst bei konkretem Interesse ein." },
  { nr: 10, kurz: "Deal im CRM", lang: "Create new Deal", verantwortlich: "Team", verantwortung: "team", tool: "Pipedrive", beschreibung: "Deal anlegen – künftig automatisch im Cockpit statt in Pipedrive." },
  { nr: 11, kurz: "Onepager/Teaser", lang: "Create Onepager", verantwortlich: "Team", verantwortung: "team", tool: "PowerPoint", beschreibung: "Onepager/Teaser erstellen – künftig KI-generiert mit Prüfung durch das Team." },
  { nr: 12, kurz: "NDA Vermarktung", lang: "Draft NDA (Vermarktung)", verantwortlich: "Legal Team", verantwortung: "extern", tool: "Word/PDF", beschreibung: "Vermarktungs-NDA je Interessent – Voraussetzung für jeden Datenraumzugang; den Versand übernimmt das Backoffice." },
  { nr: 13, kurz: "Fotograf", lang: "Organize Photographers for Property Pictures", verantwortlich: "Backoffice", verantwortung: "backoffice", tool: "Outlook", beschreibung: "Fotograf für Objektaufnahmen organisieren – administrative Vorbereitung durch das Backoffice." },
  { nr: 14, kurz: "Matching-Liste", lang: "Matching / Investors List (E-Mail Addresses)", verantwortlich: "Automatik", verantwortung: "automatik", tool: "Pipedrive", beschreibung: "Investorenliste per Abgleich mit den Ankaufsprofilen – Standort zuerst, dann Assetklasse und Ticket (Demo-Check 20.08.). Läuft automatisch, bleibt manuell erweiterbar." },
  { nr: 15, kurz: "Approach-Mailing", lang: "Investors Approach E-Mail (BCC Mailing)", verantwortlich: "Team", verantwortung: "freigabe", tool: "Outlook (BCC)", beschreibung: "Versand an den Verteiler – startet erst nach manueller Freigabe der Liste (Human-in-the-Loop)." },
  { nr: 16, kurz: "Follow-ups & Q&A", lang: "Standard Process / E-Mails: Follow-Ups, Q&A, NDA", verantwortlich: "Team", verantwortung: "automatik", tool: "Outlook", beschreibung: "Follow-up alle 2 Tage (max. 3 Stufen) über E-Mail und WhatsApp (Superchat), Q&A und NDA-Handling – übernimmt die Automatik mit Antworterkennung; Stufe 2 fragt aktiv nach aktuellen Zielregionen." },
  { nr: 17, kurz: "Broker Call", lang: "Broker Call: Feedback, Pricing, Site Visit", verantwortlich: "Broker", verantwortung: "team", tool: "Telefon", beschreibung: "Persönliches Gespräch bei Interesse – Fragen, Preis, Besichtigungswunsch. Entsteht als Aufgabe aus der Antworterkennung." },
  { nr: 18, kurz: "Datenraum Light", lang: "Datenraum Light", verantwortlich: "Team", verantwortung: "team", tool: "OneDrive", beschreibung: "Reduzierter Datenraum für qualifizierte Interessenten nach NDA." },
  { nr: 19, kurz: "Indikatives Angebot", lang: "Indikatives Angebot / LOI", verantwortlich: "Investment Team", verantwortung: "extern", tool: "Word/PDF", beschreibung: "Indikative Angebote bzw. LOI der Interessenten einsammeln und bewerten." },
  { nr: 20, kurz: "Besichtigungen", lang: "Besichtigungen", verantwortlich: "Team", verantwortung: "team", tool: "Outlook", beschreibung: "Objektbesichtigungen mit qualifizierten Bietern koordinieren." },
  { nr: 21, kurz: "Datenraum Full", lang: "Datenraum Full", verantwortlich: "Team", verantwortung: "team", tool: "OneDrive", beschreibung: "Vollständiger Datenraum für Bieter der engeren Auswahl." },
  { nr: 22, kurz: "SEIL-HERO-Angebot", lang: "SEIL-HERO-Angebot", verantwortlich: "Investment Team", verantwortung: "team", tool: "Word/PDF", beschreibung: "Finales, strukturiertes Angebot (SEIL-HERO-Format) verhandlungsreif aufbereiten." },
  { nr: 23, kurz: "Verhandlung", lang: "Angebotsverhandlung", verantwortlich: "Team", verantwortung: "team", tool: "Telefon", beschreibung: "Angebotsverhandlung mit dem präferierten Bieter." },
  { nr: 24, kurz: "Notar", lang: "Notarbeauftragung", verantwortlich: "Legal Team", verantwortung: "extern", tool: "Word/PDF", beschreibung: "Notar beauftragen, Kaufvertragsentwurf abstimmen." },
  { nr: 25, kurz: "Offene Bedingungen", lang: "Offene Bedingungen", verantwortlich: "Team", verantwortung: "team", tool: "Excel", beschreibung: "Offene Bedingungen bis zum Vollzug nachhalten – wöchentliches Reporting an den Auftraggeber läuft parallel." },
  { nr: 26, kurz: "Signing", lang: "Signing", verantwortlich: "Legal Team", verantwortung: "extern", tool: "Word/PDF", beschreibung: "Beurkundung – Abschluss der Transaktion." },
] as const;

/** Index (0-basiert) des Human-in-the-Loop-Schritts: Approach-Mailing erst nach Freigabe. */
export const FREIGABE_SCHRITT_INDEX = 14;
