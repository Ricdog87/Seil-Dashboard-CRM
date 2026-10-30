"use client";

import { useMemo, useState } from "react";
import { useLive, uhrzeit } from "@/components/live-abruf";
import type { LiveInvestoren, LiveInvestor } from "@/app/api/investoren/route";
import type { Modul01Objekt, Modul01Stand } from "@/lib/modul01";
import { Anschreiben } from "@/components/anschreiben";
import { Verteiler } from "@/components/verteiler";

/**
 * Der Transaktionsprozess eines Mandats – von der Datenraum-Übernahme bis zur
 * Rückmeldung des Investors.
 *
 * Jede Zahl auf dieser Seite stammt aus einer der beiden Live-Quellen:
 * den Datenraum-Läufen aus Modul 01 (WF 09) und der Investoren-Liveliste in
 * OneDrive (WF 10). Wo eine Stufe noch keine Daten hat, steht das da – es wird
 * nichts ausgedacht, damit im Cockpit nichts behauptet wird, was nicht passiert
 * ist.
 */

type Zustand = "erledigt" | "laeuft" | "wartet";

const zustandMeta: Record<Zustand, { punkt: string; rahmen: string; wort: string }> = {
  erledigt: { punkt: "bg-seil-success", rahmen: "border-seil-line", wort: "erledigt" },
  laeuft: { punkt: "bg-seil-accent", rahmen: "border-seil-accent", wort: "läuft" },
  wartet: { punkt: "bg-seil-muted", rahmen: "border-dashed border-seil-line", wort: "wartet" },
};

