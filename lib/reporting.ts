import { GEANTWORTET, ANGESCHRIEBEN, type Stufe } from "@/lib/crm";

/**
 * Das Transaktions-Reporting je Objekt – nach Lucas Vorlage
 * („Reporting ‚Musterobjekt‘ – V1“, Statustracker).
 *
 * Eine Seite für den Verkäufer: vier Kennzahlen, der Deal-Funnel mit „noch
 * offen“ und „ausgeschieden“ je Stufe, Käuferprofile, Top-Bieter und
 * Absagegründe. Alles aus dem CRM gerechnet, nichts von Hand gepflegt außer
 * dem, was nur ein Mensch wissen kann: Gebote, Käufertyp, Absagegrund.
 */

// ---------------------------------------------------------------------------
// Vokabular
// ---------------------------------------------------------------------------

export const GEBOT_STUFEN = ["indikation", "due_diligence", "hero"] as const;
export type GebotStufe = (typeof GEBOT_STUFEN)[number];
export const GEBOT_STUFE_LABEL: Record<GebotStufe, string> = {
  indikation: "Indikatives Angebot",
  due_diligence: "Due Diligence",
  hero: "SEIL-HERO-Angebot",
};

export const KAEUFERTYPEN = ["privat", "semiprofessionell", "professionell"] as const;
export type Kaeufertyp = (typeof KAEUFERTYPEN)[number];
export const KAEUFERTYP_LABEL: Record<Kaeufertyp, string> = {
  privat: "Privat",
  semiprofessionell: "Semi-professionell",
  professionell: "Professionell / Institutionell",
};
export const KAEUFERTYP_KURZ: Record<Kaeufertyp, string> = {
  privat: "Privat",
  semiprofessionell: "Semi-professionell",
  professionell: "Professionell",
};

export const ABSAGEGRUENDE = ["preis", "lage", "finanzierung", "zustand", "timing", "sonstiges"] as const;
export type Absagegrund = (typeof ABSAGEGRUENDE)[number];
export const ABSAGEGRUND_LABEL: Record<Absagegrund, string> = {
  preis: "Preisvorstellung",
  lage: "Lage",
  finanzierung: "Finanzierung",
  zustand: "Zustand",
  timing: "Timing",
  sonstiges: "Sonstiges",
};

export const GEBOT_QUELLEN = ["mail", "telefon", "termin", "sonstiges"] as const;
export type GebotQuelle = (typeof GEBOT_QUELLEN)[number];

/** Lucas Ranking-Kriterien – je erfüllt ein Stern. */
export const RANKING_KRITERIEN = [
  { feld: "preis", label: "Kaufpreis" },
  { feld: "timeline", label: "Timeline" },
  { feld: "finanzierung", label: "Finanzierung" },
  { feld: "ohneBedingungen", label: "Offene Bedingungen" },
  { feld: "circleKunde", label: "SEIL-Circle-Kunde" },
] as const;

/** Die Stufen des Funnels, wie Luca sie zeigt. */
export const FUNNEL_STUFEN = [
  { schluessel: "ansprache", label: "Ansprache" },
  { schluessel: "interesse", label: "Interessensbekundung" },
  { schluessel: "pruefung", label: "Asset-Prüfung" },
  { schluessel: "indikation", label: "Indikation" },
  { schluessel: "due_diligence", label: "Due Diligence" },
  { schluessel: "hero", label: "SEIL-HERO" },
] as const;

// ---------------------------------------------------------------------------
// Datenformen
// ---------------------------------------------------------------------------

export interface Gebot {
  id: string;
  mandat: string;
  investorId: string;
  firma: string | null;
  betrag: number | null;
  stufe: GebotStufe;
  preisPasst: boolean | null;
  timeline: boolean;
  finanzierung: boolean;
  ohneBedingungen: boolean;
  circleKunde: boolean;
  zurueckgezogen: boolean;
  quelle: GebotQuelle | null;
  datum: string | null;
  notiz: string | null;
  geaendert: string | null;
  geaendertDurch: string | null;
}

export interface ReportingKontakt {
  investorId: string;
  firma: string | null;
  status: Stufe;
  ausgeschiedenBei: string | null;
  absagegrund: Absagegrund | null;
  kaeufertyp: Kaeufertyp | null;
}

