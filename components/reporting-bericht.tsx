"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MUSTER,
  RANKING_KRITERIEN,
  KAEUFERTYP_KURZ,
  GEBOT_STUFE_LABEL,
  type Bericht,
  type FunnelStufe,
  type TopBieter,
} from "@/lib/reporting";
import type { Reporting } from "@/app/api/reporting/route";

/**
 * Das Objekt-Reporting nach Lucas Vorlage („Reporting ‚Musterobjekt‘ – V1“).
 *
 * Ein helles Blatt – so, wie es der Verkäufer bekommt: im Cockpit als Ansicht,
 * per „Als PDF speichern“ als A4 quer. Die Musteransicht zeigt Lucas
 * Beispielzahlen, damit man sieht, wie ein voller Bericht aussieht, bevor die
 * echten Gebote und Absagegründe im CRM stehen.
 */

const zahl = (n: number) => n.toLocaleString("de-DE");
const eur = (n: number) => `${n.toLocaleString("de-DE")} EUR`;
const datum = (iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const T = {
  tinte: "text-[var(--seil-papier-tinte)]",
  text: "text-[var(--seil-papier-text)]",
  leise: "text-[var(--seil-papier-leise)]",
  linie: "border-[var(--seil-papier-linie)]",
};

export function ReportingBericht({ mandat }: { mandat: string }) {
  const [daten, setDaten] = useState<Reporting | null>(null);
  const [ansicht, setAnsicht] = useState<"live" | "muster">("live");

  useEffect(() => {
    let weg = false;
    fetch(`/api/reporting?mandat=${encodeURIComponent(mandat)}`, {
      cache: "no-store",
    })
      .then((r) => r.json() as Promise<Reporting>)
      .then((d) => {
        if (!weg) setDaten(d);
      })
      .catch(() => {
        if (!weg)
          setDaten({
            modus: "fehler",
            grund: "Reporting nicht erreichbar",
            bericht: null,
          });
      });
    return () => {
      weg = true;
    };
  }, [mandat]);

  const bericht = ansicht === "muster" ? MUSTER : (daten?.bericht ?? null);

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/mandate/${encodeURIComponent(mandat)}`}
          className="text-kicker text-seil-accent hover:underline"
        >
          ← Mandat {mandat}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Ansicht"
            className="flex rounded-seil border border-seil-line p-0.5"
          >
            {(
              [
                ["live", "Live aus dem CRM"],
                ["muster", "Musteransicht"],
              ] as const
            ).map(([wert, label]) => (
              <button
                key={wert}
                type="button"
                aria-pressed={ansicht === wert}
                onClick={() => setAnsicht(wert)}
                className={`rounded-[4px] px-3 py-1 text-kicker ${ansicht === wert ? "bg-seil-accent-bg text-seil-text" : "text-seil-muted hover:text-seil-text"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!bericht}
            onClick={() => window.print()}
            className="rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-kicker text-seil-text disabled:opacity-40"
          >
            Als PDF speichern
          </button>
        </div>
      </div>

      {bericht ? (
        <Blatt bericht={bericht} />
      ) : daten ? (
        <p className="rounded-seil border border-seil-line bg-seil-card p-4 text-body text-seil-muted">
          {daten.grund ?? "Kein Bericht"} – die Musteransicht zeigt, wie der
          Bericht aussieht.
        </p>
      ) : (
        <p className="text-body text-seil-muted">Reporting wird gerechnet …</p>
      )}

      {bericht && !bericht.muster ? (
        <Luecken bericht={bericht} mandat={mandat} />
      ) : null}
    </>
  );
}

