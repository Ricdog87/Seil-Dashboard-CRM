import { NextResponse } from "next/server";
import { STUFEN, type Stufe } from "@/lib/crm";

/**
 * Kontaktstand je Mandat – das Gedächtnis des CRM.
 *
 * Bis hierher konnte das Cockpit zeigen, wer passt und wer angeschrieben
 * werden soll. Was danach passiert ist, wusste es nicht: wer geantwortet hat,
 * wer ein NDA unterschrieben hat, wer den Datenraum sehen darf. Das steht
 * jetzt in der Datenbank und übersteht ein Neuladen.
 *
 * Wie überall sonst: das Cockpit hält keinen Datenbankzugang, es geht über die
 * Automatik mit demselben Header-Geheimnis.
 */
export const dynamic = "force-dynamic";

export interface Kontakt {
  investorId: string;
  mandat: string;
  firma: string | null;
  ansprechpartner: string | null;
  email: string | null;
  status: Stufe;
  notiz: string | null;
  letzterKontakt: string | null;
  naechstesFollowUp: string | null;
  geaendertDurch: string | null;
  geaendert: string | null;
}
export interface Kontaktstand {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  kontakte: Kontakt[];
}

function kopf(): Record<string, string> {
  return process.env.MODUL01_SECRET ? { "X-Seil-Secret": process.env.MODUL01_SECRET } : {};
}

export async function GET(request: Request): Promise<NextResponse<Kontaktstand>> {
  const url = process.env.KONTAKTE_URL;
  if (!url) {
    return NextResponse.json({ modus: "aus", grund: "KONTAKTE_URL nicht gesetzt", kontakte: [] });
  }
  const mandat = new URL(request.url).searchParams.get("mandat") ?? "";
  if (!mandat) {
    return NextResponse.json({ modus: "fehler", grund: "Kein Mandat angegeben", kontakte: [] });
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
        kontakte: [],
      });
    }
    const roh: unknown = await res.json();
    const d = (Array.isArray(roh) ? roh[0] : roh) as { kontakte?: Kontakt[] } | undefined;
    return NextResponse.json({ modus: "live", kontakte: Array.isArray(d?.kontakte) ? d.kontakte : [] });
  } catch (e) {
    const grund =
      e instanceof Error ? (e.name === "TimeoutError" ? "Zeitüberschreitung" : e.message) : "unbekannt";
    return NextResponse.json({ modus: "fehler", grund, kontakte: [] });
  }
}

/** Einen oder viele Stände setzen. Wer es war, kommt aus der Sitzung. */
export async function POST(request: Request): Promise<NextResponse> {
  const url = process.env.KONTAKT_SETZEN_URL;
  if (!url) {
    return NextResponse.json({ ok: false, grund: "KONTAKT_SETZEN_URL nicht gesetzt" }, { status: 503 });
  }
  const b = (await request.json().catch(() => null)) as
    | { mandat?: string; kontakte?: Partial<Kontakt>[] }
    | null;
  const mandat = b?.mandat?.trim();
  const kontakte = (b?.kontakte ?? []).filter((k) => k && k.investorId);
  if (!mandat || kontakte.length === 0) {
    return NextResponse.json({ ok: false, grund: "Mandat oder Investor fehlt" }, { status: 400 });
  }
  if (kontakte.some((k) => k.status && !STUFEN.includes(k.status as Stufe))) {
    return NextResponse.json({ ok: false, grund: "Unbekannte Stufe" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...kopf(), "Content-Type": "application/json" },
      body: JSON.stringify({
        mandat,
        durch: request.headers.get("x-seil-benutzer") ?? "",
        kontakte,
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
    const a = (await res.json().catch(() => ({}))) as { ok?: boolean; gespeichert?: number };
    // Die Automatik sagt, ob wirklich etwas gespeichert wurde. "Angekommen"
    // ist nicht dasselbe wie "gespeichert".
    if (a.ok === false) {
      return NextResponse.json({ ok: false, grund: "Nichts gespeichert" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, gespeichert: a.gespeichert ?? kontakte.length });
  } catch (e) {
    const grund = e instanceof Error ? e.message : "unbekannt";
    return NextResponse.json({ ok: false, grund }, { status: 502 });
  }
}
