#!/usr/bin/env node
// Spielt die neun Workflows über die n8n-REST-API ein.
//
//   export N8N_API_KEY=<Schlüssel aus n8n: Settings → n8n API>
//   node automation/n8n/importieren.mjs --basis https://<host> --konfig /opt/seil/n8n-konfig.json
//
// --konfig traegt kundenspezifische Werte in die Konfigurationsknoten ein, bevor
// ein Workflow angelegt wird. So bleiben Laufwerks- und Dateikennungen aus dem
// Repository und ueberleben trotzdem jeden Neuimport. Aufbau siehe
// konfig.beispiel.json.
//
// Standardmäßig wird nichts gelöscht. Mit --alte-loeschen werden alle
// vorhandenen Workflows entfernt, vorher aber vollständig gesichert.
// --trockenlauf zeigt nur, was passieren würde.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HIER = dirname(fileURLToPath(import.meta.url));

function argumente(argv) {
  const a = { basis: "", loeschen: false, trocken: false, konfig: "" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--basis") a.basis = (argv[++i] ?? "").replace(/\/+$/, "");
    else if (argv[i] === "--konfig") a.konfig = argv[++i] ?? "";
    else if (argv[i] === "--alte-loeschen") a.loeschen = true;
    else if (argv[i] === "--trockenlauf") a.trocken = true;
  }
  return a;
}

// n8n lehnt Felder ab, die es selbst vergibt. Nur diese dürfen in den Body.
const ERLAUBT = ["name", "nodes", "connections", "settings", "staticData"];
function koerper(roh) {
  const k = {};
  for (const feld of ERLAUBT) if (roh[feld] !== undefined) k[feld] = roh[feld];
  k.settings ??= {};
  return k;
}

// Traegt die Werte aus der Konfigurationsdatei in die Set-Knoten ein. Gibt zurueck,
// welche Felder gesetzt wurden, damit der Lauf nachvollziehbar bleibt.
function konfigurieren(werk, eintraege) {
  const gesetzt = [];
  if (!eintraege) return gesetzt;

  // Zugangsdateien je Knoten, damit nichts von Hand in der Oberflaeche
  // gesetzt werden muss. Form: { "_credentials": { "<Knoten>": { ... } } }
  const zugaenge = eintraege._credentials ?? {};
  for (const [knotenName, eintrag] of Object.entries(zugaenge)) {
    const knoten = (werk.nodes ?? []).find((k) => k.name === knotenName);
    if (knoten === undefined) {
      throw new Error(`Konfiguration nennt den Knoten "${knotenName}", den es im Workflow nicht gibt.`);
    }
    knoten.credentials = { ...(knoten.credentials ?? {}), ...eintrag };
    gesetzt.push(`Zugang:${knotenName}`);
  }

  for (const knoten of werk.nodes ?? []) {
    for (const zu of knoten.parameters?.assignments?.assignments ?? []) {
      if (!(zu.name in eintraege)) continue;
      const wert = eintraege[zu.name];
      zu.value = typeof wert === "string" ? wert : JSON.stringify(wert);
      gesetzt.push(zu.name);
    }
  }

  const fehlend = Object.keys(eintraege).filter(
    (f) => f !== "_credentials" && !gesetzt.includes(f),
  );
  if (fehlend.length > 0) {
    throw new Error(`Konfiguration nennt Felder, die es im Workflow nicht gibt: ${fehlend.join(", ")}`);
  }
  return gesetzt;
}

async function api(arg, pfad, methode = "GET", koerperObjekt) {
  const antwort = await fetch(`${arg.basis}/api/v1${pfad}`, {
    method: methode,
    headers: {
      "X-N8N-API-KEY": process.env.N8N_API_KEY ?? "",
      ...(koerperObjekt ? { "Content-Type": "application/json" } : {}),
    },
    ...(koerperObjekt ? { body: JSON.stringify(koerperObjekt) } : {}),
  });
  const text = await antwort.text();
  if (!antwort.ok) {
    throw new Error(`${methode} ${pfad} → ${antwort.status} ${antwort.statusText}\n${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : null;
}

const arg = argumente(process.argv.slice(2));
if (!arg.basis) {
  console.error("Fehlt: --basis https://<host>");
  process.exit(2);
}
if (!process.env.N8N_API_KEY && !arg.trocken) {
  console.error("Fehlt: Umgebungsvariable N8N_API_KEY");
  process.exit(2);
}

let konfig = {};
if (arg.konfig) {
  konfig = JSON.parse(readFileSync(arg.konfig, "utf8"));
  console.log(`Konfiguration: ${arg.konfig} (${Object.keys(konfig).length} Eintrag/Eintraege)`);
}

const dateien = readdirSync(HIER).filter((d) => /^\d\d-.*\.json$/.test(d)).sort();
if (dateien.length !== 9) {
  console.error(`Erwartet neun Workflow-Dateien, gefunden ${dateien.length}: ${dateien.join(", ")}`);
  process.exit(2);
}
console.log(`Neun Dateien gefunden: ${dateien.map((d) => d.slice(0, 2)).join(" ")}`);

if (arg.trocken) {
  for (const d of dateien) {
    const roh = JSON.parse(readFileSync(join(HIER, d), "utf8"));
    const k = koerper(roh);
    const gesetzt = konfigurieren(k, konfig[d]);
    const zusatz = gesetzt.length > 0 ? `  [konfiguriert: ${gesetzt.join(", ")}]` : "";
    console.log(`  ${d.padEnd(30)} ${String(k.nodes?.length ?? 0).padStart(2)} Knoten  "${k.name}"${zusatz}`);
  }
  console.log("\nTrockenlauf: es wurde nichts gesendet.");
  process.exit(0);
}

// 1. Bestand aufnehmen und sichern
const bestand = (await api(arg, "/workflows?limit=250")).data ?? [];
console.log(`\nAuf dem Server: ${bestand.length} Workflow(s)`);
if (bestand.length > 0) {
  const voll = [];
  for (const w of bestand) voll.push(await api(arg, `/workflows/${w.id}`));
  const sicherung = join(HIER, `sicherung-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(sicherung, JSON.stringify(voll, null, 2));
  console.log(`Sicherung geschrieben: ${sicherung}`);
}

// 2. Alte entfernen, nur auf ausdrücklichen Wunsch
if (arg.loeschen) {
  for (const w of bestand) {
    await api(arg, `/workflows/${w.id}`, "DELETE");
    console.log(`  gelöscht: ${w.name}`);
  }
} else if (bestand.length > 0) {
  console.log("Vorhandene Workflows bleiben stehen (ohne --alte-loeschen).");
}

// 3. Neu anlegen
console.log();
for (const d of dateien) {
  const roh = JSON.parse(readFileSync(join(HIER, d), "utf8"));
  const k = koerper(roh);
  const gesetzt = konfigurieren(k, konfig[d]);
  const neu = await api(arg, "/workflows", "POST", k);
  const zusatz = gesetzt.length > 0 ? `  [konfiguriert: ${gesetzt.join(", ")}]` : "";
  console.log(`  angelegt: ${d.slice(0, 2)}  ${neu.name}  (id ${neu.id})${zusatz}`);
}

// 4. Gegenprobe
const danach = (await api(arg, "/workflows?limit=250")).data ?? [];
const aktiv = danach.filter((w) => w.active);
console.log(`\nErgebnis: ${danach.length} Workflow(s), davon aktiv: ${aktiv.length}`);
if (aktiv.length > 0) console.log("  ACHTUNG, aktiv: " + aktiv.map((w) => w.name).join(", "));
process.exit(danach.length === 9 && aktiv.length === 0 ? 0 : 1);
