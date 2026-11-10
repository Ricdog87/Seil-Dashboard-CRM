import { NextResponse } from "next/server";
import { objekte } from "@/lib/mock-data";
import {
  DEMO_STAND,
  ordneZu,
  parseMapping,
  type Modul01Antwort,
  type Modul01Stand,
} from "@/lib/modul01";
import { istTestlauf } from "@/lib/modul01-sync";
import { laufPraefix } from "@/lib/mandat";
import { datenbankAktiv, dbLesen } from "@/lib/supabase";

/**
 * Leseweg Modul 01 → Cockpit. Läuft ausschließlich auf dem Server: URL und Secret der
 * Datenraum-Status-API (n8n WF 09) stehen nur in der Umgebung, der Browser sieht nur den
 * normalisierten Stand. Ohne Konfiguration antwortet die Route mit „demo“ – das Cockpit
 * zeigt dann unverändert die Demodaten.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<Modul01Stand>> {
  const url = process.env.MODUL01_STATUS_URL;
  if (!url) {
    return NextResponse.json({ ...DEMO_STAND, grund: "MODUL01_STATUS_URL nicht gesetzt" });
  }
  const secret = process.env.MODUL01_SECRET;
  const timeout = Number(process.env.MODUL01_TIMEOUT_MS ?? 4000);

  try {
    const res = await fetch(url, {
      headers: secret ? { "X-Seil-Secret": secret } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) {
      return NextResponse.json({
        ...DEMO_STAND,
        modus: "fehler",
        grund: `Modul 01 antwortet mit HTTP ${res.status}`,
      });
    }
    const roh = (await res.json()) as Modul01Antwort;
    const zuordnung = ordneZu(
      roh,
      parseMapping(process.env.MODUL01_OBJEKT_MAP),
      objekte.map((o) => o.id),
    );
    const laeufe = await laeufeZaehlen(roh);
    return NextResponse.json({
      modus: "live",
      stand: roh.stand,
      abgerufen: new Date().toISOString(),
      ...zuordnung,
      ...(laeufe ? { laeufe } : {}),
    });
  } catch (e) {
    const grund = e instanceof Error ? (e.name === "TimeoutError" ? "Zeitüberschreitung" : e.message) : "unbekannt";
    return NextResponse.json({ ...DEMO_STAND, modus: "fehler", grund });
  }
}

/**
 * Läufe den Mandaten zuordnen – über den Lauf-Präfix (Laufname ohne Zeitstempel), genau wie
 * der Sync die Mandate anlegt. Test- und Demoläufe zählen getrennt; was übrig bleibt, hat im
 * Cockpit wirklich noch kein Mandat.
 */
async function laeufeZaehlen(roh: Modul01Antwort): Promise<Modul01Stand["laeufe"] | null> {
  const alle = roh.objekte ?? [];
  if (alle.length === 0) return { gesamt: 0, mitMandat: 0, test: 0, ohneMandat: 0 };
  if (!datenbankAktiv()) return null;
  try {
    const mandate = await dbLesen<{ name: string; lauf_praefix: string | null }>("mandat", "select=name,lauf_praefix&limit=2000");
    const bekannt = new Set(mandate.flatMap((m) => [m.name, m.lauf_praefix].filter((x): x is string => !!x)));
    let mitMandat = 0;
    let test = 0;
    for (const o of alle) {
      const name = o.objektName ?? "";
      if (bekannt.has(laufPraefix(name))) mitMandat++;
      else if (istTestlauf(name)) test++;
    }
    return { gesamt: alle.length, mitMandat, test, ohneMandat: alle.length - mitMandat - test };
  } catch {
    return null;
  }
}
