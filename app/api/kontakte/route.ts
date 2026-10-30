import { NextResponse } from "next/server";
import { STUFEN, type Stufe } from "@/lib/crm";
import { datenbankAktiv, dbLesen, dbSchreiben } from "@/lib/supabase";

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

interface DbKontakt {
  investor_id: string;
  mandat: string;
  firma: string | null;
  ansprechpartner: string | null;
  email: string | null;
  status: Stufe;
  notiz: string | null;
  letzter_kontakt: string | null;
  naechstes_followup: string | null;
  geaendert_durch: string | null;
  geaendert: string | null;
}

export async function GET(request: Request): Promise<NextResponse<Kontaktstand>> {
  const mandat = new URL(request.url).searchParams.get("mandat") ?? "";
  if (!mandat) {
    return NextResponse.json({ modus: "fehler", grund: "Kein Mandat angegeben", kontakte: [] });
  }

  if (datenbankAktiv()) {
    try {
      const zeilen = await dbLesen<DbKontakt>(
        "kontakt",
        `mandat=eq.${encodeURIComponent(mandat)}&order=firma.asc&limit=500`,
      );
      return NextResponse.json({
        modus: "live",
        kontakte: zeilen.map((z) => ({
          investorId: z.investor_id,
          mandat: z.mandat,
          firma: z.firma,
          ansprechpartner: z.ansprechpartner,
          email: z.email,
          status: z.status,
          notiz: z.notiz,
          letzterKontakt: z.letzter_kontakt,
          naechstesFollowUp: z.naechstes_followup,
          geaendertDurch: z.geaendert_durch,
          geaendert: z.geaendert,
        })),
      });
    } catch (e) {
      return NextResponse.json({
        modus: "fehler",
        grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
        kontakte: [],
      });
    }
  }

  const url = process.env.KONTAKTE_URL;
  if (!url) {
    return NextResponse.json({ modus: "aus", grund: "KONTAKTE_URL nicht gesetzt", kontakte: [] });
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

  const durch = request.headers.get("x-seil-benutzer") ?? "";

  if (datenbankAktiv()) {
    try {
      const jetzt = new Date().toISOString();
      const zeilen = kontakte.map((k) => ({
        mandat,
        investor_id: String(k.investorId),
        firma: k.firma ?? null,
        ansprechpartner: k.ansprechpartner ?? null,
        email: k.email ?? null,
        status: k.status ?? "vorgemerkt",
        ...(k.notiz !== undefined ? { notiz: k.notiz } : {}),
        ...(k.letzterKontakt !== undefined ? { letzter_kontakt: k.letzterKontakt } : {}),
        ...(k.naechstesFollowUp !== undefined ? { naechstes_followup: k.naechstesFollowUp } : {}),
        geaendert_durch: durch,
        geaendert: jetzt,
      }));
      const geschrieben = await dbSchreiben<DbKontakt>("kontakt", zeilen, "mandat,investor_id");
      return NextResponse.json({ ok: geschrieben.length > 0, gespeichert: geschrieben.length });
    } catch (e) {
      return NextResponse.json(
        { ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" },
        { status: 502 },
      );
    }
  }

  if (!url) {
    return NextResponse.json({ ok: false, grund: "KONTAKT_SETZEN_URL nicht gesetzt" }, { status: 503 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...kopf(), "Content-Type": "application/json" },
      body: JSON.stringify({ mandat, durch, kontakte }),
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
