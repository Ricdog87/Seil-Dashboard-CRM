"use client";

import { useEffect, useState } from "react";
import { mitarbeiterVon } from "@/lib/derive";
import { useSitzung } from "./sitzung";

/** Frankfurter Stunde – für die tageszeitabhängige Begrüßung.
 *  Über formatToParts, weil de-DE die Stunde sonst als „7 Uhr“ liefert. */
function frankfurterStunde(): number {
  const teil = new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Europe/Berlin",
  })
    .formatToParts(new Date())
    .find((p) => p.type === "hour");
  return parseInt(teil?.value ?? "12", 10);
}

/**
 * Persönlicher Einstieg in den Arbeitstag – folgt dem „Arbeiten als“-Umschalter.
 * Die Begrüßung richtet sich live nach der Frankfurter Uhrzeit; das Datum bleibt
 * bewusst der fixe Demo-Referenztag (siehe ANNAHMEN.md, Referenzdatum).
 */
export function HeuteKopf({ untertitel }: { untertitel?: string }) {
  const { mitarbeiterId } = useSitzung();
  const ich = mitarbeiterVon(mitarbeiterId);
  const vorname = ich?.name.split(" ")[0] ?? "";

  const [stunde, setStunde] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setStunde(frankfurterStunde());
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);

  const gruss =
    stunde === null
      ? "Guten Tag"
      : stunde < 5
        ? "Guten Abend"
        : stunde < 11
          ? "Guten Morgen"
          : stunde < 18
            ? "Guten Tag"
            : "Guten Abend";

  return (
    <div className="mb-6">
      <h1 className="text-title text-seil-text">
        {gruss}, <span className="text-seil-accent">{vorname}</span>
      </h1>
      <p className="mt-1 max-w-[70ch] text-seil-muted">
        {untertitel ??
          "Montag, 31.08.2026 – Signale, Aufgaben und alle laufenden Transaktionen auf einen Blick."}
      </p>
    </div>
  );
}
