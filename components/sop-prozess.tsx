"use client";

import { useState } from "react";
import {
  LANE_FARBE,
  PROZESS_PHASEN,
  PROZESS_SCHRITTE,
  SEITEN_LABEL,
  TOOL_FARBE,
  toolBasis,
  type SchrittVerantwortung,
} from "@/lib/sop";
import { ableiten, eingetragen, type Abgeleitet, type Stand } from "@/lib/sop-ableitung";
import type { Kontakt } from "@/app/api/kontakte/route";
import type { SchrittStand } from "@/app/api/schritte/route";
import type { Modul01Objekt } from "@/lib/modul01";

/**
 * Das Mandat entlang des Flowcharts: 17 Schritte in vier Abschnitten.
 *
 * Jede Zeile trägt die drei Bahnen des Diagramms – Responsible, Tool, Task –
 * in denselben Farben. Was die Automatik weiß (Datenraum, Deal, Matching,
 * Approach, Kommunikation, Anrufe), steht automatisch da und ist nicht
 * änderbar; alles andere trägt das Team ein: Offen, Läuft, Erledigt, Entfällt.
 */

const STUFEN: { wert: Stand; label: string }[] = [
  { wert: "pending", label: "Offen" },
  { wert: "in_progress", label: "Läuft" },
  { wert: "done", label: "Erledigt" },
  { wert: "na", label: "Entfällt" },
];

const standTon: Record<Stand, string> = {
  done: "border-seil-success text-seil-success",
  in_progress: "border-seil-accent text-seil-accent",
  pending: "border-seil-line text-seil-muted",
  na: "border-seil-line text-seil-muted",
};

const verantwortungLabel: Record<SchrittVerantwortung, string> = {
  team: "Team",
  automatik: "Automatik",
  freigabe: "Freigabe",
  extern: "Extern",
};

export function LaneChip({ lane }: { lane: string }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {lane.split(" / ").map((l) => {
        const f = LANE_FARBE[l];
        return (
          <span
            key={l}
            className="rounded-[3px] border border-seil-line px-1.5 py-px text-[10px] leading-4"
            style={f ? { background: f.bg, color: f.fg } : undefined}
          >
            {l}
          </span>
        );
      })}
    </span>
  );
}

export function ToolChip({ tool }: { tool: string }) {
  if (tool === "—") return <span className="text-[10px] text-seil-muted">—</span>;
  const f = TOOL_FARBE[toolBasis(tool)];
  return (
    <span
      className="rounded-[3px] px-1.5 py-px text-[10px] leading-4"
      style={f ? { background: f.bg, color: f.fg } : { background: "var(--seil-card-alt)", color: "var(--seil-body)" }}
    >
      {tool}
    </span>
  );
}

