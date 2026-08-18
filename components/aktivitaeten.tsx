import type { LucideIcon } from "lucide-react";
import { Bot, Inbox, Phone, Send, StickyNote } from "lucide-react";
import { fmtDatumKurz, investorVon, mitarbeiterVon, objektVon } from "@/lib/derive";
import type { Aktivitaet, AktivitaetTyp } from "@/lib/types";
import { Badge, EntityLink, LeerHinweis } from "./ui";

const typMeta: Record<AktivitaetTyp, { icon: LucideIcon; label: string }> = {
  mail_ausgang: { icon: Send, label: "E-Mail (Ausgang)" },
  mail_eingang: { icon: Inbox, label: "E-Mail (Eingang)" },
  anruf: { icon: Phone, label: "Telefonat" },
  system: { icon: Bot, label: "Automatik" },
  notiz: { icon: StickyNote, label: "Notiz" },
};

/**
 * Kommunikations- und Aktivitätenhistorie.
 * kontext steuert, welche Gegenpartei verlinkt wird (auf der Objektseite der
 * Investor, auf der Investorseite das Objekt).
 */
export function Aktivitaeten({
  eintraege,
  kontext,
}: {
  eintraege: Aktivitaet[];
  kontext: "objekt" | "investor";
}) {
  if (eintraege.length === 0) {
    return <LeerHinweis text="Noch keine Aktivitäten erfasst." />;
  }
  return (
    <ul className="divide-y divide-line">
      {eintraege.map((a) => {
        const meta = typMeta[a.typ];
        const Icon = meta.icon;
        const mitarbeiter = a.mitarbeiterId ? mitarbeiterVon(a.mitarbeiterId) : undefined;
        const investor = a.investorId ? investorVon(a.investorId) : undefined;
        const objekt = a.objektId ? objektVon(a.objektId) : undefined;

        return (
          <li key={a.id} className="flex gap-3 px-4 py-2.5">
            <span className="w-[92px] shrink-0 pt-0.5 text-[11px] tabular-nums text-ink-mute">
              {fmtDatumKurz(a.datum)}
            </span>
            <Icon size={14} className="mt-0.5 shrink-0 text-ink-mute" aria-label={meta.label} />
            <div className="min-w-0">
              <p className="text-[13px] leading-snug">{a.text}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-mute">
                {a.quelle ? (
                  <Badge ton={a.quelle === "Modul 01" ? "accent" : "neutral"}>{a.quelle}</Badge>
                ) : null}
                {mitarbeiter ? <span>{mitarbeiter.name}</span> : null}
                {kontext === "objekt" && investor ? (
                  <EntityLink href={`/investoren/${investor.id}`}>{investor.firma}</EntityLink>
                ) : null}
                {kontext === "investor" && objekt ? (
                  <EntityLink href={`/objekte/${objekt.id}`}>{objekt.name}</EntityLink>
                ) : null}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
