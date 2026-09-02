"use client";

import type { LucideIcon } from "lucide-react";
import { CircleCheck, CircleDashed, Search } from "lucide-react";
import { datenraumFortschritt, fmtDatum, objektVon } from "@/lib/derive";
import type { DokumentStatus } from "@/lib/types";
import { Badge, Card, CardHeader, EmptyState, Table, TBody, TD, TR, type Tone } from "@/components/ui";
import { Fortschritt } from "@/components/cockpit";
import { KiExtraktion } from "@/components/ki-extraktion";
import { DatenquelleBadge, useObjektLive } from "@/components/modul01";

const dokumentStatusMeta: Record<DokumentStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  vorhanden: { label: "vorhanden", tone: "success", icon: CircleCheck },
  in_pruefung: { label: "in Prüfung", tone: "neutral", icon: Search },
  ausstehend: { label: "ausstehend", tone: "warning", icon: CircleDashed },
};

/**
 * Datenraum-Karte am Objekt: Checkliste und KI-Kennwerte. Ist Modul 01 verbunden und das
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
          <span className="inline-flex items-center gap-3">
            <DatenquelleBadge objekt={objekt} />
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
                    <TD className={d.status === "vorhanden" ? "text-seil-muted" : ""}>{d.name}</TD>
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
