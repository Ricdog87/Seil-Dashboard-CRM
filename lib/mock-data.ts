// SEIL Cockpit (Modul 02) – Mock-Daten für den Klickdummy.
// Alle Objekte, Firmen, Personen und Kontaktdaten sind frei erfunden.
// Es besteht keine Verbindung zu echten SEIL-Daten oder zu Modul 01.

import type {
  Aktivitaet,
  Aufgabe,
  Auftraggeber,
  Investor,
  Mitarbeiter,
  Objekt,
  ObjektInvestorLink,
} from "./types";

/** Fester Referenztag des Prototyps – alle Daten sind darauf abgestimmt. */
export const HEUTE = "2026-08-18";

// ---------------------------------------------------------------------------
// Prozessschritte (die zwei Seiten, in denen der Kunde denkt)
// ---------------------------------------------------------------------------

export const EIGENTUEMER_SCHRITTE = [
  "Erstinformation / Client Portfolio",
  "NDA mit Auftraggeber",
  "Datenraum anfordern",
  "Valuation",
  "Unterlagen erstellen (Excel, Präsentation)",
  "Service Agreement & Legitimation/Vollmacht",
] as const;

export const EIGENTUEMER_SCHRITTE_KURZ = [
  "Erstinfo",
  "NDA Auftraggeber",
  "Datenraum",
  "Valuation",
  "Unterlagen",
  "Agreement & Vollmacht",
] as const;

export const INVESTOREN_SCHRITTE = [
  "NDA Vermarktung",
  "Fotograf, Teaser & Listing",
  "Investorenliste abgleichen → Freigabe",
  "Versand an Verteiler",
  "Automatisches Follow-up (2 Tage, max. 3 Stufen)",
  "Antworterkennung & Übergabe",
] as const;

export const INVESTOREN_SCHRITTE_KURZ = [
  "NDA Vermarktung",
  "Teaser & Listing",
  "Freigabe Liste",
  "Versand",
  "Follow-up",
  "Antworten",
] as const;

/** Index des Human-in-the-Loop-Schritts auf der Investorenseite. */
export const FREIGABE_SCHRITT_INDEX = 2;

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export const mitarbeiter: Mitarbeiter[] = [
  { id: "m1", name: "Katharina Vogt", kuerzel: "KV", rolle: "Transaction Managerin" },
  { id: "m2", name: "Daniel Mertens", kuerzel: "DM", rolle: "Senior Transaction Manager" },
  { id: "m3", name: "Sofia Ricci", kuerzel: "SR", rolle: "Analystin Valuation & Unterlagen" },
  { id: "m4", name: "Jonas Brandt", kuerzel: "JB", rolle: "Investment-Team" },
];

// ---------------------------------------------------------------------------
// Auftraggeber / Eigentümer (Sell-Side)
// ---------------------------------------------------------------------------

export const auftraggeber: Auftraggeber[] = [
  {
    id: "a1",
    firma: "Hessische Grundwert GmbH",
    ansprechpartner: "Dr. Thomas Keller",
    telefon: "+49 69 555 210-0",
    email: "keller@hessische-grundwert.example",
  },
  {
    id: "a2",
    firma: "Albrecht Familienvermögen GmbH & Co. KG",
    ansprechpartner: "Marianne Albrecht",
    telefon: "+49 69 555 483-12",
    email: "albrecht@albrecht-fv.example",
  },
  {
    id: "a3",
    firma: "Gateway Industrial GmbH",
    ansprechpartner: "Sven Okonkwo",
    telefon: "+49 6074 555 77-0",
    email: "okonkwo@gateway-industrial.example",
  },
  {
    id: "a4",
    firma: "HL Retail Estate GmbH",
    ansprechpartner: "Petra Sommerfeld",
    telefon: "+49 69 555 918-40",
    email: "sommerfeld@hl-retail.example",
  },
  {
    id: "a5",
    firma: "Europa Quartier Development GmbH",
    ansprechpartner: "Marc-André Fischer",
    telefon: "+49 69 555 302-22",
    email: "fischer@eq-development.example",
  },
  {
    id: "a6",
    firma: "Dr. Weiss & Partner Immobilien KG",
    ansprechpartner: "Dr. Sabine Weiss",
    telefon: "+49 6172 555 89-1",
    email: "weiss@weiss-partner-immo.example",
  },
];

// ---------------------------------------------------------------------------
// Standard-Dokumentencheckliste des Datenraums (Anzeige aus Modul 01)
// ---------------------------------------------------------------------------

