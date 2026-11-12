import type { LiveInvestor } from "@/app/api/investoren/route";

/**
 * Der Abgleich – Schritt 13 des Flowcharts („Matching / Investors List“).
 *
 * Die Regel aus dem Demo-Check vom 20.08.: Standort zuerst, dann Assetklasse
 * und Ticket. Der Standort ist das harte Kriterium – die Liveliste führt
 * Bundesländer, deshalb hat ein Mandat eine Region. Assetklasse und Ticket
 * verengen nur dort, wo die Liste gepflegt ist: wer kein Profil hinterlegt
 * hat, fliegt nicht raus, sondern bleibt Kandidat.
 */
export const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
] as const;

/**
 * Die fünf Assetklassen eines Mandats (Termin 02.11.2026): Modul 01 schlägt
 * vor, ein Mensch gibt frei. Ältere Mandate tragen noch Freitext („Wohnen“);
 * der bleibt gültig.
 */
export const ASSETKLASSEN = [
  "Mehrfamilienhaus",
  "Wohn- und Geschäftshaus",
  "Wohnanlage",
  "Grundstück",
  "Ausnahme",
] as const;
export type Assetklasse = (typeof ASSETKLASSEN)[number];

/**
 * Wie die fünf Klassen in der Liveliste heißen. Dort steht Freitext
 * („Wohnen — Berlin“) oder ein Kürzel aus Lucas Suchraster (MFH, WGH, WA …).
 * Wörter treffen als Wortteil, Kürzel nur als ganzes Wort. „Ausnahme“ verengt
 * nicht – die Auswahl trifft dann ein Mensch.
 */
const KLASSE_BEGRIFFE: Record<Assetklasse, { woerter: string[]; kuerzel: string[] } | null> = {
  Mehrfamilienhaus: { woerter: ["wohn", "mehrfamilien"], kuerzel: ["mfh", "wo", "wp"] },
  "Wohn- und Geschäftshaus": {
    woerter: ["wohn", "geschäftshaus", "geschaeftshaus", "gemischt", "einzelhandel"],
    kuerzel: ["wgh", "gh", "mix"],
  },
  Wohnanlage: { woerter: ["wohn"], kuerzel: ["wa", "wp"] },
  Grundstück: { woerter: ["grundstück", "grundstueck", "entwicklung", "projekt"], kuerzel: ["grd", "pe"] },
  Ausnahme: null,
};

/** Passt das Suchprofil eines Investors (Einträge der Liveliste) zur Assetklasse des Mandats? */
export function assetklassePasst(eintraege: string[], assetklasse: string): boolean {
  if (!(ASSETKLASSEN as readonly string[]).includes(assetklasse)) {
    // Freitext aus der Zeit vor den fünf Klassen: Wortteil genügt.
    return eintraege.some((a) => a.toLowerCase().includes(assetklasse.toLowerCase()));
  }
  const begriffe = KLASSE_BEGRIFFE[assetklasse as Assetklasse];
  if (begriffe === null) return true;
  return eintraege.some((a) => {
    const klein = a.toLowerCase();
    if (begriffe.woerter.some((w) => klein.includes(w))) return true;
    const teile = klein.split(/[^a-zäöüß]+/).filter(Boolean);
    return teile.some((t) => begriffe.kuerzel.includes(t));
  });
}

/** Höchstens so viele Investoren merkt der automatische Abgleich vor – der Rest bleibt über die Suche erreichbar. */
export const ABGLEICH_MAX = 400;

/** Regionen-Einträge, die überall passen („bundesweit“, „Deutschland (mehrere Standorte)“). */
const UEBERALL = /deutschland|bundesweit|mehrere|dach\b|europa/i;

export function passt(i: LiveInvestor, region: string, assetklasse: string, ticketMio: number | null): boolean {
  if (region !== "alle") {
    const regionen = i.regionen ?? [];
    const trifft = regionen.some((r) => r === region || UEBERALL.test(r));
    if (!trifft) return false;
  }
  if (assetklasse !== "alle") {
    const ak = i.assetklassen ?? [];
    if (ak.length > 0 && !assetklassePasst(ak, assetklasse)) return false;
  }
  if (ticketMio !== null && (i.ticketMinMio !== null || i.ticketMaxMio !== null)) {
    if (i.ticketMinMio !== null && ticketMio < i.ticketMinMio) return false;
    if (i.ticketMaxMio !== null && ticketMio > i.ticketMaxMio) return false;
  }
  return true;
}

export interface AbgleichKriterien {
  region: string | null;
  assetklasse: string | null;
  /** Kaufpreis in Euro – wird in Mio. umgerechnet. */
  kaufpreis: number | null;
}

/**
 * Kandidaten für den Verteiler. Ohne Region und Assetklasse gibt es keinen
 * automatischen Abgleich: ein Bundesland allein träfe Hunderte.
 */
export function abgleichen(investoren: LiveInvestor[], k: AbgleichKriterien): LiveInvestor[] | null {
  if (!k.region || !k.assetklasse) return null;
  const ticketMio = k.kaufpreis && k.kaufpreis > 0 ? k.kaufpreis / 1_000_000 : null;
  return investoren.filter((i) => passt(i, k.region!, k.assetklasse!, ticketMio));
}
