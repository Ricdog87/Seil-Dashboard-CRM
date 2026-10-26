"use client";

import { useState } from "react";
import { CircleCheck, Mail, MailCheck, Reply, Send, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fmtDatumKurz, investorVon, objektVon } from "@/lib/derive";
import { entwuerfe } from "@/lib/mock-data";
import type { EntwurfArt } from "@/lib/types";
import { Badge, Button, Card, CardHeader, Checkbox, EmptyState, ICON_SM, ICON_STROKE, type Tone } from "@/components/ui";
import { EntityLink, Kicker } from "@/components/cockpit";
import { useSitzung } from "./sitzung";

const artMeta: Record<EntwurfArt, { label: string; tone: Tone; icon: LucideIcon }> = {
  presound: { label: "Erstansprache", tone: "info", icon: Mail },
  teaser: { label: "Teaser", tone: "info", icon: Sparkles },
  antwort: { label: "Antwort", tone: "accent", icon: Reply },
  followup: { label: "Follow-up", tone: "neutral", icon: MailCheck },
};

/**
 * Sammelfreigabe der Mail-Entwürfe – Beschluss aus dem Sales-Update (28.09.):
 * Entwürfe werden gesammelt im Dashboard freigegeben statt einzeln. Das
 * Vier-Augen-Prinzip bleibt (Human in the Loop, EU AI Act), nur der Klickaufwand
 * sinkt. Auswahl und Freigabe gelten im Prototyp nur für diese Sitzung.
 */
export function Sammelfreigabe() {
  const { freigegebeneEntwuerfe, entwuerfeFreigeben } = useSitzung();
  const [gewaehlt, setGewaehlt] = useState<string[]>([]);

  const offen = entwuerfe.filter((e) => !freigegebeneEntwuerfe.includes(e.id));
  const alleGewaehlt = offen.length > 0 && gewaehlt.length === offen.length;

  const umschalten = (id: string) =>
    setGewaehlt((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const alleUmschalten = () => setGewaehlt(alleGewaehlt ? [] : offen.map((e) => e.id));

  const freigeben = () => {
    if (gewaehlt.length === 0) return;
    entwuerfeFreigeben(gewaehlt);
    setGewaehlt([]);
  };

  // Entwürfe nach Mandat gruppieren – so liest sich die Liste wie der Arbeitsvorrat.
  const nachObjekt = offen.reduce<Record<string, typeof offen>>((acc, e) => {
    (acc[e.objektId] ??= []).push(e);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader
        title={`Freigabe · Mail-Entwürfe${offen.length > 0 ? ` (${offen.length} offen)` : ""}`}
        meta="gesammelt freigeben – nichts geht ohne diesen Klick raus"
      />

      {offen.length === 0 ? (
        <EmptyState text="Alle Entwürfe sind freigegeben. Neue erscheinen hier, sobald die Automatik sie erzeugt." />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-seil-line px-4 py-2.5">
            <Checkbox
              checked={alleGewaehlt}
              onChange={alleUmschalten}
              label={alleGewaehlt ? "Auswahl aufheben" : `Alle ${offen.length} auswählen`}
            />
            <Button icon={Send} onClick={freigeben} disabled={gewaehlt.length === 0}>
              {gewaehlt.length > 0 ? `${gewaehlt.length} freigeben und senden` : "Freigeben und senden"}
            </Button>
          </div>

          <ul className="flex flex-col divide-y divide-seil-line">
            {Object.entries(nachObjekt).map(([objektId, liste]) => {
              const objekt = objektVon(objektId);
              return (
                <li key={objektId} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Kicker>
                      {objekt ? (
                        <EntityLink href={`/objekte/${objekt.id}`}>{objekt.name}</EntityLink>
                      ) : (
                        objektId
                      )}
                    </Kicker>
                    <span className="text-kicker text-seil-muted">
                      {liste.length} {liste.length === 1 ? "Entwurf" : "Entwürfe"}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-1.5">
                    {liste.map((e) => {
                      const meta = artMeta[e.art];
                      const investor = investorVon(e.investorId);
                      return (
                        <li key={e.id} className="flex flex-wrap items-start gap-x-3 gap-y-1">
                          <Checkbox
                            checked={gewaehlt.includes(e.id)}
                            onChange={() => umschalten(e.id)}
                            label={`${investor?.firma ?? e.investorId}: ${e.betreff}`}
                            labelVerborgen
                          />
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-seil-text">{investor?.firma ?? e.investorId}</span>
                              <Badge tone={meta.tone} icon={meta.icon}>
                                {meta.label}
                                {e.stufe ? ` ${e.stufe}` : ""}
                              </Badge>
                            </span>
                            <span className="text-seil-muted">{e.betreff}</span>
                          </div>
                          <span className="shrink-0 text-kicker text-seil-muted">
                            {fmtDatumKurz(e.erstelltAm.slice(0, 10))}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {freigegebeneEntwuerfe.length > 0 ? (
        <p className="flex items-center gap-2 border-t border-seil-line px-4 py-2.5 text-kicker text-seil-success">
          <CircleCheck size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
          {freigegebeneEntwuerfe.length} freigegeben und an den Versand übergeben (nur diese Sitzung)
        </p>
      ) : null}
    </Card>
  );
}
