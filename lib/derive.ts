// Reine Anzeige-Helfer: alles wird aus den Mock-Daten abgeleitet,
// damit Kennzahlen und Listen im Prototyp konsistent bleiben.

import {
  aktivitaeten,
  aufgaben,
  auftraggeber,
  HEUTE,
  investoren,
  mitarbeiter,
  objektInvestorLinks,
  objekte,
  PROZESS_PHASEN,
  PROZESS_SCHRITTE,
} from "./mock-data";
import type { Aktivitaet, Objekt, ObjektInvestorLink } from "./types";

// --- Lookups ---------------------------------------------------------------

export const objektVon = (id: string) => objekte.find((o) => o.id === id);
export const investorVon = (id: string) => investoren.find((i) => i.id === id);
export const auftraggeberVon = (id: string) => auftraggeber.find((a) => a.id === id);
export const mitarbeiterVon = (id: string) => mitarbeiter.find((m) => m.id === id);

export const linksZuObjekt = (objektId: string): ObjektInvestorLink[] =>
  objektInvestorLinks.filter((l) => l.objektId === objektId);

export const linksZuInvestor = (investorId: string): ObjektInvestorLink[] =>
  objektInvestorLinks.filter((l) => l.investorId === investorId);

export const aufgabenZuObjekt = (objektId: string) =>
  aufgaben.filter((t) => t.objektId === objektId && !t.erledigt);

export function aktivitaetenZu(filter: { objektId?: string; investorId?: string }): Aktivitaet[] {
  return aktivitaeten
    .filter((a) =>
      filter.objektId ? a.objektId === filter.objektId : a.investorId === filter.investorId,
    )
    .sort((a, b) => (a.datum < b.datum ? 1 : -1));
}

// --- Phase / Prozess (Modell: 26 Schritte in 4 Phasen, wie die Team-Excel) --

/** Weitester Schritt in Arbeit (sonst: erster offener) – Follow-ups laufen
 *  parallel weiter, die Transaktion steht aber dort, wo es am weitesten ist. */
export function aktiverSchritt(objekt: Objekt): { phase: number; nr: number; titel: string; weitere: number } {
  const inArbeit = objekt.schritte
    .map((st, i) => ({ st, i }))
    .filter((x) => x.st === "in_progress");
  const weitester =
    inArbeit.length > 0
      ? inArbeit[inArbeit.length - 1].i
      : objekt.schritte.findIndex((st) => st === "pending");
  const idx = weitester >= 0 ? weitester : objekt.schritte.length - 1;
  const schritt = PROZESS_SCHRITTE[idx];
  const phase = PROZESS_PHASEN.findIndex((p) => schritt.nr >= p.vonNr && schritt.nr <= p.bisNr);
  return { phase: phase + 1, nr: schritt.nr, titel: schritt.kurz, weitere: Math.max(0, inArbeit.length - 1) };
}

/** Prozessfortschritt: erledigte Schritte / anwendbare Schritte (N.A. zählt nicht). */
export function prozessFortschritt(objekt: Objekt): { done: number; gesamt: number } {
  const anwendbar = objekt.schritte.filter((st) => st !== "na");
  return { done: anwendbar.filter((st) => st === "done").length, gesamt: anwendbar.length };
}

/** Board-Spalten = die 4 Phasen der Team-Excel. */
export const PIPELINE_STUFEN = PROZESS_PHASEN.map((p) => p.titel);

export function pipelineStufe(objekt: Objekt): number {
  return aktiverSchritt(objekt).phase - 1;
}

/** Objekte, deren Vermarktung vorbereitet oder gestartet ist (ab Matching-Liste erledigt). */
export const inVermarktungskontext = (objekt: Objekt): boolean =>
  objekt.schritte[13] === "done";

// --- Datenraum -------------------------------------------------------------

export function datenraumFortschritt(objekt: Objekt): { vorhanden: number; gesamt: number } | null {
  if (!objekt.datenraum.angefordert) return null;
  const gesamt = objekt.datenraum.dokumente.length;
  const vorhanden = objekt.datenraum.dokumente.filter((d) => d.status === "vorhanden").length;
  return { vorhanden, gesamt };
}

export const hatDatenraumLuecke = (objekt: Objekt): boolean => {
  const f = datenraumFortschritt(objekt);
  return f !== null && f.vorhanden < f.gesamt;
};

// --- Kennzahlen für die Übersicht -----------------------------------------

export const ohneRueckmeldung = (): ObjektInvestorLink[] =>
  objektInvestorLinks.filter((l) => l.status === "angeschrieben");

export const istUeberfaellig = (datum?: string): boolean => !!datum && datum < HEUTE;

export function kpis() {
  const offen = aufgaben.filter((t) => !t.erledigt);
  const brokerCalls = offen.filter((t) => t.typ === "broker_call");
  const stumm = ohneRueckmeldung();
  const handlungsbedarf = stumm.filter(
    (l) => istUeberfaellig(l.naechstesFollowUp) || l.followUpStufe === 3,
  );
  const luecken = objekte.filter(hatDatenraumLuecke);
  return {
    transaktionen: objekte.length,
    offeneAufgaben: offen.length,
    brokerCalls: brokerCalls.length,
    ohneRueckmeldung: stumm.length,
    handlungsbedarf: handlungsbedarf.length,
    datenraumLuecken: luecken.length,
  };
}

// --- Formatierung ----------------------------------------------------------

export const fmtMio = (mio: number) =>
  `${mio.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mio. €`;

export const fmtTicket = (min: number, max: number) => `${min}–${max} Mio. €`;

export function fmtDatum(iso?: string): string {
  if (!iso) return "–";
  const [d] = iso.split("T");
  const [y, m, t] = d.split("-");
  return `${t}.${m}.${y}`;
}

export function fmtDatumKurz(iso?: string): string {
  if (!iso) return "–";
  const [d, zeit] = iso.split("T");
  const [, m, t] = d.split("-");
  return zeit ? `${t}.${m}. ${zeit} Uhr` : `${t}.${m}.`;
}

/** Relative Bezeichnung für Fälligkeiten, bezogen auf den Referenztag. */
export function faelligLabel(iso: string): { text: string; ton: "crit" | "warn" | "neutral" } {
  if (iso < HEUTE) return { text: `überfällig seit ${fmtDatum(iso)}`, ton: "crit" };
  if (iso === HEUTE) return { text: "heute fällig", ton: "warn" };
  return { text: fmtDatum(iso), ton: "neutral" };
}
