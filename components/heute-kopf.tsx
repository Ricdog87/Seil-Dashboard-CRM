"use client";

import { mitarbeiterVon } from "@/lib/derive";
import { useSitzung } from "./sitzung";

/** Persönlicher Einstieg in den Arbeitstag – folgt dem „Arbeiten als“-Umschalter. */
export function HeuteKopf() {
  const { mitarbeiterId } = useSitzung();
  const ich = mitarbeiterVon(mitarbeiterId);
  const vorname = ich?.name.split(" ")[0] ?? "";

  return (
    <div className="mb-6">
      <h1 className="text-title text-seil-text">Guten Morgen, {vorname}</h1>
      <p className="mt-1 max-w-[70ch] text-seil-muted">
        Dienstag, 18.08.2026 – Signale, Aufgaben und alle laufenden Transaktionen auf einen Blick.
      </p>
    </div>
  );
}
