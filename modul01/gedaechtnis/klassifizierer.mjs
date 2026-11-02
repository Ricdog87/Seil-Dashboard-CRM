import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { normalisieren } from "./merkmale.mjs";

/**
 * Die Einordnung einer Datei – mit Gedächtnis.
 *
 * Drei Wege, vom günstigsten zum teuersten:
 *  1. Gedächtnis-Treffer: eine fast identische, bestätigte Datei gibt es schon → ihre Kategorie, kein Modellaufruf.
 *  2. Modell (Claude): SOP-Kategorien, freigegebene Regeln und die ähnlichsten bestätigten Beispiele im Prompt.
 *  3. Heuristik: Stichwörter – ohne API-Schlüssel (Testmodus) oder wenn das Modell nicht erreichbar ist.
 *
 * Der stabile Teil des Prompts (Rolle, SOP, Regeln) wird gecacht; nur Beispiele
 * und Datei wechseln. Das Modell lernt nichts – das Gedächtnis schon.
 */
const KATEGORIEN = JSON.parse(readFileSync(new URL("./kategorien.json", import.meta.url), "utf8"));
const NAMEN = KATEGORIEN.kategorien.map((k) => k.name);

const SCHEMA = {
  type: "object",
  properties: {
    kategorie: { type: "string", enum: [...NAMEN, "unklar"], description: "Eine der 20 SOP-Kategorien oder „unklar“, wenn keine sicher passt." },
    dateiname: { type: "string", description: "Vorschlag nach Konvention; fehlende Angaben als [unbekannt: Feld]." },
    konfidenz: { type: "number", minimum: 0, maximum: 1, description: "Wie sicher die Einordnung ist. Unter 0,7 nur, wenn wirklich unklar." },
    begruendung: { type: "string", description: "Ein Satz, worauf sich die Einordnung stützt." },
    fehlendeAngaben: { type: "array", items: { type: "string" }, description: "Felder aus der Konvention, die aus Pfad, Name und Auszug nicht hervorgehen." },
    geschuetzt: { type: "boolean", description: "True, wenn der Auszug auf ein verschlüsseltes oder leeres Dokument hindeutet." },
  },
  required: ["kategorie", "dateiname", "konfidenz", "begruendung", "fehlendeAngaben", "geschuetzt"],
  additionalProperties: false,
};

function systemPrompt(regeln) {
  const kategorien = KATEGORIEN.kategorien
    .map((k) => `- ${k.name}${k.light ? " (auch Datenraum light)" : ""}: ${k.definition}`)
    .join("\n");
  const felder = KATEGORIEN.felder.map((f) => `- ${f.name}: ${f.beschreibung}`).join("\n");
  const regelText = regeln.length
    ? regeln.map((r) => `- [${r.bereich === "global" ? "alle" : r.bereich}] ${r.text}`).join("\n")
    : "- (noch keine freigegebenen Regeln)";
  return [
    {
      type: "text",
      text: `Du ordnest Dokumente eines Immobilien-Datenraums in die Standardstruktur der SEIL Real Estate ein (SOP vom 18.02.2026) und schlägst einen Dateinamen nach Konvention vor.

Kategorien:
${kategorien}

Felder der Dateinamen-Konvention:
${felder}
Konvention: ${KATEGORIEN.dateinamenKonvention}

Grundsätze:
- Entscheide anhand von Pfad, Dateiname und – falls vorhanden – Textauszug. Erfinde keine Angaben; was fehlt, steht in fehlendeAngaben und im Dateinamen als [unbekannt: Feld].
- Wenn bestätigte Beispiele ähnlicher Dateien mitgegeben sind, haben sie Vorrang vor allgemeinen Vermutungen: so hat das Team entschieden.
- Ein Foto ist „Bilder“, auch wenn es im Ordner „Grundrisse“ liegt. Ein Plan mit Geschossangabe ist „Grundrisse“, eine Fassade „Ansichten“.
- Konfidenz ehrlich: 0,95 und mehr nur, wenn Name oder Beispiele eindeutig sind.`,
    },
    {
      type: "text",
      text: `Freigegebene Regeln des Teams (aus Korrekturen gelernt):
${regelText}`,
      cache_control: { type: "ephemeral" },
    },
  ];
}

