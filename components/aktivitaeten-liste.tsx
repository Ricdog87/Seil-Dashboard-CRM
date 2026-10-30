"use client";

import { useEffect, useState } from "react";
import { NAMEN } from "@/lib/sitzung-token";
import { fmtZeitpunkt, type AktivitaetArt } from "@/lib/mandat";
import type { Aktivitaetenliste } from "@/app/api/aktivitaeten/route";

const artLabel: Record<AktivitaetArt, string> = {
  mandat: "Mandat",
  schritt: "Schritt",
  kontakt: "Kontakt",
  versand: "Versand",
  freigabe: "Freigabe",
  aufgabe: "Aufgabe",
  notiz: "Notiz",
  datenraum: "Datenraum",
};

/** Die Spur. Ein CRM ohne Historie ist eine Tabelle. */
export function AktivitaetenListe({ mandat, grenze = 30 }: { mandat?: string; grenze?: number }) {
  const [stand, setStand] = useState<Aktivitaetenliste | null>(null);

  useEffect(() => {
    const q = new URLSearchParams({ limit: String(grenze) });
    if (mandat) q.set("mandat", mandat);
    fetch(`/api/aktivitaeten?${q}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<Aktivitaetenliste>)
      .then(setStand)
      .catch(() => undefined);
  }, [mandat, grenze]);

  const eintraege = stand?.aktivitaeten ?? [];

  return (
    <section className="mt-5">
      <h2 className="mb-2 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
        Verlauf
      </h2>
      <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card">
        {eintraege.length === 0 ? (
          <p className="px-4 py-3 text-body text-seil-muted">
            {stand?.modus === "live" ? "Noch nichts passiert." : (stand?.grund ?? "wird geladen …")}
          </p>
        ) : (
          <ul>
            {eintraege.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-seil-line px-4 py-2 last:border-0"
              >
                <span className="w-20 shrink-0 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
                  {artLabel[a.art]}
                </span>
                <span className="min-w-[12rem] flex-1 text-body text-seil-text">{a.text}</span>
                <span className="text-kicker text-seil-muted">
                  {(a.durch ? (NAMEN[a.durch] ?? a.durch) : "Automatik") + " · " + fmtZeitpunkt(a.erstellt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
