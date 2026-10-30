import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen, dbSchreiben } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";
import { PHASEN, type Mandat, type Phase } from "@/lib/mandat";

/** Die Mandate – das Rückgrat des CRM. */
export const dynamic = "force-dynamic";

export interface Mandatsliste {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  mandate: Mandat[];
}

interface DbMandat {
  id: string;
  name: string;
  stadt: string | null;
  assetklasse: string | null;
  auftraggeber: string | null;
  auftraggeber_id: string | null;
  phase: Phase;
  zustaendig: string | null;
  lauf_praefix: string | null;
  notiz: string | null;
  erstellt: string | null;
  geaendert: string | null;
  geaendert_durch: string | null;
}

const auf = (z: DbMandat): Mandat => ({
  id: z.id,
  name: z.name,
  stadt: z.stadt,
  assetklasse: z.assetklasse,
  auftraggeber: z.auftraggeber,
  auftraggeberId: z.auftraggeber_id,
  phase: z.phase,
  zustaendig: z.zustaendig,
  laufPraefix: z.lauf_praefix,
  notiz: z.notiz,
  erstellt: z.erstellt,
  geaendert: z.geaendert,
  geaendertDurch: z.geaendert_durch,
});

export async function GET(): Promise<NextResponse<Mandatsliste>> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ modus: "aus", grund: "Datenbank nicht eingerichtet", mandate: [] });
  }
  try {
    const zeilen = await dbLesen<DbMandat>("mandat", "order=geaendert.desc&limit=200");
    return NextResponse.json({ modus: "live", mandate: zeilen.map(auf) });
  } catch (e) {
    return NextResponse.json({
      modus: "fehler",
      grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
      mandate: [],
    });
  }
}

/** Anlegen oder ändern – der Name ist der Schlüssel. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ ok: false, grund: "Datenbank nicht eingerichtet" }, { status: 503 });
  }
  const b = (await request.json().catch(() => null)) as Partial<Mandat> | null;
  const name = b?.name?.trim();
  if (!name) {
    return NextResponse.json({ ok: false, grund: "Ohne Namen geht es nicht" }, { status: 400 });
  }
  if (b?.phase && !PHASEN.includes(b.phase)) {
    return NextResponse.json({ ok: false, grund: "Unbekannte Phase" }, { status: 400 });
  }
  const durch = request.headers.get("x-seil-benutzer") ?? "";

  try {
    const zeile: Record<string, unknown> = {
      name,
      geaendert: new Date().toISOString(),
      geaendert_durch: durch,
    };
    for (const [feld, spalte] of [
      ["stadt", "stadt"],
      ["assetklasse", "assetklasse"],
      ["auftraggeber", "auftraggeber"],
      ["auftraggeberId", "auftraggeber_id"],
      ["phase", "phase"],
      ["zustaendig", "zustaendig"],
      ["laufPraefix", "lauf_praefix"],
      ["notiz", "notiz"],
    ] as const) {
      const w = (b as Record<string, unknown>)[feld];
      if (w !== undefined) zeile[spalte] = w === "" ? null : w;
    }
    const geschrieben = await dbSchreiben<DbMandat>("mandat", [zeile], "name");
    if (geschrieben.length === 0) {
      return NextResponse.json({ ok: false, grund: "Nichts gespeichert" }, { status: 502 });
    }
    await protokoll({
      mandat: name,
      art: "mandat",
      durch,
      text: b?.phase ? `Mandat auf „${b.phase}“ gesetzt` : "Mandat angelegt oder geändert",
    });
    return NextResponse.json({ ok: true, mandat: auf(geschrieben[0]) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" },
      { status: 502 },
    );
  }
}
