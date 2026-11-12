"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { TrackerAntwort } from "@/app/api/statustracker/route";
import { TRACKER_STUFEN, datumKurz, type TrackerZeile } from "@/lib/statustracker";

/**
 * Der Statustracker eines Mandats – Lucas Excel als Seite.
 *
 * Oben die Zählleiste (Gesamt · sechs Stufen · Weiter · Offen · Absage), darunter
 * je Empfänger eine Zeile mit Häkchen, Ergebnis, Follow-up-Stand und nächster
 * Aktion. Der Bearbeiterkommentar ist die Notiz am Kontakt und lässt sich hier
 * ändern; „Nachgefasst“ hält ein Follow-up fest, das jemand selbst geschickt hat.
 */
type Filter = "alle" | "zutun" | "faellig" | "Offen" | "Weiter" | "Absage";

const KICKER = "text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted";

const ERGEBNIS_TON: Record<TrackerZeile["ergebnis"], string> = {
  Weiter: "border-seil-accent bg-seil-accent-bg text-seil-text",
  Offen: "border-seil-line text-seil-muted",
  Absage: "border-seil-line bg-seil-surface text-seil-muted",
};

export function StatusTracker({ mandat }: { mandat: string }) {
  const [daten, setDaten] = useState<TrackerAntwort | null>(null);
  const [filter, setFilter] = useState<Filter>("alle");
  const [fehler, setFehler] = useState<string | null>(null);
  const [beschaeftigt, setBeschaeftigt] = useState<string | null>(null);

  const holen = useCallback(async () => {
    try {
      const r = await fetch(`/api/statustracker?mandat=${encodeURIComponent(mandat)}`, { cache: "no-store" });
      setDaten((await r.json()) as TrackerAntwort);
    } catch {
      setDaten(null);
      setFehler("Statustracker nicht erreichbar");
    }
  }, [mandat]);

  useEffect(() => {
    void holen();
  }, [holen]);

  async function schreiben(z: TrackerZeile, aenderung: Record<string, unknown>) {
    setFehler(null);
    setBeschaeftigt(z.investorId);
    try {
      const r = await fetch("/api/kontakte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandat, kontakte: [{ investorId: z.investorId, ...aenderung }] }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht gespeichert");
    } finally {
      setBeschaeftigt(null);
      await holen();
    }
  }

  const zeilen = useMemo(() => {
    const alle = daten?.zeilen ?? [];
    if (filter === "alle") return alle;
    if (filter === "zutun") return alle.filter((z) => z.zuTun);
    if (filter === "faellig") return alle.filter((z) => z.fu.faellig);
    return alle.filter((z) => z.ergebnis === filter);
  }, [daten, filter]);

  const zahlen = daten?.zahlen;
  const quote = (n: number): string =>
    zahlen && zahlen.erstkontakt > 0 ? `${Math.round((n / zahlen.erstkontakt) * 100)} %` : "";

  const kacheln: { label: string; wert: number; sub?: string; stark?: boolean }[] = zahlen
    ? [
        { label: "Gesamt", wert: zahlen.gesamt, stark: true },
        ...TRACKER_STUFEN.map((s, i) => ({
          label: s.label,
          wert: zahlen[s.schluessel],
          sub: i === 0 ? undefined : quote(zahlen[s.schluessel]),
        })),
        { label: "Weiter", wert: zahlen.weiter },
        { label: "Offen", wert: zahlen.offen },
        { label: "Absage", wert: zahlen.absage },
      ]
    : [];

  const filterKnoepfe: { wert: Filter; label: string; anzahl: number }[] = zahlen
    ? [
        { wert: "alle", label: "Alle", anzahl: zahlen.gesamt },
        { wert: "zutun", label: "Zu tun", anzahl: (daten?.zeilen ?? []).filter((z) => z.zuTun).length },
        { wert: "faellig", label: "Follow-up fällig", anzahl: zahlen.faellig },
        { wert: "Offen", label: "Offen", anzahl: zahlen.offen },
        { wert: "Weiter", label: "Weiter", anzahl: zahlen.weiter },
        { wert: "Absage", label: "Absage", anzahl: zahlen.absage },
      ]
    : [];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/mandate/${encodeURIComponent(mandat)}`} className="text-kicker text-seil-accent hover:underline">
          ← zum Mandat
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void holen()}
            className="rounded-seil border border-seil-line px-3 py-1 text-kicker text-seil-body hover:border-seil-accent hover:text-seil-accent"
          >
            Neu laden
          </button>
          <a
            href={`/api/statustracker?mandat=${encodeURIComponent(mandat)}&format=csv`}
            className="rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-kicker text-seil-text"
          >
            Für Excel laden
          </a>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-title text-seil-text">Statustracker · {mandat}</h1>
        <span className="text-kicker text-seil-muted">
          {daten?.stand
            ? `Stand ${new Date(daten.stand).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
            : ""}
          {zahlen && zahlen.vorgemerkt > 0 ? ` · ${zahlen.vorgemerkt} vorgemerkt, noch nicht angeschrieben` : ""}
        </span>
      </div>

      {fehler ? (
        <p className="mt-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}

      {daten === null ? (
        <p className="mt-4 text-body text-seil-muted">wird geladen …</p>
      ) : daten.modus !== "live" ? (
        <p className="mt-4 rounded-seil border border-seil-line bg-seil-card p-4 text-body text-seil-muted">
          {daten.grund ?? "Statustracker nicht verfügbar"}
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
            {kacheln.map((k) => (
              <div
                key={k.label}
                className={`rounded-seil border px-3 py-2 ${k.stark ? "border-seil-text bg-seil-text text-seil-bg" : "border-seil-line bg-seil-card"}`}
              >
                <div className={`text-[10px] uppercase tracking-[var(--seil-tracking-kicker)] ${k.stark ? "opacity-80" : "text-seil-muted"}`}>
                  {k.label}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-title tabular-nums ${k.stark ? "" : "text-seil-text"}`}>{k.wert}</span>
                  {k.sub ? <span className="text-kicker tabular-nums text-seil-muted">{k.sub}</span> : null}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Zeilen filtern">
            {filterKnoepfe.map((f) => (
              <button
                key={f.wert}
                type="button"
                aria-pressed={filter === f.wert}
                onClick={() => setFilter(f.wert)}
                className={`rounded-seil border px-3 py-1 text-kicker ${
                  filter === f.wert
                    ? "border-seil-accent bg-seil-accent-bg text-seil-text"
                    : "border-seil-line text-seil-body hover:border-seil-accent"
                }`}
              >
                {f.label} <span className="tabular-nums text-seil-muted">{f.anzahl}</span>
              </button>
            ))}
          </div>

          {daten.zeilen.length === 0 ? (
            <p className="mt-4 rounded-seil border border-seil-line bg-seil-card p-4 text-body text-seil-muted">
              Zu diesem Mandat ist noch niemand angeschrieben. Der Tracker füllt sich mit dem ersten Versand.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-seil border border-seil-line bg-seil-card">
              <table className="w-full min-w-[1040px] border-collapse text-left text-kicker">
                <thead>
                  <tr className="border-b border-seil-line">
                    <th scope="col" className={`${KICKER} px-2 py-2 font-normal`}>Nr.</th>
                    <th scope="col" className={`${KICKER} min-w-[190px] px-2 py-2 font-normal`}>Name</th>
                    {TRACKER_STUFEN.map((s) => (
                      <th key={s.schluessel} scope="col" className={`${KICKER} w-[58px] px-1 py-2 text-center font-normal`}>
                        {s.label}
                      </th>
                    ))}
                    <th scope="col" className={`${KICKER} px-2 py-2 font-normal`}>Ergebnis</th>
                    <th scope="col" className={`${KICKER} px-2 py-2 font-normal`}>Letzter Schritt</th>
                    <th scope="col" className={`${KICKER} px-2 py-2 font-normal`}>Nächste Aktion · Follow-up</th>
                    <th scope="col" className={`${KICKER} px-2 py-2 font-normal`}>Bearbeiterkommentar</th>
                  </tr>
                </thead>
                <tbody>
                  {zeilen.map((z, i) => (
                    <tr key={z.investorId} className="border-b border-seil-line align-top last:border-b-0">
                      <td className="px-2 py-2 tabular-nums text-seil-muted">{i + 1}</td>
                      <td className="px-2 py-2">
                        <Link href={`/kunden/${encodeURIComponent(z.investorId)}`} className="text-body text-seil-text hover:text-seil-accent">
                          {z.name}
                        </Link>
                        <div className="text-[11px] text-seil-muted">
                          {[z.email, z.telefon].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      {TRACKER_STUFEN.map((s) => (
                        <td key={s.schluessel} className="px-1 py-2 text-center text-body text-seil-accent">
                          {z.stufen[s.schluessel] ? (
                            <span aria-label={`${s.label}: ja`}>✓</span>
                          ) : (
                            <span className="sr-only">{s.label}: nein</span>
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-2">
                        <span className={`inline-block rounded-seil border px-2 py-0.5 ${ERGEBNIS_TON[z.ergebnis]}`}>{z.ergebnis}</span>
                        {z.absagegrund ? <div className="mt-1 text-[11px] text-seil-muted">{z.absagegrund}</div> : null}
                      </td>
                      <td className="max-w-[190px] px-2 py-2 text-seil-body">
                        <div className="tabular-nums">{datumKurz(z.letzterSchritt) || "—"}</div>
                        {z.kommentar ? <div className="text-[11px] text-seil-muted">{z.kommentar}</div> : null}
                      </td>
                      <td className="px-2 py-2">
                        <div className={z.zuTun ? "text-seil-text" : "text-seil-muted"}>{z.naechsteAktion}</div>
                        {z.fu.gruppe ? (
                          <div className="text-[11px] text-seil-muted">
                            Gruppe {z.fu.gruppe} · <span className="tabular-nums">{z.fu.bisher}</span> Follow-up{z.fu.bisher === 1 ? "" : "s"} bisher
                            {z.fu.faellig && z.fu.faelligAm ? (
                              <span className="tabular-nums text-seil-danger"> · fällig seit {datumKurz(z.fu.faelligAm)}</span>
                            ) : null}
                          </div>
                        ) : null}
                        {z.fu.faellig ? (
                          <button
                            type="button"
                            disabled={beschaeftigt === z.investorId}
                            onClick={() => void schreiben(z, { nachgefasst: true })}
                            title="Hält fest, dass dieses Follow-up von Hand verschickt wurde"
                            className="mt-1 whitespace-nowrap rounded-seil border border-seil-line px-2 py-0.5 text-[11px] text-seil-body hover:border-seil-accent hover:text-seil-accent disabled:opacity-40"
                          >
                            Nachgefasst ✓
                          </button>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          key={`${z.investorId}-${z.notiz ?? ""}`}
                          defaultValue={z.notiz ?? ""}
                          aria-label={`Bearbeiterkommentar zu ${z.name}`}
                          onBlur={(e) => {
                            const neu = e.target.value.trim();
                            if (neu !== (z.notiz ?? "")) void schreiben(z, { notiz: neu || null });
                          }}
                          placeholder="—"
                          className="w-full min-w-[160px] rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-kicker text-seil-text placeholder:text-seil-muted"
                        />
                      </td>
                    </tr>
                  ))}
                  {zeilen.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-3 py-4 text-seil-muted">
                        Keine Zeile in dieser Auswahl.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-2 text-[10px] leading-relaxed text-seil-muted">
            Aufbau wie Lucas Statustracker: Ein Häkchen steht für jede Stufe, die der Kontakt erreicht hat; eine Absage
            nimmt keine Häkchen weg. „Offen“ heißt keine Antwort seit dem Erstkontakt, „Weiter“ mindestens eine Antwort
            ohne Absage. Nachgefasst wird alle zwei Tage, höchstens dreimal je Gruppe (Erstkontakt · NDA · Mappe).
            Abwesenheitsnotizen zählen nicht als Antwort. Stufen ändert ihr im Trichter am Mandat.
          </p>
        </>
      )}
    </>
  );
}
