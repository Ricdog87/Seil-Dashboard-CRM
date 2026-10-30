import { NextResponse } from "next/server";
import { darfFreigeben } from "@/lib/freigabe";

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

export async function GET(): Promise<NextResponse<FreigabeEingang>> {
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
export async function POST(request: Request): Promise<NextResponse> {
  const url = process.env.FREIGABE_ENTSCHEIDUNG_URL;
  if (!url) {
    return NextResponse.json({ ok: false, grund: "FREIGABE_ENTSCHEIDUNG_URL nicht gesetzt" }, { status: 503 });
  }
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
