import Link from "next/link";
import { ChevronRight, TriangleAlert } from "lucide-react";
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
  EntityLink,
  Fortschritt,
  FollowUpStufe,
  KpiKachel,
  SeitenKopf,
} from "@/components/ui";
import { KlickZeile } from "@/components/klick-zeile";

export default function UebersichtSeite() {
  const k = kpis();
  const stumm = ohneRueckmeldung();
  const luecken = objekte.filter(hatDatenraumLuecke);

  return (
    <>
      <SeitenKopf
        titel="Übersicht"
        untertitel="Alle laufenden Transaktionen mit Phase, Aufgaben, Rückmeldungen und Datenraum-Status auf einen Blick."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

      <section className="karte mt-5">
        <div className="karte-kopf">
          <h2 className="karte-titel">Laufende Transaktionen</h2>
          <span className="text-[11px] text-ink-mute">Zeile anklicken für Objekt-Detail</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl zeilen-klickbar">
            <thead>
              <tr>
                <th>Objekt</th>
                <th>Assetklasse</th>
                <th className="num">Kaufpreis</th>
                <th>Aktuelle Phase</th>
                <th>Datenraum</th>
                <th className="num">Aufgaben</th>
                <th className="num">Investoren</th>
                <th>Zuständig</th>
                <th aria-hidden />
              </tr>
            </thead>
            <tbody>
              {objekte.map((o) => {
                const phase = aktiverSchritt(o);
                const dr = datenraumFortschritt(o);
                const links = linksZuObjekt(o.id);
                const offeneAufgaben = aufgabenZuObjekt(o.id).length;
                const zust = mitarbeiterVon(o.zustaendigId);
                return (
                  <KlickZeile key={o.id} href={`/objekte/${o.id}`}>
                    <td>
                      <EntityLink href={`/objekte/${o.id}`}>{o.name}</EntityLink>
                      <div className="text-[11px] text-ink-mute">{o.stadt}</div>
                    </td>
                    <td className="text-ink-soft">{o.assetklasse}</td>
                    <td className="num">{fmtMio(o.kaufpreisMio)}</td>
                    <td>
                      <Badge ton={phase.seite === "Investoren" ? "accent" : "neutral"}>
                        {phase.seite} · {phase.nr} {phase.titel}
                      </Badge>
                    </td>
                    <td>
                      {dr ? (
                        <Fortschritt vorhanden={dr.vorhanden} gesamt={dr.gesamt} />
                      ) : (
                        <span className="text-[12px] text-ink-mute">nicht angefordert</span>
                      )}
                    </td>
                    <td className="num">{offeneAufgaben}</td>
                    <td className="num">{links.length}</td>
                    <td className="whitespace-nowrap text-ink-soft">{zust?.kuerzel}</td>
                    <td className="w-6 pr-3">
                      <ChevronRight size={14} className="text-ink-mute" aria-hidden />
                    </td>
                  </KlickZeile>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="karte">
          <div className="karte-kopf">
            <h2 className="karte-titel">Investoren ohne Rückmeldung</h2>
            <Link href="/vermarktung" className="text-[11px] text-accent hover:underline">
              zur Vermarktung
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Objekt</th>
                  <th>Follow-up</th>
                  <th>Nächster Schritt</th>
                </tr>
              </thead>
              <tbody>
                {stumm.map((l) => {
                  const inv = investorVon(l.investorId)!;
                  const obj = objektVon(l.objektId)!;
                  const ueberfaellig = istUeberfaellig(l.naechstesFollowUp);
                  return (
                    <tr key={`${l.objektId}-${l.investorId}`}>
                      <td>
                        <EntityLink href={`/investoren/${inv.id}`}>{inv.firma}</EntityLink>
                      </td>
                      <td>
                        <EntityLink href={`/objekte/${obj.id}`}>{obj.name}</EntityLink>
                      </td>
                      <td>
                        <FollowUpStufe stufe={l.followUpStufe} />
                      </td>
                      <td>
                        {l.followUpStufe === 3 ? (
                          <Badge ton="crit" icon={TriangleAlert}>
                            manuell nachfassen
                          </Badge>
                        ) : ueberfaellig ? (
                          <Badge ton="crit" icon={TriangleAlert}>
                            Follow-up überfällig ({fmtDatum(l.naechstesFollowUp)})
                          </Badge>
                        ) : (
                          <span className="text-[12px] text-ink-soft">
                            Follow-up am {fmtDatum(l.naechstesFollowUp)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="karte">
          <div className="karte-kopf">
            <h2 className="karte-titel">Datenräume mit Lücken</h2>
            <span className="text-[11px] text-ink-mute">Status aus Modul 01</span>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Objekt</th>
                  <th>Checkliste</th>
                  <th>Fehlt</th>
                </tr>
              </thead>
              <tbody>
                {luecken.map((o) => {
                  const dr = datenraumFortschritt(o)!;
                  const fehlend = o.datenraum.dokumente.filter((d) => d.status !== "vorhanden");
                  return (
                    <tr key={o.id}>
                      <td>
                        <EntityLink href={`/objekte/${o.id}`}>{o.name}</EntityLink>
                      </td>
                      <td>
                        <Fortschritt vorhanden={dr.vorhanden} gesamt={dr.gesamt} />
                      </td>
                      <td className="max-w-[260px] text-[12px] text-ink-soft">
                        {fehlend
                          .slice(0, 2)
                          .map((d) => d.name)
                          .join(", ")}
                        {fehlend.length > 2 ? ` +${fehlend.length - 2} weitere` : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
