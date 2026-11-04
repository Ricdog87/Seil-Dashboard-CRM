import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen, dbSchreiben } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";
import { GEBOT_QUELLEN, GEBOT_STUFEN, GEBOT_STUFE_LABEL, aufGebot, type DbGebot, type Gebot } from "@/lib/reporting";
import { fmtEur } from "@/lib/leistung";

/**
 * Gebote je Mandat – die Grundlage für „Indikation“, „Due Diligence“,
 * „SEIL-HERO“ und die Top-Bieter im Reporting.
 *
 * Ein Gebot je Investor und Mandat; es wandert durch die Stufen und ändert
 * seinen Betrag. Jede Änderung steht in der Spur. Beträge kommen nur von Hand
 * ins System, nie automatisch aus Mails (Grundregel aus Lucas Statustracker).
 */
export const dynamic = "force-dynamic";

export interface Gebotsliste {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  gebote: Gebot[];
}

export async function GET(request: Request): Promise<NextResponse<Gebotsliste>> {
  if (!datenbankAktiv()) return NextResponse.json({ modus: "aus", grund: "Datenbank nicht eingerichtet", gebote: [] });
  const mandat = new URL(request.url).searchParams.get("mandat") ?? "";
  if (!mandat) return NextResponse.json({ modus: "fehler", grund: "Kein Mandat angegeben", gebote: [] });
  try {
    const zeilen = await dbLesen<DbGebot>("gebot", `mandat=eq.${encodeURIComponent(mandat)}&order=betrag.desc.nullslast&limit=500`);
    return NextResponse.json({ modus: "live", gebote: zeilen.map(aufGebot) });
  } catch (e) {
    return NextResponse.json({ modus: "fehler", grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar", gebote: [] });
  }
}

/** Anlegen oder ändern – Schlüssel sind Mandat und Investor. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!datenbankAktiv()) return NextResponse.json({ ok: false, grund: "Datenbank nicht eingerichtet" }, { status: 503 });
  const b = (await request.json().catch(() => null)) as (Partial<Gebot> & { mandat?: string; investorId?: string }) | null;
  const mandat = b?.mandat?.trim();
  const investorId = b?.investorId?.trim();
  if (!mandat || !investorId) return NextResponse.json({ ok: false, grund: "Mandat und Investor sind Pflicht" }, { status: 400 });
  if (b?.stufe && !(GEBOT_STUFEN as readonly string[]).includes(b.stufe)) return NextResponse.json({ ok: false, grund: "Unbekannte Stufe" }, { status: 400 });
  if (b?.quelle && !(GEBOT_QUELLEN as readonly string[]).includes(b.quelle)) return NextResponse.json({ ok: false, grund: "Unbekannte Quelle" }, { status: 400 });
  if (b?.betrag !== undefined && b.betrag !== null && (!Number.isFinite(Number(b.betrag)) || Number(b.betrag) < 0)) {
    return NextResponse.json({ ok: false, grund: "Betrag muss eine Zahl ab 0 sein" }, { status: 400 });
  }
  const durch = request.headers.get("x-seil-benutzer") ?? "";

  try {
    const [vorher] = await dbLesen<DbGebot>("gebot", `mandat=eq.${encodeURIComponent(mandat)}&investor_id=eq.${encodeURIComponent(investorId)}&limit=1`);
    const zeile: Record<string, unknown> = {
      mandat,
      investor_id: investorId,
      geaendert: new Date().toISOString(),
      geaendert_durch: durch || null,
      ...(vorher ? {} : { erstellt_durch: durch || null }),
    };
    for (const [feld, spalte] of [
      ["firma", "firma"],
      ["betrag", "betrag"],
      ["stufe", "stufe"],
      ["preisPasst", "preis_passt"],
      ["timeline", "timeline"],
      ["finanzierung", "finanzierung"],
      ["ohneBedingungen", "ohne_bedingungen"],
      ["circleKunde", "circle_kunde"],
      ["zurueckgezogen", "zurueckgezogen"],
      ["quelle", "quelle"],
      ["datum", "datum"],
      ["notiz", "notiz"],
    ] as const) {
      const w = (b as Record<string, unknown>)[feld];
      if (w !== undefined) zeile[spalte] = w === "" ? null : w;
    }
    const [g] = await dbSchreiben<DbGebot>("gebot", [zeile], "mandat,investor_id");
    if (!g) return NextResponse.json({ ok: false, grund: "Nichts gespeichert" }, { status: 502 });
    const gebot = aufGebot(g);
    const was = !vorher
      ? `Gebot erfasst: ${gebot.firma ?? investorId} · ${gebot.betrag !== null ? fmtEur(gebot.betrag) : "ohne Betrag"} · ${GEBOT_STUFE_LABEL[gebot.stufe]}`
      : gebot.zurueckgezogen && !vorher.zurueckgezogen
        ? `Gebot zurückgezogen: ${gebot.firma ?? investorId}`
        : `Gebot geändert: ${gebot.firma ?? investorId} · ${gebot.betrag !== null ? fmtEur(gebot.betrag) : "ohne Betrag"} · ${GEBOT_STUFE_LABEL[gebot.stufe]}`;
    await protokoll({ mandat, investorId, art: "kontakt", durch, text: was });
    return NextResponse.json({ ok: true, gebot });
  } catch (e) {
    return NextResponse.json({ ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" }, { status: 502 });
  }
}
