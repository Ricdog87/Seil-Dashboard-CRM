// Anbindung Modul 01 (Datenraum-Agent auf n8n) – der Vertrag und die reine Logik.
// Keine Umgebungsvariablen, kein React: alles hier ist testbar und läuft auf Server und Client.
import type { Datenraum, DokumentStatus, KiFeld, Objekt } from "./types";

/** Antwort der Datenraum-Status-API (n8n WF 09) – Leseweg von Modul 01 ins Cockpit. */
export interface Modul01Dokument {
  name: string;
  status: string; // Vokabular von Modul 01, wird hier vereinheitlicht
}
export interface Modul01Kennwert {
  feld: string;
  wert: string;
  quelle?: string; // Dokument, aus dem die KI den Wert gelesen hat
  pruefstatus?: string; // "pruefen" | "uebernommen"
}
export interface Modul01Freigabe {
  investorEmail: string;
  freigegebenAm: string;
}
export interface Modul01Objekt {
  objektId: string | null;
  objektName?: string | null;
  stand?: string | null;
  dokumente?: Modul01Dokument[];
  kennwerte?: Modul01Kennwert[];
  freigaben?: Modul01Freigabe[];
}
export interface Modul01Antwort {
  stand?: string;
  objekte?: Modul01Objekt[];
}

/** Was das Cockpit von `/api/modul01/status` erhält – URL und Secret bleiben auf dem Server. */
export type Modul01Modus = "demo" | "live" | "fehler";
export interface Modul01Stand {
  modus: Modul01Modus;
  grund?: string;
  stand?: string; // Stand laut Modul 01
  abgerufen?: string; // Zeitpunkt des Abrufs
  objekte: Record<string, Modul01Objekt>; // Cockpit-Objekt-ID → Stand aus Modul 01
  /** Datenräume, zu denen es im Cockpit noch kein Mandat gibt – produktiv „Create deal“ (Nino, 28.08.). */
  unbekannt: Modul01Objekt[];
}
export const DEMO_STAND: Modul01Stand = { modus: "demo", objekte: {}, unbekannt: [] };

/** Status-Vokabular von Modul 01 tolerant auf das Cockpit-Vokabular abbilden. */
export function normalisiereStatus(roh: unknown): DokumentStatus {
  const s = String(roh ?? "")
    .trim()
    .toLowerCase();
  if (["vorhanden", "ok", "done", "available", "liegt vor"].includes(s)) return "vorhanden";
  if (["in_pruefung", "pruefung", "prüfung", "in prüfung", "review", "in review"].includes(s)) return "in_pruefung";
  return "ausstehend";
}

/** Mapping Cockpit-Objekt-ID → Kennung oder Name in Modul 01 (aus der Umgebung, nie im Repository). */
export function parseMapping(roh: string | undefined): Record<string, string> {
  if (!roh) return {};
  try {
    const obj: unknown = JSON.parse(roh);
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
    );
  } catch {
    return {};
  }
}

/**
 * Datenräume aus Modul 01 den Cockpit-Objekten zuordnen: über das Mapping (Kennung oder Name),
 * ersatzweise über eine direkt passende Cockpit-ID. Alles andere landet in „unbekannt“.
 */
export function ordneZu(
  antwort: Modul01Antwort,
  mapping: Record<string, string>,
  bekannteIds: string[],
): Pick<Modul01Stand, "objekte" | "unbekannt"> {
  const objekte: Record<string, Modul01Objekt> = {};
  const unbekannt: Modul01Objekt[] = [];
  for (const live of antwort.objekte ?? []) {
    const kennungen = [live.objektId, live.objektName].filter((x): x is string => !!x);
    const treffer =
      Object.entries(mapping).find(([, kennung]) => kennungen.includes(kennung))?.[0] ??
      bekannteIds.find((id) => kennungen.includes(id));
    if (treffer) objekte[treffer] = live;
    else unbekannt.push(live);
  }
  return { objekte, unbekannt };
}

/** Live-Stand aus Modul 01 über das Demo-Objekt legen – Datenraum und KI-Kennwerte, sonst bleibt alles. */
export function verbindeObjekt(objekt: Objekt, live?: Modul01Objekt): Objekt {
  if (!live) return objekt;
  const dokumente = (live.dokumente ?? [])
    .map((d) => ({ name: String(d.name ?? "").trim(), status: normalisiereStatus(d.status) }))
    .filter((d) => d.name);
  const datenraum: Datenraum = {
    angefordert: true,
    stand: live.stand ?? objekt.datenraum.stand,
    dokumente: dokumente.length ? dokumente : objekt.datenraum.dokumente,
  };
  const kiFelder: KiFeld[] | undefined = live.kennwerte?.length
    ? live.kennwerte.map((k) => ({
        feld: k.feld,
        wert: k.wert,
        quelleDokument: k.quelle ?? "Modul 01",
        status: k.pruefstatus === "uebernommen" ? "uebernommen" : "pruefen",
      }))
    : objekt.kiFelder;
  return { ...objekt, datenraum, kiFelder, datenquelle: "modul01" };
}

/** Kurzformat für den Stand-Zeitstempel (Frankfurter Zeit). */
export function fmtStand(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}
