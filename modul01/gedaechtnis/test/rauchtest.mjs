/**
 * Rauchtest: startet den Dienst im Testmodus (ohne Modell), spielt einen Lauf
 * durch und prüft, dass das Gedächtnis aus einer Korrektur lernt.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const verzeichnis = mkdtempSync(join(tmpdir(), "gedaechtnis-"));
const port = 18000 + Math.floor(Math.random() * 1000);
const geheimnis = "test-geheimnis";
const kind = spawn(process.execPath, ["--no-warnings=ExperimentalWarning", new URL("../server.mjs", import.meta.url).pathname], {
  env: { ...process.env, ANTHROPIC_API_KEY: "", GEDAECHTNIS_TESTMODUS: "1", GEDAECHTNIS_DB: join(verzeichnis, "g.sqlite"), PORT: String(port), GEDAECHTNIS_SECRET: geheimnis },
  stdio: ["ignore", "pipe", "inherit"],
});
let fehler = 0;
const basis = `http://127.0.0.1:${port}`;
const kopf = { "content-type": "application/json", "x-seil-secret": geheimnis };
const pruefe = (bedingung, text) => {
  console.log(`${bedingung ? "✓" : "✗"} ${text}`);
  if (!bedingung) fehler++;
};
const post = async (pfad, body) => (await fetch(basis + pfad, { method: "POST", headers: kopf, body: JSON.stringify(body) })).json();
const get = async (pfad) => (await fetch(basis + pfad, { headers: kopf })).json();

try {
  await new Promise((ok, nein) => {
    const t = setTimeout(() => nein(new Error("Server startet nicht")), 8000);
    kind.stdout.on("data", (d) => { if (String(d).includes("bereit")) { clearTimeout(t); ok(); } });
    kind.on("exit", (c) => nein(new Error(`Server beendet mit ${c}`)));
  });

  const g = await get("/gesund");
  pruefe(g.ok === true && g.testmodus === true, "Dienst gesund, Testmodus");

  const ohne = await fetch(basis + "/einordnen", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  pruefe(ohne.status === 401, "Ohne Geheimnis abgewiesen (401)");

  // 1. Eine Datei, die die Heuristik falsch einordnet (kein SOP-Stichwort).
  const a = await post("/einordnen", { lauf: "TEST-Rauch-1", auftraggeber: "Testkunde", pfad: "Unterlagen/Objekt", dateiname: "MV_EG_links_Mueller_2019.pdf" });
  pruefe(a.vorschlagId > 0 && a.quelle === "heuristik", `Erste Einordnung aus Heuristik: ${a.kategorie} (${a.konfidenz})`);

  // 2. Das Team korrigiert im Datenraum-Center.
  const b = await post("/bestaetigen", { vorschlagId: a.vorschlagId, kategorie: "Mietverträge", dateiname: "Mietverträge_[unbekannt: Straße]_EG-links_2019.pdf", durch: "qc", quelle: "qc" });
  pruefe(b.ok === true && (a.kategorie !== "Mietverträge" ? b.korrigiert === true : b.korrigiert === false), `Bestätigung gespeichert, korrigiert=${b.korrigiert}`);

  // 3. Fast dieselbe Datei im nächsten Lauf → Gedächtnis-Treffer ohne Modell.
  const c = await post("/einordnen", { lauf: "TEST-Rauch-2", auftraggeber: "Testkunde", pfad: "Unterlagen/Objekt", dateiname: "MV_EG_links_Mueller_2019 (1).pdf" });
  pruefe(c.kategorie === "Mietverträge", `Nächster Lauf kennt die Datei: ${c.kategorie} aus ${c.quelle} (Ähnlichkeit reichte: ${c.quelle === "gedaechtnis"})`);
  pruefe(c.beispieleGenutzt >= 1, "Beispiel wurde herangezogen");

  // 4. Ähnliche, aber nicht identische Datei → Heuristik mit Beispiel-Übersteuerung.
  const d = await post("/einordnen", { lauf: "TEST-Rauch-2", auftraggeber: "Testkunde", pfad: "Unterlagen/Objekt", dateiname: "MV_OG_rechts_Schmidt_2021.pdf" });
  pruefe(d.kategorie === "Mietverträge", `Verwandte Datei folgt dem Beispiel: ${d.kategorie} (${d.quelle}, ${d.konfidenz})`);

  // 5. Stichwort-Heuristik an sich.
  const e = await post("/einordnen", { lauf: "TEST-Rauch-2", auftraggeber: "Testkunde", pfad: "Fotos", dateiname: "DSC00123.jpeg" });
  pruefe(e.kategorie === "Bilder" && e.light === true, `Foto erkannt: ${e.kategorie}, light=${e.light}`);
  const f = await post("/einordnen", { lauf: "TEST-Rauch-2", auftraggeber: "Testkunde", pfad: "", dateiname: "Grundbuchauszug_Blatt_1234.pdf" });
  pruefe(f.kategorie === "Grundbuch", `Grundbuch erkannt: ${f.kategorie}`);
  pruefe(f.pruefungNoetig === true, "Unter der Schwelle: Prüfung nötig");

  // 6. Stapel und Kennzahlen.
  const st = await post("/einordnen/stapel", { lauf: "TEST-Rauch-3", auftraggeber: "Testkunde", dateien: [{ pfad: "x", dateiname: "Energieausweis_2024.pdf" }, { pfad: "x", dateiname: "Flurkarte.pdf" }] });
  pruefe(st.anzahl === 2 && st.ergebnisse[0].kategorie === "Energienachweis" && st.ergebnisse[1].kategorie === "Kataster", "Stapel-Einordnung");
  await post("/bestaetigen/stapel", { durch: "qc", quelle: "qc", entscheidungen: st.ergebnisse.map((r) => ({ vorschlagId: r.vorschlagId, kategorie: r.kategorie })) });
  const k = await get("/kennzahlen?auftraggeber=Testkunde");
  pruefe(k.gesamt === 7 && k.bestaetigt === 3 && k.lernkurve.length === 3, `Kennzahlen: ${k.gesamt} Dateien, ${k.bestaetigt} bestätigt, ${k.korrigiert} korrigiert, Trefferquote ${k.trefferquote}`);
  const ab = await post("/lauf/abschliessen", { lauf: "TEST-Rauch-3" });
  pruefe(ab.ok === true && ab.kennzahlen.gesamt === 2, "Lauf abgeschlossen mit Kennzahlen");

  // 6b. Anbindung Engine (A10, 03.11.2026): die Engine schickt ihr eigenes Ergebnis mit —
  //     ohne Gedächtnis-Treffer kein Modellaufruf, Quelle „engine“; beim nächsten Lauf
  //     erkennt das Gedächtnis die bestätigte Datei und sagt, wer bestätigt hat.
  const en = await post("/einordnen", { lauf: "TEST-Rauch-4", auftraggeber: "Testkunde B", pfad: "Vermietung", dateiname: "Mieterliste_final (2).pdf", vorschlag: { kategorie: "Mieterliste", konfidenz: 0.97 } });
  pruefe(en.quelle === "engine" && en.kategorie === "Mieterliste" && en.pruefungNoetig === false, `Engine-Vorschlag übernommen ohne Modell: ${en.quelle}`);
  await post("/bestaetigen/stapel", { entscheidungen: [{ vorschlagId: en.vorschlagId, kategorie: "Mieterliste", durch: "engine", quelle: "auto" }] });
  const en2 = await post("/einordnen", { lauf: "TEST-Rauch-5", auftraggeber: "Testkunde B", pfad: "Vermietung", dateiname: "Mieterliste_final (2).pdf", vorschlag: { kategorie: "Mieterliste", konfidenz: 0.8 } });
  pruefe(en2.quelle === "gedaechtnis" && en2.vorlage?.bestaetigung === "auto", `Zweiter Lauf: Treffer aus dem Gedächtnis, Vorlage bestätigt durch ${en2.vorlage?.bestaetigung}`);
  const ungueltig = await post("/einordnen", { lauf: "TEST-Rauch-5", auftraggeber: "Testkunde B", pfad: "", dateiname: "IMG_0001.jpg", vorschlag: { kategorie: "gibt es nicht", konfidenz: 0.9 } });
  pruefe(ungueltig.quelle === "heuristik", "Unbekannte Kategorie im Vorschlag → eigener Weg (hier Heuristik)");
  const kb = await get("/kennzahlen?auftraggeber=Testkunde%20B");
  pruefe(kb.ausEngine === 1 && kb.ausGedaechtnis === 1, `Kennzahlen zählen Engine (${kb.ausEngine}) und Gedächtnis (${kb.ausGedaechtnis}) getrennt`);

  // 7. Destillation (Testmodus: Musterregeln) und Regel-Freigabe.
  await post("/bestaetigen", { vorschlagId: d.vorschlagId, kategorie: "Mietverträge", durch: "qc", quelle: "qc" });
  const r1 = await post("/regeln", { bereich: "global", text: "Dateien mit „MV_“ am Anfang sind Mietverträge.", begruendung: "Hausregel", status: "entwurf" });
  const frei = await post(`/regeln/${r1.id}`, { status: "aktiv", durch: "tp" });
  pruefe(frei.ok === true, "Regel freigegeben");
  const regeln = await get("/regeln?status=aktiv");
  pruefe(regeln.regeln.length === 1, "Eine aktive Regel");
  const dest = await post("/destillieren", {});
  pruefe(dest.ok === true, `Destillation gelaufen: ${dest.korrekturenGelesen} Korrekturen gelesen, ${dest.entwuerfe} Entwürfe`);
} catch (e) {
  fehler++;
  console.error("✗ Abbruch:", e instanceof Error ? e.message : e);
} finally {
  kind.kill("SIGTERM");
  rmSync(verzeichnis, { recursive: true, force: true });
}
console.log(fehler === 0 ? "Rauchtest bestanden" : `Rauchtest: ${fehler} Fehler`);
process.exit(fehler === 0 ? 0 : 1);
