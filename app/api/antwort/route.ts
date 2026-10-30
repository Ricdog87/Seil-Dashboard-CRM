import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen, dbSchreiben } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";
import { istSystem } from "@/lib/rollen";
import type { Stufe } from "@/lib/crm";

/**
 * Eine Antwort eines Investors kommt an – aus der Antworterkennung (WF 06).
 *
 * Die Automatik kennt die Mailadresse und die Einordnung, aber nicht das
 * Mandat. Das Cockpit kennt beides: es sucht die offenen Kontakte zu dieser
 * Adresse und setzt sie weiter. So muss n8n nichts über Mandate wissen, und
 * der Trichter bewegt sich von selbst, wenn jemand antwortet.
 *
 * Einordnung → Stufe (Entscheidungsbaum aus dem Standardprozess):
 *   absage → abgesagt · preisanfrage → preisanfrage ·
 *   interesse, unterlagen, telefonat, besichtigung → interesse ·
 *   kriterien, sonstiges → keine Stufenänderung, nur Spur.
 */
export const dynamic = "force-dynamic";

const STUFE_JE_ART: Record<string, Stufe | null> = {
  absage: "abgesagt",
  preisanfrage: "preisanfrage",
  interesse: "interesse",
  unterlagen: "interesse",
  telefonat: "interesse",
  besichtigung: "interesse",
  kriterien: null,
  sonstiges: null,
};

/** Rückwärts darf der Trichter nur bei Absage – eine zweite Mail nach einer Preisanfrage setzt niemanden auf „Interesse“ zurück. */
const RANG: Record<Stufe, number> = {
  vorgemerkt: 0, angeschrieben: 1, nda_angefragt: 2, nda_unterzeichnet: 3,
  datenraum_freigegeben: 4, interesse: 5, preisanfrage: 6, abgesagt: 99,
};

interface DbKontakt {
  mandat: string; investor_id: string; firma: string | null; ansprechpartner: string | null;
  email: string | null; status: Stufe; followups: number | null;
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
  const art = (b?.art ?? "sonstiges").toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, grund: "Ohne Absenderadresse geht es nicht" }, { status: 400 });
  }

  try {
    const filter = [
      `email=ilike.${encodeURIComponent(email)}`,
      b?.mandat ? `mandat=eq.${encodeURIComponent(b.mandat)}` : null,
      "status=neq.abgesagt",
      "order=geaendert.desc",
      "limit=20",
    ].filter(Boolean).join("&");
    const kontakte = await dbLesen<DbKontakt>("kontakt", filter);

    if (kontakte.length === 0) {
      // Unbekannte Adresse: nicht verlieren, nur protokollieren.
      await protokoll({ art: "kontakt", durch: null, text: `Antwort von ${email} (${art}) – kein offener Kontakt dazu` });
      return NextResponse.json({ ok: true, getroffen: 0, hinweis: "kein offener Kontakt zu dieser Adresse" });
    }

    const ziel = STUFE_JE_ART[art] ?? null;
    const jetzt = new Date().toISOString();
    const aenderungen = kontakte
      .filter((k) => ziel !== null && (ziel === "abgesagt" || RANG[ziel] > RANG[k.status]))
      .map((k) => ({
        mandat: k.mandat, investor_id: k.investor_id, firma: k.firma, ansprechpartner: k.ansprechpartner,
        email: k.email, status: ziel as Stufe, letzter_kontakt: jetzt, geaendert_durch: "automatik", geaendert: jetzt,
      }));
    if (aenderungen.length > 0) {
      await dbSchreiben("kontakt", aenderungen, "mandat,investor_id");
    }
    // Immer eine Spur – auch wenn sich die Stufe nicht aendert, war da eine Antwort.
    for (const k of kontakte) {
      await protokoll({
        mandat: k.mandat, investorId: k.investor_id, art: "kontakt", durch: null,
        text: `Antwort (${art})${b?.betreff ? `: „${b.betreff.slice(0, 80)}“` : ""}${ziel && aenderungen.some((a) => a.investor_id === k.investor_id) ? ` → ${ziel}` : ""}`,
      });
    }
    // Aufgaben aus dem Prozess entstehen ueber die Kontakt-Route; hier den
    // gleichen Weg nehmen, damit es eine Regel gibt und nicht zwei.
    if (aenderungen.length > 0) {
      const basis = new URL(request.url).origin;
      for (const a of aenderungen) {
        await fetch(`${basis}/api/kontakte`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Seil-Secret": process.env.MODUL01_SECRET ?? "" },
          body: JSON.stringify({ mandat: a.mandat, kontakte: [{ investorId: a.investor_id, firma: a.firma, email: a.email, status: a.status }] }),
          cache: "no-store",
        }).catch(() => undefined);
      }
    }
    return NextResponse.json({
      ok: true,
      getroffen: kontakte.length,
      geaendert: aenderungen.map((a) => ({ mandat: a.mandat, investor: a.investor_id, status: a.status })),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" }, { status: 502 });
  }
}
