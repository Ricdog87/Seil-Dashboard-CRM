"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  ClipboardList,
  Euro,
  FilePenLine,
  FileText,
  FolderOpen,
  Phone,
  TriangleAlert,
  UserCheck,
} from "lucide-react";
import { faelligLabel, investorVon, mitarbeiterVon, objektVon } from "@/lib/derive";
import { aufgaben, mitarbeiter } from "@/lib/mock-data";
import type { AufgabenTyp } from "@/lib/types";
import {
  Badge,
  Card,
  Checkbox,
  ICON_SM,
  ICON_STROKE,
  Table,
  TBody,
  TD,
  TH,
  THead,
  Tabs,
  TR,
  type Tone,
} from "@/components/ui";
import { EntityLink } from "@/components/cockpit";

const typMeta: Record<AufgabenTyp, { label: string; tone: Tone; icon: LucideIcon }> = {
  broker_call: { label: "Broker Call", tone: "accent", icon: Phone },
  preisanfrage: { label: "Preisanfrage", tone: "success", icon: Euro },
  freigabe: { label: "Freigabe", tone: "warning", icon: UserCheck },
  datenraum: { label: "Datenraum", tone: "neutral", icon: FolderOpen },
  unterlagen: { label: "Unterlagen", tone: "neutral", icon: FileText },
  nda: { label: "NDA", tone: "neutral", icon: FilePenLine },
  sonstiges: { label: "Aufgabe", tone: "neutral", icon: ClipboardList },
};

export function AufgabenListe() {
  const [filterId, setFilterId] = useState<string>("alle");
  const [erledigteAnzeigen, setErledigteAnzeigen] = useState(false);

  const zeilen = useMemo(() => {
    const gefiltert = aufgaben.filter(
      (t) =>
        (filterId === "alle" || t.mitarbeiterId === filterId) && (erledigteAnzeigen || !t.erledigt),
    );
    return [...gefiltert].sort((a, b) => {
      if (a.erledigt !== b.erledigt) return a.erledigt ? 1 : -1;
      return a.faellig < b.faellig ? -1 : 1;
    });
  }, [filterId, erledigteAnzeigen]);

  const offenJeMitarbeiter = (id: string) =>
    aufgaben.filter((t) => t.mitarbeiterId === id && !t.erledigt).length;

  const filter = [
    { id: "alle", label: "Alle", count: aufgaben.filter((t) => !t.erledigt).length },
    ...mitarbeiter.map((m) => ({ id: m.id, label: m.name, count: offenJeMitarbeiter(m.id) })),
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <Tabs items={filter} activeId={filterId} onChange={setFilterId} label="Nach Mitarbeiter filtern" />
        <Checkbox
          label="Erledigte anzeigen"
          checked={erledigteAnzeigen}
          onChange={(e) => setErledigteAnzeigen(e.target.checked)}
        />
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Fällig</TH>
              <TH>Aufgabe</TH>
              <TH>Typ</TH>
              <TH>Objekt</TH>
              <TH>Investor</TH>
              <TH>Zuständig</TH>
            </TR>
          </THead>
          <TBody>
            {zeilen.map((t) => {
              const meta = typMeta[t.typ];
              const obj = t.objektId ? objektVon(t.objektId) : undefined;
              const inv = t.investorId ? investorVon(t.investorId) : undefined;
              const zust = mitarbeiterVon(t.mitarbeiterId);
              const faellig = faelligLabel(t.faellig);
              const brokerCall = t.typ === "broker_call" && !t.erledigt;
              return (
                <TR key={t.id} highlight={brokerCall}>
                  <TD className="whitespace-nowrap">
                    {t.erledigt ? (
                      <span className="inline-flex items-center gap-1.5 text-seil-muted">
                        <Check size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden /> erledigt
                      </span>
                    ) : faellig.ton === "crit" ? (
                      <span className="inline-flex items-center gap-1.5 text-seil-danger">
                        <TriangleAlert size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
                        {faellig.text}
                      </span>
                    ) : faellig.ton === "warn" ? (
                      <span className="text-seil-warning">{faellig.text}</span>
                    ) : (
                      <span className="text-seil-body">{faellig.text}</span>
                    )}
                  </TD>
                  <TD className={t.erledigt ? "text-seil-muted" : "text-seil-text"}>{t.titel}</TD>
                  <TD>
                    <Badge tone={meta.tone} icon={meta.icon}>
                      {meta.label}
                    </Badge>
                  </TD>
                  <TD>
                    {obj ? (
                      <EntityLink href={`/objekte/${obj.id}`}>{obj.name}</EntityLink>
                    ) : (
                      <span className="text-seil-muted">–</span>
                    )}
                  </TD>
                  <TD>
                    {inv ? (
                      <EntityLink href={`/investoren/${inv.id}`}>{inv.firma}</EntityLink>
                    ) : (
                      <span className="text-seil-muted">–</span>
                    )}
                  </TD>
                  <TD className="whitespace-nowrap text-seil-muted">{zust?.name}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
