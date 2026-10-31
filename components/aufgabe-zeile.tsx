"use client";

import Link from "next/link";
import { NAMEN } from "@/lib/sitzung-token";
import { fmtDatum, istUeberfaellig, type Aufgabe } from "@/lib/mandat";

/**
 * Eine Aufgabenzeile, wie sie überall im Cockpit aussieht.
 *
 * Links der Haken, dann Titel und Kontext (Mandat, Kunde, Herkunft), rechts die
 * Person und die Fälligkeit als farbige Marke: rot überfällig, bernstein heute,
 * sonst ruhig. Dasselbe Bild auf der Aufgabenseite, in der Mandatsakte und in
 * der Kundenakte – wer eine Zeile lesen kann, kann alle lesen.
 */
export function faelligkeit(a: Aufgabe): { label: string; ton: string } {
  if (!a.faellig) return { label: "ohne Datum", ton: "border-seil-line text-seil-muted" };
  if (a.erledigt) return { label: fmtDatum(a.faellig), ton: "border-seil-line text-seil-muted" };
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const d = new Date(a.faellig); d.setHours(0, 0, 0, 0);
  const tage = Math.round((d.getTime() - heute.getTime()) / 86_400_000);
  if (tage < 0) return { label: `${-tage} ${-tage === 1 ? "Tag" : "Tage"} überfällig`, ton: "border-seil-danger text-seil-danger bg-seil-danger-bg" };
  if (tage === 0) return { label: "heute", ton: "border-seil-warning text-seil-warning bg-seil-warning-bg" };
  if (tage === 1) return { label: "morgen", ton: "border-seil-accent text-seil-accent" };
  if (tage <= 7) return { label: d.toLocaleDateString("de-DE", { weekday: "short" }), ton: "border-seil-line text-seil-body" };
  return { label: fmtDatum(a.faellig), ton: "border-seil-line text-seil-muted" };
}

export function Avatar({ kuerzel, groesse = "h-6 w-6 text-[10px]" }: { kuerzel: string | null; groesse?: string }) {
  if (!kuerzel) {
    return (
      <span className={`inline-flex ${groesse} items-center justify-center rounded-full border border-dashed border-seil-line text-seil-muted`} title="niemand zugeteilt">
        ?
      </span>
    );
  }
  return (
    <span
      className={`inline-flex ${groesse} items-center justify-center rounded-full border border-seil-line bg-seil-card-alt uppercase text-seil-body`}
      title={NAMEN[kuerzel] ?? kuerzel}
    >
      {kuerzel}
    </span>
  );
}

export function AufgabeZeile({
  a,
  onAbhaken,
  onKlick,
  offen = false,
  zeigeMandat = true,
}: {
  a: Aufgabe;
  onAbhaken: (erledigt: boolean) => void;
  onKlick?: () => void;
  offen?: boolean;
  zeigeMandat?: boolean;
}) {
  const f = faelligkeit(a);
  return (
    <li
      className={`group flex items-start gap-3 border-b border-seil-line px-4 py-2.5 last:border-0 ${
        offen ? "bg-seil-card-alt" : "hover:bg-seil-card-alt/60"
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={a.erledigt}
        aria-label={`${a.titel} ${a.erledigt ? "wieder öffnen" : "erledigen"}`}
        onClick={() => onAbhaken(!a.erledigt)}
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          a.erledigt
            ? "border-seil-success bg-seil-success text-seil-bg"
            : istUeberfaellig(a)
              ? "border-seil-danger hover:bg-seil-danger-bg"
              : "border-seil-line hover:border-seil-accent"
        }`}
      >
        {a.erledigt ? <span className="text-[11px] leading-none">✓</span> : null}
      </button>

      <button type="button" onClick={onKlick} className="min-w-0 flex-1 text-left">
        <span className={`block truncate text-body ${a.erledigt ? "text-seil-muted line-through" : "text-seil-text"}`}>
          {a.titel}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-kicker text-seil-muted">
          {zeigeMandat && a.objekt ? (
            <Link
              href={`/mandate/${encodeURIComponent(a.objekt)}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-seil border border-seil-line px-1.5 py-px hover:border-seil-accent hover:text-seil-accent"
            >
              {a.objekt}
            </Link>
          ) : null}
          {a.investorId ? (
            <Link
              href={`/kunden/${encodeURIComponent(a.investorId)}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-seil border border-seil-line px-1.5 py-px hover:border-seil-accent hover:text-seil-accent"
            >
              {a.investorId}
            </Link>
          ) : null}
          {a.quelle === "prozess" ? (
            <span className="rounded-seil bg-seil-accent-bg px-1.5 py-px text-seil-accent" title="Aus dem Standardprozess entstanden – Stufenwechsel oder Antwort im Trichter">
              aus dem Prozess
            </span>
          ) : null}
          {a.notiz ? <span className="truncate">· {a.notiz}</span> : null}
        </span>
      </button>

      <span className="hidden shrink-0 items-center gap-2 text-kicker text-seil-body sm:inline-flex">
        <Avatar kuerzel={a.zustaendig} />
        <span className="hidden lg:inline">{a.zustaendig ? (NAMEN[a.zustaendig] ?? a.zustaendig) : "niemand"}</span>
      </span>
      <span className={`shrink-0 rounded-seil border px-2 py-0.5 text-kicker tabular-nums ${f.ton}`}>{f.label}</span>
    </li>
  );
}
