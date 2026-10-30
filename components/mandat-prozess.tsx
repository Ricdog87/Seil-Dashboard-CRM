"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLive } from "@/components/live-abruf";
import { SopProzess } from "@/components/sop-prozess";
import { Verteiler } from "@/components/verteiler";
import { Anschreiben } from "@/components/anschreiben";
import type { LiveInvestor, LiveInvestoren } from "@/app/api/investoren/route";
import type { Kontaktstand } from "@/app/api/kontakte/route";
import type { Mandatsstand } from "@/app/api/schritte/route";
import type { FreigabeEingang } from "@/app/api/freigaben/route";
import type { Modul01Objekt, Modul01Stand } from "@/lib/modul01";
import { laufPraefix } from "@/lib/mandat";
import type { Stand } from "@/lib/sop-ableitung";

/**
 * Ein Mandat im Prozess: die SOP-Schritte, der Verteiler und der Abgleich
 * gegen die Liveliste – mit dem Anschreiben daraus.
 *
 * Alles, was an einem Mandat zu tun ist, an einer Stelle. Der Datenraum wird
 * über den Laufnamen zugeordnet; gibt es keinen, fehlen nur die Zahlen aus
 * Modul 01, der Rest funktioniert.
 */
function passt(i: LiveInvestor, region: string, assetklasse: string, ticketMio: number | null) {
  if (region !== "alle" && !(i.regionen ?? []).some((r) => r === region)) return false;
  if (assetklasse !== "alle") {
    const ak = i.assetklassen ?? [];
    if (ak.length > 0 && !ak.some((a) => a.toLowerCase().includes(assetklasse.toLowerCase())))
      return false;
  }
  if (ticketMio !== null && (i.ticketMinMio !== null || i.ticketMaxMio !== null)) {
    if (i.ticketMinMio !== null && ticketMio < i.ticketMinMio) return false;
    if (i.ticketMaxMio !== null && ticketMio > i.ticketMaxMio) return false;
  }
  return true;
}

