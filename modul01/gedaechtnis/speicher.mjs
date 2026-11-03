import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { aehnlichkeit, merkmale, merkmaleLesen } from "./merkmale.mjs";

/**
 * Der Speicher des Gedächtnisses – eine SQLite-Datei auf dem SEIL-Server.
 *
 * Gespeichert wird, was zum Lernen nötig ist und nichts darüber hinaus:
 * Pfad, Dateiname, Merkmale, Vorschlag, Bestätigung. Nie der Inhalt eines
 * Dokuments. Damit bleibt die Datei klein, kopierbar und frei von
 * Vertragsinhalten – ein Backup ist ein `cp`.
 */
export class Speicher {
  constructor(pfad) {
    mkdirSync(dirname(pfad), { recursive: true });
    this.db = new DatabaseSync(pfad);
    this.db.exec("pragma journal_mode = wal; pragma synchronous = normal; pragma foreign_keys = on;");
    this.#schema();
  }

  #schema() {
    this.db.exec(`
      create table if not exists beispiel (
        id integer primary key autoincrement,
        erstellt text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        lauf text,
        auftraggeber text,
        pfad text not null,
        dateiname text not null,
        endung text,
        tokens text not null,
        trigramme text not null,
        kategorie_vorschlag text,
        dateiname_vorschlag text,
        konfidenz real,
        quelle text not null,            -- gedaechtnis | modell | heuristik | engine
        modell text,
        beispiele_genutzt integer default 0,
        kategorie_final text,
        dateiname_final text,
        korrigiert integer,              -- null = unbestätigt, 0 = bestätigt, 1 = korrigiert
        bestaetigt_am text,
        bestaetigt_durch text,
        bestaetigung_quelle text         -- qc | auto
      );
      create index if not exists beispiel_lauf on beispiel(lauf);
      create index if not exists beispiel_auftraggeber on beispiel(auftraggeber);
      create index if not exists beispiel_final on beispiel(kategorie_final);
      create table if not exists regel (
        id integer primary key autoincrement,
        erstellt text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        bereich text not null,           -- global | <auftraggeber>
        text text not null,
        begruendung text,
        status text not null default 'entwurf',  -- entwurf | aktiv | verworfen
        herkunft text,                   -- destillation | hand
        entschieden_durch text,
        entschieden_am text
      );
      create table if not exists lauf (
        name text primary key,
        auftraggeber text,
        gestartet text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        beendet text
      );
      create table if not exists meta (
        schluessel text primary key,
        wert text
      );
    `);
  }

  laufMerken(name, auftraggeber) {
    if (!name) return;
    this.db
      .prepare("insert into lauf(name, auftraggeber) values(?, ?) on conflict(name) do update set auftraggeber = coalesce(excluded.auftraggeber, lauf.auftraggeber)")
      .run(name, auftraggeber ?? null);
  }

  laufBeenden(name) {
    this.db.prepare("update lauf set beendet = strftime('%Y-%m-%dT%H:%M:%fZ','now') where name = ?").run(name);
  }

  /** Bestätigte Beispiele, die der Datei ähneln – zuerst derselbe Auftraggeber, dann alle. */
  aehnliche(pfad, dateiname, auftraggeber, grenze = 8) {
    const m = merkmale(pfad, dateiname);
    const mich = merkmaleLesen(m);
    const kandidaten = this.db
      .prepare(
        `select id, auftraggeber, pfad, dateiname, endung, tokens, trigramme, kategorie_final, dateiname_final, korrigiert, bestaetigung_quelle
         from beispiel where kategorie_final is not null
         order by case when auftraggeber = ? then 0 else 1 end, id desc limit 6000`,
      )
      .all(auftraggeber ?? "");
    const bewertet = [];
    for (const k of kandidaten) {
      let s = aehnlichkeit(mich, merkmaleLesen(k));
      if (auftraggeber && k.auftraggeber === auftraggeber) s = Math.min(1, s + 0.05);
      if (k.korrigiert === 1) s = Math.min(1, s + 0.02); // Korrekturen sind die wertvollsten Beispiele
      if (s >= 0.2) bewertet.push({ ...k, aehnlichkeit: Math.round(s * 1000) / 1000 });
    }
    bewertet.sort((a, b) => b.aehnlichkeit - a.aehnlichkeit);
    return bewertet.slice(0, grenze);
  }

  vorschlagSpeichern(v) {
    const m = merkmale(v.pfad, v.dateiname);
    const r = this.db
      .prepare(
        `insert into beispiel(lauf, auftraggeber, pfad, dateiname, endung, tokens, trigramme, kategorie_vorschlag, dateiname_vorschlag, konfidenz, quelle, modell, beispiele_genutzt)
         values(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        v.lauf ?? null, v.auftraggeber ?? null, v.pfad, v.dateiname, m.endung, m.tokens, m.trigramme,
        v.kategorie ?? null, v.dateinameVorschlag ?? null, v.konfidenz ?? null, v.quelle, v.modell ?? null, v.beispieleGenutzt ?? 0,
      );
    return Number(r.lastInsertRowid);
  }

  bestaetigen(id, { kategorie, dateiname, durch, quelle }) {
    const alt = this.db.prepare("select kategorie_vorschlag from beispiel where id = ?").get(id);
    if (!alt) return null;
    const korrigiert = alt.kategorie_vorschlag && kategorie && alt.kategorie_vorschlag !== kategorie ? 1 : 0;
    this.db
      .prepare(
        `update beispiel set kategorie_final = ?, dateiname_final = ?, korrigiert = ?, bestaetigt_am = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
         bestaetigt_durch = ?, bestaetigung_quelle = ? where id = ?`,
      )
      .run(kategorie, dateiname ?? null, korrigiert, durch ?? null, quelle ?? "qc", id);
    return { id, korrigiert: korrigiert === 1, vorher: alt.kategorie_vorschlag, nachher: kategorie };
  }

  aktiveRegeln(auftraggeber) {
    return this.db
      .prepare("select id, bereich, text from regel where status = 'aktiv' and (bereich = 'global' or bereich = ?) order by bereich = 'global' desc, id")
      .all(auftraggeber ?? "");
  }

  regeln(status) {
    return status
      ? this.db.prepare("select * from regel where status = ? order by id desc").all(status)
      : this.db.prepare("select * from regel order by id desc").all();
  }

  regelAnlegen({ bereich, text, begruendung, herkunft, status = "entwurf" }) {
    const r = this.db
      .prepare("insert into regel(bereich, text, begruendung, herkunft, status) values(?,?,?,?,?)")
      .run(bereich ?? "global", text, begruendung ?? null, herkunft ?? "destillation", status);
    return Number(r.lastInsertRowid);
  }

  regelEntscheiden(id, status, durch) {
    const r = this.db
      .prepare("update regel set status = ?, entschieden_durch = ?, entschieden_am = strftime('%Y-%m-%dT%H:%M:%fZ','now') where id = ?")
      .run(status, durch ?? null, id);
    return r.changes > 0;
  }

  /** Korrekturen seit der letzten Destillation – das Rohmaterial für neue Regeln. */
  korrekturenSeit(marke, grenze = 200) {
    return this.db
      .prepare(
        `select id, auftraggeber, pfad, dateiname, kategorie_vorschlag, kategorie_final, dateiname_vorschlag, dateiname_final, bestaetigt_am
         from beispiel where korrigiert = 1 and bestaetigt_am > ? order by bestaetigt_am asc limit ?`,
      )
      .all(marke ?? "", grenze);
  }

  metaLesen(schluessel) {
    return this.db.prepare("select wert from meta where schluessel = ?").get(schluessel)?.wert ?? null;
  }

  metaSchreiben(schluessel, wert) {
    this.db.prepare("insert into meta(schluessel, wert) values(?,?) on conflict(schluessel) do update set wert = excluded.wert").run(schluessel, wert);
  }

  /** Die drei Zahlen aus der Abnahme (A4) plus Kalibrierung und Lernkurve. */
  kennzahlen({ lauf, auftraggeber } = {}) {
    const wo = [];
    const p = [];
    if (lauf) { wo.push("lauf = ?"); p.push(lauf); }
    if (auftraggeber) { wo.push("auftraggeber = ?"); p.push(auftraggeber); }
    const filter = wo.length ? `where ${wo.join(" and ")}` : "";
    const z = this.db
      .prepare(
        `select count(*) as gesamt,
                sum(case when quelle = 'gedaechtnis' then 1 else 0 end) as aus_gedaechtnis,
                sum(case when quelle = 'modell' then 1 else 0 end) as aus_modell,
                sum(case when quelle = 'heuristik' then 1 else 0 end) as aus_heuristik,
                sum(case when quelle = 'engine' then 1 else 0 end) as aus_engine,
                sum(case when korrigiert is not null then 1 else 0 end) as bestaetigt,
                sum(case when korrigiert = 1 then 1 else 0 end) as korrigiert,
                avg(konfidenz) as konfidenz_mittel
         from beispiel ${filter}`,
      )
      .get(...p);
    const kalibrierung = this.db
      .prepare(
        `select case when konfidenz >= 0.95 then '0.95-1' when konfidenz >= 0.85 then '0.85-0.95' when konfidenz >= 0.7 then '0.7-0.85' when konfidenz >= 0.5 then '0.5-0.7' else '<0.5' end as korb,
                count(*) as n, sum(case when korrigiert = 0 then 1 else 0 end) as richtig, sum(case when korrigiert = 1 then 1 else 0 end) as falsch
         from beispiel ${filter ? filter + " and" : "where"} korrigiert is not null group by korb order by korb desc`,
      )
      .all(...p);
    const lernkurve = this.db
      .prepare(
        `select b.lauf, min(b.erstellt) as begonnen, count(*) as dateien,
                sum(case when b.korrigiert is not null then 1 else 0 end) as bestaetigt,
                sum(case when b.korrigiert = 1 then 1 else 0 end) as korrigiert,
                sum(case when b.quelle = 'gedaechtnis' then 1 else 0 end) as aus_gedaechtnis
         from beispiel b where b.lauf is not null ${auftraggeber ? "and b.auftraggeber = ?" : ""}
         group by b.lauf order by begonnen asc limit 100`,
      )
      .all(...(auftraggeber ? [auftraggeber] : []))
      .map((l) => ({ ...l, trefferquote: l.bestaetigt ? Math.round(((l.bestaetigt - l.korrigiert) / l.bestaetigt) * 1000) / 1000 : null }));
    const bestaetigt = Number(z.bestaetigt ?? 0);
    const korrigiert = Number(z.korrigiert ?? 0);
    return {
      gesamt: Number(z.gesamt ?? 0),
      ausGedaechtnis: Number(z.aus_gedaechtnis ?? 0),
      ausModell: Number(z.aus_modell ?? 0),
      ausHeuristik: Number(z.aus_heuristik ?? 0),
      ausEngine: Number(z.aus_engine ?? 0),
      bestaetigt,
      korrigiert,
      trefferquote: bestaetigt ? Math.round(((bestaetigt - korrigiert) / bestaetigt) * 1000) / 1000 : null,
      konfidenzMittel: z.konfidenz_mittel === null ? null : Math.round(Number(z.konfidenz_mittel) * 1000) / 1000,
      kalibrierung,
      lernkurve,
      beispieleGesamt: Number(this.db.prepare("select count(*) as n from beispiel where kategorie_final is not null").get().n),
      regelnAktiv: Number(this.db.prepare("select count(*) as n from regel where status = 'aktiv'").get().n),
    };
  }

  schliessen() {
    this.db.close();
  }
}
