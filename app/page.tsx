import Link from "next/link";
import { ChevronRight, Send, TriangleAlert } from "lucide-react";
import {
  aktiverSchritt,
  aufgabenZuObjekt,
  datenraumFortschritt,
  fmtDatum,
  fmtMio,
  hatDatenraumLuecke,
  investorVon,
  istUeberfaellig,
  kpis,
  linksZuObjekt,
  mitarbeiterVon,
  objektVon,
  ohneRueckmeldung,
} from "@/lib/derive";
import { objekte } from "@/lib/mock-data";
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
import {
  EntityLink,
  FollowUpStufe,
  Fortschritt,
  KpiKachel,
  SeitenKopf,
} from "@/components/cockpit";
import { KlickZeile } from "@/components/klick-zeile";

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
        <p className="inline-flex items-center gap-2 text-kicker text-seil-muted">
          <Send size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
          Status-Report heute 08:00 via Telegram an das Team versendet
        </p>
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

      <Card className="mt-6">
        <CardHeader title="Laufende Transaktionen" meta="Zeile anklicken für Objekt-Detail" />
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
      </Card>

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
