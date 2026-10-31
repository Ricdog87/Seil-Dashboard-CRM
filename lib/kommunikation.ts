import type { Stufe } from "@/lib/crm";

/**
 * Standardprozess Kommunikation Investoren – Schritt 15 des Flowcharts als Regelwerk.
 *
 * Quelle: „Standardprozess Kommunikation Investoren“ (Stand 12.09.2024,
 * Übergabe 31.10.2026). Drei Spalten: Aktion Investor · Antwort SEIL · Todo.
 * Das Cockpit bildet genau diese Tabelle ab: jede Antwortart hat eine
 * Trichter-Stufe, eine Vorlage, ein Todo und eine Follow-up-Regel. Die Texte
 * stehen wörtlich hier – mit den Platzhaltern des Dokuments in eckigen
 * Klammern. Telefonnummern und Signatur sind bewusst Platzhalter: die echten
 * Werte liegen in den Vorlagen der Automatik (n8n) und nicht im Repository.
 *
 * Personen stehen im Dokument als Kürzel (MS, JD, NG). Im Cockpit heißt das:
 * „MS“ = Geschäftsführung (Preisauskunft), „JD“ = die zuständige Person des
 * Mandats – wer das heute ist, steht am Mandat, nicht hier.
 */
export const ANTWORT_ARTEN = [
  "anfrage",
  "absage",
  "kriterien",
  "preisfrage",
  "infos",
  "telefonat",
  "besichtigung",
  "sonstiges",
] as const;
export type AntwortArt = (typeof ANTWORT_ARTEN)[number];

/** Ältere Bezeichnungen aus der Antworterkennung (WF 06) → Antwortart des Standardprozesses. */
const ALIAS: Record<string, AntwortArt> = {
  interesse: "anfrage",
  unterlagen: "infos",
  preisanfrage: "preisfrage",
  rueckfrage: "infos",
};

export function antwortArt(roh: string | null | undefined): AntwortArt {
  const a = (roh ?? "").trim().toLowerCase();
  if ((ANTWORT_ARTEN as readonly string[]).includes(a)) return a as AntwortArt;
  return ALIAS[a] ?? "sonstiges";
}

export interface Zweig {
  fall: string;
  antwort: string;
  todo: string;
  bcc: boolean;
}

export interface ProzessAufgabe {
  titel: (firma: string) => string;
  /** fällig in Tagen */
  tage: number;
  /** wer sie bekommt: die zuständige Person des Mandats oder die Geschäftsführung (Preisauskunft) */
  an: "zustaendig" | "preisauskunft";
}

export interface AntwortRegel {
  art: AntwortArt;
  /** „Aktion Investor“, wörtlich. */
  aktion: string;
  aktionEn: string;
  /** Wohin der Investor im Trichter geht – null: bleibt, wo er ist. */
  stufe: Stufe | null;
  /** „Antwort SEIL“ – die Vorlage. */
  antwort: string | null;
  /** Weitere Vorlagen aus demselben Feld (Preisfrage hat drei). */
  varianten?: { name: string; text: string }[];
  /** Unterfälle („Weitere Infos angefragt“ hat drei). */
  zweige?: Zweig[];
  /** „Todo“, wörtlich (deutsch). */
  todo: string;
  /** „MS und JD auf bcc“ – Geschäftsführung und zuständige Person lesen mit. */
  bcc: boolean;
  /** Nachfassen in Tagen, wenn keine Reaktion kommt – null: keine Leiter. */
  nachfassenTage: number | null;
  /** Die zweite Mail, wenn nach einer Preisfrage nichts kommt. */
  nachfassVorlage?: string;
  aufgaben: ProzessAufgabe[];
}

const SIGNATUR = "[Signatur]";
const TELEFON_GF = "[Telefon Herr Seil]";
const TELEFON_PARTNER = "[Telefon Herr Pföhler]";

const HINWEIS_GF = `Unser Geschäftsführer, Herr Seil, kümmert sich persönlich um dieses Mandat, bei weiterem Interesse können Sie ihn unter ${TELEFON_GF} direkt anrufen.

Bitte beachten Sie jedoch, dass wir zwischen 50-80 Verkaufsvorhaben parallel betreuen. Teilen Sie Herrn Seil bitte kurz zu Beginn des Telefonates die Adresse der Liegenschaft mit, damit er Ihren Anruf zuordnen kann.`;

const BESICHTIGUNG_ANGEBOT =
  "Gerne können wir Ihnen die Häuser vor Ort präsentieren. Bitte nennen Sie mir hierzu einfach zwei Terminvorschläge. Wir machen es dann möglich.";

