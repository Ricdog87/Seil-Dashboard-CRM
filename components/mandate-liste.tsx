"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NAMEN } from "@/lib/sitzung-token";
import { PHASEN, PHASE_LABEL, PHASE_TON, fmtDatum, laufPraefix, type Phase } from "@/lib/mandat";
import type { Mandatsliste } from "@/app/api/mandate/route";
import type { Modul01Stand } from "@/lib/modul01";

/**
 * Die Mandate. Links die Liste, darüber der Filter auf die eigene Person –
 * „jeder sieht sein Cockpit“ fängt hier an und ist kein eigener Bauabschnitt.
 *
 * Datenräume, zu denen es noch kein Mandat gibt, stehen unten als Vorschlag:
 * Modul 01 hat sie angelegt, das CRM kennt sie noch nicht. Ein Klick macht
 * daraus ein Mandat – das ist der „Create Deal“-Schritt der SOP.
 */
export function MandateListe({ kuerzel }: { kuerzel: string }) {
  const [stand, setStand] = useState<Mandatsliste | null>(null);
  const [raeume, setRaeume] = useState<Modul01Stand | null>(null);
  const [nurMeine, setNurMeine] = useState(true);
  const [neu, setNeu] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const holen = useCallback(async () => {
    try {
      const r = await fetch("/api/mandate", { cache: "no-store" });
      setStand((await r.json()) as Mandatsliste);
    } catch {
      // naechster Versuch
    }
  }, []);

  useEffect(() => {
    void holen();
    fetch("/api/modul01/status", { cache: "no-store" })
      .then((r) => r.json() as Promise<Modul01Stand>)
      .then(setRaeume)
      .catch(() => undefined);
  }, [holen]);

  async function anlegen(name: string, lauf?: string) {
    const n = name.trim();
    if (!n) return;
    setLaeuft(true);
    setFehler(null);
    try {
      const r = await fetch("/api/mandate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, zustaendig: kuerzel || null, laufPraefix: lauf ?? null }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
      setNeu("");
      await holen();
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
    } finally {
      setLaeuft(false);
    }
  }

  async function phaseSetzen(name: string, phase: Phase) {
    setStand((s) =>
      s ? { ...s, mandate: s.mandate.map((m) => (m.name === name ? { ...m, phase } : m)) } : s,
    );
    try {
      const r = await fetch("/api/mandate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phase }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
    } finally {
      await holen();
    }
  }

  const mandate = stand?.mandate ?? [];
  const meine = mandate.filter((m) => m.zustaendig === kuerzel);
  const sichtbar = nurMeine && meine.length > 0 ? meine : mandate;

  // Datenraum-Läufe ohne Mandat – der Vorschlag, daraus eines zu machen.
  const bekannt = new Set(mandate.map((m) => m.laufPraefix ?? m.name));
  const ohneMandat = raeume
    ? [...Object.values(raeume.objekte ?? {}), ...(raeume.unbekannt ?? [])]
        .map((o) => laufPraefix(o.objektName ?? ""))
        .filter((n) => n && !bekannt.has(n))
        .filter((n, i, alle) => alle.indexOf(n) === i)
    : [];

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
          Mandate {mandate.length > 0 ? `· ${mandate.length}` : ""}
        </h2>
        {meine.length > 0 && meine.length < mandate.length ? (
          <label className="inline-flex items-center gap-2 text-kicker text-seil-muted">
            <input type="checkbox" checked={nurMeine} onChange={(e) => setNurMeine(e.target.checked)} />
            nur meine ({meine.length})
          </label>
        ) : null}
      </div>

      {fehler ? (
        <p className="mb-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--seil-radius)] border border-seil-line">
        <table className="w-full min-w-[720px] border-collapse text-body">
          <thead>
            <tr className="bg-seil-surface text-left text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
              <th className="px-3 py-2 font-medium">Mandat</th>
              <th className="px-3 py-2 font-medium">Stadt</th>
              <th className="px-3 py-2 font-medium">Phase</th>
              <th className="px-3 py-2 font-medium">Zuständig</th>
              <th className="px-3 py-2 font-medium">Zuletzt</th>
            </tr>
          </thead>
          <tbody>
            {sichtbar.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-seil-muted" colSpan={5}>
                  {stand?.modus === "live"
                    ? "Noch kein Mandat angelegt."
                    : (stand?.grund ?? "wird geladen …")}
                </td>
              </tr>
            ) : (
              sichtbar.map((m) => (
                <tr key={m.id} className="border-t border-seil-line hover:bg-seil-card-alt">
                  <td className="px-3 py-2">
                    <Link
                      href={`/mandate/${encodeURIComponent(m.name)}`}
                      className="text-seil-text hover:text-seil-accent hover:underline"
                    >
                      {m.name}
                    </Link>
                    {m.auftraggeber ? (
                      <div className="text-kicker text-seil-muted">{m.auftraggeber}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-seil-body">{m.stadt ?? "—"}</td>
                  <td className="px-3 py-2">
                    <select
                      value={m.phase}
                      onChange={(e) => void phaseSetzen(m.name, e.target.value as Phase)}
                      aria-label={`Phase von ${m.name}`}
                      className={`rounded-seil border bg-seil-surface px-2 py-0.5 text-kicker ${PHASE_TON[m.phase]}`}
                    >
                      {PHASEN.map((p) => (
                        <option key={p} value={p}>
                          {PHASE_LABEL[p]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-seil-body">
                    {m.zustaendig ? (NAMEN[m.zustaendig] ?? m.zustaendig) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-kicker text-seil-muted">
                    {fmtDatum(m.geaendert)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={neu}
          onChange={(e) => setNeu(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void anlegen(neu);
          }}
          placeholder="Neues Mandat …"
          className="min-w-[14rem] flex-1 rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text placeholder:text-seil-muted"
        />
        <button
          type="button"
          disabled={laeuft || !neu.trim()}
          onClick={() => void anlegen(neu)}
          className="rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-body text-seil-text disabled:opacity-40"
        >
          Anlegen
        </button>
      </div>

      {ohneMandat.length > 0 ? (
        <div className="mt-3 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-3">
          <div className="text-kicker text-seil-muted">
            Datenräume ohne Mandat – Modul 01 kennt sie, das CRM noch nicht:
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {ohneMandat.map((n) => (
              <button
                key={n}
                type="button"
                disabled={laeuft}
                onClick={() => void anlegen(n, n)}
                className="rounded-seil border border-seil-line px-2 py-1 text-kicker text-seil-body hover:border-seil-accent hover:text-seil-accent disabled:opacity-40"
              >
                {n} → Mandat anlegen
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