/** Was im CRM noch fehlt, damit der Bericht vollständig ist – nur im Cockpit, nie im PDF. */
function Luecken({ bericht, mandat }: { bericht: Bericht; mandat: string }) {
  const ohneTyp =
    bericht.kaeuferprofile.find((p) => p.typ === "offen")?.anzahl ?? 0;
  const punkte = [
    bericht.kennzahlen.ansprachen === 0
      ? "Noch niemand angeschrieben – der Funnel füllt sich aus dem Verteiler des Mandats."
      : null,
    bericht.topBieter.length === 0
      ? "Noch keine Gebote erfasst – im Mandat unter „Gebote“ eintragen (Indikation, Due Diligence, SEIL-HERO)."
      : null,
    ohneTyp > 0
      ? `${zahl(ohneTyp)} aktive Interessenten ohne Käufertyp – in der Kundenakte oder im Verteiler zuordnen.`
      : null,
    bericht.ohneAbsagegrund > 0
      ? `${zahl(bericht.ohneAbsagegrund)} Absagen ohne Grund – im Verteiler nachtragen.`
      : null,
    bericht.kopf.adresse
      ? null
      : "Objektadresse fehlt – sie kommt aus dem Datenraum (Modul 01, Kennwert „Objektadresse“).",
  ].filter(Boolean) as string[];
  return (
    <section className="no-print mt-4 rounded-seil border border-seil-line bg-seil-card p-4">
      <p className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
        Woher die Zahlen kommen
      </p>
      <p className="mt-1 text-body text-seil-body">
        Ansprachen und Stufen aus dem Verteiler, Indikation · Due Diligence ·
        SEIL-HERO aus den Geboten, Käuferprofile aus dem Käufertyp der
        Kundenakte, Absagegründe aus dem Verteiler. Gerechnet bei jedem Aufruf –
        nichts wird von Hand nachgezählt.
      </p>
      {punkte.length > 0 ? (
        <ul className="mt-2 grid gap-1 text-body text-seil-body">
          {punkte.map((p) => (
            <li key={p}>· {p}</li>
          ))}
        </ul>
      ) : null}
      <Link
        href={`/mandate/${encodeURIComponent(mandat)}#gebote`}
        className="mt-2 inline-block text-kicker text-seil-accent hover:underline"
      >
        Gebote und Verteiler pflegen →
      </Link>
    </section>
  );
}

