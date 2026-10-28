// Kontrolliert den um acht Wochen nachgezogenen Stichtag (31.08. -> 26.10.2026).
// Kern der Prüfung: die Verschiebung ist uniform, also muss jeder Demo-Zustand
// unverändert bleiben – nur die angezeigten Daten wandern mit.
import { createRequire } from "node:module";
const { chromium } = createRequire("/home/user/Seil-Dashboard-CRM/package.json")("playwright-core");

const B = "http://localhost:3000";
const fehler = [];
const ok = (bed, text) => (bed ? console.log("✓", text) : fehler.push(text));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const holen = async (pfad) => { await page.goto(B + pfad, { waitUntil: "networkidle" }); return page.content(); };

try {
  // --- 1) Der neue Stichtag steht überall, der alte nirgends
  for (const pfad of ["/", "/aufgaben", "/vermarktung", "/objekte/o1", "/investoren/i1"]) {
    const h = await holen(pfad);
    ok(!/31\.08\.2026|2026-08-31/.test(h), `${pfad}: kein Rest vom alten Stichtag`);
  }
  const start = await holen("/");
  ok(/Montag, 26\.10\.2026/.test(start), "Kopf nennt Montag, 26.10.2026");

  // --- 2) Beide Fälligkeits-Töne existieren weiter, je an ihrem Ort
  ok(/heute fällig/.test(start), "Startseite: „heute fällig“ vorhanden");
  ok(/überfällig/.test(start), "Startseite: Überfälligkeit ausgewiesen");
  const aufg = await holen("/aufgaben");
  // React schiebt Kommentarmarker zwischen Textknoten – deshalb über den reinen Text prüfen.
  const aufgText = await page.locator("body").innerText();
  const treffer = aufgText.match(/überfällig seit (\d\d)\.(\d\d)\.2026/);
  ok(!!treffer, "Aufgaben: „überfällig seit <Datum>“ vorhanden");
  if (treffer) {
    const iso = `2026-${treffer[2]}-${treffer[1]}`;
    ok(iso < "2026-10-26", `Überfälligkeit liegt vor dem Stichtag (${treffer[0]})`);
  }

  // --- 3) Follow-up-Stufen weiter gleichzeitig im Bestand
  ok(/Stufe 2/.test(start), "Startseite: Follow-up-Stufe 2 sichtbar");
  ok(/Stufe 3/.test(aufg), "Aufgaben: Follow-up-Stufe 3 sichtbar");

  // --- 4) Datenraum-Lücken unberührt
  const o3 = await holen("/objekte/o3");
  ok(/Lücke|fehlt|offen/i.test(o3), "Objekt o3: Datenraum-Lücken weiter sichtbar");

  // --- 5) Liveliste trägt den neuen Stand
  const i1 = await holen("/investoren/i1");
  ok(/26\.10\.2026/.test(i1), "Liveliste trägt den aktuellen Stand");

  // --- 6) Invarianz gegen den noch live stehenden Vorstand
  const alt = "https://seil-cockpit.vercel.app";
  const zaehle = (h) => {
    const m = {};
    for (const t of h.match(/überfällig seit|heute fällig|Stufe [0-9]/g) || []) m[t] = (m[t] || 0) + 1;
    return JSON.stringify(Object.entries(m).sort());
  };
  for (const pfad of ["/", "/aufgaben", "/vermarktung"]) {
    const neu = zaehle(await holen(pfad));
    const vorher = zaehle(await (await fetch(alt + pfad)).text());
    ok(neu === vorher, `${pfad}: Zustandsmuster unverändert gegenüber dem Vorstand`);
  }
} finally {
  await browser.close();
}

if (fehler.length) { console.error("FEHLER:\n - " + fehler.join("\n - ")); process.exit(1); }
console.log("Stichtag-Verschiebung verifiziert");