export const STANDARD_DOKUMENTE = [
  "Grundbuchauszug",
  "Flurkarte & Lageplan",
  "Mietverträge",
  "Mieter- & Flächenliste",
  "Grundrisse & Baupläne",
  "Baugenehmigung",
  "Energieausweis",
  "Nebenkostenabrechnungen (3 Jahre)",
  "Instandhaltungs- & Capex-Historie",
  "Versicherungspolicen",
  "Altlasten- & Baulastenauskunft",
  "Jahresabrechnung / BWA",
] as const;

type DokStatusMap = Partial<Record<number, "in_pruefung" | "ausstehend">>;

function datenraumMit(abweichungen: DokStatusMap, stand: string) {
  return {
    angefordert: true,
    stand,
    dokumente: STANDARD_DOKUMENTE.map((name, i) => ({
      name,
      status: abweichungen[i] ?? ("vorhanden" as const),
    })),
  };
}

// ---------------------------------------------------------------------------
// Projekte / Objekte
// ---------------------------------------------------------------------------

export const objekte: Objekt[] = [
  {
    id: "o1",
    name: "Büroensemble Westend-Karree",
    adresse: "Bockenheimer Landstraße 98–102",
    stadt: "Frankfurt am Main (Westend)",
    assetklasse: "Büro",
    flaeche: "14.200 m² Mietfläche",
    kaufpreisMio: 48.5,
    auftraggeberId: "a1",
    zustaendigId: "m1",
    eigentuemerPhasen: ["abgeschlossen", "abgeschlossen", "abgeschlossen", "abgeschlossen", "abgeschlossen", "abgeschlossen"],
    investorenPhasen: ["abgeschlossen", "abgeschlossen", "abgeschlossen", "abgeschlossen", "abgeschlossen", "aktiv"],
    kiExtrakt: ["27 Mietverträge", "WALT 4,3 Jahre", "Leerstand 4,1 %"],
    datenraum: datenraumMit({}, "2026-08-17"),
    freigabe: { status: "erteilt", durchId: "m1", am: "2026-07-23" },
  },
  {
    id: "o2",
    name: "Logistikpark Gateway Süd",
    adresse: "Waldstraße 40",
    stadt: "Dietzenbach",
    assetklasse: "Logistik",
    flaeche: "32.000 m² Hallen- und Servicefläche",
    kaufpreisMio: 23.9,
    auftraggeberId: "a3",
    zustaendigId: "m2",
    eigentuemerPhasen: ["abgeschlossen", "abgeschlossen", "abgeschlossen", "abgeschlossen", "abgeschlossen", "abgeschlossen"],
    investorenPhasen: ["abgeschlossen", "abgeschlossen", "abgeschlossen", "abgeschlossen", "aktiv", "offen"],
    datenraum: datenraumMit({ 10: "ausstehend" }, "2026-08-16"),
    freigabe: { status: "erteilt", durchId: "m2", am: "2026-08-05" },
  },
  {
    id: "o3",
    name: "Wohnportfolio Sachsenhausen",
    adresse: "Schweizer Straße / Textorstraße (3 Liegenschaften)",
    stadt: "Frankfurt am Main (Sachsenhausen)",
    assetklasse: "Wohnen",
    flaeche: "62 Wohneinheiten, 4.850 m² Wohnfläche",
    kaufpreisMio: 31.2,
    auftraggeberId: "a2",
    zustaendigId: "m1",
    eigentuemerPhasen: ["abgeschlossen", "abgeschlossen", "abgeschlossen", "abgeschlossen", "abgeschlossen", "abgeschlossen"],
    investorenPhasen: ["abgeschlossen", "abgeschlossen", "aktiv", "offen", "offen", "offen"],
    kiExtrakt: ["62 Wohneinheiten", "3 Grundbuchblätter", "Ø-Miete 14,90 €/m²"],
    datenraum: datenraumMit({}, "2026-08-14"),
    freigabe: { status: "ausstehend" },
  },
  {
    id: "o4",
    name: "Fachmarktzentrum Hanauer Landstraße",
    adresse: "Hanauer Landstraße 310",
    stadt: "Frankfurt am Main (Ostend)",
    assetklasse: "Einzelhandel",
    flaeche: "8.400 m² Verkaufsfläche",
    kaufpreisMio: 17.4,
    auftraggeberId: "a4",
    zustaendigId: "m2",
    merkmal: "Distressed Asset",
    eigentuemerPhasen: ["abgeschlossen", "abgeschlossen", "aktiv", "offen", "offen", "offen"],
    investorenPhasen: ["offen", "offen", "offen", "offen", "offen", "offen"],
    datenraum: datenraumMit(
      { 3: "in_pruefung", 7: "ausstehend", 8: "ausstehend", 9: "ausstehend", 10: "ausstehend" },
      "2026-08-16",
    ),
  },
  {
    id: "o5",
    name: "Boardinghouse Europaviertel",
    adresse: "Osloer Straße 12",
    stadt: "Frankfurt am Main (Europaviertel)",
    assetklasse: "Hotel / Serviced Apartments",
    flaeche: "88 Einheiten, 5.600 m² BGF",
    kaufpreisMio: 12.8,
    auftraggeberId: "a5",
    zustaendigId: "m3",
    quelle: "Se Circle",
    eigentuemerPhasen: ["abgeschlossen", "abgeschlossen", "abgeschlossen", "aktiv", "offen", "offen"],
    investorenPhasen: ["offen", "offen", "offen", "offen", "offen", "offen"],
    datenraum: datenraumMit({ 9: "ausstehend", 11: "ausstehend" }, "2026-08-08"),
  },
  {
    id: "o6",
    name: "Ärztehaus Bad Homburg",
    adresse: "Louisenstraße 87",
    stadt: "Bad Homburg v. d. Höhe",
    assetklasse: "Gesundheitsimmobilie",
    flaeche: "3.100 m² Mietfläche",
    kaufpreisMio: 9.6,
    auftraggeberId: "a6",
    zustaendigId: "m1",
    eigentuemerPhasen: ["abgeschlossen", "aktiv", "offen", "offen", "offen", "offen"],
    investorenPhasen: ["offen", "offen", "offen", "offen", "offen", "offen"],
    datenraum: { angefordert: false, dokumente: [] },
  },
];

