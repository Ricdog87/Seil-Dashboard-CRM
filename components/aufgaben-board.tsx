"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Euro,
  FilePenLine,
  FileText,
  FolderOpen,
  GripVertical,
  Phone,
  TriangleAlert,
  UserCheck,
} from "lucide-react";
import { fmtDatum, mitarbeiterVon, objektVon, plusTage } from "@/lib/derive";
import { aufgaben, HEUTE } from "@/lib/mock-data";
import type { Aufgabe, AufgabenTyp } from "@/lib/types";
import { Badge, ICON_SM, ICON_STROKE, type Tone } from "@/components/ui";
import { Kicker } from "@/components/cockpit";
import { useSitzung } from "./sitzung";

const typMeta: Record<AufgabenTyp, { label: string; tone: Tone; icon: LucideIcon }> = {
  broker_call: { label: "Broker Call", tone: "accent", icon: Phone },
  preisanfrage: { label: "Preisanfrage", tone: "success", icon: Euro },
  freigabe: { label: "Freigabe", tone: "warning", icon: UserCheck },
  datenraum: { label: "Datenraum", tone: "neutral", icon: FolderOpen },
  unterlagen: { label: "Unterlagen", tone: "neutral", icon: FileText },
  nda: { label: "NDA", tone: "neutral", icon: FilePenLine },
  sonstiges: { label: "Aufgabe", tone: "neutral", icon: ClipboardList },
};

const MORGEN = plusTage(HEUTE, 1);
const UEBERMORGEN = plusTage(HEUTE, 2);

type SpaltenId = "heute" | "morgen" | "spaeter" | "erledigt";

const SPALTEN: { id: SpaltenId; titel: string; hinweis: string }[] = [
  { id: "heute", titel: "Heute", hinweis: "inkl. Überfälliges" },
  { id: "morgen", titel: "Morgen", hinweis: fmtDatum(MORGEN) },
  { id: "spaeter", titel: "Später", hinweis: `ab ${fmtDatum(UEBERMORGEN)}` },
  { id: "erledigt", titel: "Erledigt", hinweis: "hierher ziehen = abhaken" },
];

function spalteVon(t: Aufgabe): SpaltenId {
  if (t.erledigt) return "erledigt";
  if (t.faellig <= HEUTE) return "heute";
  if (t.faellig === MORGEN) return "morgen";
  return "spaeter";
}

