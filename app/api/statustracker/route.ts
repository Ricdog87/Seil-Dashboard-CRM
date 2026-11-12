import { NextResponse } from "next/server";
import type { Kontakt } from "@/app/api/kontakte/route";
import type { AntwortArt } from "@/lib/kommunikation";
import type { DbKontakt } from "@/lib/kontakte-schreiben";
import type { Absagegrund } from "@/lib/reporting";
import { trackerCsv, trackerSicht, type TrackerSicht } from "@/lib/statustracker";
import { datenbankAktiv, dbLesen, inListe } from "@/lib/supabase";

/**
 * Statustracker je Mandat (Lucas Excel im Cockpit).
 *
 * GET ?mandat=…            → die Sicht als JSON
 * GET ?mandat=…&format=csv → dieselbe Sicht als Datei für Excel
 */
export const dynamic = "force-dynamic";

export interface TrackerAntwort extends TrackerSicht {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  mandat: string;
  stand: string;
}

const LEER: TrackerSicht = trackerSicht([]);

const dateiname = (mandat: string): string => {
  const d = new Date();
  const tag = `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${d.getFullYear()}`;
  const name = mandat.replace(/[^A-Za-zÄÖÜäöüß0-9 _-]+/g, " ").trim().replace(/\s+/g, "_") || "Mandat";
  return `Statustracker_${name}_${tag}.csv`;
};

export async function GET(request: Request): Promise<Response> {
  const frage = new URL(request.url).searchParams;
  const mandat = (frage.get("mandat") ?? "").trim();
  const stand = new Date().toISOString();
  const fehler = (modus: "aus" | "fehler", grund: string, status = 200) =>
    NextResponse.json<TrackerAntwort>({ modus, grund, mandat, stand, ...LEER }, { status });

  if (!mandat) return fehler("fehler", "Kein Mandat angegeben", 400);
  if (!datenbankAktiv()) return fehler("aus", "Datenbank nicht eingerichtet");

  try {
    const zeilen = await dbLesen<DbKontakt>(
      "kontakt",
      `mandat=eq.${encodeURIComponent(mandat)}&order=firma.asc&limit=1000`,
    );
    // Telefon steht am Kunden, nicht am Kontakt.
    const telefon = new Map<string, string | null>();
    const ids = zeilen.map((z) => z.investor_id);
    for (let i = 0; i < ids.length; i += 150) {
      const teil = ids.slice(i, i + 150);
      const kunden = await dbLesen<{ investor_id: string; telefon: string | null }>(
        "kunde",
        `investor_id=${encodeURIComponent(inListe(teil))}&select=investor_id,telefon&limit=1000`,
      ).catch(() => []);
      for (const k of kunden) telefon.set(k.investor_id, k.telefon);
    }
    const kontakte: Kontakt[] = zeilen.map((z) => ({
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
      absagegrund: (z.absagegrund as Absagegrund | null) ?? null,
      ausgeschiedenBei: z.ausgeschieden_bei ?? null,
    }));
    const sicht = trackerSicht(kontakte, telefon);

    if (frage.get("format") === "csv") {
      const datei = dateiname(mandat);
      return new Response(trackerCsv(sicht), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${datei.replace(/[^\x20-\x7E]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(datei)}`,
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json<TrackerAntwort>({ modus: "live", mandat, stand, ...sicht });
  } catch (e) {
    return fehler("fehler", e instanceof Error ? e.message : "Datenbank nicht erreichbar");
  }
}
