import { laufPraefix } from "./mandat";
import type { Modul01Kosten, Modul01Objekt } from "./modul01";

/**
 * Was der Datenraum eines Mandats an KI gekostet hat.
 *
 * Modul 01 liefert die Kosten je Lauf (Listenpreis, US-Dollar, dazu Euro zum festen Kurs).
 * Ein Mandat hat oft mehrere Läufe – Testlauf, Abnahmelauf, Nachlieferung. Hier wird über die
 * Läufe des Mandats summiert; zugeordnet wird wie überall über den Lauf-Präfix (Laufname ohne
 * Zeitstempel). Gespeichert wird nichts: Die Zahl kommt bei jedem Aufruf frisch aus Modul 01.
 */
export interface LaufKosten extends Modul01Kosten {
  lauf: string;
}

export interface MandatKosten {
  /** Läufe des Mandats in Modul 01. */
  laeufe: number;
  /** Davon mit Aufzeichnung – Läufe vor dem 12.11.2026 haben keine. */
  mitAufzeichnung: number;
  usd: number;
  /** Summe in Euro – nur, wenn jeder aufgezeichnete Lauf einen Kurs trägt; sonst `null`. */
  eur: number | null;
  aufrufeOhnePreis: number;
  /** Laufzeit aller aufgezeichneten Läufe zusammen. */
  laufzeitMs: number;
  /** Der jüngste aufgezeichnete Lauf. */
  letzter: LaufKosten;
}

const zahl = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);

function gueltig(k: Modul01Kosten | null | undefined): k is Modul01Kosten {
  return !!k && typeof k === "object" && typeof k.usd === "number" && Number.isFinite(k.usd) && k.usd >= 0;
}

/** Kosten der Läufe eines Mandats; `null`, wenn kein Lauf eine Aufzeichnung hat. */
export function kostenJeMandat(
  objekte: Modul01Objekt[],
  mandat: { name: string; laufPraefix: string | null },
): MandatKosten | null {
  const praefix = mandat.laufPraefix ?? mandat.name;
  const laeufe = objekte
    .filter((o) => laufPraefix(o.objektName ?? "") === praefix)
    .sort((a, b) => String(b.objektName).localeCompare(String(a.objektName)));
  const mit: LaufKosten[] = [];
  for (const o of laeufe) {
    if (gueltig(o.kosten)) mit.push({ ...o.kosten, lauf: String(o.objektName) });
  }
  const letzter = mit[0];
  if (!letzter) return null;
  const alleMitKurs = mit.every((k) => typeof k.eur === "number");
  return {
    laeufe: laeufe.length,
    mitAufzeichnung: mit.length,
    usd: Math.round(mit.reduce((n, k) => n + k.usd, 0) * 100) / 100,
    eur: alleMitKurs ? Math.round(mit.reduce((n, k) => n + zahl(k.eur), 0) * 100) / 100 : null,
    aufrufeOhnePreis: mit.reduce((n, k) => n + zahl(k.aufrufeOhnePreis), 0),
    laufzeitMs: mit.reduce((n, k) => n + zahl(k.laufzeitMs), 0),
    letzter,
  };
}

const ZWEI = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/** „7,26 $“ – unter einem halben Cent „unter 1 Cent“. */
export function usdText(usd: number): string {
  return usd > 0 && usd < 0.005 ? "unter 1 Cent" : `${usd.toLocaleString("de-DE", ZWEI)} $`;
}

/** „≈ 6,52 €“ oder leer, wenn es keinen Euro-Betrag gibt. */
export function eurText(eur: number | null): string {
  return eur === null || (eur > 0 && eur < 0.005) ? "" : `≈ ${eur.toLocaleString("de-DE", ZWEI)} €`;
}

/** „10 min 52 s“ · „1 h 12 min“ · „45 s“. */
export function dauerText(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sek = s % 60;
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min ${String(sek).padStart(2, "0")} s`;
  return `${sek} s`;
}

/** „2026-11-11“ → „11.11.2026“. */
export function datumDe(iso: string | null): string {
  return iso ? iso.slice(0, 10).split("-").reverse().join(".") : "";
}
