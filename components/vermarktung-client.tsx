"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, UserCheck } from "lucide-react";
import { Badge } from "./ui";

export function ObjektAuswahl({
  optionen,
  aktivId,
}: {
  optionen: { id: string; name: string }[];
  aktivId: string;
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-[12px] text-ink-soft">
      Objekt
      <select
        value={aktivId}
        onChange={(e) => router.push(`/vermarktung?objekt=${e.target.value}`)}
        className="rounded border border-line bg-surface px-2 py-1 text-[13px] text-ink"
      >
        {optionen.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Der einzige Human-in-the-Loop-Schritt der Vermarktung: Versand startet erst,
 * wenn ein Mitarbeiter die abgeglichene Investorenliste freigibt.
 * Der Klick ist im Prototyp eine reine UI-Demonstration ohne echte Aktion.
 */
export function FreigabeKarte({
  ausstehend,
  anzahlInvestoren,
  abgleichKriterien,
  freigegebenDurch,
  freigegebenAm,
}: {
  ausstehend: boolean;
  anzahlInvestoren: number;
  abgleichKriterien: string;
  freigegebenDurch?: string;
  freigegebenAm?: string;
}) {
  const [demoFreigegeben, setDemoFreigegeben] = useState(false);

  if (!ausstehend) {
    return (
      <section className="karte mb-5 flex items-center gap-3 border-line bg-surface px-4 py-3">
        <CircleCheck size={18} className="shrink-0 text-ok" aria-hidden />
        <div className="text-[13px]">
          <span className="font-medium">Investorenliste freigegeben</span>
          <span className="text-ink-soft">
            {" "}
            – am {freigegebenAm} durch {freigegebenDurch}. Versand und Follow-up laufen automatisch.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="karte mb-5 border-warn/40 bg-warn-tint/60 px-4 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warn text-surface"
            aria-hidden
          >
            <UserCheck size={15} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[14px] font-semibold">
                Freigabe erforderlich: Versand an {anzahlInvestoren} Investoren
              </h2>
              <Badge ton="warn">Manueller Schritt</Badge>
            </div>
            <p className="mt-1 max-w-[640px] text-[12px] leading-relaxed text-ink-soft">
              Die Investorenliste wurde automatisch mit den Ankaufsprofilen abgeglichen (
              {abgleichKriterien}). Erst nach Freigabe durch einen Mitarbeiter startet der Versand –
              danach übernimmt die Automatik Follow-ups (alle 2 Tage, max. 3 Stufen) und
              Antworterkennung.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {demoFreigegeben ? (
            <span className="inline-flex items-center gap-1.5 rounded bg-ok-tint px-2.5 py-1.5 text-[12px] font-medium text-ok">
              <CircleCheck size={14} aria-hidden /> Freigabe erfasst
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setDemoFreigegeben(true)}
              className="rounded bg-accent px-3 py-1.5 text-[13px] font-medium text-surface transition-colors hover:bg-accent-deep"
            >
              Investorenliste freigeben
            </button>
          )}
          <span className="text-[11px] text-ink-mute">Prototyp – ohne echte Aktion</span>
        </div>
      </div>
    </section>
  );
}
