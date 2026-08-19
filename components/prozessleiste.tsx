"use client";

import { useId, useState } from "react";
import { Bot, Check, ChevronDown, UserCheck, Users } from "lucide-react";
import {
  EIGENTUEMER_SCHRITTE,
  EIGENTUEMER_SCHRITTE_KURZ,
  EIGENTUEMER_SCHRITT_INFO,
  FREIGABE_SCHRITT_INDEX,
  INVESTOREN_SCHRITTE,
  INVESTOREN_SCHRITTE_KURZ,
  INVESTOREN_SCHRITT_INFO,
  type SchrittInfo,
} from "@/lib/mock-data";
import {
  aktivitaetenZu,
  aufgabenZuObjekt,
  faelligLabel,
  fmtDatumKurz,
  mitarbeiterVon,
} from "@/lib/derive";
import type { Objekt, PhaseStatus } from "@/lib/types";
import { Badge, ICON_SM, ICON_STROKE } from "@/components/ui";
import { Kicker } from "@/components/cockpit";

/** Eindeutige Adresse eines Schritts über beide Seiten hinweg. */
type SchrittRef = { seite: "e" | "i"; index: number };

const verantwortungMeta = {
  team: { label: "Team", icon: Users, tone: "neutral" as const },
  automatik: { label: "Automatik", icon: Bot, tone: "info" as const },
  freigabe: { label: "Manuelle Freigabe", icon: UserCheck, tone: "warning" as const },
};

function SchrittChip({
  nr,
  kurz,
  lang,
  status,
  freigabeSchritt,
  ausgewaehlt,
  panelId,
  onToggle,
}: {
  nr: number;
  kurz: string;
  lang: string;
  status: PhaseStatus;
  freigabeSchritt: boolean;
  ausgewaehlt: boolean;
  panelId: string;
  onToggle: () => void;
}) {
  const rahmen = ausgewaehlt
    ? "border-seil-accent bg-seil-card-alt"
    : status === "aktiv"
      ? freigabeSchritt
        ? "border-seil-warning bg-seil-warning-bg"
        : "border-seil-accent bg-seil-accent-bg"
      : "border-seil-line bg-seil-surface";

  const marke =
    status === "abgeschlossen"
      ? "text-seil-success"
      : status === "aktiv"
        ? freigabeSchritt
          ? "text-seil-warning"
          : "text-seil-accent"
        : "text-seil-muted";

  const text =
    status === "aktiv"
      ? "text-seil-text"
      : status === "abgeschlossen"
        ? "text-seil-body"
        : "text-seil-muted";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={ausgewaehlt}
      aria-controls={panelId}
      aria-current={status === "aktiv" ? "step" : undefined}
      title={lang}
      className={`flex min-w-0 items-center gap-2 rounded-seil border px-2 py-2 text-left transition-colors hover:border-seil-accent ${rahmen}`}
    >
      <span className={`flex w-4 shrink-0 justify-center text-kicker ${marke}`} aria-hidden>
        {status === "abgeschlossen" ? (
          <Check size={ICON_SM} strokeWidth={ICON_STROKE} />
        ) : freigabeSchritt ? (
          <UserCheck size={ICON_SM} strokeWidth={ICON_STROKE} />
        ) : (
          nr
        )}
      </span>
      {/* Status haengt nie an der Farbe allein: aktiv traegt zusaetzlich Gewicht + sr-Text. */}
      <span className={`truncate text-kicker ${text} ${status === "aktiv" ? "font-medium" : ""}`}>
        {kurz}
        <span className="sr-only">
          {status === "aktiv"
            ? " – aktueller Schritt"
            : status === "abgeschlossen"
              ? " – abgeschlossen"
              : " – offen"}
        </span>
      </span>
    </button>
  );
}

