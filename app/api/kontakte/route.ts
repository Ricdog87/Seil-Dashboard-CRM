import { NextResponse } from "next/server";
import type { Stufe } from "@/lib/crm";
import { datenbankAktiv, dbLesen } from "@/lib/supabase";
import { kontakteSchreiben, stufeGueltig, type DbKontakt, type KontaktEingabe } from "@/lib/kontakte-schreiben";
import type { AntwortArt } from "@/lib/kommunikation";

/**
 * Kontaktstand je Mandat – das Gedächtnis des CRM.
 *
 * Bis hierher konnte das Cockpit zeigen, wer passt und wer angeschrieben
 * werden soll. Was danach passiert ist, wusste es nicht: wer geantwortet hat,
 * wer ein NDA unterschrieben hat, wer den Datenraum sehen darf. Das steht
 * jetzt in der Datenbank und übersteht ein Neuladen.
 *
 * Schreiben läuft über lib/kontakte-schreiben.ts – dort wird der
 * Standardprozess angewendet, egal ob jemand zieht, wählt oder die
 * Antworterkennung meldet.
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
  /** Wie oft nachgefasst wurde (Standardprozess: alle zwei Tage, 1. · 2. · weitere · Final). */
  followups: number;
  /** Letzte Antwort des Investors, eingeordnet nach Standardprozess. */
  letzteAntwort: AntwortArt | null;
  letzteAntwortAm: string | null;
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
          followups: z.followups ?? 0,
          letzteAntwort: (z.letzte_antwort as AntwortArt | null) ?? null,
          letzteAntwortAm: z.letzte_antwort_am ?? null,
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
    | { mandat?: string; kontakte?: KontaktEingabe[] }
    | null;
  const mandat = b?.mandat?.trim();
  const kontakte = (b?.kontakte ?? []).filter((k) => k && k.investorId);
  if (!mandat || kontakte.length === 0) {
    return NextResponse.json({ ok: false, grund: "Mandat oder Investor fehlt" }, { status: 400 });
  }
  if (kontakte.some((k) => k.status && !stufeGueltig(k.status))) {
    return NextResponse.json({ ok: false, grund: "Unbekannte Stufe" }, { status: 400 });
  }

  const durch = request.headers.get("x-seil-benutzer") ?? "";

  if (datenbankAktiv()) {
    try {
      const { geschrieben, aufgaben, hinweis } = await kontakteSchreiben(mandat, kontakte, durch);
      return NextResponse.json({ ok: geschrieben.length > 0, gespeichert: geschrieben.length, aufgaben, ...(hinweis ? { hinweis } : {}) });
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
