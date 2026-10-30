import { NextResponse } from "next/server";
import { darfFreigeben } from "@/lib/freigabe";
import { datenbankAktiv, dbAendern, dbLesen, inListe } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";

/**
 * Freigabe-Eingang: die Anschreiben, die auf eine Entscheidung warten.
 *
 * Eine Freigabe betrifft nicht einen einzelnen Entwurf, sondern einen Versand
 * an viele Investoren – links der Text, rechts die Empfängerliste zum Abhaken
 * (so hat es das Team im Workshop am 30.10. beschrieben). Die Zeilen einer
 * Sendung werden deshalb hier geklammert, nicht erst in der Oberfläche.
 *
 * Das Cockpit hält keine Datenbankzugänge. Gelesen und entschieden wird über
 * dieselbe Automatik, die die Entwürfe erzeugt.
 */
export const dynamic = "force-dynamic";

export interface FreigabeEmpfaenger {
  entwurfId: string;
  firma: string | null;
  name: string | null;
  email: string | null;
  betreff: string | null;
  entwurf: string | null;
  treffer: string[];
}
export interface Sendung {
  sendung: string;
  objekt: string | null;
  betreff: string | null;
  entwurf: string | null;
  erstellt: string | null;
  empfaenger: FreigabeEmpfaenger[];
}
export interface FreigabeEingang {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  sendungen: Sendung[];
}

/** Rohzeile, wie WF 11 sie liefert. */
interface RohFreigabe {
  entwurfId?: string;
  sendung?: string | null;
  objekt?: string | null;
  investorFirma?: string | null;
  investorName?: string | null;
  investorEmail?: string | null;
  betreff?: string | null;
  entwurf?: string | null;
  treffer?: string[];
  erstellt?: string | null;
}

function kopf(): Record<string, string> {
  return process.env.MODUL01_SECRET ? { "X-Seil-Secret": process.env.MODUL01_SECRET } : {};
}

/** Zeilen zu Sendungen bündeln – Reihenfolge bleibt, die neueste zuerst. */
function buendeln(zeilen: RohFreigabe[]): Sendung[] {
  const nach = new Map<string, Sendung>();
  for (const z of zeilen) {
    if (!z.entwurfId) continue;
    const schluessel = z.sendung || z.entwurfId;
    let s = nach.get(schluessel);
    if (!s) {
      s = {
        sendung: schluessel,
        objekt: z.objekt ?? null,
        betreff: z.betreff ?? null,
        entwurf: z.entwurf ?? null,
        erstellt: z.erstellt ?? null,
        empfaenger: [],
      };
      nach.set(schluessel, s);
    }
    s.empfaenger.push({
      entwurfId: z.entwurfId,
      firma: z.investorFirma ?? null,
      name: z.investorName ?? null,
      email: z.investorEmail ?? null,
      betreff: z.betreff ?? null,
      entwurf: z.entwurf ?? null,
      treffer: Array.isArray(z.treffer) ? z.treffer : [],
    });
  }
  return [...nach.values()];
}

/** Zeile der Tabelle, wie sie aus der Datenbank kommt. */
interface DbFreigabe {
  entwurf_id: string;
  sendung: string | null;
  objekt: string | null;
  investor_firma: string | null;
  investor_name: string | null;
  investor_email: string | null;
  betreff: string | null;
  entwurf: string | null;
  treffer: unknown;
  erstellt: string | null;
}

export async function GET(): Promise<NextResponse<FreigabeEingang>> {
  if (datenbankAktiv()) {
    try {
      const zeilen = await dbLesen<DbFreigabe>(
        "freigabe_eingang",
        "status=eq.offen&order=erstellt.desc&limit=300",
      );
      return NextResponse.json({
        modus: "live",
        sendungen: buendeln(
          zeilen.map((z) => ({
            entwurfId: z.entwurf_id,
            sendung: z.sendung,
            objekt: z.objekt,
            investorFirma: z.investor_firma,
            investorName: z.investor_name,
            investorEmail: z.investor_email,
            betreff: z.betreff,
            entwurf: z.entwurf,
            treffer: Array.isArray(z.treffer) ? (z.treffer as string[]) : [],
            erstellt: z.erstellt,
          })),
        ),
      });
    } catch (e) {
      return NextResponse.json({
        modus: "fehler",
        grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
        sendungen: [],
      });
    }
  }

  const url = process.env.FREIGABEN_URL;
  if (!url) {
    return NextResponse.json({ modus: "aus", grund: "FREIGABEN_URL nicht gesetzt", sendungen: [] });
  }
  try {
    const res = await fetch(url, {
      headers: kopf(),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.FREIGABEN_TIMEOUT_MS ?? 10000)),
    });
    if (!res.ok) {
      return NextResponse.json({
        modus: "fehler",
        grund: `Automatik antwortet mit HTTP ${res.status}`,
        sendungen: [],
      });
    }
    const roh: unknown = await res.json();
    const d = (Array.isArray(roh) ? roh[0] : roh) as { offen?: RohFreigabe[] } | undefined;
    return NextResponse.json({ modus: "live", sendungen: buendeln(d?.offen ?? []) });
  } catch (e) {
    const grund =
      e instanceof Error ? (e.name === "TimeoutError" ? "Zeitüberschreitung" : e.message) : "unbekannt";
    return NextResponse.json({ modus: "fehler", grund, sendungen: [] });
  }
}