export const ANTWORT_REGELN: Record<AntwortArt, AntwortRegel> = {
  anfrage: {
    art: "anfrage",
    aktion: "Anfrage kommt rein",
    aktionEn: "Request is coming in",
    stufe: "interesse",
    antwort: `Guten Tag [Herr / Frau Investor Nachname],

vielen Dank für Ihr Interesse. Anbei senden wir Ihnen das Exposé zum Projekt:

- [Straße Hausnummer, PLZ Ort]

Bei Fragen oder weiteren benötigten Unterlagen, kommen Sie gerne auf uns zu. Vollständige Unterlagen folgen jedoch erst nach Besichtigung und indikativem Kaufangebot.

Für Besichtigungen bitten wir Sie um zwei Terminvorschläge.

Wir freuen uns auf den weiteren Austausch.

Freundliche Grüße
${SIGNATUR}`,
    todo: "2 Tage später nachfassen",
    bcc: false,
    nachfassenTage: 2,
    aufgaben: [{ titel: (f) => `Exposé senden: ${f}`, tage: 0, an: "zustaendig" }],
  },

  absage: {
    art: "absage",
    aktion: "Absage / Kein Interesse",
    aktionEn: "Rejection / No Interest",
    stufe: "abgesagt",
    antwort: `Guten Tag,

vielen Dank für Ihr Feedback. Können Sie uns bitte mitteilen, was Sie interessiert?

- Größe
- Stadt und Lage
- Beschaffenheit
- Objektart
- Kaufpreisvolumen

Wir sind eine bundesweit agierende Immobilienboutique in den Segmenten Investment, Gewerbe- und Luxusimmobilien. Als "Private Office" betreuen wir die eigenen Immobilien und Projekte unserer Gesellschafter, wie auch die von wenigen, aber sehr vermögenden Unternehmern, Familien und Investoren.

Lassen Sie uns gerne im Austausch bleiben.

Freundliche Grüße
${SIGNATUR}`,
    todo: "2 Tage später nachfassen",
    bcc: false,
    nachfassenTage: 2,
    aufgaben: [{ titel: (f) => `Investment-Kriterien erfragen (Vorlage Absage): ${f}`, tage: 0, an: "zustaendig" }],
  },

  kriterien: {
    art: "kriterien",
    aktion: "Wir haben Investment-Kriterien erhalten",
    aktionEn: "We have received investment criteria",
    stufe: null,
    antwort: `Guten Tag [Herr/ Frau Investor Nachname],

vielen Dank für Ihre Nachricht.

Bitte beachten Sie, dass wir kein Maklerunternehmen im klassischen Sinne sind. Wir hinterlegen prinzipiell keine Suchprofile, sondern fokussieren uns auf den professionellen Austausch mit unseren Kunden.

Wir schlagen daher ein Telefonat vor.

Wann würde es Ihnen passen? Bitte unterbreiten Sie uns zwei Terminvorschläge.

Freundliche Grüße
${SIGNATUR}`,
    todo: "Mit dieser Mail wird an das deutsche Team übergeleitet. Die zuständige Person setzt den Termin in der Regel um.",
    bcc: false,
    nachfassenTage: null,
    aufgaben: [
      { titel: (f) => `Telefonat vereinbaren – Übergabe an das deutsche Team: ${f}`, tage: 1, an: "zustaendig" },
      { titel: (f) => `Ankaufsprofil aktualisieren (Kriterien aus der Antwort): ${f}`, tage: 1, an: "zustaendig" },
    ],
  },

  preisfrage: {
    art: "preisfrage",
    aktion: "Antwort auf Preisfragen",
    aktionEn: "Response to price inquiries",
    stufe: "preisanfrage",
    antwort: `Guten Tag Herr [Investor Nachname],

die Preisvorstellung wird derzeit vom Verkäufer aufgrund des Vorliegens mehrerer Kaufangebote reduziert.

Gehen Sie diesbezüglich gerne direkt auf unseren Geschäftsführer, Herrn Seil, zu. Er kümmert sich persönlich um dieses Mandat. Bei weiterem Interesse können Sie ihn unter ${TELEFON_GF} erreichen.

Bitte beachten Sie jedoch, dass wir zwischen 50-80 Verkaufsvorhaben parallel betreuen. Teilen Sie Herrn Seil bitte kurz zu Beginn des Telefonates die Adresse der Liegenschaft mit, damit er Ihren Anruf zuordnen kann.

Freundliche Grüße
${SIGNATUR}`,
    varianten: [
      {
        name: "Kurzfassung",
        text: `Guten Tag,

die preislichen Auskünfte erteilt Herr Seil nur persönlich telefonisch. Bitte rufen Sie Ihn zwecks Abstimmung unter ${TELEFON_GF} kurz an.`,
      },
      {
        name: "Variante Partner (Herr Pföhler)",
        text: `Guten Tag Herr [Investor Nachname],

die Preisvorstellung wird derzeit vom Verkäufer aufgrund des Vorliegens mehrerer Kaufangebote reduziert.

Gehen Sie diesbezüglich gerne direkt auf unseren Partner, Herrn Pföhler, zu. Er kümmert sich persönlich um dieses Mandat. Bei weiterem Interesse können Sie ihn unter ${TELEFON_PARTNER} erreichen.

Bitte beachten Sie jedoch, dass wir zwischen 50-80 Verkaufsvorhaben parallel betreuen. Teilen Sie Herrn Pföhler bitte kurz zu Beginn des Telefonates die Adresse der Liegenschaft mit, damit er Ihren Anruf zuordnen kann.

Freundliche Grüße
${SIGNATUR}`,
      },
    ],
    todo: "MS und JD auf bcc bei dieser E-Mail",
    bcc: true,
    nachfassenTage: 2,
    nachfassVorlage: `Guten Tag,

haben Sie mit Herrn Seil gesprochen?

Gruß`,
    aufgaben: [{ titel: (f) => `Rückruf Herr Seil – Preis nur telefonisch: ${f}`, tage: 1, an: "preisauskunft" }],
  },

  infos: {
    art: "infos",
    aktion: "Weitere Infos angefragt",
    aktionEn: "Further Information Requested",
    stufe: "interesse",
    antwort: null,
    zweige: [
      {
        fall: "Ihr versteht die Antwort nicht / kennt die angefragte Info oder Unterlage nicht",
        antwort: `Guten Tag [Herr/ Frau Investor Nachname],

wir haben Ihre Rückfrage aufgenommen und kommen hierzu kurzfristig auf Sie zurück.

${BESICHTIGUNG_ANGEBOT}

${HINWEIS_GF}

Freundliche Grüße
${SIGNATUR}`,
        todo: "Rücksprache mit der zuständigen Person; wenn weiterhin unklar, mit NG. Frage klären und Investor beantworten.",
        bcc: false,
      },
      {
        fall: "Infos liegen nicht vor (Datenraum)",
        antwort: `Guten Tag [Herr/ Frau Investor Nachname],

wir haben Ihre Rückfrage aufgenommen und kommen hierzu kurzfristig auf Sie zurück.

${BESICHTIGUNG_ANGEBOT}

${HINWEIS_GF}

Freundliche Grüße
${SIGNATUR}`,
        todo: "MS und JD auf bcc bei dieser E-Mail, anschließend Unterlage / Infos beim Verkäufer einholen und versenden.",
        bcc: true,
      },
      {
        fall: "Infos liegen vor (Datenraum)",
        antwort: `Guten Tag [Herr/ Frau Investor Nachname],

nachfolgend erhalten Sie die gewünschte(n) Information(en).

- [Information einfügen, oder beifügen]

${BESICHTIGUNG_ANGEBOT}

${HINWEIS_GF}

Freundliche Grüße
${SIGNATUR}`,
        todo: "MS und JD auf bcc bei dieser E-Mail",
        bcc: true,
      },
    ],
    todo: "Je nach Fall: Rückfrage klären · beim Verkäufer einholen · aus dem Datenraum senden",
    bcc: true,
    nachfassenTage: null,
    aufgaben: [
      {
        titel: (f) => `Rückfrage beantworten (unklar → klären · nicht im Datenraum → beim Verkäufer einholen · vorhanden → senden): ${f}`,
        tage: 1,
        an: "zustaendig",
      },
    ],
  },

  telefonat: {
    art: "telefonat",
    aktion: "Austausch / Telefonat angefragt",
    aktionEn: "Exchange / Call Requested",
    stufe: "interesse",
    antwort: `Guten Tag [Herr/ Frau Investor Nachname],

vielen Dank für die Antwort.

Unser Geschäftsführer, Herr Seil, kümmert sich persönlich um dieses Mandat, bei ernsthaftem Interesse können Sie ihn unter ${TELEFON_GF} direkt anrufen.

Bitte beachten Sie jedoch, dass wir zwischen 50-80 Verkaufsvorhaben parallel betreuen. Teilen Sie Herrn Seil bitte kurz zu Beginn des Telefonates die Adresse der Liegenschaft mit, damit er Ihren Anruf zuordnen kann.

Gerne können wir Ihnen die Häuser vor Ort präsentieren. Bitte nennen Sie mir hierzu einfach zwei Terminvorschläge. Ich bin für die Koordination der Besichtigungstermine zuständig. Wir machen es dann möglich.

Freundliche Grüße
${SIGNATUR}`,
    todo: "MS und JD auf bcc setzen. Sofern der Investor auf diese Mail reagiert und weiterhin darauf besteht, angerufen zu werden, übernimmt in der Regel die zuständige Person und ruft an.",
    bcc: true,
    nachfassenTage: null,
    aufgaben: [{ titel: (f) => `Rückruf, falls der Investor auf einem Anruf besteht: ${f}`, tage: 2, an: "zustaendig" }],
  },

  besichtigung: {
    art: "besichtigung",
    aktion: "Besichtigung angefragt",
    aktionEn: "Site Visit Requested",
    stufe: "besichtigung",
    antwort: `Guten Tag [Herr/ Frau Investor Nachname],

vielen Dank für die Antwort.

${BESICHTIGUNG_ANGEBOT}

Freundliche Grüße
${SIGNATUR}`,
    todo: "MS und JD auf bcc bei dieser E-Mail. Danach die Besichtigungskette: Anfrage an den Verkäufer, Bestätigung an den Investor, Termin im Kalender.",
    bcc: true,
    nachfassenTage: null,
    aufgaben: [
      {
        titel: (f) => `Besichtigung koordinieren – Terminvorschläge, Anfrage an Verkäufer, Bestätigung, Outlook-Termin „BES mit …“: ${f}`,
        tage: 1,
        an: "zustaendig",
      },
    ],
  },

  sonstiges: {
    art: "sonstiges",
    aktion: "Sonstige Antwort",
    aktionEn: "Other response",
    stufe: null,
    antwort: null,
    todo: "Von Hand einordnen und nach dem Standardprozess beantworten.",
    bcc: false,
    nachfassenTage: null,
    aufgaben: [{ titel: (f) => `Antwort einordnen: ${f}`, tage: 1, an: "zustaendig" }],
  },
};

