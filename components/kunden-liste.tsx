"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NAMEN, PERSONEN } from "@/lib/sitzung-token";
import {
  ARTEN,
  ART_LABEL,
  STUFEN,
  STUFE_LABEL,
  STUFE_TON,
  type Art,
  type KundeAnsicht,
  type Stufe,
} from "@/lib/kunde";
import type { Kundenliste } from "@/app/api/kunden/route";

/**
 * Die Kunden: Investoren, Auftraggeber, Interessenten, Partner.
 *
 * Die Stammdaten kommen aus der Liveliste in OneDrive, der Stand aus der
 * Datenbank. Wer hier eine Stufe oder einen Betreuer setzt, ändert nichts an
 * der Excel – die bleibt die Quelle für das, was sie kann.
 *
 * Neue Kontakte, die noch in keiner Liste stehen, lassen sich direkt anlegen;
 * sie sind als „im Cockpit angelegt“ erkennbar.
 */
export function KundenListe({ kuerzel }: { kuerzel: string }) {
  const router = useRouter();
  const [stand, setStand] = useState<Kundenliste | null>(null);
  const [suche, setSuche] = useState("");
  const [art, setArt] = useState<"alle" | Art>("alle");
  const [stufe, setStufe] = useState<"alle" | Stufe>("alle");
  const [nurMeine, setNurMeine] = useState(false);
  const [laeuft, setLaeuft] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [anlegen, setAnlegen] = useState(false);
  const [neu, setNeu] = useState({ firma: "", ansprechpartner: "", email: "", art: "interessent" as Art });

  const holen = useCallback(
    async (q: string) => {
      setLaeuft(true);
      try {
        const r = await fetch(`/api/kunden${q ? `?suche=${encodeURIComponent(q)}` : ""}`, {
          cache: "no-store",
        });
        setStand((await r.json()) as Kundenliste);
      } catch {
        // naechster Versuch
      } finally {
        setLaeuft(false);
      }
    },
    [],
  );

  useEffect(() => {
    const t = setTimeout(() => void holen(suche.trim()), suche ? 350 : 0);
    return () => clearTimeout(t);
  }, [holen, suche]);

  async function neuAnlegen() {
    const f = neu.firma.trim();
    if (!f) return;
    setFehler(null);
    try {
      const r = await fetch("/api/kunden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firma: f,
          ansprechpartner: neu.ansprechpartner.trim() || null,
          email: neu.email.trim() || null,
          art: neu.art,
          stufe: "neu",
          betreuer: kuerzel || null,
          herkunft: "cockpit",
        }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
      setNeu({ firma: "", ansprechpartner: "", email: "", art: "interessent" });
      setAnlegen(false);
      await holen(suche.trim());
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
    }
  }

  const alle = stand?.kunden ?? [];
  const sichtbar = alle
    .filter((k) => art === "alle" || k.art === art)
    .filter((k) => stufe === "alle" || k.stufe === stufe)
    .filter((k) => !nurMeine || k.betreuer === kuerzel);

  const zaehler = (s: Stufe) => alle.filter((k) => k.stufe === s).length;
  const gepflegt = alle.filter((k) => k.herkunft !== "liveliste").length;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <input
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Firma, Ansprechpartner, Region oder Assetklasse"
          aria-label="Kunden durchsuchen"
          className="min-w-[18rem] flex-1 rounded-seil border border-seil-line bg-seil-card-alt px-3 py-1.5 text-body text-seil-text placeholder:text-seil-muted"
        />
        <label className="grid gap-1 text-kicker text-seil-muted">
          Art
          <select
            value={art}
            onChange={(e) => setArt(e.target.value as "alle" | Art)}
            className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
          >
            <option value="alle">alle</option>
            {ARTEN.map((a) => (
              <option key={a} value={a}>
                {ART_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-kicker text-seil-muted">
          Stufe
          <select
            value={stufe}
            onChange={(e) => setStufe(e.target.value as "alle" | Stufe)}
            className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
          >
            <option value="alle">alle</option>
            {STUFEN.map((s) => (
              <option key={s} value={s}>
                {STUFE_LABEL[s]} ({zaehler(s)})
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-kicker text-seil-muted">
          <input type="checkbox" checked={nurMeine} onChange={(e) => setNurMeine(e.target.checked)} />
          nur meine
        </label>
        <button
          type="button"
          onClick={() => setAnlegen((x) => !x)}
          className="rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1.5 text-body text-seil-text"
        >
          {anlegen ? "Abbrechen" : "Neuer Kunde"}
        </button>
      </div>

      {anlegen ? (
        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-[var(--seil-radius)] border border-seil-accent bg-seil-card p-3">
          <label className="grid gap-1 text-kicker text-seil-muted">
            Firma
            <input
              value={neu.firma}
              onChange={(e) => setNeu({ ...neu, firma: e.target.value })}
              className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
            />
          </label>
          <label className="grid gap-1 text-kicker text-seil-muted">
            Ansprechpartner
            <input
              value={neu.ansprechpartner}
              onChange={(e) => setNeu({ ...neu, ansprechpartner: e.target.value })}
              className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
            />
          </label>
          <label className="grid gap-1 text-kicker text-seil-muted">
            E-Mail
            <input
              value={neu.email}
              onChange={(e) => setNeu({ ...neu, email: e.target.value })}
              className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
            />
          </label>
          <label className="grid gap-1 text-kicker text-seil-muted">
            Art
            <select
              value={neu.art}
              onChange={(e) => setNeu({ ...neu, art: e.target.value as Art })}
              className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
            >
              {ARTEN.map((a) => (
                <option key={a} value={a}>
                  {ART_LABEL[a]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!neu.firma.trim()}
            onClick={() => void neuAnlegen()}
            className="rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-body text-seil-text disabled:opacity-40"
          >
            Anlegen
          </button>
          <span className="text-kicker text-seil-muted">
            Steht danach im Cockpit, nicht in der OneDrive-Liste.
          </span>
        </div>
      ) : null}

      {fehler ? (
        <p className="mb-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}

      <div className="mb-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-kicker text-seil-muted">
        <span>
          <span className="tabular-nums text-seil-text">{sichtbar.length}</span> angezeigt
          {alle.length !== sichtbar.length ? ` von ${alle.length}` : ""}
        </span>
        <span>
          <span className="tabular-nums text-seil-accent">{gepflegt}</span> im CRM gepflegt
        </span>
        {laeuft ? <span>sucht …</span> : null}
      </div>

      <div className="overflow-x-auto rounded-[var(--seil-radius)] border border-seil-line">
        <table className="w-full min-w-[900px] border-collapse text-body">
          <thead>
            <tr className="bg-seil-surface text-left text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
              <th className="px-3 py-2 font-medium">Kunde</th>
              <th className="px-3 py-2 font-medium">Kontakt</th>
              <th className="px-3 py-2 font-medium">Standort</th>
              <th className="px-3 py-2 font-medium">Art</th>
              <th className="px-3 py-2 font-medium">Stufe</th>
              <th className="px-3 py-2 font-medium">Betreuer</th>
            </tr>
          </thead>
          <tbody>
            {sichtbar.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-seil-muted" colSpan={6}>
                  {stand?.modus === "fehler"
                    ? (stand.grund ?? "nicht erreichbar")
                    : laeuft
                      ? "wird geladen …"
                      : "Keine Treffer."}
                </td>
              </tr>
            ) : (
              sichtbar.slice(0, 200).map((k) => (
                <tr
                  key={k.id}
                  onClick={() => router.push(`/kunden/${encodeURIComponent(k.id)}`)}
                  className="cursor-pointer border-t border-seil-line transition-colors hover:bg-seil-card-alt"
                >
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/kunden/${encodeURIComponent(k.id)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-seil-text hover:text-seil-accent"
                    >
                      {k.firma}
                    </Link>
                    {k.herkunft === "cockpit" ? (
                      <span className="ml-2 rounded-seil border border-seil-line px-1.5 text-[10px] text-seil-muted">Cockpit</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-seil-body">
                    {k.ansprechpartner ?? <span className="text-seil-muted">—</span>}
                    {k.email ? <div className="text-kicker text-seil-muted">{k.email}</div> : null}
                  </td>
                  <td className="px-3 py-2.5 text-seil-body">{k.regionen.join(", ") || <span className="text-seil-muted">—</span>}</td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-seil border border-seil-line bg-seil-card-alt px-2 py-0.5 text-kicker text-seil-body">
                      {ART_LABEL[k.art]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-seil border px-2 py-0.5 text-kicker ${STUFE_TON[k.stufe]}`}>
                      {STUFE_LABEL[k.stufe]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-seil-body">
                    {k.betreuer ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-seil-line bg-seil-card-alt text-[10px] uppercase text-seil-body">
                          {k.betreuer}
                        </span>
                        {NAMEN[k.betreuer] ?? k.betreuer}
                      </span>
                    ) : (
                      <span className="text-seil-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {sichtbar.length > 200 ? (
        <p className="mt-2 text-kicker text-seil-muted">
          Angezeigt werden die ersten 200. Such nach Firma, Ansprechpartner oder Region, um die
          Liste einzugrenzen.
        </p>
      ) : null}
      <p className="mt-2 text-kicker leading-relaxed text-seil-muted">
        Klick auf eine Zeile öffnet die Kundenakte mit der vollständigen Historie. Stammdaten kommen
        aus der Investorenliste in OneDrive; Art, Stufe und Betreuer werden in der Akte gepflegt.
      </p>
    </section>
  );
}