export function MandatProzess({ mandat }: { mandat: string }) {
  const { daten: drStand } = useLive<Modul01Stand>("/api/modul01/status", 30000);
  const { daten: liste } = useLive<LiveInvestoren>("/api/investoren?limit=2000", 60000);

  const [kontaktstand, setKontaktstand] = useState<Kontaktstand | null>(null);
  const [mandatsstand, setMandatsstand] = useState<Mandatsstand | null>(null);
  const [freigabeEingang, setFreigabeEingang] = useState<FreigabeEingang | null>(null);

  const [region, setRegion] = useState("alle");
  const [assetklasse, setAssetklasse] = useState("alle");
  const [ticket, setTicket] = useState("");
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());

  const crmLaden = useCallback(async () => {
    const q = `?mandat=${encodeURIComponent(mandat)}`;
    const [k, s, f] = await Promise.allSettled([
      fetch(`/api/kontakte${q}`, { cache: "no-store" }).then((r) => r.json() as Promise<Kontaktstand>),
      fetch(`/api/schritte${q}`, { cache: "no-store" }).then((r) => r.json() as Promise<Mandatsstand>),
      fetch("/api/freigaben", { cache: "no-store" }).then((r) => r.json() as Promise<FreigabeEingang>),
    ]);
    if (k.status === "fulfilled") setKontaktstand(k.value);
    if (s.status === "fulfilled") setMandatsstand(s.value);
    if (f.status === "fulfilled") setFreigabeEingang(f.value);
  }, [mandat]);

  useEffect(() => {
    void crmLaden();
    const takt = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") void crmLaden();
    }, 30000);
    return () => clearInterval(takt);
  }, [crmLaden]);

  // Den Datenraum zum Mandat finden – über den Laufnamen ohne Zeitstempel.
  const datenraum: Modul01Objekt | undefined = useMemo(() => {
    const alle = drStand
      ? [...Object.values(drStand.objekte ?? {}), ...(drStand.unbekannt ?? [])]
      : [];
    return alle.find((o) => laufPraefix(o.objektName ?? "") === mandat);
  }, [drStand, mandat]);

  const investoren = liste?.investoren ?? [];

  const regionen = useMemo(() => {
    const n = new Map<string, number>();
    for (const i of investoren) for (const r of i.regionen ?? []) n.set(r, (n.get(r) ?? 0) + 1);
    return [...n.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]);
  }, [investoren]);

  const assetklassen = useMemo(() => {
    const n = new Map<string, number>();
    for (const i of investoren) for (const a of i.assetklassen ?? []) n.set(a, (n.get(a) ?? 0) + 1);
    return [...n.entries()].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]);
  }, [investoren]);

  const ticketMio = ticket.trim() === "" ? null : Number(ticket.replace(",", "."));
  const treffer = useMemo(
    () =>
      investoren.filter((i) =>
        passt(i, region, assetklasse, Number.isNaN(ticketMio as number) ? null : ticketMio),
      ),
    [investoren, region, assetklasse, ticketMio],
  );
  const erreichbar = treffer.filter((i) => i.email);
  const markiert = treffer.filter((i) => auswahl.has(i.id));

  const offeneFreigaben = (freigabeEingang?.sendungen ?? [])
    .filter((s) => !s.objekt || s.objekt === mandat)
    .reduce((n, s) => n + s.empfaenger.length, 0);

  const schrittSetzen = useCallback(
    async (nr: number, status: Stand) => {
      try {
        const r = await fetch("/api/schritte", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mandat, schritt: nr, status }),
        });
        const a = (await r.json()) as { ok?: boolean };
        if (!a.ok) return false;
        await crmLaden();
        return true;
      } catch {
        return false;
      }
    },
    [crmLaden, mandat],
  );

  return (
    <>
      <section className="mt-5">
        <h2 className="mb-2 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
          Prozess
        </h2>
        <SopProzess
          mandat={mandat}
          datenraum={datenraum}
          kontakte={kontaktstand?.kontakte ?? []}
          schritte={mandatsstand?.schritte ?? []}
          investorenGesamt={liste?.modus === "live" ? (liste.gesamt ?? investoren.length) : null}
          offeneFreigaben={offeneFreigaben}
          onSetzen={schrittSetzen}
        />
      </section>

      <Verteiler mandat={mandat} stand={kontaktstand} neuLaden={() => void crmLaden()} />

      <section className="mt-5 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
        <h2 className="mb-3 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
          Investoren suchen und anschreiben
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-kicker text-seil-muted">
            Standort
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
            >
              <option value="alle">alle Bundesländer</option>
              {regionen.map(([r, c]) => (
                <option key={r} value={r}>
                  {r} ({c})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-kicker text-seil-muted">
            Assetklasse
            <select
              value={assetklasse}
              onChange={(e) => setAssetklasse(e.target.value)}
              className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
            >
              <option value="alle">alle</option>
              {assetklassen.map(([a, c]) => (
                <option key={a} value={a}>
                  {a} ({c})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-kicker text-seil-muted">
            Volumen in Mio.
            <input
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              inputMode="decimal"
              placeholder="z. B. 8"
              className="w-28 rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text placeholder:text-seil-muted"
            />
          </label>
          <span className="ml-auto text-body text-seil-text">
            <span className="tabular-nums text-seil-accent">{treffer.length}</span> passen ·{" "}
            <span className="tabular-nums">{erreichbar.length}</span> mit E-Mail
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-kicker text-seil-muted">
          <button
            type="button"
            onClick={() => setAuswahl(new Set(erreichbar.map((i) => i.id)))}
            className="rounded-seil border border-seil-line px-2 py-0.5 text-seil-body hover:border-seil-accent hover:text-seil-accent"
          >
            alle {erreichbar.length} erreichbaren auswählen
          </button>
          <button
            type="button"
            onClick={() => setAuswahl(new Set())}
            className="rounded-seil border border-seil-line px-2 py-0.5 text-seil-body hover:border-seil-accent hover:text-seil-accent"
          >
            Auswahl leeren
          </button>
          <span>{markiert.length} ausgewählt</span>
        </div>

        <div className="mt-3 overflow-x-auto rounded-[var(--seil-radius)] border border-seil-line">
          <table className="w-full min-w-[640px] border-collapse text-body">
            <thead>
              <tr className="bg-seil-surface text-left text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
                <th className="w-8 px-3 py-2 font-medium">
                  <span className="sr-only">Auswählen</span>
                </th>
                <th className="px-3 py-2 font-medium">Investor</th>
                <th className="px-3 py-2 font-medium">Ansprechpartner</th>
                <th className="px-3 py-2 font-medium">Standort</th>
                <th className="px-3 py-2 font-medium">Ticket</th>
              </tr>
            </thead>
            <tbody>
              {treffer.slice(0, 12).map((i) => (
                <tr key={i.id} className="border-t border-seil-line hover:bg-seil-card-alt">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={auswahl.has(i.id)}
                      onChange={() =>
                        setAuswahl((a) => {
                          const n = new Set(a);
                          if (n.has(i.id)) n.delete(i.id);
                          else n.add(i.id);
                          return n;
                        })
                      }
                      aria-label={`${i.firma} auswählen`}
                    />
                  </td>
                  <td className="px-3 py-2 text-seil-text">{i.firma}</td>
                  <td className="px-3 py-2 text-seil-body">{i.ansprechpartner ?? "—"}</td>
                  <td className="px-3 py-2 text-seil-body">{(i.regionen ?? []).join(", ") || "—"}</td>
                  <td className="px-3 py-2 tabular-nums text-seil-body">
                    {i.ticketMinMio === null && i.ticketMaxMio === null
                      ? "—"
                      : `${i.ticketMinMio ?? "?"}–${i.ticketMaxMio ?? "?"} Mio.`}
                  </td>
                </tr>
              ))}
              {treffer.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-seil-muted" colSpan={5}>
                    Mit diesen Kriterien passt niemand aus der Liveliste.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {markiert.length > 0 ? (
          <Anschreiben
            objekt={mandat}
            empfaenger={markiert.map((i) => ({
              id: i.id,
              firma: i.firma,
              ansprechpartner: i.ansprechpartner,
              email: i.email,
            }))}
            onFertig={() => {
              setAuswahl(new Set());
              void crmLaden();
            }}
          />
        ) : null}

        <p className="mt-2 text-kicker leading-relaxed text-seil-muted">
          Gerechnet wird über alle {liste?.gesamt ?? investoren.length} Einträge der Liveliste, die
          Tabelle zeigt die ersten zwölf Treffer. Der Standort ist das harte Kriterium; Assetklasse
          und Ticket verengen nur dort, wo die Liste gepflegt ist.
        </p>
      </section>
    </>
  );
}
