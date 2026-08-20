"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Check, ClipboardList, Euro, FilePenLine, FileText, FolderOpen, Phone, TriangleAlert, UserCheck } from "lucide-react";
import { faelligLabel, mitarbeiterVon, objektVon } from "@/lib/derive";
import { aufgaben, HEUTE } from "@/lib/mock-data";
import type { AufgabenTyp } from "@/lib/types";
import { Badge, Button, Card, CardHeader, EmptyState, ICON_SM, ICON_STROKE, type Tone } from "@/components/ui";
import { EntityLink } from "@/components/cockpit";
import { useSitzung } from "./sitzung";

const typMeta: Record<AufgabenTyp, { label: string; tone: Tone; icon: LucideIcon }> = {
  broker_call: { label: "Broker Call", tone: "accent", icon: Phone },
  preisanfrage: { label: "Preisanfrage", tone: "success", icon: Euro },
  freigabe: { label: "Freigabe", tone: "warning", icon: UserCheck },
  datenraum: { label: "Datenraum", tone: "neutral", icon: FolderOpen },
  unterlagen: { label: "Unterlagen", tone: "neutral", icon: FileText },
  nda: { label: "NDA", tone: "neutral", icon: FilePenLine },
  sonstiges: { label: "Aufgabe", tone: "neutral", icon: ClipboardList },
};

/** Die persönliche Tagesliste des angemeldeten Mitarbeiters – direkt abhakbar. */
export function MeineAufgaben() {
  const { mitarbeiterId, aufgabenPatches, patchAufgabe } = useSitzung();
  const ich = mitarbeiterVon(mitarbeiterId);

  const meine = aufgaben
    .map((t) => ({ ...t, ...aufgabenPatches[t.id] }))
    .filter((t) => t.mitarbeiterId === mitarbeiterId && !t.erledigt)
    .sort((a, b) => (a.faellig < b.faellig ? -1 : 1));

  const ueberfaellig = meine.filter((t) => t.faellig < HEUTE).length;
  const heute = meine.filter((t) => t.faellig === HEUTE).length;

  return (
    <Card>
      <CardHeader
        title={`Meine Aufgaben · ${ich?.name ?? ""}`}
        meta={
          <span className="inline-flex items-center gap-3">
            <span>
              {heute} heute fällig{ueberfaellig > 0 ? ` · ${ueberfaellig} überfällig` : ""}
            </span>
            <Link href="/aufgaben" className="text-seil-accent hover:underline">
              alle Aufgaben
            </Link>
          </span>
        }
      />
      {meine.length === 0 ? (
        <EmptyState text="Nichts offen – alle Aufgaben erledigt." />
      ) : (
        <ul className="divide-y divide-seil-line">
          {meine.map((t) => {
            const meta = typMeta[t.typ];
            const obj = t.objektId ? objektVon(t.objektId) : undefined;
            const faellig = faelligLabel(t.faellig);
            return (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-seil-card-alt/40">
                <Button
                  variant="ghost"
                  icon={Check}
                  aria-label={`Erledigt: ${t.titel}`}
                  onClick={() => patchAufgabe(t.id, { erledigt: true })}
                  className="shrink-0"
                >
                  <span className="sr-only">erledigt</span>
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-seil-text">{t.titel}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-kicker text-seil-muted">
                    {faellig.ton === "crit" ? (
                      <span className="inline-flex items-center gap-1 text-seil-danger">
                        <TriangleAlert size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
                        {faellig.text}
                      </span>
                    ) : faellig.ton === "warn" ? (
                      <span className="text-seil-warning">{faellig.text}</span>
                    ) : (
                      <span>{faellig.text}</span>
                    )}
                    {obj ? (
                      <>
                        <span aria-hidden>·</span>
                        <EntityLink href={`/objekte/${obj.id}`}>{obj.name}</EntityLink>
                      </>
                    ) : null}
                  </p>
                </div>
                <Badge tone={meta.tone} icon={meta.icon}>
                  {meta.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
