import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  aktivitaetenZu,
  fmtDatum,
  fmtMio,
  fmtTicket,
  investorVon,
  linksZuInvestor,
  objektVon,
} from "@/lib/derive";
import { Aktivitaeten } from "@/components/aktivitaeten";
import {
  EntityLink,
  FollowUpStufe,
  KontaktStatusBadge,
  LeerHinweis,
} from "@/components/ui";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded border border-line bg-paper px-1.5 py-0.5 text-[12px] text-ink-soft">
      {children}
    </span>
  );
}

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
        className="mb-3 inline-flex items-center gap-1 text-[12px] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={13} aria-hidden /> Übersicht
      </Link>

      <div className="mb-5">
        <h1 className="text-[20px] font-semibold tracking-tight">{investor.firma}</h1>
        <p className="mt-0.5 text-[13px] text-ink-soft">
          {investor.typ} · {investor.ansprechpartner}
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[5fr_7fr]">
        <section className="karte">
          <div className="karte-kopf">
            <h2 className="karte-titel">Ankaufsprofil</h2>
            <span className="text-[11px] text-ink-mute">Buy-Side</span>
          </div>
          <dl className="flex flex-col gap-3 px-4 py-3 text-[13px]">
            <div>
              <dt className="text-[11px] tracking-wide text-ink-mute uppercase">Ticketgröße</dt>
              <dd className="mt-0.5 tabular-nums">
                {fmtTicket(investor.ticketMinMio, investor.ticketMaxMio)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-wide text-ink-mute uppercase">Assetklassen</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {investor.assetklassen.map((a) => (
                  <Chip key={a}>{a}</Chip>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-wide text-ink-mute uppercase">Regionen</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {investor.regionen.map((r) => (
                  <Chip key={r}>{r}</Chip>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-wide text-ink-mute uppercase">Kontakt</dt>
              <dd className="mt-0.5 text-ink-soft">
                {investor.telefon}
                <br />
                {investor.email}
              </dd>
            </div>
            {investor.notiz ? (
              <div>
                <dt className="text-[11px] tracking-wide text-ink-mute uppercase">Notiz</dt>
                <dd className="mt-0.5 text-ink-soft">{investor.notiz}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="karte">
          <div className="karte-kopf">
            <h2 className="karte-titel">Verknüpfte Objekte ({links.length})</h2>
            <span className="text-[11px] text-ink-mute">Antwortstatus je Objekt</span>
          </div>
          {links.length === 0 ? (
            <LeerHinweis text="Noch keinem Objekt zugeordnet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Objekt</th>
                    <th className="num">Kaufpreis</th>
                    <th>Antwortstatus</th>
                    <th>Follow-up</th>
                    <th>Letzter Kontakt</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((l) => {
                    const obj = objektVon(l.objektId)!;
                    return (
                      <tr key={l.objektId}>
                        <td>
                          <EntityLink href={`/objekte/${obj.id}`}>{obj.name}</EntityLink>
                          <div className="text-[11px] text-ink-mute">
                            {obj.assetklasse} · {obj.stadt}
                          </div>
                        </td>
                        <td className="num">{fmtMio(obj.kaufpreisMio)}</td>
                        <td>
                          <KontaktStatusBadge status={l.status} />
                        </td>
                        <td>
                          <FollowUpStufe stufe={l.followUpStufe} />
                        </td>
                        <td className="whitespace-nowrap text-ink-soft">
                          {fmtDatum(l.letzterKontakt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="karte mt-5">
        <div className="karte-kopf">
          <h2 className="karte-titel">Kommunikationshistorie</h2>
          <span className="text-[11px] text-ink-mute">über alle verknüpften Objekte</span>
        </div>
        <Aktivitaeten eintraege={eintraege} kontext="investor" />
      </section>
    </>
  );
}
