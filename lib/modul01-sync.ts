import { abgleichen, ABGLEICH_MAX } from "@/lib/abgleich";
import { livelisteLaden } from "@/lib/liveliste";
import { laufPraefix } from "@/lib/mandat";
import type { Modul01Antwort, Modul01Objekt } from "@/lib/modul01";
import { protokoll } from "@/lib/protokoll";
import { datenbankAktiv, dbAendern, dbLesen, dbSchreiben } from "@/lib/supabase";

/**
 * Modul 01 → Modul 02: aus einem Datenraum wird ein Mandat, aus dem Mandat
 * ein Verteiler.
 *
 * Schritt 8 des Flowcharts (Create Data Room) läuft in Modul 01. Sobald dort
 * ein Lauf existiert, legt das Cockpit das Mandat an (Schritt 9, Create new
 * Deal) – automatisch, ohne dass jemand klickt. Hat das Mandat Region und
 * Assetklasse, läuft der Abgleich gegen die Liveliste (Schritt 13) und merkt
 * die passenden Investoren vor. Mehr nicht: angeschrieben wird erst nach
 * Freigabe (Schritt 14).
 *
 * Test- und Demoläufe (Name beginnt mit TEST- oder DEMO-) werden nicht
 * automatisch zu Mandaten – die lassen sich weiterhin von Hand anlegen.
 */
export function istTestlauf(name: string): boolean {
  return /^(test|demo)[-_ ]/i.test(name);
}

export async function modul01Objekte(): Promise<Modul01Objekt[]> {
  const url = process.env.MODUL01_STATUS_URL;
  if (!url) return [];
  try {
    const res = await fetch(url, {
      headers: process.env.MODUL01_SECRET ? { "X-Seil-Secret": process.env.MODUL01_SECRET } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.MODUL01_TIMEOUT_MS ?? 6000)),
    });
    if (!res.ok) return [];
    const roh = (await res.json()) as Modul01Antwort;
    return roh.objekte ?? [];
  } catch {
    return [];
  }
}

export interface SyncErgebnis {
  angelegt: string[];
  uebersprungen: string[];
  fehler?: string;
}

/** Datenräume ohne Mandat → Mandat anlegen. Idempotent: was es gibt, bleibt unberührt. */
export async function datenraeumeAbgleichen(objekte?: Modul01Objekt[], durch = "automatik"): Promise<SyncErgebnis> {
  if (!datenbankAktiv()) return { angelegt: [], uebersprungen: [], fehler: "Datenbank nicht eingerichtet" };
  const raeume = objekte ?? (await modul01Objekte());
  const namen = [...new Set(raeume.map((o) => laufPraefix(o.objektName ?? "")).filter(Boolean))];
  if (namen.length === 0) return { angelegt: [], uebersprungen: [] };

  try {
    const mandate = await dbLesen<{ name: string; lauf_praefix: string | null }>("mandat", "select=name,lauf_praefix&limit=1000");
    const bekannt = new Set<string>();
    for (const m of mandate) {
      bekannt.add(m.name);
      if (m.lauf_praefix) bekannt.add(m.lauf_praefix);
    }
    const uebersprungen = namen.filter((n) => !bekannt.has(n) && istTestlauf(n));
    const neu = namen.filter((n) => !bekannt.has(n) && !istTestlauf(n));
    if (neu.length === 0) return { angelegt: [], uebersprungen };

    const jetzt = new Date().toISOString();
    const zeilen = neu.map((n) => {
      const lauf = raeume.find((o) => laufPraefix(o.objektName ?? "") === n)?.objektName ?? n;
      return {
        name: n,
        lauf_praefix: n,
        phase: "vorbereitung",
        quelle: "modul01",
        notiz: `Automatisch aus Modul 01 angelegt (Datenraum ${lauf}). Region, Assetklasse und Kaufpreis eintragen – dann läuft der Abgleich.`,
        erstellt_durch: durch,
        geaendert_durch: durch,
        geaendert: jetzt,
      };
    });
    const geschrieben = await dbSchreiben<{ name: string }>("mandat", zeilen, "name");
    for (const m of geschrieben) {
      await protokoll({ mandat: m.name, art: "datenraum", durch: null, text: "Mandat aus dem Datenraum angelegt (Modul 01 → Cockpit, Flowchart 8 → 9)" });
    }
    return { angelegt: geschrieben.map((m) => m.name), uebersprungen };
  } catch (e) {
    return { angelegt: [], uebersprungen: [], fehler: e instanceof Error ? e.message : "Datenbank nicht erreichbar" };
  }
}

