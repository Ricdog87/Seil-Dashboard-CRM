"use client";

import { Eye, FolderOpen, TriangleAlert } from "lucide-react";
import {
  aktiverSchritt,
  fmtMio,
  GEANTWORTET,
  hatDatenraumLuecke,
  inVermarktungskontext,
  istUeberfaellig,
  linksZuObjekt,
  mitarbeiterVon,
  PIPELINE_STUFEN,
  pipelineStufe,
  prozessFortschritt,
} from "@/lib/derive";
import { aufgaben, GF_ID, HEUTE, mitarbeiter, objekte } from "@/lib/mock-data";
import { useObjekteLive } from "@/components/modul01";
import type { KontaktStatus } from "@/lib/types";
import {
  Badge,
  Card,
  CardHeader,
  ICON_SM,
  ICON_STROKE,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import { EntityLink, Kicker } from "@/components/cockpit";
import { BerichtExport } from "@/components/bericht-export";
import { HeuteKopf } from "@/components/heute-kopf";
import { KlickZeile } from "@/components/klick-zeile";
import { AktivitaetenTicker } from "@/components/ticker";
import { WeltUhren } from "@/components/weltuhren";
import { useSitzung } from "./sitzung";

/** Honorarmodell nur als Platzhalter – Satz ist mit SEIL zu klären (ANNAHMEN.md, Punkt 43). */
const HONORAR_SATZ = 0.015;

const POSITIV: KontaktStatus[] = [
  "interesse",
  "preisanfrage",
  "nda_unterzeichnet",
  "datenraum_freigegeben",
];

function GfKpi({ label, wert, sub }: { label: string; wert: string; sub?: string }) {
  return (
    <Card className="px-4 py-3">
      <Kicker>{label}</Kicker>
      {/* Mobil eine Stufe kleiner, und der Betrag bricht nie mitten im „Mio. €“. */}
      <div className="mt-2 text-title tabular-nums text-seil-text sm:text-display">
        {wert.replace(/ /g, " ")}
      </div>
      {sub ? <p className="mt-2 text-kicker text-seil-muted">{sub}</p> : null}
    </Card>
  );
}

/** Eine Kennzahl als Zeile: Label links, dünner Balken, Wert rechts – direkt beschriftet. */
function BalkenZeile({
  label,
  detail,
  anteil,
  wert,
}: {
  label: string;
  detail?: string;
  anteil: number; // 0–1 relativ zum Maximum der Gruppe
  wert: string;
}) {
  return (
    // Mobil steht das Label über dem Balken, ab sm daneben – nichts wird abgeschnitten.
    <div className="flex flex-col gap-1 px-4 py-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="truncate text-body text-seil-body sm:w-64 sm:shrink-0">
        {label}
        {detail ? <span className="text-seil-muted"> · {detail}</span> : null}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-seil-card-alt">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-seil-accent"
            style={{ width: `${Math.max(anteil * 100, anteil > 0 ? 2 : 0)}%` }}
            aria-hidden
          />
        </span>
        <span className="w-24 shrink-0 text-right text-body tabular-nums text-seil-text">
          {wert}
        </span>
      </span>
    </div>
  );
}

function AufmerksamkeitZeile({
  text,
  wert,
  ton,
}: {
  text: string;
  wert: number;
  ton: "danger" | "warning";
}) {
  const kritisch = wert > 0;
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2">
      <span className="inline-flex items-center gap-2 text-seil-body">
        {kritisch ? (
          <TriangleAlert
            size={ICON_SM}
            strokeWidth={ICON_STROKE}
            className={ton === "danger" ? "text-seil-danger" : "text-seil-warning"}
            aria-hidden
          />
        ) : (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-seil-success" aria-hidden />
        )}
        {text}
      </span>
      <span
        className={`tabular-nums ${
          kritisch ? (ton === "danger" ? "text-seil-danger" : "text-seil-warning") : "text-seil-muted"
        }`}
      >
        {wert}
      </span>
    </li>
  );
}

/**
 * Der Geschäftsführungs-Blick: erscheint, wenn „Arbeiten als“ auf Max Seil
 * steht. Rein lesend – Projektsummen, Phasen, Funnel, Auslastung, Risiken.
 * Kein Posteingang, keine Aufgabenliste, kein einziger Eingabeknopf.
 * Aufgaben-Zahlen hängen am Sitzungszustand: hakt das Team ab, zählt es hier mit.
 */
