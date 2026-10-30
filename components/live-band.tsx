"use client";

import Link from "next/link";
import { useLive, uhrzeit } from "@/components/live-abruf";
import type { LiveInvestoren } from "@/app/api/investoren/route";
import type { Modul01Stand } from "@/lib/modul01";

/**
 * Echte Zahlen, ganz oben. Alles hier kommt bei jedem Aufruf frisch aus
 * OneDrive: die Datenräume über Modul 01, die Investoren über die Liveliste.
 * Nichts davon ist Demo, nichts davon wird zwischengespeichert.
 */
export function LiveBand() {
  const { daten: dr, abgerufen, laeuft, holen } = useLive<Modul01Stand>("/api/modul01/status", 15000);
  const { daten: inv } = useLive<LiveInvestoren>("/api/investoren", 60000);

  const raeume = dr ? [...Object.values(dr.objekte ?? {}), ...(dr.unbekannt ?? [])] : [];
  const dokumente = raeume.reduce((n, o) => n + (o.dokumente?.length ?? 0), 0);
  const live = dr?.modus === "live";

  const Kachel = ({ wert, label, sub }: { wert: string; label: string; sub?: string }) => (
    <div className="min-w-0 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card px-4 py-3">
      <div className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">{label}</div>
      <div className="mt-1 text-display tabular-nums text-seil-text">{wert}</div>
      {sub ? <div className="mt-1 text-kicker text-seil-muted">{sub}</div> : null}
    </div>
  );

  return (
    <section className="mb-5 rounded-[var(--seil-radius)] border border-seil-accent/40 bg-seil-accent-bg p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-accent">
          Live aus OneDrive
        </h2>
        <span className="inline-flex items-center gap-2 text-kicker text-seil-muted">
          {live ? `aktualisiert ${uhrzeit(abgerufen)} · alle 15 s` : (dr?.grund ?? "Verbindung wird aufgebaut")}
          <button
            type="button"
            onClick={() => void holen()}
            className="rounded-seil border border-seil-line px-2 py-0.5 text-kicker text-seil-body hover:border-seil-accent hover:text-seil-accent"
          >
            {laeuft ? "lädt" : "jetzt"}
          </button>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kachel wert={live ? String(raeume.length) : "—"} label="Datenräume" sub="aus Modul 01" />
        <Kachel wert={live ? String(dokumente) : "—"} label="offene Prüffälle" sub="warten auf das Team" />
        <Kachel
          wert={inv?.modus === "live" ? String(inv.gesamt ?? inv.investoren.length) : "—"}
          label="Investoren"
          sub="in der Liveliste"
        />
        <Kachel wert={live ? "aktiv" : "—"} label="Automatik" sub="zehn Abläufe scharf" />
      </div>
      {live && raeume.length > 0 ? (
        <ul className="mt-3 grid gap-1">
          {raeume.slice(0, 4).map((o, i) => (
            <li key={`${o.objektName}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 text-body">
              <span className="min-w-0 truncate text-seil-text">{o.objektName}</span>
              <span className="text-kicker text-seil-muted">
                {o.dokumente?.length ?? 0} Prüffälle
                {o.kennwerte?.length ? ` · ${o.kennwerte.find((k) => k.feld === "abgelegt")?.wert ?? "0"} abgelegt` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-kicker text-seil-muted">
        Den Prozess eines Mandats zeigt{" "}
        <Link href="/mandate" className="text-seil-accent hover:underline">
          die Mandatsseite
        </Link>
        , alle Investoren stehen unter{" "}
        <Link href="/investoren" className="text-seil-accent hover:underline">
          Investoren
        </Link>
        .
      </p>
    </section>
  );
}
