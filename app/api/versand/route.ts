import { NextResponse } from "next/server";
import { datenbankAktiv, dbSchreiben } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";

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

/**
 * Den Verteiler nachtragen. Vor der Freigabe steht ein Investor auf
 * „vorgemerkt“ – angeschrieben ist er erst, wenn die Mail wirklich raus ist.
 * Diese Unterscheidung ist der Grund, warum hier nicht pauschal
 * „angeschrieben“ geschrieben wird.
 */
async function verteilerNachtragen(
  mandat: string,
  empfaenger: VersandEmpfaenger[],
  modus: string,
  durch: string,
): Promise<boolean> {
  if (!mandat) return false;
  if (datenbankAktiv()) {
    try {
      const jetzt = new Date().toISOString();
      const zeilen = empfaenger.map((e) => ({
        mandat,
        investor_id: e.id,
        firma: e.firma ?? null,
        ansprechpartner: e.ansprechpartner ?? null,
        email: e.email ?? null,
        status: modus === "sofort" ? "angeschrieben" : "vorgemerkt",
        ...(modus === "sofort" ? { letzter_kontakt: jetzt } : {}),
        geaendert_durch: durch,
        geaendert: jetzt,
      }));
      const geschrieben = await dbSchreiben("kontakt", zeilen, "mandat,investor_id");
      return geschrieben.length > 0;
    } catch {
      return false;
    }
  }

  const url = process.env.KONTAKT_SETZEN_URL;
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(process.env.MODUL01_SECRET ? { "X-Seil-Secret": process.env.MODUL01_SECRET } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mandat,
        durch,
        kontakte: empfaenger.map((e) => ({
          investorId: e.id,
          firma: e.firma,
          ansprechpartner: e.ansprechpartner ?? null,
          email: e.email ?? null,
          status: modus === "sofort" ? "angeschrieben" : "vorgemerkt",
          ...(modus === "sofort" ? { letzterKontakt: new Date().toISOString() } : {}),
        })),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.KONTAKTE_TIMEOUT_MS ?? 10000)),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const url = process.env.VERSAND_URL;

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

  // „Zur Freigabe geben" verschickt nichts – es legt Entwürfe an. Das kann das
  // Cockpit selbst, und es soll nicht daran scheitern, dass ein Ablauf auf dem
  // Server fehlt. „Sofort senden" bleibt bei der Automatik: dort liegt das
  // Postfach.
  if (modus === "freigabe" && datenbankAktiv()) {
    try {
      const sendung = `cockpit-${Date.now()}`;
      const zeilen = empfaenger.map((e, n) => ({
        entwurf_id: `${sendung}-${n}`,
        sendung,
        objekt: b.objekt ?? null,
        investor_firma: e.firma ?? null,
        investor_name: e.ansprechpartner ?? null,
        investor_email: e.email ?? null,
        betreff: b.betreff!.trim(),
        entwurf: b.text!.trim(),
        treffer: [`aus dem Cockpit, ausgewählt von ${durch || "unbekannt"}`],
        status: "offen",
      }));
      const geschrieben = await dbSchreiben<{ entwurf_id: string }>(
        "freigabe_eingang",
        zeilen,
        "entwurf_id",
      );
      if (geschrieben.length === 0) {
        return NextResponse.json({ ok: false, grund: "Nichts gespeichert" }, { status: 502 });
      }
      const imVerteiler = await verteilerNachtragen(b.objekt ?? "", empfaenger, modus, durch);
      await protokoll({
        mandat: b.objekt ?? null,
        art: "versand",
        durch,
        text: `${geschrieben.length} Anschreiben zur Freigabe gegeben: „${b.betreff!.trim()}“`,
      });
      // Und je Empfaenger eine Zeile mit Kennung - sonst findet die Kundenakte
      // das Anschreiben nur ueber den Firmennamen.
      for (const e of empfaenger) {
        await protokoll({
          mandat: b.objekt ?? null,
          investorId: e.id,
          art: "versand",
          durch,
          text: `Anschreiben zur Freigabe gegeben: „${b.betreff!.trim()}“`,
        });
      }
      return NextResponse.json({
        ok: true,
        anzahl: geschrieben.length,
        modus,
        imVerteiler,
      });
    } catch (e) {
      return NextResponse.json(
        { ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" },
        { status: 502 },
      );
    }
  }

  if (!url) {
    return NextResponse.json(
      { ok: false, grund: "Sofortversand ist nicht eingerichtet (VERSAND_URL fehlt)." },
      { status: 503 },
    );
  }

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
    // Wer in einen Versand geht, gehoert in den Verteiler - sonst weiss das
    // Cockpit morgen nicht mehr, wen es angeschrieben hat. Schlaegt das fehl,
    // ist der Versand trotzdem passiert: das darf die Antwort nicht verfaelschen.
    const imVerteiler = await verteilerNachtragen(b.objekt ?? "", empfaenger, modus, durch);
    return NextResponse.json({ ok: true, anzahl: empfaenger.length, modus, imVerteiler });
  } catch (e) {
    const grund =
      e instanceof Error ? (e.name === "TimeoutError" ? "Zeitüberschreitung" : e.message) : "unbekannt";
    return NextResponse.json({ ok: false, grund }, { status: 502 });
  }
}
