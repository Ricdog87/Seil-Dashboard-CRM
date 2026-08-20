"use client";

import { Check, Minus } from "lucide-react";
import { investorVon, matchKriterien, objektVon } from "@/lib/derive";
import { ICON_SM, ICON_STROKE } from "@/components/ui";
import { useSitzung } from "./sitzung";

/**
 * Match-Anzeige je Verteiler-Zeile: Standort zuerst, dann Assetklasse und
 * Ticket (Reihenfolge lt. Demo-Check 20.08.). Liest die Profil-Patches der
 * Sitzung – wer im Investor-Detail das Ankaufsprofil ändert, sieht das
 * Matching hier sofort mitziehen. Kein voller Treffer heißt: der Kontakt
 * wurde manuell ergänzt – die Liste bleibt offen für menschliche Eingriffe.
 */
export function MatchZelle({ objektId, investorId }: { objektId: string; investorId: string }) {
  const { profilPatches } = useSitzung();
  const objekt = objektVon(objektId);
  const basis = investorVon(investorId);
  if (!objekt || !basis) return null;
  const investor = { ...basis, ...profilPatches[investorId] };
  const m = matchKriterien(objekt, investor);

  const teil = (label: string, ok: boolean) => (
    <span className={`inline-flex items-center gap-0.5 ${ok ? "text-seil-body" : "text-seil-muted"}`}>
      {label}
      {ok ? (
        <Check size={ICON_SM} strokeWidth={ICON_STROKE} className="text-seil-success" aria-hidden />
      ) : (
        <Minus size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
      )}
      <span className="sr-only">{ok ? "passt" : "passt nicht"}</span>
    </span>
  );
  const voll = m.standort && m.assetklasse && m.ticket;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-kicker whitespace-nowrap">
      {teil("Standort", m.standort)}
      {teil("Klasse", m.assetklasse)}
      {teil("Ticket", m.ticket)}
      {!voll ? <span className="text-seil-muted">· manuell ergänzt</span> : null}
    </span>
  );
}