export function GfDashboard() {
  const objekteLive = useObjekteLive();
  const { aufgabenPatches } = useSitzung();

  // --- Projektsummen -------------------------------------------------------
  const gesamtSumme = objekte.reduce((s, o) => s + o.kaufpreisMio, 0);
  const vermarktung = objekte.filter(inVermarktungskontext);
  const vermSumme = vermarktung.reduce((s, o) => s + o.kaufpreisMio, 0);

  // --- Vermarktungs-Funnel über alle Objekte -------------------------------
  const alleLinks = objekte.flatMap((o) => linksZuObjekt(o.id));
  const kontaktiert = alleLinks.filter((l) => l.status !== "vorgemerkt");
  const geantwortet = kontaktiert.filter((l) => GEANTWORTET.includes(l.status));
  const positiv = kontaktiert.filter((l) => POSITIV.includes(l.status));
  const tief = kontaktiert.filter((l) =>
    ["nda_unterzeichnet", "datenraum_freigegeben"].includes(l.status),
  );
  const preisanfragen = kontaktiert.filter((l) => l.status === "preisanfrage");
  const quote = kontaktiert.length
    ? Math.round((geantwortet.length / kontaktiert.length) * 100)
    : 0;

  // --- Phasen (Projektsummen je Pipeline-Stufe) ----------------------------
  const phasen = PIPELINE_STUFEN.map((titel, i) => {
    const drin = objekte.filter((o) => pipelineStufe(o) === i);
    return {
      // „PHASE 2 · Vermarktungsvorbereitung“ → „P2 Vermarktungsvorbereitung“,
      // sonst schneidet die Label-Spalte den tragenden Teil ab.
      titel: titel.replace(/^PHASE (\d) · /, "P$1 ").replace(" (laufend)", ""),
      anzahl: drin.length,
      summe: drin.reduce((s, o) => s + o.kaufpreisMio, 0),
    };
  });
  const phasenMax = Math.max(...phasen.map((p) => p.summe), 1);

  // --- Aufgaben & Risiken (live aus dem Sitzungszustand) -------------------
  const effektiv = aufgaben.map((t) => ({ ...t, ...aufgabenPatches[t.id] }));
  const offen = effektiv.filter((t) => !t.erledigt);
  const ueberfaellig = offen.filter((t) => t.faellig < HEUTE);
  const stufe3 = alleLinks.filter((l) => l.status === "angeschrieben" && l.followUpStufe === 3);
  const followUpsUeberfaellig = alleLinks.filter(
    (l) => l.status === "angeschrieben" && istUeberfaellig(l.naechstesFollowUp),
  );
  const luecken = objekteLive.filter(hatDatenraumLuecke).length;

  const team = mitarbeiter
    .filter((m) => m.id !== GF_ID)
    .map((m) => {
      const meine = offen.filter((t) => t.mitarbeiterId === m.id);
      return { m, offen: meine.length, ueberfaellig: meine.filter((t) => t.faellig < HEUTE).length };
    });
  const teamMax = Math.max(...team.map((t) => t.offen), 1);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <HeuteKopf untertitel="Montag, 31.08.2026 – Geschäftsführungs-Blick: alle Mandate, Summen und Risiken auf einen Blick." />
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <WeltUhren />
          <span className="inline-flex items-center gap-2 text-kicker text-seil-muted">
            <Eye size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
            Nur-Lese-Sicht – Eingaben macht das Team im operativen Cockpit
          </span>
          {/* Reporting als Exportprodukt direkt aus dem Dashboard (Update-Call 28.08.). */}
          <BerichtExport />
        </div>
      </div>

      <div className="mb-4">
        <AktivitaetenTicker />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GfKpi
          label="Pipeline gesamt"
          wert={fmtMio(gesamtSumme)}
          sub={`${objekte.length} Mandate unter Vertrag`}
        />
        <GfKpi
          label="In aktiver Vermarktung"
          wert={fmtMio(vermSumme)}
          sub={`${vermarktung.length} Objekte im Markt`}
        />
        <GfKpi
          label="Honorarpotenzial"
          wert={fmtMio(gesamtSumme * HONORAR_SATZ)}
          sub="Modellrechnung 1,5 % – Satz offen"
        />
        <GfKpi
          label="Antwortquote"
          wert={`${quote} %`}
          sub={`${geantwortet.length} von ${kontaktiert.length} Kontakten, ${positiv.length} positiv`}
        />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pipeline nach Phase" meta="Projektsummen je Prozessphase" />
          <div className="py-2">
            {phasen.map((p) => (
              <BalkenZeile
                key={p.titel}
                label={p.titel}
                detail={`${p.anzahl} ${p.anzahl === 1 ? "Objekt" : "Objekte"}`}
                anteil={p.summe / phasenMax}
                wert={fmtMio(p.summe)}
              />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Vermarktungs-Funnel" meta="alle Objekte, kumuliert" />
          <div className="py-2">
            <BalkenZeile label="Angeschrieben" anteil={1} wert={String(kontaktiert.length)} />
            <BalkenZeile
              label="Rückmeldung"
              detail={`${quote} %`}
              anteil={geantwortet.length / Math.max(kontaktiert.length, 1)}
              wert={String(geantwortet.length)}
            />
            <BalkenZeile
              label="NDA / Datenraum"
              anteil={tief.length / Math.max(kontaktiert.length, 1)}
              wert={String(tief.length)}
            />
            <BalkenZeile
              label="Preisanfragen"
              anteil={preisanfragen.length / Math.max(kontaktiert.length, 1)}
              wert={String(preisanfragen.length)}
            />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Alle Mandate"
          meta="sortiert nach Volumen – Zeile öffnet das Objekt-Detail"
        />
        <Table>
          <THead>
            <TR>
              <TH>Objekt</TH>
              <TH numeric>Kaufpreis</TH>
              <TH>Aktuelle Phase</TH>
              <TH numeric>Prozess</TH>
              <TH numeric>Kontaktiert</TH>
              <TH numeric>Antworten</TH>
              <TH>Lead</TH>
            </TR>
          </THead>
          <TBody>
            {[...objekte]
              .sort((a, b) => b.kaufpreisMio - a.kaufpreisMio)
              .map((o) => {
                const phase = aktiverSchritt(o);
                const pf = prozessFortschritt(o);
                const links = linksZuObjekt(o.id).filter((l) => l.status !== "vorgemerkt");
                const antworten = links.filter((l) => GEANTWORTET.includes(l.status));
                const lead = mitarbeiterVon(o.zustaendigId);
                return (
                  <KlickZeile key={o.id} href={`/objekte/${o.id}`}>
                    <TD>
                      <EntityLink href={`/objekte/${o.id}`}>{o.name}</EntityLink>
                      <div className="text-kicker text-seil-muted">{o.stadt}</div>
                    </TD>
                    <TD numeric>{fmtMio(o.kaufpreisMio)}</TD>
                    <TD>
                      <Badge tone={phase.phase >= 3 ? "accent" : "neutral"}>
                        P{phase.phase} · {phase.nr} {phase.titel}
                      </Badge>
                    </TD>
                    <TD numeric className="text-seil-muted">
                      {pf.done}/{pf.gesamt}
                    </TD>
                    <TD numeric>{links.length || "–"}</TD>
                    <TD numeric>{antworten.length || "–"}</TD>
                    <TD className="whitespace-nowrap text-seil-muted">{lead?.kuerzel}</TD>
                  </KlickZeile>
                );
              })}
          </TBody>
        </Table>
      </Card>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Braucht Aufmerksamkeit" meta="Stand heute" />
          <ul className="divide-y divide-seil-line">
            <AufmerksamkeitZeile
              text="Überfällige Aufgaben"
              wert={ueberfaellig.length}
              ton="danger"
            />
            <AufmerksamkeitZeile
              text="Follow-up überfällig (Automatik gestoppt)"
              wert={followUpsUeberfaellig.length}
              ton="danger"
            />
            <AufmerksamkeitZeile
              text="Stufe 3 ohne Antwort – manuell nachfassen"
              wert={stufe3.length}
              ton="warning"
            />
            <li className="flex items-center justify-between gap-3 px-4 py-2">
              <span className="inline-flex items-center gap-2 text-seil-body">
                <FolderOpen
                  size={ICON_SM}
                  strokeWidth={ICON_STROKE}
                  className={luecken > 0 ? "text-seil-warning" : "text-seil-success"}
                  aria-hidden
                />
                Datenräume mit Lücken
              </span>
              <span className={`tabular-nums ${luecken > 0 ? "text-seil-warning" : "text-seil-muted"}`}>
                {luecken}
              </span>
            </li>
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Auslastung im Team"
            meta={`${offen.length} offene Aufgaben gesamt`}
          />
          <div className="py-2">
            {team.map(({ m, offen: n, ueberfaellig: u }) => (
              <BalkenZeile
                key={m.id}
                label={m.name}
                detail={u > 0 ? `${u} überfällig` : undefined}
                anteil={n / teamMax}
                wert={`${n} offen`}
              />
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
