"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FreigabeEingang, Sendung } from "@/app/api/freigaben/route";

/**
 * Der Freigabe-Eingang.
 *
 * Aufbau wie im Workshop beschrieben: links der Entwurf, rechts die
 * Empfängerliste, jeder Investor einzeln an- und abwählbar. Freigegeben wird,
 * wer angehakt ist – der Rest bleibt liegen, bis jemand ihn abwählt oder
 * ablehnt. Ohne Entscheidung verlässt keine Mail das Haus.
 *
 * Freigeben darf nur die dafür benannte Person. Alle anderen sehen denselben
 * Stand, aber ohne Knöpfe: mitlesen ja, entscheiden nein.
 */
export function FreigabenEingang({
  kuerzel,
  darfEntscheiden,
  kompakt = false,
}: {
  kuerzel?: string;
  darfEntscheiden: boolean;
  kompakt?: boolean;
}) {
  const [stand, setStand] = useState<FreigabeEingang | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [arbeitet, setArbeitet] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [abgewaehlt, setAbgewaehlt] = useState<Set<string>>(new Set());
  const [offeneSendung, setOffeneSendung] = useState<string | null>(null);
  const holend = useRef(false);

  const holen = useCallback(async () => {
    if (holend.current) return;
    holend.current = true;
    setLaeuft(true);
    try {
      const r = await fetch("/api/freigaben", { cache: "no-store" });
      setStand((await r.json()) as FreigabeEingang);
    } catch {
      // Ein verpasster Takt ist kein Fehler, der nächste holt es nach.
    } finally {
      holend.current = false;
      setLaeuft(false);
    }
  }, []);

  useEffect(() => {
    void holen();
    const takt = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") void holen();
    }, 20000);
    return () => clearInterval(takt);
  }, [holen]);

  const umschalten = (id: string) =>
    setAbgewaehlt((a) => {
      const n = new Set(a);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function entscheiden(s: Sendung, entscheidung: "freigegeben" | "abgelehnt") {
    const ids = s.empfaenger
      .filter((e) => (entscheidung === "freigegeben" ? !abgewaehlt.has(e.entwurfId) : true))
      .map((e) => e.entwurfId);
    if (ids.length === 0) return;
    setArbeitet(s.sendung);
    setFehler(null);
    try {
      const r = await fetch("/api/freigaben", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entwurfIds: ids, entscheidung }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) setFehler(a.grund ?? "Die Automatik hat die Entscheidung nicht angenommen.");
      else
        setStand((st) =>
          st ? { ...st, sendungen: st.sendungen.filter((x) => x.sendung !== s.sendung) } : st,
        );
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
    } finally {
      setArbeitet(null);
      void holen();
    }
  }

  const sendungen = stand?.sendungen ?? [];
  const stoerung = stand?.modus === "aus" || stand?.modus === "fehler";
  const gesamt = sendungen.reduce((n, s) => n + s.empfaenger.length, 0);

  return (
    <section className={kompakt ? "mt-5" : ""}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
          Freigaben {gesamt > 0 ? `· ${gesamt} Anschreiben in ${sendungen.length} Sendungen` : ""}
        </h2>
        <button
          type="button"
          onClick={() => void holen()}
          className="rounded-seil border border-seil-line px-2 py-0.5 text-kicker text-seil-body hover:border-seil-accent hover:text-seil-accent"
        >
          {laeuft ? "lädt" : "jetzt"}
        </button>
      </div>

      {fehler ? (
        <p className="mb-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}

      {sendungen.length === 0 ? (
        <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
          <p className="text-body text-seil-text">
            {stoerung
              ? "Der Freigabe-Eingang ist noch nicht angebunden."
              : "Gerade wartet kein Anschreiben auf eine Freigabe."}
          </p>
          <p className="mt-1 text-kicker leading-relaxed text-seil-muted">
            {stoerung
              ? `Deshalb steht hier nicht „nichts zu tun“: es konnte niemand gefragt werden (${stand?.grund ?? "unbekannt"}). Sobald der Ablauf auf dem Server liegt, erscheinen die Entwürfe hier.`
              : "Sobald die Automatik eine Sendung entworfen hat, steht hier links der Text und rechts die Empfängerliste. Erst eine Freigabe löst den Versand aus."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {sendungen.map((s) => {
            const dabei = s.empfaenger.filter((e) => !abgewaehlt.has(e.entwurfId));
            const auf = offeneSendung === s.sendung;
            const text = s.entwurf ?? s.empfaenger[0]?.entwurf ?? "";
            return (
              <li
                key={s.sendung}
                className="rounded-[var(--seil-radius)] border border-seil-warning bg-seil-warning-bg p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-body text-seil-text">
                      {s.betreff ?? s.empfaenger[0]?.betreff ?? "Anschreiben ohne Betreff"}
                    </div>
                    <div className="text-kicker text-seil-muted">
                      {[s.objekt, `${s.empfaenger.length} Empfänger`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="text-kicker text-seil-muted">{s.erstellt ?? ""}</div>
                </div>

                {/* Links der Text, rechts die Empfaenger - so hat es das Team beschrieben. */}
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="min-w-0">
                    <div className="mb-1 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
                      Entwurf
                    </div>
                    <pre
                      className={`overflow-auto whitespace-pre-wrap rounded-[var(--seil-radius)] border border-seil-line bg-seil-surface p-3 text-body leading-relaxed text-seil-body ${
                        auf ? "max-h-none" : "max-h-64"
                      }`}
                    >
                      {text || "— kein Text übergeben"}
                    </pre>
                    {text.length > 400 ? (
                      <button
                        type="button"
                        onClick={() => setOffeneSendung(auf ? null : s.sendung)}
                        className="mt-1 text-kicker text-seil-accent hover:underline"
                      >
                        {auf ? "weniger anzeigen" : "ganzen Text anzeigen"}
                      </button>
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
                        Empfänger · {dabei.length} von {s.empfaenger.length} dabei
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setAbgewaehlt((a) => {
                            const n = new Set(a);
                            const alleDabei = dabei.length === s.empfaenger.length;
                            for (const e of s.empfaenger) {
                              if (alleDabei) n.add(e.entwurfId);
                              else n.delete(e.entwurfId);
                            }
                            return n;
                          })
                        }
                        className="text-kicker text-seil-accent hover:underline"
                      >
                        {dabei.length === s.empfaenger.length ? "alle abwählen" : "alle auswählen"}
                      </button>
                    </div>
                    <ul className="max-h-64 overflow-auto rounded-[var(--seil-radius)] border border-seil-line bg-seil-surface">
                      {s.empfaenger.map((e) => (
                        <li
                          key={e.entwurfId}
                          className="flex items-start gap-2 border-b border-seil-line px-3 py-2 last:border-0"
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={!abgewaehlt.has(e.entwurfId)}
                            onChange={() => umschalten(e.entwurfId)}
                            aria-label={`${e.firma ?? "Investor"} einbeziehen`}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-body text-seil-text">
                              {e.firma ?? "Investor ohne Firma"}
                            </span>
                            <span className="block truncate text-kicker text-seil-muted">
                              {[e.name, e.email].filter(Boolean).join(" · ") || "—"}
                            </span>
                            {e.treffer.length > 0 ? (
                              <span className="mt-1 block text-kicker text-seil-muted">
                                {e.treffer.join(" · ")}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {darfEntscheiden ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={arbeitet === s.sendung || dabei.length === 0}
                      onClick={() => void entscheiden(s, "freigegeben")}
                      className="rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-body text-seil-text disabled:opacity-50"
                    >
                      {arbeitet === s.sendung ? "…" : `${dabei.length} freigeben und versenden`}
                    </button>
                    <button
                      type="button"
                      disabled={arbeitet === s.sendung}
                      onClick={() => void entscheiden(s, "abgelehnt")}
                      className="rounded-seil border border-seil-line px-3 py-1 text-body text-seil-muted hover:border-seil-danger hover:text-seil-danger disabled:opacity-50"
                    >
                      Ganze Sendung ablehnen
                    </button>
                    {dabei.length < s.empfaenger.length ? (
                      <span className="text-kicker text-seil-muted">
                        {s.empfaenger.length - dabei.length} abgewählt – die bleiben liegen
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-kicker text-seil-muted">
                    Freigeben darf nur die dafür benannte Person
                    {kuerzel ? ` – du bist als ${kuerzel} angemeldet` : ""}. Mitlesen und Haken
                    setzen geht hier, die Entscheidung trifft sie.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
