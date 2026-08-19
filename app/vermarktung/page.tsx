import { Info, TriangleAlert } from "lucide-react";
import {
  fmtDatum,
  fmtTicket,
  investorVon,
  istUeberfaellig,
  linksZuObjekt,
  mitarbeiterVon,
} from "@/lib/derive";
import { objekte } from "@/lib/mock-data";
import type { KontaktStatus } from "@/lib/types";
import { FreigabeKarte, ObjektAuswahl } from "@/components/vermarktung-client";
import {
  Card,
  CardHeader,
  ICON_SM,
  ICON_STROKE,
  Table,
  TBody,
  TD,
  TH,
  THead,
  Toast,
  TR,
} from "@/components/ui";
import {
  EntityLink,
  FollowUpStufe,
  KontaktStatusBadge,
  SeitenKopf,
} from "@/components/cockpit";

/** Sortierung der Liste: heiße Kontakte oben, Absagen unten. */
const statusReihenfolge: KontaktStatus[] = [
  "preisanfrage",
  "interesse",
  "datenraum_freigegeben",
  "nda_unterzeichnet",
  "angeschrieben",
  "vorgemerkt",
  "abgesagt",
];

export default async function VermarktungSeite({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string }>;
}) {
  const { objekt: objektParam } = await searchParams;

  const optionen = objekte.filter((o) => o.investorenPhasen.some((s) => s !== "offen"));
  const standard = optionen.find((o) => o.freigabe?.status === "ausstehend") ?? optionen[0];
  const objekt = optionen.find((o) => o.id === objektParam) ?? standard;
  const nichtVerfuegbar =
    objektParam && objektParam !== objekt.id ? objekte.find((o) => o.id === objektParam) : undefined;

  const links = [...linksZuObjekt(objekt.id)].sort(
    (a, b) => statusReihenfolge.indexOf(a.status) - statusReihenfolge.indexOf(b.status),
  );
  const freigabeAusstehend = objekt.freigabe?.status !== "erteilt";
  const freigegebenDurch = objekt.freigabe?.durchId
    ? mitarbeiterVon(objekt.freigabe.durchId)?.name
    : undefined;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SeitenKopf
          titel="Vermarktung"
          untertitel="Investorenliste je Objekt mit Antwortstatus und Follow-up-Stufe – Versand erst nach Freigabe."
        />
        <ObjektAuswahl
          optionen={optionen.map((o) => ({ id: o.id, name: o.name }))}
          aktivId={objekt.id}
        />
      </div>

      {nichtVerfuegbar ? (
        <div className="mb-5">
          <Toast tone="neutral" icon={Info}>
            Für „{nichtVerfuegbar.name}“ ist die Vermarktung noch nicht gestartet – angezeigt wird
            stattdessen {objekt.name}.
          </Toast>
        </div>
      ) : null}

      <FreigabeKarte
        ausstehend={freigabeAusstehend}
        anzahlInvestoren={links.length}
        abgleichKriterien={`${objekt.assetklasse}, Ticket passend, Region Rhein-Main/Top-7`}
        freigegebenDurch={freigegebenDurch}
        freigegebenAm={fmtDatum(objekt.freigabe?.am)}
      />

      <Card>
        <CardHeader
          title={
            <>
              Verteiler: <EntityLink href={`/objekte/${objekt.id}`}>{objekt.name}</EntityLink>
            </>
          }
          meta="Automatik: Presound-Mail an BCC-Verteiler · Follow-up alle 2 Tage (max. 3 Stufen) · Interesse → Broker Call · Preisanfrage → Investment-Team"
        />
        <Table>
          <THead>
            <TR>
              <TH>Investor</TH>
              <TH>Ansprechpartner</TH>
              <TH numeric>Ticket</TH>
              <TH>Antwortstatus</TH>
              <TH>Follow-up</TH>
              <TH>Letzter Kontakt</TH>
              <TH>Nächstes Follow-up</TH>
            </TR>
          </THead>
          <TBody>
            {links.map((l) => {
              const inv = investorVon(l.investorId)!;
              const ueberfaellig = istUeberfaellig(l.naechstesFollowUp);
              return (
                <TR key={l.investorId}>
                  <TD>
                    <EntityLink href={`/investoren/${inv.id}`}>{inv.firma}</EntityLink>
                    <div className="text-kicker text-seil-muted">{inv.typ}</div>
                  </TD>
                  <TD className="text-seil-muted">{inv.ansprechpartner}</TD>
                  <TD numeric>{fmtTicket(inv.ticketMinMio, inv.ticketMaxMio)}</TD>
                  <TD>
                    <KontaktStatusBadge status={l.status} />
                    {l.hinweis ? (
                      <div className="mt-1 text-kicker text-seil-muted">{l.hinweis}</div>
                    ) : null}
                  </TD>
                  <TD>
                    <FollowUpStufe stufe={l.followUpStufe} />
                  </TD>
                  <TD className="whitespace-nowrap text-seil-muted">{fmtDatum(l.letzterKontakt)}</TD>
                  <TD className="whitespace-nowrap">
                    {l.naechstesFollowUp ? (
                      ueberfaellig ? (
                        <span className="inline-flex items-center gap-1.5 text-seil-danger">
                          <TriangleAlert size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
                          überfällig ({fmtDatum(l.naechstesFollowUp)})
                        </span>
                      ) : (
                        <span className="text-seil-body">{fmtDatum(l.naechstesFollowUp)}</span>
                      )
                    ) : (
                      <span className="text-seil-muted">–</span>
                    )}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
