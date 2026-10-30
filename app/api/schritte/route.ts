import { NextResponse } from "next/server";

/**
 * Der Stand eines Mandats entlang der SOP.
 *
 * Hier steht nur, was ein Mensch einträgt. Was die Automatik selbst weiß –
 * Datenraum, Abgleich, Versand, Rückmeldungen – wird nicht gespeichert, sondern
 * im Cockpit aus den Live-Quellen abgeleitet. Sonst gäbe es zwei Wahrheiten zum
 * selben Schritt, und die ältere gewinnt irgendwann.
 */
export const dynamic = "force-dynamic";

export interface SchrittStand {
  schritt: number;
  status: "done" | "in_progress" | "pending" | "na";
  notiz: string | null;
  geaendertDurch: string | null;
  geaendert: string | null;
}
export interface Mandatsstand {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  schritte: SchrittStand[];
}

const STUFEN = ["done", "in_progress", "pending", "na"];

function kopf(): Record<string, string> {
  return process.env.MODUL01_SECRET ? { "X-Seil-Secret": process.env.MODUL01_SECRET } : {};
}

export async function GET(request: Request): Promise<NextResponse<Mandatsstand>> {
  const url = process.env.SCHRITTE_URL;
  if (!url) {
    return NextResponse.json({ modus: "aus", grund: "SCHRITTE_URL nicht gesetzt", schritte: [] });
  }
  const mandat = new URL(request.url).searchParams.get("mandat") ?? "";
  if (!mandat) {
    return NextResponse.json({ modus: "fehler", grund: "Kein Mandat angegeben", schritte: [] });
  }
  const ziel = new URL(url);
  ziel.searchParams.set("mandat", mandat);

  try {
    const res = await fetch(ziel, {
      headers: kopf(),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.KONTAKTE_TIMEOUT_MS ?? 10000)),
    });
    if (!res.ok) {
      return NextResponse.json({
        modus: "fehler",
        grund: `Automatik antwortet mit HTTP ${res.status}`,
        schritte: [],
      });
    }
    const roh: unknown = await res.json();
    const d = (Array.isArray(roh) ? roh[0] : roh) as { schritte?: SchrittStand[] } | undefined;
    return NextResponse.json({ modus: "live", schritte: Array.isArray(d?.schritte) ? d.schritte : [] });
  } catch (e) {
    const grund =
      e instanceof Error ? (e.name === "TimeoutError" ? "Zeitüberschreitung" : e.message) : "unbekannt";
    return NextResponse.json({ modus: "fehler", grund, schritte: [] });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const url = process.env.SCHRITT_SETZEN_URL;
  if (!url) {
    return NextResponse.json({ ok: false, grund: "SCHRITT_SETZEN_URL nicht gesetzt" }, { status: 503 });
  }
  const b = (await request.json().catch(() => null)) as
    | { mandat?: string; schritt?: number; status?: string; notiz?: string }
    | null;
  const mandat = b?.mandat?.trim();
  const schritt = Number(b?.schritt);
  if (!mandat || !Number.isInteger(schritt) || schritt < 1 || schritt > 26) {
    return NextResponse.json({ ok: false, grund: "Mandat oder Schritt fehlt" }, { status: 400 });
  }
  if (!b?.status || !STUFEN.includes(b.status)) {
    return NextResponse.json({ ok: false, grund: "Unbekannte Stufe" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...kopf(), "Content-Type": "application/json" },
      body: JSON.stringify({
        mandat,
        schritt,
        status: b.status,
        ...(b.notiz !== undefined ? { notiz: b.notiz } : {}),
        durch: request.headers.get("x-seil-benutzer") ?? "",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.KONTAKTE_TIMEOUT_MS ?? 15000)),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, grund: `Automatik antwortet mit HTTP ${res.status}` },
        { status: 502 },
      );
    }
    const a = (await res.json().catch(() => ({}))) as { ok?: boolean };
    if (a.ok === false) {
      return NextResponse.json({ ok: false, grund: "Nichts gespeichert" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, grund: e instanceof Error ? e.message : "unbekannt" },
      { status: 502 },
    );
  }
}
