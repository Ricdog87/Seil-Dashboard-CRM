"use client";

import { CircleCheck, TriangleAlert, UserCheck } from "lucide-react";
import {
  fmtMio,
  inVermarktungskontext,
  istUeberfaellig,
  mitarbeiterVon,
  objektVon,
} from "@/lib/derive";
import { aufgaben, entwuerfe, mitarbeiter, objekte, prioritaeten } from "@/lib/mock-data";
import {
  Badge,
  Card,
  CardHeader,
  Checkbox,
  ICON_SM,
  ICON_STROKE,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import { EntityLink, Kicker } from "@/components/cockpit";
import { useSitzung } from "./sitzung";

/** Eine Kennzahl der Portfolio-Zeile – Zahl groß, Bedeutung darunter. */
function PortfolioWert({ label, wert, sub }: { label: string; wert: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-seil border border-seil-line bg-seil-card px-4 py-3">
      <Kicker>{label}</Kicker>
      <span className="text-display tabular-nums text-seil-text">{wert}</span>
      {sub ? <span className="text-kicker text-seil-muted">{sub}</span> : null}
    </div>
  );
}

/**
 * Portfolio-Ebene der Sales Leadership – Beschluss aus dem Sales-Update (28.09.):
 * Die Leitung sieht alle Mandate des Teams, die Auslastung je Person und die
 * Tagesprioritäten für die Morgenabstimmung. Darunter folgt der eigene
 * operative Tag; die Geschäftsführung bekommt stattdessen den reinen Zahlen-Blick.
 */
export function LeitungPortfolio() {
  const { mitarbeiterId, aufgabenPatches, prioritaetPatches, patchPrioritaet, freigegebeneEntwuerfe } =
    useSitzung();
  const ich = mitarbeiterVon(mitarbeiterId);

  const offeneAufgaben = aufgaben.filter(
    (a) => !(aufgabenPatches[a.id]?.erledigt ?? a.erledigt),
  );
  const zugewiesen = (id: string) =>
    offeneAufgaben.filter((a) => (aufgabenPatches[a.id]?.mitarbeiterId ?? a.mitarbeiterId) === id);

  const volumen = objekte.reduce((s, o) => s + o.kaufpreisMio, 0);
  const inVermarktung = objekte.filter(inVermarktungskontext);
  const ueberfaellig = offeneAufgaben.filter((a) =>
    istUeberfaellig(aufgabenPatches[a.id]?.faellig ?? a.faellig),
  );
  const offeneEntwuerfe = entwuerfe.filter((e) => !freigegebeneEntwuerfe.includes(e.id));

  const team = mitarbeiter.filter((m) => m.ebene === "team" || m.ebene === "leitung");
  const heutige = prioritaeten.map((p) => ({
    ...p,
    erledigt: prioritaetPatches[p.id] ?? p.erledigt,
  }));
  const offenePrios = heutige.filter((p) => !p.erledigt).length;

  return (
    <section className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-title text-seil-text">Portfolio</h2>
        <span className="text-kicker text-seil-muted">
          Sicht {ich?.rolle ?? "Sales Leadership"} · alle Mandate des Teams
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <PortfolioWert
          label="Volumen gesamt"
          wert={fmtMio(volumen)}
          sub={`${objekte.length} Mandate`}
        />
        <PortfolioWert
          label="In Vermarktung"
          wert={String(inVermarktung.length)}
          sub="Investorenseite gestartet"
        />
        <PortfolioWert
          label="Wartet auf Freigabe"
          wert={String(offeneEntwuerfe.length)}
          sub="Mail-Entwürfe, gesammelt freizugeben"
        />
        <PortfolioWert
          label="Überfällig im Team"
          wert={String(ueberfaellig.length)}
          sub={`${offeneAufgaben.length} offene Aufgaben`}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[5fr_7fr]">
        <Card className="min-w-0">
          <CardHeader
            title="Prioritäten heute"
            meta={offenePrios > 0 ? `${offenePrios} offen` : "alle erledigt"}
          />
          <ul className="flex flex-col divide-y divide-seil-line">
            {heutige.map((p) => {
              const person = mitarbeiterVon(p.mitarbeiterId);
              const objekt = p.objektId ? objektVon(p.objektId) : undefined;
              return (
                <li key={p.id} className="flex items-start gap-3 px-4 py-2.5">
                  <Checkbox
                    checked={p.erledigt}
                    onChange={() => patchPrioritaet(p.id, !p.erledigt)}
                    label={`${p.text} erledigt`}
                    labelVerborgen
                    className="mt-0.5"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className={p.erledigt ? "text-seil-muted line-through" : "text-seil-body"}>
                      {p.text}
                    </span>
                    <span className="text-kicker text-seil-muted">
                      {person?.kuerzel ?? "–"}
                      {objekt ? (
                        <>
                          {" · "}
                          <EntityLink href={`/objekte/${objekt.id}`}>{objekt.name}</EntityLink>
                        </>
                      ) : null}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-seil-line px-4 py-2.5 text-kicker text-seil-muted">
            Aus der Morgenabstimmung – Änderungen gelten für diese Sitzung.
          </p>
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Team" meta="Auslastung und Funktion" />
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Person</TH>
                  <TH>Funktion</TH>
                  <TH>Mandate</TH>
                  <TH>Offen</TH>
                </TR>
              </THead>
              <TBody>
                {team.map((m) => {
                  const meine = objekte.filter(
                    (o) => o.zustaendigId === m.id || o.vertretungId === m.id,
                  );
                  const offen = zugewiesen(m.id);
                  const spaet = offen.filter((a) =>
                    istUeberfaellig(aufgabenPatches[a.id]?.faellig ?? a.faellig),
                  ).length;
                  return (
                    <TR key={m.id}>
                      <TD>
                        <span className="flex flex-col gap-0.5">
                          {m.unbesetzt ? (
                            <Badge tone="warning" icon={TriangleAlert}>
                              Stelle offen
                            </Badge>
                          ) : (
                            <span className="text-seil-text">{m.name}</span>
                          )}
                          <span className="text-kicker text-seil-muted">{m.rolle}</span>
                        </span>
                      </TD>
                      <TD className="max-w-[220px] text-seil-muted">
                        {m.funktionen?.join(" · ") ?? "–"}
                      </TD>
                      <TD className="tabular-nums">{meine.length}</TD>
                      <TD>
                        <span className="inline-flex items-center gap-2 tabular-nums">
                          {offen.length}
                          {spaet > 0 ? (
                            <Badge tone="warning" icon={TriangleAlert}>
                              {spaet} überfällig
                            </Badge>
                          ) : offen.length === 0 ? (
                            <CircleCheck
                              size={ICON_SM}
                              strokeWidth={ICON_STROKE}
                              className="text-seil-success"
                              aria-label="nichts offen"
                            />
                          ) : null}
                        </span>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
          <p className="flex items-center gap-2 border-t border-seil-line px-4 py-2.5 text-kicker text-seil-muted">
            <UserCheck size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
            Rollen und Funktionen nach der Teamübersicht der Leitung Sales
          </p>
        </Card>
      </div>
    </section>
  );
}
