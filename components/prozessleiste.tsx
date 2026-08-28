"use client";

import { useId, useState } from "react";
import { Bot, Briefcase, Check, ChevronDown, CircleSlash, Handshake, UserCheck, Users } from "lucide-react";
import {
  FREIGABE_SCHRITT_INDEX,
  PROZESS_PHASEN,
  PROZESS_SCHRITTE,
  SEITEN_LABEL,
  type SchrittVerantwortung,
} from "@/lib/mock-data";
import {
  aktivitaetenZu,
  aufgabenZuObjekt,
  faelligLabel,
  fmtDatumKurz,
  mitarbeiterVon,
  prozessFortschritt,
} from "@/lib/derive";
import type { Objekt, SchrittStatus } from "@/lib/types";
import { Badge, ICON_SM, ICON_STROKE } from "@/components/ui";
import { Kicker } from "@/components/cockpit";

const verantwortungMeta: Record<SchrittVerantwortung, { label: string; icon: typeof Users; tone: "neutral" | "info" | "warning" | "accent" }> = {
  team: { label: "Team", icon: Users, tone: "neutral" },
  // Demo-Check 20.08.: administrative Vorbereitung liegt beim Backoffice.
  backoffice: { label: "Backoffice", icon: Briefcase, tone: "neutral" },
  automatik: { label: "Automatik", icon: Bot, tone: "info" },
  freigabe: { label: "Manuelle Freigabe", icon: UserCheck, tone: "warning" },
  extern: { label: "Extern (Client/Legal/Broker)", icon: Handshake, tone: "accent" },
};

/** Status-Erscheinung – Vokabular der Team-Excel: Done / In Progress / Pending / N.A. */
const statusMeta: Record<SchrittStatus, { label: string; chip: string; marke: string; text: string }> = {
  done: { label: "Done", chip: "border-seil-line bg-seil-surface", marke: "text-seil-success", text: "text-seil-body" },
  in_progress: { label: "In Progress", chip: "border-seil-accent bg-seil-accent-bg", marke: "text-seil-accent", text: "text-seil-text" },
  pending: { label: "Pending", chip: "border-seil-line bg-seil-surface", marke: "text-seil-muted", text: "text-seil-muted" },
  na: { label: "N.A.", chip: "border-dashed border-seil-line bg-seil-surface", marke: "text-seil-muted", text: "text-seil-muted" },
};

function SchrittChip({
  index,
  status,
  ausgewaehlt,
  panelId,
  onToggle,
}: {
  index: number;
  status: SchrittStatus;
  ausgewaehlt: boolean;
  panelId: string;
  onToggle: () => void;
}) {
  const schritt = PROZESS_SCHRITTE[index];
  const freigabe = index === FREIGABE_SCHRITT_INDEX;
  const meta = statusMeta[status];
  const rahmen = ausgewaehlt
    ? "border-seil-accent bg-seil-card-alt"
    : freigabe && status !== "done"
      ? "border-seil-warning bg-seil-warning-bg"
      : meta.chip;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={ausgewaehlt}
      aria-controls={panelId}
      aria-current={status === "in_progress" ? "step" : undefined}
      title={`${schritt.nr}. ${schritt.lang} – ${meta.label}`}
      className={`flex min-w-0 items-center gap-1.5 rounded-seil border px-2 py-1.5 text-left transition-colors hover:border-seil-accent ${rahmen}`}
    >
      <span
        className={`flex w-5 shrink-0 justify-center text-kicker tabular-nums ${meta.marke} ${
          status === "in_progress" ? "seil-puls-sanft" : ""
        }`}
        aria-hidden
      >
        {status === "done" ? (
          <Check size={ICON_SM} strokeWidth={ICON_STROKE} />
        ) : status === "na" ? (
          <CircleSlash size={ICON_SM} strokeWidth={ICON_STROKE} />
        ) : freigabe ? (
          <UserCheck size={ICON_SM} strokeWidth={ICON_STROKE} />
        ) : (
          schritt.nr
        )}
      </span>
      <span className={`truncate text-kicker ${meta.text} ${status === "in_progress" ? "font-medium" : ""}`}>
        {schritt.kurz}
        <span className="sr-only"> – {meta.label}</span>
      </span>
    </button>
  );
}

