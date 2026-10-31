import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen, dbSchreiben } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";
import { DOKUMENT_STATUS, STANDARD_DOKUMENTE, type DokumentStatus } from "@/lib/sop";

/**
 * Die Standarddokumente eines Mandats – SOP Schritt 7.
 *
 * Das ist die Sicht des Hausverkäufers auf das Mandat: nach genau diesen
 * Unterlagen wird er gefragt. Was fehlt, was angefordert ist, was vorliegt.
 * Die Liste selbst ist die der Datenraum-SOP vom 18.02.2026, wortgetreu.
 */
export const dynamic = "force-dynamic";

export type { DokumentStatus } from "@/lib/sop";

export interface DokumentStand {
  dokument: string;
  status: DokumentStatus;
  notiz: string | null;
  geaendertDurch: string | null;
  geaendert: string | null;
}
export interface Dokumentenliste {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  dokumente: DokumentStand[];
}

interface DbDok {
  dokument: string;
  status: DokumentStatus;
  notiz: string | null;
  geaendert_durch: string | null;
  geaendert: string | null;
}

export async function GET(request: Request): Promise<NextResponse<Dokumentenliste>> {
  const mandat = new URL(request.url).searchParams.get("mandat") ?? "";
  if (!mandat) {
    return NextResponse.json({ modus: "fehler", grund: "Kein Mandat angegeben", dokumente: [] });
  }
  if (!datenbankAktiv()) {
    return NextResponse.json({ modus: "aus", grund: "Datenbank nicht eingerichtet", dokumente: [] });
  }
  try {
    const zeilen = await dbLesen<DbDok>(
      "mandat_dokument",
      `mandat=eq.${encodeURIComponent(mandat)}&limit=100`,
    );
    const nach = new Map(zeilen.map((z) => [z.dokument, z]));
    // Immer die volle Liste der SOP: ein Dokument ohne Zeile fehlt, es ist
    // nicht "unbekannt".
    const dokumente: DokumentStand[] = STANDARD_DOKUMENTE.map((d) => {
      const z = nach.get(d);
      return {
        dokument: d,
        status: z?.status ?? "fehlt",
        notiz: z?.notiz ?? null,
        geaendertDurch: z?.geaendert_durch ?? null,
        geaendert: z?.geaendert ?? null,
      };
    });
    return NextResponse.json({ modus: "live", dokumente });
  } catch (e) {
    return NextResponse.json({
      modus: "fehler",
      grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
      dokumente: [],
    });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ ok: false, grund: "Datenbank nicht eingerichtet" }, { status: 503 });
  }
  const b = (await request.json().catch(() => null)) as
    | { mandat?: string; dokument?: string; status?: string; notiz?: string }
    | null;
  const mandat = b?.mandat?.trim();
  const dokument = b?.dokument?.trim();
  if (!mandat || !dokument || !(STANDARD_DOKUMENTE as readonly string[]).includes(dokument)) {
    return NextResponse.json({ ok: false, grund: "Mandat oder Dokument fehlt" }, { status: 400 });
  }
  if (!b?.status || !(DOKUMENT_STATUS as readonly string[]).includes(b.status)) {
    return NextResponse.json({ ok: false, grund: "Unbekannter Stand" }, { status: 400 });
  }
  const durch = request.headers.get("x-seil-benutzer") ?? "";
  try {
    const geschrieben = await dbSchreiben<DbDok>(
      "mandat_dokument",
      [
        {
          mandat,
          dokument,
          status: b.status,
          ...(b.notiz !== undefined ? { notiz: b.notiz } : {}),
          geaendert_durch: durch,
          geaendert: new Date().toISOString(),
        },
      ],
      "mandat,dokument",
    );
    if (geschrieben.length > 0) {
      await protokoll({ mandat, art: "datenraum", durch, text: `${dokument}: ${b.status.replace("_", " ")}` });
    }
    return NextResponse.json({ ok: geschrieben.length > 0 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" },
      { status: 502 },
    );
  }
}