export function SopProzess({
  mandat,
  datenraum,
  kontakte,
  schritte,
  investorenGesamt,
  offeneFreigaben,
  onSetzen,
}: {
  mandat: string;
  datenraum?: Modul01Objekt;
  kontakte: Kontakt[];
  schritte: SchrittStand[];
  investorenGesamt: number | null;
  offeneFreigaben: number;
  onSetzen: (nr: number, status: Stand) => Promise<boolean>;
}) {
  const [arbeitet, setArbeitet] = useState<number | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [offenePhase, setOffenePhase] = useState<string | null>(null);

  const abgeleitet = ableiten(datenraum, kontakte, investorenGesamt, offeneFreigaben, true);

  const standVon = (nr: number): { stand: Stand; auto?: Abgeleitet; durch?: string | null } => {
    const auto = abgeleitet[nr];
    if (auto) return { stand: auto.status, auto };
    const e = eingetragen(schritte, nr);
    return { stand: (e?.status as Stand) ?? "pending", durch: e?.geaendertDurch };
  };

  async function setzen(nr: number, status: Stand) {
    setArbeitet(nr);
    setFehler(null);
    const ok = await onSetzen(nr, status);
    if (!ok) setFehler(`Schritt ${nr} konnte nicht gespeichert werden.`);
    setArbeitet(null);
  }

  const phaseZahlen = (von: number, bis: number) => {
    const schritteDerPhase = PROZESS_SCHRITTE.filter((s) => s.nr >= von && s.nr <= bis);
    const fertig = schritteDerPhase.filter((s) => ["done", "na"].includes(standVon(s.nr).stand)).length;
    const laeuft = schritteDerPhase.filter((s) => standVon(s.nr).stand === "in_progress").length;
    return { fertig, laeuft, gesamt: schritteDerPhase.length };
  };

  const gesamtFertig = PROZESS_SCHRITTE.filter((s) => ["done", "na"].includes(standVon(s.nr).stand)).length;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-body text-seil-text">
          SEIL Transaction Process · {gesamtFertig} von {PROZESS_SCHRITTE.length} Schritten
        </span>
        <a href="/prozess" className="text-kicker text-seil-accent hover:underline">
          Flowchart und Standardprozess ansehen →
        </a>
      </div>

      {fehler ? (
        <p className="rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}

      {PROZESS_PHASEN.map((ph, i) => {
        const { fertig, laeuft, gesamt } = phaseZahlen(ph.vonNr, ph.bisNr);
        const auf = offenePhase === null ? laeuft > 0 || fertig < gesamt : offenePhase === ph.titel;
        return (
          <section key={ph.titel} className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card">
            <button
              type="button"
              onClick={() => setOffenePhase(auf ? `zu:${ph.titel}` : ph.titel)}
              className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 text-left"
            >
              <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-accent">
                {i + 1} · {ph.titel}
              </span>
              <span className="text-kicker text-seil-muted">
                Schritte {ph.vonNr}–{ph.bisNr} · {SEITEN_LABEL[ph.seite]}
              </span>
              <span className="ml-auto text-kicker tabular-nums text-seil-muted">
                {fertig} von {gesamt} erledigt
                {laeuft > 0 ? ` · ${laeuft} läuft` : ""}
              </span>
            </button>

            {auf ? (
              <ul className="border-t border-seil-line">
                {PROZESS_SCHRITTE.filter((s) => s.nr >= ph.vonNr && s.nr <= ph.bisNr).map((s) => {
                  const { stand, auto, durch } = standVon(s.nr);
                  return (
                    <li
                      key={s.nr}
                      className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 border-b border-seil-line px-4 py-2 last:border-0"
                    >
                      <span className="pt-0.5 text-kicker tabular-nums text-seil-muted">{s.nr}</span>
                      <span className="min-w-0">
                        <span className="block text-body text-seil-text">{s.kurz}</span>
                        <span className="block truncate text-kicker text-seil-muted" title={s.lang}>
                          {s.lang}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <LaneChip lane={s.verantwortlich} />
                          <ToolChip tool={s.tool} />
                          {s.heute ? (
                            <span className="text-[10px] text-seil-muted">heute: {s.heute}</span>
                          ) : null}
                          <span className="text-[10px] text-seil-muted">· {verantwortungLabel[s.verantwortung]}</span>
                        </span>
                      </span>

                      {auto ? (
                        <span className="flex min-w-[12rem] flex-col items-end">
                          <span className={`rounded-seil border px-2 py-0.5 text-kicker ${standTon[stand]}`}>
                            {STUFEN.find((x) => x.wert === stand)?.label}
                          </span>
                          <span className="mt-0.5 max-w-[16rem] text-right text-kicker text-seil-muted">
                            {auto.wert} · {auto.quelle}
                          </span>
                        </span>
                      ) : (
                        <span className="flex min-w-[12rem] flex-col items-end">
                          <select
                            value={stand}
                            disabled={arbeitet === s.nr}
                            onChange={(e) => void setzen(s.nr, e.target.value as Stand)}
                            aria-label={`Stand von Schritt ${s.nr}, ${s.kurz}`}
                            className={`rounded-seil border bg-seil-surface px-2 py-0.5 text-kicker ${standTon[stand]}`}
                          >
                            {STUFEN.map((x) => (
                              <option key={x.wert} value={x.wert}>
                                {x.label}
                              </option>
                            ))}
                          </select>
                          {durch ? <span className="mt-0.5 text-kicker text-seil-muted">von {durch}</span> : null}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        );
      })}

      <p className="text-kicker leading-relaxed text-seil-muted">
        Die Schritte sind die 17 Kästen eures Flowcharts, mit Responsible und Tool in denselben Farben.
        Grau hinterlegte Stände kommen aus der Automatik – Modul 01, Verteiler, Standardprozess – und
        lassen sich nicht von Hand ändern. Alles andere trägt das Team ein; {mandat} behält seinen Stand
        auch nach dem Neuladen.
      </p>
    </div>
  );
}