// ---------------------------------------------------------------------------
// Investoren (Buy-Side)
// ---------------------------------------------------------------------------

export const investoren: Investor[] = [
  {
    id: "i1",
    firma: "Falkenstein Capital Partners",
    quelle: "Pipedrive-Import",
    typ: "Vermögensverwalter",
    ansprechpartner: "Dr. Robert Steinbach",
    email: "steinbach@falkenstein-cp.example",
    telefon: "+49 69 555 640-11",
    ticketMinMio: 20,
    ticketMaxMio: 60,
    assetklassen: ["Büro", "Wohnen", "Logistik"],
    regionen: ["Deutschland Top-7"],
    notiz: "Bevorzugt Core/Core+, Entscheidungen im Investmentkomitee (14-tägig).",
  },
  {
    id: "i2",
    firma: "Novaris Invest AG",
    quelle: "Pipedrive-Import",
    typ: "Fondsmanager",
    ansprechpartner: "Claudia Bergmann",
    email: "bergmann@novaris-invest.example",
    telefon: "+49 69 555 720-30",
    ticketMinMio: 20,
    ticketMaxMio: 100,
    assetklassen: ["Büro", "Logistik"],
    regionen: ["DACH"],
    notiz: "Aktueller Fonds in Investitionsphase bis Q2/2027.",
  },
  {
    id: "i3",
    firma: "Hartmann & Cie. Family Office",
    quelle: "Pipedrive-Import",
    typ: "Family Office",
    ansprechpartner: "Maximilian Hartmann",
    email: "hartmann@hartmann-cie.example",
    telefon: "+49 69 555 812-0",
    ticketMinMio: 15,
    ticketMaxMio: 50,
    assetklassen: ["Wohnen", "Büro"],
    regionen: ["Rhein-Main"],
    notiz: "Schnelle Entscheidungswege, off-market bevorzugt.",
  },
  {
    id: "i4",
    firma: "Rheingold Asset Management",
    quelle: "Pipedrive-Import",
    typ: "Fondsmanager",
    ansprechpartner: "Peter Lindqvist",
    email: "lindqvist@rheingold-am.example",
    telefon: "+49 611 555 940-2",
    ticketMinMio: 15,
    ticketMaxMio: 50,
    assetklassen: ["Logistik", "Büro"],
    regionen: ["Deutschland"],
  },
  {
    id: "i5",
    firma: "MainPoint Capital GmbH",
    quelle: "Manuell",
    typ: "Investor / Projektentwickler",
    ansprechpartner: "Selin Kaya",
    email: "kaya@mainpoint-capital.example",
    telefon: "+49 69 555 133-7",
    ticketMinMio: 5,
    ticketMaxMio: 35,
    assetklassen: ["Wohnen"],
    regionen: ["Rhein-Main"],
    notiz: "Auch Value-Add und Sanierungsobjekte.",
  },
  {
    id: "i6",
    firma: "Vesta Wohnwerte AG",
    quelle: "Pipedrive-Import",
    typ: "Bestandshalter",
    ansprechpartner: "Georg Winkler",
    email: "winkler@vesta-wohnwerte.example",
    telefon: "+49 89 555 271-90",
    ticketMinMio: 10,
    ticketMaxMio: 40,
    assetklassen: ["Wohnen"],
    regionen: ["Süddeutschland", "Rhein-Main"],
  },
  {
    id: "i7",
    firma: "Portus Logistics Capital",
    quelle: "Pipedrive-Import",
    typ: "Spezialfonds",
    ansprechpartner: "Jan Hoffmeister",
    email: "hoffmeister@portus-logistics.example",
    telefon: "+49 40 555 388-45",
    ticketMinMio: 15,
    ticketMaxMio: 45,
    assetklassen: ["Logistik", "Light Industrial"],
    regionen: ["Deutschland", "Benelux"],
    notiz: "Fokus auf Last-Mile- und Umschlagimmobilien.",
  },
  {
    id: "i8",
    firma: "Corvus Family Office",
    quelle: "Pipedrive-Import",
    typ: "Family Office",
    ansprechpartner: "Friederike Lang",
    email: "lang@corvus-fo.example",
    telefon: "+49 69 555 466-8",
    ticketMinMio: 15,
    ticketMaxMio: 55,
    assetklassen: ["Büro", "Gesundheitsimmobilie"],
    regionen: ["Hessen"],
  },
  {
    id: "i9",
    firma: "Belvedere Grund Invest",
    quelle: "Pipedrive-Import",
    typ: "Vermögensverwalter",
    ansprechpartner: "Andreas Roth",
    email: "roth@belvedere-grund.example",
    telefon: "+49 69 555 592-14",
    ticketMinMio: 10,
    ticketMaxMio: 50,
    assetklassen: ["Einzelhandel", "Nahversorgung", "Büro"],
    regionen: ["Deutschland"],
    notiz: "Sucht aktiv Fachmarktzentren mit Ankermieter Lebensmittel.",
  },
  {
    id: "i10",
    firma: "Silberberg Stiftung",
    quelle: "Manuell",
    typ: "Stiftung",
    ansprechpartner: "Christina Ernst",
    email: "ernst@silberberg-stiftung.example",
    telefon: "+49 69 555 205-3",
    ticketMinMio: 10,
    ticketMaxMio: 35,
    assetklassen: ["Wohnen", "Gesundheitsimmobilie"],
    regionen: ["Rhein-Main"],
  },
  {
    id: "i11",
    firma: "Arkadia Living GmbH",
    quelle: "Manuell",
    typ: "Bestandshalter",
    ansprechpartner: "Tobias Frey",
    email: "frey@arkadia-living.example",
    telefon: "+49 30 555 714-60",
    ticketMinMio: 10,
    ticketMaxMio: 35,
    assetklassen: ["Wohnen", "Serviced Apartments"],
    regionen: ["Deutschland Top-7"],
  },
  {
    id: "i12",
    firma: "Quercus Real Assets",
    quelle: "Pipedrive-Import",
    typ: "Fondsmanager",
    ansprechpartner: "Miriam Osei",
    email: "osei@quercus-ra.example",
    telefon: "+49 69 555 850-19",
    ticketMinMio: 10,
    ticketMaxMio: 60,
    assetklassen: ["Büro", "Hotel"],
    regionen: ["DACH"],
  },
];

