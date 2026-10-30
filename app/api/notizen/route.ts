import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen, dbSchreiben } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";
import type { Notiz } from "@/lib/mandat";

/** Notizen zum Mandat – was zwischen den Zeilen des Prozesses passiert ist. */
export const dynamic = "force-dynamic";

export interface Notizenliste {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  notizen: Notiz[];
}

interface DbNotiz {
  id: string;
  objekt: string;
  text: string;
  autor: string | null;
  erstellt: string | null;
}

export async function GET(request: Request): Promise<NextResponse<Notizenliste>> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ modus: "aus", grund: "Datenbank nicht eingerichtet", notizen: [] });
  }
  const mandat = new URL(request.url).searchParams.get("mandat") ?? "";
  if (!mandat) {
    return NextResponse.json({ modus: "fehler", grund: "Kein Mandat angegeben", notizen: [] });
  }
  try {
    const zeilen = await dbLesen<DbNotiz>(
      "notizen",
      `objekt=eq.${encodeURIComponent(mandat)}&order=erstellt.desc&limit=100`,
    );
    return NextResponse.json({ modus: "live", notizen: zeilen });
  } catch (e) {
    return NextResponse.json({
      modus: "fehler",
      grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
      notizen: [],
    });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ ok: false, grund: "Datenbank nicht eingerichtet" }, { status: 503 });
  }
  const b = (await request.json().catch(() => null)) as { mandat?: string; text?: string } | null;
  const mandat = b?.mandat?.trim();
  const text = b?.text?.trim();
  if (!mandat || !text) {
    return NextResponse.json({ ok: false, grund: "Mandat oder Text fehlt" }, { status: 400 });
  }
  const durch = request.headers.get("x-seil-benutzer") ?? "";

  try {
    const geschrieben = await dbSchreiben<DbNotiz>(
      "notizen",
      [{ objekt: mandat, text, autor: durch || null }],
      "id",
    );
    await protokoll({ mandat, art: "notiz", durch, text: "Notiz hinzugefügt" });
    return NextResponse.json({ ok: geschrieben.length > 0, notiz: geschrieben[0] });
  } catch (e) {
    return NextResponse.json(
      { ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" },
      { status: 502 },
    );
  }
}
