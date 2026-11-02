/**
 * Merkmale einer Datei – das, worüber das Gedächtnis Ähnlichkeit misst.
 *
 * Bewusst ohne Modell und ohne Embeddings: Dateinamen und Pfade sind kurz,
 * und die Frage „habe ich so etwas schon einmal eingeordnet?“ beantwortet eine
 * lexikalische Ähnlichkeit zuverlässig und in Millisekunden. Das hält den
 * Dienst klein genug für den SEIL-Server und frei von weiteren Abhängigkeiten.
 */

const UMLAUTE = { ä: "ae", ö: "oe", ü: "ue", ß: "ss", é: "e", è: "e", á: "a", à: "a" };

export function normalisieren(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[äöüßéèáà]/g, (z) => UMLAUTE[z] ?? z)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function endung(dateiname) {
  const m = /\.([a-z0-9]{1,6})$/i.exec(String(dateiname ?? ""));
  return m ? m[1].toLowerCase() : "";
}

/** Tokens aus Pfad und Dateiname – Zahlen länger als vier Zeichen (Seriennummern, Zeitstempel) fallen weg. */
export function tokens(pfad, dateiname) {
  const stamm = String(dateiname ?? "").replace(/\.[a-z0-9]{1,6}$/i, "");
  const roh = `${normalisieren(pfad)} ${normalisieren(stamm)} ${normalisieren(stamm)}`; // Dateiname zählt doppelt
  const menge = new Map();
  for (const t of roh.split(" ")) {
    if (t.length < 2) continue;
    if (/^\d{5,}$/.test(t)) continue;
    menge.set(t, (menge.get(t) ?? 0) + 1);
  }
  return menge;
}

export function trigramme(dateiname) {
  const s = ` ${normalisieren(String(dateiname ?? "").replace(/\.[a-z0-9]{1,6}$/i, ""))} `;
  const menge = new Set();
  for (let i = 0; i + 3 <= s.length; i++) menge.add(s.slice(i, i + 3));
  return menge;
}

function jaccardGewichtet(a, b) {
  let schnitt = 0;
  let vereinigung = 0;
  const alle = new Set([...a.keys(), ...b.keys()]);
  for (const k of alle) {
    const x = a.get(k) ?? 0;
    const y = b.get(k) ?? 0;
    schnitt += Math.min(x, y);
    vereinigung += Math.max(x, y);
  }
  return vereinigung === 0 ? 0 : schnitt / vereinigung;
}

function dice(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let schnitt = 0;
  for (const t of a) if (b.has(t)) schnitt++;
  return (2 * schnitt) / (a.size + b.size);
}

/** Merkmale einer Datei als serialisierbare Form für die Datenbank. */
export function merkmale(pfad, dateiname) {
  const t = tokens(pfad, dateiname);
  return {
    endung: endung(dateiname),
    tokens: [...t.entries()].map(([k, n]) => (n > 1 ? `${k}:${n}` : k)).join(" "),
    trigramme: [...trigramme(dateiname)].join("|"),
  };
}

export function merkmaleLesen(zeile) {
  const t = new Map();
  for (const teil of String(zeile.tokens ?? "").split(" ")) {
    if (!teil) continue;
    const [k, n] = teil.split(":");
    t.set(k, Number(n ?? 1));
  }
  return { endung: zeile.endung ?? "", tokens: t, trigramme: new Set(String(zeile.trigramme ?? "").split("|").filter(Boolean)) };
}

/**
 * Ähnlichkeit zweier Dateien, 0 bis 1. Tokens (Pfad + Name) wiegen etwas mehr
 * als Trigramme (Schreibvarianten); gleiche Endung gibt einen kleinen Bonus,
 * eine andere Endung einen Abzug – ein Grundriss-PDF und ein Grundriss-DWG
 * sind verwandt, aber nicht dasselbe.
 */
export function aehnlichkeit(a, b) {
  const at = a.tokens instanceof Map ? a.tokens : merkmaleLesen(a).tokens;
  const bt = b.tokens instanceof Map ? b.tokens : merkmaleLesen(b).tokens;
  const atr = a.trigramme instanceof Set ? a.trigramme : merkmaleLesen(a).trigramme;
  const btr = b.trigramme instanceof Set ? b.trigramme : merkmaleLesen(b).trigramme;
  let s = 0.55 * jaccardGewichtet(at, bt) + 0.45 * dice(atr, btr);
  if (a.endung && b.endung) s += a.endung === b.endung ? 0.03 : -0.08;
  return Math.max(0, Math.min(1, s));
}
