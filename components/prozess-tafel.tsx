import { PROZESS_PHASEN, PROZESS_SCHRITTE, FREIGABE_SCHRITT_INDEX } from "@/lib/sop";
import { LaneChip, ToolChip } from "@/components/sop-prozess";
import type { Stand } from "@/lib/sop-ableitung";

/**
 * Das Flowchart als Tafel: drei Bahnen – Responsible, Tool, Task – und die
 * 17 Kästen von links nach rechts, so wie das Team es gezeichnet hat.
 *
 * Optional mit dem Stand eines Mandats hinterlegt (erledigt grün, läuft
 * akzentuiert). Ohne Stand ist es die reine SOP – die Seite /prozess.
 */
const standRahmen: Record<Stand, string> = {
  done: "border-seil-success",
  in_progress: "border-seil-accent",
  pending: "border-seil-line",
  na: "border-seil-line opacity-60",
};

export function ProzessTafel({ staende }: { staende?: Record<number, Stand> }) {
  return (
    <div className="overflow-x-auto rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-3">
      <div
        className="grid min-w-[2600px] gap-x-2 gap-y-2"
        style={{ gridTemplateColumns: `7rem repeat(${PROZESS_SCHRITTE.length}, minmax(0, 1fr))` }}
      >
        {/* Abschnitte */}
        <div />
        {PROZESS_PHASEN.map((ph, i) => (
          <div
            key={ph.titel}
            className="rounded-[3px] border-b border-seil-line px-1 pb-1 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-accent"
            style={{ gridColumn: `span ${ph.bisNr - ph.vonNr + 1}` }}
          >
            {i + 1} · {ph.titel}
            <span className="ml-2 normal-case tracking-normal text-seil-muted">
              {ph.vonNr}–{ph.bisNr}
            </span>
          </div>
        ))}

        {/* Responsible */}
        <div className="flex items-center rounded-[3px] px-2 text-kicker text-seil-text" style={{ background: "#fbe5d6", color: "#1a1a1e" }}>
          Responsible
        </div>
        {PROZESS_SCHRITTE.map((s) => (
          <div key={`r-${s.nr}`} className="flex items-center justify-center rounded-[3px] border border-seil-line bg-seil-surface px-1 py-1.5 text-center">
            <LaneChip lane={s.verantwortlich} />
          </div>
        ))}

        {/* Tool */}
        <div className="flex items-center rounded-[3px] px-2 text-kicker" style={{ background: "#7f7f7f", color: "#fff" }}>
          Tool
        </div>
        {PROZESS_SCHRITTE.map((s) => (
          <div key={`t-${s.nr}`} className="flex items-center justify-center rounded-[3px] border border-seil-line bg-seil-surface px-1 py-1.5 text-center">
            <ToolChip tool={s.tool} />
          </div>
        ))}

        {/* Task */}
        <div className="flex items-start rounded-[3px] border border-seil-line px-2 py-2 text-kicker text-seil-text">Task</div>
        {PROZESS_SCHRITTE.map((s, i) => {
          const stand = staende?.[s.nr];
          const [erste, ...rest] = s.lang.split(" · ");
          return (
            <div
              key={`a-${s.nr}`}
              className={`flex min-h-[7.5rem] flex-col rounded-[3px] border bg-seil-surface px-2 py-2 ${
                stand ? standRahmen[stand] : "border-seil-line"
              }`}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-kicker tabular-nums text-seil-muted">{s.nr}</span>
                {i === FREIGABE_SCHRITT_INDEX ? (
                  <span className="rounded-[3px] border border-seil-warning px-1 text-[10px] text-seil-warning">Freigabe</span>
                ) : null}
              </div>
              <div className="mt-1 text-body leading-snug text-seil-text">{erste}</div>
              {rest.length > 0 ? <div className="mt-0.5 text-kicker leading-snug text-seil-muted">{rest.join(" · ")}</div> : null}
              {s.heute ? <div className="mt-auto pt-2 text-[10px] text-seil-accent">heute: {s.heute}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
