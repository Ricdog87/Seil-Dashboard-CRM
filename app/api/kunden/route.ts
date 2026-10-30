import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen, dbSchreiben } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";
import { ARTEN, STUFEN, type Art, type Kunde, type KundeAnsicht, type Stufe } from "@/lib/kunde";
import type { LiveInvestor, LiveInvestoren } from "@/app/api/investoren/route";

/**
 * Die Kundenliste: Liveliste aus OneDrive, überlagert vom CRM-Stand.
 *
 * Zusammengeführt wird auf dem Server, damit der Browser nicht zweimal dasselbe
 * holt und beides selbst zusammensetzen muss. Die Liveliste bleibt dabei die
 * Quelle der Stammdaten – das Cockpit schreibt nicht in fremde Dateien.
 */
export const dynamic = "force-dynamic";

export interface Kundenliste {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  gesamt: number;
  kunden: KundeAnsicht[];
}

interface DbKunde {
  id: string;
  investor_id: string | null;
  firma: string;
  ansprechpartner: string | null;
  email: string | null;
  telefon: string | null;
  art: Art;
  stufe: Stufe;
  betreuer: string | null;
  regionen: string[] | null;
  assetklassen: string[] | null;
  notiz: string | null;
  quelle: "liveliste" | "cockpit";
  geaendert: string | null;
  geaendert_durch: string | null;
}

const aufKunde = (z: DbKunde): Kunde => ({
  id: z.id,
  investorId: z.investor_id,
  firma: z.firma,
  ansprechpartner: z.ansprechpartner,
  email: z.email,
  telefon: z.telefon,
  art: z.art,
  stufe: z.stufe,
  betreuer: z.betreuer,
  regionen: z.regionen ?? [],
  assetklassen: z.assetklassen ?? [],
  notiz: z.notiz,
  quelle: z.quelle,
  geaendert: z.geaendert,
  geaendertDurch: z.geaendert_durch,
});

/** Die Liveliste über den eigenen Server holen – Adresse und Geheimnis bleiben hier. */
async function liveliste(suche: string): Promise<LiveInvestor[]> {
  const url = process.env.INVESTOREN_URL;
  if (!url) return [];
  const ziel = new URL(url);
  if (suche) ziel.searchParams.set("suche", suche);
  ziel.searchParams.set("limit", "2000");
  const res = await fetch(ziel, {
    headers: process.env.MODUL01_SECRET ? { "X-Seil-Secret": process.env.MODUL01_SECRET } : {},
    cache: "no-store",
    signal: AbortSignal.timeout(Number(process.env.INVESTOREN_TIMEOUT_MS ?? 20000)),
  });
  if (!res.ok) throw new Error(`Liveliste antwortet mit HTTP ${res.status}`);
  const roh: unknown = await res.json();
  const d = (Array.isArray(roh) ? roh[0] : roh) as Partial<LiveInvestoren> | undefined;
  return Array.isArray(d?.investoren) ? d.investoren : [];
}

