"use client";

import { datenraumFortschritt, hatDatenraumLuecke } from "@/lib/derive";
import { Card, CardHeader, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { EntityLink, Fortschritt } from "@/components/cockpit";
import { KpiKachelLive, type KpiDelta } from "@/components/kpi-live";
import { useModul01, useObjekteLive } from "@/components/modul01";

/** KPI „Datenräume mit Lücken“ – zählt auf dem Live-Stand aus Modul 01, sobald verbunden. */
export function KpiDatenraumLuecken({ trend, delta }: { trend?: number[]; delta?: KpiDelta }) {
  const objekte = useObjekteLive();
  const luecken = objekte.filter(hatDatenraumLuecke).length;
  return (
    <KpiKachelLive
      label="Datenräume mit Lücken"
      wert={luecken}
      sub="Checklisten unvollständig"
      trend={trend}
      delta={delta}
    />
  );
}

/** Liste der Datenräume mit unvollständiger Checkliste – Quelle Modul 01 (live oder Demo). */
export function DatenraumLuecken() {
  const objekte = useObjekteLive();
  const { modus } = useModul01();
  const luecken = objekte.filter(hatDatenraumLuecke);
  return (
    <Card>
      <CardHeader
        title="Datenräume mit Lücken"
        meta={modus === "live" ? "Status live aus Modul 01" : "Status aus Modul 01 (Demo)"}
      />
      <Table>
        <THead>
          <TR>
            <TH>Objekt</TH>
            <TH>Checkliste</TH>
            <TH>Fehlt</TH>
          </TR>
        </THead>
        <TBody>
          {luecken.map((o) => {
            const dr = datenraumFortschritt(o)!;
            const fehlend = o.datenraum.dokumente.filter((d) => d.status !== "vorhanden");
            return (
              <TR key={o.id}>
                <TD>
                  <EntityLink href={`/objekte/${o.id}`}>{o.name}</EntityLink>
                </TD>
                <TD>
                  <Fortschritt vorhanden={dr.vorhanden} gesamt={dr.gesamt} />
                </TD>
                <TD className="max-w-[260px] text-seil-muted">
                  {fehlend
                    .slice(0, 2)
                    .map((d) => d.name)
                    .join(", ")}
                  {fehlend.length > 2 ? ` +${fehlend.length - 2} weitere` : ""}
                </TD>
              </TR>
            );
          })}
          {luecken.length === 0 ? (
            <TR>
              <TD className="text-seil-muted">Alle Checklisten vollständig.</TD>
              <TD></TD>
              <TD></TD>
            </TR>
          ) : null}
        </TBody>
      </Table>
    </Card>
  );
}
