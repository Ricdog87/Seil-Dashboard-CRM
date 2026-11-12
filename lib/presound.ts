import { ASSETKLASSEN } from "@/lib/abgleich";
import { zahlAusText } from "@/lib/kennwerte";
import type { Mandat, Produkttyp } from "@/lib/mandat";

/**
 * Die Pre-Sound-Mail (BCC-Erstansprache) als Vorlage aus den Key Facts.
 *
 * Aufbau, Reihenfolge und Formatregeln stammen aus Lucas Pre-Sound-Skill
 * (automation/vorlagen-seil/skills/pre-sound-mail.SKILL.md): Betreff
 * „SEIL • [Ort] | [Kernaussage] | „[Objektname]““, fester Einleitungssatz,
 * Bullets je Produkttyp, NDA-Satz, Mandatssatz, Schluss. Kennzahlen stehen mit
 * „ca.“, gerundet, im deutschen Zahlenformat.
 *
 * Was Luca in Word gelb markiert, steht hier in eckigen Klammern:
 * `[fehlt]` für einen Wert, den das Mandat nicht hat, `[prüfen: …]` für eine
 * Formulierung, die ein Mensch entscheidet, `[nur bei Vorgabe: …]` für
 * Kaufpreis und Abwicklungszeitraum. Solange eine solche Klammer im Betreff
 * oder Text steht, geht die Mail nicht raus.
 */
export interface PreSoundEntwurf {
  betreff: string;
  text: string;
}

/** Die Marken, die vor dem Versand aufgelöst sein müssen. */
const MARKE = /\[(?:fehlt|prüfen|nur bei Vorgabe)[^\]]*\]/g;
const FEHLT = "[fehlt]";

export function offeneMarken(...texte: string[]): string[] {
  return texte.flatMap((t) => t.match(MARKE) ?? []);
}

const runde = (zahl: number): string => Math.round(zahl).toLocaleString("de-DE");

/** „1.252 m²“ → „ca. 1.252 m²“ · „22,3 %“ → „ca. 22 %“; Text ohne Zahl bleibt, wie er ist. */
function ca(text: string | null | undefined, einheit: string): string | null {
  const roh = String(text ?? "").trim();
  if (!roh) return null;
  const zahl = zahlAusText(roh);
  if (zahl === null) return roh;
  return `ca. ${runde(zahl)} ${einheit}`;
}

function caZahl(zahl: number | null | undefined, einheit: string): string | null {
  return zahl == null ? null : `ca. ${runde(zahl)} ${einheit}`;
}

/** „18 WE | 1 GE“ → „ca. 18 WE | 1 GE“; sonst die Zahl der Einheiten. */
function einheiten(m: Mandat): string | null {
  const mix = (m.fakten?.einheitenMix ?? "").trim().replace(/;/g, ",");
  if (mix) return /^ca\./i.test(mix) ? mix : `ca. ${mix}`;
  return m.einheiten == null ? null : `ca. ${runde(m.einheiten)} Einheiten`;
}

/** Die Objektart für Betreff und Text – nur aus den fünf Klassen, sonst offen. */
function objektart(m: Mandat): { wort: string; mitArtikel: string } | null {
  const a = m.assetklasse ?? "";
  if (!(ASSETKLASSEN as readonly string[]).includes(a) || a === "Ausnahme") return null;
  return { wort: a, mitArtikel: a === "Wohnanlage" ? `eine ${a}` : `ein ${a}` };
}

const NAME = "[prüfen: Objektname]";

interface Bau {
  kern: string;
  beschreibung: string;
  bullets: string[];
  zielgruppe: string | null;
}

