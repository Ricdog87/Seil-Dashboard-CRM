"use client";

import { useCallback, useEffect, useState } from "react";
import { NAMEN } from "@/lib/sitzung-token";
import { fmtZeitpunkt } from "@/lib/mandat";
import type { Notizenliste } from "@/app/api/notizen/route";

/** Notizen zum Mandat – was zwischen den Schritten passiert ist. */
export function NotizenListe({ mandat }: { mandat: string }) {
  const [stand, setStand] = useState<Notizenliste | null>(null);
  const [text, setText] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const holen = useCallback(async () => {
    try {
      const r = await fetch(`/api/notizen?mandat=${encodeURIComponent(mandat)}`, { cache: "no-store" });
      setStand((await r.json()) as Notizenliste);
    } catch {
      // naechster Versuch
    }
  }, [mandat]);

  useEffect(() => {
    void holen();
  }, [holen]);

  async function anlegen() {
    const t = text.trim();
    if (!t) return;
    setLaeuft(true);
    setFehler(null);
    try {
      const r = await fetch("/api/notizen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandat, text: t }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
      setText("");
      await holen();
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
    } finally {
      setLaeuft(false);
    }
  }

  const notizen = stand?.notizen ?? [];

  return (
    <section className="mt-5">
      <h2 className="mb-2 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
        Notizen
      </h2>
      {fehler ? (
        <p className="mb-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}
      <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card">
        {notizen.length === 0 ? (
          <p className="px-4 py-3 text-body text-seil-muted">
            {stand?.modus === "live" ? "Noch keine Notiz." : (stand?.grund ?? "wird geladen …")}
          </p>
        ) : (
          <ul>
            {notizen.map((n) => (
              <li key={n.id} className="border-b border-seil-line px-4 py-2 last:border-0">
                <p className="whitespace-pre-wrap text-body leading-relaxed text-seil-text">{n.text}</p>
                <p className="mt-1 text-kicker text-seil-muted">
                  {(n.autor ? (NAMEN[n.autor] ?? n.autor) : "unbekannt") + " · " + fmtZeitpunkt(n.erstellt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-end gap-2 border-t border-seil-line px-4 py-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Was ist passiert?"
            className="min-w-[16rem] flex-1 rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body leading-relaxed text-seil-text placeholder:text-seil-muted"
          />
          <button
            type="button"
            disabled={laeuft || !text.trim()}
            onClick={() => void anlegen()}
            className="rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-body text-seil-text disabled:opacity-40"
          >
            Notieren
          </button>
        </div>
      </div>
    </section>
  );
}
