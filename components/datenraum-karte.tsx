"use client";

import type { LucideIcon } from "lucide-react";
import { CircleCheck, CircleDashed, Search, TriangleAlert } from "lucide-react";
import { datenraumFortschritt, fmtDatum, objektVon } from "@/lib/derive";
import type { DokumentStatus } from "@/lib/types";
import { Badge, Card, CardHeader, EmptyState, Table, TBody, TD, TR, type Tone } from "@/components/ui";
import { Fortschritt } from "@/components/cockpit";
import { KiExtraktion } from "@/components/ki-extraktion";
import { DatenquelleBadge, useObjektLive } from "@/components/modul01";

const dokumentStatusMeta: Record<DokumentStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  vorhanden: { label: "vorhanden", tone: "success", icon: CircleCheck },
  // SOP 8.1: liegt vor, aber eine Angabe im Dateinamen ist UNBEKANNT – QC-Liste.
  unklar: { label: "unklar benannt", tone: "warning", icon: TriangleAlert },
  in_pruefung: { label: "in Prüfung", tone: "neutral", icon: Search },
  ausstehend: { label: "ausstehend", tone: "warning", icon: CircleDashed },
};

/**
 * Datenraum-Karte am Objekt: Checkliste und KI-Kennwerte. Modul 01 teilt den
 * unsortierten Kunden-Datenraum nach der SOP vom 18.02.2026 in zwei Stufen –
 * „Light“ nach Unterzeichnung des NDA (elf Kategorien, geschwärzt), „Full“ nach
 * Abgabe des indikativen Angebots. Ist Modul 01 verbunden und das
 * Objekt zugeordnet, steht hier der echte Stand – sonst die Demodaten, sichtbar gekennzeichnet.
 */
export function DatenraumKarte({ objektId }: { objektId: string }) {
  const basis = objektVon(objektId);
  if (!basis) return null;
  return <DatenraumKarteLive objekt={basis} />;
}

function DatenraumKarteLive({ objekt: basis }: { objekt: NonNullable<ReturnType<typeof objektVon>> }) {
  const objekt = useObjektLive(basis);
  const dr = datenraumFortschritt(objekt);
  return (
    <Card>
      <CardHeader
        title="Datenraum"
        meta={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <DatenquelleBadge objekt={objekt} />
            {objekt.datenraum.stufe ? (
              <Badge tone={objekt.datenraum.stufe === "full" ? "success" : "neutral"}>
                {objekt.datenraum.stufe === "full" ? "Full" : "Light"}
              </Badge>
            ) : null}
            {objekt.datenraum.stufe === "light" && objekt.datenraum.schwaerzung === "offen" ? (
              <Badge tone="warning">Schwärzung offen</Badge>
            ) : null}
            {objekt.datenraum.stand ? <>Stand {fmtDatum(objekt.datenraum.stand)}</> : null}
          </span>
        }
      />
      {dr ? (
        <>
          <div className="flex items-center justify-between border-b border-seil-line px-4 py-3">
            <span className="text-seil-muted">Standarddokumente</span>
            <Fortschritt vorhanden={dr.vorhanden} gesamt={dr.gesamt} breit />
          </div>
          <Table>
            <TBody>
              {objekt.datenraum.dokumente.map((d) => {
                const meta = dokumentStatusMeta[d.status];
                return (
                  <TR key={d.name}>
                    <TD className={d.status === "vorhanden" ? "text-seil-muted" : ""}>
                      <span className="flex flex-col gap-0.5">
                        <span>{d.name}</span>
                        {d.qcHinweis ? (
                          <span className="text-kicker text-seil-muted">{d.qcHinweis}</span>
                        ) : null}
                      </span>
                    </TD>
                    <TD className="w-40">
                      <Badge tone={meta.tone} icon={meta.icon}>
                        {meta.label}
                      </Badge>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          {objekt.kiFelder?.length ? <KiExtraktion felder={objekt.kiFelder} /> : null}
        </>
      ) : (
        <EmptyState text="Datenraum noch nicht angefordert – folgt mit Schritt 8 „Standarddokumente“ (Phase 2)." />
      )}
    </Card>
  );
}