function Blatt({ bericht }: { bericht: Bericht }) {
  const { kopf, kennzahlen } = bericht;
  return (
    <article
      className={`seil-blatt rounded-seil bg-[var(--seil-papier)] p-5 sm:p-8 ${T.text}`}
    >
      {bericht.muster ? (
        <p className="mb-4 rounded-[4px] border border-[var(--seil-papier-linie)] bg-[var(--seil-papier-kachel)] px-3 py-1.5 text-[11px] text-[var(--seil-papier-text)]">
          Musteransicht mit den Zahlen aus Lucas Vorlage – keine echten Daten.
        </p>
      ) : null}

      <header
        className={`flex items-start justify-between gap-4 border-b pb-4 ${T.linie}`}
      >
        <div className="min-w-0">
          <h1 className={`text-[22px] font-semibold leading-tight ${T.tinte}`}>
            Reporting ‚{kopf.name}‘
          </h1>
          {kopf.adresse ? (
            <p className="mt-1 text-[13px]">{kopf.adresse}</p>
          ) : null}
          <p className={`mt-0.5 text-[11px] ${T.leise}`}>
            Stand {datum(kopf.stand)}
          </p>
        </div>
        <div
          className={`shrink-0 text-right leading-none ${T.tinte}`}
          aria-label="SEIL Real Estate"
        >
          <div className="text-[18px] tracking-[0.22em]">SEIL</div>
          <div className={`mt-1 text-[8px] tracking-[0.3em] ${T.leise}`}>
            REAL ESTATE
          </div>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {(
          [
            [kennzahlen.ansprachen, "Ansprachen"],
            [kennzahlen.aktiv, "Aktiv im Prozess"],
            [kennzahlen.indikativ, "Indikative Angebote erhalten"],
            [kennzahlen.hero, "SEIL-HERO Angebote"],
          ] as const
        ).map(([wert, label]) => (
          <div
            key={label}
            className={`rounded-[6px] border bg-[var(--seil-papier-kachel)] px-4 py-3 ${T.linie}`}
          >
            <div
              className={`text-[26px] font-semibold leading-none ${T.tinte}`}
            >
              {zahl(wert)}
            </div>
            <div
              className={`mt-2 text-[9px] uppercase tracking-[0.14em] ${T.leise}`}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-5">
        <h2 className={`text-[13px] font-semibold ${T.tinte}`}>Deal-Funnel</h2>
        <Funnel stufen={bericht.funnel} />
      </section>

      <div
        className={`mt-4 grid gap-6 border-t pt-4 lg:grid-cols-[1fr_1.45fr_1fr] lg:gap-8 ${T.linie}`}
      >
        <Kaeuferprofile bericht={bericht} />
        <TopBieterTabelle bieter={bericht.topBieter} />
        <Absagegruende bericht={bericht} />
      </div>

      <footer
        className={`mt-5 flex flex-wrap justify-between gap-2 border-t pt-2 text-[9px] ${T.linie} ${T.leise}`}
      >
        <span>SEIL Real Estate GmbH · Transaktions-Reporting</span>
        <span>
          {kopf.name} · Stand {datum(kopf.stand)}
        </span>
      </footer>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Deal-Funnel
// ---------------------------------------------------------------------------

const FUNNEL_H = 150; // Höhe der Zeichenfläche in px
const BAND_MAX = 60; // Höhe des breitesten Bands
const AUS_Y = FUNNEL_H - 14; // Mittellinie, auf der die „ausgeschieden“-Bögen enden

/**
 * Bänder oben bündig, Höhe logarithmisch wie in Lucas Vorlage – linear wären
 * die späten Stufen bei 1.200 Ansprachen unsichtbar (1 von 1.200 = 0,05 px).
 * Die Form zeigt deshalb nur den Verlauf; die Zahl steht immer als Text
 * darüber und daneben, die Tabelle für Screenreader trägt alle Werte.
 */
function Funnel({ stufen }: { stufen: FunnelStufe[] }) {
  const [aktiv, setAktiv] = useState<number | null>(null);
  const n = stufen.length;
  const max = Math.max(1, ...stufen.map((s) => s.erreicht));
  const maxAus = Math.max(1, ...stufen.map((s) => s.ausgeschieden));
  const band = (x: number) =>
    x <= 0
      ? 0
      : Math.round(10 + (BAND_MAX - 10) * (Math.log1p(x) / Math.log1p(max)));
  const dicke = (x: number) =>
    x <= 0 ? 0 : Math.round(3 + 11 * (Math.log1p(x) / Math.log1p(maxAus)));
  const W = 1000 / n;
  const spalten = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };

  return (
    <div className="relative mt-3">
      <div className="overflow-x-auto">
        <div className="min-w-[880px]">
          <div className="grid" style={spalten}>
            {stufen.map((s, i) => (
              <div
                key={s.schluessel}
                className={`pr-2 ${i === n - 1 ? "text-right" : ""}`}
              >
                <div
                  className={`text-[24px] font-semibold leading-none ${T.tinte}`}
                >
                  {zahl(s.erreicht)}
                </div>
                <div
                  className={`mt-1.5 text-[9px] uppercase tracking-[0.14em] ${T.tinte}`}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-2" style={{ height: FUNNEL_H }}>
            <svg
              viewBox={`0 0 1000 ${FUNNEL_H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {stufen.map((s, i) => {
                const x0 = i * W;
                const h = band(s.erreicht);
                const t = dicke(s.ausgeschieden);
                const y1 = h + 3 + t / 2;
                const xe = x0 + (i === n - 1 ? 0.45 : 0.6) * W;
                const hervor = aktiv === null || aktiv === i;
                return (
                  <g key={s.schluessel} opacity={hervor ? 1 : 0.45}>
                    {h > 0 ? (
                      <rect
                        x={x0}
                        y={0}
                        width={W}
                        height={h}
                        fill="var(--seil-daten-band)"
                      />
                    ) : null}
                    {t > 0 ? (
                      <path
                        d={`M ${x0} ${y1} C ${x0 + 0.3 * W} ${y1}, ${x0 + 0.3 * W} ${AUS_Y}, ${xe} ${AUS_Y}`}
                        fill="none"
                        stroke="var(--seil-daten-aus)"
                        strokeWidth={t}
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : null}
                    {s.offen > 0 && h > 0 ? (
                      <rect
                        x={x0}
                        y={h - 4}
                        width={0.4 * W}
                        height={4}
                        rx={0}
                        fill="var(--seil-daten-stark)"
                      />
                    ) : null}
                    {h > 0 ? (
                      <line
                        x1={x0}
                        x2={x0}
                        y1={0}
                        y2={h + 2}
                        stroke="var(--seil-papier-tinte)"
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : null}
                  </g>
                );
              })}
            </svg>

            {/* Beschriftung und Trefferflächen in HTML – Text verzerrt nicht und bleibt auswählbar. */}
            <div className="absolute inset-0 grid" style={spalten}>
              {stufen.map((s, i) => {
                const h = band(s.erreicht);
                const letzte = i === n - 1;
                const weiter = i + 1 < n ? stufen[i + 1].erreicht : 0;
                const text = `${s.label}: ${zahl(s.erreicht)} erreicht · ${zahl(s.offen)} noch offen · ${zahl(s.ausgeschieden)} ausgeschieden${i + 1 < n ? ` · ${zahl(weiter)} weiter` : ""}`;
                return (
                  <div
                    key={s.schluessel}
                    tabIndex={0}
                    aria-label={text}
                    onMouseEnter={() => setAktiv(i)}
                    onMouseLeave={() => setAktiv(null)}
                    onFocus={() => setAktiv(i)}
                    onBlur={() => setAktiv(null)}
                    className="relative outline-none"
                  >
                    {s.offen > 0 && h > 0 ? (
                      <span
                        className="absolute whitespace-nowrap text-[10px] font-semibold text-[var(--seil-papier-tinte)]"
                        style={{
                          left: "42%",
                          top: h - 2,
                          transform: "translateY(-50%)",
                        }}
                      >
                        {zahl(s.offen)} noch offen
                      </span>
                    ) : null}
                    {s.ausgeschieden > 0 ? (
                      <span
                        className={`absolute whitespace-nowrap text-[10px] ${T.leise}`}
                        style={{
                          ...(letzte ? { right: 0 } : { left: "63%" }),
                          top: AUS_Y,
                          transform: "translateY(-50%)",
                        }}
                      >
                        {zahl(s.ausgeschieden)} ausgeschieden
                      </span>
                    ) : null}
                    {aktiv === i ? (
                      <span
                        role="tooltip"
                        className={`no-print absolute z-10 w-max max-w-[220px] rounded-[4px] border bg-[var(--seil-papier)] px-2 py-1.5 text-[10px] leading-snug shadow-sm ${T.linie} ${T.text}`}
                        style={{
                          top: BAND_MAX + 8,
                          ...(letzte ? { right: 4 } : { left: 8 }),
                        }}
                      >
                        <strong className={T.tinte}>{s.label}</strong>
                        <br />
                        {zahl(s.erreicht)} erreicht · {zahl(s.offen)} noch offen
                        <br />
                        {zahl(s.ausgeschieden)} ausgeschieden
                        {i + 1 < n ? ` · ${zahl(weiter)} weiter` : ""}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="sr-only">
        <table>
          <caption>Deal-Funnel</caption>
          <thead>
            <tr>
              <th scope="col">Stufe</th>
              <th scope="col">erreicht</th>
              <th scope="col">noch offen</th>
              <th scope="col">ausgeschieden</th>
            </tr>
          </thead>
          <tbody>
            {stufen.map((s) => (
              <tr key={s.schluessel}>
                <th scope="row">{s.label}</th>
                <td>{s.erreicht}</td>
                <td>{s.offen}</td>
                <td>{s.ausgeschieden}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Käuferprofile · Top Bieter · Absagegründe
// ---------------------------------------------------------------------------

function Ueberschrift({ titel, unter }: { titel: string; unter?: string }) {
  return (
    <div>
      <h2 className={`text-[13px] font-semibold ${T.tinte}`}>{titel}</h2>
      {unter ? (
        <p className={`mt-0.5 text-[10px] ${T.leise}`}>{unter}</p>
      ) : null}
    </div>
  );
}

function Leer({ children }: { children: React.ReactNode }) {
  return (
    <p className={`mt-3 text-[11px] leading-relaxed ${T.leise}`}>{children}</p>
  );
}

function Kaeuferprofile({ bericht }: { bericht: Bericht }) {
  const profile = bericht.kaeuferprofile;
  const summe = profile.reduce((s, p) => s + p.anzahl, 0);
  return (
    <section>
      <Ueberschrift
        titel="Käuferprofile"
        unter="Anteil der aktiven Interessenten"
      />
      {summe === 0 ? (
        <Leer>Noch keine aktiven Interessenten.</Leer>
      ) : (
        profile.map((p) => {
          const prozent = Math.round(p.anteil * 100);
          return (
            <div
              key={p.typ}
              className="mt-3 grid grid-cols-[1fr_auto] items-end gap-x-4"
              title={`${p.label}: ${zahl(p.anzahl)} aktiv · ${prozent} %`}
            >
              <div className="min-w-0">
                <div className={`text-[11px] ${T.tinte}`}>{p.label}</div>
                <div className="mt-1.5 h-2.5 rounded-[4px] bg-[var(--seil-daten-spur)]">
                  <div
                    className="h-full rounded-[4px]"
                    style={{
                      width: `${Math.max(p.anzahl > 0 ? 2 : 0, p.anteil * 100)}%`,
                      background:
                        p.typ === "offen"
                          ? "var(--seil-daten-aus)"
                          : "var(--seil-daten-stark)",
                    }}
                  />
                </div>
              </div>
              <div className="text-right leading-tight">
                <div className={`text-[14px] font-semibold ${T.tinte}`}>
                  {prozent} %
                </div>
                <div className={`text-[9px] ${T.leise}`}>
                  {zahl(p.anzahl)} aktiv
                </div>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}

function Sterne({ b }: { b: TopBieter }) {
  const erfuellt = RANKING_KRITERIEN.map(
    (k) => `${k.label} ${b.kriterien[k.feld] ? "✓" : "–"}`,
  ).join(" · ");
  return (
    <span
      className="whitespace-nowrap text-[11px] tracking-[0.05em]"
      role="img"
      aria-label={`${b.sterne} von 5 Kriterien: ${erfuellt}`}
      title={erfuellt}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            color: i < b.sterne ? "var(--seil-stern)" : "var(--seil-daten-aus)",
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function TopBieterTabelle({ bieter }: { bieter: TopBieter[] }) {
  return (
    <section>
      <div className="flex items-end justify-between gap-2">
        <Ueberschrift titel="Top Bieter" />
        {bieter.length > 0 ? (
          <div
            className={`flex gap-6 pr-1 text-[8px] uppercase tracking-[0.14em] ${T.leise}`}
          >
            <span className="w-[62px] text-center">Ranking</span>
            <span className="w-[28px] text-center">Hero</span>
          </div>
        ) : null}
      </div>
      {bieter.length === 0 ? (
        <Leer>
          Noch keine Gebote erfasst. Sobald im Mandat Gebote eingetragen sind,
          stehen hier die fünf besten – sortiert nach erfüllten Kriterien, dann
          nach Betrag.
        </Leer>
      ) : (
        <ol className="mt-2">
          {bieter.map((b, i) => (
            <li
              key={b.investorId}
              className={`flex items-center gap-3 border-b py-1.5 last:border-b-0 ${T.linie}`}
              title={GEBOT_STUFE_LABEL[b.stufe]}
            >
              <span className={`w-5 text-[10px] ${T.leise}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-[12px] font-semibold ${T.tinte}`}
                >
                  {b.firma}
                </div>
                <div className={`text-[10px] ${T.leise}`}>
                  {b.kaeufertyp
                    ? KAEUFERTYP_KURZ[b.kaeufertyp]
                    : "Käufertyp offen"}
                  <span className={`ml-3 ${T.text}`}>
                    {b.betrag !== null ? eur(b.betrag) : "ohne Betrag"}
                  </span>
                </div>
              </div>
              <span className="w-[62px] text-center">
                <Sterne b={b} />
              </span>
              <span
                className={`w-[28px] text-center text-[12px] ${b.hero ? T.tinte : T.leise}`}
                aria-label={b.hero ? "SEIL-HERO-Angebot" : "kein HERO-Angebot"}
              >
                {b.hero ? "✓" : "–"}
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className={`mt-2 text-[8.5px] leading-relaxed ${T.leise}`}>
        Ranking-Kriterien ={" "}
        {RANKING_KRITERIEN.map((k, i) => (
          <span key={k.feld}>
            {i > 0 ? (
              <span style={{ color: "var(--seil-stern)" }}> ★ </span>
            ) : null}
            {k.label}
          </span>
        ))}
      </p>
    </section>
  );
}

function Absagegruende({ bericht }: { bericht: Bericht }) {
  const liste = bericht.absagegruende.slice(0, 5);
  const max = Math.max(1, ...liste.map((a) => a.anzahl));
  return (
    <section>
      <Ueberschrift
        titel="Top Absagegründe"
        unter="Genannte Gründe ausgeschiedener Interessenten"
      />
      {liste.length === 0 ? (
        <Leer>
          Noch keine Absagegründe erfasst
          {bericht.ohneAbsagegrund > 0
            ? ` – ${zahl(bericht.ohneAbsagegrund)} Absagen ohne Grund`
            : ""}
          .
        </Leer>
      ) : (
        liste.map((a) => (
          <div
            key={a.grund}
            className="mt-3"
            title={`${a.label}: ${zahl(a.anzahl)}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className={`text-[11px] ${T.tinte}`}>{a.label}</span>
              <span className={`text-[13px] font-semibold ${T.tinte}`}>
                {zahl(a.anzahl)}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-[4px] bg-[var(--seil-daten-spur)]">
              <div
                className="h-full rounded-[4px] bg-[var(--seil-daten-mittel)]"
                style={{ width: `${(a.anzahl / max) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
      {liste.length > 0 && bericht.ohneAbsagegrund > 0 ? (
        <p className={`mt-3 text-[9px] ${T.leise}`}>
          + {zahl(bericht.ohneAbsagegrund)} Absagen ohne genannten Grund
        </p>
      ) : null}
    </section>
  );
}
