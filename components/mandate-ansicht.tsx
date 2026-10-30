"use client";

import { useState } from "react";
import { PipelineTafel } from "@/components/pipeline-tafel";
import { MandateListe } from "@/components/mandate-liste";

/** Tafel oder Liste – dieselben Mandate, zwei Blickwinkel. Die Tafel ist der Standard. */
export function MandateAnsicht({ kuerzel }: { kuerzel: string }) {
  const [ansicht, setAnsicht] = useState<"tafel" | "liste">("tafel");
  return (
    <>
      <div className="mb-3 inline-flex rounded-seil border border-seil-line bg-seil-surface p-0.5 text-kicker">
        {(["tafel", "liste"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAnsicht(a)}
            className={`rounded-seil px-3 py-1 ${
              ansicht === a ? "bg-seil-card-alt text-seil-text" : "text-seil-muted hover:text-seil-text"
            }`}
          >
            {a === "tafel" ? "Pipeline" : "Liste & Anlegen"}
          </button>
        ))}
      </div>
      {ansicht === "tafel" ? <PipelineTafel kuerzel={kuerzel} /> : <MandateListe kuerzel={kuerzel} />}
    </>
  );
}