export interface FunnelStufe {
  schluessel: string;
  label: string;
  erreicht: number;
  offen: number;
  ausgeschieden: number;
}

export interface TopBieter {
  investorId: string;
  firma: string;
  kaeufertyp: Kaeufertyp | null;
  betrag: number | null;
  sterne: number;
  kriterien: Record<(typeof RANKING_KRITERIEN)[number]["feld"], boolean>;
  hero: boolean;
  stufe: GebotStufe;
}

export interface Bericht {
  kopf: { name: string; adresse: string | null; stand: string; kaufpreis: number | null; assetklasse: string | null; stadt: string | null };
  kennzahlen: { ansprachen: number; aktiv: number; indikativ: number; hero: number };
  funnel: FunnelStufe[];
  kaeuferprofile: { typ: Kaeufertyp | "offen"; label: string; anzahl: number; anteil: number }[];
  topBieter: TopBieter[];
  absagegruende: { grund: Absagegrund; label: string; anzahl: number }[];
  ohneAbsagegrund: number;
  muster?: boolean;
}

/** Zeile der Tabelle `gebot` und ihre Umsetzung – geteilt von Gebote- und Reporting-Route. */
export interface DbGebot {
  id: string;
  mandat: string;
  investor_id: string;
  firma: string | null;
  betrag: number | string | null;
  stufe: GebotStufe;
  preis_passt: boolean | null;
  timeline: boolean;
  finanzierung: boolean;
  ohne_bedingungen: boolean;
  circle_kunde: boolean;
  zurueckgezogen: boolean;
  quelle: GebotQuelle | null;
  datum: string | null;
  notiz: string | null;
  geaendert: string | null;
  geaendert_durch: string | null;
}

export const aufGebot = (z: DbGebot): Gebot => ({
  id: z.id,
  mandat: z.mandat,
  investorId: z.investor_id,
  firma: z.firma,
  betrag: z.betrag === null ? null : Number(z.betrag),
  stufe: z.stufe,
  preisPasst: z.preis_passt,
  timeline: z.timeline,
  finanzierung: z.finanzierung,
  ohneBedingungen: z.ohne_bedingungen,
  circleKunde: z.circle_kunde,
  zurueckgezogen: z.zurueckgezogen,
  quelle: z.quelle,
  datum: z.datum,
  notiz: z.notiz,
  geaendert: z.geaendert,
  geaendertDurch: z.geaendert_durch,
});

// ---------------------------------------------------------------------------
// Rechnung
// ---------------------------------------------------------------------------

/** Wie weit ein Kontakt über die Trichter-Stufe gekommen ist (0 = Ansprache … 2 = Asset-Prüfung, -1 = nicht angesprochen). */
function stufeAusStatus(status: string | null | undefined): number {
  if (!status) return -1;
  if (["nda_unterzeichnet", "datenraum_freigegeben", "preisanfrage", "besichtigung"].includes(status)) return 2;
  if ((GEANTWORTET as readonly string[]).includes(status)) return 1;
  if ((ANGESCHRIEBEN as readonly string[]).includes(status)) return 0;
  return -1;
}

const GEBOT_RANG: Record<GebotStufe, number> = { indikation: 3, due_diligence: 4, hero: 5 };

export function preisPasst(g: Pick<Gebot, "betrag" | "preisPasst">, kaufpreis: number | null, hoechstes: number | null): boolean {
  if (g.preisPasst !== null && g.preisPasst !== undefined) return g.preisPasst;
  if (g.betrag === null || g.betrag === undefined) return false;
  if (kaufpreis && kaufpreis > 0) return g.betrag >= kaufpreis * 0.95;
  return hoechstes !== null && g.betrag >= hoechstes;
}

