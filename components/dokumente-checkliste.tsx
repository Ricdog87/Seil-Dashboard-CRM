"use client";

import { useCallback, useEffect, useState } from "react";
import { LIGHT_KATEGORIEN } from "@/lib/sop";
import type { Dokumentenliste, DokumentStand, DokumentStatus } from "@/app/api/dokumente/route";

/**
 * Die Standarddokumente eines Mandats – SOP Schritt 7, aus Sicht des
 * Hausverkäufers: nach genau diesen Unterlagen wird er gefragt.
 *
 * Zwanzig Kategorien, wortgetreu aus der Datenraum-SOP. Was in den Datenraum
 * light gehört (Schritt 15, nach NDA), ist markiert – das sind die elf, die ein
 * Interessent nach NDA zuerst sieht.
 */
const STATUS: { wert: DokumentStatus; label: string; ton: string }[] = [
  { wert: "fehlt", label: "Fehlt", ton: "border-seil-line text-seil-muted" },
  { wert: "angefordert", label: "Angefordert", ton: "border-seil-warning text-seil-warning" },
  { wert: "liegt_vor", label: "Liegt vor", ton: "border-seil-success text-seil-success" },
  { wert: "nicht_noetig", label: "Nicht nötig", ton: "border-seil-line text-seil-muted" },
];

export function DokumenteCheckliste({ mandat, kompakt = false }: { mandat: string; kompakt?: boolean }) {
  const [stand, setStand] = useState<Dokumentenliste | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [auf, setAuf] = useState(!kompakt);

  const holen = useCallback(async () => {
    try {
      const r = await fetch(`/api/dokumente?mandat=${encodeURIComponent(mandat)}`, { cache: "no-store" });
      setStand((await r.json()) as Dokumentenliste);
    } catch {
      // naechster Versuch
    }
  }, [mandat]);

  useEffect(() => {
    void holen();
  }, [holen]);

  async function setzen(d: DokumentStand, status: DokumentStatus) {
    setStand((s) =>
      s ? { ...s, dokumente: s.dokumente.map((x) => (x.dokument === d.dokument ? { ...x, status } : x)) } : s,
    );
    setFehler(null);
    try {
      const r = await fetch("/api/dokumente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandat, dokument: d.dokument, status }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
      await holen();
    }
  }

  async function alleAnfordern() {
    const offen = (stand?.dokumente ?? []).filter((d) => d.status === "fehlt");
    for (const d of offen) await setzen(d, "angefordert");
  }

  const dokumente = stand?.dokumente ?? [];
  const liegtVor = dokumente.filter((d) => d.status === "liegt_vor").length;
  const noetig = dokumente.filter((d) => d.status !== "nicht_noetig").length;
  const fehlt = dokumente.filter((d) => d.status === "fehlt").length;

  return (
    <section className="mt-5">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <button
          type="button"
          onClick={() => setAuf((x) => !x)}
          className="text-left text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted"
        >
          {kompakt ? (auf ? "▾ " : "▸ ") : ""}Standarddokumente · Schritt 7
          {stand?.modus === "live" ? (
            <span className="ml-2 normal-case tracking-normal">
              — <span className="text-seil-success">{liegtVor}</span> von {noetig} liegen vor
              {fehlt > 0 ? <span className="text-seil-warning"> · {fehlt} fehlen</span> : null}
            </span>
          ) : null}
        </button>
        {auf && fehlt > 0 ? (
          <button
            type="button"
            onClick={() => void alleAnfordern()}
            className="rounded-seil border border-seil-line px-2 py-0.5 text-kicker text-seil-body hover:border-seil-accent hover:text-seil-accent"
          >
            Alle fehlenden als angefordert markieren
          </button>
        ) : null}
      </div>

      {fehler ? (
        <p className="mb-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}

      {auf ? (
        stand && stand.modus !== "live" ? (
          <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4 text-body text-seil-muted">
            {stand.grund ?? "nicht erreichbar"}
          </div>
        ) : (
          <div className="grid gap-1.5 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-3 sm:grid-cols-2 lg:grid-cols-4">
            {dokumente.map((d) => {
              const light = LIGHT_KATEGORIEN.includes(d.dokument);
              const meta = STATUS.find((x) => x.wert === d.status)!;
              return (
                <label
                  key={d.dokument}
                  className="flex items-center justify-between gap-2 rounded-[var(--seil-radius)] border border-seil-line bg-seil-surface px-2.5 py-1.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-body text-seil-text">{d.dokument}</span>
                    {light ? <span className="block text-[10px] text-seil-muted">auch im Datenraum light</span> : null}
                  </span>
                  <select
                    value={d.status}
                    onChange={(e) => void setzen(d, e.target.value as DokumentStatus)}
                    aria-label={`Stand von ${d.dokument}`}
                    className={`shrink-0 rounded-seil border bg-seil-card px-1.5 py-0.5 text-kicker ${meta.ton}`}
                  >
                    {STATUS.map((s) => (
                      <option key={s.wert} value={s.wert}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        )
      ) : null}
      {auf ? (
        <p className="mt-2 text-kicker leading-relaxed text-seil-muted">
          Die zwanzig Kategorien der Datenraum-SOP vom 18.02.2026. Ob ein Dokument wirklich im
          Datenraum liegt, prüft Modul 01 – diese Liste hält fest, was beim Auftraggeber angefordert
          wurde und was er geliefert hat.
        </p>
      ) : null}
    </section>
  );
}
