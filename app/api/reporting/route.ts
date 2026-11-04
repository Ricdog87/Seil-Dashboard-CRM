import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen, inListe } from "@/lib/supabase";
import { laufPraefix } from "@/lib/mandat";
import { modul01Objekte } from "@/lib/modul01-sync";
import {
  aufGebot,
  berichtRechnen,
  type Absagegrund,
  type Bericht,
  type DbGebot,
  type Kaeufertyp,
} from "@/lib/reporting";
import type { Stufe } from "@/lib/crm";

/**
 * Das Reporting eines Mandats – eine Seite für den Verkäufer, nach Lucas Vorlage.
 * Rechnet aus Verteiler, Geboten und Kundendaten; die Objektadresse kommt aus
 * dem Datenraum (Modul 01), sofern die Engine sie gelesen hat.
 */
export const dynamic = "force-dynamic";

export type Reporting = { modus: "live" | "aus" | "fehler"; grund?: string; bericht: Bericht | null };

interface DbMandat { name: string; stadt: string | null; assetklasse: string | null; kaufpreis: number | string | null; lauf_praefix: string | null }
interface DbKontakt { investor_id: string; firma: string | null; status: Stufe; ausgeschieden_bei: string | null; absagegrund: Absagegrund | null }

export async function GET(request: Request): Promise<NextResponse<Reporting>> {
  if (!datenbankAktiv()) return NextResponse.json({ modus: "aus", grund: "Datenbank nicht eingerichtet", bericht: null });
  const name = new URL(request.url).searchParams.get("mandat") ?? "";
  if (!name) return NextResponse.json({ modus: "fehler", grund: "Kein Mandat angegeben", bericht: null });

  try {
    const q = encodeURIComponent(name);
    const [mandate, kontakte, gebote, raeume] = await Promise.all([
      dbLesen<DbMandat>("mandat", `name=eq.${q}&select=name,stadt,assetklasse,kaufpreis,lauf_praefix&limit=1`),
      dbLesen<DbKontakt>("kontakt", `mandat=eq.${q}&select=investor_id,firma,status,ausgeschieden_bei,absagegrund&limit=5000`),
      dbLesen<DbGebot>("gebot", `mandat=eq.${q}&limit=1000`),
      modul01Objekte(),
    ]);
    const m = mandate[0];
    if (!m) return NextResponse.json({ modus: "fehler", grund: "Mandat nicht gefunden", bericht: null });

    const ids = [...new Set([...kontakte.map((k) => k.investor_id), ...gebote.map((g) => g.investor_id)])];
    const typen = new Map<string, Kaeufertyp | null>();
    for (let i = 0; i < ids.length; i += 150) {
      const teil = ids.slice(i, i + 150);
      const zeilen = await dbLesen<{ investor_id: string; kaeufertyp: Kaeufertyp | null }>(
        "kunde",
        `investor_id=${encodeURIComponent(inListe(teil))}&select=investor_id,kaeufertyp&limit=1000`,
      );
      for (const z of zeilen) typen.set(z.investor_id, z.kaeufertyp);
    }

    // Objektadresse aus dem jüngsten Datenraum-Lauf dieses Mandats.
    const lauf = m.lauf_praefix ?? m.name;
    const adresse =
      raeume
        .filter((o) => laufPraefix(o.objektName ?? "") === lauf)
        .sort((a, b) => String(b.objektName).localeCompare(String(a.objektName)))
        .map((o) => o.kennwerte?.find((k) => k.feld === "Objektadresse")?.wert)
        .find(Boolean) ?? null;

    const bericht = berichtRechnen({
      name: m.name,
      adresse,
      kaufpreis: m.kaufpreis === null ? null : Number(m.kaufpreis),
      assetklasse: m.assetklasse,
      stadt: m.stadt,
      kontakte: kontakte.map((k) => ({
        investorId: k.investor_id,
        firma: k.firma,
        status: k.status,
        ausgeschiedenBei: k.ausgeschieden_bei,
        absagegrund: k.absagegrund,
        kaeufertyp: typen.get(k.investor_id) ?? null,
      })),
      gebote: gebote.map(aufGebot),
    });
    // Gebote ohne Kontaktzeile kennen ihren Käufertyp über die Kundendaten.
    for (const t of bericht.topBieter) if (!t.kaeufertyp) t.kaeufertyp = typen.get(t.investorId) ?? null;
    return NextResponse.json({ modus: "live", bericht });
  } catch (e) {
    return NextResponse.json({ modus: "fehler", grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar", bericht: null });
  }
}
