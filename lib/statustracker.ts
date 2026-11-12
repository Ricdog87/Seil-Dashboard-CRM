import type { Kontakt } from "@/app/api/kontakte/route";
import { RANG, type Stufe } from "@/lib/crm";
import { FOLLOWUP_TAGE, followupLage } from "@/lib/followup";
import { ANTWORT_LABEL, antwortArt } from "@/lib/kommunikation";
import { ABSAGEGRUND_LABEL, type Absagegrund } from "@/lib/reporting";

/**
 * Der Statustracker je Mandat – Lucas Excel im Cockpit.
 *
 * Sein Tracker hat je Empfänger eine Zeile mit sechs Trichterstufen (✓ oder
 * leer), einem Ergebnis (Offen · Weiter · Absage), Kommentar, Absagegrund und
 * dem Datum des letzten Schritts; dazu Follow-up-Blätter je Gruppe
 * (Erstkontakt · NDA · Mappe) mit „bisherige Follow-ups“ und „fällig am“.
 * Hier entsteht dieselbe Sicht aus dem Kontaktstand des CRM – ohne Excel, und
 * ohne dass jemand Mails durchzählen muss.
 */
export const TRACKER_STUFEN = [
  { schluessel: "erstkontakt", label: "Erstkontakt", ab: "angeschrieben" },
  { schluessel: "interesse", label: "Interesse", ab: "interesse" },
  { schluessel: "ndaErhalten", label: "NDA erhalten", ab: "nda_angefragt" },
  { schluessel: "ndaZurueck", label: "NDA zurück", ab: "nda_unterzeichnet" },
  { schluessel: "mappe", label: "Mappe / DR light", ab: "datenraum_freigegeben" },
  { schluessel: "feedback", label: "Feedback Mappe / DR", ab: "preisanfrage" },
] as const satisfies readonly { schluessel: string; label: string; ab: Stufe }[];
export type TrackerStufe = (typeof TRACKER_STUFEN)[number]["schluessel"];

export type Ergebnis = "Offen" | "Weiter" | "Absage";
export type FuGruppe = "Erstkontakt" | "NDA" | "Mappe" | "Preisfrage";

export interface TrackerZeile {
  investorId: string;
  name: string;
  email: string | null;
  telefon: string | null;
  stufen: Record<TrackerStufe, boolean>;
  ergebnis: Ergebnis;
  /** Was zuletzt vom Investor kam, plus Hinweis nach drei Follow-ups ohne Reaktion. */
  kommentar: string;
  absagegrund: string | null;
  /** Datum des letzten Schritts (letzter Kontakt oder letzte Antwort). */
  letzterSchritt: string | null;
  /** Notiz der Bearbeiter am Kontakt. */
  notiz: string | null;
  fu: {
    gruppe: FuGruppe | null;
    bisher: number;
    /** Nummer des nächsten Follow-ups, null wenn keines mehr ansteht. */
    naechstes: number | null;
    faelligAm: string | null;
    faellig: boolean;
    stumm: boolean;
  };
  naechsteAktion: string;
  /** Braucht die Zeile heute jemanden? Für den Filter „zu tun“. */
  zuTun: boolean;
}

export interface TrackerSicht {
  zeilen: TrackerZeile[];
  /** Kopfzeile wie in Lucas Blatt 1. */
  zahlen: { gesamt: number; weiter: number; offen: number; absage: number; faellig: number; vorgemerkt: number } & Record<
    TrackerStufe,
    number
  >;
}

const GRUPPE: Partial<Record<Stufe, FuGruppe>> = {
  angeschrieben: "Erstkontakt",
  interesse: "Erstkontakt",
  nda_angefragt: "NDA",
  datenraum_freigegeben: "Mappe",
  preisanfrage: "Preisfrage",
};

/** Was nach dem Standardprozess als Nächstes dran ist, wenn kein Follow-up läuft. */
const WEITER_MIT: Partial<Record<Stufe, string>> = {
  interesse: "Exposé senden, NDA anbieten",
  nda_angefragt: "auf unterschriebenes NDA warten",
  nda_unterzeichnet: "Mappe senden / Datenraum light freigeben",
  datenraum_freigegeben: "auf Feedback zur Mappe warten",
  preisanfrage: "Preisauskunft telefonisch (Geschäftsführung)",
  besichtigung: "Besichtigung koordinieren",
};

function plusTage(iso: string | null, tage: number): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + tage);
  return d.toISOString();
}

const spaeter = (a: string | null, b: string | null): string | null => {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
};

export const datumKurz = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" });
};

