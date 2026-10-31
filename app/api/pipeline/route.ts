import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen } from "@/lib/supabase";
import { ableiten, eingetragen } from "@/lib/sop-ableitung";
import { PROZESS_PHASEN, PROZESS_SCHRITTE } from "@/lib/sop";
import { laufPraefix, type Mandat, type Phase } from "@/lib/mandat";
import type { Kontakt } from "@/app/api/kontakte/route";
import type { SchrittStand } from "@/app/api/schritte/route";
import type { Modul01Antwort, Modul01Objekt } from "@/lib/modul01";
import { followupLage } from "@/lib/followup";
import { ANGESCHRIEBEN, GEANTWORTET } from "@/lib/crm";

/**
 * Die Pipeline: jedes Mandat mit allem, was eine Karte auf der Tafel braucht.
 *
 * Ein Aufruf statt sieben. Die Tafel zeigt Dutzende Mandate nebeneinander,
 * und jedes braucht den SOP-Fortschritt, die Verteilerzahlen, die nächste
 * Aufgabe und den Datenraum – das wird hier einmal zusammengerechnet, nicht
 * in jeder Karte einzeln.
 */
export const dynamic = "force-dynamic";

export interface PipelineKarte extends Mandat {
  /** SOP-Fortschritt: wie viele der 17 Schritte des Flowcharts stehen auf erledigt oder entfällt. */
  schritteFertig: number;
  schritteLaufen: number;
  /** Je SOP-Phase: fertig / gesamt. */
  phasen: { titel: string; fertig: number; gesamt: number }[];
  /** Welche Phase die Schritte nahelegen – zum Abgleich mit der gesetzten. */
  phaseLautSchritten: Phase;
  verteiler: {
    gesamt: number;
    angeschrieben: number;
    /** geantwortet: ab Anfrage/Exposé */
    interesse: number;
    nda: number;
    datenraum: number;
    preisanfrage: number;
    besichtigung: number;
    abgesagt: number;
  };
  aufgabenOffen: number;
  aufgabenUeberfaellig: number;
  /** Investoren, bei denen laut SOP 16 ein Follow-up faellig ist. */
  followupsFaellig: number;
  naechsteAufgabe: { titel: string; faellig: string | null; zustaendig: string | null } | null;
  datenraum: { eingelesen: number; abgelegt: number; offen: number } | null;
  freigabenOffen: number;
}

export interface Pipeline {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  karten: PipelineKarte[];
  stand: string;
}

interface DbMandat {
  id: string; name: string; stadt: string | null; assetklasse: string | null;
  auftraggeber: string | null; auftraggeber_id: string | null; phase: Phase; zustaendig: string | null;
  lauf_praefix: string | null; notiz: string | null; kaufpreis: number | null; provision_prozent: number | null;
  honorar_erwartet: number | null; honorar_ist: number | null; abschluss_am: string | null; erstellt: string | null;
  geaendert: string | null; geaendert_durch: string | null;
}
interface DbKontakt { mandat: string; investor_id: string; firma: string | null; status: Kontakt["status"]; letzter_kontakt: string | null; followups: number | null; letzte_antwort: string | null; }
interface DbSchritt { mandat: string; schritt: number; status: SchrittStand["status"]; }
interface DbAufgabe { objekt: string | null; titel: string; faellig: string | null; zustaendig: string | null; }
interface DbFreigabe { objekt: string | null; }

/**
 * Aus den Abschnitten des Flowcharts die Pipeline-Phase ableiten: der erste
 * Abschnitt, der nicht fertig ist. Sind alle 17 Schritte durch, ist das Mandat
 * in Angeboten – Verhandlung und Abschluss liegen hinter dem Flowchart.
 */
function phaseAusSchritten(fertigJeNr: Set<number>): Phase {
  for (const ph of PROZESS_PHASEN) {
    const alleFertig = PROZESS_SCHRITTE.filter((s) => s.nr >= ph.vonNr && s.nr <= ph.bisNr).every((s) =>
      fertigJeNr.has(s.nr),
    );
    if (!alleFertig) return ph.mandatPhase;
  }
  return "angebote";
}