function bau(m: Mandat, typ: Produkttyp): Bau {
  const art = objektart(m);
  const artWort = art?.wort ?? "[prüfen: Objektart]";
  const artMit = art?.mitArtikel ?? "[prüfen: Objektart]";
  const ort = (m.stadt ?? "").trim() || FEHLT;
  const flaeche = caZahl(m.flaecheQm, "m²") ?? FEHLT;
  const we = einheiten(m) ?? FEHLT;
  const grundstueck = ca(m.fakten?.grundstueck, "m²") ?? FEHLT;
  const baujahr = (m.fakten?.baujahr ?? "").trim() || FEHLT;
  const leerstand = ca(m.fakten?.leerstand, "%") ?? FEHLT;
  const jnkm = caZahl(m.jahresnettokaltmiete, "EUR") ?? FEHLT;

  switch (typ) {
    case "A":
      return {
        kern: artWort,
        beschreibung: artMit,
        bullets: [
          `${artWort} „${NAME}“`,
          `Mietfläche: ${flaeche}`,
          `Einheiten: ${we}`,
          `Grundstücksfläche: ${grundstueck}`,
          `Baujahr: ${baujahr}`,
          `Leerstand: ${leerstand}`,
          `JNKM IST: ${jnkm}`,
        ],
        zielgruppe: null,
      };
    case "B":
    case "C":
      return {
        kern: typ === "B" ? `${artWort} mit Entwicklungspotenzial` : "Entwicklungsgrundstück",
        beschreibung:
          typ === "B"
            ? `${artMit} mit Entwicklungspotenzial [prüfen: Planung benennen]`
            : "ein Entwicklungsgrundstück [prüfen: Planung benennen]",
        bullets: [
          `Lage: ${ort}`,
          `Gegenstand: ${FEHLT}`,
          `Planung: ${FEHLT}`,
          `Planungsrecht: ${FEHLT}`,
          `Grundstücksfläche: ${grundstueck}`,
          `Geplante Wohnfläche: ${FEHLT}`,
          `Bestand: ${we} | ${flaeche}`,
          `Leerstand: ${leerstand}`,
          `JNKM IST: ${jnkm}`,
        ],
        zielgruppe:
          "[prüfen: Das Objekt eignet sich für Projektentwickler und Bauträger sowie für Investoren, die bis zur Umsetzung die laufenden Mieteinnahmen aus dem Bestand nutzen möchten.]",
      };
    case "D":
      return {
        kern: "Sanierungsobjekt",
        beschreibung: "ein Sanierungsobjekt",
        bullets: [
          `${artWort} „${NAME}“`,
          `Mietfläche SOLL: ${FEHLT}`,
          `Einheiten SOLL: ${FEHLT}`,
          `Vermietungsstand je Nutzung: ${FEHLT}`,
          `Genehmigungsstand: ${FEHLT}`,
        ],
        zielgruppe: "[prüfen: ein Satz zur Zielgruppe]",
      };
    case "E":
      return {
        kern: "Neubauprojekt",
        beschreibung: "ein Neubauprojekt",
        bullets: [
          `Lage: ${ort}`,
          `Nutzungsart: ${FEHLT}`,
          `Projektstatus: ${FEHLT}`,
          `Fertigstellung: ${FEHLT}`,
          `Einheiten/Kapazität: ${we}`,
          `Fläche: ${flaeche}`,
          `Mietvertrag/Laufzeit: ${FEHLT}`,
          `Mietertrag: ${jnkm}`,
        ],
        zielgruppe: "[prüfen: ein Satz zur Zielgruppe]",
      };
  }
}

/** Der Entwurf zu einem Mandat. Ohne Produkttyp gibt es keinen – der bestimmt den Aufbau. */
export function preSoundEntwurf(m: Mandat): PreSoundEntwurf | null {
  if (!m.produkttyp) return null;
  const b = bau(m, m.produkttyp);
  const ort = (m.stadt ?? "").trim() || FEHLT;

  const absaetze = [
    "Guten Tag,",
    `wir bieten Ihnen exklusiv ${b.beschreibung} in ${ort} zum Erwerb an. Nachstehend finden Sie zur ersten Orientierung die wesentlichen Eckdaten:`,
    [...b.bullets, "[nur bei Vorgabe: Kaufpreis]"].map((z) => `• ${z}`).join("\n"),
    b.zielgruppe,
    "Gerne stellen wir Ihnen nach Unterzeichnung einer Vertraulichkeitserklärung (NDA) weiterführende Informationen zur Verfügung und koordinieren bei Interesse auch Besichtigungen.",
    "[nur bei Vorgabe: Die Abwicklung ist für Q…/… eingeplant.]",
    "SEIL, als deutscher Vereinzelungsspezialist, ist vom Eigentümer exklusiv mit der Vermarktung beauftragt. Für den Käufer fällt ein provisionspflichtiges Honorar an.",
    "Wir freuen uns auf Ihre Rückmeldung.",
    "Mit freundlichen Grüßen",
  ].filter((a): a is string => !!a);

  return {
    betreff: `SEIL • ${ort} | ${b.kern} | „${NAME}“`,
    text: absaetze.join("\n\n"),
  };
}

const NUR_MIT_BELEG = ["baurecht", "genehmigt", "baureif", "schlüsselfertig"];

/**
 * Lucas Selbstprüfung, soweit sie sich am Text ablesen lässt. `sperrt` heißt:
 * So geht die Mail nicht raus. Der Rest sind Hinweise für den, der sie liest.
 */
export function preSoundPruefung(betreff: string, text: string): { sperrt: string[]; hinweise: string[] } {
  const sperrt: string[] = [];
  const hinweise: string[] = [];
  const marken = offeneMarken(betreff, text);
  if (marken.length > 0) {
    const fehlt = marken.filter((x) => x === FEHLT).length;
    const rest = marken.length - fehlt;
    sperrt.push(
      [
        fehlt > 0 ? `${fehlt} ${fehlt === 1 ? "Wert fehlt" : "Werte fehlen"} – eintragen oder die Zeile löschen` : null,
        rest > 0
          ? `${rest} ${rest === 1 ? "Stelle ist" : "Stellen sind"} zu entscheiden (Klammern mit „prüfen“ oder „nur bei Vorgabe“)`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
    );
  }
  if (!betreff.startsWith("SEIL • ")) hinweise.push("Der Betreff beginnt mit „SEIL •“.");
  if (betreff !== betreff.trimEnd()) hinweise.push("Am Ende des Betreffs steht ein Leerzeichen.");
  if (text.includes(";")) hinweise.push("Im Text steht ein Semikolon.");
  const klein = text.toLowerCase();
  const belegt = NUR_MIT_BELEG.filter((w) => klein.includes(w));
  if (belegt.length > 0) hinweise.push(`„${belegt.join("“, „")}“ nur mit Beleg der passenden Stufe des Planungsrechts.`);
  if (/paketverkauf|einzelverkauf/i.test(text)) hinweise.push("Paket- oder Einzelverkauf wird in der Pre-Sound-Mail nicht erwähnt.");
  return { sperrt, hinweise };
}
