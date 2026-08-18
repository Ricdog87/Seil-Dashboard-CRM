import { TriangleAlert } from "lucide-react";
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
  EntityLink,
  FollowUpStufe,
  KontaktStatusBadge,
  SeitenKopf,
} from "@/components/ui";

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

  // Nur Objekte, deren Investorenseite bereits gestartet ist
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
      <div className="flex flex-wrap items-start justify-between gap-3">
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
        <p className="mb-4 rounded border border-line bg-neutral-tint px-3 py-2 text-[12px] text-ink-soft">
          Für „{nichtVerfuegbar.name}“ ist die Vermarktung noch nicht gestartet – angezeigt wird
          stattdessen {objekt.name}.
        </p>
      ) : null}

      <FreigabeKarte
        ausstehend={freigabeAusstehend}
        anzahlInvestoren={links.length}
        abgleichKriterien={`${objekt.assetklasse}, Ticket passend, Region Rhein-Main/Top-7`}
        freigegebenDurch={freigegebenDurch}
        freigegebenAm={fmtDatum(objekt.freigabe?.am)}
      />

      <section className="karte">
        <div className="karte-kopf">
          <h2 className="karte-titel">
            Verteiler: <EntityLink href={`/objekte/${objekt.id}`}>{objekt.name}</EntityLink>
          </h2>
          <span className="text-[11px] text-ink-mute">
            Automatik: Follow-up alle 2 Tage (max. 3 Stufen) · Interesse → Broker Call ·
            Preisanfrage → Investment-Team
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Ansprechpartner</th>
                <th className="num">Ticket</th>
                <th>Antwortstatus</th>
                <th>Follow-up</th>
                <th>Letzter Kontakt</th>
                <th>Nächstes Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => {
                const inv = investorVon(l.investorId)!;
                const ueberfaellig = istUeberfaellig(l.naechstesFollowUp);
                return (
                  <tr key={l.investorId}>
                    <td>
                      <EntityLink href={`/investoren/${inv.id}`}>{inv.firma}</EntityLink>
                      <div className="text-[11px] text-ink-mute">{inv.typ}</div>
                    </td>
                    <td className="text-ink-soft">{inv.ansprechpartner}</td>
                    <td className="num whitespace-nowrap">
                      {fmtTicket(inv.ticketMinMio, inv.ticketMaxMio)}
                    </td>
                    <td>
                      <KontaktStatusBadge status={l.status} />
                      {l.hinweis ? (
                        <div className="mt-0.5 text-[11px] text-ink-mute">{l.hinweis}</div>
                      ) : null}
                    </td>
                    <td>
                      <FollowUpStufe stufe={l.followUpStufe} />
                    </td>
                    <td className="whitespace-nowrap text-ink-soft">{fmtDatum(l.letzterKontakt)}</td>
                    <td className="whitespace-nowrap">
                      {l.naechstesFollowUp ? (
                        ueberfaellig ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-crit">
                            <TriangleAlert size={12} aria-hidden />
                            überfällig ({fmtDatum(l.naechstesFollowUp)})
                          </span>
                        ) : (
                          <span className="text-[12px] text-ink-soft">
                            {fmtDatum(l.naechstesFollowUp)}
                          </span>
                        )
                      ) : (
                        <span className="text-[12px] text-ink-mute">–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
