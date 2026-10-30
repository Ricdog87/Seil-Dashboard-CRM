/**
 * Direkter Weg zur Datenbank – nur auf dem Server.
 *
 * Die Freigaben, der Verteiler und der Schrittstand sind Daten des Cockpits
 * selbst. Sie über die Automatik zu holen war eine Entscheidung, um Vercel
 * keinen Datenbankzugang zu geben; sie hat gekostet, dass nichts davon läuft,
 * solange ein n8n-Import aussteht. Für die eigenen Tabellen geht das Cockpit
 * deshalb direkt.
 *
 * Nicht betroffen: der Mailversand. Die Postfach-Zugangsdaten bleiben in n8n,
 * dort gehören sie hin.
 *
 * Der Schlüssel steht ausschließlich in der Serverumgebung. Keine dieser
 * Funktionen darf aus einer Client-Komponente aufgerufen werden.
 */

const BASIS = () => (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
const SCHLUESSEL = () => process.env.SUPABASE_SERVICE_KEY ?? "";

export function datenbankAktiv(): boolean {
  return BASIS() !== "" && SCHLUESSEL() !== "";
}

function kopf(extra: Record<string, string> = {}): Record<string, string> {
  const k = SCHLUESSEL();
  return {
    apikey: k,
    Authorization: `Bearer ${k}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function zeitgrenze(): AbortSignal {
  return AbortSignal.timeout(Number(process.env.DB_TIMEOUT_MS ?? 10000));
}

async function auswerten<T>(res: Response, was: string): Promise<T[]> {
  if (!res.ok) {
    // Die Meldung von PostgREST ist für die Fehlersuche Gold wert und darf
    // nicht hinter einem generischen "ging nicht" verschwinden.
    const text = await res.text().catch(() => "");
    throw new Error(`${was}: HTTP ${res.status}${text ? ` – ${text.slice(0, 200)}` : ""}`);
  }
  const d: unknown = await res.json().catch(() => []);
  return Array.isArray(d) ? (d as T[]) : [];
}

/** Zeilen lesen. `abfrage` ist der PostgREST-Teil hinter dem Fragezeichen. */
export async function dbLesen<T>(tabelle: string, abfrage: string): Promise<T[]> {
  const res = await fetch(`${BASIS()}/rest/v1/${tabelle}?${abfrage}`, {
    headers: kopf(),
    cache: "no-store",
    signal: zeitgrenze(),
  });
  return auswerten<T>(res, `${tabelle} lesen`);
}

/** Zeilen anlegen oder zusammenführen. Gibt die geschriebenen Zeilen zurück. */
export async function dbSchreiben<T>(
  tabelle: string,
  zeilen: unknown[],
  beiKonflikt: string,
): Promise<T[]> {
  const res = await fetch(`${BASIS()}/rest/v1/${tabelle}?on_conflict=${beiKonflikt}`, {
    method: "POST",
    headers: kopf({ Prefer: "resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify(zeilen),
    cache: "no-store",
    signal: zeitgrenze(),
  });
  return auswerten<T>(res, `${tabelle} schreiben`);
}

/**
 * Zeilen ändern. Gibt die wirklich geänderten Zeilen zurück – null Zeilen heißt
 * nicht „gut gegangen“, sondern „nichts getroffen“, und das muss der Aufrufer
 * unterscheiden können.
 */
export async function dbAendern<T>(
  tabelle: string,
  filter: string,
  aenderung: Record<string, unknown>,
): Promise<T[]> {
  const res = await fetch(`${BASIS()}/rest/v1/${tabelle}?${filter}`, {
    method: "PATCH",
    headers: kopf({ Prefer: "return=representation" }),
    body: JSON.stringify(aenderung),
    cache: "no-store",
    signal: zeitgrenze(),
  });
  return auswerten<T>(res, `${tabelle} ändern`);
}

/** PostgREST-Filter `in.("a","b")` – Anführungszeichen, damit Satzzeichen in einer Kennung nicht trennen. */
export function inListe(werte: string[]): string {
  return `in.(${werte.map((w) => `"${String(w).replace(/"/g, "")}"`).join(",")})`;
}
