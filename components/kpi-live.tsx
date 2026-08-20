"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { aufgaben } from "@/lib/mock-data";
import { Card, ICON_SM, ICON_STROKE } from "@/components/ui";
import { Kicker } from "@/components/cockpit";
import { useSitzung } from "./sitzung";

/** 7-Tage-Miniverlauf: eine Linie, kein Chart-Chrom – der Zahlwert steht daneben. */
function Sparkline({ punkte }: { punkte: number[] }) {
  const min = Math.min(...punkte);
  const max = Math.max(...punkte);
  const spanne = max - min || 1;
  const B = 72;
  const H = 22;
  const PAD = 3;
  const xy = punkte.map((v, i) => [
    PAD + (i * (B - 2 * PAD)) / (punkte.length - 1),
    H - PAD - ((v - min) / spanne) * (H - 2 * PAD),
  ]);
  const [lx, ly] = xy[xy.length - 1];
  return (
    <svg
      viewBox={`0 0 ${B} ${H}`}
      width={B}
      height={H}
      className="shrink-0 text-seil-accent"
      aria-hidden
    >
      <polyline
        points={xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="2.5" fill="currentColor" />
    </svg>
  );
}

export interface KpiDelta {
  text: string;
  gut?: boolean; // positive Entwicklung → Erfolgston mit Richtungspfeil
}

/**
 * KPI-Kachel mit 7-Tage-Verlauf. Ändert sich der Wert in der Sitzung
 * (z. B. Aufgabe abgehakt), zählt die Zahl sichtbar um – kein Sprung.
 */
export function KpiKachelLive({
  label,
  wert,
  sub,
  href,
  trend,
  delta,
}: {
  label: string;
  wert: number;
  sub?: string;
  href?: string;
  trend?: number[];
  delta?: KpiDelta;
}) {
  const [anzeige, setAnzeige] = useState(wert);
  const vorher = useRef(wert);

  useEffect(() => {
    const von = vorher.current;
    vorher.current = wert;
    if (von === wert) return;
    const start = performance.now();
    const dauer = 400;
    let raf = 0;
    const schritt = (t: number) => {
      const p = Math.min(1, (t - start) / dauer);
      const eased = 1 - (1 - p) ** 3;
      setAnzeige(Math.round(von + (wert - von) * eased));
      if (p < 1) raf = requestAnimationFrame(schritt);
    };
    raf = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(raf);
  }, [wert]);

  const inhalt = (
    <>
      <Kicker>{label}</Kicker>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-display tabular-nums text-seil-text">{anzeige}</span>
        {trend ? <Sparkline punkte={trend} /> : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-kicker">
        {sub ? <span className="text-seil-muted">{sub}</span> : null}
        {delta ? (
          delta.gut ? (
            <span className="inline-flex items-center gap-1 text-seil-success">
              <ArrowDown size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
              {delta.text}
            </span>
          ) : (
            <span className="text-seil-muted">{delta.text}</span>
          )
        ) : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-seil border border-seil-line bg-seil-card px-4 py-3 transition-colors hover:border-seil-accent"
      >
        {inhalt}
      </Link>
    );
  }
  return <Card className="px-4 py-3">{inhalt}</Card>;
}

/** Offene Aufgaben live aus dem Sitzungszustand – sinkt beim Abhaken sichtbar mit. */
export function KpiAufgabenLive({ trend, delta }: { trend?: number[]; delta?: KpiDelta }) {
  const { aufgabenPatches } = useSitzung();
  const offen = aufgaben
    .map((t) => ({ ...t, ...aufgabenPatches[t.id] }))
    .filter((t) => !t.erledigt);
  const calls = offen.filter((t) => t.typ === "broker_call").length;
  return (
    <KpiKachelLive
      label="Offene Aufgaben"
      wert={offen.length}
      sub={`davon ${calls} Broker Calls`}
      href="/aufgaben"
      trend={trend}
      delta={delta}
    />
  );
}
