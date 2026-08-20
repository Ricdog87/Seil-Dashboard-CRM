"use client";

import { useState } from "react";
import { StickyNote } from "lucide-react";
import { mitarbeiterVon } from "@/lib/derive";
import { GF_ID } from "@/lib/mock-data";
import { Button, ICON_SM, ICON_STROKE, Input } from "@/components/ui";
import { useSitzung } from "./sitzung";

/**
 * Notiz direkt am Objekt erfassen – landet sofort oben in der Historie.
 * Klickdummy: Notizen leben nur in dieser Sitzung.
 */
export function NotizErfassen({ objektId }: { objektId: string }) {
  const { mitarbeiterId, notizen, notizErfassen } = useSitzung();
  const [text, setText] = useState("");
  const meine = notizen.filter((n) => n.objektId === objektId);

  const absenden = () => {
    const t = text.trim();
    if (!t) return;
    notizErfassen(objektId, t);
    setText("");
  };

  // GF-Konto ist Nur-Lese-Sicht: keine Erfassung, vorhandene Sitzungsnotizen bleiben sichtbar.
  const nurLesen = mitarbeiterId === GF_ID;
  if (nurLesen && meine.length === 0) return null;

  return (
    <div className="border-b border-seil-line">
      {nurLesen ? null : (
      <form
        className="flex items-center gap-2 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          absenden();
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Notiz zu diesem Objekt erfassen … (Prototyp: nur diese Sitzung)"
          aria-label="Neue Notiz"
          className="min-w-0 flex-1"
        />
        <Button variant="primary" type="submit" disabled={!text.trim()}>
          Notiz erfassen
        </Button>
      </form>
      )}
      {meine.length > 0 ? (
        <ul className={`divide-y divide-seil-line ${nurLesen ? "" : "border-t border-seil-line"}`}>
          {meine.map((n) => {
            const autor = mitarbeiterVon(n.mitarbeiterId);
            return (
              <li key={n.id} className="flex gap-3 px-4 py-3">
                <span className="w-[92px] shrink-0 text-kicker text-seil-muted">soeben</span>
                <StickyNote
                  size={ICON_SM}
                  strokeWidth={ICON_STROKE}
                  className="mt-px shrink-0 text-seil-muted"
                  aria-label="Notiz"
                />
                <div className="min-w-0">
                  <p className="text-seil-body">{n.text}</p>
                  <p className="mt-1.5 text-kicker text-seil-muted">{autor?.name}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
