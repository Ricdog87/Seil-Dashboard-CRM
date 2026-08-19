"use client";

import type { LucideIcon } from "lucide-react";
import { CalendarClock, CircleCheck, CircleX, Euro, Handshake, MessageCircleQuestion } from "lucide-react";
import { fmtDatumKurz, investorVon, mitarbeiterVon, objektVon } from "@/lib/derive";
import { signale } from "@/lib/mock-data";
import type { SignalArt } from "@/lib/types";
import { Badge, Button, Card, CardHeader, ICON_SM, ICON_STROKE, type Tone } from "@/components/ui";
import { EntityLink } from "@/components/cockpit";
import { useSitzung } from "./sitzung";

const artMeta: Record<SignalArt, { label: string; tone: Tone; icon: LucideIcon }> = {
  interesse: { label: "Interesse", tone: "success", icon: Handshake },
  preisanfrage: { label: "Preisanfrage", tone: "success", icon: Euro },
  besichtigung: { label: "Besichtigung", tone: "success", icon: CalendarClock },
  frage: { label: "Rückfrage", tone: "info", icon: MessageCircleQuestion },
  absage: { label: "Absage", tone: "neutral", icon: CircleX },
};

/**
 * Der Posteingang des Cockpits: was die Antworterkennung aus eingehenden
 * Mails erkannt hat und was das Team daraus macht. Offene Signale tragen
 * eine Aktion – im Prototyp gilt der Klick nur für diese Sitzung.
 */
export function Posteingang() {
  const { mitarbeiterId, signalErledigt, verarbeiteSignal } = useSitzung();
  const ich = mitarbeiterVon(mitarbeiterId);

  const sortiert = [...signale].sort((a, b) => {
    const aOffen = a.status === "offen" && !signalErledigt[a.id];
    const bOffen = b.status === "offen" && !signalErledigt[b.id];
    if (aOffen !== bOffen) return aOffen ? -1 : 1;
    return a.eingegangen < b.eingegangen ? 1 : -1;
  });
  const offen = signale.filter((s) => s.status === "offen" && !signalErledigt[s.id]).length;

  return (
    <Card>
      <CardHeader
        title={`Posteingang · Antworterkennung${offen > 0 ? ` (${offen} offen)` : ""}`}
        meta="erkannte Antworten aus den laufenden Mailings"
      />
      <ul className="divide-y divide-seil-line">
        {sortiert.map((s) => {
          const meta = artMeta[s.art];
          const inv = investorVon(s.investorId)!;
          const obj = objektVon(s.objektId)!;
          const hinweis = signalErledigt[s.id] ?? s.verarbeitungsHinweis;
          const istOffen = s.status === "offen" && !signalErledigt[s.id];
          return (
            <li key={s.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="w-[92px] shrink-0 text-kicker text-seil-muted">
                  {fmtDatumKurz(s.eingegangen)}
                </span>
                <Badge tone={meta.tone} icon={meta.icon}>
                  {meta.label}
                </Badge>
                <EntityLink href={`/investoren/${inv.id}`}>{inv.firma}</EntityLink>
                <span className="text-kicker text-seil-muted">zu</span>
                <EntityLink href={`/objekte/${obj.id}`}>{obj.name}</EntityLink>
              </div>
              <p className="pl-[92px] text-seil-body">{s.auszug}</p>
              <div className="flex flex-wrap items-center gap-3 pl-[92px]">
                {istOffen ? (
                  <>
                    <Button
                      variant="primary"
                      onClick={() =>
                        verarbeiteSignal(
                          s.id,
                          `Aufgabe erstellt (${ich?.kuerzel ?? "–"}) – Prototyp: nur diese Sitzung`,
                        )
                      }
                    >
                      Aufgabe anlegen
                    </Button>
                    <span className="text-kicker text-seil-muted">Vorschlag: {s.empfehlung}</span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-kicker text-seil-muted">
                    <CircleCheck
                      size={ICON_SM}
                      strokeWidth={ICON_STROKE}
                      className="text-seil-success"
                      aria-hidden
                    />
                    {hinweis}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
