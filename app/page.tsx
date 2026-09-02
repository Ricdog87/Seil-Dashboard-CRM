import Link from "next/link";
import { RefreshCw, Send, TriangleAlert } from "lucide-react";
import {
  fmtDatum,
  investorVon,
  istUeberfaellig,
  kpis,
  objektVon,
  ohneRueckmeldung,
} from "@/lib/derive";
import { KPI_TRENDS } from "@/lib/mock-data";
import { Badge, Card, CardHeader, ICON_SM, ICON_STROKE, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { EntityLink, FollowUpStufe } from "@/components/cockpit";
import { BerichtExport } from "@/components/bericht-export";
import { DatenraumLuecken, KpiDatenraumLuecken } from "@/components/datenraum-luecken";
import { Modul01Status } from "@/components/modul01";
import { GfDashboard } from "@/components/gf-dashboard";
import { HeuteKopf } from "@/components/heute-kopf";
import { KpiAufgabenLive, KpiKachelLive } from "@/components/kpi-live";
import { WeltUhren } from "@/components/weltuhren";
import { MeineAufgaben } from "@/components/meine-aufgaben";
import { Posteingang } from "@/components/posteingang";
import { AktivitaetenTicker } from "@/components/ticker";
import { TransaktionenAnsicht } from "@/components/transaktionen-ansicht";
import { UebersichtWeiche } from "@/components/uebersicht-weiche";

export default function UebersichtSeite() {
  const k = kpis();
  const stumm = ohneRueckmeldung();

  // „Arbeiten als“ Max Seil (GF) → Zahlen-Dashboard statt operativem Tag.
  const operativ = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <HeuteKopf />
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <WeltUhren />
          {/* Systemstatus: die drei Anbindungen aus Angebot und Kundentermin, still im Hintergrund. */}
          <div className="flex flex-col items-start gap-1 text-kicker text-seil-muted sm:items-end">
          <p className="inline-flex items-center gap-2">
            <Send size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
            Status-Report heute 08:00 an das Team versendet
          </p>
          <p className="inline-flex items-center gap-2">
            <RefreshCw size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
            Se Circle-Sync heute 06:00 – keine Änderungen
          </p>
            {/* Modul 01: live aus der Datenraum-Status-API, sonst ehrlich als Demo gekennzeichnet. */}
            <Modul01Status />
          </div>
          {/* Reporting als Exportprodukt direkt aus dem Dashboard (Update-Call 28.08.):
              derselbe HTML-Bericht, den die Automatik werktäglich 08:00 versendet. */}
          <BerichtExport />
        </div>
      </div>

      <div className="mb-4">
        <AktivitaetenTicker />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiKachelLive
          label="Laufende Transaktionen"
          wert={k.transaktionen}
          sub="davon 3 in Vermarktung"
          trend={KPI_TRENDS.transaktionen}
          delta={{ text: "+2 in 7 Tagen" }}
        />
        <KpiAufgabenLive trend={KPI_TRENDS.offeneAufgaben} />
        <KpiKachelLive
          label="Investoren ohne Rückmeldung"
          wert={k.ohneRueckmeldung}
          sub={`${k.handlungsbedarf} mit Handlungsbedarf`}
          href="/vermarktung"
          trend={KPI_TRENDS.ohneRueckmeldung}
          delta={{ text: "−4 in 7 Tagen", gut: true }}
        />
        <KpiDatenraumLuecken trend={KPI_TRENDS.datenraumLuecken} delta={{ text: "−2 in 7 Tagen", gut: true }} />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[7fr_5fr]">
        <Posteingang />
        <MeineAufgaben />
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

        <DatenraumLuecken />
      </div>
    </>
  );

  return <UebersichtWeiche gf={<GfDashboard />} operativ={operativ} />;
}
