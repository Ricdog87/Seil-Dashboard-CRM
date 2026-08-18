import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, CircleDashed, Search } from "lucide-react";
import {
  aktivitaetenZu,
  auftraggeberVon,
  datenraumFortschritt,
  fmtDatum,
  fmtMio,
  investorVon,
  linksZuObjekt,
  mitarbeiterVon,
  objektVon,
} from "@/lib/derive";
import type { DokumentStatus } from "@/lib/types";
import { Aktivitaeten } from "@/components/aktivitaeten";
import { Prozessleiste } from "@/components/prozessleiste";
import {
  Badge,
  EntityLink,
  FollowUpStufe,
  Fortschritt,
  KontaktStatusBadge,
  LeerHinweis,
} from "@/components/ui";

const dokumentStatusMeta: Record<
  DokumentStatus,
  { label: string; ton: "ok" | "warn" | "neutral"; icon: typeof CircleCheck }
> = {
  vorhanden: { label: "vorhanden", ton: "ok", icon: CircleCheck },
  in_pruefung: { label: "in Prüfung", ton: "neutral", icon: Search },
  ausstehend: { label: "ausstehend", ton: "warn", icon: CircleDashed },
};

export default async function ObjektDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const objekt = objektVon(id);
  if (!objekt) notFound();

  const ag = auftraggeberVon(objekt.auftraggeberId)!;
  const zust = mitarbeiterVon(objekt.zustaendigId)!;
  const dr = datenraumFortschritt(objekt);
  const links = linksZuObjekt(objekt.id);
  const eintraege = aktivitaetenZu({ objektId: objekt.id });

  return (
    <>
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1 text-[12px] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={13} aria-hidden /> Übersicht
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">{objekt.name}</h1>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {objekt.adresse} · {objekt.stadt}
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
          <div>
            <dt className="text-[11px] tracking-wide text-ink-mute uppercase">Assetklasse</dt>
            <dd>{objekt.assetklasse}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-wide text-ink-mute uppercase">Fläche</dt>
            <dd>{objekt.flaeche}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-wide text-ink-mute uppercase">Kaufpreisvorstellung</dt>
            <dd className="tabular-nums">{fmtMio(objekt.kaufpreisMio)}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-wide text-ink-mute uppercase">Zuständig</dt>
            <dd>{zust.name}</dd>
          </div>
        </dl>
      </div>

      <section className="karte mb-5 px-4 py-3.5">
        <Prozessleiste objekt={objekt} />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[5fr_7fr]">
        <div className="flex flex-col gap-5">
          <section className="karte">
            <div className="karte-kopf">
              <h2 className="karte-titel">Datenraum</h2>
              <span className="flex items-center gap-2">
                <Badge ton="accent">Modul 01</Badge>
                {objekt.datenraum.stand ? (
                  <span className="text-[11px] text-ink-mute">
                    Stand {fmtDatum(objekt.datenraum.stand)}
                  </span>
                ) : null}
              </span>
            </div>
            {dr ? (
              <>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12px] text-ink-soft">Standarddokumente</span>
                  <Fortschritt vorhanden={dr.vorhanden} gesamt={dr.gesamt} breit />
                </div>
                <table className="tbl">
                  <tbody>
                    {objekt.datenraum.dokumente.map((d) => {
                      const meta = dokumentStatusMeta[d.status];
                      return (
                        <tr key={d.name}>
                          <td className={d.status === "vorhanden" ? "text-ink-soft" : ""}>
                            {d.name}
                          </td>
                          <td className="w-32">
                            <Badge ton={meta.ton} icon={meta.icon}>
                              {meta.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <LeerHinweis text="Datenraum noch nicht angefordert – Schritt 3 der Eigentümerseite." />
            )}
          </section>

          <section className="karte">
            <div className="karte-kopf">
              <h2 className="karte-titel">Auftraggeber</h2>
              <span className="text-[11px] text-ink-mute">Sell-Side</span>
            </div>
            <div className="px-4 py-3 text-[13px]">
              <p className="font-medium">{ag.firma}</p>
              <p className="mt-0.5 text-ink-soft">{ag.ansprechpartner}</p>
              <p className="mt-2 text-[12px] text-ink-soft">
                {ag.telefon} · {ag.email}
              </p>
            </div>
          </section>
        </div>

        <section className="karte">
          <div className="karte-kopf">
            <h2 className="karte-titel">Verknüpfte Investoren ({links.length})</h2>
            {objekt.investorenPhasen.some((s) => s !== "offen") ? (
              <Link
                href={`/vermarktung?objekt=${objekt.id}`}
                className="text-[11px] text-accent hover:underline"
              >
                zur Vermarktung
              </Link>
            ) : (
              <span className="text-[11px] text-ink-mute">Vermarktung noch nicht gestartet</span>
            )}
          </div>
          {links.length === 0 ? (
            <LeerHinweis text="Noch keine Investoren verknüpft – die Vermarktung ist nicht gestartet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Investor</th>
                    <th>Antwortstatus</th>
                    <th>Follow-up</th>
                    <th>Letzter Kontakt</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((l) => {
                    const inv = investorVon(l.investorId)!;
                    return (
                      <tr key={l.investorId}>
                        <td>
                          <EntityLink href={`/investoren/${inv.id}`}>{inv.firma}</EntityLink>
                          <div className="text-[11px] text-ink-mute">{inv.typ}</div>
                        </td>
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
          <h2 className="karte-titel">Aktivitäten & Kommunikation</h2>
          <span className="text-[11px] text-ink-mute">
            alle Kontakte, Automatik-Schritte und Notizen zu diesem Objekt
          </span>
        </div>
        <Aktivitaeten eintraege={eintraege} kontext="objekt" />
      </section>
    </>
  );
}
