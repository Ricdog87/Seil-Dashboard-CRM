import { NextResponse } from "next/server";
import { STUFEN, type Stufe } from "@/lib/crm";
import { datenbankAktiv, dbLesen, dbSchreiben } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";

/**
 * Kontaktstand je Mandat – das Gedächtnis des CRM.
 *
 * Bis hierher konnte das Cockpit zeigen, wer passt und wer angeschrieben
 * werden soll. Was danach passiert ist, wusste es nicht: wer geantwortet hat,
 * wer ein NDA unterschrieben hat, wer den Datenraum sehen darf. Das steht
 * jetzt in der Datenbank und übersteht ein Neuladen.
 *
 * Wie überall sonst: das Cockpit hält keinen Datenbankzugang, es geht über die
 * Automatik mit demselben Header-Geheimnis.
 */
export const dynamic = "force-dynamic";

export interface Kontakt {
  investorId: string;
  mandat: string;
  firma: string | null;
  ansprechpartner: string | null;
  email: string | null;
  status: Stufe;
  notiz: string | null;
  letzterKontakt: string | null;
  naechstesFollowUp: string | null;
  geaendertDurch: string | null;
  geaendert: string | null;
  /** Wie oft nachgefasst wurde (SOP 16: alle zwei Tage, höchstens drei Stufen). */
  followups: number;
}
export interface Kontaktstand {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  kontakte: Kontakt[];
}

function kopf(): Record<string, string> {
  return process.env.MODUL01_SECRET ? { "X-Seil-Secret": process.env.MODUL01_SECRET } : {};
}

interface DbKontakt {
  investor_id: string;
  mandat: string;
  firma: string | null;
  ansprechpartner: string | null;
  email: string | null;
  status: Stufe;
  notiz: string | null;
  letzter_kontakt: string | null;
  naechstes_followup: string | null;
  geaendert_durch: string | null;
  geaendert: string | null;
  followups: number | null;
}

export async function GET(request: Request): Promise<NextResponse<Kontaktstand>> {
  const mandat = new URL(request.url).searchParams.get("mandat") ?? "";
  if (!mandat) {
    return NextResponse.json({ modus: "fehler", grund: "Kein Mandat angegeben", kontakte: [] });
  }

  if (datenbankAktiv()) {
    try {
      const zeilen = await dbLesen<DbKontakt>(
        "kontakt",
        `mandat=eq.${encodeURIComponent(mandat)}&order=firma.asc&limit=500`,
      );
      return NextResponse.json({
        modus: "live",
        kontakte: zeilen.map((z) => ({
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
        })),
      });
    } catch (e) {
      return NextResponse.json({
        modus: "fehler",
        grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
        kontakte: [],
      });
    }
  }

  const url = process.env.KONTAKTE_URL;
  if (!url) {
    return NextResponse.json({ modus: "aus", grund: "KONTAKTE_URL nicht gesetzt", kontakte: [] });
  }
  const ziel = new URL(url);
  ziel.searchParams.set("mandat", mandat);

  try {
    const res = await fetch(ziel, {
      headers: kopf(),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.KONTAKTE_TIMEOUT_MS ?? 10000)),
    });
    if (!res.ok) {
      return NextResponse.json({
        modus: "fehler",
        grund: `Automatik antwortet mit HTTP ${res.status}`,
        kontakte: [],
      });
    }
    const roh: unknown = await res.json();
    const d = (Array.isArray(roh) ? roh[0] : roh) as { kontakte?: Kontakt[] } | undefined;
    return NextResponse.json({ modus: "live", kontakte: Array.isArray(d?.kontakte) ? d.kontakte : [] });
  } catch (e) {
    const grund =
      e instanceof Error ? (e.name === "TimeoutError" ? "Zeitüberschreitung" : e.message) : "unbekannt";
    return NextResponse.json({ modus: "fehler", grund, kontakte: [] });
  }
}

