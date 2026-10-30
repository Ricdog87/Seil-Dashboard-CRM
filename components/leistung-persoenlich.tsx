"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KPI_ARTEN, KPI_META, erreichung, fmtEur, fmtKpi, motivation, type Leistung, type PersonLeistung } from "@/lib/leistung";

/**
 * Ziel gegen Ist – die eigene Zeile, oben auf der Übersicht.
 *
 * Sechs Balken, einer je Kennzahl, dazu ein Satz, der sagt, wo man steht. Der
 * graue Strich im Balken ist die Zeit: so weit ist der Zeitraum vorbei. Liegt
 * der Balken rechts davon, ist man vor dem Plan. Das sieht man, ohne zu rechnen.
 */
export function Balken({ ist, ziel, anteil, ton = "bg-seil-accent" }: { ist: number; ziel: number | undefined; anteil: number; ton?: string }) {
  const p = erreichung(ist, ziel);
  const breite = p === null ? 0 : Math.min(100, p);
  const erreicht = p !== null && p >= 100;
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-seil-line">
      <div className={`h-full rounded-full transition-all ${erreicht ? "bg-seil-success" : ton}`} style={{ width: `${breite}%` }} />
      {ziel ? (
        <div className="absolute top-0 h-full w-px bg-seil-text/60" style={{ left: `${Math.round(anteil * 100)}%` }} title={`${Math.round(anteil * 100)} % des Zeitraums vorbei`} />
      ) : null}
    </div>
  );
}

export function KpiKachel({ art, p, anteil, gross = false }: { art: (typeof KPI_ARTEN)[number]; p: PersonLeistung; anteil: number; gross?: boolean }) {
  const ist = p.ist[art];
  const ziel = p.ziel[art];
  const proz = erreichung(ist, ziel);
  const meta = KPI_META[art];
  return (
    <div className="min-w-0 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">{meta.label}</span>
        {proz !== null ? (
          <span className={`text-kicker tabular-nums ${proz >= 100 ? "text-seil-success" : proz >= anteil * 100 ? "text-seil-accent" : "text-seil-muted"}`}>{proz} %</span>
        ) : null}
      </div>
      <div className={`mt-1 flex items-baseline gap-1.5 ${gross ? "text-display" : "text-title"}`}>
        <span className="tabular-nums text-seil-text">{fmtKpi(art, ist)}</span>
        {ziel ? <span className="text-kicker text-seil-muted">/ {fmtKpi(art, ziel)}</span> : null}
      </div>
      <div className="mt-2">
        <Balken ist={ist} ziel={ziel} anteil={anteil} />
      </div>
      <div className="mt-1.5 truncate text-kicker text-seil-muted" title={motivation(art, ist, ziel, anteil)}>
        {motivation(art, ist, ziel, anteil)}
      </div>
    </div>
  );
}

export function LeistungPersoenlich({ kuerzel }: { kuerzel: string }) {
  const [stand, setStand] = useState<Leistung | null>(null);

  useEffect(() => {
    const laden = () => fetch("/api/leistung", { cache: "no-store" }).then((r) => r.json()).then(setStand).catch(() => undefined);
    laden();
    const t = setInterval(() => { if (typeof document === "undefined" || document.visibilityState === "visible") laden(); }, 60000);
    return () => clearInterval(t);
  }, []);

  if (!stand || stand.modus !== "live") return null;
  const ich = stand.personen.find((p) => p.kuerzel === kuerzel.toLowerCase());
  if (!ich) return null;
  const hatZiele = Object.values(ich.ziel).some((z) => (z ?? 0) > 0);

  return (
    <section className="rounded-[var(--seil-radius)] border border-seil-accent/40 bg-seil-accent-bg p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-accent">
          Mein Stand · {stand.zeitraumLabel}
        </h2>
        <span className="text-kicker text-seil-muted">
          {Math.round(stand.zeitAnteil * 100)} % des Zeitraums vorbei
          {stand.darfAlles ? (
            <> · <Link href="/leistung" className="text-seil-accent hover:underline">Team und Umsatz</Link></>
          ) : (
            <> · <Link href="/leistung" className="text-seil-accent hover:underline">Details</Link></>
          )}
        </span>
      </div>
      {!hatZiele ? (
        <p className="mb-3 text-kicker text-seil-muted">
          Für diesen Zeitraum sind noch keine Ziele gesetzt – die Balken zeigen deshalb nur das Ist.
          {stand.darfAlles ? " Unter Leistung lassen sie sich setzen." : ""}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {KPI_ARTEN.map((art) => (
          <KpiKachel key={art} art={art} p={ich} anteil={stand.zeitAnteil} />
        ))}
      </div>
      {stand.darfAlles ? (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-kicker text-seil-muted">
          <span>Pipeline gewichtet <span className="tabular-nums text-seil-text">{fmtEur(stand.team.pipelineGewichtet)}</span></span>
          <span>Pipeline gesamt <span className="tabular-nums text-seil-text">{fmtEur(stand.team.pipelineWert)}</span></span>
          <span>Team-Umsatz <span className="tabular-nums text-seil-text">{fmtEur(stand.team.ist.umsatz)}</span>{stand.team.ziel.umsatz ? ` von ${fmtEur(stand.team.ziel.umsatz)}` : ""}</span>
        </div>
      ) : null}
    </section>
  );
}