function AufgabenKarte({
  aufgabe,
  amZiehen,
  onDragStart,
  onDragEnd,
}: {
  aufgabe: Aufgabe;
  amZiehen: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const meta = typMeta[aufgabe.typ];
  const obj = aufgabe.objektId ? objektVon(aufgabe.objektId) : undefined;
  const zust = mitarbeiterVon(aufgabe.mitarbeiterId);
  const ueberfaellig = !aufgabe.erledigt && aufgabe.faellig < HEUTE;
  const brokerCall = aufgabe.typ === "broker_call" && !aufgabe.erledigt;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`flex cursor-grab flex-col gap-2 rounded-seil border px-3 py-2.5 active:cursor-grabbing ${
        amZiehen ? "border-seil-accent opacity-60" : "border-seil-line"
      } ${brokerCall ? "bg-seil-accent-bg" : "bg-seil-card"}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          size={ICON_SM}
          strokeWidth={ICON_STROKE}
          className="mt-0.5 shrink-0 text-seil-muted"
          aria-hidden
        />
        <p className={`min-w-0 flex-1 ${aufgabe.erledigt ? "text-seil-muted" : "text-seil-text"}`}>
          {aufgabe.titel}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-6 text-kicker text-seil-muted">
        <Badge tone={meta.tone} icon={meta.icon}>
          {meta.label}
        </Badge>
        {ueberfaellig ? (
          <span className="inline-flex items-center gap-1 text-seil-danger">
            <TriangleAlert size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
            überfällig seit {fmtDatum(aufgabe.faellig)}
          </span>
        ) : (
          <span>{aufgabe.erledigt ? "erledigt" : fmtDatum(aufgabe.faellig)}</span>
        )}
        {obj ? <span className="truncate">· {obj.name}</span> : null}
        <span>· {zust?.kuerzel}</span>
      </div>
    </div>
  );
}

/**
 * Aufgaben als Kanban: Die Spalten sind Fälligkeits-Horizonte, keine
 * Prozessphasen – eine Karte ziehen heißt umplanen, „Erledigt“ heißt abhaken.
 * Änderungen laufen über den geteilten Sitzungszustand und bleiben dadurch
 * synchron mit Liste und „Meine Aufgaben“ (Prototyp: nur diese Sitzung).
 */
export function AufgabenBoard({ filterId }: { filterId: string }) {
  const { aufgabenPatches, patchAufgabe } = useSitzung();
  const [zieheId, setZieheId] = useState<string | null>(null);
  const [ueberSpalte, setUeberSpalte] = useState<SpaltenId | null>(null);

  const effektiv = aufgaben
    .map((t) => ({ ...t, ...aufgabenPatches[t.id] }))
    .filter((t) => filterId === "alle" || t.mitarbeiterId === filterId)
    .sort((a, b) => (a.faellig < b.faellig ? -1 : 1));

  const ablegen = (spalte: SpaltenId) => {
    if (!zieheId) return;
    const karte = effektiv.find((t) => t.id === zieheId);
    setUeberSpalte(null);
    setZieheId(null);
    if (!karte || spalteVon(karte) === spalte) return;
    if (spalte === "erledigt") {
      patchAufgabe(karte.id, { erledigt: true });
    } else if (spalte === "heute") {
      patchAufgabe(karte.id, { erledigt: false, faellig: HEUTE });
    } else if (spalte === "morgen") {
      patchAufgabe(karte.id, { erledigt: false, faellig: MORGEN });
    } else {
      // Später: frühester Tag des Horizonts; das echte System fragt nach einem Datum.
      patchAufgabe(karte.id, {
        erledigt: false,
        faellig: karte.faellig >= UEBERMORGEN ? karte.faellig : UEBERMORGEN,
      });
    }
  };

  return (
    <div className="grid grid-cols-2 items-start gap-3 lg:grid-cols-4">
      {SPALTEN.map((sp) => {
        const karten = effektiv.filter((t) => spalteVon(t) === sp.id);
        const hervorgehoben = ueberSpalte === sp.id && zieheId !== null;
        return (
          <div
            key={sp.id}
            role="list"
            aria-label={`${sp.titel} (${karten.length})`}
            onDragOver={(e) => {
              e.preventDefault();
              setUeberSpalte(sp.id);
            }}
            onDragLeave={() => setUeberSpalte((cur) => (cur === sp.id ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              ablegen(sp.id);
            }}
            className={`flex min-h-40 flex-col gap-2 rounded-seil border px-2 py-2 transition-colors ${
              hervorgehoben ? "border-seil-accent bg-seil-accent-bg" : "border-seil-line bg-seil-surface"
            }`}
          >
            <div className="flex min-w-0 items-baseline justify-between gap-2 px-1">
              <span className="inline-flex min-w-0 items-baseline gap-2">
                <Kicker>{sp.titel}</Kicker>
                <span className="truncate text-kicker text-seil-muted">{sp.hinweis}</span>
              </span>
              <span className="shrink-0 text-kicker text-seil-muted">{karten.length}</span>
            </div>
            {karten.length === 0 ? (
              <p className="px-1 pb-1 text-kicker text-seil-muted">
                {hervorgehoben ? "hier ablegen" : "keine Aufgaben"}
              </p>
            ) : (
              karten.map((t) => (
                <div key={t.id} role="listitem">
                  <AufgabenKarte
                    aufgabe={t}
                    amZiehen={zieheId === t.id}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", t.id);
                      e.dataTransfer.effectAllowed = "move";
                      setZieheId(t.id);
                    }}
                    onDragEnd={() => {
                      setZieheId(null);
                      setUeberSpalte(null);
                    }}
                  />
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
