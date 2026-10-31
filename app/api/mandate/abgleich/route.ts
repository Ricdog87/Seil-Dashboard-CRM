import { NextResponse } from "next/server";
import { mandatAbgleichen } from "@/lib/modul01-sync";

/**
 * Abgleich eines Mandats gegen die Liveliste – Flowchart 13, auf Knopfdruck.
 * Läuft auch automatisch, sobald Region und Assetklasse am Mandat stehen;
 * hier kann das Team ihn wiederholen, wenn die Liveliste gewachsen ist.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const b = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = b?.name?.trim();
  if (!name) return NextResponse.json({ ok: false, grund: "Mandat fehlt" }, { status: 400 });
  const durch = request.headers.get("x-seil-benutzer") ?? "";
  const r = await mandatAbgleichen(name, durch || "automatik");
  return NextResponse.json(r, { status: r.ok ? 200 : 409 });
}
