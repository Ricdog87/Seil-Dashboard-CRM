"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LiveInvestoren } from "@/app/api/investoren/route";
import type { Modul01Stand } from "@/lib/modul01";

/**
 * Echte Zahlen, ganz oben. Alles hier kommt bei jedem Aufruf frisch aus
 * OneDrive: die Datenräume über Modul 01, die Investoren über die Liveliste.
 * Nichts davon ist Demo, nichts davon wird zwischengespeichert.
 */
export function LiveBand() {
  const [dr, setDr] = useState<Modul01Stand | null>(null);
  const [inv, setInv] = useState<LiveInvestoren | null>(null);

  useEffect(() => {
    fetch("/api/modul01/status", { cache: "no-store" })
      .then((r) => r.json())
      .then(setDr)
      .catch(() => setDr(null));
    fetch("/api/investoren", { cache: "no-store" })
      .then((r) => r.json())
      .then(setInv)
      .catch(() => setInv(null));
  }, []);

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
        <span className="text-kicker text-seil-muted">
          {live
            ? `Stand ${dr?.stand ? new Date(dr.stand).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "jetzt"} · Modul 01 und Investoren-Liveliste`
            : (dr?.grund ?? "Verbindung wird aufgebaut")}
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
        Darunter stehen noch Beispieldaten für Mandate und Aufgaben.{" "}
        <Link href="/investoren" className="text-seil-accent hover:underline">
          Die Investorenliste
        </Link>{" "}
        ist bereits vollständig live.
      </p>
    </section>
  );
}
