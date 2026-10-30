import { NextResponse } from "next/server";

/**
 * Anschreiben aus dem Cockpit heraus.
 *
 * Das Cockpit verschickt selbst nichts: es hält keine Postfach-Zugangsdaten und
 * soll auch keine halten. Es übergibt den Auftrag an die Automatik, die seit
 * jeher über das SEIL-Postfach versendet – und zwar entweder in den
 * Freigabe-Eingang („zur Freigabe“) oder, wenn die Geschäftsführung das will,
 * direkt in den Versand.
 */
export const dynamic = "force-dynamic";

export interface VersandEmpfaenger {
  id: string;
  firma: string;
  ansprechpartner?: string | null;
  email?: string | null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const url = process.env.VERSAND_URL;
  if (!url) {
    return NextResponse.json({ ok: false, grund: "VERSAND_URL nicht gesetzt" }, { status: 503 });
  }

  const b = (await request.json().catch(() => null)) as
    | { objekt?: string; betreff?: string; text?: string; modus?: string; empfaenger?: VersandEmpfaenger[] }
    | null;

  const empfaenger = (b?.empfaenger ?? []).filter((e) => e && e.email);
  const modus = b?.modus === "sofort" ? "sofort" : "freigabe";
  if (empfaenger.length === 0) {
    return NextResponse.json(
      { ok: false, grund: "Kein Empfänger mit E-Mail-Adresse ausgewählt" },
      { status: 400 },
    );
  }
  if (!b?.betreff?.trim() || !b?.text?.trim()) {
    return NextResponse.json({ ok: false, grund: "Betreff oder Text fehlt" }, { status: 400 });
  }
  // Eine Obergrenze, damit ein Fehlklick nicht tausend Mails auslöst.
  const grenze = Number(process.env.VERSAND_MAX ?? 50);
  if (empfaenger.length > grenze) {
    return NextResponse.json(
      { ok: false, grund: `Mehr als ${grenze} Empfänger auf einmal – bitte in Schritten arbeiten.` },
      { status: 400 },
    );
  }

  const durch = request.headers.get("x-seil-benutzer") ?? "";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(process.env.MODUL01_SECRET ? { "X-Seil-Secret": process.env.MODUL01_SECRET } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        objekt: b.objekt ?? null,
        betreff: b.betreff.trim(),
        text: b.text.trim(),
        modus,
        durch,
        empfaenger,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.VERSAND_TIMEOUT_MS ?? 20000)),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, grund: `Automatik antwortet mit HTTP ${res.status}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, anzahl: empfaenger.length, modus });
  } catch (e) {
    const grund =
      e instanceof Error ? (e.name === "TimeoutError" ? "Zeitüberschreitung" : e.message) : "unbekannt";
    return NextResponse.json({ ok: false, grund }, { status: 502 });
  }
}
