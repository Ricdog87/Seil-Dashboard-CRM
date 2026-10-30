import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen } from "@/lib/supabase";
import type { Aktivitaet } from "@/lib/mandat";

/** Die Spur: wer hat wann was getan. Nur lesen – geschrieben wird beim Tun. */
export const dynamic = "force-dynamic";

export interface Aktivitaetenliste {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  aktivitaeten: Aktivitaet[];
}

interface DbAktivitaet {
  id: string;
  mandat: string | null;
  investor_id: string | null;
  art: Aktivitaet["art"];
  text: string;
  durch: string | null;
  erstellt: string;
}

export async function GET(request: Request): Promise<NextResponse<Aktivitaetenliste>> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ modus: "aus", grund: "Datenbank nicht eingerichtet", aktivitaeten: [] });
  }
  const q = new URL(request.url).searchParams;
  const teile = ["order=erstellt.desc", `limit=${Math.min(Number(q.get("limit") ?? 50) || 50, 200)}`];
  const mandat = q.get("mandat");
  if (mandat) teile.push(`mandat=eq.${encodeURIComponent(mandat)}`);

  try {
    const zeilen = await dbLesen<DbAktivitaet>("aktivitaet", teile.join("&"));
    return NextResponse.json({
      modus: "live",
      aktivitaeten: zeilen.map((z) => ({
        id: z.id,
        mandat: z.mandat,
        investorId: z.investor_id,
        art: z.art,
        text: z.text,
        durch: z.durch,
        erstellt: z.erstellt,
      })),
    });
  } catch (e) {
    return NextResponse.json({
      modus: "fehler",
      grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
      aktivitaeten: [],
    });
  }
}
