"use client";

import { useState } from "react";
import {
  ANTWORT_ARTEN,
  ANTWORT_REGELN,
  BESICHTIGUNG_KETTE,
  FOLLOWUP_LEITER,
  followupText,
  type AntwortArt,
} from "@/lib/kommunikation";
import { STUFEN_LABEL, STUFEN_TON } from "@/lib/crm";
import { FOLLOWUP_TAGE } from "@/lib/followup";

/**
 * Der Standardprozess Kommunikation Investoren – Flowchart-Schritt 15 als
 * Tabelle, wie das Team sie kennt: Aktion Investor · Antwort SEIL · Todo.
 * Dazu, was das Cockpit daraus macht: die Trichter-Stufe und die Aufgaben.
 * Die Vorlagen klappen auf; Telefonnummern und Signatur sind Platzhalter,
 * die echten Werte liegen in der Automatik.
 */
function Vorlage({ text }: { text: string }) {
  return (
    <pre className="mt-2 whitespace-pre-wrap rounded-[var(--seil-radius)] border border-seil-line bg-seil-surface p-3 font-sans text-kicker leading-relaxed text-seil-body">
      {text}
    </pre>
  );
}

export function Standardprozess() {
  const [offen, setOffen] = useState<string | null>(null);
  const toggle = (k: string) => setOffen((o) => (o === k ? null : k));
  const arten = ANTWORT_ARTEN.filter((a) => a !== "sonstiges") as AntwortArt[];

  return (
    <div className="grid gap-5">
      {/* Antworttabelle */}
      <section className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card">
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-x-4 border-b border-seil-line px-4 py-2 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted max-md:hidden">
          <span>Aktion Investor</span>
          <span>Im Cockpit</span>
          <span>Todo</span>
          <span>Vorlage</span>
        </div>
        <ul>
          {arten.map((art) => {
            const r = ANTWORT_REGELN[art];
            const auf = offen === art;
            return (
              <li key={art} className="border-b border-seil-line px-4 py-3 last:border-0">
                <div className="grid gap-x-4 gap-y-2 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto]">
                  <div className="min-w-0">
                    <div className="text-body text-seil-text">{r.aktion}</div>
                    <div className="text-kicker text-seil-muted">{r.aktionEn}</div>
                  </div>
                  <div className="flex flex-wrap items-start gap-1.5">
                    {r.stufe ? (
                      <span className={`rounded-seil border px-2 py-0.5 text-kicker ${STUFEN_TON[r.stufe]}`}>
                        → {STUFEN_LABEL[r.stufe]}
                      </span>
                    ) : (
                      <span className="rounded-seil border border-seil-line px-2 py-0.5 text-kicker text-seil-muted">Stufe bleibt</span>
                    )}
                    {r.bcc ? (
                      <span className="rounded-seil border border-seil-line px-2 py-0.5 text-kicker text-seil-body">MS + JD bcc</span>
                    ) : null}
                    {r.nachfassenTage ? (
                      <span className="rounded-seil border border-seil-line px-2 py-0.5 text-kicker text-seil-body">
                        nachfassen +{r.nachfassenTage} Tage
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0 text-kicker leading-relaxed text-seil-body">
                    {r.todo}
                    {r.aufgaben.length > 0 ? (
                      <ul className="mt-1 text-seil-muted">
                        {r.aufgaben.map((a, i) => (
                          <li key={i}>
                            ☐ {a.titel("…")} · {a.an === "preisauskunft" ? "Geschäftsführung" : "zuständige Person"} ·{" "}
                            {a.tage === 0 ? "heute" : `+${a.tage} Tag${a.tage === 1 ? "" : "e"}`}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div>
                    {r.antwort || r.zweige ? (
                      <button
                        type="button"
                        onClick={() => toggle(art)}
                        className="rounded-seil border border-seil-line px-2 py-0.5 text-kicker text-seil-body hover:border-seil-accent hover:text-seil-accent"
                      >
                        {auf ? "zu" : "Vorlage"}
                      </button>
                    ) : null}
                  </div>
                </div>
                {auf ? (
                  <div className="mt-2 grid gap-2">
                    {r.antwort ? <Vorlage text={r.antwort} /> : null}
                    {r.varianten?.map((v) => (
                      <div key={v.name}>
                        <div className="text-kicker text-seil-muted">{v.name}</div>
                        <Vorlage text={v.text} />
                      </div>
                    ))}
                    {r.nachfassVorlage ? (
                      <div>
                        <div className="text-kicker text-seil-muted">Nachfrage nach {FOLLOWUP_TAGE} Tagen</div>
                        <Vorlage text={r.nachfassVorlage} />
                      </div>
                    ) : null}
                    {r.zweige?.map((z) => (
                      <div key={z.fall} className="rounded-[var(--seil-radius)] border border-seil-line p-3">
                        <div className="text-body text-seil-text">↳ {z.fall}</div>
                        <div className="mt-1 text-kicker text-seil-body">
                          Todo: {z.todo}
                          {z.bcc ? " · MS + JD bcc" : ""}
                        </div>
                        <Vorlage text={z.antwort} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Follow-up-Leiter */}
      <section className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
            Keine Antwort → Follow-up-Leiter
          </h3>
          <span className="text-kicker text-seil-muted">
            alle {FOLLOWUP_TAGE} Tage · {FOLLOWUP_LEITER.length} Stufen, dann gilt der Investor als stumm
          </span>
        </div>
        <ol className="mt-3 grid gap-2 md:grid-cols-4">
          {FOLLOWUP_LEITER.map((s) => {
            const k = `fu-${s.stufe}`;
            return (
              <li key={k} className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-surface p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-body text-seil-text">{s.name}</span>
                  <span className="text-kicker tabular-nums text-seil-muted">+{s.stufe * FOLLOWUP_TAGE} Tage</span>
                </div>
                <div className="mt-1 text-kicker text-seil-muted">
                  {s.text ? "feste Vorlage" : "die vorherigen Follow-Up-Mails abwechseln"}
                </div>
                <button
                  type="button"
                  onClick={() => toggle(k)}
                  className="mt-2 text-kicker text-seil-accent hover:underline"
                >
                  {offen === k ? "zu" : "Vorlage"}
                </button>
                {offen === k ? <Vorlage text={followupText(s.stufe)} /> : null}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Besichtigungskette */}
      <section className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
        <h3 className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
          Besichtigung angefragt → vier Schritte
        </h3>
        <ol className="mt-3 grid gap-2 md:grid-cols-2">
          {BESICHTIGUNG_KETTE.map((b) => {
            const k = `bes-${b.nr}`;
            return (
              <li key={k} className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-surface p-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-kicker tabular-nums text-seil-muted">{b.nr}</span>
                  <span className="text-body text-seil-text">{b.titel}</span>
                  <span className="ml-auto text-kicker text-seil-muted">an: {b.an}</span>
                </div>
                <div className="mt-1 text-kicker leading-relaxed text-seil-body">{b.todo}</div>
                <button type="button" onClick={() => toggle(k)} className="mt-2 text-kicker text-seil-accent hover:underline">
                  {offen === k ? "zu" : "Vorlage"}
                </button>
                {offen === k ? <Vorlage text={b.vorlage} /> : null}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
