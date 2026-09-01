import { ArrowRight, CircleCheck, Info, Send, Sparkles, TriangleAlert, UserCheck } from "lucide-react";
import {
  fmtDatum,
  inVermarktungskontext,
  fmtTicket,
  investorVon,
  istUeberfaellig,
  linksZuObjekt,
  mitarbeiterVon,
} from "@/lib/derive";
import { objekte } from "@/lib/mock-data";
import type { Objekt } from "@/lib/types";
import type { KontaktStatus } from "@/lib/types";
import { AutomatikKette } from "@/components/automatik-kette";
import { MatchZelle } from "@/components/match-zelle";
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
  Kicker,
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

/** Teaser & Listing: KI-Entwurf → menschliche Prüfung → Versand (Anforderung aus dem Kundentermin). */
function TeaserPipeline({ objekt }: { objekt: Objekt }) {
  const t = objekt.teaser;
  if (!t) return null;
  const geprueft = t.geprueftDurchId ? mitarbeiterVon(t.geprueftDurchId)?.name : undefined;

  const stufen = [
    {
      icon: Sparkles,
      label: "KI-Entwurf",
      detail: fmtDatum(t.entwurfVom),
      erledigt: true,
    },
    {
      icon: UserCheck,
      label: "Prüfung",
      detail: geprueft ?? "ausstehend",
      erledigt: t.stand !== "entwurf_pruefung",
    },
    {
      icon: Send,
      label: "Versand",
      detail:
        t.stand === "versendet"
          ? fmtDatum(t.versendetAm)
          : "wartet auf Listen-Freigabe",
      erledigt: t.stand === "versendet",
    },
  ];

  return (
    <Card className="mb-6 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Kicker>Teaser & Listing</Kicker>
        {stufen.map((st, i) => {
          const Icon = st.erledigt ? CircleCheck : st.icon;
          return (
            <span key={st.label} className="inline-flex items-center gap-x-4">
              {i > 0 ? (
                <ArrowRight
                  size={ICON_SM}
                  strokeWidth={ICON_STROKE}
                  className="text-seil-muted"
                  aria-hidden
                />
              ) : null}
              <span className="inline-flex items-center gap-2">
                <Icon
                  size={ICON_SM}
                  strokeWidth={ICON_STROKE}
                  className={st.erledigt ? "text-seil-success" : "text-seil-warning"}
                  aria-hidden
                />
                <span className={st.erledigt ? "text-seil-body" : "text-seil-text"}>
                  {st.label}
                </span>
                <span className="text-kicker text-seil-muted">{st.detail}</span>
                <span className="sr-only">{st.erledigt ? " – erledigt" : " – offen"}</span>
              </span>
            </span>
          );
        })}
        <span className="ml-auto text-kicker text-seil-muted">
          KI-Entwurf, Prüfung durch das Team – im Prototyp simuliert
        </span>
      </div>
    </Card>
  );
}

export default async function VermarktungSeite({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string }>;
}) {
  const { objekt: objektParam } = await searchParams;

  const optionen = objekte.filter(inVermarktungskontext);
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

      <AutomatikKette objekt={objekt} />

      <FreigabeKarte
        ausstehend={freigabeAusstehend}
        anzahlInvestoren={links.length}
        abgleichKriterien="Standort zuerst, dann Assetklasse und Ticket-Spanne"
        freigegebenDurch={freigegebenDurch}
        freigegebenAm={fmtDatum(objekt.freigabe?.am)}
      />

      <TeaserPipeline objekt={objekt} />

      <Card>
        <CardHeader
          title={
            <>
              Verteiler: <EntityLink href={`/objekte/${objekt.id}`}>{objekt.name}</EntityLink>
            </>
          }
          meta="Automatik: Presound-Mail an BCC-Verteiler · Follow-ups über E-Mail + WhatsApp (Superchat), Stufe 2 fragt Zielregionen ab · Interesse → Broker Call · Preisanfrage → Rückruf durch die Geschäftsführung (nur telefonisch)"
        />
        {(() => {
          const geantwortet = links.filter((l) =>
            ["interesse", "preisanfrage", "nda_unterzeichnet", "datenraum_freigegeben"].includes(
              l.status,
            ),
          ).length;
          const stumm = links.filter((l) => l.status === "angeschrieben").length;
          const abgesagt = links.filter((l) => l.status === "abgesagt").length;
          const vorgemerkt = links.filter((l) => l.status === "vorgemerkt").length;
          const versendet = links.length - vorgemerkt;
          return (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-seil-line px-4 py-2">
              <Kicker>Wer hat geantwortet?</Kicker>
              {versendet > 0 ? (
                <>
                  <span className="text-seil-body">Versendet {versendet}</span>
                  <span className="text-seil-success">Geantwortet {geantwortet}</span>
                  <span className={stumm > 0 ? "text-seil-warning" : "text-seil-muted"}>
                    Ohne Rückmeldung {stumm}
                  </span>
                  <span className="text-seil-muted">Absagen {abgesagt}</span>
                </>
              ) : (
                <span className="text-seil-muted">
                  Noch nicht versendet – {vorgemerkt} Kontakte vorgemerkt, wartet auf Freigabe
                </span>
              )}
            </div>
          );
        })()}
        <Table>
          <THead>
            <TR>
              <TH>Investor</TH>
              <TH>Ansprechpartner</TH>
              <TH numeric>Ticket</TH>
              <TH>Match</TH>
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
                    <MatchZelle objektId={objekt.id} investorId={inv.id} />
                  </TD>
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