// ---------------------------------------------------------------------------
// Verknüpfung Objekt ↔ Investor (der relationale Kern des Cockpits)
// ---------------------------------------------------------------------------

export const objektInvestorLinks: ObjektInvestorLink[] = [
  // Büroensemble Westend-Karree – Vermarktung weit fortgeschritten
  { objektId: "o1", investorId: "i1", status: "interesse", followUpStufe: 1, letzterKontakt: "2026-08-14", hinweis: "Broker Call vereinbart" },
  { objektId: "o1", investorId: "i2", status: "preisanfrage", followUpStufe: 1, letzterKontakt: "2026-08-12", hinweis: "Indikation über Investment-Team" },
  { objektId: "o1", investorId: "i3", status: "nda_unterzeichnet", followUpStufe: 1, letzterKontakt: "2026-08-17" },
  { objektId: "o1", investorId: "i4", status: "angeschrieben", followUpStufe: 2, letzterKontakt: "2026-08-17", naechstesFollowUp: "2026-08-19" },
  { objektId: "o1", investorId: "i8", status: "angeschrieben", followUpStufe: 3, letzterKontakt: "2026-08-16", hinweis: "Stufe 3 ohne Antwort – manuell nachfassen" },
  { objektId: "o1", investorId: "i9", status: "abgesagt", followUpStufe: 1, letzterKontakt: "2026-08-15", hinweis: "Kein Büro-Ankauf in 2026" },
  { objektId: "o1", investorId: "i12", status: "datenraum_freigegeben", followUpStufe: 1, letzterKontakt: "2026-08-06" },

  // Logistikpark Gateway Süd – Follow-up-Automatik läuft
  { objektId: "o2", investorId: "i1", status: "angeschrieben", followUpStufe: 2, letzterKontakt: "2026-08-17", naechstesFollowUp: "2026-08-19" },
  { objektId: "o2", investorId: "i2", status: "angeschrieben", followUpStufe: 3, letzterKontakt: "2026-08-16", hinweis: "Stufe 3 ohne Antwort – manuell nachfassen" },
  { objektId: "o2", investorId: "i4", status: "angeschrieben", followUpStufe: 2, letzterKontakt: "2026-08-16", naechstesFollowUp: "2026-08-18" },
  { objektId: "o2", investorId: "i7", status: "interesse", followUpStufe: 1, letzterKontakt: "2026-08-15", hinweis: "Broker Call vereinbart" },

  // Wohnportfolio Sachsenhausen – Liste abgeglichen, wartet auf Freigabe
  { objektId: "o3", investorId: "i1", status: "vorgemerkt", followUpStufe: 0 },
  { objektId: "o3", investorId: "i3", status: "vorgemerkt", followUpStufe: 0 },
  { objektId: "o3", investorId: "i5", status: "vorgemerkt", followUpStufe: 0 },
  { objektId: "o3", investorId: "i6", status: "vorgemerkt", followUpStufe: 0 },
  { objektId: "o3", investorId: "i10", status: "vorgemerkt", followUpStufe: 0 },
  { objektId: "o3", investorId: "i11", status: "vorgemerkt", followUpStufe: 0 },

  // Fachmarktzentrum – Vermarktung noch nicht gestartet, proaktive Anfrage
  { objektId: "o4", investorId: "i9", status: "vorgemerkt", followUpStufe: 0, hinweis: "Proaktive Anfrage vom 16.08. – Vermarktung noch nicht gestartet" },

  // Boardinghouse Europaviertel – frühe Vormerkungen
  { objektId: "o5", investorId: "i11", status: "vorgemerkt", followUpStufe: 0 },
  { objektId: "o5", investorId: "i12", status: "vorgemerkt", followUpStufe: 0 },
];

