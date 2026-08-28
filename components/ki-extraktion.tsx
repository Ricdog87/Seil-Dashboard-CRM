"use client";

import { useState } from "react";
import { CircleCheck, Sparkles } from "lucide-react";
import type { KiFeld } from "@/lib/types";
import { Badge, Button, ICON_SM, ICON_STROKE } from "@/components/ui";
import { Kicker } from "@/components/cockpit";

/**
 * KI-Extraktion aus den Datenraum-Dokumenten (Kundentermin: Grundbuch, Mieterlisten
 * automatisch ins CRM). Übernahme ist bewusst ein Human-in-the-Loop-Schritt –
 * dieselbe Philosophie wie bei der Listen-Freigabe. Der Klick ist eine reine
 * UI-Demonstration und wirkt nur in dieser Sitzung.
 */
export function KiExtraktion({ felder }: { felder: KiFeld[] }) {
  const [uebernommen, setUebernommen] = useState<Set<string>>(new Set());

  const istUebernommen = (f: KiFeld) => f.status === "uebernommen" || uebernommen.has(f.feld);
  const offen = felder.filter((f) => !istUebernommen(f)).length;

  return (
    <div className="flex flex-col gap-2 border-t border-seil-line px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2">
          <Sparkles size={ICON_SM} strokeWidth={ICON_STROKE} className="text-seil-info" aria-hidden />
          <Kicker>KI-Extraktion aus dem Datenraum</Kicker>
        </span>
        {offen > 0 ? (
          <Badge tone="warning">{offen} Wert zur Prüfung</Badge>
        ) : (
          <Badge tone="success" icon={CircleCheck}>
            alle Werte übernommen
          </Badge>
        )}
      </div>

      <ul className="flex flex-col divide-y divide-seil-line">
        {felder.map((f) => {
          const ok = istUebernommen(f);
          return (
            <li key={f.feld} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
              <span className="w-40 shrink-0 text-seil-muted">{f.feld}</span>
              <span className="text-seil-text">{f.wert}</span>
              <span className="text-kicker text-seil-muted">aus: {f.quelleDokument}</span>
              <span className="ml-auto inline-flex items-center gap-2">
                {ok ? (
                  <span className="inline-flex items-center gap-1.5 text-kicker text-seil-success">
                    <CircleCheck size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
                    ins CRM übernommen
                  </span>
                ) : (
                  <>
                    {f.hinweis ? (
                      <span className="text-kicker text-seil-warning">{f.hinweis}</span>
                    ) : null}
                    <Button
                      onClick={() => setUebernommen((s) => new Set(s).add(f.feld))}
                    >
                      Prüfen & übernehmen
                    </Button>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-kicker text-seil-muted">
        Werte werden automatisch aus den Dokumenten gelesen – die Übernahme ins CRM bestätigt ein
        Mitarbeiter. Prototyp: Klick wirkt nur in dieser Sitzung.
      </p>
    </div>
  );
}