function nutzerText(datei, beispiele) {
  const bsp = beispiele.length
    ? beispiele
        .map((b) => `- ${b.pfad ? b.pfad + "/" : ""}${b.dateiname} → ${b.kategorie_final}${b.dateiname_final ? ` → „${b.dateiname_final}“` : ""}${b.korrigiert === 1 ? " (vom Team korrigiert)" : ""} · Ähnlichkeit ${b.aehnlichkeit}`)
        .join("\n")
    : "- keine";
  return `Bestätigte Beispiele ähnlicher Dateien:
${bsp}

Einzuordnende Datei:
- Auftraggeber: ${datei.auftraggeber ?? "unbekannt"}
- Lauf: ${datei.lauf ?? "unbekannt"}
- Pfad: ${datei.pfad || "(Wurzel)"}
- Dateiname: ${datei.dateiname}
- Größe: ${datei.groesse ?? "unbekannt"}${datei.mime ? ` · Typ: ${datei.mime}` : ""}
${datei.textauszug ? `- Textauszug (Anfang):\n"""\n${String(datei.textauszug).slice(0, 2000)}\n"""` : "- Textauszug: keiner"}`;
}

/** Stichwort-Heuristik – der Boden, auf dem alles steht, wenn kein Modell da ist. */
export function heuristik(datei, beispiele) {
  const text = normalisieren(`${datei.pfad ?? ""} ${datei.dateiname} ${datei.dateiname} ${datei.textauszug?.slice(0, 500) ?? ""}`);
  const woerter = new Set(text.split(" ").filter(Boolean));
  let beste = null;
  for (const k of KATEGORIEN.kategorien) {
    let punkte = 0;
    for (const s of k.stichwoerter) {
      const n = normalisieren(s);
      // Kurze Stichwörter („mv“, „gr“) zählen nur als ganzes Wort – sonst trifft „eg“ jeden Namen.
      const trifft = n.length <= 3 ? woerter.has(n) : text.includes(n);
      if (trifft) punkte += n.length > 4 ? 2 : 1;
    }
    if (!beste || punkte > beste.punkte) beste = { name: k.name, punkte };
  }
  // Beispiele dürfen die Heuristik überstimmen, wenn sie klar genug sind.
  const top = beispiele[0];
  if (top && top.aehnlichkeit >= 0.5) {
    return {
      kategorie: top.kategorie_final,
      dateiname: datei.dateiname,
      konfidenz: Math.min(0.9, 0.6 + top.aehnlichkeit / 3),
      begruendung: `Ähnlich zu bestätigtem Beispiel „${top.dateiname}“.`,
      fehlendeAngaben: ["Straße", "Hausnummer", "Datum"],
      geschuetzt: false,
    };
  }
  if (!beste || beste.punkte === 0) {
    return { kategorie: "unklar", dateiname: datei.dateiname, konfidenz: 0.3, begruendung: "Kein Stichwort der SOP im Namen.", fehlendeAngaben: ["Straße", "Hausnummer", "Datum"], geschuetzt: false };
  }
  return {
    kategorie: beste.name,
    dateiname: datei.dateiname,
    konfidenz: Math.min(0.85, 0.5 + beste.punkte * 0.1),
    begruendung: "Stichwörter im Pfad oder Dateinamen.",
    fehlendeAngaben: ["Straße", "Hausnummer", "Datum"],
    geschuetzt: false,
  };
}

export class Klassifizierer {
  constructor({ modell, effort, testmodus }) {
    this.modell = modell ?? "claude-opus-5-5";
    this.effort = effort ?? "low";
    this.testmodus = !!testmodus || !process.env.ANTHROPIC_API_KEY;
    this.client = this.testmodus ? null : new Anthropic();
    this.statistik = { aufrufe: 0, cacheGelesen: 0, cacheGeschrieben: 0, eingabe: 0, ausgabe: 0, fehler: 0 };
  }

