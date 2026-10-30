"use client";

import { useState } from "react";
import { PROZESS_PHASEN, PROZESS_SCHRITTE, SEITEN_LABEL, type SchrittVerantwortung } from "@/lib/sop";
import { ableiten, eingetragen, type Abgeleitet, type Stand } from "@/lib/sop-ableitung";
import type { Kontakt } from "@/app/api/kontakte/route";
import type { SchrittStand } from "@/app/api/schritte/route";
import type { Modul01Objekt } from "@/lib/modul01";

/**
 * Das Mandat entlang der SOP: 26 Schritte, vier Phasen, zwei Seiten.
 *
 * Das Cockpit bildet den Ablauf des Teams ab und nicht einen eigenen. Was die
 * Automatik weiß, steht automatisch da und ist nicht änderbar – dort wäre eine
 * Handeingabe nur eine zweite, schnell veraltete Wahrheit. Alles andere trägt
 * das Team selbst ein, mit dem Vokabular aus seiner Excel: Done, In Progress,
 * Pending, N.A.
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
  backoffice: "Backoffice",
  automatik: "Automatik",
  freigabe: "Freigabe",
  extern: "Extern",
};

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

  const abgeleitet = ableiten(datenraum, kontakte, investorenGesamt, offeneFreigaben);

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

  // Fortschritt je Phase: wie viele Schritte stehen auf erledigt oder entfällt.
  const phaseZahlen = (von: number, bis: number) => {
    const schritteDerPhase = PROZESS_SCHRITTE.filter((s) => s.nr >= von && s.nr <= bis);
    const fertig = schritteDerPhase.filter((s) => ["done", "na"].includes(standVon(s.nr).stand)).length;
    const laeuft = schritteDerPhase.filter((s) => standVon(s.nr).stand === "in_progress").length;
    return { fertig, laeuft, gesamt: schritteDerPhase.length };
  };

  return (
    <div className="grid gap-3">
      {fehler ? (
        <p className="rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}

      {PROZESS_PHASEN.map((ph) => {
        const { fertig, laeuft, gesamt } = phaseZahlen(ph.vonNr, ph.bisNr);
        const auf = offenePhase === null ? laeuft > 0 || fertig < gesamt : offenePhase === ph.titel;
        return (
          <section
            key={ph.titel}
            className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card"
          >
            <button
              type="button"
              onClick={() => setOffenePhase(auf ? `zu:${ph.titel}` : ph.titel)}
              className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 text-left"
            >
              <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-accent">
                {ph.titel}
              </span>
              <span className="text-kicker text-seil-muted">{SEITEN_LABEL[ph.seite]}</span>
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
                      className="flex flex-wrap items-start gap-x-3 gap-y-1 border-b border-seil-line px-4 py-2 last:border-0"
                    >
                      <span className="w-6 shrink-0 text-kicker tabular-nums text-seil-muted">
                        {s.nr}
                      </span>
                      <span className="min-w-[12rem] flex-1">
                        <span className="block text-body text-seil-text">{s.kurz}</span>
                        <span className="block text-kicker text-seil-muted">
                          {verantwortungLabel[s.verantwortung]} · {s.verantwortlich} · {s.tool}
                        </span>
                      </span>

                      {auto ? (
                        <span className="flex min-w-[14rem] flex-col items-end">
                          <span
                            className={`rounded-seil border px-2 py-0.5 text-kicker ${standTon[stand]}`}
                          >
                            {STUFEN.find((x) => x.wert === stand)?.label}
                          </span>
                          <span className="mt-0.5 text-right text-kicker text-seil-muted">
                            {auto.wert} · {auto.quelle}
                          </span>
                        </span>
                      ) : (
                        <span className="flex min-w-[14rem] flex-col items-end">
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
                          {durch ? (
                            <span className="mt-0.5 text-kicker text-seil-muted">von {durch}</span>
                          ) : null}
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
        Grau hinterlegte Stände kommen aus der Automatik und lassen sich nicht von Hand ändern –
        Modul 01 und der Verteiler wissen es aktueller. Alles andere trägt das Team ein, und es
        bleibt stehen: {mandat} behält seinen Stand auch nach dem Neuladen.
      </p>
    </div>
  );
}
