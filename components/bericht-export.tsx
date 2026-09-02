"use client";

import { useState } from "react";
import { Check, Download } from "lucide-react";
import {
  aktiverSchritt,
  fmtMio,
  GEANTWORTET,
  hatDatenraumLuecke,
  inVermarktungskontext,
  istUeberfaellig,
  linksZuObjekt,
  mitarbeiterVon,
  prozessFortschritt,
} from "@/lib/derive";
import { aufgaben, HEUTE, objekte } from "@/lib/mock-data";
import { useObjekteLive } from "@/components/modul01";
import { Button } from "@/components/ui";
import { useSitzung } from "./sitzung";

/** Kleine HTML-Escape-Hilfe für die Demodaten im Bericht. */
const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/**
 * Reporting als Exportprodukt direkt aus dem Dashboard (Update-Call 28.08.):
 * Ein Klick erzeugt den Statusbericht als eigenständige HTML-Datei im SEIL-CI –
 * dasselbe HTML-Produkt, das produktiv die Automatik (n8n) werktäglich um
 * 08:00 an das Team versendet. Zahlen kommen live aus dem Sitzungszustand.
 */
export function BerichtExport() {
  const objekteLive = useObjekteLive();
  const { aufgabenPatches } = useSitzung();
  const [exportiert, setExportiert] = useState(false);

  const exportieren = () => {
    const effektiv = aufgaben.map((t) => ({ ...t, ...aufgabenPatches[t.id] }));
    const offen = effektiv.filter((t) => !t.erledigt);
    const ueberfaellig = offen.filter((t) => t.faellig < HEUTE).length;

    const gesamt = objekte.reduce((s, o) => s + o.kaufpreisMio, 0);
    const verm = objekte.filter(inVermarktungskontext);
    const vermSumme = verm.reduce((s, o) => s + o.kaufpreisMio, 0);

    const alleLinks = objekte.flatMap((o) => linksZuObjekt(o.id));
    const kontaktiert = alleLinks.filter((l) => l.status !== "vorgemerkt");
    const geantwortet = kontaktiert.filter((l) => GEANTWORTET.includes(l.status));
    const quote = kontaktiert.length
      ? Math.round((geantwortet.length / kontaktiert.length) * 100)
      : 0;
    const stufe3 = alleLinks.filter(
      (l) => l.status === "angeschrieben" && l.followUpStufe === 3,
    ).length;
    const followUpsUeberfaellig = alleLinks.filter(
      (l) => l.status === "angeschrieben" && istUeberfaellig(l.naechstesFollowUp),
    ).length;
    const luecken = objekteLive.filter(hatDatenraumLuecke).length;

    const zeilen = [...objekte]
      .sort((a, b) => b.kaufpreisMio - a.kaufpreisMio)
      .map((o) => {
        const phase = aktiverSchritt(o);
        const pf = prozessFortschritt(o);
        const links = linksZuObjekt(o.id).filter((l) => l.status !== "vorgemerkt");
        const antworten = links.filter((l) => GEANTWORTET.includes(l.status));
        const lead = mitarbeiterVon(o.zustaendigId);
        return `<tr>
          <td><strong>${esc(o.name)}</strong><br><span class="klein">${esc(o.stadt)}</span></td>
          <td class="zahl">${fmtMio(o.kaufpreisMio)}</td>
          <td>P${phase.phase} · ${phase.nr} ${esc(phase.titel)}</td>
          <td class="zahl">${pf.done}/${pf.gesamt}</td>
          <td class="zahl">${links.length || "–"}</td>
          <td class="zahl">${antworten.length || "–"}</td>
          <td>${esc(lead?.kuerzel ?? "")}</td>
        </tr>`;
      })
      .join("\n");

    const kpi = (label: string, wert: string, sub?: string) =>
      `<td class="kpi"><span class="label">${label}</span><span class="wert">${wert}</span>${
        sub ? `<span class="klein">${sub}</span>` : ""
      }</td>`;

    const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SEIL Statusbericht ${HEUTE}</title>
<style>
  :root { --bg:#121214; --surface:#1a1a1e; --card:#232328; --line:#37373f; --text:#f4f5f6; --body:#c2c6cc; --muted:#8a8f97; --accent:#9daab8; --warning:#c9a56b; }
  body { margin:0; background:var(--bg); color:var(--body); font:13px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif; }
  .seite { max-width:820px; margin:0 auto; padding:32px 24px 40px; }
  .kopf { display:flex; justify-content:space-between; align-items:baseline; border-bottom:1px solid var(--line); padding-bottom:12px; }
  .marke { font-size:19px; font-weight:600; letter-spacing:.18em; color:var(--text); }
  .kicker { font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
  h1 { font-size:20px; font-weight:600; color:var(--text); margin:18px 0 14px; }
  table { width:100%; border-collapse:collapse; }
  .kpis { margin-bottom:18px; }
  .kpis td.kpi { background:var(--card); border:1px solid var(--line); border-radius:6px; padding:10px 12px; }
  .kpi .label { display:block; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
  .kpi .wert { display:block; font-size:21px; color:var(--text); font-variant-numeric:tabular-nums; margin-top:2px; }
  .tabelle { border:1px solid var(--line); border-radius:6px; overflow:hidden; background:var(--card); }
  th { text-align:left; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); font-weight:500; padding:8px 10px; border-bottom:1px solid var(--line); }
  td { padding:8px 10px; border-bottom:1px solid var(--line); vertical-align:top; }
  tr:last-child td { border-bottom:none; }
  .zahl { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .klein { font-size:11px; color:var(--muted); }
  .achtung { margin:18px 0 0; padding:0; list-style:none; }
  .achtung li { display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding:6px 2px; }
  .achtung .warn { color:var(--warning); font-weight:600; font-variant-numeric:tabular-nums; }
  footer { margin-top:22px; padding-top:10px; border-top:1px solid var(--line); font-size:10.5px; color:var(--muted); }
</style></head><body><div class="seite">
  <div class="kopf"><span class="marke">SEIL</span><span class="kicker">Statusbericht · Stand ${HEUTE.split("-").reverse().join(".")}</span></div>
  <h1>Pipeline &amp; Vermarktung auf einen Blick</h1>
  <table class="kpis"><tr>
    ${kpi("Pipeline gesamt", fmtMio(gesamt), `${objekte.length} Mandate`)}
    ${kpi("In Vermarktung", fmtMio(vermSumme), `${verm.length} Objekte`)}
    ${kpi("Antwortquote", `${quote} %`, `${geantwortet.length} von ${kontaktiert.length} Kontakten`)}
    ${kpi("Offene Aufgaben", String(offen.length), ueberfaellig ? `${ueberfaellig} überfällig` : "nichts überfällig")}
  </tr></table>
  <div class="tabelle"><table>
    <thead><tr><th>Objekt</th><th class="zahl">Kaufpreis</th><th>Aktuelle Phase</th><th class="zahl">Prozess</th><th class="zahl">Kontaktiert</th><th class="zahl">Antworten</th><th>Lead</th></tr></thead>
    <tbody>${zeilen}</tbody>
  </table></div>
  <ul class="achtung">
    <li><span>Überfällige Aufgaben</span><span class="warn">${ueberfaellig}</span></li>
    <li><span>Follow-up überfällig (Automatik gestoppt)</span><span class="warn">${followUpsUeberfaellig}</span></li>
    <li><span>Stufe 3 ohne Antwort – manuell nachfassen</span><span class="warn">${stufe3}</span></li>
    <li><span>Datenräume mit Lücken</span><span class="warn">${luecken}</span></li>
  </ul>
  <footer>Automatisch erzeugt aus dem SEIL Cockpit (Prototyp, Demodaten). Produktiv erzeugt und
    versendet die Automatik (n8n) diesen Bericht werktäglich um 08:00 als HTML-Produkt an das Team.</footer>
</div></body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SEIL-Statusbericht-${HEUTE}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportiert(true);
    window.setTimeout(() => setExportiert(false), 2500);
  };

  return (
    <Button variant="ghost" icon={exportiert ? Check : Download} onClick={exportieren}>
      {exportiert ? "Bericht heruntergeladen" : "Bericht exportieren (HTML)"}
    </Button>
  );
}
