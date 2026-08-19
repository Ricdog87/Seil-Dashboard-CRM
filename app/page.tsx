import Link from "next/link";
import { FolderCheck, RefreshCw, Send, TriangleAlert } from "lucide-react";
import {
  datenraumFortschritt,
  fmtDatum,
  hatDatenraumLuecke,
  investorVon,
  istUeberfaellig,
  kpis,
  objektVon,
  ohneRueckmeldung,
} from "@/lib/derive";
import { objekte } from "@/lib/mock-data";
import { Badge, Card, CardHeader, ICON_SM, ICON_STROKE, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import {
  EntityLink,
  FollowUpStufe,
  Fortschritt,
  KpiKachel,
  SeitenKopf,
} from "@/components/cockpit";
import { TransaktionenAnsicht } from "@/components/transaktionen-ansicht";

export default function UebersichtSeite() {
  const k = kpis();
  const stumm = ohneRueckmeldung();
  const luecken = objekte.filter(hatDatenraumLuecke);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SeitenKopf
          titel="Übersicht"
          untertitel="Alle laufenden Transaktionen mit Phase, Aufgaben, Rückmeldungen und Datenraum-Status auf einen Blick."
        />
        {/* Systemstatus: die drei Anbindungen aus Angebot und Kickoff, still im Hintergrund. */}
        <div className="flex flex-col items-end gap-1 text-kicker text-seil-muted">
          <p className="inline-flex items-center gap-2">
            <Send size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
            Status-Report heute 08:00 an das Team versendet
          </p>
          <p className="inline-flex items-center gap-2">
            <RefreshCw size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
            Se Circle-Sync heute 06:00 – keine Änderungen
          </p>
          <p className="inline-flex items-center gap-2">
            <FolderCheck size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
            Modul 01: Datenraum-Status heute 07:30 aktualisiert
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiKachel label="Laufende Transaktionen" wert={k.transaktionen} sub="davon 3 in Vermarktung" />
        <KpiKachel
          label="Offene Aufgaben"
          wert={k.offeneAufgaben}
          sub={`davon ${k.brokerCalls} Broker Calls`}
          href="/aufgaben"
        />
        <KpiKachel
          label="Investoren ohne Rückmeldung"
          wert={k.ohneRueckmeldung}
          sub={`${k.handlungsbedarf} mit Handlungsbedarf`}
          href="/vermarktung"
        />
        <KpiKachel
          label="Datenräume mit Lücken"
          wert={k.datenraumLuecken}
          sub="Checklisten unvollständig"
        />
      </div>

      <TransaktionenAnsicht />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Investoren ohne Rückmeldung"
            meta={
              <Link href="/vermarktung" className="text-seil-accent hover:underline">
                zur Vermarktung
              </Link>
            }
          />
          <Table>
            <THead>
              <TR>
                <TH>Investor</TH>
                <TH>Objekt</TH>
                <TH>Follow-up</TH>
                <TH>Nächster Schritt</TH>
              </TR>
            </THead>
            <TBody>
              {stumm.map((l) => {
                const inv = investorVon(l.investorId)!;
                const obj = objektVon(l.objektId)!;
                const ueberfaellig = istUeberfaellig(l.naechstesFollowUp);
                return (
                  <TR key={`${l.objektId}-${l.investorId}`}>
                    <TD>
                      <EntityLink href={`/investoren/${inv.id}`}>{inv.firma}</EntityLink>
                    </TD>
                    <TD>
                      <EntityLink href={`/objekte/${obj.id}`}>{obj.name}</EntityLink>
                    </TD>
                    <TD>
                      <FollowUpStufe stufe={l.followUpStufe} />
                    </TD>
                    <TD>
                      {l.followUpStufe === 3 ? (
                        <Badge tone="danger" icon={TriangleAlert}>
                          manuell nachfassen
                        </Badge>
                      ) : ueberfaellig ? (
                        <Badge tone="danger" icon={TriangleAlert}>
                          Follow-up überfällig ({fmtDatum(l.naechstesFollowUp)})
                        </Badge>
                      ) : (
                        <span className="text-seil-muted">
                          Follow-up am {fmtDatum(l.naechstesFollowUp)}
                        </span>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Datenräume mit Lücken" meta="Status aus Modul 01" />
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
            </TBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