function SchrittDetail({ objekt, index, panelId }: { objekt: Objekt; index: number; panelId: string }) {
  const schritt = PROZESS_SCHRITTE[index];
  const status = objekt.schritte[index];
  const vMeta = verantwortungMeta[schritt.verantwortung];
  const sMeta = statusMeta[status];
  const aktiv = status === "in_progress";
  const offeneAufgaben = aktiv ? aufgabenZuObjekt(objekt.id) : [];
  const letzteAktivitaeten = aktiv ? aktivitaetenZu({ objektId: objekt.id }).slice(0, 3) : [];

  return (
    <div id={panelId} className="flex flex-col gap-3 rounded-seil border border-seil-line bg-seil-surface px-3 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-body text-seil-text">
          {schritt.nr}. {schritt.lang}
        </span>
        <Badge tone={vMeta.tone} icon={vMeta.icon}>
          {vMeta.label}
        </Badge>
        <Badge tone={status === "done" ? "success" : aktiv ? "accent" : "neutral"}>{sMeta.label}</Badge>
        <span className="ml-auto text-kicker text-seil-muted">
          Verantwortlich: {schritt.verantwortlich} · Tool heute: {schritt.tool}
        </span>
      </div>
      <p className="max-w-[80ch] text-seil-muted">{schritt.beschreibung}</p>

      {aktiv && offeneAufgaben.length > 0 ? (
        <div className="flex flex-col gap-1.5 border-t border-seil-line pt-3">
          <Kicker>Offene Aufgaben zu diesem Objekt</Kicker>
          <ul className="flex flex-col gap-1">
            {offeneAufgaben.map((t) => {
              const f = faelligLabel(t.faellig);
              const zust = mitarbeiterVon(t.mitarbeiterId);
              return (
                <li key={t.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="text-seil-body">{t.titel}</span>
                  <span className={f.ton === "crit" ? "text-kicker text-seil-danger" : f.ton === "warn" ? "text-kicker text-seil-warning" : "text-kicker text-seil-muted"}>
                    {f.text} · {zust?.kuerzel}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {aktiv && letzteAktivitaeten.length > 0 ? (
        <div className="flex flex-col gap-1.5 border-t border-seil-line pt-3">
          <Kicker>Zuletzt passiert</Kicker>
          <ul className="flex flex-col gap-1">
            {letzteAktivitaeten.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="text-kicker text-seil-muted">{fmtDatumKurz(a.datum)}</span>
                <span className="min-w-0 text-seil-body">{a.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Prozessleiste nach der Team-Excel: 26 Schritte in 4 Phasen, Statusvokabular
 * Done / In Progress / Pending / N.A. – mehrere Schritte können parallel laufen.
 * Die 4 Phasen sind sichtbar zweigeteilt (Auftraggeber- → Investorenseite,
 * Anforderung aus dem Kundentermin – siehe ANNAHMEN.md Punkt 47).
 * Jeder Schritt ist klickbar und öffnet ein Detailpanel (Beschreibung,
 * Verantwortung, Tool; beim laufenden Schritt Aufgaben + letzte Aktivitäten).
 */
export function Prozessleiste({ objekt }: { objekt: Objekt }) {
  const panelId = useId();
  const start = objekt.schritte.findIndex((st) => st === "in_progress");
  const [auswahl, setAuswahl] = useState<number | null>(start >= 0 ? start : null);
  const f = prozessFortschritt(objekt);

  const toggle = (i: number) => setAuswahl((cur) => (cur === i ? null : i));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Kicker>Transaktionsprozess · Struktur aus der Team-Liste</Kicker>
        <span className="text-kicker text-seil-muted">
          {f.done}/{f.gesamt} Schritten erledigt · N.A. zählt nicht mit
        </span>
      </div>

      {PROZESS_PHASEN.map((phase, p) => (
        <div key={phase.titel} className="flex flex-col gap-2">
          {p === 0 || PROZESS_PHASEN[p - 1].seite !== phase.seite ? (
            <div className={`flex items-center gap-3 ${p === 0 ? "" : "mt-2"}`}>
              <span className="text-kicker tracking-kicker uppercase text-seil-body">
                {SEITEN_LABEL[phase.seite]}
              </span>
              <span className="h-px flex-1 bg-seil-line" aria-hidden />
            </div>
          ) : null}
          <Kicker>{phase.titel}</Kicker>
          <div className="flex flex-wrap gap-1.5">
            {PROZESS_SCHRITTE.map((sch, i) =>
              sch.nr >= phase.vonNr && sch.nr <= phase.bisNr ? (
                <SchrittChip
                  key={sch.nr}
                  index={i}
                  status={objekt.schritte[i]}
                  ausgewaehlt={auswahl === i}
                  panelId={panelId}
                  onToggle={() => toggle(i)}
                />
              ) : null,
            )}
          </div>
        </div>
      ))}

      {auswahl !== null ? (
        <SchrittDetail objekt={objekt} index={auswahl} panelId={panelId} />
      ) : (
        <p id={panelId} className="flex items-center gap-2 text-kicker text-seil-muted">
          <ChevronDown size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
          Schritt anklicken für Details – Beschreibung, Verantwortung, heutiges Tool.
        </p>
      )}
    </div>
  );
}
