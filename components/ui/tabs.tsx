"use client";

/**
 * Segmentierte Filterleiste. Bewusst als echte Buttons mit role="tab",
 * damit Tastatur und Screenreader sie als Gruppe verstehen.
 */
export function Tabs({
  items,
  activeId,
  onChange,
  label,
}: {
  items: { id: string; label: string; count?: number }[];
  activeId: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1">
      {items.map((it) => {
        const aktiv = it.id === activeId;
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={aktiv}
            onClick={() => onChange(it.id)}
            className={`h-control rounded-seil border px-3 text-body whitespace-nowrap transition-colors ${
              aktiv
                ? "border-seil-accent bg-seil-accent-bg text-seil-text"
                : "border-seil-line bg-seil-card text-seil-muted hover:text-seil-text"
            }`}
          >
            {it.label}
            {typeof it.count === "number" ? (
              <span className="ml-1.5 text-seil-muted">{it.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
