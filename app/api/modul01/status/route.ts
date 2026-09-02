import { NextResponse } from "next/server";
import { objekte } from "@/lib/mock-data";
import {
  DEMO_STAND,
  ordneZu,
  parseMapping,
  type Modul01Antwort,
  type Modul01Stand,
} from "@/lib/modul01";

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
    return NextResponse.json({
      modus: "live",
      stand: roh.stand,
      abgerufen: new Date().toISOString(),
      ...zuordnung,
    });
  } catch (e) {
    const grund = e instanceof Error ? (e.name === "TimeoutError" ? "Zeitüberschreitung" : e.message) : "unbekannt";
    return NextResponse.json({ ...DEMO_STAND, modus: "fehler", grund });
  }
}
