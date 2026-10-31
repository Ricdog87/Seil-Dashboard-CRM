import { NextResponse } from "next/server";
import { datenraeumeAbgleichen, offeneAbgleiche } from "@/lib/modul01-sync";
import { istGeschaeftsfuehrung, istSystem } from "@/lib/rollen";

/**
 * Modul 01 → Modul 02, auf Zuruf.
 *
 * Modul 01 ruft diese Route am Ende eines Datenraum-Laufs (mit dem
 * gemeinsamen Geheimnis); die Geschäftsführung kann sie auch von Hand
 * anstoßen. Sie legt Mandate für neue Datenräume an und gleicht Mandate mit
 * Region und Assetklasse gegen die Liveliste ab. Dieselbe Logik läuft
 * außerdem bei jedem Laden der Pipeline – diese Route ist der direkte Weg.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const durch = request.headers.get("x-seil-benutzer") ?? "";
  if (!istSystem(durch) && !istGeschaeftsfuehrung(durch)) {
    return NextResponse.json({ ok: false, grund: "Nur Automatik oder Geschäftsführung." }, { status: 403 });
  }
  const b = (await request.json().catch(() => null)) as { mandat?: string } | null;
  const sync = await datenraeumeAbgleichen(undefined, istSystem(durch) ? "automatik" : durch);
  const abgleiche = await offeneAbgleiche(istSystem(durch) ? "automatik" : durch);
  return NextResponse.json({
    ok: !sync.fehler,
    ...(sync.fehler ? { grund: sync.fehler } : {}),
    angelegt: sync.angelegt,
    uebersprungen: sync.uebersprungen,
    abgleiche,
    ...(b?.mandat ? { hinweis: "Einzelabgleich über POST /api/mandate/abgleich" } : {}),
  });
}