/** "Portfolio-Otto-Probe-30-10_20261030-070222" → Name und Zeitpunkt des Laufs. */
function laufName(roh: string): { name: string; lauf: string } {
  const m = /^(.*)_(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(roh);
  if (!m) return { name: roh, lauf: "" };
  const [, name, j, mo, t, h, mi] = m;
  return { name, lauf: `Lauf vom ${t}.${mo}.${j}, ${h}:${mi} Uhr` };
}

function zahl(o: Modul01Objekt | undefined, feld: string): number | null {
  const roh = o?.kennwerte?.find((k) => k.feld === feld)?.wert;
  const n = Number(roh);
  return roh === undefined || Number.isNaN(n) ? null : n;
}

/**
 * Abgleich wie in WF 02: der Standort ist das harte Kriterium. Assetklasse und
 * Ticket stehen in der Liveliste nur bei wenigen Investoren – sie verengen den
 * Treffer deshalb nur, wo sie gepflegt sind, und schließen niemanden aus, über
 * den die Liste schweigt.
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

export function Transaktionsprozess() {
  const { daten: stand, abgerufen, laeuft, holen } = useLive<Modul01Stand>("/api/modul01/status", 15000);
  const { daten: liste } = useLive<LiveInvestoren>("/api/investoren?limit=2000", 60000);

  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const [region, setRegion] = useState("alle");
  const [assetklasse, setAssetklasse] = useState("alle");
  const [ticket, setTicket] = useState("");
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());

  const mandate = useMemo(
    () => (stand ? [...Object.values(stand.objekte ?? {}), ...(stand.unbekannt ?? [])] : []),
    [stand],
  );
  const mandat = mandate.find((m) => m.objektName === gewaehlt) ?? mandate[0];
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
  const umschalten = (id: string) =>
    setAuswahl((a) => {
      const n = new Set(a);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const verarbeitet = zahl(mandat, "verarbeitet");
  const abgelegt = zahl(mandat, "abgelegt");
  const dubletten = zahl(mandat, "Duplikate");
  const offen = mandat?.dokumente?.length ?? 0;
  const freigaben = mandat?.freigaben?.length ?? 0;
  const { name, lauf } = laufName(mandat?.objektName ?? "");

  const kriterium =
    region === "alle" && assetklasse === "alle" && ticketMio === null
      ? "ganze Liste, noch nicht eingegrenzt"
      : [
          region !== "alle" ? region : null,
          assetklasse !== "alle" ? assetklasse : null,
          ticketMio !== null && !Number.isNaN(ticketMio) ? `${ticketMio} Mio. Ticket` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  const stufen: { nr: number; titel: string; wer: string; zustand: Zustand; wert: string; hinweis: string }[] = [
    {
      nr: 1,
      titel: "Datenraum übernommen",
      wer: "Automatik",
      zustand: verarbeitet ? "erledigt" : "wartet",
      wert: verarbeitet !== null ? `${verarbeitet} Dokumente` : "—",
      hinweis: "aus dem Mandatsordner in OneDrive eingelesen",
    },
    {
      nr: 2,
      titel: "Struktur & Ablage",
      wer: "Automatik",
      zustand: abgelegt && verarbeitet && abgelegt >= verarbeitet ? "erledigt" : abgelegt ? "laeuft" : "wartet",
      wert: abgelegt !== null ? `${abgelegt} abgelegt` : "—",
      hinweis: dubletten !== null ? `${dubletten} Dubletten erkannt` : "einsortiert nach Ordnerlogik",
    },
    {
      nr: 3,
      titel: "Qualitätsprüfung",
      wer: "Team",
      zustand: offen > 0 ? "laeuft" : "erledigt",
      wert: `${offen} offen`,
      hinweis: offen > 0 ? "Bearbeitung im Datenraum-Center" : "keine offenen Prüffälle",
    },
    {
      nr: 4,
      titel: "Investoren-Abgleich",
      wer: "Automatik",
      zustand: liste?.modus === "live" ? "laeuft" : "wartet",
      wert:
        liste?.modus === "live"
          ? `${treffer.length} von ${liste.gesamt ?? investoren.length}`
          : "—",
      hinweis: kriterium,
    },
    {
      nr: 5,
      titel: "Freigabe",
      wer: "Geschäftsführung",
      zustand: freigaben > 0 ? "erledigt" : "wartet",
      wert: `${freigaben} erteilt`,
      hinweis: "ohne Freigabe geht keine Mail raus",
    },
    {
      nr: 6,
      titel: "Versand",
      wer: "Automatik",
      zustand: "wartet",
      wert: "nach Freigabe",
      hinweis: "Anschreiben je Investor, BCC-Verteiler",
    },
    {
      nr: 7,
      titel: "Rückmeldungen",
      wer: "Automatik & Team",
      zustand: "wartet",
      wert: "—",
      hinweis: "Interesse → Broker Call, Preisanfrage → Rückruf GF",
    },
  ];

  if (stand && stand.modus !== "live") {
    return (
      <section className="mt-5 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
        <h2 className="text-body text-seil-text">Transaktionsprozess</h2>
        <p className="mt-1 text-kicker text-seil-muted">
          Modul 01 ist gerade nicht erreichbar ({stand.grund ?? "unbekannt"}). Sobald der Server
          wieder antwortet, steht der Prozess hier von selbst.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
          Transaktionsprozess
        </h2>
        <span className="inline-flex items-center gap-2 text-kicker text-seil-muted">
          aktualisiert {uhrzeit(abgerufen)}
          <button
            type="button"
            onClick={() => void holen()}
            className="rounded-seil border border-seil-line px-2 py-0.5 text-kicker text-seil-body hover:border-seil-accent hover:text-seil-accent"
          >
            {laeuft ? "lädt" : "jetzt"}
          </button>
        </span>
      </div>

      <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
        {/* Mandat wählen – die Liste sind die echten Datenraum-Läufe, keine Beispiele. */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {mandate.map((m) => {
            const aktiv = m.objektName === (mandat?.objektName ?? "");
            return (
              <button
                key={m.objektName}
                type="button"
                onClick={() => setGewaehlt(m.objektName ?? null)}
                className={`rounded-seil border px-3 py-1 text-body transition-colors ${
                  aktiv
                    ? "border-seil-accent bg-seil-accent-bg text-seil-text"
                    : "border-seil-line text-seil-muted hover:border-seil-accent hover:text-seil-text"
                }`}
              >
                {laufName(m.objektName ?? "").name}
              </button>
            );
          })}
          {mandat ? <span className="text-kicker text-seil-muted">{lauf}</span> : null}
        </div>

        {mandat ? (
          <>
            <div className="mb-1 text-body text-seil-text">{name}</div>
            <ol className="grid gap-2 lg:grid-cols-7">
              {stufen.map((s) => {
                const meta = zustandMeta[s.zustand];
                return (
                  <li
                    key={s.nr}
                    className={`min-w-0 rounded-[var(--seil-radius)] border bg-seil-surface px-3 py-2 ${meta.rahmen}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${meta.punkt}`} aria-hidden />
                      <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
                        {s.nr}. {s.wer}
                      </span>
                    </div>
                    <div className="mt-1 text-body text-seil-text">{s.titel}</div>
                    <div className="mt-1 text-body tabular-nums text-seil-accent">{s.wert}</div>
                    <div className="mt-1 text-kicker leading-relaxed text-seil-muted">{s.hinweis}</div>
                    <span className="sr-only">{meta.wort}</span>
                  </li>
                );
              })}
            </ol>
          </>
        ) : (
          <p className="text-kicker text-seil-muted">Noch kein Datenraum-Lauf vorhanden.</p>
        )}
      </div>

      {/* Stufen 5 bis 7 zum Anfassen: wer steht wo im Prozess. */}
      {mandat ? <Verteiler mandat={name} /> : null}

      {/* Stufe 4 zum Anfassen: der Abgleich rechnet gegen die echte Liveliste. */}
      <div className="mt-3 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
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
            <span className="tabular-nums text-seil-accent">{treffer.length}</span> Investoren passen
            {" · "}
            <span className="tabular-nums">{erreichbar.length}</span> davon mit E-Mail erreichbar
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
                <th className="px-3 py-2 font-medium">Assetklasse</th>
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
                      onChange={() => umschalten(i.id)}
                      aria-label={`${i.firma} auswählen`}
                    />
                  </td>
                  <td className="px-3 py-2 text-seil-text">{i.firma}</td>
                  <td className="px-3 py-2 text-seil-body">{i.ansprechpartner ?? "—"}</td>
                  <td className="px-3 py-2 text-seil-body">{(i.regionen ?? []).join(", ") || "—"}</td>
                  <td className="px-3 py-2 text-seil-body">{(i.assetklassen ?? []).join(", ") || "—"}</td>
                  <td className="px-3 py-2 tabular-nums text-seil-body">
                    {i.ticketMinMio === null && i.ticketMaxMio === null
                      ? "—"
                      : `${i.ticketMinMio ?? "?"}–${i.ticketMaxMio ?? "?"} Mio.`}
                  </td>
                </tr>
              ))}
              {treffer.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-seil-muted" colSpan={6}>
                    Mit diesen Kriterien passt niemand aus der Liveliste.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {markiert.length > 0 ? (
          <Anschreiben
            objekt={name}
            empfaenger={markiert.map((i) => ({
              id: i.id,
              firma: i.firma,
              ansprechpartner: i.ansprechpartner,
              email: i.email,
            }))}
            onFertig={() => setAuswahl(new Set())}
          />
        ) : null}

        <p className="mt-2 text-kicker leading-relaxed text-seil-muted">
          Gerechnet wird über alle {liste?.gesamt ?? investoren.length} Einträge der Liveliste, nicht
          über einen Ausschnitt; die Tabelle zeigt die ersten zwölf Treffer. Der Standort ist das
          harte Kriterium. Assetklasse und Ticket sind in der Liste bisher nur bei wenigen
          Investoren gepflegt – wer dazu nichts hinterlegt hat, fliegt deshalb nicht raus, sondern
          bleibt im Treffer. Wird die Spalte gepflegt, wird der Abgleich automatisch schärfer.
        </p>
      </div>
    </section>
  );
}