export function berichtRechnen(eingabe: {
  name: string;
  adresse: string | null;
  kaufpreis: number | null;
  assetklasse: string | null;
  stadt: string | null;
  kontakte: ReportingKontakt[];
  gebote: Gebot[];
  stand?: string;
}): Bericht {
  const gebotJe = new Map(eingabe.gebote.map((g) => [g.investorId, g]));
  const n = FUNNEL_STUFEN.length;
  const offen = new Array<number>(n).fill(0);
  const aus = new Array<number>(n).fill(0);
  const aktiveTypen = new Map<Kaeufertyp | "offen", number>();
  const absagen = new Map<Absagegrund, number>();
  let ohneGrund = 0;

  // Auch ein Gebot ohne passende Kontaktzeile zählt – etwa ein telefonisch angekündigtes.
  const kontakte = [...eingabe.kontakte];
  for (const g of eingabe.gebote) {
    if (!kontakte.some((k) => k.investorId === g.investorId)) {
      kontakte.push({ investorId: g.investorId, firma: g.firma, status: "interesse", ausgeschiedenBei: null, absagegrund: null, kaeufertyp: null });
    }
  }

  for (const k of kontakte) {
    const abgesagt = k.status === "abgesagt";
    const g = gebotJe.get(k.investorId);
    // Ein zurückgezogenes Gebot zählt als Ausstieg auf der Stufe, die das Gebot erreicht hatte.
    const gebotRang = g ? GEBOT_RANG[g.stufe] : -1;
    const statusRang = stufeAusStatus(abgesagt ? k.ausgeschiedenBei ?? "angeschrieben" : k.status);
    const rang = Math.max(statusRang, gebotRang);
    if (rang < 0) continue; // vorgemerkt, noch nicht angesprochen
    if (abgesagt || (g?.zurueckgezogen ?? false)) {
      aus[rang]++;
      if (abgesagt) {
        if (k.absagegrund) absagen.set(k.absagegrund, (absagen.get(k.absagegrund) ?? 0) + 1);
        else ohneGrund++;
      }
    } else {
      offen[rang]++;
      const typ = k.kaeufertyp ?? "offen";
      aktiveTypen.set(typ, (aktiveTypen.get(typ) ?? 0) + 1);
    }
  }

  const erreicht = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) erreicht[i] = offen[i] + aus[i] + (i + 1 < n ? erreicht[i + 1] : 0);
  const aktiv = offen.reduce((s, x) => s + x, 0);

  const aktiveGebote = eingabe.gebote.filter((g) => !g.zurueckgezogen);
  const hoechstes = aktiveGebote.reduce<number | null>((m, g) => (g.betrag !== null && (m === null || g.betrag > m) ? g.betrag : m), null);
  const typJe = new Map(eingabe.kontakte.map((k) => [k.investorId, k.kaeufertyp]));
  const abgesagteIds = new Set(eingabe.kontakte.filter((k) => k.status === "abgesagt").map((k) => k.investorId));
  const topBieter: TopBieter[] = aktiveGebote
    .filter((g) => !abgesagteIds.has(g.investorId))
    .map((g) => {
      const kriterien = {
        preis: preisPasst(g, eingabe.kaufpreis, hoechstes),
        timeline: g.timeline,
        finanzierung: g.finanzierung,
        ohneBedingungen: g.ohneBedingungen,
        circleKunde: g.circleKunde,
      };
      return {
        investorId: g.investorId,
        firma: g.firma ?? g.investorId,
        kaeufertyp: typJe.get(g.investorId) ?? null,
        betrag: g.betrag,
        sterne: Object.values(kriterien).filter(Boolean).length,
        kriterien,
        hero: g.stufe === "hero",
        stufe: g.stufe,
      };
    })
    .sort((a, b) => b.sterne - a.sterne || (b.betrag ?? 0) - (a.betrag ?? 0))
    .slice(0, 5);

  const profilReihenfolge: (Kaeufertyp | "offen")[] = [...KAEUFERTYPEN, "offen"];
  const kaeuferprofile = profilReihenfolge
    .map((typ) => {
      const anzahl = aktiveTypen.get(typ) ?? 0;
      return {
        typ,
        label: typ === "offen" ? "Noch nicht zugeordnet" : KAEUFERTYP_LABEL[typ],
        anzahl,
        anteil: aktiv > 0 ? anzahl / aktiv : 0,
      };
    })
    .filter((p) => p.typ !== "offen" || p.anzahl > 0);

  return {
    kopf: {
      name: eingabe.name,
      adresse: eingabe.adresse,
      stand: eingabe.stand ?? new Date().toISOString(),
      kaufpreis: eingabe.kaufpreis,
      assetklasse: eingabe.assetklasse,
      stadt: eingabe.stadt,
    },
    kennzahlen: { ansprachen: erreicht[0], aktiv, indikativ: erreicht[3], hero: erreicht[5] },
    funnel: FUNNEL_STUFEN.map((s, i) => ({ schluessel: s.schluessel, label: s.label, erreicht: erreicht[i], offen: offen[i], ausgeschieden: aus[i] })),
    kaeuferprofile,
    topBieter,
    absagegruende: ABSAGEGRUENDE.map((grund) => ({ grund, label: ABSAGEGRUND_LABEL[grund], anzahl: absagen.get(grund) ?? 0 }))
      .filter((a) => a.anzahl > 0)
      .sort((a, b) => b.anzahl - a.anzahl),
    ohneAbsagegrund: ohneGrund,
  };
}

