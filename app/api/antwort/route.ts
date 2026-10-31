import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen, inListe } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";
import { istSystem } from "@/lib/rollen";
import { antwortArt } from "@/lib/kommunikation";
import { kontakteSchreiben } from "@/lib/kontakte-schreiben";
import type { Stufe } from "@/lib/crm";

/**
 * Eine Antwort eines Investors kommt an – aus der Antworterkennung (WF 06).
 *
 * Die Automatik kennt die Mailadresse und die Einordnung, aber nicht das
 * Mandat. Das Cockpit kennt beides: es sucht die offenen Kontakte zu dieser
 * Adresse und wendet den Standardprozess an (lib/kommunikation.ts) – Stufe,
 * Vorlage, Todo, Follow-up-Kette. So muss n8n nichts über Mandate wissen.
 *
 * Einordnungen: anfrage · absage · kriterien · preisfrage · infos · telefonat ·
 * besichtigung · sonstiges. Ältere Namen (interesse, unterlagen, preisanfrage)
 * werden übersetzt.
 *
 * Zweiter Weg zur Adresse: findet sich kein Kontakt mit dieser E-Mail, fragt
 * die Route die Liveliste (Adresse → Name) und sucht den Verteiler über den
 * Namen. Ein Eintrag ohne Adresse bekommt sie dabei nachgetragen.
 */
export const dynamic = "force-dynamic";

interface DbKontakt { mandat: string; investor_id: string; firma: string | null; email: string | null; status: Stufe; }

/** Die Liveliste kennt zu einer Adresse den Namen – und der ist der Schlüssel des Verteilers. */
async function namenAusLiveliste(email: string): Promise<string[]> {
  const url = process.env.INVESTOREN_URL;
  if (!url) return [];
  const ziel = new URL(url);
  ziel.searchParams.set("limit", "2000");
  try {
    const res = await fetch(ziel, {
      headers: process.env.MODUL01_SECRET ? { "X-Seil-Secret": process.env.MODUL01_SECRET } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.INVESTOREN_TIMEOUT_MS ?? 15000)),
    });
    if (!res.ok) return [];
    const roh: unknown = await res.json();
    const d = (Array.isArray(roh) ? roh[0] : roh) as { investoren?: { id?: string; email?: string | null }[] } | undefined;
    return (d?.investoren ?? [])
      .filter((i) => i.id && (i.email ?? "").trim().toLowerCase() === email)
      .map((i) => String(i.id));
  } catch {
    return [];
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const durch = request.headers.get("x-seil-benutzer") ?? "";
  if (!istSystem(durch)) {
    return NextResponse.json({ ok: false, grund: "Nur für die Automatik." }, { status: 403 });
  }
  if (!datenbankAktiv()) {
    return NextResponse.json({ ok: false, grund: "Datenbank nicht eingerichtet" }, { status: 503 });
  }
  const b = (await request.json().catch(() => null)) as
    | { email?: string; art?: string; betreff?: string; auszug?: string; mandat?: string }
    | null;
  const email = b?.email?.trim().toLowerCase();
  const art = antwortArt(b?.art);
  if (!email) {
    return NextResponse.json({ ok: false, grund: "Ohne Absenderadresse geht es nicht" }, { status: 400 });
  }

  try {
    const grund = [
      b?.mandat ? `mandat=eq.${encodeURIComponent(b.mandat)}` : null,
      "status=neq.abgesagt",
      "select=mandat,investor_id,firma,email,status",
      "order=geaendert.desc",
      "limit=20",
    ].filter(Boolean).join("&");
    let kontakte = await dbLesen<DbKontakt>("kontakt", `email=ilike.${encodeURIComponent(email)}&${grund}`);
    let ueberListe = false;
    if (kontakte.length === 0) {
      const namen = await namenAusLiveliste(email);
      if (namen.length > 0) {
        kontakte = await dbLesen<DbKontakt>("kontakt", `investor_id=${encodeURIComponent(inListe(namen))}&${grund}`);
        ueberListe = kontakte.length > 0;
      }
    }

    if (kontakte.length === 0) {
      // Unbekannte Adresse: nicht verlieren, nur protokollieren.
      await protokoll({ art: "kontakt", durch: null, text: `Antwort von ${email} (${art}) – kein offener Kontakt dazu` });
      return NextResponse.json({ ok: true, art, getroffen: 0, hinweis: "kein offener Kontakt zu dieser Adresse" });
    }

    const geaendert: { mandat: string; investor: string; status: Stufe }[] = [];
    let aufgaben = 0;
    const jeMandat = new Map<string, DbKontakt[]>();
    for (const k of kontakte) jeMandat.set(k.mandat, [...(jeMandat.get(k.mandat) ?? []), k]);
    for (const [mandat, liste] of jeMandat) {
      const r = await kontakteSchreiben(
        mandat,
        liste.map((k) => ({
          investorId: k.investor_id,
          antwort: art,
          betreff: `${b?.betreff ?? ""}${ueberListe ? " · Adresse über Liveliste zugeordnet" : ""}`.trim() || null,
          // Kam der Treffer über die Liveliste, bekommt der Eintrag seine Adresse – beim nächsten Mal geht es direkt.
          ...(k.email ? {} : { email }),
        })),
        durch,
      );
      aufgaben += r.aufgaben;
      for (const g of r.geschrieben) geaendert.push({ mandat, investor: g.investor_id, status: g.status });
    }
    return NextResponse.json({ ok: true, art, getroffen: kontakte.length, geaendert, aufgaben, ...(ueberListe ? { hinweis: "Adresse über Liveliste zugeordnet" } : {}) });
  } catch (e) {
    return NextResponse.json({ ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" }, { status: 502 });
  }
}