export function trackerZeile(k: Kontakt, telefon: string | null): TrackerZeile {
  const abgesagt = k.status === "abgesagt";
  // Eine Absage entfernt keine Häkchen: gezählt wird die Stufe beim Ausstieg.
  const erreicht: Stufe = abgesagt
    ? ((k.ausgeschiedenBei as Stufe | null | undefined) && RANG[k.ausgeschiedenBei as Stufe] !== undefined
        ? (k.ausgeschiedenBei as Stufe)
        : "angeschrieben")
    : k.status;
  const rang = RANG[erreicht] ?? 0;
  const stufen = Object.fromEntries(
    TRACKER_STUFEN.map((s) => [s.schluessel, rang >= RANG[s.ab]]),
  ) as Record<TrackerStufe, boolean>;

  const hatGeantwortet = !!k.letzteAntwort || rang >= RANG.interesse;
  const ergebnis: Ergebnis = abgesagt ? "Absage" : hatGeantwortet ? "Weiter" : "Offen";

  const lage = abgesagt ? ({ lage: "keine" } as const) : followupLage(k);
  const gruppe = abgesagt ? null : (GRUPPE[k.status] ?? null);
  const bisher = k.followups ?? 0;
  const stumm = lage.lage === "stumm";
  const naechstes = lage.lage === "faellig" ? lage.stufe : lage.lage === "wartet" ? bisher + 1 : null;
  const faelligAm = lage.lage === "faellig" || lage.lage === "wartet" ? plusTage(k.letzterKontakt, FOLLOWUP_TAGE) : null;

  const teile: string[] = [];
  if (k.letzteAntwort) {
    teile.push(`${ANTWORT_LABEL[antwortArt(k.letzteAntwort)]}${k.letzteAntwortAm ? ` (${datumKurz(k.letzteAntwortAm)})` : ""}`);
  }
  if (stumm && gruppe !== "Preisfrage") teile.push(`${lage.max} Follow-ups ohne Reaktion`);

  const grund = abgesagt && k.absagegrund ? (ABSAGEGRUND_LABEL[k.absagegrund as Absagegrund] ?? k.absagegrund) : null;

  let naechsteAktion: string;
  let zuTun = false;
  if (abgesagt) {
    naechsteAktion = grund ? "—" : "Absagegrund nachtragen";
    zuTun = !grund;
  } else if (lage.lage === "faellig") {
    naechsteAktion = `${lage.name} senden`;
    zuTun = true;
  } else if (lage.lage === "wartet") {
    naechsteAktion =
      gruppe === "Preisfrage" ? `Nachfrage ab ${datumKurz(faelligAm)}` : `${naechstes}. Follow-up ab ${datumKurz(faelligAm)}`;
  } else if (stumm) {
    naechsteAktion = gruppe === "Preisfrage" ? "telefonisch klären (Geschäftsführung)" : "anrufen oder schließen";
    zuTun = true;
  } else {
    naechsteAktion = WEITER_MIT[k.status] ?? "—";
    zuTun = k.status === "nda_unterzeichnet" || k.status === "besichtigung";
  }

  return {
    investorId: k.investorId,
    name: [k.firma, k.ansprechpartner].filter(Boolean).join(" · ") || k.email || k.investorId,
    email: k.email,
    telefon,
    stufen,
    ergebnis,
    kommentar: teile.join(" · "),
    absagegrund: grund,
    letzterSchritt: spaeter(k.letzterKontakt, k.letzteAntwortAm),
    notiz: k.notiz,
    fu: { gruppe, bisher, naechstes, faelligAm, faellig: lage.lage === "faellig", stumm },
    naechsteAktion,
    zuTun,
  };
}

/** Der Tracker eines Mandats. Vorgemerkte ohne Erstkontakt stehen nicht darin – sie werden nur gezählt. */
export function trackerSicht(kontakte: Kontakt[], telefon: Map<string, string | null> = new Map()): TrackerSicht {
  const angeschrieben = kontakte.filter((k) => k.status !== "vorgemerkt");
  const zeilen = angeschrieben.map((k) => trackerZeile(k, telefon.get(k.investorId) ?? null));
  const zaehle = (f: (z: TrackerZeile) => boolean): number => zeilen.filter(f).length;
  return {
    zeilen,
    zahlen: {
      gesamt: zeilen.length,
      erstkontakt: zaehle((z) => z.stufen.erstkontakt),
      interesse: zaehle((z) => z.stufen.interesse),
      ndaErhalten: zaehle((z) => z.stufen.ndaErhalten),
      ndaZurueck: zaehle((z) => z.stufen.ndaZurueck),
      mappe: zaehle((z) => z.stufen.mappe),
      feedback: zaehle((z) => z.stufen.feedback),
      weiter: zaehle((z) => z.ergebnis === "Weiter"),
      offen: zaehle((z) => z.ergebnis === "Offen"),
      absage: zaehle((z) => z.ergebnis === "Absage"),
      faellig: zaehle((z) => z.fu.faellig),
      vorgemerkt: kontakte.length - angeschrieben.length,
    },
  };
}

/** Spalten wie in Lucas Blatt 1, dahinter die Follow-up-Angaben seiner FU-Blätter. */
export const CSV_KOPF = [
  "Nr.",
  "Name",
  ...TRACKER_STUFEN.map((s) => s.label),
  "Ergebnis",
  "Kommentar",
  "Absagegrund",
  "Datum letzter Schritt",
  "E-Mail",
  "Telefon",
  "Bearbeiterkommentar",
  "Follow-up-Gruppe",
  "Bisherige Follow-ups",
  "Fällig am",
  "Nächste Aktion",
] as const;

const zelle = (wert: string | number | null | undefined): string => {
  let t = String(wert ?? "");
  // Excel wertet Zellen aus, die mit = + - @ beginnen – ein Text aus einer Mail darf keine Formel werden.
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/** CSV für Excel: Semikolon als Trenner, Zeilenende CRLF, mit BOM – so öffnet Excel die Datei mit Umlauten. */
export function trackerCsv(sicht: TrackerSicht): string {
  const zeilen = sicht.zeilen.map((z, i) =>
    [
      i + 1,
      z.name,
      ...TRACKER_STUFEN.map((s) => (z.stufen[s.schluessel] ? "✓" : "")),
      z.ergebnis,
      z.kommentar,
      z.absagegrund,
      datumKurz(z.letzterSchritt),
      z.email,
      z.telefon,
      z.notiz,
      z.fu.gruppe,
      z.fu.gruppe ? z.fu.bisher : "",
      datumKurz(z.fu.faelligAm),
      z.naechsteAktion === "—" ? "" : z.naechsteAktion,
    ]
      .map(zelle)
      .join(";"),
  );
  return "﻿" + [CSV_KOPF.join(";"), ...zeilen].join("\r\n") + "\r\n";
}
