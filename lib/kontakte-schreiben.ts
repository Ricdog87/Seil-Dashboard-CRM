import { RANG, STUFEN, type Stufe } from "@/lib/crm";
import { ANTWORT_LABEL, ANTWORT_REGELN, STUFEN_AUFGABEN, antwortArt, type AntwortArt, type ProzessAufgabe } from "@/lib/kommunikation";
import { dbLesen, dbSchreiben } from "@/lib/supabase";
import { protokoll } from "@/lib/protokoll";
import { preisauskunft } from "@/lib/rollen";

/**
 * Kontaktstand schreiben – die eine Stelle, an der sich der Trichter bewegt.
 *
 * Ob jemand eine Karte zieht, in der Liste eine Stufe wählt oder die
 * Antworterkennung eine Mail einordnet: alles landet hier. Eine erkannte
 * Antwort (`antwort`) wird nach dem Standardprozess angewendet – Stufe,
 * letzte Antwort, Follow-up-Kette neu, Todos. Es gibt eine Regel, nicht zwei.
 */
export interface KontaktEingabe {
  investorId: string;
  firma?: string | null;
  ansprechpartner?: string | null;
  email?: string | null;
  status?: Stufe;
  notiz?: string | null;
  letzterKontakt?: string | null;
  naechstesFollowUp?: string | null;
  /** „nachgefasst“: eine Follow-up-Stufe weiter, letzter Kontakt jetzt. */
  nachgefasst?: boolean;
  /** Eine Antwort des Investors, eingeordnet nach dem Standardprozess. */
  antwort?: string | null;
  /** Betreff der Antwort – nur für die Spur. */
  betreff?: string | null;
}

export interface DbKontakt {
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
  letzte_antwort: string | null;
  letzte_antwort_am: string | null;
}

interface Vorher {
  investor_id: string;
  status: Stufe;
  followups: number | null;
  firma: string | null;
  ansprechpartner: string | null;
  email: string | null;
}

export function stufeGueltig(s: unknown): s is Stufe {
  return typeof s === "string" && (STUFEN as readonly string[]).includes(s);
}

/**
 * Hat die Datenbank die Spalten des Standardprozesses schon? Bis die Migration
 * (supabase/migrationen/2026-10-31-…) gelaufen ist, schreiben wir ohne sie –
 * und sagen es in der Antwort, statt still zu scheitern.
 */
let spaltenStand: boolean | null = null;
export async function standardprozessSpalten(): Promise<boolean> {
  if (spaltenStand !== null) return spaltenStand;
  try {
    await dbLesen("kontakt", "select=letzte_antwort&limit=1");
    spaltenStand = true;
  } catch {
    spaltenStand = false;
  }
  return spaltenStand;
}

/** Vorwärts im Trichter – zurück nur bei Absage. */
function weiter(alt: Stufe | undefined, ziel: Stufe | null): Stufe | undefined {
  if (!ziel) return alt;
  if (!alt) return ziel;
  if (ziel === "abgesagt") return ziel;
  return RANG[ziel] > RANG[alt] ? ziel : alt;
}

