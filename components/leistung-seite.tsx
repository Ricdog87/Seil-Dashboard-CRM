"use client";

import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/aufgabe-zeile";
import { Balken, KpiKachel } from "@/components/leistung-persoenlich";
import {
  KPI_ARTEN, KPI_META, aktuellerZeitraum, erreichung, fmtEur, fmtKpi, type KpiArt, type Leistung, type PersonLeistung,
} from "@/lib/leistung";

/**
 * Leistung – die ganze Seite.
 *
 * Für die Geschäftsführung die wirtschaftliche Sicht: Umsatz gegen Ziel,
 * Pipeline gewichtet und ungewichtet, Forecast, das Team im Vergleich, und
 * die Ziele zum Setzen. Für alle anderen die eigene Sicht, groß, mit dem Team
 * als Summe darunter – Teamzahlen tragen, Einzelvergleiche ohne Kontext machen
 * klein.
 */
export function LeistungSeite({ kuerzel }: { kuerzel: string }) {
  const [artZeitraum, setArtZeitraum] = useState<"monat" | "quartal" | "jahr">("quartal");
  const [stand, setStand] = useState<Leistung | null>(null);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const zeitraum = aktuellerZeitraum(artZeitraum);

  const holen = useCallback(async () => {
    try {
      const r = await fetch(`/api/leistung?zeitraum=${encodeURIComponent(zeitraum)}`, { cache: "no-store" });
      setStand((await r.json()) as Leistung);
    } catch {
      // naechster Versuch
    }
  }, [zeitraum]);

  useEffect(() => { void holen(); }, [holen]);

  async function zielSetzen(k: string | null, art: KpiArt, wert: number) {
    setFehler(null);
    try {
      const r = await fetch("/api/leistung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kuerzel: k, zeitraum, art, wert }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
      await holen();
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
    }
  }

  if (!stand) return <p className="text-body text-seil-muted">lädt …</p>;
  if (stand.modus !== "live") {
    return <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4 text-body text-seil-muted">{stand.grund}</div>;
  }

  const ich = stand.personen.find((p) => p.kuerzel === kuerzel.toLowerCase());
  const team = stand.team;
  const anteil = stand.zeitAnteil;
  const forecast = team.ist.umsatz + team.pipelineGewichtet;

  const Segment = (
    <div className="inline-flex rounded-seil border border-seil-line bg-seil-surface p-0.5 text-kicker">
      {(["monat", "quartal", "jahr"] as const).map((a) => (
        <button key={a} type="button" onClick={() => setArtZeitraum(a)} className={`rounded-seil px-3 py-1 ${artZeitraum === a ? "bg-seil-card-alt text-seil-text" : "text-seil-muted hover:text-seil-text"}`}>
          {a === "monat" ? "Monat" : a === "quartal" ? "Quartal" : "Jahr"}
        </button>
      ))}
    </div>
  );

  const ZielFeld = ({ p, art }: { p: PersonLeistung; art: KpiArt }) => (
    <input
      type="number"
      min={0}
      defaultValue={p.ziel[art] ?? ""}
      onBlur={(e) => {
        const w = e.target.value === "" ? null : Number(e.target.value);
        if (w !== null && w !== (p.ziel[art] ?? null)) void zielSetzen(p.kuerzel, art, w);
      }}
      placeholder="—"
      className="w-24 rounded-seil border border-seil-line bg-seil-surface px-2 py-0.5 text-right text-kicker tabular-nums text-seil-text placeholder:text-seil-muted"
      aria-label={`Ziel ${KPI_META[art].label} für ${p.name}`}
    />
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {Segment}
        <span className="text-kicker text-seil-muted">
          {stand.zeitraumLabel} · {Math.round(anteil * 100)} % vorbei
        </span>
      </div>

      {fehler ? <p className="mb-3 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">{fehler}</p> : null}

      {/* Wirtschaftliche Sicht – nur Geschäftsführung */}
      {stand.darfAlles ? (
        <section className="mb-6">
          <h2 className="mb-2 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Wirtschaftliche Lage · Team</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card px-4 py-3">
              <div className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Umsatz realisiert</div>
              <div className="mt-1 text-display tabular-nums text-seil-text">{fmtEur(team.ist.umsatz)}</div>
              <div className="mt-1 text-kicker text-seil-muted">{team.ziel.umsatz ? `Ziel ${fmtEur(team.ziel.umsatz)} · ${erreichung(team.ist.umsatz, team.ziel.umsatz)} %` : "kein Teamziel gesetzt"}</div>
              <div className="mt-2"><Balken ist={team.ist.umsatz} ziel={team.ziel.umsatz} anteil={anteil} ton="bg-seil-success" /></div>
            </div>
            <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card px-4 py-3">
              <div className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Pipeline gewichtet</div>
              <div className="mt-1 text-display tabular-nums text-seil-text">{fmtEur(team.pipelineGewichtet)}</div>
              <div className="mt-1 text-kicker text-seil-muted">ungewichtet {fmtEur(team.pipelineWert)} · {team.aktiveMandate} aktive Mandate</div>
            </div>
            <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card px-4 py-3">
              <div className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Forecast</div>
              <div className="mt-1 text-display tabular-nums text-seil-text">{fmtEur(forecast)}</div>
              <div className="mt-1 text-kicker text-seil-muted">realisiert + Pipeline gewichtet{team.ziel.umsatz ? ` · ${Math.round((forecast / team.ziel.umsatz) * 100)} % vom Ziel` : ""}</div>
            </div>
            <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card px-4 py-3">
              <div className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Abschlüsse</div>
              <div className="mt-1 text-display tabular-nums text-seil-text">{team.ist.abschluesse}</div>
              <div className="mt-1 text-kicker text-seil-muted">{team.ziel.abschluesse ? `von ${team.ziel.abschluesse} geplant` : `${team.ist.mandate} neue Mandate`}</div>
            </div>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-seil-muted">
            Gewichtung nach Phase: Mandat & Bewertung 10 %, Vorbereitung 25 %, Vermarktung 50 %, Angebote 75 %, Abschluss 100 %. Umsatz zählt am Abschlusstag mit dem realisierten Honorar.
          </p>
        </section>
      ) : null}

      {/* Die eigene Sicht */}
      {ich ? (
        <section className="mb-6">
          <h2 className="mb-2 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">{stand.darfAlles ? `Mein Stand · ${ich.name}` : `Mein Stand`}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {KPI_ARTEN.map((art) => <KpiKachel key={art} art={art} p={ich} anteil={anteil} gross />)}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 text-kicker text-seil-muted">
            <span>Meine Pipeline gewichtet <span className="tabular-nums text-seil-text">{fmtEur(ich.pipelineGewichtet)}</span></span>
            <span>{ich.aktiveMandate} aktive Mandate</span>
          </div>
        </section>
      ) : null}

      {/* Team */}
      <section>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">{stand.darfAlles ? "Team im Vergleich" : "Das Team zusammen"}</h2>
          {stand.darfAlles ? (
            <button type="button" onClick={() => setBearbeiten((x) => !x)} className="rounded-seil border border-seil-line px-2 py-0.5 text-kicker text-seil-body hover:border-seil-accent hover:text-seil-accent">
              {bearbeiten ? "Ziele fertig" : "Ziele setzen"}
            </button>
          ) : null}
        </div>
        <div className="overflow-x-auto rounded-[var(--seil-radius)] border border-seil-line">
          <table className="w-full min-w-[820px] border-collapse text-body">
            <thead>
              <tr className="bg-seil-surface text-left text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
                <th className="px-3 py-2 font-medium">{stand.darfAlles ? "Person" : ""}</th>
                {KPI_ARTEN.map((art) => <th key={art} className="px-3 py-2 text-right font-medium">{KPI_META[art].label}</th>)}
                <th className="px-3 py-2 text-right font-medium">Pipeline gew.</th>
              </tr>
            </thead>
            <tbody>
              {(stand.darfAlles ? [...stand.personen, team] : [team]).map((p) => (
                <tr key={p.kuerzel ?? "team"} className={`border-t border-seil-line ${p.kuerzel === null ? "bg-seil-surface font-medium" : "hover:bg-seil-card-alt"}`}>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-seil-text">
                      {p.kuerzel ? <Avatar kuerzel={p.kuerzel} /> : null}
                      {p.name}
                    </span>
                  </td>
                  {KPI_ARTEN.map((art) => {
                    const pr = erreichung(p.ist[art], p.ziel[art]);
                    return (
                      <td key={art} className="px-3 py-2 text-right">
                        <div className="tabular-nums text-seil-text">{fmtKpi(art, p.ist[art])}</div>
                        {bearbeiten && stand.darfAlles ? (
                          <div className="mt-1 flex justify-end"><ZielFeld p={p} art={art} /></div>
                        ) : p.ziel[art] ? (
                          <div className={`text-kicker tabular-nums ${pr !== null && pr >= 100 ? "text-seil-success" : pr !== null && pr >= anteil * 100 ? "text-seil-accent" : "text-seil-muted"}`}>
                            / {fmtKpi(art, p.ziel[art] ?? 0)} · {pr} %
                          </div>
                        ) : (
                          <div className="text-kicker text-seil-muted">kein Ziel</div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right tabular-nums text-seil-body">{fmtEur(p.pipelineGewichtet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-kicker leading-relaxed text-seil-muted">
          {stand.darfAlles
            ? "Ziele gelten je Zeitraum. Fehlt ein Teamziel, zählt die Summe der Einzelziele. Woher jede Zahl kommt, steht beim Überfahren der Spalte."
            : "Du siehst deine Zahlen und das Team als Summe. Einzelvergleiche sieht die Geschäftsführung."}
        </p>
      </section>
    </>
  );
}
