import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen } from "@/lib/supabase";
import { modul01Objekte } from "@/lib/modul01-sync";
import { vorschlaegeAusLaeufen, type Vorschlag } from "@/lib/kennwerte";

/**
 * Vorschläge aus Modul 01 für die Projektseite eines Mandats.
 *
 * Liest den jüngsten Datenraum-Lauf des Mandats (über den Lauf-Präfix) und
 * gibt zurück, was Modul 01 über das Objekt gelesen hat. Geschrieben wird hier
 * nichts – übernommen wird im Cockpit von Hand (POST /api/mandate).
 */
export const dynamic = "force-dynamic";

export interface Vorschlagsliste {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  /** Name des Laufs, aus dem die Vorschläge stammen. */
  lauf: string | null;
  vorschlaege: Vorschlag[];
}

export async function GET(request: Request): Promise<NextResponse<Vorschlagsliste>> {
  const name = (new URL(request.url).searchParams.get("name") ?? "").trim();
  if (!name) return NextResponse.json({ modus: "fehler", grund: "Kein Mandat angegeben", lauf: null, vorschlaege: [] });
  if (!datenbankAktiv() || !process.env.MODUL01_STATUS_URL) {
    return NextResponse.json({ modus: "aus", grund: "Modul 01 ist nicht angebunden", lauf: null, vorschlaege: [] });
  }
  try {
    const mandate = await dbLesen<{ name: string; lauf_praefix: string | null }>(
      "mandat",
      `name=eq.${encodeURIComponent(name)}&select=name,lauf_praefix&limit=1`,
    );
    const m = mandate[0];
    if (!m) return NextResponse.json({ modus: "fehler", grund: "Mandat nicht gefunden", lauf: null, vorschlaege: [] });
    const objekte = await modul01Objekte();
    const { lauf, vorschlaege } = vorschlaegeAusLaeufen(objekte, { name: m.name, laufPraefix: m.lauf_praefix });
    return NextResponse.json({ modus: "live", lauf, vorschlaege });
  } catch (e) {
    return NextResponse.json({
      modus: "fehler",
      grund: e instanceof Error ? e.message : "nicht erreichbar",
      lauf: null,
      vorschlaege: [],
    });
  }
}
