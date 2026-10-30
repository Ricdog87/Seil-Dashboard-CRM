import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen } from "@/lib/supabase";
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

/**
 * Zweiter Weg zur Adresse: die Liveliste. Ein Verteiler-Eintrag, der von Hand
 * oder aus einem Abgleich ohne Adresse entstand, hat trotzdem einen Namen – und
 * der ist der Schlüssel der Liveliste. Liefert die Namen, deren Adresse passt.
 */
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

/** PostgREST-`in.(...)`: jeder Wert in Anführungszeichen, damit Kommas und Leerzeichen im Namen nichts zerreißen. */
function inListe(werte: string[]): string {
  return `in.(${werte.map((w) => `"${w.replace(/"/g, '\\"')}"`).join(",")})`;
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
    const grund = [
      b?.mandat ? `mandat=eq.${encodeURIComponent(b.mandat)}` : null,
      "status=neq.abgesagt",
      "order=geaendert.desc",
      "limit=20",
    ].filter(Boolean).join("&");
    let kontakte = await dbLesen<DbKontakt>("kontakt", `email=ilike.${encodeURIComponent(email)}&${grund}`);
    let ueberListe = false;
    if (kontakte.length === 0) {
      // Zweiter Versuch über die Liveliste: Adresse → Name → Verteiler.
      const namen = await namenAusLiveliste(email);
      if (namen.length > 0) {
        kontakte = await dbLesen<DbKontakt>("kontakt", `investor_id=${encodeURIComponent(inListe(namen))}&${grund}`);
        ueberListe = kontakte.length > 0;
      }
    }

    if (kontakte.length === 0) {
      // Unbekannte Adresse: nicht verlieren, nur protokollieren.
      await protokoll({ art: "kontakt", durch: null, text: `Antwort von ${email} (${art}) – kein offener Kontakt dazu` });
      return NextResponse.json({ ok: true, getroffen: 0, hinweis: "kein offener Kontakt zu dieser Adresse" });
    }

    const ziel = STUFE_JE_ART[art] ?? null;
    const jetzt = new Date().toISOString();
    const aenderungen = kontakte
      .filter((k) => ziel !== null && (ziel === "abgesagt" || RANG[ziel] > RANG[k.status]))
      .map((k) => ({ mandat: k.mandat, investorId: k.investor_id, firma: k.firma, ansprechpartner: k.ansprechpartner,
        // Kam der Treffer über die Liveliste, bekommt der Eintrag seine Adresse – beim nächsten Mal geht es direkt.
        email: k.email ?? email, status: ziel as Stufe, letzterKontakt: jetzt }));

    // Geschrieben wird NUR über die Kontakt-Route: sie kennt den vorherigen
    // Stand und legt beim Wechsel die Prozess-Aufgabe an. Ein direkter Schreibzugriff
    // vorher würde ihr den Wechsel verstecken – dann gäbe es keine Aufgabe.
    const basis = new URL(request.url).origin;
    const gespeichert = new Set<string>();
    for (const a of aenderungen) {
      const ok = await fetch(`${basis}/api/kontakte`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Seil-Secret": process.env.MODUL01_SECRET ?? "" },
        body: JSON.stringify({ mandat: a.mandat, kontakte: [{ investorId: a.investorId, firma: a.firma, ansprechpartner: a.ansprechpartner, email: a.email, status: a.status, letzterKontakt: a.letzterKontakt }] }),
        cache: "no-store",
      })
        .then(async (r) => r.ok && ((await r.json().catch(() => ({}))) as { ok?: boolean }).ok === true)
        .catch(() => false);
      if (ok) gespeichert.add(`${a.mandat}|${a.investorId}`);
    }

    // Immer eine Spur – auch wenn sich die Stufe nicht aendert, war da eine Antwort.
    for (const k of kontakte) {
      const bewegt = gespeichert.has(`${k.mandat}|${k.investor_id}`);
      await protokoll({
        mandat: k.mandat, investorId: k.investor_id, art: "kontakt", durch: null,
        text: `Antwort (${art})${b?.betreff ? `: „${b.betreff.slice(0, 80)}“` : ""}${bewegt ? ` → ${ziel}` : ""}${ueberListe ? " · Adresse über Liveliste zugeordnet" : ""}`,
      });
    }
    const fehlgeschlagen = aenderungen.filter((a) => !gespeichert.has(`${a.mandat}|${a.investorId}`));
    return NextResponse.json({
      ok: fehlgeschlagen.length === 0,
      getroffen: kontakte.length,
      geaendert: aenderungen.filter((a) => gespeichert.has(`${a.mandat}|${a.investorId}`)).map((a) => ({ mandat: a.mandat, investor: a.investorId, status: a.status })),
      ...(fehlgeschlagen.length > 0 ? { nichtGespeichert: fehlgeschlagen.map((a) => ({ mandat: a.mandat, investor: a.investorId })) } : {}),
    }, { status: fehlgeschlagen.length === 0 ? 200 : 502 });
  } catch (e) {
    return NextResponse.json({ ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" }, { status: 502 });
  }
}
