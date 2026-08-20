import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  aktivitaetenZu,
  fmtDatum,
  fmtMio,
  investorVon,
  linksZuInvestor,
  objektVon,
} from "@/lib/derive";
import { Aktivitaeten } from "@/components/aktivitaeten";
import { AnkaufsprofilKarte } from "@/components/ankaufsprofil-karte";
import {
  Card,
  CardHeader,
  EmptyState,
  ICON_SM,
  ICON_STROKE,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import { EntityLink, FollowUpStufe, KontaktStatusBadge } from "@/components/cockpit";

export default async function InvestorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const investor = investorVon(id);
  if (!investor) notFound();

  const links = linksZuInvestor(investor.id);
  const eintraege = aktivitaetenZu({ investorId: investor.id });

  return (
    <>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-seil-muted hover:text-seil-text"
      >
        <ArrowLeft size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden /> Übersicht
      </Link>

      <div className="mb-6">
        <h1 className="text-title text-seil-text">{investor.firma}</h1>
        <p className="mt-1 text-seil-muted">
          {investor.typ} · {investor.ansprechpartner}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[5fr_7fr]">
        <AnkaufsprofilKarte investor={investor} />

        <Card>
          <CardHeader title={`Verknüpfte Objekte (${links.length})`} meta="Antwortstatus je Objekt" />
          {links.length === 0 ? (
            <EmptyState text="Noch keinem Objekt zugeordnet." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Objekt</TH>
                  <TH numeric>Kaufpreis</TH>
                  <TH>Antwortstatus</TH>
                  <TH>Follow-up</TH>
                  <TH>Letzter Kontakt</TH>
                </TR>
              </THead>
              <TBody>
                {links.map((l) => {
                  const obj = objektVon(l.objektId)!;
                  return (
                    <TR key={l.objektId}>
                      <TD>
                        <EntityLink href={`/objekte/${obj.id}`}>{obj.name}</EntityLink>
                        <div className="text-kicker text-seil-muted">
                          {obj.assetklasse} · {obj.stadt}
                        </div>
                      </TD>
                      <TD numeric>{fmtMio(obj.kaufpreisMio)}</TD>
                      <TD>
                        <KontaktStatusBadge status={l.status} />
                      </TD>
                      <TD>
                        <FollowUpStufe stufe={l.followUpStufe} />
                      </TD>
                      <TD className="whitespace-nowrap text-seil-muted">
                        {fmtDatum(l.letzterKontakt)}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Kommunikationshistorie" meta="über alle verknüpften Objekte" />
        <Aktivitaeten eintraege={eintraege} kontext="investor" />
      </Card>
    </>
  );
}
