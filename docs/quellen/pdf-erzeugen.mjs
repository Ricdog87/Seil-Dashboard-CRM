// Erzeugt ein PDF aus einer Artefakt-Quelle: legt dasselbe Gerüst darum, das die
// Veröffentlichung setzt, schaltet auf die helle Variante und verhindert Umbrüche
// mitten in einem Block.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const { chromium } = createRequire("/home/user/Seil-Dashboard-CRM/package.json")("playwright-core");

const [quelle, ausgabe, skala = "0.92"] = process.argv.slice(2);
const inhalt = readFileSync(quelle, "utf8");

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ colorScheme: "light" });
const page = await ctx.newPage();
await page.setContent(
  `<!doctype html><html><head><meta charset=utf8>` +
  `<meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">` +
  `<style>:root{color-scheme:light}body{margin:0;font:14px system-ui}` +
  `img{max-width:100%}[hidden]{display:none!important}</style></head><body>` +
  inhalt + `</body></html>`,
  { waitUntil: "networkidle" },
);
await page.addStyleTag({ content: `
  @page { size: A4; margin: 14mm 12mm; }
  body { background: #fff; }
  .warnung, .kontrolle, .wiederholen, li, .weg, .ent, .spalte, .notiz, .regel, .block, .schritt {
    break-inside: avoid; page-break-inside: avoid;
  }
  section { border-bottom: none; padding-block: 18px; }
  h1, h2 { break-after: avoid; }
  .rand { max-width: none; padding-left: 0; padding-right: 0; }
  header { padding-block: 0 16px; }
  footer { padding-block: 14px 0; }
` });
await page.emulateMedia({ media: "print" });
await page.pdf({ path: ausgabe, format: "A4", printBackground: true, scale: Number(skala),
                 margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" } });
await browser.close();
console.log("geschrieben:", ausgabe);
