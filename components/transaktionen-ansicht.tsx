"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, TriangleAlert } from "lucide-react";
import {
  aktiverSchritt,
  aufgabenZuObjekt,
  datenraumFortschritt,
  fmtMio,
  istUeberfaellig,
  linksZuObjekt,
  mitarbeiterVon,
  PIPELINE_STUFEN,
  pipelineStufe,
} from "@/lib/derive";
import { objekte } from "@/lib/mock-data";
import type { Objekt } from "@/lib/types";
import {
  Badge,
  Card,
  CardHeader,
  ICON_SM,
  ICON_STROKE,
  Table,
  Tabs,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import { EntityLink, Fortschritt, Kicker } from "@/components/cockpit";
import { KlickZeile } from "@/components/klick-zeile";

/* --- Board-Karte ----------------------------------------------------------- */

function ObjektKarte({ objekt }: { objekt: Objekt }) {
  const router = useRouter();
  const phase = aktiverSchritt(objekt);
  const dr = datenraumFortschritt(objekt);
  const aufgaben = aufgabenZuObjekt(objekt.id);
  const zust = mitarbeiterVon(objekt.zustaendigId);
  const handlungsbedarf = linksZuObjekt(objekt.id).some(
    (l) => (l.status === "angeschrieben" && l.followUpStufe === 3) || istUeberfaellig(l.naechstesFollowUp),
  );

  return (
    <button
      type="button"
      onClick={() => router.push(`/objekte/${objekt.id}`)}
      className="flex w-full flex-col gap-2 rounded-seil border border-seil-line bg-seil-card px-3 py-3 text-left transition-colors hover:border-seil-accent"
    >
      <span className="flex items-start justify-between gap-2">
        <span>
          <span className="block text-seil-text">{objekt.name}</span>
          <span className="block text-kicker text-seil-muted">
            {objekt.stadt} · {objekt.assetklasse}
          </span>
        </span>
        <ChevronRight
          size={ICON_SM}
          strokeWidth={ICON_STROKE}
          className="mt-1 shrink-0 text-seil-muted"
          aria-hidden
        />
      </span>

      <span className="flex flex-wrap items-center gap-2">
        <Badge tone={phase.seite === "Investoren" ? "accent" : "neutral"}>
          {phase.nr} {phase.titel}
        </Badge>
        {objekt.merkmal ? <Badge tone="neutral">{objekt.merkmal}</Badge> : null}
        {handlungsbedarf ? (
          <Badge tone="danger" icon={TriangleAlert}>
            nachfassen
          </Badge>
        ) : null}
      </span>

      <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-kicker text-seil-muted">
        <span className="text-seil-body">{fmtMio(objekt.kaufpreisMio)}</span>
        {dr ? <Fortschritt vorhanden={dr.vorhanden} gesamt={dr.gesamt} /> : <span>Datenraum –</span>}
        <span>
          {aufgaben.length} Aufg. · {zust?.kuerzel}
        </span>
      </span>
    </button>
  );
}

/* --- Board ----------------------------------------------------------------- */

function TransaktionsBoard() {
  const spalten = PIPELINE_STUFEN.map((label, i) => ({
    label,
    objekte: objekte.filter((o) => pipelineStufe(o) === i),
  }));

  return (
    <div className="grid grid-cols-2 items-start gap-3 md:grid-cols-3 lg:grid-cols-5" role="list">
      {spalten.map((sp) => (
        <div
          key={sp.label}
          role="listitem"
          className="flex flex-col gap-2 rounded-seil border border-seil-line bg-seil-surface px-2 py-2"
        >
          <div className="flex items-baseline justify-between gap-2 px-1">
            <Kicker>{sp.label}</Kicker>
            <span className="text-kicker text-seil-muted">{sp.objekte.length}</span>
          </div>
          {sp.objekte.length === 0 ? (
            <p className="px-1 pb-1 text-kicker text-seil-muted">keine Transaktion</p>
          ) : (
            sp.objekte.map((o) => <ObjektKarte key={o.id} objekt={o} />)
          )}
        </div>
      ))}
    </div>
  );
}

/* --- Tabelle (bisherige Ansicht) ------------------------------------------- */

function TransaktionsTabelle() {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Objekt</TH>
          <TH>Assetklasse</TH>
          <TH numeric>Kaufpreis</TH>
          <TH>Aktuelle Phase</TH>
          <TH>Datenraum</TH>
          <TH numeric>Aufgaben</TH>
          <TH numeric>Investoren</TH>
          <TH>Zuständig</TH>
          <TH aria-hidden />
        </TR>
      </THead>
      <TBody>
        {objekte.map((o) => {
          const phase = aktiverSchritt(o);
          const dr = datenraumFortschritt(o);
          const links = linksZuObjekt(o.id);
          const offeneAufgaben = aufgabenZuObjekt(o.id).length;
          const zust = mitarbeiterVon(o.zustaendigId);
          return (
            <KlickZeile key={o.id} href={`/objekte/${o.id}`}>
              <TD>
                <EntityLink href={`/objekte/${o.id}`}>{o.name}</EntityLink>
                <div className="text-kicker text-seil-muted">{o.stadt}</div>
              </TD>
              <TD className="text-seil-muted">{o.assetklasse}</TD>
              <TD numeric>{fmtMio(o.kaufpreisMio)}</TD>
              <TD>
                <Badge tone={phase.seite === "Investoren" ? "accent" : "neutral"}>
                  {phase.seite} · {phase.nr} {phase.titel}
                </Badge>
              </TD>
              <TD>
                {dr ? (
                  <Fortschritt vorhanden={dr.vorhanden} gesamt={dr.gesamt} />
                ) : (
                  <span className="text-seil-muted">nicht angefordert</span>
                )}
              </TD>
              <TD numeric>{offeneAufgaben}</TD>
              <TD numeric>{links.length}</TD>
              <TD className="whitespace-nowrap text-seil-muted">{zust?.kuerzel}</TD>
              <TD className="w-8">
                <ChevronRight
                  size={ICON_SM}
                  strokeWidth={ICON_STROKE}
                  className="text-seil-muted"
                  aria-hidden
                />
              </TD>
            </KlickZeile>
          );
        })}
      </TBody>
    </Table>
  );
}

/* --- Umschalter ------------------------------------------------------------ */

/**
 * Laufende Transaktionen in zwei Projektionen derselben Daten:
 * Tabelle (dicht, sortiert) und Board (Pipeline-Spalten, Karte je Objekt).
 * Das Board verdichtet die 12 Prozessschritte auf 5 Stufen.
 */
export function TransaktionenAnsicht() {
  const [ansicht, setAnsicht] = useState<string>("tabelle");

  return (
    <Card className="mt-6">
      <CardHeader
        title="Laufende Transaktionen"
        meta={
          <span className="inline-flex items-center gap-4">
            <span className="hidden sm:inline">
              {ansicht === "tabelle"
                ? "Zeile anklicken für Objekt-Detail"
                : "Karte anklicken für Objekt-Detail"}
            </span>
            <Tabs
              label="Ansicht der Transaktionen"
              activeId={ansicht}
              onChange={setAnsicht}
              items={[
                { id: "tabelle", label: "Tabelle" },
                { id: "board", label: "Board" },
              ]}
            />
          </span>
        }
      />
      {ansicht === "tabelle" ? (
        <TransaktionsTabelle />
      ) : (
        <div className="px-3 py-3">
          <TransaktionsBoard />
        </div>
      )}
    </Card>
  );
}
