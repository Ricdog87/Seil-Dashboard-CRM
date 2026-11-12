import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen, dbSchreiben } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";
import { FAKT_TEXTE, PHASEN, PRODUKTTYPEN, type FaktText, type Mandat, type Phase, type Produkttyp } from "@/lib/mandat";
import { mandatAbgleichen } from "@/lib/modul01-sync";
import { istSystem } from "@/lib/rollen";
import { BUNDESLAENDER } from "@/lib/abgleich";

/** Die Mandate – das Rückgrat des CRM. */
export const dynamic = "force-dynamic";

export interface Mandatsliste {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  mandate: Mandat[];
}

interface DbMandat {
  id: string;
  name: string;
  stadt: string | null;
  region: string | null;
  assetklasse: string | null;
  auftraggeber: string | null;
  auftraggeber_id: string | null;
  phase: Phase;
  zustaendig: string | null;
  lauf_praefix: string | null;
  notiz: string | null;
  kaufpreis: number | null;
  provision_prozent: number | null;
  honorar_erwartet: number | null;
  honorar_ist: number | null;
  abschluss_am: string | null;
  abgleich_am: string | null;
  quelle: string | null;
  einheiten?: number | null;
  flaeche_qm?: number | string | null;
  jahresnettokaltmiete?: number | string | null;
  produkttyp?: Produkttyp | null;
  fakten?: Partial<Record<FaktText, string>> | null;
  erstellt: string | null;
  geaendert: string | null;
  geaendert_durch: string | null;
}

const auf = (z: DbMandat): Mandat => ({
  id: z.id,
  name: z.name,
  stadt: z.stadt,
  region: z.region ?? null,
  assetklasse: z.assetklasse,
  auftraggeber: z.auftraggeber,
  auftraggeberId: z.auftraggeber_id,
  phase: z.phase,
  zustaendig: z.zustaendig,
  laufPraefix: z.lauf_praefix,
  notiz: z.notiz,
  kaufpreis: z.kaufpreis === null ? null : Number(z.kaufpreis),
  provisionProzent: z.provision_prozent === null ? null : Number(z.provision_prozent),
  honorarErwartet: z.honorar_erwartet === null ? null : Number(z.honorar_erwartet),
  honorarIst: z.honorar_ist === null ? null : Number(z.honorar_ist),
  abschlussAm: z.abschluss_am,
  abgleichAm: z.abgleich_am ?? null,
  quelle: z.quelle ?? null,
  einheiten: z.einheiten ?? null,
  flaecheQm: z.flaeche_qm == null ? null : Number(z.flaeche_qm),
  jahresnettokaltmiete: z.jahresnettokaltmiete == null ? null : Number(z.jahresnettokaltmiete),
  produkttyp: z.produkttyp ?? null,
  fakten: z.fakten ?? {},
  erstellt: z.erstellt,
  geaendert: z.geaendert,
  geaendertDurch: z.geaendert_durch,
});

export async function GET(): Promise<NextResponse<Mandatsliste>> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ modus: "aus", grund: "Datenbank nicht eingerichtet", mandate: [] });
  }
  try {
    const zeilen = await dbLesen<DbMandat>("mandat", "order=geaendert.desc&limit=200");
    return NextResponse.json({ modus: "live", mandate: zeilen.map(auf) });
  } catch (e) {
    return NextResponse.json({
      modus: "fehler",
      grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
      mandate: [],
    });
  }
}