export interface AbgleichErgebnis {
  ok: boolean;
  treffer: number;
  erreichbar: number;
  neu: number;
  grund?: string;
}

interface DbMandatKurz {
  name: string;
  region: string | null;
  assetklasse: string | null;
  kaufpreis: number | null;
}

/**
 * Abgleich eines Mandats gegen die Liveliste (Flowchart 13). Vorgemerkt werden
 * nur Investoren mit E-Mail-Adresse („Investors List (E-Mail-Addresses)“),
 * höchstens ABGLEICH_MAX. Wer schon im Verteiler steht, behält seinen Stand.
 */
export async function mandatAbgleichen(name: string, durch = "automatik"): Promise<AbgleichErgebnis> {
  if (!datenbankAktiv()) return { ok: false, treffer: 0, erreichbar: 0, neu: 0, grund: "Datenbank nicht eingerichtet" };
  try {
    const [m] = await dbLesen<DbMandatKurz>("mandat", `name=eq.${encodeURIComponent(name)}&select=name,region,assetklasse,kaufpreis&limit=1`);
    if (!m) return { ok: false, treffer: 0, erreichbar: 0, neu: 0, grund: "Mandat nicht gefunden" };
    if (!m.region || !m.assetklasse) {
      return { ok: false, treffer: 0, erreichbar: 0, neu: 0, grund: "Region und Assetklasse am Mandat eintragen – dann läuft der Abgleich" };
    }
    const liste = await livelisteLaden(2000);
    if (!liste) return { ok: false, treffer: 0, erreichbar: 0, neu: 0, grund: "Liveliste nicht erreichbar" };

    const kaufpreis = m.kaufpreis === null ? null : Number(m.kaufpreis);
    const treffer = abgleichen(liste.investoren, { region: m.region, assetklasse: m.assetklasse, kaufpreis }) ?? [];
    const erreichbar = treffer.filter((i) => i.email).slice(0, ABGLEICH_MAX);

    const vorhanden = new Set(
      (await dbLesen<{ investor_id: string }>("kontakt", `mandat=eq.${encodeURIComponent(name)}&select=investor_id&limit=5000`)).map((k) => k.investor_id),
    );
    const neu = erreichbar.filter((i) => !vorhanden.has(i.id));
    const jetzt = new Date().toISOString();
    if (neu.length > 0) {
      await dbSchreiben(
        "kontakt",
        neu.map((i) => ({
          mandat: name,
          investor_id: i.id,
          firma: i.firma,
          ansprechpartner: i.ansprechpartner,
          email: i.email,
          status: "vorgemerkt",
          geaendert_durch: durch,
          geaendert: jetzt,
        })),
        "mandat,investor_id",
      );
    }
    await dbAendern("mandat", `name=eq.${encodeURIComponent(name)}`, { abgleich_am: jetzt });
    const ticket = kaufpreis ? `, ${Math.round(kaufpreis / 100_000) / 10} Mio.` : "";
    await protokoll({
      mandat: name,
      art: "kontakt",
      durch: durch === "automatik" ? null : durch,
      text: `Abgleich (Flowchart 13): ${treffer.length} passen zu ${m.region} · ${m.assetklasse}${ticket} – ${erreichbar.length} mit E-Mail, ${neu.length} neu vorgemerkt`,
    });
    return { ok: true, treffer: treffer.length, erreichbar: erreichbar.length, neu: neu.length };
  } catch (e) {
    return { ok: false, treffer: 0, erreichbar: 0, neu: 0, grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar" };
  }
}

/** Alle Mandate mit Kriterien, aber ohne Abgleich – für den Sync-Aufruf. */
export async function offeneAbgleiche(durch = "automatik"): Promise<Record<string, AbgleichErgebnis>> {
  const ergebnis: Record<string, AbgleichErgebnis> = {};
  if (!datenbankAktiv()) return ergebnis;
  try {
    const mandate = await dbLesen<{ name: string }>(
      "mandat",
      "select=name&region=not.is.null&assetklasse=not.is.null&abgleich_am=is.null&phase=not.in.(ruht,verloren,abschluss)&limit=50",
    );
    for (const m of mandate) ergebnis[m.name] = await mandatAbgleichen(m.name, durch);
  } catch {
    // ohne Spalten (Migration ausstehend) gibt es nichts abzugleichen
  }
  return ergebnis;
}
