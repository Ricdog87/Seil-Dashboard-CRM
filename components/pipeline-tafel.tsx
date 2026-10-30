"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NAMEN } from "@/lib/sitzung-token";
import { PHASE_LABEL, fmtDatum, type Phase } from "@/lib/mandat";
import type { Pipeline, PipelineKarte } from "@/app/api/pipeline/route";

/**
 * Die Pipeline-Tafel – die Mandate entlang der vier SOP-Phasen.
 *
 * So denkt ein Makler-Team: nicht in Tabellenzeilen, sondern in Spalten, durch
 * die ein Mandat wandert. Die Spalten sind die Phasen aus der SOP von SEIL,
 * nicht erfundene; die Karte zeigt, was man wissen muss, ohne sie zu öffnen:
 * wie weit die Schritte sind, wie der Investoren-Trichter steht, was als
 * Nächstes fällig ist, wie es im Datenraum aussieht.
 *
 * Ziehen verschiebt die Phase. Weichen die Schritte von der gesetzten Phase
 * ab, sagt die Karte das – sie entscheidet aber nicht selbst.
 */

const SPALTEN: { phase: Phase; titel: string; untertitel: string }[] = [
  { phase: "akquise", titel: "Mandat & Bewertung", untertitel: "Phase 1 · Schritte 1–7" },
  { phase: "vorbereitung", titel: "Vermarktungsvorbereitung", untertitel: "Phase 2 · Schritte 8–14" },
  { phase: "vermarktung", titel: "Aktive Vermarktung", untertitel: "Phase 3 · Schritte 15–18" },
  { phase: "angebote", titel: "Angebote & Reporting", untertitel: "Phase 4 · Schritte 19–26" },
  { phase: "abschluss", titel: "Abschluss", untertitel: "Signing erfolgt" },
];
const NEBEN: Phase[] = ["ruht", "verloren"];

function Initialen({ kuerzel }: { kuerzel: string | null }) {
  if (!kuerzel) return <span className="text-kicker text-seil-muted">—</span>;
  const name = NAMEN[kuerzel] ?? kuerzel;
  return (
    <span
      title={name}
      className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-seil-line bg-seil-card-alt px-1.5 text-kicker uppercase text-seil-body"
    >
      {kuerzel}
    </span>
  );
}