// ---------------------------------------------------------------------------
// Musteransicht – die Zahlen aus Lucas Vorlage, ausdrücklich keine echten Daten
// ---------------------------------------------------------------------------

export const MUSTER: Bericht = {
  muster: true,
  kopf: { name: "Musterobjekt", adresse: "Musterstraße 12, 12345 Musterstadt", stand: "2026-08-27T00:00:00.000Z", kaufpreis: null, assetklasse: null, stadt: null },
  kennzahlen: { ansprachen: 1200, aktiv: 271, indikativ: 8, hero: 1 },
  funnel: [
    { schluessel: "ansprache", label: "Ansprache", erreicht: 1200, offen: 240, ausgeschieden: 880 },
    { schluessel: "interesse", label: "Interessensbekundung", erreicht: 80, offen: 20, ausgeschieden: 40 },
    { schluessel: "pruefung", label: "Asset-Prüfung", erreicht: 20, offen: 6, ausgeschieden: 6 },
    { schluessel: "indikation", label: "Indikation", erreicht: 8, offen: 3, ausgeschieden: 2 },
    { schluessel: "due_diligence", label: "Due Diligence", erreicht: 3, offen: 1, ausgeschieden: 1 },
    { schluessel: "hero", label: "SEIL-HERO", erreicht: 1, offen: 1, ausgeschieden: 0 },
  ],
  kaeuferprofile: [
    { typ: "privat", label: "Privat", anzahl: 163, anteil: 0.6 },
    { typ: "semiprofessionell", label: "Semi-professionell", anzahl: 68, anteil: 0.25 },
    { typ: "professionell", label: "Professionell / Institutionell", anzahl: 40, anteil: 0.15 },
  ],
  topBieter: [
    { investorId: "m1", firma: "Mustermann A.", kaeufertyp: "professionell", betrag: 2450000, sterne: 5, kriterien: { preis: true, timeline: true, finanzierung: true, ohneBedingungen: true, circleKunde: true }, hero: true, stufe: "hero" },
    { investorId: "m2", firma: "Beispiel B.", kaeufertyp: "semiprofessionell", betrag: 2300000, sterne: 4, kriterien: { preis: true, timeline: true, finanzierung: true, ohneBedingungen: true, circleKunde: false }, hero: false, stufe: "due_diligence" },
    { investorId: "m3", firma: "Muster-Invest GmbH", kaeufertyp: "professionell", betrag: 2150000, sterne: 3, kriterien: { preis: false, timeline: true, finanzierung: true, ohneBedingungen: true, circleKunde: false }, hero: false, stufe: "due_diligence" },
    { investorId: "m4", firma: "Schmidt C.", kaeufertyp: "privat", betrag: 2000000, sterne: 3, kriterien: { preis: false, timeline: true, finanzierung: true, ohneBedingungen: false, circleKunde: true }, hero: false, stufe: "indikation" },
    { investorId: "m5", firma: "Weber D.", kaeufertyp: "privat", betrag: 1900000, sterne: 2, kriterien: { preis: false, timeline: true, finanzierung: false, ohneBedingungen: false, circleKunde: true }, hero: false, stufe: "indikation" },
  ],
  absagegruende: [
    { grund: "preis", label: "Preisvorstellung", anzahl: 21 },
    { grund: "lage", label: "Lage", anzahl: 9 },
    { grund: "finanzierung", label: "Finanzierung", anzahl: 6 },
    { grund: "zustand", label: "Zustand", anzahl: 4 },
  ],
  ohneAbsagegrund: 0,
};
