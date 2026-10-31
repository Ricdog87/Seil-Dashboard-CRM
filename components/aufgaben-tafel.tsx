"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NAMEN, PERSONEN } from "@/lib/sitzung-token";
import { fmtDatum, istUeberfaellig, type Aufgabe } from "@/lib/mandat";
import { AufgabeZeile, Avatar } from "@/components/aufgabe-zeile";
import type { Aufgabenliste } from "@/app/api/aufgaben/route";
import type { Mandatsliste } from "@/app/api/mandate/route";

/**
 * Das Aufgaben-Board.
 *
 * Gruppiert nach Fälligkeit – überfällig, heute, diese Woche, später, ohne
 * Datum –, weil das die Frage ist, die man morgens hat: Was brennt? Oben die
 * Zahlen dazu, daneben die Sicht (meine / alle, offen / erledigt), ein
 * Erfassungsbereich mit Schnellterminen, und jede Zeile öffnet sich für
 * Zuweisung, Termin und Notiz. Aufgaben aus dem Prozess sind markiert: die
 * hat niemand getippt, die kommen aus dem Standardprozess im Trichter.
 */

type Sicht = "meine" | "alle";
type Zustand = "offen" | "erledigt";

function isoHeute(plus = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + plus);
  return d.toISOString().slice(0, 10);
}

function gruppe(a: Aufgabe): "ueberfaellig" | "heute" | "woche" | "spaeter" | "ohne" {
  if (!a.faellig) return "ohne";
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const d = new Date(a.faellig); d.setHours(0, 0, 0, 0);
  const tage = Math.round((d.getTime() - heute.getTime()) / 86_400_000);
  if (tage < 0) return "ueberfaellig";
  if (tage === 0) return "heute";
  if (tage <= 7) return "woche";
  return "spaeter";
}

const GRUPPEN: { id: ReturnType<typeof gruppe>; titel: string; ton: string }[] = [
  { id: "ueberfaellig", titel: "Überfällig", ton: "text-seil-danger" },
  { id: "heute", titel: "Heute", ton: "text-seil-warning" },
  { id: "woche", titel: "Diese Woche", ton: "text-seil-text" },
  { id: "spaeter", titel: "Später", ton: "text-seil-body" },
  { id: "ohne", titel: "Ohne Datum", ton: "text-seil-muted" },
];