export async function kontakteSchreiben(
  mandat: string,
  eingaben: KontaktEingabe[],
  durch: string,
): Promise<{ geschrieben: DbKontakt[]; aufgaben: number; hinweis?: string }> {
  const jetzt = new Date().toISOString();
  const mitSpalten = await standardprozessSpalten();
  const vorher = new Map(
    (
      await dbLesen<Vorher>(
        "kontakt",
        `mandat=eq.${encodeURIComponent(mandat)}&select=investor_id,status,followups,firma,ansprechpartner,email&limit=2000`,
      )
    ).map((z) => [z.investor_id, z]),
  );

  const antworten = new Map<string, AntwortArt>();
  const zeilen = eingaben.map((k) => {
    const id = String(k.investorId);
    const alt = vorher.get(id);
    const art = k.antwort ? antwortArt(k.antwort) : null;
    if (art) antworten.set(id, art);
    const regel = art ? ANTWORT_REGELN[art] : null;
    // Eine erkannte Antwort setzt die Stufe nach dem Standardprozess, eine
    // Handeingabe setzt sie so, wie sie kommt.
    const status: Stufe = regel ? (weiter(alt?.status, regel.stufe) ?? alt?.status ?? "vorgemerkt") : (k.status ?? alt?.status ?? "vorgemerkt");
    // Was nicht mitgeschickt wird, bleibt stehen: ein Stufenwechsel darf Firma,
    // Ansprechpartner oder Adresse nicht löschen. Wer leeren will, schickt null.
    const bleibt = (feld: "firma" | "ansprechpartner" | "email"): string | null =>
      k[feld] !== undefined ? (k[feld] as string | null) : (alt?.[feld] ?? null);
    return {
      mandat,
      investor_id: id,
      firma: bleibt("firma"),
      ansprechpartner: bleibt("ansprechpartner"),
      email: bleibt("email"),
      status,
      ...(k.notiz !== undefined ? { notiz: k.notiz } : {}),
      ...(k.letzterKontakt !== undefined ? { letzter_kontakt: k.letzterKontakt } : {}),
      ...(k.naechstesFollowUp !== undefined ? { naechstes_followup: k.naechstesFollowUp } : {}),
      ...(k.nachgefasst ? { followups: (alt?.followups ?? 0) + 1, letzter_kontakt: jetzt } : {}),
      // Eine Antwort beendet die laufende Follow-up-Kette: wir antworten, die
      // Uhr läuft neu (Standardprozess: „2 Tage später nachfassen“).
      ...(regel ? { letzter_kontakt: jetzt, followups: 0 } : {}),
      ...(regel && mitSpalten ? { letzte_antwort: regel.art, letzte_antwort_am: jetzt } : {}),
      geaendert_durch: durch,
      geaendert: jetzt,
    };
  });

  const geschrieben = await dbSchreiben<DbKontakt>("kontakt", zeilen, "mandat,investor_id");
  const aufgaben = await prozessAufgaben(mandat, geschrieben, vorher, antworten, durch);

  for (const k of geschrieben) {
    const art = antworten.get(k.investor_id);
    const alt = vorher.get(k.investor_id)?.status;
    const name = k.firma ?? k.investor_id;
    const betreff = eingaben.find((e) => String(e.investorId) === k.investor_id)?.betreff;
    if (art) {
      await protokoll({
        mandat, investorId: k.investor_id, art: "kontakt", durch: durch || null,
        text: `${name}: Antwort „${ANTWORT_LABEL[art]}“${betreff ? ` – „${betreff.slice(0, 80)}“` : ""}${alt !== k.status ? ` → ${k.status}` : ""}`,
      });
    } else if (geschrieben.length === 1) {
      await protokoll({ mandat, investorId: k.investor_id, art: "kontakt", durch, text: `${name}: ${k.status}` });
    }
  }
  if (geschrieben.length > 1 && antworten.size === 0) {
    await protokoll({ mandat, art: "kontakt", durch, text: `${geschrieben.length} Investoren in den Verteiler übernommen` });
  }
  return {
    geschrieben,
    aufgaben,
    ...(antworten.size > 0 && !mitSpalten
      ? { hinweis: "Datenbank noch ohne Standardprozess-Spalten – Migration 2026-10-31 ausstehend; Antwort nur als Stufe und Spur gespeichert." }
      : {}),
  };
}

/**
 * Todos aus dem Standardprozess – beim Stufenwechsel und bei jeder erkannten
 * Antwort. Zugewiesen an die zuständige Person des Mandats, Preisfragen an die
 * Geschäftsführung. Nur einmal: nicht, wenn dieselbe Aufgabe offen schon da ist.
 */
async function prozessAufgaben(
  mandat: string,
  geschrieben: DbKontakt[],
  vorher: Map<string, Vorher>,
  antworten: Map<string, AntwortArt>,
  durch: string,
): Promise<number> {
  const faellige: { k: DbKontakt; a: ProzessAufgabe }[] = [];
  for (const k of geschrieben) {
    const art = antworten.get(k.investor_id);
    const alt = vorher.get(k.investor_id)?.status;
    const regeln: ProzessAufgabe[] = [];
    if (art) regeln.push(...ANTWORT_REGELN[art].aufgaben);
    if (alt !== k.status) regeln.push(...(STUFEN_AUFGABEN[k.status] ?? []));
    for (const a of regeln) faellige.push({ k, a });
  }
  if (faellige.length === 0) return 0;

  try {
    const [m, offen] = await Promise.all([
      dbLesen<{ zustaendig: string | null }>("mandat", `name=eq.${encodeURIComponent(mandat)}&select=zustaendig&limit=1`),
      dbLesen<{ titel: string }>("aufgaben", `objekt=eq.${encodeURIComponent(mandat)}&erledigt=is.false&select=titel&limit=1000`),
    ]);
    const zustaendig = m[0]?.zustaendig ?? (durch && durch !== "automatik" ? durch : null);
    const vorhanden = new Set(offen.map((a) => a.titel));
    const zeilen: Record<string, unknown>[] = [];
    for (const { k, a } of faellige) {
      const titel = a.titel(k.firma ?? k.investor_id);
      if (vorhanden.has(titel)) continue;
      vorhanden.add(titel);
      const faellig = new Date();
      faellig.setDate(faellig.getDate() + a.tage);
      zeilen.push({
        titel,
        objekt: mandat,
        investor_id: k.investor_id,
        zustaendig: a.an === "preisauskunft" ? preisauskunft() : zustaendig,
        faellig: faellig.toISOString().slice(0, 10),
        quelle: "prozess",
        erstellt_durch: durch || null,
        geaendert: new Date().toISOString(),
      });
    }
    if (zeilen.length === 0) return 0;
    await dbSchreiben("aufgaben", zeilen, "id");
    for (const z of zeilen) {
      await protokoll({ mandat, investorId: z.investor_id as string, art: "aufgabe", durch: null, text: `Aus dem Standardprozess: ${z.titel as string}` });
    }
    return zeilen.length;
  } catch {
    // Eine nicht angelegte Aufgabe darf den Stufenwechsel nicht zurueckrollen.
    return 0;
  }
}
