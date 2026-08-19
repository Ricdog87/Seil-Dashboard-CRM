import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, CircleDashed, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  aktivitaetenZu,
  inVermarktungskontext,
  auftraggeberVon,
  datenraumFortschritt,
  fmtDatum,
  fmtDatumKurz,
  fmtMio,
  investorVon,
  linksZuObjekt,
  mitarbeiterVon,
  objektVon,
} from "@/lib/derive";
import type { DokumentStatus } from "@/lib/types";
import { Aktivitaeten } from "@/components/aktivitaeten";
import { KiExtraktion } from "@/components/ki-extraktion";
import { Prozessleiste } from "@/components/prozessleiste";
import {
  Badge,
  Card,
  CardBody,
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
  type Tone,
} from "@/components/ui";
import {
  EntityLink,
  FollowUpStufe,
  Fortschritt,
  Kicker,
  KontaktStatusBadge,
} from "@/components/cockpit";

const dokumentStatusMeta: Record<
  DokumentStatus,
  { label: string; tone: Tone; icon: LucideIcon }
> = {
  vorhanden: { label: "vorhanden", tone: "success", icon: CircleCheck },
  in_pruefung: { label: "in Prüfung", tone: "neutral", icon: Search },
  ausstehend: { label: "ausstehend", tone: "warning", icon: CircleDashed },
};

function Kennwert({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt>
        <Kicker>{label}</Kicker>
      </dt>
      <dd className="mt-1 text-seil-text">{children}</dd>
    </div>
  );
}

export default async function ObjektDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const objekt = objektVon(id);
  if (!objekt) notFound();

  const ag = auftraggeberVon(objekt.auftraggeberId)!;
  const zust = mitarbeiterVon(objekt.zustaendigId)!;
  const vertretung = objekt.vertretungId ? mitarbeiterVon(objekt.vertretungId) : undefined;
  const dr = datenraumFortschritt(objekt);
  const links = linksZuObjekt(objekt.id);
  const eintraege = aktivitaetenZu({ objektId: objekt.id });

  return (
    <>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-seil-muted hover:text-seil-text"
      >
        <ArrowLeft size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden /> Übersicht
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-title text-seil-text">{objekt.name}</h1>
            {objekt.merkmal ? <Badge tone="neutral">{objekt.merkmal}</Badge> : null}
          </div>
          <p className="mt-1 text-seil-muted">
            {objekt.adresse} · {objekt.stadt}
          </p>
          {objekt.standNotiz ? (
            <p className="mt-2 max-w-[70ch] text-seil-body">
              <span className="text-kicker tracking-kicker text-seil-muted uppercase">Stand: </span>
              {objekt.standNotiz}
            </p>
          ) : null}
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <Kennwert label="Assetklasse">{objekt.assetklasse}</Kennwert>
          <Kennwert label="Fläche">{objekt.flaeche}</Kennwert>
          <Kennwert label="Kaufpreisvorstellung">{fmtMio(objekt.kaufpreisMio)}</Kennwert>
          {objekt.kennzahlen?.renditeProzent ? (
            <Kennwert label="Rendite">
              {objekt.kennzahlen.renditeProzent.toLocaleString("de-DE")} %
            </Kennwert>
          ) : null}
          {objekt.kennzahlen?.baujahr ? (
            <Kennwert label="Baujahr">{objekt.kennzahlen.baujahr}</Kennwert>
          ) : null}
          {objekt.kennzahlen?.leerstandProzent !== undefined ? (
            <Kennwert label="Leerstand">
              {objekt.kennzahlen.leerstandProzent.toLocaleString("de-DE")} %
            </Kennwert>
          ) : null}
          <Kennwert label="Lead / Vertretung">
            {zust.kuerzel}
            {vertretung ? ` / ${vertretung.kuerzel}` : ""}
          </Kennwert>
          {objekt.quelle ? (
            <Kennwert label="Quelle">
              <Badge tone={objekt.quelle === "Se Circle" ? "info" : "neutral"}>
                {objekt.quelle}
              </Badge>
            </Kennwert>
          ) : null}
        </dl>
      </div>

      <Card className="mb-6 px-4 py-4">
        <Prozessleiste objekt={objekt} />
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[5fr_7fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Datenraum"
              meta={
                <span className="inline-flex items-center gap-3">
                  <Badge tone="info">Modul 01</Badge>
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
                            {d.name}
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
              <EmptyState text="Datenraum noch nicht angefordert – Schritt 3 der Eigentümerseite." />
            )}
          </Card>

          <Card>
            <CardHeader title="Auftraggeber" meta="Sell-Side" />
            <CardBody>
              <p className="text-seil-text">{ag.firma}</p>
              <p className="mt-1 text-seil-body">{ag.ansprechpartner}</p>
              <p className="mt-3 text-seil-muted">
                {ag.telefon} · {ag.email}
              </p>
            </CardBody>
          </Card>

          {objekt.seCircleSync ? (
            <Card>
              <CardHeader
                title="Se Circle-Anbindung"
                meta={<Badge tone="success">verbunden</Badge>}
              />
              <CardBody className="flex flex-col gap-3">
                <dl className="flex flex-wrap gap-x-8 gap-y-2">
                  <div>
                    <dt>
                      <Kicker>Richtung</Kicker>
                    </dt>
                    <dd className="mt-1 text-seil-body">{objekt.seCircleSync.richtung}</dd>
                  </div>
                  <div>
                    <dt>
                      <Kicker>Letzter Sync</Kicker>
                    </dt>
                    <dd className="mt-1 text-seil-body">
                      {fmtDatumKurz(objekt.seCircleSync.letzterSync)}
                    </dd>
                  </div>
                </dl>
                <div>
                  <Kicker>Synchronisierte Feldgruppen</Kicker>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {objekt.seCircleSync.feldgruppen.map((f) => (
                      <span
                        key={f}
                        className="inline-flex rounded-seil border border-seil-line bg-seil-card-alt px-2 py-0.5 text-kicker text-seil-body"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-kicker text-seil-muted">
                  Keine manuelle Excel-Übertragung mehr – Off-Market-Daten laufen direkt ins
                  Cockpit. Anbindung ist Umsetzungsteil von Modul 02, hier simuliert.
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <Card>
          <CardHeader
            title={`Verknüpfte Investoren (${links.length})`}
            meta={
              inVermarktungskontext(objekt) ? (
                <Link
                  href={`/vermarktung?objekt=${objekt.id}`}
                  className="text-seil-accent hover:underline"
                >
                  zur Vermarktung
                </Link>
              ) : (
                "Vermarktung noch nicht gestartet"
              )
            }
          />
          {links.length === 0 ? (
            <EmptyState text="Noch keine Investoren verknüpft – die Vermarktung ist nicht gestartet." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Investor</TH>
                  <TH>Antwortstatus</TH>
                  <TH>Follow-up</TH>
                  <TH>Letzter Kontakt</TH>
                </TR>
              </THead>
              <TBody>
                {links.map((l) => {
                  const inv = investorVon(l.investorId)!;
                  return (
                    <TR key={l.investorId}>
                      <TD>
                        <EntityLink href={`/investoren/${inv.id}`}>{inv.firma}</EntityLink>
                        <div className="text-kicker text-seil-muted">{inv.typ}</div>
                      </TD>
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
        <CardHeader
          title="Aktivitäten & Kommunikation"
          meta="alle Kontakte, Automatik-Schritte und Notizen zu diesem Objekt"
        />
        <Aktivitaeten eintraege={eintraege} kontext="objekt" />
      </Card>
    </>
  );
}
