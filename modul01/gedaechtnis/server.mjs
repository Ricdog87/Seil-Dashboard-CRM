import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { Speicher } from "./speicher.mjs";
import { Klassifizierer, KATEGORIE_NAMEN } from "./klassifizierer.mjs";

/**
 * Das Gedächtnis von Modul 01 als kleiner HTTP-Dienst.
 *
 * Läuft neben n8n auf dem SEIL-Server, hört nur lokal (oder im Docker-Netz)
 * und verlangt dasselbe Geheimnis wie die übrigen SEIL-Webhooks. Jeder
 * Datenraum-Lauf fragt hier je Datei nach („einordnen“), das Datenraum-Center
 * meldet die Entscheidung des Teams zurück („bestaetigen“). Aus beidem wird
 * der nächste Lauf besser.
 */
const KONFIG = {
  host: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 8787),
  db: process.env.GEDAECHTNIS_DB ?? "./daten/gedaechtnis.sqlite",
  geheimnis: process.env.GEDAECHTNIS_SECRET ?? "",
  modell: process.env.GEDAECHTNIS_MODELL ?? "claude-opus-5-5",
  effort: process.env.GEDAECHTNIS_EFFORT ?? "low",
  treffer: Number(process.env.GEDAECHTNIS_TREFFER ?? 0.92),
  testmodus: process.env.GEDAECHTNIS_TESTMODUS === "1",
  beispiele: Number(process.env.GEDAECHTNIS_BEISPIELE ?? 8),
};

const speicher = new Speicher(KONFIG.db);
const klassifizierer = new Klassifizierer({ modell: KONFIG.modell, effort: KONFIG.effort, testmodus: KONFIG.testmodus });

function antwort(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(text) });
  res.end(text);
}

function erlaubt(req) {
  if (!KONFIG.geheimnis) return req.socket.remoteAddress === "127.0.0.1" || req.socket.remoteAddress === "::1" || req.socket.remoteAddress === "::ffff:127.0.0.1";
  const kopf = req.headers["x-seil-secret"];
  if (typeof kopf !== "string" || kopf.length !== KONFIG.geheimnis.length) return false;
  return timingSafeEqual(Buffer.from(kopf), Buffer.from(KONFIG.geheimnis));
}

async function body(req) {
  const teile = [];
  let groesse = 0;
  for await (const chunk of req) {
    groesse += chunk.length;
    if (groesse > 2_000_000) throw new Error("Anfrage zu groß");
    teile.push(chunk);
  }
  if (teile.length === 0) return {};
  return JSON.parse(Buffer.concat(teile).toString("utf8"));
}

/** Eine Datei einordnen – Gedächtnis zuerst, dann Modell, dann Heuristik. */
async function einordnen(datei) {
  if (!datei?.dateiname) throw new Error("dateiname fehlt");
  const pfad = String(datei.pfad ?? "").replace(/^\/+|\/+$/g, "");
  speicher.laufMerken(datei.lauf, datei.auftraggeber);
  const beispiele = speicher.aehnliche(pfad, datei.dateiname, datei.auftraggeber, KONFIG.beispiele);
  const top = beispiele[0];
  let ergebnis;
  if (top && top.aehnlichkeit >= KONFIG.treffer && top.korrigiert !== null) {
    ergebnis = {
      kategorie: top.kategorie_final,
      dateiname: top.dateiname_final ?? datei.dateiname,
      konfidenz: 0.97,
      begruendung: `Fast identisch mit bestätigter Datei „${top.dateiname}“ (Ähnlichkeit ${top.aehnlichkeit}).`,
      fehlendeAngaben: [],
      geschuetzt: false,
      quelle: "gedaechtnis",
      modell: null,
    };
  } else {
    ergebnis = await klassifizierer.einordnen({ ...datei, pfad }, beispiele, speicher.aktiveRegeln(datei.auftraggeber));
  }
  const id = speicher.vorschlagSpeichern({
    lauf: datei.lauf, auftraggeber: datei.auftraggeber, pfad, dateiname: datei.dateiname,
    kategorie: ergebnis.kategorie, dateinameVorschlag: ergebnis.dateiname, konfidenz: ergebnis.konfidenz,
    quelle: ergebnis.quelle, modell: ergebnis.modell, beispieleGenutzt: beispiele.length,
  });
  return {
    vorschlagId: id,
    kategorie: ergebnis.kategorie,
    light: KATEGORIE_NAMEN.includes(ergebnis.kategorie) ? istLight(ergebnis.kategorie) : false,
    dateinameVorschlag: ergebnis.dateiname,
    konfidenz: ergebnis.konfidenz,
    pruefungNoetig: ergebnis.konfidenz < Number(process.env.GEDAECHTNIS_SCHWELLE ?? 0.95) || ergebnis.kategorie === "unklar" || ergebnis.geschuetzt === true,
    begruendung: ergebnis.begruendung,
    fehlendeAngaben: ergebnis.fehlendeAngaben ?? [],
    geschuetzt: ergebnis.geschuetzt === true,
    quelle: ergebnis.quelle,
    beispieleGenutzt: beispiele.length,
    ...(ergebnis.hinweis ? { hinweis: ergebnis.hinweis } : {}),
  };
}