export function AufgabenTafel({ kuerzel, darfVerteilen }: { kuerzel: string; darfVerteilen: boolean }) {
  const [stand, setStand] = useState<Aufgabenliste | null>(null);
  const [mandate, setMandate] = useState<string[]>([]);
  const [sicht, setSicht] = useState<Sicht>("meine");
  const [zustand, setZustand] = useState<Zustand>("offen");
  const [mandatFilter, setMandatFilter] = useState("alle");
  const [personFilter, setPersonFilter] = useState("alle");
  const [offenId, setOffenId] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  const [neu, setNeu] = useState({ titel: "", objekt: "", zustaendig: kuerzel, faellig: "", notiz: "" });
  const [erfassen, setErfassen] = useState(false);

  const holen = useCallback(async () => {
    try {
      const r = await fetch("/api/aufgaben", { cache: "no-store" });
      setStand((await r.json()) as Aufgabenliste);
    } catch {
      // naechster Versuch
    }
  }, []);

  useEffect(() => {
    void holen();
    fetch("/api/mandate", { cache: "no-store" })
      .then((r) => r.json() as Promise<Mandatsliste>)
      .then((l) => setMandate(l.mandate.map((m) => m.name)))
      .catch(() => undefined);
    const t = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") void holen();
    }, 45000);
    return () => clearInterval(t);
  }, [holen]);

  const alle = useMemo(() => stand?.aufgaben ?? [], [stand]);
  const meine = useMemo(() => alle.filter((a) => a.zustaendig === kuerzel), [alle, kuerzel]);

  const sichtbar = useMemo(
    () =>
      (sicht === "meine" ? meine : alle)
        .filter((a) => (zustand === "offen" ? !a.erledigt : a.erledigt))
        .filter((a) => mandatFilter === "alle" || a.objekt === mandatFilter)
        .filter((a) => personFilter === "alle" || a.zustaendig === personFilter),
    [alle, meine, sicht, zustand, mandatFilter, personFilter],
  );

  const zaehler = (basis: Aufgabe[]) => ({
    ueberfaellig: basis.filter((a) => !a.erledigt && istUeberfaellig(a)).length,
    heute: basis.filter((a) => !a.erledigt && gruppe(a) === "heute").length,
    woche: basis.filter((a) => !a.erledigt && gruppe(a) === "woche").length,
    ohne: basis.filter((a) => !a.erledigt && !a.faellig).length,
    offen: basis.filter((a) => !a.erledigt).length,
  });
  const z = zaehler(sicht === "meine" ? meine : alle);

  async function patch(id: string, aenderung: Record<string, unknown>) {
    setFehler(null);
    try {
      const r = await fetch("/api/aufgaben", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...aenderung }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
    } finally {
      await holen();
    }
  }

  async function anlegen() {
    const t = neu.titel.trim();
    if (!t) return;
    setLaeuft(true);
    setFehler(null);
    try {
      const r = await fetch("/api/aufgaben", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel: t,
          objekt: neu.objekt || null,
          zustaendig: neu.zustaendig || null,
          faellig: neu.faellig || null,
          notiz: neu.notiz.trim() || null,
        }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
      setNeu({ titel: "", objekt: "", zustaendig: kuerzel, faellig: "", notiz: "" });
      setErfassen(false);
      await holen();
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
    } finally {
      setLaeuft(false);
    }
  }

  const Kachel = ({ wert, label, ton }: { wert: number; label: string; ton: string }) => (
    <div className="min-w-0 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card px-4 py-3">
      <div className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">{label}</div>
      <div className={`mt-1 text-display tabular-nums ${wert > 0 ? ton : "text-seil-muted"}`}>{stand ? wert : "—"}</div>
    </div>
  );

  const Segment = <T extends string>({ wert, setzen, optionen }: { wert: T; setzen: (w: T) => void; optionen: { id: T; label: string; zahl?: number }[] }) => (
    <div className="inline-flex rounded-seil border border-seil-line bg-seil-surface p-0.5 text-kicker">
      {optionen.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => setzen(o.id)}
          className={`rounded-seil px-3 py-1 ${wert === o.id ? "bg-seil-card-alt text-seil-text" : "text-seil-muted hover:text-seil-text"}`}
        >
          {o.label}
          {o.zahl !== undefined ? <span className="ml-1 tabular-nums text-seil-muted">{o.zahl}</span> : null}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kachel wert={z.ueberfaellig} label="Überfällig" ton="text-seil-danger" />
        <Kachel wert={z.heute} label="Heute fällig" ton="text-seil-warning" />
        <Kachel wert={z.woche} label="Diese Woche" ton="text-seil-text" />
        <Kachel wert={z.ohne} label="Ohne Datum" ton="text-seil-body" />
      </section>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {darfVerteilen ? (
          <Segment
            wert={sicht}
            setzen={setSicht}
            optionen={[
              { id: "meine", label: `Meine`, zahl: meine.filter((a) => !a.erledigt).length },
              { id: "alle", label: "Team", zahl: alle.filter((a) => !a.erledigt).length },
            ]}
          />
        ) : null}
        <Segment
          wert={zustand}
          setzen={setZustand}
          optionen={[
            { id: "offen", label: "Offen" },
            { id: "erledigt", label: "Erledigt", zahl: (sicht === "meine" ? meine : alle).filter((a) => a.erledigt).length },
          ]}
        />
        <select
          value={mandatFilter}
          onChange={(e) => setMandatFilter(e.target.value)}
          aria-label="Nach Mandat filtern"
          className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-kicker text-seil-body"
        >
          <option value="alle">alle Mandate</option>
          {mandate.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        {darfVerteilen && sicht === "alle" ? (
          <select
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            aria-label="Nach Person filtern"
            className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-kicker text-seil-body"
          >
            <option value="alle">alle Personen</option>
            {Object.entries(PERSONEN).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
        ) : null}
        <button
          type="button"
          onClick={() => setErfassen((x) => !x)}
          className="ml-auto rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1.5 text-body text-seil-text"
        >
          {erfassen ? "Schließen" : "+ Neue Aufgabe"}
        </button>
      </div>

      {erfassen ? (
        <div className="mt-3 rounded-[var(--seil-radius)] border border-seil-accent bg-seil-card p-4">
          <input
            autoFocus
            value={neu.titel}
            onChange={(e) => setNeu({ ...neu, titel: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") void anlegen(); }}
            placeholder="Was ist zu tun?"
            className="w-full rounded-seil border border-seil-line bg-seil-surface px-3 py-2 text-title text-seil-text placeholder:text-seil-muted"
          />
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-kicker text-seil-muted">
              Mandat
              <select value={neu.objekt} onChange={(e) => setNeu({ ...neu, objekt: e.target.value })} className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text">
                <option value="">— keins</option>
                {mandate.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            {darfVerteilen ? (
              <label className="grid gap-1 text-kicker text-seil-muted">
                Zuständig
                <select value={neu.zustaendig} onChange={(e) => setNeu({ ...neu, zustaendig: e.target.value })} className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text">
                  <option value="">— niemand</option>
                  {Object.entries(PERSONEN).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
                </select>
              </label>
            ) : null}
            <label className="grid gap-1 text-kicker text-seil-muted">
              Fällig
              <input type="date" value={neu.faellig} onChange={(e) => setNeu({ ...neu, faellig: e.target.value })} className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text" />
            </label>
            <div className="flex gap-1 text-kicker">
              {[["Heute", 0], ["Morgen", 1], ["+1 Woche", 7]].map(([l, d]) => (
                <button key={String(l)} type="button" onClick={() => setNeu({ ...neu, faellig: isoHeute(Number(d)) })} className="rounded-seil border border-seil-line px-2 py-1 text-seil-body hover:border-seil-accent hover:text-seil-accent">
                  {l}
                </button>
              ))}
            </div>
            <input
              value={neu.notiz}
              onChange={(e) => setNeu({ ...neu, notiz: e.target.value })}
              placeholder="Notiz (optional)"
              className="min-w-[14rem] flex-1 rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text placeholder:text-seil-muted"
            />
            <button type="button" disabled={laeuft || !neu.titel.trim()} onClick={() => void anlegen()} className="rounded-seil border border-seil-accent bg-seil-accent-bg px-4 py-1.5 text-body text-seil-text disabled:opacity-40">
              Anlegen
            </button>
          </div>
        </div>
      ) : null}

      {fehler ? (
        <p className="mt-3 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">{fehler}</p>
      ) : null}

      <div className="mt-4 grid gap-4">
        {!stand ? (
          <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-6 text-center text-body text-seil-muted">lädt …</div>
        ) : stand.modus !== "live" ? (
          <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-6 text-center text-body text-seil-muted">{stand.grund}</div>
        ) : sichtbar.length === 0 ? (
          <div className="rounded-[var(--seil-radius)] border border-dashed border-seil-line p-8 text-center">
            <div className="text-body text-seil-text">{zustand === "offen" ? "Nichts offen." : "Noch nichts erledigt."}</div>
            <div className="mt-1 text-kicker text-seil-muted">
              {zustand === "offen" ? "Aufgaben entstehen hier von Hand – oder aus dem Standardprozess, wenn ein Investor antwortet." : ""}
            </div>
          </div>
        ) : (
          GRUPPEN.map((g) => {
            const liste = sichtbar.filter((a) => (zustand === "erledigt" ? g.id === "spaeter" : gruppe(a) === g.id));
            if (liste.length === 0) return null;
            return (
              <section key={g.id} className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card">
                <div className="flex items-baseline justify-between border-b border-seil-line px-4 py-2">
                  <span className={`text-kicker uppercase tracking-[var(--seil-tracking-kicker)] ${g.ton}`}>
                    {zustand === "erledigt" ? "Erledigt" : g.titel}
                  </span>
                  <span className="rounded-seil bg-seil-card-alt px-1.5 text-kicker tabular-nums text-seil-muted">{liste.length}</span>
                </div>
                <ul>
                  {liste.map((a) => (
                    <li key={a.id} className="contents">
                      <ul>
                        <AufgabeZeile
                          a={a}
                          offen={offenId === a.id}
                          onAbhaken={(e) => void patch(a.id, { erledigt: e })}
                          onKlick={() => setOffenId((x) => (x === a.id ? null : a.id))}
                        />
                      </ul>
                      {offenId === a.id ? (
                        <div className="flex flex-wrap items-end gap-3 border-b border-seil-line bg-seil-card-alt px-4 py-3 pl-12">
                          {darfVerteilen ? (
                            <label className="grid gap-1 text-kicker text-seil-muted">
                              Zuständig
                              <select value={a.zustaendig ?? ""} onChange={(e) => void patch(a.id, { zustaendig: e.target.value || null })} className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text">
                                <option value="">— niemand</option>
                                {Object.entries(PERSONEN).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
                              </select>
                            </label>
                          ) : null}
                          <label className="grid gap-1 text-kicker text-seil-muted">
                            Fällig
                            <input type="date" value={a.faellig ?? ""} onChange={(e) => void patch(a.id, { faellig: e.target.value || null })} className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text" />
                          </label>
                          <div className="flex gap-1 text-kicker">
                            {[["Heute", 0], ["Morgen", 1], ["+1 Woche", 7]].map(([l, d]) => (
                              <button key={String(l)} type="button" onClick={() => void patch(a.id, { faellig: isoHeute(Number(d)) })} className="rounded-seil border border-seil-line px-2 py-1 text-seil-body hover:border-seil-accent hover:text-seil-accent">
                                {l}
                              </button>
                            ))}
                          </div>
                          <span className="ml-auto inline-flex items-center gap-2 text-kicker text-seil-muted">
                            <Avatar kuerzel={a.zustaendig} />
                            angelegt {fmtDatum(a.erstellt)}
                            {a.quelle === "prozess" ? " · aus dem Prozess" : ""}
                          </span>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>

      <p className="mt-3 text-kicker text-seil-muted">
        {sicht === "meine" || !darfVerteilen ? `Aufgaben von ${NAMEN[kuerzel] ?? kuerzel}.` : "Alle Aufgaben des Teams."}{" "}
        {darfVerteilen ? "Klick auf eine Zeile öffnet Zuweisung und Termin." : "Klick auf eine Zeile öffnet den Termin."}
      </p>
    </>
  );
}
