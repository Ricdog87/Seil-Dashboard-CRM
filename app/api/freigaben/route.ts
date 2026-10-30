import { NextResponse } from "next/server";

/**
 * Freigabe-Eingang: die Anschreiben, die auf eine Entscheidung warten.
 *
 * Das Cockpit hält keine Datenbankzugänge. Gelesen und entschieden wird über
 * dieselbe Automatik, die die Entwürfe erzeugt – mit dem Geheimnis, das auch
 * für Modul 01 und die Liveliste gilt. Damit liegt die Hoheit über die Daten
 * dort, wo der Versand passiert, und nicht im Browser.
 */
export const dynamic = "force-dynamic";

export interface Freigabe {
  entwurfId: string;
  objekt: string | null;
  investorFirma: string | null;
  investorName: string | null;
  investorEmail: string | null;
  betreff: string | null;
  entwurf: string | null;
  treffer: string[];
  erstellt: string | null;
}
export interface FreigabeEingang {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  offen: Freigabe[];
}

function kopf(): Record<string, string> {
  return process.env.MODUL01_SECRET ? { "X-Seil-Secret": process.env.MODUL01_SECRET } : {};
}

export async function GET(): Promise<NextResponse<FreigabeEingang>> {
  const url = process.env.FREIGABEN_URL;
  if (!url) {
    return NextResponse.json({ modus: "aus", grund: "FREIGABEN_URL nicht gesetzt", offen: [] });
  }
  try {
    const res = await fetch(url, {
      headers: kopf(),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.FREIGABEN_TIMEOUT_MS ?? 10000)),
    });
    if (!res.ok) {
      return NextResponse.json({
        modus: "fehler",
        grund: `Automatik antwortet mit HTTP ${res.status}`,
        offen: [],
      });
    }
    const roh: unknown = await res.json();
    const d = (Array.isArray(roh) ? roh[0] : roh) as { offen?: Freigabe[] } | undefined;
    return NextResponse.json({ modus: "live", offen: Array.isArray(d?.offen) ? d.offen : [] });
  } catch (e) {
    const grund =
      e instanceof Error ? (e.name === "TimeoutError" ? "Zeitüberschreitung" : e.message) : "unbekannt";
    return NextResponse.json({ modus: "fehler", grund, offen: [] });
  }
}

/**
 * Die Entscheidung. Wer entschieden hat, bestimmt nicht der Browser, sondern
 * das Sitzungs-Cookie: die Middleware reicht das Kürzel als Kopfzeile weiter.
 * So steht im Protokoll der Mensch, der angemeldet war.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const url = process.env.FREIGABE_ENTSCHEIDUNG_URL;
  if (!url) {
    return NextResponse.json({ ok: false, grund: "FREIGABE_ENTSCHEIDUNG_URL nicht gesetzt" }, { status: 503 });
  }
  const koerper = (await request.json().catch(() => null)) as
    | { entwurfId?: string; entscheidung?: string }
    | null;
  const entwurfId = koerper?.entwurfId;
  const entscheidung = koerper?.entscheidung;
  if (!entwurfId || (entscheidung !== "freigegeben" && entscheidung !== "abgelehnt")) {
    return NextResponse.json({ ok: false, grund: "Entwurf oder Entscheidung fehlt" }, { status: 400 });
  }
  const durch = request.headers.get("x-seil-benutzer") ?? "";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...kopf(), "Content-Type": "application/json" },
      body: JSON.stringify({ entwurfId, entscheidung, durch }),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.FREIGABEN_TIMEOUT_MS ?? 10000)),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, grund: `Automatik antwortet mit HTTP ${res.status}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const grund = e instanceof Error ? e.message : "unbekannt";
    return NextResponse.json({ ok: false, grund }, { status: 502 });
  }
}
