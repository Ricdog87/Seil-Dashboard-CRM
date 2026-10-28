import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const { chromium } = createRequire("/home/user/Seil-Dashboard-CRM/package.json")("playwright-core");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ colorScheme: "light" });
const page = await ctx.newPage();

// Dasselbe Gerüst, das die Veröffentlichung um die Datei legt.
const quelle = new URL("./workshop-30-10.html", import.meta.url);
const inhalt = readFileSync(quelle, "utf8");
await page.setContent(
  `<!doctype html><html><head><meta charset=utf8>` +
  `<meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">` +
  `<style>:root{color-scheme:light}body{margin:0;font:14px system-ui}` +
  `img{max-width:100%}[hidden]{display:none!important}</style></head><body>` +
  inhalt + `</body></html>`,
  { waitUntil: "networkidle" },
);
// Nur für den Druck: keine Umbrüche mitten in einer Karte, Rahmen bleiben sichtbar.
await page.addStyleTag({ content: `
  @page { size: A4; margin: 14mm 12mm; }
  body { background: #fff; }
  .weg, .ent, .spalte, .notiz, .regel, .block { break-inside: avoid; page-break-inside: avoid; }
  section { break-inside: auto; border-bottom: none; padding-block: 20px; }
  h2 { break-after: avoid; }
  .rand { max-width: none; padding-left: 0; padding-right: 0; }
  header { padding-block: 0 18px; }
  footer { padding-block: 16px 0; }
  .wege { grid-template-columns: repeat(2, 1fr); }
` });
await page.emulateMedia({ media: "print" });
await page.pdf({ path: new URL("../SEIL-Workshop-30-10.pdf", import.meta.url).pathname, format: "A4", printBackground: true, scale: 0.74,
                 margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" } });
await browser.close();
