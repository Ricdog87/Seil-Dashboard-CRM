import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen, dbSchreiben } from "@/lib/supabase";
import { istGeschaeftsfuehrung } from "@/lib/rollen";
import { NAMEN, PERSONEN } from "@/lib/sitzung-token";
import {
  KPI_ARTEN, PHASEN_GEWICHT, aktuellerZeitraum, zeitraumGrenzen, zeitAnteil,
  type KpiArt, type Leistung, type PersonLeistung,
} from "@/lib/leistung";
import type { Phase } from "@/lib/mandat";

/**
 * Ziel gegen Ist – je Person und fürs Team.
 *
 * Gerechnet wird aus dem, was ohnehin da ist: Mandate (Honorar, Abschluss,
 * Anlage), die Spur (Anschreiben, NDA-Wechsel) und Aufgaben (Broker Calls).
 * Keine Zahl hier wird separat gepflegt – nur die Ziele.
 *
 * Sichtbarkeit: die Geschäftsführung sieht alle Zeilen. Alle anderen sehen
 * ihre eigene und das Team als Summe – Teamzahlen tragen, Einzelvergleiche
 * ohne Kontext machen klein.
 */
export const dynamic = "force-dynamic";

interface DbMandat { name: string; zustaendig: string | null; phase: Phase; honorar_erwartet: number | null; honorar_ist: number | null; abschluss_am: string | null; erstellt: string; }
interface DbAkt { durch: string | null; art: string; text: string; investor_id: string | null; erstellt: string; }
interface DbAufgabe { zustaendig: string | null; titel: string; erledigt: boolean; geaendert: string; }
interface DbZiel { kuerzel: string | null; zeitraum: string; art: KpiArt; wert: number; }

const leer = (): Record<KpiArt, number> => ({ umsatz: 0, abschluesse: 0, mandate: 0, anschreiben: 0, nda: 0, broker_calls: 0 });

