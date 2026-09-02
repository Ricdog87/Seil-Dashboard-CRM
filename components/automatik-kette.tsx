"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  CircleCheck,
  CircleDashed,
  FolderOpen,
  MailCheck,
  MessageSquareText,
  Target,
  UserCheck,
} from "lucide-react";
import { datenraumFortschritt, fmtDatum, linksZuObjekt } from "@/lib/derive";
import { useObjektLive } from "@/components/modul01";
import type { KontaktStatus, Objekt } from "@/lib/types";
import { Card, CardHeader, ICON_SM, ICON_STROKE } from "@/components/ui";

const GEANTWORTET: KontaktStatus[] = [
  "interesse",
  "preisanfrage",
  "nda_unterzeichnet",
  "datenraum_freigegeben",
  "abgesagt",
];

type GliedStatus = "done" | "aktiv" | "wartet";

interface Glied {
  icon: LucideIcon;
  label: string;
  detail: string;
  status: GliedStatus;
  mensch?: boolean; // der einzige manuelle Stopp
}

/**
 * Die Automatik-Kette aus dem Demo-Check (20.08., oberste Priorität von Nino):
 * vom Einlesen des Datenraums bis zur Antworterkennung ohne manuelle
 * Zwischenschritte – einzig die Freigabe stoppt. Reine Anzeige am Demo-Objekt;
 * jedes Glied bleibt im echten System manuell übersteuerbar.
 */
export function AutomatikKette({ objekt: basis }: { objekt: Objekt }) {
  const objekt = useObjektLive(basis);
  const dr = datenraumFortschritt(objekt);
  const links = linksZuObjekt(objekt.id);
  const kontaktiert = links.filter((l) => l.status !== "vorgemerkt");
  const antworten = kontaktiert.filter((l) => GEANTWORTET.includes(l.status));
  const freigegeben = objekt.freigabe?.status === "erteilt";

  const glieder: Glied[] = [
    {
      icon: FolderOpen,
      label: "Datenraum einlesen",
      detail: dr
        ? `${dr.vorhanden}/${dr.gesamt} Dokumente · ${objekt.datenquelle === "modul01" ? "Modul 01 live" : "Backoffice + Modul 01"}`
        : "noch nicht angefordert",
      status: dr ? "done" : "wartet",
    },
    {
      icon: Target,
      label: "Matching",
      detail:
        links.length > 0
          ? `${links.length} Investoren · Standort zuerst`
          : "startet nach Datenraum",
      status: links.length > 0 ? "done" : "wartet",
    },
    {
      icon: MailCheck,
      label: "E-Mails vorbereiten",
      detail: objekt.teaser ? "Entwürfe bereit (KI, geprüft)" : "wartet auf Teaser",
      status: objekt.teaser ? "done" : "wartet",
    },
    {
      icon: UserCheck,
      label: "Freigabe",
      detail: freigegeben
        ? `erteilt am ${fmtDatum(objekt.freigabe?.am)}`
        : "wartet – einziger manueller Stopp",
      status: freigegeben ? "done" : "aktiv",
      mensch: true,
    },
    {
      icon: MessageSquareText,
      label: "Versand & Follow-ups",
      detail: freigegeben
        ? "E-Mail + WhatsApp (Superchat) · Stufe 2 fragt Zielregionen ab"
        : "startet nach Freigabe",
      status: freigegeben ? "aktiv" : "wartet",
    },
    {
      icon: Bot,
      label: "Antworterkennung",
      detail: freigegeben
        ? `${antworten.length} Antworten erkannt · Trigger-Wörter → Aufgaben`
        : "startet mit dem Versand",
      status: freigegeben && antworten.length > 0 ? "aktiv" : "wartet",
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader
        title="Automatik-Kette"
        meta="Demo-Check 20.08.: der Transaktionsprozess läuft ohne manuelle Zwischenschritte – nur die Freigabe stoppt"
      />
      <div className="flex flex-wrap items-start gap-x-2 gap-y-3 px-4 py-3">
        {glieder.map((g, i) => {
          const StatusIcon =
            g.status === "done" ? CircleCheck : g.mensch ? UserCheck : g.status === "aktiv" ? g.icon : CircleDashed;
          const farbe =
            g.mensch && g.status !== "done"
              ? "text-seil-warning"
              : g.status === "done"
                ? "text-seil-success"
                : g.status === "aktiv"
                  ? "text-seil-accent"
                  : "text-seil-muted";
          return (
            <span key={g.label} className="flex items-start gap-x-2">
              {i > 0 ? (
                <ArrowRight
                  size={ICON_SM}
                  strokeWidth={ICON_STROKE}
                  className="mt-1 shrink-0 text-seil-muted"
                  aria-hidden
                />
              ) : null}
              <span
                className={`flex max-w-56 flex-col gap-0.5 rounded-seil border px-2.5 py-1.5 ${
                  g.mensch && g.status !== "done"
                    ? "border-seil-warning bg-seil-warning-bg"
                    : g.status === "aktiv"
                      ? "border-seil-accent bg-seil-accent-bg"
                      : "border-seil-line bg-seil-surface"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <StatusIcon
                    size={ICON_SM}
                    strokeWidth={ICON_STROKE}
                    className={`shrink-0 ${farbe} ${g.status === "aktiv" && !g.mensch ? "seil-puls-sanft" : ""}`}
                    aria-hidden
                  />
                  <span className={g.status === "wartet" ? "text-seil-muted" : "text-seil-text"}>
                    {g.label}
                  </span>
                  <span className="sr-only">
                    {g.status === "done" ? "– erledigt" : g.status === "aktiv" ? "– läuft" : "– wartet"}
                  </span>
                </span>
                <span className="text-kicker text-seil-muted">{g.detail}</span>
              </span>
            </span>
          );
        })}
      </div>
      <p className="border-t border-seil-line px-4 py-2 text-kicker text-seil-muted">
        Backoffice bereitet vor (Datenraum, NDA-Versand), der Vertrieb übernimmt ab konkretem
        Interesse. Jedes Glied bleibt manuell übersteuerbar – die Automatik arbeitet zu, sie
        entscheidet nicht.
      </p>
    </Card>
  );
}