async function datenraeume(): Promise<Modul01Objekt[]> {
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

export async function GET(): Promise<NextResponse<Pipeline>> {
  const stand = new Date().toISOString();
  if (!datenbankAktiv()) {
    return NextResponse.json({ modus: "aus", grund: "Datenbank nicht eingerichtet", karten: [], stand });
  }
  try {
    const [mandate, kontakte, schritte, aufgaben, freigaben, raeume] = await Promise.all([
      dbLesen<DbMandat>("mandat", "order=geaendert.desc&limit=300"),
      dbLesen<DbKontakt>("kontakt", "limit=5000"),
      dbLesen<DbSchritt>("mandat_schritt", "select=mandat,schritt,status&limit=10000"),
      dbLesen<DbAufgabe>("aufgaben", "select=objekt,titel,faellig,zustaendig&erledigt=is.false&order=faellig.asc.nullslast&limit=2000"),
      dbLesen<DbFreigabe>("freigabe_eingang", "select=objekt&status=eq.offen&limit=2000"),
      datenraeume(),
    ]);

    const heute = new Date();
    heute.setHours(0, 0, 0, 0);

    const karten: PipelineKarte[] = mandate.map((m) => {
      const k = kontakte.filter((x) => x.mandat === m.name);
      const s = schritte.filter((x) => x.mandat === m.name);
      const a = aufgaben.filter((x) => x.objekt === m.name);
      const dr = raeume.find((o) => laufPraefix(o.objektName ?? "") === (m.lauf_praefix ?? m.name));
      const frei = freigaben.filter((f) => f.objekt === m.name).length;

      // Stand je Schritt: abgeleitet schlägt eingetragen – wie auf der Mandatsseite.
      const ab = ableiten(
        dr,
        k.map((x) => ({ investorId: x.investor_id, status: x.status, letzteAntwort: x.letzte_antwort ?? null }) as Kontakt),
        null,
        frei,
        true,
      );
      const eingetragene: SchrittStand[] = s.map((x) => ({
        schritt: x.schritt, status: x.status, notiz: null, geaendertDurch: null, geaendert: null,
      }));
      const standVon = (nr: number) => ab[nr]?.status ?? eingetragen(eingetragene, nr)?.status ?? "pending";
      const fertigJeNr = new Set(PROZESS_SCHRITTE.filter((x) => ["done", "na"].includes(standVon(x.nr))).map((x) => x.nr));
      const laufen = PROZESS_SCHRITTE.filter((x) => standVon(x.nr) === "in_progress").length;

      const zaehl = (...st: string[]) => k.filter((x) => st.includes(x.status)).length;
      const ueberfaellig = a.filter((x) => x.faellig && new Date(x.faellig) < heute).length;
      const wert = (feld: string) => Number(dr?.kennwerte?.find((x) => x.feld === feld)?.wert ?? NaN);

      return {
        id: m.id, name: m.name, stadt: m.stadt, assetklasse: m.assetklasse, auftraggeber: m.auftraggeber, auftraggeberId: m.auftraggeber_id,
        phase: m.phase, zustaendig: m.zustaendig, laufPraefix: m.lauf_praefix, notiz: m.notiz,
        kaufpreis: m.kaufpreis === null ? null : Number(m.kaufpreis), provisionProzent: m.provision_prozent === null ? null : Number(m.provision_prozent),
        honorarErwartet: m.honorar_erwartet === null ? null : Number(m.honorar_erwartet), honorarIst: m.honorar_ist === null ? null : Number(m.honorar_ist), abschlussAm: m.abschluss_am,
        erstellt: m.erstellt, geaendert: m.geaendert, geaendertDurch: m.geaendert_durch,
        schritteFertig: fertigJeNr.size,
        schritteLaufen: laufen,
        phasen: PROZESS_PHASEN.map((ph) => {
          const nrn = PROZESS_SCHRITTE.filter((x) => x.nr >= ph.vonNr && x.nr <= ph.bisNr).map((x) => x.nr);
          return { titel: ph.titel, fertig: nrn.filter((n) => fertigJeNr.has(n)).length, gesamt: nrn.length };
        }),
        phaseLautSchritten: phaseAusSchritten(fertigJeNr),
        verteiler: {
          gesamt: k.length,
          angeschrieben: zaehl(...ANGESCHRIEBEN),
          interesse: zaehl(...GEANTWORTET),
          nda: zaehl("nda_unterzeichnet", "datenraum_freigegeben", "preisanfrage", "besichtigung"),
          datenraum: zaehl("datenraum_freigegeben", "preisanfrage", "besichtigung"),
          preisanfrage: zaehl("preisanfrage", "besichtigung"),
          besichtigung: zaehl("besichtigung"),
          abgesagt: zaehl("abgesagt"),
        },
        aufgabenOffen: a.length,
        aufgabenUeberfaellig: ueberfaellig,
        followupsFaellig: k.filter((x) => followupLage({ status: x.status, letzterKontakt: x.letzter_kontakt, followups: x.followups ?? 0 }).lage === "faellig").length,
        naechsteAufgabe: a[0] ? { titel: a[0].titel, faellig: a[0].faellig, zustaendig: a[0].zustaendig } : null,
        datenraum: dr
          ? {
              eingelesen: Number.isNaN(wert("verarbeitet")) ? 0 : wert("verarbeitet"),
              abgelegt: Number.isNaN(wert("abgelegt")) ? 0 : wert("abgelegt"),
              offen: dr.dokumente?.length ?? 0,
            }
          : null,
        freigabenOffen: frei,
      };
    });

    return NextResponse.json({ modus: "live", karten, stand });
  } catch (e) {
    return NextResponse.json({
      modus: "fehler",
      grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
      karten: [],
      stand,
    });
  }
}