/**
 * Aufgaben aus dem Prozess – so, wie die SOP sie beschreibt.
 *
 * Interesse → Broker Call (Schritt 17). NDA unterzeichnet → Datenraum Light
 * freigeben (Schritt 18). Preisanfrage → Rückruf durch die Geschäftsführung,
 * nur telefonisch (Festlegung aus dem Kundentermin). Die Aufgabe geht an den
 * Zuständigen des Mandats und entsteht nur einmal: beim Wechsel, nicht beim
 * erneuten Speichern, und nicht, wenn sie offen schon da ist.
 */
async function prozessAufgaben(
  mandat: string,
  geschrieben: DbKontakt[],
  vorher: Map<string, { status: Stufe }>,
  durch: string,
): Promise<void> {
  const regeln: Partial<Record<Stufe, { titel: (f: string) => string; tage: number }>> = {
    interesse: { titel: (f) => `Broker Call: ${f}`, tage: 2 },
    nda_unterzeichnet: { titel: (f) => `Datenraum Light freigeben: ${f}`, tage: 1 },
    preisanfrage: { titel: (f) => `Rückruf GF (nur telefonisch): ${f}`, tage: 1 },
  };
  const neue = geschrieben.filter((k) => {
    const alt = vorher.get(k.investor_id)?.status;
    return alt !== k.status && regeln[k.status];
  });
  if (neue.length === 0) return;

  try {
    const [m, offen] = await Promise.all([
      dbLesen<{ zustaendig: string | null }>(
        "mandat",
        `name=eq.${encodeURIComponent(mandat)}&select=zustaendig&limit=1`,
      ),
      dbLesen<{ titel: string }>(
        "aufgaben",
        `objekt=eq.${encodeURIComponent(mandat)}&erledigt=is.false&select=titel&limit=500`,
      ),
    ]);
    const zustaendig = m[0]?.zustaendig ?? durch ?? null;
    const vorhanden = new Set(offen.map((a) => a.titel));
    const zeilen = neue
      .map((k) => {
        const r = regeln[k.status]!;
        const titel = r.titel(k.firma ?? k.investor_id);
        if (vorhanden.has(titel)) return null;
        const faellig = new Date();
        faellig.setDate(faellig.getDate() + r.tage);
        return {
          titel,
          objekt: mandat,
          investor_id: k.investor_id,
          zustaendig,
          faellig: faellig.toISOString().slice(0, 10),
          quelle: "prozess",
          erstellt_durch: durch,
          geaendert: new Date().toISOString(),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    if (zeilen.length === 0) return;
    await dbSchreiben("aufgaben", zeilen, "id");
    for (const z of zeilen) {
      await protokoll({ mandat, investorId: z.investor_id, art: "aufgabe", durch: null, text: `Aus dem Prozess: ${z.titel}` });
    }
  } catch {
    // Eine nicht angelegte Aufgabe darf den Stufenwechsel nicht zurueckrollen.
  }
}

/** Einen oder viele Stände setzen. Wer es war, kommt aus der Sitzung. */
export async function POST(request: Request): Promise<NextResponse> {
  const url = process.env.KONTAKT_SETZEN_URL;
  const b = (await request.json().catch(() => null)) as
    | { mandat?: string; kontakte?: Partial<Kontakt>[] }
    | null;
  const mandat = b?.mandat?.trim();
  const kontakte = (b?.kontakte ?? []).filter((k) => k && k.investorId);
  if (!mandat || kontakte.length === 0) {
    return NextResponse.json({ ok: false, grund: "Mandat oder Investor fehlt" }, { status: 400 });
  }
  if (kontakte.some((k) => k.status && !STUFEN.includes(k.status as Stufe))) {
    return NextResponse.json({ ok: false, grund: "Unbekannte Stufe" }, { status: 400 });
  }

  const durch = request.headers.get("x-seil-benutzer") ?? "";

  if (datenbankAktiv()) {
    try {
      const jetzt = new Date().toISOString();
      // Vorherigen Stand lesen: Aufgaben entstehen beim Wechsel, nicht beim
      // erneuten Speichern desselben Stands.
      const vorher = new Map(
        (
          await dbLesen<{
            investor_id: string; status: Stufe; followups: number | null;
            firma: string | null; ansprechpartner: string | null; email: string | null;
          }>(
            "kontakt",
            `mandat=eq.${encodeURIComponent(mandat)}&select=investor_id,status,followups,firma,ansprechpartner,email&limit=2000`,
          )
        ).map((z) => [z.investor_id, z]),
      );
      // Was nicht mitgeschickt wird, bleibt stehen: ein Stufenwechsel darf
      // Firma, Ansprechpartner oder Adresse nicht löschen. Wer ein Feld leeren
      // will, schickt ausdrücklich null.
      const bleibt = <F extends "firma" | "ansprechpartner" | "email">(k: Partial<Kontakt>, feld: F): string | null =>
        k[feld] !== undefined ? (k[feld] as string | null) : (vorher.get(String(k.investorId))?.[feld] ?? null);
      const zeilen = kontakte.map((k) => ({
        mandat,
        investor_id: String(k.investorId),
        firma: bleibt(k, "firma"),
        ansprechpartner: bleibt(k, "ansprechpartner"),
        email: bleibt(k, "email"),
        status: k.status ?? vorher.get(String(k.investorId))?.status ?? "vorgemerkt",
        ...(k.notiz !== undefined ? { notiz: k.notiz } : {}),
        ...(k.letzterKontakt !== undefined ? { letzter_kontakt: k.letzterKontakt } : {}),
        ...(k.naechstesFollowUp !== undefined ? { naechstes_followup: k.naechstesFollowUp } : {}),
        ...((k as { nachgefasst?: boolean }).nachgefasst
          ? { followups: (vorher.get(String(k.investorId))?.followups ?? 0) + 1, letzter_kontakt: jetzt }
          : {}),
        geaendert_durch: durch,
        geaendert: jetzt,
      }));
      const geschrieben = await dbSchreiben<DbKontakt>("kontakt", zeilen, "mandat,investor_id");
      await prozessAufgaben(mandat, geschrieben, vorher, durch);
      if (geschrieben.length === 1) {
        const k = geschrieben[0];
        await protokoll({
          mandat,
          investorId: k.investor_id,
          art: "kontakt",
          durch,
          text: `${k.firma ?? k.investor_id}: ${k.status}`,
        });
      } else if (geschrieben.length > 1) {
        await protokoll({
          mandat,
          art: "kontakt",
          durch,
          text: `${geschrieben.length} Investoren in den Verteiler übernommen`,
        });
      }
      return NextResponse.json({ ok: geschrieben.length > 0, gespeichert: geschrieben.length });
    } catch (e) {
      return NextResponse.json(
        { ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" },
        { status: 502 },
      );
    }
  }

  if (!url) {
    return NextResponse.json({ ok: false, grund: "KONTAKT_SETZEN_URL nicht gesetzt" }, { status: 503 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...kopf(), "Content-Type": "application/json" },
      body: JSON.stringify({ mandat, durch, kontakte }),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.KONTAKTE_TIMEOUT_MS ?? 15000)),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, grund: `Automatik antwortet mit HTTP ${res.status}` },
        { status: 502 },
      );
    }
    const a = (await res.json().catch(() => ({}))) as { ok?: boolean; gespeichert?: number };
    // Die Automatik sagt, ob wirklich etwas gespeichert wurde. "Angekommen"
    // ist nicht dasselbe wie "gespeichert".
    if (a.ok === false) {
      return NextResponse.json({ ok: false, grund: "Nichts gespeichert" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, gespeichert: a.gespeichert ?? kontakte.length });
  } catch (e) {
    const grund = e instanceof Error ? e.message : "unbekannt";
    return NextResponse.json({ ok: false, grund }, { status: 502 });
  }
}
