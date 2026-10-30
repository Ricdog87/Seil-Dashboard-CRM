"use client";

import { useLive, uhrzeit } from "@/components/live-abruf";
import type { Modul01Stand, Modul01Objekt } from "@/lib/modul01";

/** Die Datenräume aus Modul 01, mit den Zahlen des jeweiligen Laufs. Keine Beispiele. */
export function LiveDatenraeume() {
  const { daten: stand, abgerufen } = useLive<Modul01Stand>("/api/modul01/status", 15000);

  const raeume: Modul01Objekt[] = stand
    ? [...Object.values(stand.objekte ?? {}), ...(stand.unbekannt ?? [])]
    : [];
  const wert = (o: Modul01Objekt, feld: string) =>
    o.kennwerte?.find((k) => k.feld === feld)?.wert ?? "—";

  if (stand?.modus !== "live") return null;

  return (
    <section className="mt-5">
      <h2 className="mb-2 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
        Datenräume aus Modul 01
      </h2>
      <div className="overflow-x-auto rounded-[var(--seil-radius)] border border-seil-line">
        <table className="w-full min-w-[640px] border-collapse text-body">
          <thead>
            <tr className="bg-seil-surface text-left text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
              <th className="px-3 py-2 font-medium">Datenraum</th>
              <th className="px-3 py-2 font-medium">Eingelesen</th>
              <th className="px-3 py-2 font-medium">Abgelegt</th>
              <th className="px-3 py-2 font-medium">Zu prüfen</th>
              <th className="px-3 py-2 font-medium">Duplikate</th>
            </tr>
          </thead>
          <tbody>
            {raeume.map((o, i) => (
              <tr key={`${o.objektName}-${i}`} className="border-t border-seil-line hover:bg-seil-card-alt">
                <td className="px-3 py-2 text-seil-text">{o.objektName}</td>
                <td className="px-3 py-2 tabular-nums text-seil-body">{wert(o, "verarbeitet")}</td>
                <td className="px-3 py-2 tabular-nums text-seil-body">{wert(o, "abgelegt")}</td>
                <td className="px-3 py-2 tabular-nums text-seil-body">{o.dokumente?.length ?? 0}</td>
                <td className="px-3 py-2 tabular-nums text-seil-body">{wert(o, "Duplikate")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-kicker text-seil-muted">
        Die Prüffälle bearbeitet ihr im Datenraum-Center, nicht hier. Diese Tabelle führt sich
        alle 15 Sekunden nach, zuletzt um {uhrzeit(abgerufen)}: ein laufender Datenraum erscheint
        hier, während er entsteht.
      </p>
    </section>
  );
}