export async function GET(request: Request): Promise<NextResponse<Kundenliste>> {
  const q = new URL(request.url).searchParams;
  const suche = (q.get("suche") ?? "").trim();
  const nurEigene = q.get("quelle") === "cockpit";

  let crm: Kunde[] = [];
  if (datenbankAktiv()) {
    try {
      crm = (await dbLesen<DbKunde>("kunde", "order=geaendert.desc&limit=2000")).map(aufKunde);
    } catch (e) {
      return NextResponse.json({
        modus: "fehler",
        grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
        gesamt: 0,
        kunden: [],
      });
    }
  }

  let live: LiveInvestor[] = [];
  if (!nurEigene) {
    try {
      live = await liveliste(suche);
    } catch (e) {
      // Die Liveliste kann ausfallen, ohne dass das CRM unbrauchbar wird:
      // die eigenen Einträge stehen weiter da, mit Hinweis.
      const eigene = crm.filter((k) => k.quelle === "cockpit");
      return NextResponse.json({
        modus: "fehler",
        grund: e instanceof Error ? e.message : "Liveliste nicht erreichbar",
        gesamt: eigene.length,
        kunden: eigene.map(ausCrm),
      });
    }
  }

  const nachId = new Map(crm.filter((k) => k.investorId).map((k) => [k.investorId as string, k]));
  const verwendet = new Set<string>();

  const ausListe: KundeAnsicht[] = live.map((i) => {
    const k = nachId.get(i.id);
    if (k) verwendet.add(i.id);
    return {
      id: i.id,
      firma: k?.firma || i.firma,
      ansprechpartner: k?.ansprechpartner ?? i.ansprechpartner,
      email: k?.email ?? i.email,
      telefon: k?.telefon ?? null,
      regionen: i.regionen ?? [],
      assetklassen: i.assetklassen ?? [],
      ticketMinMio: i.ticketMinMio,
      ticketMaxMio: i.ticketMaxMio,
      letzteAnkaeufe: i.letzteAnkaeufe ?? [],
      art: k?.art ?? "investor",
      stufe: k?.stufe ?? "neu",
      betreuer: k?.betreuer ?? null,
      notiz: k?.notiz ?? null,
      herkunft: k ? "beides" : "liveliste",
    };
  });

  // Eigene Einträge, die nicht in der Liveliste stehen.
  const eigene = crm
    .filter((k) => k.quelle === "cockpit" || !k.investorId || !verwendet.has(k.investorId))
    .filter((k) => !nurEigene || k.quelle === "cockpit")
    .filter(
      (k) =>
        !suche ||
        [k.firma, k.ansprechpartner, k.email, ...(k.regionen ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(suche.toLowerCase()),
    )
    .map(ausCrm);

  const kunden = [...eigene, ...ausListe];
  return NextResponse.json({
    modus: datenbankAktiv() ? "live" : "aus",
    grund: datenbankAktiv() ? undefined : "Datenbank nicht eingerichtet",
    gesamt: kunden.length,
    kunden,
  });
}

function ausCrm(k: Kunde): KundeAnsicht {
  return {
    id: k.investorId ?? k.id,
    firma: k.firma,
    ansprechpartner: k.ansprechpartner,
    email: k.email,
    telefon: k.telefon,
    regionen: k.regionen,
    assetklassen: k.assetklassen,
    ticketMinMio: null,
    ticketMaxMio: null,
    letzteAnkaeufe: [],
    art: k.art,
    stufe: k.stufe,
    betreuer: k.betreuer,
    notiz: k.notiz,
    herkunft: "cockpit",
  };
}

/** Anlegen oder pflegen. Schlüssel ist die Kennung aus der Liveliste, sonst die Firma. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ ok: false, grund: "Datenbank nicht eingerichtet" }, { status: 503 });
  }
  const b = (await request.json().catch(() => null)) as Partial<KundeAnsicht> | null;
  const firma = b?.firma?.trim();
  const investorId = b?.id?.trim();
  if (!firma && !investorId) {
    return NextResponse.json({ ok: false, grund: "Ohne Firma geht es nicht" }, { status: 400 });
  }
  if (b?.art && !ARTEN.includes(b.art)) {
    return NextResponse.json({ ok: false, grund: "Unbekannte Art" }, { status: 400 });
  }
  if (b?.stufe && !STUFEN.includes(b.stufe)) {
    return NextResponse.json({ ok: false, grund: "Unbekannte Stufe" }, { status: 400 });
  }
  const durch = request.headers.get("x-seil-benutzer") ?? "";

  const zeile: Record<string, unknown> = {
    investor_id: investorId || firma,
    firma: firma || investorId,
    geaendert: new Date().toISOString(),
    geaendert_durch: durch,
  };
  for (const [feld, spalte] of [
    ["ansprechpartner", "ansprechpartner"],
    ["email", "email"],
    ["telefon", "telefon"],
    ["art", "art"],
    ["stufe", "stufe"],
    ["betreuer", "betreuer"],
    ["notiz", "notiz"],
    ["regionen", "regionen"],
    ["assetklassen", "assetklassen"],
  ] as const) {
    const w = (b as Record<string, unknown>)[feld];
    if (w !== undefined) zeile[spalte] = w === "" ? null : w;
  }
  if (b?.herkunft === "cockpit") zeile.quelle = "cockpit";

  try {
    const geschrieben = await dbSchreiben<DbKunde>("kunde", [zeile], "investor_id");
    if (geschrieben.length === 0) {
      return NextResponse.json({ ok: false, grund: "Nichts gespeichert" }, { status: 502 });
    }
    await protokoll({
      investorId: geschrieben[0].investor_id,
      art: "kontakt",
      durch,
      text: b?.stufe
        ? `${geschrieben[0].firma}: ${b.stufe}`
        : `${geschrieben[0].firma} gepflegt`,
    });
    return NextResponse.json({ ok: true, kunde: aufKunde(geschrieben[0]) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" },
      { status: 502 },
    );
  }
}