/** Anlegen oder ändern – der Name ist der Schlüssel. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!datenbankAktiv()) {
    return NextResponse.json({ ok: false, grund: "Datenbank nicht eingerichtet" }, { status: 503 });
  }
  const b = (await request.json().catch(() => null)) as (Partial<Mandat> & { uebernommen?: unknown }) | null;
  const name = b?.name?.trim();
  // Nur fürs Protokoll: welche Vorschläge aus Modul 01 mit diesem Klick übernommen wurden.
  const uebernommen = Array.isArray(b?.uebernommen)
    ? b.uebernommen.filter((x): x is string => typeof x === "string").slice(0, 12).map((x) => x.slice(0, 60))
    : [];
  if (!name) {
    return NextResponse.json({ ok: false, grund: "Ohne Namen geht es nicht" }, { status: 400 });
  }
  if (b?.phase && !PHASEN.includes(b.phase)) {
    return NextResponse.json({ ok: false, grund: "Unbekannte Phase" }, { status: 400 });
  }
  if (b?.region && !(BUNDESLAENDER as readonly string[]).includes(b.region)) {
    return NextResponse.json({ ok: false, grund: "Unbekannte Region – bitte ein Bundesland" }, { status: 400 });
  }
  if (b?.produkttyp && !(PRODUKTTYPEN as readonly string[]).includes(b.produkttyp)) {
    return NextResponse.json({ ok: false, grund: "Unbekannter Produkttyp – A bis E" }, { status: 400 });
  }
  for (const feld of ["einheiten", "flaecheQm", "jahresnettokaltmiete"] as const) {
    const w = (b as Record<string, unknown>)[feld];
    if (w === undefined || w === null || w === "") continue;
    if (typeof w !== "number" || !Number.isFinite(w) || w < 0 || (feld === "einheiten" && !Number.isInteger(w))) {
      return NextResponse.json({ ok: false, grund: "Key Facts: bitte eine Zahl ab 0 eintragen" }, { status: 400 });
    }
  }
  const durch = request.headers.get("x-seil-benutzer") ?? "";

  try {
    const zeile: Record<string, unknown> = {
      name,
      geaendert: new Date().toISOString(),
      geaendert_durch: durch,
    };
    // Die Automatik (Modul 01) legt Mandate aus Datenräumen an – das steht dann dran.
    if (istSystem(durch) && b?.laufPraefix) zeile.quelle = "modul01";
    for (const [feld, spalte] of [
      ["stadt", "stadt"],
      ["region", "region"],
      ["assetklasse", "assetklasse"],
      ["auftraggeber", "auftraggeber"],
      ["auftraggeberId", "auftraggeber_id"],
      ["phase", "phase"],
      ["zustaendig", "zustaendig"],
      ["laufPraefix", "lauf_praefix"],
      ["notiz", "notiz"],
      ["kaufpreis", "kaufpreis"],
      ["provisionProzent", "provision_prozent"],
      ["honorarErwartet", "honorar_erwartet"],
      ["honorarIst", "honorar_ist"],
      ["abschlussAm", "abschluss_am"],
      ["einheiten", "einheiten"],
      ["flaecheQm", "flaeche_qm"],
      ["jahresnettokaltmiete", "jahresnettokaltmiete"],
      ["produkttyp", "produkttyp"],
    ] as const) {
      const w = (b as Record<string, unknown>)[feld];
      if (w !== undefined) zeile[spalte] = w === "" ? null : w;
    }
    // Objektfakten: nur die genannten Einträge ändern, der Rest bleibt stehen.
    // Ein leerer Wert nimmt den Eintrag heraus.
    const neueFakten = b?.fakten;
    if (neueFakten && typeof neueFakten === "object") {
      const vorher = await dbLesen<{ fakten: Partial<Record<FaktText, string>> | null }>(
        "mandat",
        `name=eq.${encodeURIComponent(name)}&select=fakten&limit=1`,
      );
      const fakten: Partial<Record<FaktText, string>> = { ...(vorher[0]?.fakten ?? {}) };
      for (const k of FAKT_TEXTE) {
        const w = (neueFakten as Record<string, unknown>)[k];
        if (w === undefined) continue;
        const text = String(w ?? "").trim().slice(0, 300);
        if (text) fakten[k] = text;
        else delete fakten[k];
      }
      zeile.fakten = fakten;
    }
    const geschrieben = await dbSchreiben<DbMandat>("mandat", [zeile], "name");
    if (geschrieben.length === 0) {
      return NextResponse.json({ ok: false, grund: "Nichts gespeichert" }, { status: 502 });
    }
    await protokoll({
      mandat: name,
      art: "mandat",
      durch,
      text: b?.phase
        ? `Mandat auf „${b.phase}“ gesetzt`
        : uebernommen.length > 0
          ? `Aus Modul 01 übernommen: ${uebernommen.join(", ")}`
          : "Mandat angelegt oder geändert",
    });
    // Flowchart 13: sobald Region und Assetklasse stehen (oder sich ändern),
    // läuft der Abgleich gegen die Liveliste von selbst.
    const kriterienBeruehrt = b?.region !== undefined || b?.assetklasse !== undefined || b?.kaufpreis !== undefined;
    const m = geschrieben[0];
    const abgleich =
      kriterienBeruehrt && m.region && m.assetklasse ? await mandatAbgleichen(name, durch || "automatik") : undefined;
    const aktuell = abgleich ? await dbLesen<DbMandat>("mandat", `name=eq.${encodeURIComponent(name)}&limit=1`) : geschrieben;
    return NextResponse.json({ ok: true, mandat: auf(aktuell[0] ?? m), ...(abgleich ? { abgleich } : {}) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" },
      { status: 502 },
    );
  }
}