// ---------------------------------------------------------------------------
// Aufgaben
// ---------------------------------------------------------------------------

export const aufgaben: Aufgabe[] = [
  { id: "t1", titel: "Broker Call – Falkenstein Capital Partners", typ: "broker_call", faellig: "2026-08-19", mitarbeiterId: "m1", objektId: "o1", investorId: "i1", erledigt: false },
  { id: "t2", titel: "Broker Call – Portus Logistics Capital", typ: "broker_call", faellig: "2026-08-18", mitarbeiterId: "m2", objektId: "o2", investorId: "i7", erledigt: false },
  { id: "t3", titel: "Preisindikation für Novaris Invest abstimmen", typ: "preisanfrage", faellig: "2026-08-19", mitarbeiterId: "m4", objektId: "o1", investorId: "i2", erledigt: false },
  { id: "t4", titel: "Investorenliste freigeben – Wohnportfolio Sachsenhausen", typ: "freigabe", faellig: "2026-08-18", mitarbeiterId: "m1", objektId: "o3", erledigt: false },
  { id: "t5", titel: "Fehlende Datenraum-Dokumente nachfassen (4 offen)", typ: "datenraum", faellig: "2026-08-20", mitarbeiterId: "m2", objektId: "o4", erledigt: false },
  { id: "t6", titel: "Valuation Boardinghouse Europaviertel abschließen", typ: "sonstiges", faellig: "2026-08-21", mitarbeiterId: "m3", objektId: "o5", erledigt: false },
  { id: "t7", titel: "NDA-Rücklauf Auftraggeber nachhalten", typ: "nda", faellig: "2026-08-18", mitarbeiterId: "m1", objektId: "o6", erledigt: false },
  { id: "t8", titel: "Manuell nachfassen – Corvus Family Office (Stufe 3 ohne Antwort)", typ: "sonstiges", faellig: "2026-08-20", mitarbeiterId: "m1", objektId: "o1", investorId: "i8", erledigt: false },
  { id: "t15", titel: "Manuell nachfassen – Novaris Invest (Stufe 3 ohne Antwort)", typ: "sonstiges", faellig: "2026-08-20", mitarbeiterId: "m2", objektId: "o2", investorId: "i2", erledigt: false },
  { id: "t9", titel: "Versand vorbereiten – Verteiler Sachsenhausen (nach Freigabe)", typ: "sonstiges", faellig: "2026-08-19", mitarbeiterId: "m1", objektId: "o3", erledigt: false },
  { id: "t10", titel: "Exposé um Altlastenauskunft ergänzen", typ: "unterlagen", faellig: "2026-08-24", mitarbeiterId: "m3", objektId: "o2", erledigt: false },
  { id: "t11", titel: "Nebenkostenabrechnungen beim Auftraggeber anfordern", typ: "datenraum", faellig: "2026-08-15", mitarbeiterId: "m2", objektId: "o4", erledigt: false },
  { id: "t12", titel: "NDA Vermarktung an Hartmann & Cie. versenden", typ: "nda", faellig: "2026-08-11", mitarbeiterId: "m1", objektId: "o1", investorId: "i3", erledigt: true },
  { id: "t13", titel: "Datenraum-Zugang für Quercus Real Assets einrichten", typ: "datenraum", faellig: "2026-08-06", mitarbeiterId: "m1", objektId: "o1", investorId: "i12", erledigt: true },
  { id: "t14", titel: "Legitimation & Vollmacht Albrecht prüfen", typ: "sonstiges", faellig: "2026-08-12", mitarbeiterId: "m1", objektId: "o3", erledigt: true },
];