function SchrittDetail({
  objekt,
  refSchritt,
  panelId,
}: {
  objekt: Objekt;
  refSchritt: SchrittRef;
  panelId: string;
}) {
  const investorenSeite = refSchritt.seite === "i";
  const lang = investorenSeite
    ? INVESTOREN_SCHRITTE[refSchritt.index]
    : EIGENTUEMER_SCHRITTE[refSchritt.index];
  const info: SchrittInfo = investorenSeite
    ? INVESTOREN_SCHRITT_INFO[refSchritt.index]
    : EIGENTUEMER_SCHRITT_INFO[refSchritt.index];
  const status = investorenSeite
    ? objekt.investorenPhasen[refSchritt.index]
    : objekt.eigentuemerPhasen[refSchritt.index];
  const vMeta = verantwortungMeta[info.verantwortung];

  const aktiv = status === "aktiv";
  const offeneAufgaben = aktiv ? aufgabenZuObjekt(objekt.id) : [];
  const letzteAktivitaeten = aktiv ? aktivitaetenZu({ objektId: objekt.id }).slice(0, 3) : [];

  return (
    <div
      id={panelId}
      className="flex flex-col gap-3 rounded-seil border border-seil-line bg-seil-surface px-3 py-3"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-body text-seil-text">
          {refSchritt.index + 1}. {lang}
        </span>
        <Badge tone={vMeta.tone} icon={vMeta.icon}>
          {vMeta.label}
        </Badge>
        <Badge tone={status === "abgeschlossen" ? "success" : aktiv ? "accent" : "neutral"}>
          {status === "abgeschlossen" ? "abgeschlossen" : aktiv ? "aktueller Schritt" : "offen"}
        </Badge>
      </div>
      <p className="max-w-[80ch] text-seil-muted">{info.beschreibung}</p>

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
                  <span
                    className={
                      f.ton === "crit"
                        ? "text-kicker text-seil-danger"
                        : f.ton === "warn"
                          ? "text-kicker text-seil-warning"
                          : "text-kicker text-seil-muted"
                    }
                  >
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

function Seite({
  label,
  kurz,
  schritte,
  status,
  seite,
  auswahl,
  panelId,
  onToggle,
}: {
  label: string;
  kurz: readonly string[];
  schritte: readonly string[];
  status: PhaseStatus[];
  seite: "e" | "i";
  auswahl: SchrittRef | null;
  panelId: string;
  onToggle: (ref: SchrittRef) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Kicker>{label}</Kicker>
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
        {schritte.map((lang, i) => (
          <SchrittChip
            key={lang}
            nr={i + 1}
            kurz={kurz[i]}
            lang={`${i + 1}. ${lang}`}
            status={status[i]}
            freigabeSchritt={seite === "i" && i === FREIGABE_SCHRITT_INDEX}
            ausgewaehlt={auswahl?.seite === seite && auswahl.index === i}
            panelId={panelId}
            onToggle={() => onToggle({ seite, index: i })}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Prozessleiste über beide Seiten – interaktiv, wie im Kickoff gewünscht:
 * jeder Schritt ist anklickbar und öffnet ein Detailpanel (Beschreibung,
 * Verantwortung, beim aktiven Schritt zusätzlich Aufgaben und letzte Aktivitäten).
 */
export function Prozessleiste({ objekt }: { objekt: Objekt }) {
  const panelId = useId();

  // Vorauswahl: der aktive Schritt (Investorenseite hat Vorrang).
  const iAktiv = objekt.investorenPhasen.indexOf("aktiv");
  const eAktiv = objekt.eigentuemerPhasen.indexOf("aktiv");
  const start: SchrittRef | null =
    iAktiv >= 0 ? { seite: "i", index: iAktiv } : eAktiv >= 0 ? { seite: "e", index: eAktiv } : null;

  const [auswahl, setAuswahl] = useState<SchrittRef | null>(start);

  const toggle = (ref: SchrittRef) =>
    setAuswahl((cur) => (cur && cur.seite === ref.seite && cur.index === ref.index ? null : ref));

  return (
    <div className="flex flex-col gap-4">
      <Seite
        label="Eigentümerseite · Akquise & Datenraum"
        schritte={EIGENTUEMER_SCHRITTE}
        kurz={EIGENTUEMER_SCHRITTE_KURZ}
        status={objekt.eigentuemerPhasen}
        seite="e"
        auswahl={auswahl}
        panelId={panelId}
        onToggle={toggle}
      />
      <Seite
        label="Investorenseite · Vermarktung & Follow-up"
        schritte={INVESTOREN_SCHRITTE}
        kurz={INVESTOREN_SCHRITTE_KURZ}
        status={objekt.investorenPhasen}
        seite="i"
        auswahl={auswahl}
        panelId={panelId}
        onToggle={toggle}
      />

      {auswahl ? (
        <SchrittDetail objekt={objekt} refSchritt={auswahl} panelId={panelId} />
      ) : (
        <p id={panelId} className="flex items-center gap-2 text-kicker text-seil-muted">
          <ChevronDown size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
          Schritt anklicken für Details – Beschreibung, Verantwortung, Aufgaben.
        </p>
      )}
    </div>
  );
}
