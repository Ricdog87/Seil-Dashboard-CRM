import { NextResponse } from "next/server";

/**
 * Leseweg Investoren-Liveliste → Cockpit. Läuft ausschließlich auf dem Server:
 * Adresse und Geheimnis stehen nur in der Umgebung, der Browser sieht nur die
 * fertige Liste. Nichts wird zwischengespeichert – die Liveliste in OneDrive
 * bleibt die einzige Quelle.
 */
export const dynamic = "force-dynamic";

export interface LiveInvestor {
  id: string;
  firma: string;
  ansprechpartner: string | null;
  email: string | null;
  regionen: string[];
  assetklassen: string[];
  ticketMinMio: number | null;
  ticketMaxMio: number | null;
  letzteAnkaeufe: string[];
}
export interface LiveInvestoren {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  stand?: string;
  gesamt?: number;
  investoren: LiveInvestor[];
}

export async function GET(request: Request): Promise<NextResponse<LiveInvestoren>> {
  const url = process.env.INVESTOREN_URL;
  if (!url) {
    return NextResponse.json({ modus: "aus", grund: "INVESTOREN_URL nicht gesetzt", investoren: [] });
  }
  const suche = new URL(request.url).searchParams.get("suche") ?? "";
  const ziel = new URL(url);
  if (suche) ziel.searchParams.set("suche", suche);
  ziel.searchParams.set("limit", "500");

  try {
    const res = await fetch(ziel, {
      headers: process.env.MODUL01_SECRET ? { "X-Seil-Secret": process.env.MODUL01_SECRET } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.INVESTOREN_TIMEOUT_MS ?? 15000)),
    });
    if (!res.ok) {
      return NextResponse.json({
        modus: "fehler",
        grund: `Liveliste antwortet mit HTTP ${res.status}`,
        investoren: [],
      });
    }
    const roh: unknown = await res.json();
    const d = (Array.isArray(roh) ? roh[0] : roh) as Partial<LiveInvestoren> | undefined;
    return NextResponse.json({
      modus: "live",
      stand: d?.stand,
      gesamt: d?.gesamt,
      investoren: Array.isArray(d?.investoren) ? d.investoren : [],
    });
  } catch (e) {
    const grund =
      e instanceof Error ? (e.name === "TimeoutError" ? "Zeitüberschreitung" : e.message) : "unbekannt";
    return NextResponse.json({ modus: "fehler", grund, investoren: [] });
  }
}
