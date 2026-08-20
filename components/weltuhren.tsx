"use client";

import { useEffect, useState } from "react";

/**
 * Broker-Weltuhren: Frankfurt führt (mit Sekunden), dazu die wichtigsten
 * Investoren-Zeitzonen. Läuft live – als einziges Element neben dem
 * fixen Demo-Referenzdatum (siehe ANNAHMEN.md, Referenzdatum).
 */
const ZONEN = [
  { label: "Frankfurt", tz: "Europe/Berlin", primaer: true },
  { label: "London", tz: "Europe/London", primaer: false },
  { label: "New York", tz: "America/New_York", primaer: false },
  { label: "Dubai", tz: "Asia/Dubai", primaer: false },
  { label: "Singapur", tz: "Asia/Singapore", primaer: false },
];

function zeitIn(tz: string, mitSekunden: boolean, d: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    ...(mitSekunden ? { second: "2-digit" } : {}),
    hour12: false,
    timeZone: tz,
  }).format(d);
}

export function WeltUhren() {
  const [jetzt, setJetzt] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setJetzt(new Date());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="flex flex-wrap items-baseline justify-start gap-x-4 gap-y-1 sm:justify-end"
      aria-label="Weltuhren"
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-seil-success" aria-hidden />
        <span className="text-kicker tracking-kicker text-seil-muted uppercase">Live</span>
      </span>
      {ZONEN.map((z) => (
        <span key={z.tz} className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-kicker tracking-kicker text-seil-muted uppercase">{z.label}</span>
          <span
            className={`text-body tabular-nums ${z.primaer ? "text-seil-text" : "text-seil-muted"}`}
          >
            {jetzt ? zeitIn(z.tz, z.primaer, jetzt) : z.primaer ? "--:--:--" : "--:--"}
          </span>
        </span>
      ))}
    </div>
  );
}
