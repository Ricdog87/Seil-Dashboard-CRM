/**
 * Sitzungsmerkmal für das Cockpit.
 *
 * Ein signiertes Stück Text im Cookie, kein Passwort darin: Kürzel, Ablauf und
 * eine Signatur mit dem Servergeheimnis. Läuft über die Web-Crypto-API, damit
 * dieselbe Funktion in der Middleware und auf dem Server arbeitet.
 */
const KODIERER = new TextEncoder();

function base64url(roh: ArrayBuffer | Uint8Array): string {
  const b = roh instanceof Uint8Array ? roh : new Uint8Array(roh);
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signieren(text: string, geheimnis: string): Promise<string> {
  const schluessel = await crypto.subtle.importKey(
    "raw",
    KODIERER.encode(geheimnis),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", schluessel, KODIERER.encode(text)));
}

/** Erzeugt den Cookie-Wert für eine Anmeldung, gültig für `stunden`. */
export async function sitzungErzeugen(kuerzel: string, geheimnis: string, stunden = 12): Promise<string> {
  const bis = Date.now() + stunden * 3600_000;
  const inhalt = `${kuerzel}.${bis}`;
  return `${inhalt}.${await signieren(inhalt, geheimnis)}`;
}

/** Gibt das Kürzel zurück, wenn die Signatur stimmt und die Zeit nicht abgelaufen ist. */
export async function sitzungPruefen(wert: string | undefined, geheimnis: string): Promise<string | null> {
  if (!wert || !geheimnis) return null;
  const teile = wert.split(".");
  if (teile.length !== 3) return null;
  const [kuerzel, bisText, signatur] = teile;
  const bis = Number(bisText);
  if (!Number.isFinite(bis) || bis < Date.now()) return null;
  const soll = await signieren(`${kuerzel}.${bisText}`, geheimnis);
  if (soll.length !== signatur.length) return null;
  let abweichung = 0;
  for (let i = 0; i < soll.length; i++) abweichung |= soll.charCodeAt(i) ^ signatur.charCodeAt(i);
  return abweichung === 0 ? kuerzel : null;
}

/** Die hinterlegten Zugänge, Form {"kuerzel":"passwort"}. */
export function zugaenge(): Record<string, string> {
  const liste: Record<string, string> = {};
  const roh = process.env.COCKPIT_LOGINS;
  if (roh) {
    try {
      const o: unknown = JSON.parse(roh);
      if (o && typeof o === "object" && !Array.isArray(o)) {
        for (const [k, v] of Object.entries(o as Record<string, unknown>)) liste[k.toLowerCase()] = String(v);
      }
    } catch {
      // Eine kaputte Variable darf die Anmeldung nicht unmöglich machen.
    }
  }
  const b = process.env.COCKPIT_USER;
  const p = process.env.COCKPIT_PASS;
  if (b && p) liste[b.toLowerCase()] = p;
  return liste;
}

export const SITZUNG_COOKIE = "seil_sitzung";

/** Kürzel → Name, damit die Kopfzeile den Menschen nennt und nicht das Kürzel. */
export const NAMEN: Record<string, string> = {
  ms: "Maximilian Seil",
  ng: "Nino Grubišić",
  tp: "Tobias Pföhler",
  ns: "Norman Schulz",
  ab: "Amrit Brar",
  ln: "Luca Niemann",
  lk: "Lütfihan Karakas",
  ml: "Max Lorenz",
  ag: "Aylin Güven",
  seil: "SEIL Team",
};

/** Nur echte Personen – das gemeinsame Teamkonto kann nichts zugeteilt bekommen. */
export const PERSONEN: Record<string, string> = Object.fromEntries(
  Object.entries(NAMEN).filter(([, name]) => !/\bteam\b/i.test(name)),
);
