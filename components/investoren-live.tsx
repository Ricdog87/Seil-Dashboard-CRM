"use client";

import { useEffect, useState } from "react";
import type { LiveInvestoren, LiveInvestor } from "@/app/api/investoren/route";

/**
 * Investoren-Liveliste aus OneDrive. Keine Demodaten: was hier steht, steht
 * genau so in der Liste des Vertriebs. Gelesen wird über den Server, der
 * Browser sieht weder Adresse noch Geheimnis.
 */
export function InvestorenLive() {
  const [stand, setStand] = useState<LiveInvestoren | null>(null);
  const [suche, setSuche] = useState("");
  const [laeuft, setLaeuft] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLaeuft(true);
      fetch(`/api/investoren${suche ? `?suche=${encodeURIComponent(suche)}` : ""}`, { cache: "no-store" })
        .then((r) => r.json() as Promise<LiveInvestoren>)
        .then(setStand)
        .catch(() => setStand({ modus: "fehler", grund: "nicht erreichbar", investoren: [] }))
        .finally(() => setLaeuft(false));
    }, suche ? 350 : 0);
    return () => clearTimeout(t);
  }, [suche]);

  const ticket = (i: LiveInvestor) =>
    i.ticketMinMio === null && i.ticketMaxMio === null
      ? "—"
      : `${i.ticketMinMio ?? "?"}–${i.ticketMaxMio ?? "?"} Mio.`;

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          id="investoren-suche"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Firma, Ansprechpartner, Region oder Assetklasse"
          className="h-[var(--seil-control-h)] min-w-0 flex-1 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card-alt px-3 text-body text-seil-text placeholder:text-seil-muted focus:border-seil-accent focus:outline-none"
        />
        <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
          {stand?.modus === "live"
            ? `${stand.investoren.length} von ${stand.gesamt ?? "?"} · OneDrive · ${
                stand.stand ? new Date(stand.stand).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : ""
              }`
            : stand?.modus === "aus"
              ? "nicht verbunden"
              : stand?.modus === "fehler"
                ? `Fehler: ${stand.grund}`
                : "lädt"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-[var(--seil-radius)] border border-seil-line">
        <table className="w-full min-w-[720px] border-collapse text-body">
          <thead>
            <tr className="bg-seil-surface text-left text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
              <th className="px-3 py-2 font-medium">Investor</th>
              <th className="px-3 py-2 font-medium">Ansprechpartner</th>
              <th className="px-3 py-2 font-medium">Region</th>
              <th className="px-3 py-2 font-medium">Assetklasse</th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">Ticket</th>
            </tr>
          </thead>
          <tbody>
            {(stand?.investoren ?? []).map((i, n) => (
              <tr key={`${i.id}-${n}`} className="border-t border-seil-line align-top hover:bg-seil-card-alt">
                <td className="px-3 py-2">
                  <div className="text-seil-text">{i.firma}</div>
                  {i.email ? <div className="text-seil-muted">{i.email}</div> : null}
                </td>
                <td className="px-3 py-2 text-seil-body">{i.ansprechpartner ?? "—"}</td>
                <td className="px-3 py-2 text-seil-body">{i.regionen.join(", ") || "—"}</td>
                <td className="px-3 py-2 text-seil-body">{i.assetklassen.join(", ") || "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap tabular-nums text-seil-body">{ticket(i)}</td>
              </tr>
            ))}
            {!laeuft && (stand?.investoren.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-seil-muted">
                  {stand?.modus === "live" ? "Kein Treffer in der Liveliste." : (stand?.grund ?? "Keine Daten.")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-kicker text-seil-muted">
        Direkt aus der Investoren-Liveliste in OneDrive gelesen, bei jedem Aufruf neu. Das Cockpit
        speichert nichts davon; Änderungen gehören weiterhin in die Liste selbst.
      </p>
    </section>
  );
}