function Fortschritt({ k }: { k: PipelineKarte }) {
  return (
    <div className="mt-2">
      <div className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-seil-line">
        {k.phasen.map((p) => (
          <div key={p.titel} className="relative h-full bg-seil-line" style={{ flex: p.gesamt }}>
            <div
              className="h-full bg-seil-accent"
              style={{ width: `${p.gesamt ? (p.fertig / p.gesamt) * 100 : 0}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2 text-kicker text-seil-muted">
        <span className="shrink-0">
          {k.schritteFertig} von 26 Schritten
          {k.schritteLaufen > 0 ? ` · ${k.schritteLaufen} läuft` : ""}
        </span>
        {k.phaseLautSchritten !== k.phase && !NEBEN.includes(k.phase) && k.phase !== "abschluss" ? (
          <span className="min-w-0 truncate text-seil-warning" title="Die Schritte legen eine andere Phase nahe">
            Schritte: {PHASE_LABEL[k.phaseLautSchritten]}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Trichter({ v }: { v: PipelineKarte["verteiler"] }) {
  if (v.gesamt === 0) return null;
  const stufen = [
    ["Verteiler", v.gesamt],
    ["angeschrieben", v.angeschrieben],
    ["NDA", v.nda],
    ["Datenraum", v.datenraum],
    ["Interesse", v.interesse],
    ["Preis", v.preisanfrage],
  ] as const;
  return (
    <div className="mt-2 flex items-end gap-1" aria-label="Investoren-Trichter">
      {stufen.map(([l, n], i) => (
        <div key={l} className="flex min-w-0 flex-1 flex-col items-center" title={`${l}: ${n}`}>
          <div
            className={`w-full rounded-sm ${i === 0 ? "bg-seil-line" : n > 0 ? "bg-seil-accent/70" : "bg-seil-line/50"}`}
            style={{ height: `${Math.max(3, Math.round((n / Math.max(1, v.gesamt)) * 22))}px` }}
          />
          <span className="mt-0.5 text-[10px] tabular-nums text-seil-muted">{n}</span>
        </div>
      ))}
      {v.abgesagt > 0 ? (
        <span className="ml-1 shrink-0 self-end whitespace-nowrap text-[10px] text-seil-muted">{v.abgesagt} ✕</span>
      ) : null}
    </div>
  );
}

function Karte({
  k,
  onDrag,
}: {
  k: PipelineKarte;
  onDrag: (name: string) => void;
}) {
  const ueberfaellig = k.naechsteAufgabe?.faellig && new Date(k.naechsteAufgabe.faellig) < new Date();
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", k.name);
        onDrag(k.name);
      }}
      className="min-w-0 cursor-grab overflow-hidden rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-3 transition-colors hover:border-seil-accent active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/mandate/${encodeURIComponent(k.name)}`}
            className="block truncate text-body text-seil-text hover:text-seil-accent hover:underline"
          >
            {k.name}
          </Link>
          <div className="truncate text-kicker text-seil-muted">
            {[k.stadt, k.assetklasse, k.auftraggeber].filter(Boolean).join(" · ") || "Stammdaten offen"}
          </div>
        </div>
        <Initialen kuerzel={k.zustaendig} />
      </div>

      <Fortschritt k={k} />
      <Trichter v={k.verteiler} />

      <div className="mt-2 grid grid-cols-1 gap-1 text-kicker">
        {k.datenraum ? (
          <div className="flex justify-between gap-2 text-seil-muted">
            <span className="shrink-0">Datenraum</span>
            <span className="min-w-0 truncate text-right tabular-nums">
              {k.datenraum.abgelegt}/{k.datenraum.eingelesen}
              {k.datenraum.offen > 0 ? (
                <span className="text-seil-warning"> · {k.datenraum.offen} zu prüfen</span>
              ) : (
                <span className="text-seil-success"> · geprüft</span>
              )}
            </span>
          </div>
        ) : null}
        {k.freigabenOffen > 0 ? (
          <div className="flex justify-between gap-2 text-seil-warning">
            <span className="shrink-0">Freigabe</span>
            <span className="tabular-nums">{k.freigabenOffen} warten</span>
          </div>
        ) : null}
        {k.naechsteAufgabe ? (
          <div className={`flex justify-between gap-2 ${ueberfaellig ? "text-seil-danger" : "text-seil-body"}`}>
            <span className="min-w-0 truncate">→ {k.naechsteAufgabe.titel}</span>
            <span className="shrink-0 tabular-nums">
              {k.naechsteAufgabe.faellig ? fmtDatum(k.naechsteAufgabe.faellig) : "o. D."}
            </span>
          </div>
        ) : k.aufgabenOffen === 0 ? (
          <div className="text-seil-muted">keine offene Aufgabe</div>
        ) : null}
        {k.aufgabenUeberfaellig > 0 ? (
          <div className="text-seil-danger">{k.aufgabenUeberfaellig} überfällig</div>
        ) : null}
        {k.followupsFaellig > 0 ? (
          <div className="flex justify-between gap-2 text-seil-danger">
            <span className="shrink-0">Follow-up fällig</span>
            <span className="tabular-nums">{k.followupsFaellig} Investoren</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function PipelineTafel({ kuerzel, kompakt = false }: { kuerzel: string; kompakt?: boolean }) {
  const [stand, setStand] = useState<Pipeline | null>(null);
  const [nurMeine, setNurMeine] = useState(false);
  const [ziel, setZiel] = useState<Phase | null>(null);
  const [gezogen, setGezogen] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [nebenAuf, setNebenAuf] = useState(false);

  const holen = useCallback(async () => {
    try {
      const r = await fetch("/api/pipeline", { cache: "no-store" });
      setStand((await r.json()) as Pipeline);
    } catch {
      // naechster Versuch
    }
  }, []);

  useEffect(() => {
    void holen();
    const t = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") void holen();
    }, 30000);
    return () => clearInterval(t);
  }, [holen]);

  async function verschieben(name: string, phase: Phase) {
    const vorher = stand?.karten.find((k) => k.name === name)?.phase;
    if (!vorher || vorher === phase) return;
    setStand((s) =>
      s ? { ...s, karten: s.karten.map((k) => (k.name === name ? { ...k, phase } : k)) } : s,
    );
    setFehler(null);
    try {
      const r = await fetch("/api/mandate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phase }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
    } catch (e) {
      setFehler(`„${name}" konnte nicht verschoben werden: ${e instanceof Error ? e.message : "unbekannt"}`);
      await holen();
    }
  }

  const karten = (stand?.karten ?? []).filter((k) => !nurMeine || k.zustaendig === kuerzel);
  const meine = (stand?.karten ?? []).filter((k) => k.zustaendig === kuerzel).length;
  const inSpalte = (p: Phase) => karten.filter((k) => k.phase === p);
  const neben = karten.filter((k) => NEBEN.includes(k.phase));

  if (stand && stand.modus !== "live") {
    return (
      <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4 text-body text-seil-muted">
        {stand.grund ?? "Pipeline nicht erreichbar"}
      </div>
    );
  }

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
          Pipeline {karten.length > 0 ? `· ${karten.length} Mandate` : ""}
        </h2>
        <div className="flex items-center gap-3 text-kicker text-seil-muted">
          {meine > 0 ? (
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={nurMeine} onChange={(e) => setNurMeine(e.target.checked)} />
              nur meine ({meine})
            </label>
          ) : null}
          <span>Karten ziehen, um die Phase zu ändern</span>
        </div>
      </div>

      {fehler ? (
        <p className="mb-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}

      <div className={`grid gap-3 ${kompakt ? "lg:grid-cols-5" : "xl:grid-cols-5 md:grid-cols-3"}`}>
        {SPALTEN.map((sp) => {
          const liste = inSpalte(sp.phase);
          const aktiv = ziel === sp.phase;
          return (
            <div
              key={sp.phase}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (ziel !== sp.phase) setZiel(sp.phase);
              }}
              onDragLeave={() => setZiel((z) => (z === sp.phase ? null : z))}
              onDrop={(e) => {
                e.preventDefault();
                const name = e.dataTransfer.getData("text/plain") || gezogen;
                setZiel(null);
                setGezogen(null);
                if (name) void verschieben(name, sp.phase);
              }}
              className={`flex min-h-[12rem] min-w-0 flex-col rounded-[var(--seil-radius)] border bg-seil-surface p-2 transition-colors ${
                aktiv ? "border-seil-accent bg-seil-accent-bg" : "border-seil-line"
              }`}
            >
              <div className="mb-2 px-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-body text-seil-text" title={sp.titel}>{sp.titel}</span>
                  <span className="rounded-seil bg-seil-card-alt px-1.5 text-kicker tabular-nums text-seil-muted">
                    {liste.length}
                  </span>
                </div>
                <div className="text-kicker text-seil-muted">{sp.untertitel}</div>
              </div>
              <div className="grid min-w-0 gap-2">
                {liste.map((k) => (
                  <Karte key={k.id} k={k} onDrag={setGezogen} />
                ))}
                {liste.length === 0 ? (
                  <div className="rounded-[var(--seil-radius)] border border-dashed border-seil-line px-3 py-6 text-center text-kicker text-seil-muted">
                    {stand ? "leer" : "…"}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ruht und Verloren: aufgeräumt unterhalb, nicht als sechste und siebte Spalte. */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setNebenAuf((x) => !x)}
          className="text-kicker text-seil-muted hover:text-seil-text"
        >
          {nebenAuf ? "▾" : "▸"} Ruht und Verloren ({neben.length})
        </button>
        {nebenAuf ? (
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {NEBEN.map((p) => (
              <div
                key={p}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (ziel !== p) setZiel(p);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const name = e.dataTransfer.getData("text/plain") || gezogen;
                  setZiel(null);
                  if (name) void verschieben(name, p);
                }}
                className={`rounded-[var(--seil-radius)] border bg-seil-surface p-2 ${
                  ziel === p ? "border-seil-accent" : "border-seil-line"
                }`}
              >
                <div className="mb-2 px-1 text-body text-seil-muted">{PHASE_LABEL[p]}</div>
                <div className="grid min-w-0 gap-2">
                  {inSpalte(p).map((k) => (
                    <Karte key={k.id} k={k} onDrag={setGezogen} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
