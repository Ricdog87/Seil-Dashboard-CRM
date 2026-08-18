import { Check, UserCheck } from "lucide-react";
import {
  EIGENTUEMER_SCHRITTE,
  EIGENTUEMER_SCHRITTE_KURZ,
  FREIGABE_SCHRITT_INDEX,
  INVESTOREN_SCHRITTE,
  INVESTOREN_SCHRITTE_KURZ,
} from "@/lib/mock-data";
import type { Objekt, PhaseStatus } from "@/lib/types";

function SchrittChip({
  nr,
  kurz,
  lang,
  status,
  freigabeSchritt,
}: {
  nr: number;
  kurz: string;
  lang: string;
  status: PhaseStatus;
  freigabeSchritt: boolean;
}) {
  const basis = "flex items-center gap-1.5 rounded border px-2 py-1.5 min-w-0";
  const klasse =
    status === "aktiv"
      ? freigabeSchritt
        ? `${basis} border-warn/40 bg-warn-tint`
        : `${basis} border-accent/40 bg-accent-tint`
      : status === "abgeschlossen"
        ? `${basis} border-line bg-neutral-tint`
        : `${basis} border-line bg-surface`;

  const kreis =
    status === "abgeschlossen"
      ? "bg-ink-soft text-surface"
      : status === "aktiv"
        ? freigabeSchritt
          ? "bg-warn text-surface"
          : "bg-accent text-surface"
        : "border border-line-strong text-ink-mute";

  const text =
    status === "aktiv"
      ? "font-medium text-ink"
      : status === "abgeschlossen"
        ? "text-ink-soft"
        : "text-ink-mute";

  return (
    <div className={klasse} title={lang}>
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${kreis}`}
        aria-hidden
      >
        {status === "abgeschlossen" ? (
          <Check size={10} strokeWidth={3} />
        ) : freigabeSchritt ? (
          <UserCheck size={10} strokeWidth={2.5} />
        ) : (
          nr
        )}
      </span>
      <span className={`truncate text-[11px] ${text}`}>{kurz}</span>
    </div>
  );
}

function Seite({
  label,
  schritte,
  kurz,
  status,
  investorenSeite,
}: {
  label: string;
  schritte: readonly string[];
  kurz: readonly string[];
  status: PhaseStatus[];
  investorenSeite: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[11px] font-medium tracking-wide text-ink-mute uppercase">{label}</div>
      <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-6">
        {schritte.map((lang, i) => (
          <SchrittChip
            key={lang}
            nr={i + 1}
            kurz={kurz[i]}
            lang={`${i + 1}. ${lang}`}
            status={status[i]}
            freigabeSchritt={investorenSeite && i === FREIGABE_SCHRITT_INDEX}
          />
        ))}
      </div>
    </div>
  );
}

/** Prozessleiste über beide Seiten – so denkt der Kunde über seine Transaktionen. */
export function Prozessleiste({ objekt }: { objekt: Objekt }) {
  return (
    <div className="flex flex-col gap-3">
      <Seite
        label="Eigentümerseite · Akquise & Datenraum"
        schritte={EIGENTUEMER_SCHRITTE}
        kurz={EIGENTUEMER_SCHRITTE_KURZ}
        status={objekt.eigentuemerPhasen}
        investorenSeite={false}
      />
      <Seite
        label="Investorenseite · Vermarktung & Follow-up"
        schritte={INVESTOREN_SCHRITTE}
        kurz={INVESTOREN_SCHRITTE_KURZ}
        status={objekt.investorenPhasen}
        investorenSeite
      />
      <p className="text-[11px] text-ink-mute">
        <UserCheck size={11} className="mr-1 inline align-[-1px]" aria-hidden />
        „Freigabe Liste“ ist der einzige manuelle Freigabeschritt – alle Versände und Follow-ups
        laufen danach automatisch.
      </p>
    </div>
  );
}
