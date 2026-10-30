"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Freigabe, FreigabeEingang } from "@/app/api/freigaben/route";

/**
 * Der Freigabe-Eingang der Geschäftsführung.
 *
 * Jedes Anschreiben, das die Automatik entworfen hat, liegt hier, bis jemand
 * entscheidet. Ohne Entscheidung verlässt keine Mail das Haus – das ist kein
 * Komfortmerkmal, sondern die Stelle, an der ein Mensch den Text sieht, bevor
 * ein Investor ihn liest.
 */
export function FreigabenEingang({ kompakt = false }: { kompakt?: boolean }) {
  const [stand, setStand] = useState<FreigabeEingang | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [arbeitet, setArbeitet] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [offenerEntwurf, setOffenerEntwurf] = useState<string | null>(null);
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

  async function entscheiden(f: Freigabe, entscheidung: "freigegeben" | "abgelehnt") {
    setArbeitet(f.entwurfId);
    setFehler(null);
    try {
      const r = await fetch("/api/freigaben", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entwurfId: f.entwurfId, entscheidung }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) setFehler(a.grund ?? "Die Automatik hat die Entscheidung nicht angenommen.");
      else
        // Sofort aus der Liste nehmen, damit niemand zweimal klickt – der
        // nächste Abruf bestätigt es.
        setStand((s) =>
          s ? { ...s, offen: s.offen.filter((x) => x.entwurfId !== f.entwurfId) } : s,
        );
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
    } finally {
      setArbeitet(null);
      void holen();
    }
  }

  const offen = stand?.offen ?? [];
  const nichtEingerichtet = stand?.modus === "aus";

  return (
    <section className={kompakt ? "mt-5" : ""}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
          Freigaben {offen.length > 0 ? `· ${offen.length} offen` : ""}
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

      {offen.length === 0 ? (
        <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
          <p className="text-body text-seil-text">
            {nichtEingerichtet
              ? "Der Freigabe-Eingang ist noch nicht angebunden."
              : "Gerade wartet kein Anschreiben auf eine Freigabe."}
          </p>
          <p className="mt-1 text-kicker leading-relaxed text-seil-muted">
            {nichtEingerichtet
              ? "Sobald die Automatik ihre Entwürfe hierher meldet, erscheinen sie an dieser Stelle."
              : "Sobald die Automatik ein Anschreiben entworfen hat, erscheint es hier – mit Investor, Begründung und vollem Text. Erst ein Klick auf „Freigeben“ löst den Versand aus."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {offen.map((f) => {
            const auf = offenerEntwurf === f.entwurfId;
            return (
              <li
                key={f.entwurfId}
                className="rounded-[var(--seil-radius)] border border-seil-warning bg-seil-warning-bg p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-body text-seil-text">{f.investorFirma ?? "Investor"}</div>
                    <div className="text-kicker text-seil-muted">
                      {[f.investorName, f.objekt].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="text-kicker text-seil-muted">{f.erstellt ?? ""}</div>
                </div>

                {f.treffer.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {f.treffer.map((t) => (
                      <span
                        key={t}
                        className="rounded-seil border border-seil-line bg-seil-surface px-2 py-0.5 text-kicker text-seil-body"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}

                {f.betreff ? (
                  <div className="mt-2 text-body text-seil-body">Betreff: {f.betreff}</div>
                ) : null}

                {f.entwurf ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setOffenerEntwurf(auf ? null : f.entwurfId)}
                      className="mt-2 text-kicker text-seil-accent hover:underline"
                    >
                      {auf ? "Entwurf zuklappen" : "Entwurf lesen"}
                    </button>
                    {auf ? (
                      <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-[var(--seil-radius)] border border-seil-line bg-seil-surface p-3 text-body text-seil-body">
                        {f.entwurf}
                      </pre>
                    ) : null}
                  </>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={arbeitet === f.entwurfId}
                    onClick={() => void entscheiden(f, "freigegeben")}
                    className="rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-body text-seil-text hover:border-seil-accent disabled:opacity-50"
                  >
                    {arbeitet === f.entwurfId ? "…" : "Freigeben und versenden"}
                  </button>
                  <button
                    type="button"
                    disabled={arbeitet === f.entwurfId}
                    onClick={() => void entscheiden(f, "abgelehnt")}
                    className="rounded-seil border border-seil-line px-3 py-1 text-body text-seil-muted hover:border-seil-danger hover:text-seil-danger disabled:opacity-50"
                  >
                    Nicht versenden
                  </button>
                  {f.investorEmail ? (
                    <span className="text-kicker text-seil-muted">geht an {f.investorEmail}</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
