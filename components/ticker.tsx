import { fmtDatumKurz } from "@/lib/derive";
import { aktivitaeten } from "@/lib/mock-data";

/**
 * Aktivitäten-Ticker im Stil eines Handelsterminals: die jüngsten Ereignisse
 * aus Antworterkennung, Automatik und Team laufen als eine ruhige Bahn durch.
 * Hover pausiert; bei prefers-reduced-motion steht er als stille Zeile
 * (zweite Kopie ausgeblendet, keine Animation – siehe globals.css).
 */
export function AktivitaetenTicker() {
  const juengste = [...aktivitaeten]
    .sort((a, b) => (a.datum < b.datum ? 1 : -1))
    .slice(0, 14);

  const Bahn = ({ verstecken }: { verstecken?: boolean }) => (
    <span
      className={`flex shrink-0 items-center gap-3 pr-3 ${verstecken ? "seil-ticker-kopie" : ""}`}
      aria-hidden
    >
      {juengste.map((a) => (
        <span key={a.id} className="flex items-center gap-3 whitespace-nowrap">
          <span className="inline-flex items-baseline gap-2 text-kicker">
            <span className="text-seil-muted tabular-nums">{fmtDatumKurz(a.datum)}</span>
            <span className="text-seil-body">{a.text}</span>
            {a.quelle ? <span className="text-seil-muted">· {a.quelle}</span> : null}
          </span>
          <span className="h-1 w-1 shrink-0 rounded-full bg-seil-line" />
        </span>
      ))}
    </span>
  );

  return (
    <div className="seil-ticker flex items-center gap-3 overflow-hidden rounded-seil border border-seil-line bg-seil-surface px-3 py-1.5">
      <span className="shrink-0 border-r border-seil-line pr-3 text-kicker tracking-kicker text-seil-muted uppercase">
        Zuletzt im System
      </span>
      <div
        className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_20px,black_calc(100%-20px),transparent)]"
      >
        <div className="seil-ticker-spur flex w-max">
          <Bahn />
          <Bahn verstecken />
        </div>
      </div>
      <span className="sr-only">
        Letzte Aktivitäten:{" "}
        {juengste
          .slice(0, 5)
          .map((a) => `${fmtDatumKurz(a.datum)} ${a.text}`)
          .join("; ")}
      </span>
    </div>
  );
}