/** Kurze Bezeichnungen für Karten und Auswahlfelder. */
export const ANTWORT_LABEL: Record<AntwortArt, string> = {
  anfrage: "Anfrage",
  absage: "Absage",
  kriterien: "Kriterien erhalten",
  preisfrage: "Preisfrage",
  infos: "Weitere Infos",
  telefonat: "Telefonat gewünscht",
  besichtigung: "Besichtigung",
  sonstiges: "Sonstiges",
};

// ---------------------------------------------------------------------------
// Die Follow-up-Leiter: Keine Antwort → alle zwei Tage, 1. · 2. · weitere · Final
// ---------------------------------------------------------------------------

export interface FollowupStufe {
  stufe: number;
  name: string;
  /** null = „die vorherigen Follow-Up-Emails abwechseln“ */
  text: string | null;
}

/**
 * Das Dokument nennt 1. und 2. Follow Up, dann „weitere Follow-ups“ im Wechsel
 * und zuletzt das Final Follow up. Wie viele „weitere“ es sind, legt es nicht
 * fest; das Cockpit setzt eines – vier Stufen insgesamt. Das ist eine Setzung
 * und steht in ANNAHMEN.md.
 */
export const FOLLOWUP_LEITER: readonly FollowupStufe[] = [
  {
    stufe: 1,
    name: "1. Follow Up",
    text: `Guten Tag,

haben Sie ein Feedback für uns?

Freundliche Grüße
${SIGNATUR}`,
  },
  {
    stufe: 2,
    name: "2. Follow Up",
    text: `Guten Tag,

da wir keine Rückmeldung erhalten haben, möchten wir nochmals höflich nachfragen, ob weiteres Interesse besteht?

Freundliche Grüße
${SIGNATUR}`,
  },
  { stufe: 3, name: "Weiteres Follow Up", text: null },
  {
    stufe: 4,
    name: "Final Follow up",
    text: `Guten Tag,

da wir nichts mehr von Ihnen hören, gehen wir davon aus, dass Sie kein weiteres Interesse haben.

Bitte beachten Sie, dass wir kein klassisches Maklerunternehmen sind. Wir hinterlegen grundsätzlich keine Suchprofile, sondern fokussieren uns auf den professionellen Austausch mit unseren Kunden.

Freundliche Grüße
${SIGNATUR}`,
  },
] as const;