// ---------------------------------------------------------------------------
// Aktivitäten & Kommunikation
// ---------------------------------------------------------------------------

export const aktivitaeten: Aktivitaet[] = [
  // Büroensemble Westend-Karree (o1)
  { id: "ak01", datum: "2026-07-21T09:12", typ: "system", quelle: "Modul 01", text: "Datenraum vollständig – 12/12 Standarddokumente abgelegt.", objektId: "o1" },
  { id: "ak42", datum: "2026-07-21T09:30", typ: "system", quelle: "KI", text: "KI-Extraktion: Mieter- & Flächenliste ausgelesen – 27 Mietverträge, WALT 4,3 Jahre, Leerstand 4,1 % ins CRM übernommen.", objektId: "o1" },
  { id: "ak02", datum: "2026-07-23T14:05", typ: "notiz", text: "Investorenliste freigegeben (7 Kontakte) – Versand ausgelöst.", objektId: "o1", mitarbeiterId: "m1" },
  { id: "ak03", datum: "2026-07-24T08:30", typ: "mail_ausgang", text: "Teaser Westend-Karree an Verteiler versendet (7 Investoren).", objektId: "o1", mitarbeiterId: "m1" },
  { id: "ak04", datum: "2026-07-26T08:00", typ: "system", quelle: "Automatik", text: "Follow-up Stufe 1 automatisch versendet an 7 Kontakte ohne Rückmeldung.", objektId: "o1" },
  { id: "ak05", datum: "2026-07-28T11:42", typ: "mail_eingang", text: "Hartmann & Cie. bittet um NDA und weitere Unterlagen.", objektId: "o1", investorId: "i3" },
  { id: "ak06", datum: "2026-07-30T16:20", typ: "system", quelle: "Automatik", text: "NDA Vermarktung unterzeichnet zurückerhalten – Status aktualisiert.", objektId: "o1", investorId: "i3" },
  { id: "ak07", datum: "2026-08-05T10:15", typ: "mail_eingang", text: "Quercus Real Assets: NDA unterzeichnet, bittet um Datenraumzugang.", objektId: "o1", investorId: "i12" },
  { id: "ak08", datum: "2026-08-06T09:00", typ: "system", quelle: "Modul 01", text: "Datenraum-Zugang für Quercus Real Assets eingerichtet.", objektId: "o1", investorId: "i12" },
  { id: "ak09", datum: "2026-08-12T13:48", typ: "mail_eingang", text: "Novaris Invest fragt Preisvorstellung und Faktor an.", objektId: "o1", investorId: "i2" },
  { id: "ak10", datum: "2026-08-12T13:49", typ: "system", quelle: "Automatik", text: "Antwort erkannt: Preisanfrage – Aufgabe für das Investment-Team erstellt.", objektId: "o1", investorId: "i2" },
  { id: "ak11", datum: "2026-08-14T09:31", typ: "mail_eingang", text: "Falkenstein Capital meldet konkretes Interesse, bittet um Gespräch.", objektId: "o1", investorId: "i1" },
  { id: "ak12", datum: "2026-08-14T09:32", typ: "system", quelle: "Automatik", text: "Antwort erkannt: Interesse – Aufgabe „Broker Call“ für Katharina Vogt erstellt.", objektId: "o1", investorId: "i1" },
  { id: "ak13", datum: "2026-08-15T15:10", typ: "mail_eingang", text: "Belvedere Grund Invest sagt ab – kein Büro-Ankauf in 2026.", objektId: "o1", investorId: "i9" },
  { id: "ak14", datum: "2026-08-16T08:00", typ: "system", quelle: "Automatik", text: "Follow-up Stufe 3 an Corvus Family Office versendet – maximale Stufe erreicht.", objektId: "o1", investorId: "i8" },
  { id: "ak15", datum: "2026-08-17T11:05", typ: "anruf", text: "Rückfragen von Hartmann & Cie. zur Mieter- & Flächenliste beantwortet.", objektId: "o1", investorId: "i3", mitarbeiterId: "m1" },

  { id: "ak46", datum: "2026-08-17T08:00", typ: "system", quelle: "Automatik", text: "Follow-up Stufe 2 automatisch versendet an Rheingold Asset Management.", objektId: "o1", investorId: "i4" },

  // Logistikpark Gateway Süd (o2)
  { id: "ak16", datum: "2026-08-04T10:20", typ: "system", quelle: "Modul 01", text: "Checkliste aktualisiert: 11/12 Dokumente – Altlasten- & Baulastenauskunft ausstehend.", objektId: "o2" },
  { id: "ak17", datum: "2026-08-05T09:40", typ: "notiz", text: "Investorenliste freigegeben (4 Kontakte) – Versand ausgelöst.", objektId: "o2", mitarbeiterId: "m2" },
  { id: "ak18", datum: "2026-08-06T08:30", typ: "mail_ausgang", text: "Teaser Logistikpark an Verteiler versendet (4 Investoren).", objektId: "o2", mitarbeiterId: "m2" },
  { id: "ak19", datum: "2026-08-08T08:00", typ: "system", quelle: "Automatik", text: "Follow-up Stufe 1 automatisch versendet an 4 Kontakte ohne Rückmeldung.", objektId: "o2" },
  { id: "ak20", datum: "2026-08-16T08:00", typ: "system", quelle: "Automatik", text: "Follow-up Stufe 3 automatisch versendet an Novaris Invest – maximale Stufe erreicht.", objektId: "o2", investorId: "i2" },
  { id: "ak47", datum: "2026-08-16T08:05", typ: "system", quelle: "Automatik", text: "Follow-up Stufe 2 automatisch versendet an Rheingold Asset Management.", objektId: "o2", investorId: "i4" },
  { id: "ak48", datum: "2026-08-17T08:00", typ: "system", quelle: "Automatik", text: "Follow-up Stufe 2 automatisch versendet an Falkenstein Capital Partners.", objektId: "o2", investorId: "i1" },
  { id: "ak21", datum: "2026-08-15T14:22", typ: "mail_eingang", text: "Portus Logistics Capital meldet Interesse – Objektbesichtigung gewünscht.", objektId: "o2", investorId: "i7" },
  { id: "ak22", datum: "2026-08-15T14:23", typ: "system", quelle: "Automatik", text: "Antwort erkannt: Interesse – Aufgabe „Broker Call“ für Daniel Mertens erstellt.", objektId: "o2", investorId: "i7" },
  { id: "ak23", datum: "2026-08-17T16:40", typ: "anruf", text: "Statusupdate an Gateway Industrial: 4 Kontakte angeschrieben, 1 Interessent.", objektId: "o2", auftraggeberId: "a3", mitarbeiterId: "m2" },

  // Wohnportfolio Sachsenhausen (o3)
  { id: "ak24", datum: "2026-07-30T09:00", typ: "system", quelle: "Modul 01", text: "Datenraum vollständig – 12/12 Standarddokumente abgelegt.", objektId: "o3" },
  { id: "ak43", datum: "2026-07-31T08:20", typ: "system", quelle: "KI", text: "KI-Extraktion: Grundbuchdaten der 3 Liegenschaften ausgelesen und ins CRM übernommen.", objektId: "o3" },
  { id: "ak25", datum: "2026-08-05T11:30", typ: "notiz", text: "Fotograf beauftragt, Termin 08.08. vor Ort.", objektId: "o3", mitarbeiterId: "m1" },
  { id: "ak44", datum: "2026-08-09T10:00", typ: "system", quelle: "KI", text: "Teaser und Listing automatisch generiert – Entwurf zur Prüfung an Katharina Vogt.", objektId: "o3" },
  { id: "ak26", datum: "2026-08-11T17:15", typ: "notiz", text: "Teaser und Listing final abgestimmt mit Auftraggeberin.", objektId: "o3", auftraggeberId: "a2", mitarbeiterId: "m1" },
  { id: "ak27", datum: "2026-08-14T08:45", typ: "system", quelle: "Automatik", text: "Investorenliste abgeglichen: 6 passende Profile (Assetklasse Wohnen, Ticket passend, Region Rhein-Main/Top-7).", objektId: "o3" },
  { id: "ak28", datum: "2026-08-14T08:46", typ: "system", quelle: "Automatik", text: "Aufgabe „Investorenliste freigeben“ für Katharina Vogt erstellt – Versand wartet auf Freigabe.", objektId: "o3" },

  // Fachmarktzentrum Hanauer Landstraße (o4)
  { id: "ak29", datum: "2026-07-28T10:00", typ: "mail_ausgang", text: "Datenraum-Anforderung mit Standard-Checkliste an HL Retail Estate versendet.", objektId: "o4", auftraggeberId: "a4", mitarbeiterId: "m2" },
  { id: "ak30", datum: "2026-08-05T13:20", typ: "system", quelle: "Modul 01", text: "5/12 Standarddokumente abgelegt.", objektId: "o4" },
  { id: "ak31", datum: "2026-08-12T09:10", typ: "system", quelle: "Modul 01", text: "Mieter- & Flächenliste abgelegt – automatische Prüfung läuft (7/12).", objektId: "o4" },
  { id: "ak32", datum: "2026-08-15T08:55", typ: "mail_ausgang", text: "Erinnerung an fehlende Unterlagen (4 offen) an Frau Sommerfeld.", objektId: "o4", auftraggeberId: "a4", mitarbeiterId: "m2" },
  { id: "ak33", datum: "2026-08-16T15:30", typ: "mail_eingang", text: "Belvedere Grund Invest fragt proaktiv nach Fachmarktzentren – für Vermarktungsstart vorgemerkt.", objektId: "o4", investorId: "i9" },

  // Boardinghouse Europaviertel (o5)
  { id: "ak45", datum: "2026-07-22T11:10", typ: "system", quelle: "Se Circle", text: "Objekt aus Se Circle übernommen – Stammdaten, Flächen und Exposé-Daten automatisch synchronisiert.", objektId: "o5" },
  { id: "ak34", datum: "2026-07-30T10:40", typ: "system", quelle: "Modul 01", text: "8/12 Standarddokumente abgelegt.", objektId: "o5" },
  { id: "ak35", datum: "2026-08-08T09:25", typ: "system", quelle: "Modul 01", text: "Energieausweis und Grundrisse abgelegt (10/12).", objektId: "o5" },
  { id: "ak36", datum: "2026-08-11T14:00", typ: "notiz", text: "Valuation begonnen – Cashflow-Modell mit Betreiberpacht aufgesetzt.", objektId: "o5", mitarbeiterId: "m3" },
  { id: "ak37", datum: "2026-08-14T10:30", typ: "anruf", text: "Rückfrage zum Pachtvertrag mit Betreiber – Unterlagen werden nachgereicht.", objektId: "o5", auftraggeberId: "a5", mitarbeiterId: "m3" },

  // Ärztehaus Bad Homburg (o6)
  { id: "ak38", datum: "2026-08-07T09:00", typ: "mail_ausgang", text: "Erstinformation / Client Portfolio an Dr. Weiss versendet.", objektId: "o6", auftraggeberId: "a6", mitarbeiterId: "m1" },
  { id: "ak39", datum: "2026-08-12T11:00", typ: "anruf", text: "Erstgespräch geführt – Mandatsumfang und Zeitplan besprochen.", objektId: "o6", auftraggeberId: "a6", mitarbeiterId: "m1" },
  { id: "ak40", datum: "2026-08-13T15:45", typ: "mail_ausgang", text: "NDA-Entwurf an Auftraggeberin versendet.", objektId: "o6", auftraggeberId: "a6", mitarbeiterId: "m1" },
  { id: "ak41", datum: "2026-08-18T08:30", typ: "notiz", text: "NDA-Rücklauf steht aus – Wiedervorlage heute.", objektId: "o6", mitarbeiterId: "m1" },
];
