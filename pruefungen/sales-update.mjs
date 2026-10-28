// Prüft die Umsetzung des Sales-Updates vom 28.09.: drei Sichtebenen, Portfolio mit
// Tagesprioritäten, Sammelfreigabe, Liveliste statt Ankaufsprofil, Ansprechpartner.
import { createRequire } from "node:module";
const { chromium } = createRequire("/home/user/Seil-Dashboard-CRM/package.json")("playwright-core");

const B = "http://localhost:3000";
const fehler = [];
const ok = (bed, text) => (bed ? console.log("✓", text) : fehler.push(text));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const wechsleZu = async (name) => {
  await page.selectOption('select[aria-label="Arbeiten als"]', { label: name });
  await page.waitForTimeout(350);
};

try {
  // --- 1) Start als Sales Leadership: Portfolio über dem operativen Tag
  await page.goto(B, { waitUntil: "networkidle" });
  const gewaehlt = await page.locator('select[aria-label="Arbeiten als"]').inputValue();
  ok(gewaehlt === "m7", `Startet als Sales Leadership (${gewaehlt})`);
  ok((await page.locator("h2:text-is('Portfolio')").count()) === 1, "Portfolio-Ebene sichtbar");
  ok((await page.locator("text=alle Mandate des Teams").count()) === 1, "Portfolio nennt die Sicht");
  ok((await page.locator("h2:has-text('Prioritäten heute')").count()) === 1, "Tagesprioritäten da");
  ok((await page.locator("h2:text-is('Team')").count()) === 1, "Team-Tafel da");
  // Portfolio UND eigener Tag zugleich
  ok((await page.locator("h2:has-text('Posteingang')").count()) === 1, "Leitung sieht zusätzlich den operativen Tag");

  // Gruppierter Umschalter
  const gruppen = await page.locator('select[aria-label="Arbeiten als"] optgroup').evaluateAll((g) => g.map((x) => x.label));
  ok(JSON.stringify(gruppen) === JSON.stringify(["Geschäftsführung", "Sales Leadership", "Staff"]),
     `Umschalter nach Ebenen gruppiert: ${gruppen.join(", ")}`);
  const namen = await page.locator('select[aria-label="Arbeiten als"] option').evaluateAll((o) => o.map((x) => x.textContent.trim()));
  ok(!namen.some((n) => /Pries|Tenbrink/.test(n)), "Management-Stab nicht im Umschalter");

  // --- 2) Tagespriorität abhaken
  const prioKarte = page.locator("h2:has-text('Prioritäten heute')").locator("xpath=../..");
  const offenVorher = await prioKarte.locator('input[type="checkbox"]:not(:checked)').count();
  await prioKarte.locator('input[type="checkbox"]:not(:checked)').first().check();
  await page.waitForTimeout(250);
  const offenNachher = await prioKarte.locator('input[type="checkbox"]:not(:checked)').count();
  ok(offenNachher === offenVorher - 1, `Priorität abgehakt (${offenVorher} → ${offenNachher} offen)`);

  // --- 3) Sammelfreigabe
  const freigabe = page.locator("h2:has-text('Freigabe · Mail-Entwürfe')").locator("xpath=../..");
  const kopf = await page.locator("h2:has-text('Freigabe · Mail-Entwürfe')").innerText();
  ok(/\(7 offen\)/.test(kopf), `Sammelfreigabe zeigt alle wartenden Entwürfe: ${kopf}`);
  const mandate = await freigabe.locator("ul > li").count();
  ok(mandate >= 3, `Entwürfe nach Mandat gruppiert (${mandate} Mandate)`);
  const knopf = freigabe.locator("button:has-text('Freigeben')");
  ok(await knopf.isDisabled(), "Ohne Auswahl ist Freigeben gesperrt");
  await freigabe.locator('input[type="checkbox"]').first().check(); // „Alle auswählen“
  await page.waitForTimeout(200);
  ok(/7 freigeben/.test(await knopf.innerText()), `Alle auswählen zählt: ${await knopf.innerText()}`);
  await knopf.click();
  await page.waitForTimeout(350);
  ok((await page.locator("text=Alle Entwürfe sind freigegeben").count()) === 1, "Nach Sammelfreigabe ist der Vorrat leer");
  ok((await page.locator("text=7 freigegeben und an den Versand übergeben").count()) === 1, "Freigabe wird protokolliert");

  // --- 4) Geschäftsführung: nur Zahlen, kein Portfolio-Block, keine Freigabe
  await wechsleZu("Max Seil");
  ok((await page.locator("h2:text-is('Portfolio')").count()) === 0, "GF sieht keinen Portfolio-Block");
  ok((await page.locator("h2:has-text('Freigabe · Mail-Entwürfe')").count()) === 0, "GF sieht keine Sammelfreigabe");
  ok((await page.locator("text=Geschäftsführungs-Blick").count()) >= 1, "GF-Blick aktiv");

  // --- 5) Staff: eigener Tag, kein Portfolio
  await wechsleZu("Katharina Vogt");
  ok((await page.locator("h2:text-is('Portfolio')").count()) === 0, "Staff sieht kein Portfolio");
  ok((await page.locator("h2:has-text('Posteingang')").count()) === 1, "Staff sieht den operativen Tag");
  const rolle = await page.locator('select[aria-label="Arbeiten als"]').inputValue();
  ok(rolle === "m1", "Umschalten auf Staff funktioniert");

  // --- 6) Investor-Detail: Liveliste statt gespeichertem Profil
  await page.goto(`${B}/investoren/i1`, { waitUntil: "networkidle" });
  ok((await page.locator("text=aus Liveliste").count()) === 1, "Ankaufsprofil weist die Liveliste als Quelle aus");
  ok((await page.locator("text=Letzte Ankäufe").count()) === 1, "Letzte Ankäufe sichtbar (Kriterium laut 28.09.)");
  ok((await page.locator("text=Bürohaus Opernturm-Nähe").count()) === 1, "Ankaufshistorie gefüllt");

  // --- 7) Objekt-Detail: Ansprechpartner und Datenraum-Stufe
  await page.goto(`${B}/objekte/o1`, { waitUntil: "networkidle" });
  ok((await page.locator("h2:text-is('Ansprechpartner')").count()) === 1, "Ansprechpartner-Karte da");
  ok((await page.locator("text=Besichtigung vor Ort").count()) >= 1, "Besichtigungskontakt hinterlegt");
  ok((await page.locator("text=extern").count()) >= 1, "Externe Kontakte gekennzeichnet (Hausverwaltung)");
  const dr = page.locator("h2:text-is('Datenraum')").locator("xpath=../..");
  ok((await dr.locator("text=Full").count()) === 1, "Datenraum-Stufe aus der SOP sichtbar");

  // --- 8) Mobil: keine Querscroll-Leiste auf der Leitungs-Ansicht
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(B, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(50, 0));
  const x = await page.evaluate(() => window.scrollX);
  ok(x === 0, `Portfolio-Ansicht mobil ohne Overflow (scrollX ${x})`);
} finally {
  await browser.close();
}

if (fehler.length) {
  console.error("FEHLER:\n - " + fehler.join("\n - "));
  process.exit(1);
}
console.log("Sales-Update 28.09. verifiziert");
