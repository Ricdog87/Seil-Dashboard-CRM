import { Check, UserCheck } from "lucide-react";
import {
  EIGENTUEMER_SCHRITTE,
  EIGENTUEMER_SCHRITTE_KURZ,
  FREIGABE_SCHRITT_INDEX,
  INVESTOREN_SCHRITTE,
  INVESTOREN_SCHRITTE_KURZ,
} from "@/lib/mock-data";
import type { Objekt, PhaseStatus } from "@/lib/types";
import { ICON_SM, ICON_STROKE } from "@/components/ui";
import { Kicker } from "@/components/cockpit";

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
  const rahmen =
    status === "aktiv"
      ? freigabeSchritt
        ? "border-seil-warning bg-seil-warning-bg"
        : "border-seil-accent bg-seil-accent-bg"
      : "border-seil-line bg-seil-surface";

  const marke =
    status === "abgeschlossen"
      ? "text-seil-success"
      : status === "aktiv"
        ? freigabeSchritt
          ? "text-seil-warning"
          : "text-seil-accent"
        : "text-seil-muted";

  const text =
    status === "aktiv"
      ? "text-seil-text"
      : status === "abgeschlossen"
        ? "text-seil-body"
        : "text-seil-muted";

  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-seil border px-2 py-2 ${rahmen}`}
      title={lang}
      aria-current={status === "aktiv" ? "step" : undefined}
    >
      <span className={`flex w-4 shrink-0 justify-center text-kicker ${marke}`} aria-hidden>
        {status === "abgeschlossen" ? (
          <Check size={ICON_SM} strokeWidth={ICON_STROKE} />
        ) : freigabeSchritt ? (
          <UserCheck size={ICON_SM} strokeWidth={ICON_STROKE} />
        ) : (
          nr
        )}
      </span>
      {/* Status haengt nie an der Farbe allein: aktiv traegt zusaetzlich Gewicht + sr-Text. */}
      <span className={`truncate text-kicker ${text} ${status === "aktiv" ? "font-medium" : ""}`}>
        {kurz}
        <span className="sr-only">
          {status === "aktiv"
            ? " – aktueller Schritt"
            : status === "abgeschlossen"
              ? " – abgeschlossen"
              : " – offen"}
        </span>
      </span>
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
    <div className="flex flex-col gap-2">
      <Kicker>{label}</Kicker>
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
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
    <div className="flex flex-col gap-4">
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
      <p className="flex items-start gap-2 text-kicker text-seil-muted">
        <UserCheck
          size={ICON_SM}
          strokeWidth={ICON_STROKE}
          className="mt-px shrink-0"
          aria-hidden
        />
        „Freigabe Liste“ ist der einzige manuelle Freigabeschritt – alle Versände und Follow-ups
        laufen danach automatisch.
      </p>
    </div>
  );
}
