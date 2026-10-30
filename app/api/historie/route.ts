import { NextResponse } from "next/server";
import { datenbankAktiv, dbLesen } from "@/lib/supabase";
import { STUFEN_LABEL, type Stufe } from "@/lib/crm";

/**
 * Die Historie eines Kunden – alles, was mit ihm passiert ist, in einer Zeitleiste.
 *
 * Zusammengetragen aus vier Tabellen: der Spur (`aktivitaet`), den Anschreiben
 * (`freigabe_eingang`), den Aufgaben und den Notizen. Dazu der aktuelle Stand
 * je Mandat aus `kontakt`. Eine Kundenakte, in der man scrollen muss, um zu
 * wissen, was war, ist keine – deshalb kommt alles aus einer Antwort, sortiert.
 */
export const dynamic = "force-dynamic";

export type HistorieArt =
  | "stufe" | "mail" | "freigabe" | "aufgabe" | "notiz" | "kontakt" | "pflege";

export interface HistorieEintrag {
  id: string;
  zeit: string;
  art: HistorieArt;
  titel: string;
  detail?: string | null;
  mandat?: string | null;
  durch?: string | null;
}

export interface KundeImProzess {
  mandat: string;
  status: Stufe;
  statusLabel: string;
  letzterKontakt: string | null;
  followups: number;
}

export interface Historie {
  modus: "live" | "aus" | "fehler";
  grund?: string;
  eintraege: HistorieEintrag[];
  imProzess: KundeImProzess[];
  offeneAufgaben: number;
}

interface DbAkt { id: string; mandat: string | null; investor_id: string | null; art: string; text: string; durch: string | null; erstellt: string; }
interface DbFreigabe { entwurf_id: string; objekt: string | null; investor_firma: string | null; betreff: string | null; status: string; entschieden_durch: string | null; entschieden_am: string | null; erstellt: string; }
interface DbAufgabe { id: string; titel: string; objekt: string | null; zustaendig: string | null; faellig: string | null; erledigt: boolean; erstellt: string; geaendert: string; quelle: string; }
interface DbNotiz { id: string; objekt: string | null; text: string; autor: string | null; erstellt: string; }
interface DbKontakt { mandat: string; status: Stufe; letzter_kontakt: string | null; followups: number | null; firma: string | null; }

export async function GET(request: Request): Promise<NextResponse<Historie>> {
  const q = new URL(request.url).searchParams;
  const id = (q.get("investor") ?? "").trim();
  const firma = (q.get("firma") ?? "").trim();
  if (!id) {
    return NextResponse.json({ modus: "fehler", grund: "Kein Kunde angegeben", eintraege: [], imProzess: [], offeneAufgaben: 0 });
  }
  if (!datenbankAktiv()) {
    return NextResponse.json({ modus: "aus", grund: "Datenbank nicht eingerichtet", eintraege: [], imProzess: [], offeneAufgaben: 0 });
  }

  const enc = encodeURIComponent;
  try {
    // Anschreiben haengen an der Firma, nicht an der Kennung - die Zeile kennt
    // nur, was im Anschreiben stand.
    const firmaFilter = firma ? `investor_firma=eq.${enc(firma)}` : `investor_firma=eq.${enc(id)}`;
    const [akt, mails, aufgaben, notizen, kontakte] = await Promise.all([
      dbLesen<DbAkt>("aktivitaet", `investor_id=eq.${enc(id)}&order=erstellt.desc&limit=300`),
      dbLesen<DbFreigabe>("freigabe_eingang", `${firmaFilter}&order=erstellt.desc&limit=200`),
      dbLesen<DbAufgabe>("aufgaben", `investor_id=eq.${enc(id)}&order=erstellt.desc&limit=200`),
      dbLesen<DbNotiz>("notizen", `investor_id=eq.${enc(id)}&order=erstellt.desc&limit=200`),
      dbLesen<DbKontakt>("kontakt", `investor_id=eq.${enc(id)}&order=geaendert.desc&limit=100`),
    ]);

    const eintraege: HistorieEintrag[] = [];

    for (const a of akt) {
      // Aufgaben und Notizen stehen eigenstaendig unten; ihre Spur-Zeile waere doppelt.
      if (a.art === "aufgabe" || a.art === "notiz") continue;
      eintraege.push({
        id: `a-${a.id}`,
        zeit: a.erstellt,
        art: a.art === "kontakt" ? "stufe" : a.art === "freigabe" ? "freigabe" : a.art === "versand" ? "mail" : "pflege",
        titel: a.text,
        mandat: a.mandat,
        durch: a.durch,
      });
    }
    for (const m of mails) {
      eintraege.push({
        id: `m-${m.entwurf_id}`,
        zeit: m.erstellt,
        art: "mail",
        titel: `Anschreiben entworfen: „${m.betreff ?? "ohne Betreff"}“`,
        detail: m.status === "offen" ? "wartet auf Freigabe" : null,
        mandat: m.objekt,
      });
      if (m.status !== "offen" && m.entschieden_am) {
        eintraege.push({
          id: `f-${m.entwurf_id}`,
          zeit: m.entschieden_am,
          art: m.status === "freigegeben" ? "mail" : "freigabe",
          titel: m.status === "freigegeben" ? `Anschreiben versendet: „${m.betreff ?? ""}“` : `Anschreiben abgelehnt: „${m.betreff ?? ""}“`,
          mandat: m.objekt,
          durch: m.entschieden_durch,
        });
      }
    }
    for (const t of aufgaben) {
      eintraege.push({
        id: `t-${t.id}`,
        zeit: t.erstellt,
        art: "aufgabe",
        titel: `${t.erledigt ? "Erledigt" : "Aufgabe"}: ${t.titel}`,
        detail: t.faellig ? `fällig ${new Date(t.faellig).toLocaleDateString("de-DE")}` : null,
        mandat: t.objekt,
        durch: t.zustaendig,
      });
    }
    for (const n of notizen) {
      eintraege.push({ id: `n-${n.id}`, zeit: n.erstellt, art: "notiz", titel: n.text, mandat: n.objekt, durch: n.autor });
    }

    eintraege.sort((a, b) => b.zeit.localeCompare(a.zeit));

    return NextResponse.json({
      modus: "live",
      eintraege,
      imProzess: kontakte.map((k) => ({
        mandat: k.mandat,
        status: k.status,
        statusLabel: STUFEN_LABEL[k.status] ?? k.status,
        letzterKontakt: k.letzter_kontakt,
        followups: k.followups ?? 0,
      })),
      offeneAufgaben: aufgaben.filter((t) => !t.erledigt).length,
    });
  } catch (e) {
    return NextResponse.json({
      modus: "fehler",
      grund: e instanceof Error ? e.message : "Datenbank nicht erreichbar",
      eintraege: [], imProzess: [], offeneAufgaben: 0,
    });
  }
}
