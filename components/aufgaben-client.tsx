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
import { Badge, EntityLink, type BadgeTon } from "./ui";

const typMeta: Record<AufgabenTyp, { label: string; ton: BadgeTon; icon: LucideIcon }> = {
  broker_call: { label: "Broker Call", ton: "accent", icon: Phone },
  preisanfrage: { label: "Preisanfrage", ton: "ok", icon: Euro },
  freigabe: { label: "Freigabe", ton: "warn", icon: UserCheck },
  datenraum: { label: "Datenraum", ton: "neutral", icon: FolderOpen },
  unterlagen: { label: "Unterlagen", ton: "neutral", icon: FileText },
  nda: { label: "NDA", ton: "neutral", icon: FilePenLine },
  sonstiges: { label: "Aufgabe", ton: "neutral", icon: ClipboardList },
};

export function AufgabenListe() {
  const [filterId, setFilterId] = useState<string>("alle");
  const [erledigteAnzeigen, setErledigteAnzeigen] = useState(false);

  const zeilen = useMemo(() => {
    const gefiltert = aufgaben.filter(
      (t) =>
        (filterId === "alle" || t.mitarbeiterId === filterId) &&
        (erledigteAnzeigen || !t.erledigt),
    );
    return [...gefiltert].sort((a, b) => {
      if (a.erledigt !== b.erledigt) return a.erledigt ? 1 : -1;
      return a.faellig < b.faellig ? -1 : 1;
    });
  }, [filterId, erledigteAnzeigen]);

  const offenJeMitarbeiter = (id: string) =>
    aufgaben.filter((t) => t.mitarbeiterId === id && !t.erledigt).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterId("alle")}
          className={`rounded border px-2.5 py-1 text-[12px] transition-colors ${
            filterId === "alle"
              ? "border-accent bg-accent-tint font-medium text-accent"
              : "border-line bg-surface text-ink-soft hover:text-ink"
          }`}
        >
          Alle ({aufgaben.filter((t) => !t.erledigt).length})
        </button>
        {mitarbeiter.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setFilterId(m.id)}
            className={`rounded border px-2.5 py-1 text-[12px] transition-colors ${
              filterId === m.id
                ? "border-accent bg-accent-tint font-medium text-accent"
                : "border-line bg-surface text-ink-soft hover:text-ink"
            }`}
          >
            {m.name} ({offenJeMitarbeiter(m.id)})
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-[12px] text-ink-soft">
          <input
            type="checkbox"
            checked={erledigteAnzeigen}
            onChange={(e) => setErledigteAnzeigen(e.target.checked)}
            className="accent-accent"
          />
          Erledigte anzeigen
        </label>
      </div>

      <section className="karte">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Fällig</th>
                <th>Aufgabe</th>
                <th>Typ</th>
                <th>Objekt</th>
                <th>Investor</th>
                <th>Zuständig</th>
              </tr>
            </thead>
            <tbody>
              {zeilen.map((t) => {
                const meta = typMeta[t.typ];
                const obj = t.objektId ? objektVon(t.objektId) : undefined;
                const inv = t.investorId ? investorVon(t.investorId) : undefined;
                const zust = mitarbeiterVon(t.mitarbeiterId);
                const faellig = faelligLabel(t.faellig);
                const brokerCall = t.typ === "broker_call" && !t.erledigt;
                return (
                  <tr key={t.id} className={brokerCall ? "bg-accent-tint/50" : ""}>
                    <td className="whitespace-nowrap">
                      {t.erledigt ? (
                        <span className="inline-flex items-center gap-1 text-[12px] text-ink-mute">
                          <Check size={12} aria-hidden /> erledigt
                        </span>
                      ) : faellig.ton === "crit" ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-crit">
                          <TriangleAlert size={12} aria-hidden /> {faellig.text}
                        </span>
                      ) : faellig.ton === "warn" ? (
                        <span className="text-[12px] font-medium text-warn">{faellig.text}</span>
                      ) : (
                        <span className="text-[12px] text-ink-soft">{faellig.text}</span>
                      )}
                    </td>
                    <td className={t.erledigt ? "text-ink-mute" : brokerCall ? "font-medium" : ""}>
                      {t.titel}
                    </td>
                    <td>
                      <Badge ton={meta.ton} icon={meta.icon}>
                        {meta.label}
                      </Badge>
                    </td>
                    <td>
                      {obj ? (
                        <EntityLink href={`/objekte/${obj.id}`}>{obj.name}</EntityLink>
                      ) : (
                        <span className="text-ink-mute">–</span>
                      )}
                    </td>
                    <td>
                      {inv ? (
                        <EntityLink href={`/investoren/${inv.id}`}>{inv.firma}</EntityLink>
                      ) : (
                        <span className="text-ink-mute">–</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-ink-soft">{zust?.name}</td>
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