export async function GET(request: Request): Promise<NextResponse<Leistung>> {
  const q = new URL(request.url).searchParams;
  const zeitraum = q.get("zeitraum") ?? aktuellerZeitraum();
  const { von, bis, label } = zeitraumGrenzen(zeitraum);
  const ich = (request.headers.get("x-seil-benutzer") ?? "").toLowerCase();
  const darfAlles = istGeschaeftsfuehrung(ich);
  const leerTeam: PersonLeistung = { kuerzel: null, name: "Team", ist: leer(), ziel: {}, pipelineWert: 0, pipelineGewichtet: 0, aktiveMandate: 0 };

  if (!datenbankAktiv()) {
    return NextResponse.json({ modus: "aus", grund: "Datenbank nicht eingerichtet", zeitraum, zeitraumLabel: label, zeitAnteil: 0, team: leerTeam, personen: [], darfAlles });
  }

  const vonIso = von.toISOString(), bisIso = bis.toISOString();
  const vonTag = vonIso.slice(0, 10), bisTag = bisIso.slice(0, 10);
  try {
    const [mandate, akt, aufgaben, ziele] = await Promise.all([
      dbLesen<DbMandat>("mandat", "select=name,zustaendig,phase,honorar_erwartet,honorar_ist,abschluss_am,erstellt&limit=1000"),
      dbLesen<DbAkt>("aktivitaet", `select=durch,art,text,investor_id,erstellt&erstellt=gte.${vonIso}&erstellt=lt.${bisIso}&limit=10000`),
      dbLesen<DbAufgabe>("aufgaben", `select=zustaendig,titel,erledigt,geaendert&erledigt=is.true&geaendert=gte.${vonIso}&geaendert=lt.${bisIso}&limit=5000`),
      dbLesen<DbZiel>("ziel", `zeitraum=eq.${encodeURIComponent(zeitraum)}&limit=500`),
    ]);

    const inZeitraum = (tag: string | null) => !!tag && tag >= vonTag && tag < bisTag;

    const rechne = (filter: (k: string | null) => boolean): PersonLeistung["ist"] & { pw: number; pg: number; aktiv: number } => {
      const ist = leer();
      let pw = 0, pg = 0, aktiv = 0;
      for (const m of mandate) {
        if (!filter(m.zustaendig)) continue;
        if (inZeitraum(m.abschluss_am)) { ist.abschluesse += 1; ist.umsatz += Number(m.honorar_ist ?? 0); }
        if (m.erstellt >= vonIso && m.erstellt < bisIso) ist.mandate += 1;
        if (!["abschluss", "ruht", "verloren"].includes(m.phase)) {
          aktiv += 1;
          const h = Number(m.honorar_erwartet ?? 0);
          pw += h; pg += h * (PHASEN_GEWICHT[m.phase] ?? 0);
        }
      }
      for (const a of akt) {
        if (!filter(a.durch)) continue;
        if (a.art === "versand" && a.investor_id) ist.anschreiben += 1;
        if (a.art === "kontakt" && /: nda_unterzeichnet$/.test(a.text)) ist.nda += 1;
      }
      for (const t of aufgaben) {
        if (!filter(t.zustaendig)) continue;
        if (/^Broker Call/i.test(t.titel)) ist.broker_calls += 1;
      }
      return { ...ist, pw, pg, aktiv };
    };

    const zieleVon = (k: string | null): Partial<Record<KpiArt, number>> => {
      const z: Partial<Record<KpiArt, number>> = {};
      for (const row of ziele) if ((row.kuerzel ?? null) === k && KPI_ARTEN.includes(row.art)) z[row.art] = Number(row.wert);
      return z;
    };

    const bauen = (k: string | null, name: string): PersonLeistung => {
      const r = rechne(k === null ? () => true : (x) => (x ?? "").toLowerCase() === k);
      const { pw, pg, aktiv, ...ist } = r;
      return { kuerzel: k, name, ist, ziel: zieleVon(k), pipelineWert: pw, pipelineGewichtet: pg, aktiveMandate: aktiv };
    };

    const team = bauen(null, "Team");
    // Fehlt ein Teamziel, ist es die Summe der Einzelziele - so sieht man es auch ohne Pflege.
    const alleKuerzel = Object.keys(PERSONEN);
    const personen = alleKuerzel.map((k) => bauen(k, NAMEN[k] ?? k));
    for (const art of KPI_ARTEN) {
      if (team.ziel[art] === undefined) {
        const summe = personen.reduce((n, p) => n + (p.ziel[art] ?? 0), 0);
        if (summe > 0) team.ziel[art] = summe;
      }
    }

    const sichtbar = darfAlles ? personen : personen.filter((p) => p.kuerzel === ich);
    return NextResponse.json({
      modus: "live", zeitraum, zeitraumLabel: label, zeitAnteil: zeitAnteil(zeitraum), team, personen: sichtbar, darfAlles,
    });
  } catch (e) {
    return NextResponse.json({
      modus: "fehler", grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
      zeitraum, zeitraumLabel: label, zeitAnteil: 0, team: leerTeam, personen: [], darfAlles,
    });
  }
}

/** Ziele setzen – nur die Geschäftsführung. kuerzel null = Teamziel. */
export async function POST(request: Request): Promise<NextResponse> {
  const ich = (request.headers.get("x-seil-benutzer") ?? "").toLowerCase();
  if (!istGeschaeftsfuehrung(ich)) {
    return NextResponse.json({ ok: false, grund: "Ziele setzt die Geschäftsführung." }, { status: 403 });
  }
  if (!datenbankAktiv()) {
    return NextResponse.json({ ok: false, grund: "Datenbank nicht eingerichtet" }, { status: 503 });
  }
  const b = (await request.json().catch(() => null)) as { kuerzel?: string | null; zeitraum?: string; art?: KpiArt; wert?: number } | null;
  if (!b?.zeitraum || !b.art || !KPI_ARTEN.includes(b.art) || typeof b.wert !== "number" || b.wert < 0) {
    return NextResponse.json({ ok: false, grund: "Zeitraum, Art oder Wert fehlt" }, { status: 400 });
  }
  const kuerzel = b.kuerzel ? b.kuerzel.toLowerCase() : null;
  try {
    const geschrieben = await dbSchreiben<DbZiel>(
      "ziel",
      [{ kuerzel, zeitraum: b.zeitraum, art: b.art, wert: b.wert, geaendert_durch: ich, geaendert: new Date().toISOString() }],
      kuerzel ? "kuerzel,zeitraum,art" : "zeitraum,art",
    );
    return NextResponse.json({ ok: geschrieben.length > 0 });
  } catch (e) {
    return NextResponse.json({ ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" }, { status: 502 });
  }
}
