"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, TriangleAlert } from "lucide-react";
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
  prozessFortschritt,
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
  const vertretung = objekt.vertretungId ? mitarbeiterVon(objekt.vertretungId) : undefined;
  const pf = prozessFortschritt(objekt);
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
        <Badge tone={phase.phase >= 3 ? "accent" : "neutral"}>
          P{phase.phase} · {phase.nr} {phase.titel}
        </Badge>
        {phase.weitere > 0 ? <Badge tone="neutral">+{phase.weitere} parallel</Badge> : null}
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
          {pf.done}/{pf.gesamt} · {aufgaben.length} Aufg. · {zust?.kuerzel}
          {vertretung ? `/${vertretung.kuerzel}` : ""}
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
    <div className="grid grid-cols-2 items-start gap-3 md:grid-cols-4 lg:grid-cols-4" role="list">
      {spalten.map((sp) => (
        <div
          key={sp.label}
          role="listitem"
          className="flex flex-col gap-2 rounded-seil border border-seil-line bg-seil-surface px-2 py-2"
        >
          <div className="flex min-w-0 items-baseline justify-between gap-2 px-1">
            <Kicker>{sp.label}</Kicker>
            <span className="shrink-0 text-kicker text-seil-muted">{sp.objekte.length}</span>
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

/* --- Tabelle (sortierbar) --------------------------------------------------- */

type SortKey = "name" | "preis" | "phase" | "datenraum" | "aufgaben" | "investoren";

const sortWert: Record<SortKey, (o: Objekt) => number | string> = {
  name: (o) => o.name,
  preis: (o) => o.kaufpreisMio,
  phase: (o) => aktiverSchritt(o).nr,
  datenraum: (o) => datenraumFortschritt(o)?.vorhanden ?? -1,
  aufgaben: (o) => aufgabenZuObjekt(o.id).length,
  investoren: (o) => linksZuObjekt(o.id).length,
};

function SortKopf({
  spalte,
  label,
  numeric = false,
  sortKey,
  richtung,
  onSort,
}: {
  spalte: SortKey;
  label: string;
  numeric?: boolean;
  sortKey: SortKey | null;
  richtung: 1 | -1;
  onSort: (k: SortKey) => void;
}) {
  const aktiv = sortKey === spalte;
  const Pfeil = aktiv ? (richtung === 1 ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TH numeric={numeric} aria-sort={aktiv ? (richtung === 1 ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(spalte)}
        className={`inline-flex items-center gap-1 tracking-kicker uppercase transition-colors ${
          aktiv ? "text-seil-text" : "hover:text-seil-text"
        }`}
      >
        {label}
        <Pfeil
          size={ICON_SM}
          strokeWidth={ICON_STROKE}
          className={aktiv ? "" : "text-seil-line"}
          aria-hidden
        />
      </button>
    </TH>
  );
}

function TransaktionsTabelle() {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [richtung, setRichtung] = useState<1 | -1>(1);

  const sortiere = (k: SortKey) => {
    if (sortKey === k) {
      setRichtung((r) => (r === 1 ? -1 : 1));
    } else {
      setSortKey(k);
      setRichtung(k === "name" ? 1 : -1); // Zahlen standardmäßig absteigend
    }
  };

  const zeilen = [...objekte];
  if (sortKey) {
    zeilen.sort((a, b) => {
      const wa = sortWert[sortKey](a);
      const wb = sortWert[sortKey](b);
      const cmp = typeof wa === "string" ? wa.localeCompare(wb as string, "de") : (wa as number) - (wb as number);
      return cmp * richtung;
    });
  }

  const kopf = { sortKey, richtung, onSort: sortiere };

  return (
    <Table>
      <THead>
        <TR>
          <SortKopf spalte="name" label="Objekt" {...kopf} />
          <TH>Assetklasse</TH>
          <SortKopf spalte="preis" label="Kaufpreis" numeric {...kopf} />
          <SortKopf spalte="phase" label="Aktuelle Phase" {...kopf} />
          <SortKopf spalte="datenraum" label="Datenraum" {...kopf} />
          <SortKopf spalte="aufgaben" label="Aufgaben" numeric {...kopf} />
          <SortKopf spalte="investoren" label="Investoren" numeric {...kopf} />
          <TH>Zuständig</TH>
          <TH aria-hidden />
        </TR>
      </THead>
      <TBody>
        {zeilen.map((o) => {
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
                <Badge tone={phase.phase >= 3 ? "accent" : "neutral"}>
                  P{phase.phase} · {phase.nr} {phase.titel}
                </Badge>
                {phase.weitere > 0 ? (
                  <div className="mt-1 text-kicker text-seil-muted">+{phase.weitere} parallel in Arbeit</div>
                ) : null}
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
 * Tabelle (dicht, sortiert) und Board (eine Spalte je Phase, Karte je Objekt).
 * Jede Karte hängt in der Phase ihres weitesten laufenden Schritts.
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