/**
 * Die Entscheidung – für beliebig viele Empfänger einer Sendung auf einmal.
 *
 * Wer entschieden hat, bestimmt nicht der Browser, sondern das Sitzungs-Cookie:
 * die Middleware reicht das Kürzel als Kopfzeile weiter. Und freigeben darf
 * nur, wer dafür benannt ist.
 */
/**
 * Den Versand anstoßen. Das bleibt bei der Automatik – dort liegen die
 * Postfach-Zugangsdaten, und dort soll der Versand auch protokolliert werden.
 */
async function versandAnstossen(entwuerfe: string[], durch: string): Promise<boolean> {
  const url = process.env.FREIGABE_ANSTOSS_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...kopf(), "Content-Type": "application/json" },
      body: JSON.stringify({ entwuerfe, durchId: durch, am: new Date().toISOString() }),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.FREIGABEN_TIMEOUT_MS ?? 15000)),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const url = process.env.FREIGABE_ENTSCHEIDUNG_URL;
  const koerper = (await request.json().catch(() => null)) as
    | { entwurfIds?: string[]; entscheidung?: string }
    | null;
  const ids = (koerper?.entwurfIds ?? []).filter((x) => typeof x === "string" && x.trim());
  const entscheidung = koerper?.entscheidung;
  if (ids.length === 0 || (entscheidung !== "freigegeben" && entscheidung !== "abgelehnt")) {
    return NextResponse.json({ ok: false, grund: "Entwurf oder Entscheidung fehlt" }, { status: 400 });
  }

  const durch = (request.headers.get("x-seil-benutzer") ?? "").toLowerCase();
  if (!darfFreigeben(durch)) {
    return NextResponse.json(
      { ok: false, grund: "Freigeben darf nur, wer dafür benannt ist." },
      { status: 403 },
    );
  }

  if (datenbankAktiv()) {
    try {
      const geaendert = await dbAendern<{ entwurf_id: string; objekt: string | null }>(
        "freigabe_eingang",
        // Nur offene Zeilen: ein zweiter Klick darf nicht ein zweites Mal versenden.
        `entwurf_id=${encodeURIComponent(inListe(ids))}&status=eq.offen`,
        { status: entscheidung, entschieden_durch: durch, entschieden_am: new Date().toISOString() },
      );
      if (geaendert.length === 0) {
        return NextResponse.json(
          { ok: false, grund: "Nichts offen – schon entschieden oder unbekannt." },
          { status: 409 },
        );
      }
      if (entscheidung === "freigegeben") {
        const angestossen = await versandAnstossen(
          geaendert.map((z) => z.entwurf_id),
          durch,
        );
        if (!angestossen) {
          // Die Entscheidung steht, der Versand nicht. Das darf nicht als
          // Erfolg durchgehen – sonst wartet jemand auf Mails, die nie kommen.
          return NextResponse.json(
            {
              ok: false,
              grund:
                "Freigabe ist gespeichert, aber der Versand ließ sich nicht anstoßen. Bitte Ricardo Bescheid geben.",
            },
            { status: 502 },
          );
        }
      }
      await protokoll({
        mandat: geaendert[0]?.objekt ?? null,
        art: "freigabe",
        durch,
        text: `${geaendert.length} Anschreiben ${entscheidung === "freigegeben" ? "freigegeben und in den Versand gegeben" : "abgelehnt"}`,
      });
      return NextResponse.json({ ok: true, anzahl: geaendert.length });
    } catch (e) {
      return NextResponse.json(
        { ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" },
        { status: 502 },
      );
    }
  }

  if (!url) {
    return NextResponse.json({ ok: false, grund: "FREIGABE_ENTSCHEIDUNG_URL nicht gesetzt" }, { status: 503 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...kopf(), "Content-Type": "application/json" },
      body: JSON.stringify({ entwurfIds: ids, entscheidung, durch }),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.FREIGABEN_TIMEOUT_MS ?? 15000)),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, grund: `Automatik antwortet mit HTTP ${res.status}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, anzahl: ids.length });
  } catch (e) {
    const grund = e instanceof Error ? e.message : "unbekannt";
    return NextResponse.json({ ok: false, grund }, { status: 502 });
  }
}