/** Text einer Stufe – „weitere“ wechseln zwischen Vorlage 1 und 2. */
export function followupText(stufe: number): string {
  const s = FOLLOWUP_LEITER.find((x) => x.stufe === stufe) ?? FOLLOWUP_LEITER[FOLLOWUP_LEITER.length - 1];
  if (s.text) return s.text;
  const vorherige = FOLLOWUP_LEITER.filter((x) => x.text && x.stufe < s.stufe);
  const wahl = vorherige[(s.stufe - 1) % Math.max(1, vorherige.length)] ?? vorherige[0];
  return wahl?.text ?? "";
}

export function followupName(stufe: number): string {
  return FOLLOWUP_LEITER.find((x) => x.stufe === stufe)?.name ?? `${stufe}. Follow Up`;
}

// ---------------------------------------------------------------------------
// Die Besichtigungskette – vier Schritte nach dem Besichtigungswunsch
// ---------------------------------------------------------------------------

export interface BesichtigungSchritt {
  nr: number;
  titel: string;
  an: string;
  vorlage: string;
  todo: string;
}

export const BESICHTIGUNG_KETTE: readonly BesichtigungSchritt[] = [
  {
    nr: 1,
    titel: "Antwort an den Investor",
    an: "Investor",
    vorlage: ANTWORT_REGELN.besichtigung.antwort ?? "",
    todo: "MS und JD auf bcc bei dieser E-Mail",
  },
  {
    nr: 2,
    titel: "Besichtigungsanfrage an den Verkäufer(vertreter)",
    an: "Verkäufer / Vertreter",
    vorlage: `Guten Tag Herr [Verkäufer(vertreter)],

wir haben eine Besichtigungsanfrage für das Objekt [Adresse des Objektes (nicht der Name)].

Folgende Termine können wir vorschlagen:

Datum: [XXX], Uhrzeit: [XXX]
Datum: [XXX], Uhrzeit: [XXX]

Leider sind wir selbst nicht in der Lage, zu den genannten Terminen vor Ort zu sein.

Uns ist jedoch der Deal wichtig und es scheint ein ernsthaftes Interesse zu bestehen.

Daher möchten wir Sie höflich bitten, ob Sie uns bei der Koordination des Besichtigungstermins mit einem Ansprechpartner vor Ort behilflich sein könnten.

Freundliche Grüße
${SIGNATUR}`,
    todo: "MS und JD auf bcc bei dieser E-Mail",
  },
  {
    nr: 3,
    titel: "Besichtigungsterminbestätigung an den Investor",
    an: "Investor",
    vorlage: `Guten Tag Herr [Investor Nachname],

gerne bestätigen wir folgenden Besichtigungstermin für das Objekt [Adresse des Objektes (nicht der Name)].

Datum: [XXX], Uhrzeit: [XXX]

Nachfolgend erhalten Sie die Kontaktdaten Ihres Ansprechpartners vor Ort:

[Vorname Nachname (Ansprechpartner vor Ort)]
[Telefonnummer (Ansprechpartner vor Ort)]

Freundliche Grüße
${SIGNATUR}`,
    todo: "MS und JD (und ggf. das Teammitglied, das besichtigt) auf bcc. Sofern schon klar ist, dass wir die Besichtigung nicht selbst übernehmen, Ansprechpartner benennen, sonst den Passus löschen.",
  },
  {
    nr: 4,
    titel: "Outlook-Termin im zentralen Vertriebskalender",
    an: "Kalender",
    vorlage: `Titel: BES mit [Kürzel des Teammitglieds] und [Investor Nachname / Telefonnummer]
Ort: [Adresse Objekt]

Wenn wir nicht selbst besichtigen:
Titel: BES ohne und [Investor Nachname / Telefonnummer]
Ort: [Adresse Objekt]`,
    todo: "Das Teammitglied einladen, das besichtigt.",
  },
] as const;

// ---------------------------------------------------------------------------
// Aufgaben beim Stufenwechsel ohne erkannte Antwort (Ziehen im Trichter)
// ---------------------------------------------------------------------------

/**
 * Wer einen Investor von Hand eine Spalte weiterzieht, löst dieselben Todos
 * aus wie die erkannte Antwort – der Prozess kennt nur eine Regel.
 */
export const STUFEN_AUFGABEN: Partial<Record<Stufe, ProzessAufgabe[]>> = {
  interesse: ANTWORT_REGELN.anfrage.aufgaben,
  nda_unterzeichnet: [{ titel: (f) => `Datenraum freigeben (nach NDA): ${f}`, tage: 1, an: "zustaendig" }],
  preisanfrage: ANTWORT_REGELN.preisfrage.aufgaben,
  besichtigung: ANTWORT_REGELN.besichtigung.aufgaben,
  abgesagt: ANTWORT_REGELN.absage.aufgaben,
};
