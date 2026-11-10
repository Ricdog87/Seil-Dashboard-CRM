import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen } from "@/lib/supabase";

/**
 * Puls – ein Lesezugriff auf die Datenbank am Tag, mehr nicht.
 *
 * Supabase legt kostenlose Projekte nach sieben Tagen ohne Zugriffe schlafen. Ein
 * schlafendes Cockpit zeigt nichts und nimmt nichts von Modul 01 an – auch wenn das
 * Team gerade nicht darin arbeitet. Der Vercel-Cron (vercel.json) ruft diese Route
 * jeden Morgen auf; die Middleware lässt ihn mit dem CRON_SECRET durch. Es wird
 * nichts geschrieben: kein Eintrag im Verlauf, keine Spur in den Daten.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ ok: false, grund: "Datenbank nicht eingerichtet" }, { status: 503 });
  }
  try {
    const [mandate, kontakte] = await Promise.all([
      dbLesen<{ id: string }>("mandat", "select=id&limit=1"),
      dbLesen<{ id: string }>("kontakt", "select=id&limit=1"),
    ]);
    return NextResponse.json({
      ok: true,
      datenbank: "erreichbar",
      mandat: mandate.length > 0,
      kontakt: kontakte.length > 0,
      zeit: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" },
      { status: 502 },
    );
  }
}
