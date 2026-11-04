"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GEBOT_QUELLEN, GEBOT_STUFEN, GEBOT_STUFE_LABEL, preisPasst, type Gebot, type GebotQuelle, type GebotStufe } from "@/lib/reporting";
import { fmtEur } from "@/lib/leistung";
import type { Gebotsliste } from "@/app/api/gebote/route";
import type { Kontaktstand } from "@/app/api/kontakte/route";

/**
 * Gebote eines Mandats – Indikation, Due Diligence, SEIL-HERO.
 *
 * Ein Gebot je Investor; es wandert durch die Stufen. Beträge kommen nur von
 * Hand ins System (Lucas Grundregel: nie automatisch aus Mails). Die Sterne
 * rechnen sich aus den fünf Ranking-Kriterien seiner Vorlage.
 */
const QUELLE_LABEL: Record<GebotQuelle, string> = { mail: "Mail", telefon: "Telefon", termin: "Termin", sonstiges: "Sonstiges" };
const KRITERIEN = [
  ["timeline", "Timeline"],
  ["finanzierung", "Finanzierung"],
  ["ohneBedingungen", "ohne Bedingungen"],
  ["circleKunde", "SEIL-Circle"],
] as const;

const feldKlasse = "rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text placeholder:text-seil-muted";

export function GeboteListe({ mandat, kaufpreis }: { mandat: string; kaufpreis: number | null }) {
  const [liste, setListe] = useState<Gebotsliste | null>(null);
  const [investoren, setInvestoren] = useState<{ id: string; firma: string }[]>([]);
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichert, setSpeichert] = useState(false);
  const [neu, setNeu] = useState<{ investorId: string; frei: string; betrag: string; stufe: GebotStufe; quelle: GebotQuelle | "" }>({
    investorId: "",
    frei: "",
    betrag: "",
    stufe: "indikation",
    quelle: "",
  });

  const laden = useCallback(async () => {
    try {
      const [g, k] = await Promise.all([
        fetch(`/api/gebote?mandat=${encodeURIComponent(mandat)}`, { cache: "no-store" }).then((r) => r.json() as Promise<Gebotsliste>),
        fetch(`/api/kontakte?mandat=${encodeURIComponent(mandat)}`, { cache: "no-store" }).then((r) => r.json() as Promise<Kontaktstand>),
      ]);
      setListe(g);
      setInvestoren(
        k.kontakte.filter((x) => x.status !== "abgesagt").map((x) => ({ id: x.investorId, firma: x.firma ?? x.investorId })),
      );
    } catch {
      setListe({ modus: "fehler", grund: "Gebote nicht erreichbar", gebote: [] });
    }
  }, [mandat]);

  useEffect(() => {
    void laden();
  }, [laden]);

  async function senden(daten: Partial<Gebot> & { investorId: string }) {
    setSpeichert(true);
    setFehler(null);
    try {
      const r = await fetch("/api/gebote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandat, ...daten }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
      return true;
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
      return false;
    } finally {
      setSpeichert(false);
      await laden();
    }
  }

  async function erfassen() {
    const frei = neu.frei.trim();
    const investorId = neu.investorId === "__frei" ? frei : neu.investorId;
    if (!investorId) return setFehler("Investor wählen oder Namen eintragen");
    const firma = neu.investorId === "__frei" ? frei : investoren.find((i) => i.id === investorId)?.firma ?? investorId;
    const betrag = neu.betrag.trim() === "" ? null : Number(neu.betrag.replace(/\./g, "").replace(",", "."));
    if (betrag !== null && !Number.isFinite(betrag)) return setFehler("Betrag ist keine Zahl");
    const ok = await senden({ investorId, firma, betrag, stufe: neu.stufe, ...(neu.quelle ? { quelle: neu.quelle } : {}) });
    if (ok) setNeu({ investorId: "", frei: "", betrag: "", stufe: "indikation", quelle: "" });
  }

  const gebote = liste?.gebote ?? [];
  const aktive = gebote.filter((g) => !g.zurueckgezogen);
  const hoechstes = aktive.reduce<number | null>((m, g) => (g.betrag !== null && (m === null || g.betrag > m) ? g.betrag : m), null);
  const mitGebot = new Set(gebote.map((g) => g.investorId));

  return (
    <section id="gebote" className="mt-5 scroll-mt-20 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Gebote</span>
        <span className="flex flex-wrap items-baseline gap-x-4 text-kicker text-seil-muted">
          <span>
            {aktive.length} aktiv{hoechstes !== null ? ` · höchstes ${fmtEur(hoechstes)}` : ""}
          </span>
          <Link href={`/mandate/${encodeURIComponent(mandat)}/reporting`} className="text-seil-accent hover:underline">
            Reporting für den Verkäufer →
          </Link>
        </span>
      </div>

      {liste && liste.modus !== "live" ? (
        <p className="text-body text-seil-muted">{liste.grund ?? "Gebote nicht verfügbar"}</p>
      ) : (
        <>
          {fehler ? (
            <p className="mb-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">{fehler}</p>
          ) : null}

          {gebote.length > 0 ? (
            <div className="overflow-x-auto rounded-[var(--seil-radius)] border border-seil-line">
              <table className="w-full min-w-[980px] border-collapse text-body">
                <thead>
                  <tr className="bg-seil-surface text-left text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
                    <th className="px-3 py-2 font-medium">Investor</th>
                    <th className="px-3 py-2 font-medium">Betrag €</th>
                    <th className="px-3 py-2 font-medium">Stufe</th>
                    <th className="px-3 py-2 font-medium">Kaufpreis passt</th>
                    <th className="px-3 py-2 font-medium">Kriterien</th>
                    <th className="px-3 py-2 font-medium">Ranking</th>
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {gebote.map((g) => {
                    const preis = preisPasst(g, kaufpreis, hoechstes);
                    const sterne = [preis, g.timeline, g.finanzierung, g.ohneBedingungen, g.circleKunde].filter(Boolean).length;
                    return (
                      <tr key={g.id} className={`border-t border-seil-line align-top ${g.zurueckgezogen ? "opacity-50" : ""}`}>
                        <td className="px-3 py-2 text-seil-text">
                          {g.firma ?? g.investorId}
                          <div className="text-kicker text-seil-muted">
                            {g.quelle ? QUELLE_LABEL[g.quelle] : "Quelle offen"}
                            {g.datum ? ` · ${new Date(g.datum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}` : ""}
                            {g.geaendertDurch ? ` · ${g.geaendertDurch}` : ""}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            key={`${g.id}-${g.betrag ?? "leer"}`}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            defaultValue={g.betrag ?? ""}
                            disabled={speichert}
                            aria-label={`Betrag von ${g.firma ?? g.investorId}`}
                            onBlur={(e) => {
                              const b = e.target.value === "" ? null : Number(e.target.value);
                              if (b !== g.betrag) void senden({ investorId: g.investorId, betrag: b });
                            }}
                            className={`${feldKlasse} w-32 tabular-nums`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={g.stufe}
                            disabled={speichert}
                            aria-label={`Stufe von ${g.firma ?? g.investorId}`}
                            onChange={(e) => void senden({ investorId: g.investorId, stufe: e.target.value as GebotStufe })}
                            className={feldKlasse}
                          >
                            {GEBOT_STUFEN.map((s) => (
                              <option key={s} value={s}>
                                {GEBOT_STUFE_LABEL[s]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={g.preisPasst === null ? "" : g.preisPasst ? "ja" : "nein"}
                            disabled={speichert}
                            aria-label={`Kaufpreis passt bei ${g.firma ?? g.investorId}`}
                            onChange={(e) =>
                              void senden({ investorId: g.investorId, preisPasst: e.target.value === "" ? null : e.target.value === "ja" })
                            }
                            className={feldKlasse}
                          >
                            <option value="">automatisch ({preis ? "ja" : "nein"})</option>
                            <option value="ja">ja</option>
                            <option value="nein">nein</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {KRITERIEN.map(([feld, label]) => (
                              <label key={feld} className="inline-flex items-center gap-1.5 text-kicker text-seil-body">
                                <input
                                  type="checkbox"
                                  checked={g[feld]}
                                  disabled={speichert}
                                  onChange={(e) => void senden({ investorId: g.investorId, [feld]: e.target.checked })}
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-kicker text-seil-warning" aria-label={`${sterne} von 5 Sternen`}>
                          {"★".repeat(sterne)}
                          <span className="text-seil-line">{"★".repeat(5 - sterne)}</span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            disabled={speichert}
                            onClick={() => void senden({ investorId: g.investorId, zurueckgezogen: !g.zurueckgezogen })}
                            className="rounded-seil border border-seil-line px-2 py-0.5 text-kicker text-seil-body hover:border-seil-accent hover:text-seil-accent disabled:opacity-40"
                          >
                            {g.zurueckgezogen ? "wieder aktiv" : "zurückgezogen"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : liste ? (
            <p className="text-body text-seil-muted">Noch keine Gebote. Das erste Gebot unten erfassen – es erscheint sofort im Reporting.</p>
          ) : (
            <p className="text-body text-seil-muted">wird geladen …</p>
          )}

          <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-seil-line pt-3">
            <label className="grid gap-1">
              <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Investor</span>
              <select value={neu.investorId} onChange={(e) => setNeu({ ...neu, investorId: e.target.value })} className={`${feldKlasse} min-w-[200px]`}>
                <option value="">— aus dem Verteiler</option>
                {investoren
                  .filter((i) => !mitGebot.has(i.id))
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.firma}
                    </option>
                  ))}
                <option value="__frei">anderer Investor …</option>
              </select>
            </label>
            {neu.investorId === "__frei" ? (
              <label className="grid gap-1">
                <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Name</span>
                <input value={neu.frei} onChange={(e) => setNeu({ ...neu, frei: e.target.value })} placeholder="Firma oder Person" className={feldKlasse} />
              </label>
            ) : null}
            <label className="grid gap-1">
              <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Betrag €</span>
              <input
                value={neu.betrag}
                inputMode="decimal"
                onChange={(e) => setNeu({ ...neu, betrag: e.target.value })}
                placeholder="z. B. 2450000"
                className={`${feldKlasse} w-36 tabular-nums`}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Stufe</span>
              <select value={neu.stufe} onChange={(e) => setNeu({ ...neu, stufe: e.target.value as GebotStufe })} className={feldKlasse}>
                {GEBOT_STUFEN.map((s) => (
                  <option key={s} value={s}>
                    {GEBOT_STUFE_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Quelle</span>
              <select value={neu.quelle} onChange={(e) => setNeu({ ...neu, quelle: e.target.value as GebotQuelle | "" })} className={feldKlasse}>
                <option value="">—</option>
                {GEBOT_QUELLEN.map((q) => (
                  <option key={q} value={q}>
                    {QUELLE_LABEL[q]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={speichert || !neu.investorId}
              onClick={() => void erfassen()}
              className="rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-body text-seil-text disabled:opacity-40"
            >
              Gebot erfassen
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-seil-muted">
            Beträge nur von Hand – nie automatisch aus Mails. „Kaufpreis passt“ rechnet sich automatisch (ab 95 % des Angebotspreises am Mandat, ohne
            Angebotspreis das höchste Gebot) und lässt sich je Gebot überschreiben. Jede Änderung steht im Verlauf.
          </p>
        </>
      )}
    </section>
  );
}
