import { NextResponse } from "next/server";
import { datenbankAktiv, dbAendern, dbLesen, dbSchreiben } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";
import type { Aufgabe } from "@/lib/mandat";
import { darfVerteilen, istGeschaeftsfuehrung } from "@/lib/rollen";

/**
 * Aufgaben – was jemand tun muss, mit Namen und Datum daran.
 *
 * Ohne Zuständigen und ohne Datum ist eine Aufgabe nur ein Zettel. Beides darf
 * leer bleiben, aber die Liste zeigt dann auch, dass es leer ist.
 */
export const dynamic = "force-dynamic";

export interface Aufgabenliste {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  aufgaben: Aufgabe[];
}

interface DbAufgabe {
  id: string;
  titel: string;
  objekt: string | null;
  investor_id: string | null;
  zustaendig: string | null;
  faellig: string | null;
  erledigt: boolean;
  quelle: string;
  notiz: string | null;
  erstellt: string | null;
}

const auf = (z: DbAufgabe): Aufgabe => ({
  id: z.id,
  titel: z.titel,
  objekt: z.objekt,
  investorId: z.investor_id,
  zustaendig: z.zustaendig,
  faellig: z.faellig,
  erledigt: z.erledigt,
  quelle: z.quelle,
  notiz: z.notiz,
  erstellt: z.erstellt,
});

export async function GET(request: Request): Promise<NextResponse<Aufgabenliste>> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ modus: "aus", grund: "Datenbank nicht eingerichtet", aufgaben: [] });
  }
  const q = new URL(request.url).searchParams;
  const teile = ["order=faellig.asc.nullslast,erstellt.desc", "limit=300"];
  const mandat = q.get("mandat");
  // Wer nicht zur Geschaeftsfuehrung gehoert, sieht nur eigene Aufgaben - egal,
  // was er abfragt. Das ist die Regel, nicht die Oberflaeche.
  const ich = (request.headers.get("x-seil-benutzer") ?? "").toLowerCase();
  const zustaendig = darfVerteilen(ich) ? q.get("zustaendig") : ich || "niemand";
  if (mandat) teile.push(`objekt=eq.${encodeURIComponent(mandat)}`);
  const investor = q.get("investor");
  if (investor) teile.push(`investor_id=eq.${encodeURIComponent(investor)}`);
  if (zustaendig) teile.push(`zustaendig=eq.${encodeURIComponent(zustaendig)}`);
  if (q.get("offen") === "1") teile.push("erledigt=is.false");

  try {
    const zeilen = await dbLesen<DbAufgabe>("aufgaben", teile.join("&"));
    return NextResponse.json({ modus: "live", aufgaben: zeilen.map(auf) });
  } catch (e) {
    return NextResponse.json({
      modus: "fehler",
      grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
      aufgaben: [],
    });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ ok: false, grund: "Datenbank nicht eingerichtet" }, { status: 503 });
  }
  const b = (await request.json().catch(() => null)) as Partial<Aufgabe> | null;
  const titel = b?.titel?.trim();
  if (!titel) {
    return NextResponse.json({ ok: false, grund: "Ohne Titel geht es nicht" }, { status: 400 });
  }
  const durch = request.headers.get("x-seil-benutzer") ?? "";
  // Verteilen darf die Geschaeftsfuehrung; alle anderen legen Aufgaben nur fuer sich an.
  const zustaendig = darfVerteilen(durch) ? (b?.zustaendig ?? durch ?? null) : durch || null;

  try {
    const geschrieben = await dbSchreiben<DbAufgabe>(
      "aufgaben",
      [
        {
          titel,
          objekt: b?.objekt ?? null,
          investor_id: b?.investorId ?? null,
          zustaendig,
          faellig: b?.faellig || null,
          notiz: b?.notiz ?? null,
          quelle: "cockpit",
          erstellt_durch: durch,
          geaendert: new Date().toISOString(),
        },
      ],
      "id",
    );
    await protokoll({ mandat: b?.objekt ?? null, art: "aufgabe", durch, text: `Aufgabe „${titel}“ angelegt` });
    return NextResponse.json({ ok: geschrieben.length > 0, aufgabe: geschrieben.map(auf)[0] });
  } catch (e) {
    return NextResponse.json(
      { ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" },
      { status: 502 },
    );
  }
}

/** Abhaken oder wieder öffnen. */
export async function PATCH(request: Request): Promise<NextResponse> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ ok: false, grund: "Datenbank nicht eingerichtet" }, { status: 503 });
  }
  const b = (await request.json().catch(() => null)) as
    | { id?: string; erledigt?: boolean; zustaendig?: string; faellig?: string | null }
    | null;
  if (!b?.id) {
    return NextResponse.json({ ok: false, grund: "Welche Aufgabe?" }, { status: 400 });
  }
  const durch = request.headers.get("x-seil-benutzer") ?? "";
  const gf = darfVerteilen(durch);

  const aenderung: Record<string, unknown> = { geaendert: new Date().toISOString() };
  if (b.erledigt !== undefined) aenderung.erledigt = b.erledigt;
  if (b.zustaendig !== undefined && gf) aenderung.zustaendig = b.zustaendig || null;
  if (b.faellig !== undefined) aenderung.faellig = b.faellig || null;

  try {
    // Nicht-GF duerfen nur eigene Aufgaben anfassen - der Filter steht in der Abfrage.
    const filter = gf
      ? `id=eq.${encodeURIComponent(b.id)}`
      : `id=eq.${encodeURIComponent(b.id)}&zustaendig=eq.${encodeURIComponent(durch.toLowerCase())}`;
    const geaendert = await dbAendern<DbAufgabe>("aufgaben", filter, aenderung);
    if (geaendert.length === 0) {
      return NextResponse.json({ ok: false, grund: "Aufgabe nicht gefunden" }, { status: 404 });
    }
    if (b.erledigt !== undefined) {
      await protokoll({
        mandat: geaendert[0].objekt,
        art: "aufgabe",
        durch,
        text: `Aufgabe „${geaendert[0].titel}“ ${b.erledigt ? "erledigt" : "wieder geöffnet"}`,
      });
    }
    return NextResponse.json({ ok: true, aufgabe: auf(geaendert[0]) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" },
      { status: 502 },
    );
  }
}
