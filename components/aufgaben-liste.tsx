"use client";

import { useCallback, useEffect, useState } from "react";
import { NAMEN, PERSONEN } from "@/lib/sitzung-token";
import { istUeberfaellig, type Aufgabe } from "@/lib/mandat";
import { AufgabeZeile } from "@/components/aufgabe-zeile";
import type { Aufgabenliste } from "@/app/api/aufgaben/route";

/**
 * Aufgaben – mit Namen und Datum daran, sonst ist es ein Zettel.
 *
 * Wird sie ohne Mandat benutzt, zeigt sie die Aufgaben einer Person; mit Mandat
 * die dieses Mandats. Beides dieselbe Liste, damit niemand zwei Orte im Kopf
 * behalten muss, an denen Aufgaben stehen könnten.
 */
export function AufgabenListe({
  mandat,
  zustaendig,
  investorId,
  titel,
  kompakt = false,
  ohneKopf = false,
}: {
  mandat?: string;
  zustaendig?: string;
  investorId?: string;
  titel: string;
  kompakt?: boolean;
  ohneKopf?: boolean;
}) {
  const [stand, setStand] = useState<Aufgabenliste | null>(null);
  const [neu, setNeu] = useState("");
  const [faellig, setFaellig] = useState("");
  const [wer, setWer] = useState(zustaendig ?? "");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [alleZeigen, setAlleZeigen] = useState(false);

  const holen = useCallback(async () => {
    const q = new URLSearchParams();
    if (mandat) q.set("mandat", mandat);
    if (zustaendig) q.set("zustaendig", zustaendig);
    if (investorId) q.set("investor", investorId);
    try {
      const r = await fetch(`/api/aufgaben?${q}`, { cache: "no-store" });
      setStand((await r.json()) as Aufgabenliste);
    } catch {
      // naechster Versuch holt es nach
    }
  }, [mandat, zustaendig, investorId]);

  useEffect(() => {
    void holen();
  }, [holen]);

  async function anlegen() {
    const t = neu.trim();
    if (!t) return;
    setLaeuft(true);
    setFehler(null);
    try {
      const r = await fetch("/api/aufgaben", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel: t,
          objekt: mandat ?? null,
          investorId: investorId ?? null,
          zustaendig: wer || null,
          faellig: faellig || null,
        }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
      setNeu("");
      setFaellig("");
      await holen();
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
    } finally {
      setLaeuft(false);
    }
  }

  async function abhaken(a: Aufgabe, erledigt: boolean) {
    setStand((s) =>
      s ? { ...s, aufgaben: s.aufgaben.map((x) => (x.id === a.id ? { ...x, erledigt } : x)) } : s,
    );
    try {
      const r = await fetch("/api/aufgaben", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, erledigt }),
      });
      const j = (await r.json()) as { ok?: boolean; grund?: string };
      if (!j.ok) throw new Error(j.grund ?? "nicht gespeichert");
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
    } finally {
      await holen();
    }
  }

  const alle = stand?.aufgaben ?? [];
  const offen = alle.filter((a) => !a.erledigt);
  const sichtbar = alleZeigen ? alle : offen;
  const ueberfaellig = offen.filter((a) => istUeberfaellig(a)).length;

  return (
    <section className={kompakt ? "" : "mt-5"}>
      <div className={`mb-2 flex flex-wrap items-baseline justify-between gap-2 ${ohneKopf ? "hidden" : ""}`}>
        <h2 className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
          {titel} {offen.length > 0 ? `· ${offen.length} offen` : ""}
          {ueberfaellig > 0 ? (
            <span className="ml-2 text-seil-danger">{ueberfaellig} überfällig</span>
          ) : null}
        </h2>
        {alle.length > offen.length ? (
          <button
            type="button"
            onClick={() => setAlleZeigen((x) => !x)}
            className="text-kicker text-seil-accent hover:underline"
          >
            {alleZeigen ? "erledigte ausblenden" : `erledigte zeigen (${alle.length - offen.length})`}
          </button>
        ) : null}
      </div>

      {fehler ? (
        <p className="mb-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}

      <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card">
        {sichtbar.length === 0 ? (
          <p className="px-4 py-3 text-body text-seil-muted">
            {stand?.modus === "live"
              ? "Nichts offen."
              : (stand?.grund ?? "wird geladen …")}
          </p>
        ) : (
          <ul>
            {sichtbar.map((a) => (
              <AufgabeZeile
                key={a.id}
                a={a}
                zeigeMandat={!mandat}
                onAbhaken={(e) => void abhaken(a, e)}
              />
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-seil-line px-4 py-2">
          <input
            value={neu}
            onChange={(e) => setNeu(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void anlegen();
            }}
            placeholder="Neue Aufgabe …"
            className="min-w-[14rem] flex-1 rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text placeholder:text-seil-muted"
          />
          <select
            value={wer}
            onChange={(e) => setWer(e.target.value)}
            aria-label="Zuständig"
            className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-kicker text-seil-body"
          >
            <option value="">niemand</option>
            {Object.entries(PERSONEN).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={faellig}
            onChange={(e) => setFaellig(e.target.value)}
            aria-label="Fällig am"
            className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-kicker text-seil-body"
          />
          <button
            type="button"
            disabled={laeuft || !neu.trim()}
            onClick={() => void anlegen()}
            className="rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-body text-seil-text disabled:opacity-40"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </section>
  );
}