import { KATEGORIEN } from "./klassifizierer.mjs";
function istLight(name) {
  return KATEGORIEN.kategorien.find((k) => k.name === name)?.light === true;
}

const server = createServer(async (req, res) => {
  const start = Date.now();
  const url = new URL(req.url ?? "/", "http://x");
  try {
    if (url.pathname === "/gesund" && req.method === "GET") {
      return antwort(res, 200, {
        ok: true,
        modell: klassifizierer.testmodus ? null : KONFIG.modell,
        testmodus: klassifizierer.testmodus,
        beispiele: speicher.kennzahlen().beispieleGesamt,
        regelnAktiv: speicher.kennzahlen().regelnAktiv,
        statistik: klassifizierer.statistik,
      });
    }
    if (!erlaubt(req)) return antwort(res, 401, { ok: false, grund: "Geheimnis fehlt oder stimmt nicht" });

    if (url.pathname === "/einordnen" && req.method === "POST") {
      return antwort(res, 200, await einordnen(await body(req)));
    }
    if (url.pathname === "/einordnen/stapel" && req.method === "POST") {
      const b = await body(req);
      const dateien = Array.isArray(b.dateien) ? b.dateien : [];
      const ergebnisse = [];
      for (const d of dateien.slice(0, 500)) {
        ergebnisse.push(await einordnen({ lauf: b.lauf, auftraggeber: b.auftraggeber, ...d }));
      }
      return antwort(res, 200, { lauf: b.lauf, anzahl: ergebnisse.length, ergebnisse });
    }
    if (url.pathname === "/bestaetigen" && req.method === "POST") {
      const b = await body(req);
      if (!b.vorschlagId || !b.kategorie) return antwort(res, 400, { ok: false, grund: "vorschlagId und kategorie sind Pflicht" });
      if (![...KATEGORIE_NAMEN, "unklar", "ausgeschlossen"].includes(b.kategorie)) return antwort(res, 400, { ok: false, grund: "Unbekannte Kategorie" });
      const r = speicher.bestaetigen(Number(b.vorschlagId), { kategorie: b.kategorie, dateiname: b.dateiname, durch: b.durch, quelle: b.quelle });
      if (!r) return antwort(res, 404, { ok: false, grund: "Vorschlag nicht gefunden" });
      return antwort(res, 200, { ok: true, ...r });
    }
    if (url.pathname === "/bestaetigen/stapel" && req.method === "POST") {
      const b = await body(req);
      const ergebnisse = [];
      for (const e of (Array.isArray(b.entscheidungen) ? b.entscheidungen : []).slice(0, 1000)) {
        const r = e.vorschlagId && e.kategorie ? speicher.bestaetigen(Number(e.vorschlagId), { kategorie: e.kategorie, dateiname: e.dateiname, durch: b.durch ?? e.durch, quelle: b.quelle ?? e.quelle }) : null;
        ergebnisse.push(r ?? { vorschlagId: e.vorschlagId, fehler: "nicht gespeichert" });
      }
      return antwort(res, 200, { ok: true, anzahl: ergebnisse.length, ergebnisse });
    }
    if (url.pathname === "/lauf/abschliessen" && req.method === "POST") {
      const b = await body(req);
      if (!b.lauf) return antwort(res, 400, { ok: false, grund: "lauf fehlt" });
      speicher.laufBeenden(b.lauf);
      return antwort(res, 200, { ok: true, lauf: b.lauf, kennzahlen: speicher.kennzahlen({ lauf: b.lauf }) });
    }
    if (url.pathname === "/kennzahlen" && req.method === "GET") {
      return antwort(res, 200, speicher.kennzahlen({ lauf: url.searchParams.get("lauf") ?? undefined, auftraggeber: url.searchParams.get("auftraggeber") ?? undefined }));
    }
    if (url.pathname === "/beispiele" && req.method === "GET") {
      return antwort(res, 200, {
        beispiele: speicher.aehnliche(url.searchParams.get("pfad") ?? "", url.searchParams.get("dateiname") ?? "", url.searchParams.get("auftraggeber") ?? undefined, 10),
      });
    }
    if (url.pathname === "/destillieren" && req.method === "POST") {
      const marke = speicher.metaLesen("destilliert_am");
      const korrekturen = speicher.korrekturenSeit(marke);
      const vorschlaege = await klassifizierer.destillieren(korrekturen, speicher.regeln("aktiv"));
      const ids = vorschlaege.map((v) => speicher.regelAnlegen({ bereich: v.bereich || "global", text: v.text, begruendung: v.begruendung, herkunft: "destillation" }));
      if (korrekturen.length > 0) speicher.metaSchreiben("destilliert_am", korrekturen[korrekturen.length - 1].bestaetigt_am);
      return antwort(res, 200, { ok: true, korrekturenGelesen: korrekturen.length, entwuerfe: ids.length, regeln: speicher.regeln("entwurf") });
    }
    if (url.pathname === "/regeln" && req.method === "GET") {
      return antwort(res, 200, { regeln: speicher.regeln(url.searchParams.get("status") ?? undefined) });
    }
    if (url.pathname === "/regeln" && req.method === "POST") {
      const b = await body(req);
      if (!b.text) return antwort(res, 400, { ok: false, grund: "text fehlt" });
      const id = speicher.regelAnlegen({ bereich: b.bereich || "global", text: b.text, begruendung: b.begruendung, herkunft: "hand", status: b.status === "aktiv" ? "aktiv" : "entwurf" });
      return antwort(res, 200, { ok: true, id });
    }
    const entscheidung = /^\/regeln\/(\d+)$/.exec(url.pathname);
    if (entscheidung && req.method === "POST") {
      const b = await body(req);
      if (!["aktiv", "verworfen", "entwurf"].includes(b.status)) return antwort(res, 400, { ok: false, grund: "status: aktiv | verworfen | entwurf" });
      const ok = speicher.regelEntscheiden(Number(entscheidung[1]), b.status, b.durch);
      return antwort(res, ok ? 200 : 404, { ok });
    }
    return antwort(res, 404, { ok: false, grund: "Unbekannter Pfad" });
  } catch (e) {
    const grund = e instanceof Error ? e.message : "unbekannt";
    return antwort(res, grund.includes("JSON") || grund.includes("fehlt") || grund.includes("zu groß") ? 400 : 500, { ok: false, grund });
  } finally {
    // Protokoll ohne Inhalte: Methode, Pfad, Dauer.
    console.log(`${new Date().toISOString()} ${req.method} ${url.pathname} ${res.statusCode} ${Date.now() - start}ms`);
  }
});

server.listen(KONFIG.port, KONFIG.host, () => {
  console.log(
    `Gedächtnis Modul 01 bereit auf http://${KONFIG.host}:${KONFIG.port} · DB ${KONFIG.db} · ${klassifizierer.testmodus ? "TESTMODUS ohne Modell" : `Modell ${KONFIG.modell} (effort ${KONFIG.effort})`} · Geheimnis ${KONFIG.geheimnis ? "gesetzt" : "NICHT gesetzt (nur localhost)"}`,
  );
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      speicher.schliessen();
      process.exit(0);
    });
  });
}