  async einordnen(datei, beispiele, regeln) {
    if (this.testmodus) return { ...heuristik(datei, beispiele), quelle: "heuristik", modell: null };
    try {
      const antwort = await this.client.messages.create({
        model: this.modell,
        max_tokens: 1024,
        system: systemPrompt(regeln),
        messages: [{ role: "user", content: nutzerText(datei, beispiele) }],
        output_config: { effort: this.effort, format: { type: "json_schema", schema: SCHEMA } },
      });
      this.statistik.aufrufe++;
      this.statistik.cacheGelesen += antwort.usage.cache_read_input_tokens ?? 0;
      this.statistik.cacheGeschrieben += antwort.usage.cache_creation_input_tokens ?? 0;
      this.statistik.eingabe += antwort.usage.input_tokens ?? 0;
      this.statistik.ausgabe += antwort.usage.output_tokens ?? 0;
      if (antwort.stop_reason === "refusal") {
        this.statistik.fehler++;
        return { ...heuristik(datei, beispiele), quelle: "heuristik", modell: this.modell, hinweis: "Modell hat die Anfrage abgelehnt" };
      }
      const text = antwort.content.find((b) => b.type === "text")?.text ?? "";
      const roh = JSON.parse(text);
      if (!SCHEMA.properties.kategorie.enum.includes(roh.kategorie)) roh.kategorie = "unklar";
      roh.konfidenz = Math.max(0, Math.min(1, Number(roh.konfidenz) || 0));
      return { ...roh, quelle: "modell", modell: this.modell };
    } catch (e) {
      this.statistik.fehler++;
      const grund = e instanceof Anthropic.APIError ? `API ${e.status}: ${e.message}` : e instanceof Error ? e.message : "unbekannt";
      return { ...heuristik(datei, beispiele), quelle: "heuristik", modell: this.modell, hinweis: `Modell nicht nutzbar (${grund.slice(0, 120)})` };
    }
  }

  /** Aus Korrekturen Regelvorschläge destillieren – als Entwürfe, nie direkt aktiv. */
  async destillieren(korrekturen, aktiveRegeln) {
    if (korrekturen.length === 0) return [];
    if (this.testmodus) {
      // Ohne Modell: häufige Muster „Token → Kategorie“ als Regel vorschlagen.
      const zaehler = new Map();
      for (const k of korrekturen) {
        for (const t of normalisieren(k.dateiname).split(" ")) {
          if (t.length < 2 || /^\d+$/.test(t)) continue;
          const key = `${t}→${k.kategorie_final}`;
          zaehler.set(key, (zaehler.get(key) ?? 0) + 1);
        }
      }
      return [...zaehler.entries()]
        .filter(([, n]) => n >= 2)
        .slice(0, 10)
        .map(([key, n]) => {
          const [token, kategorie] = key.split("→");
          return { bereich: "global", text: `Dateien mit „${token}“ im Namen gehören in der Regel zu „${kategorie}“.`, begruendung: `${n} Korrekturen des Teams.` };
        });
    }
    const liste = korrekturen
      .map((k) => `- [${k.auftraggeber ?? "?"}] ${k.pfad ? k.pfad + "/" : ""}${k.dateiname}: vorgeschlagen „${k.kategorie_vorschlag}“ → vom Team „${k.kategorie_final}“${k.dateiname_final ? ` (Name: „${k.dateiname_final}“)` : ""}`)
      .join("\n");
    const bestehend = aktiveRegeln.length ? aktiveRegeln.map((r) => `- [${r.bereich}] ${r.text}`).join("\n") : "- keine";
    try {
      const antwort = await this.client.messages.create({
        model: this.modell,
        max_tokens: 4000,
        system: `Du bist der Lernmechanismus eines Datenraum-Agenten. Aus Korrekturen des Teams leitest du wenige, präzise, überprüfbare Regeln ab, die künftige Einordnungen verbessern. Keine Regel, die nur einen Einzelfall beschreibt. Keine Regel, die einer bestehenden widerspricht – schlage stattdessen eine Präzisierung vor. Bereich „global“, wenn die Regel für alle Auftraggeber gilt, sonst der Name des Auftraggebers.`,
        messages: [
          {
            role: "user",
            content: `Bestehende freigegebene Regeln:\n${bestehend}\n\nKorrekturen seit der letzten Destillation:\n${liste}\n\nSchlage höchstens zehn neue Regeln vor.`,
          },
        ],
        output_config: {
          effort: "medium",
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              properties: {
                regeln: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { bereich: { type: "string" }, text: { type: "string" }, begruendung: { type: "string" } },
                    required: ["bereich", "text", "begruendung"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["regeln"],
              additionalProperties: false,
            },
          },
        },
      });
      this.statistik.aufrufe++;
      if (antwort.stop_reason === "refusal") return [];
      const text = antwort.content.find((b) => b.type === "text")?.text ?? "{}";
      return (JSON.parse(text).regeln ?? []).slice(0, 10);
    } catch (e) {
      this.statistik.fehler++;
      return [];
    }
  }
}

export { NAMEN as KATEGORIE_NAMEN, KATEGORIEN };
