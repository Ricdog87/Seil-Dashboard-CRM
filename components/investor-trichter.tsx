"use client";

import { useState } from "react";
import Link from "next/link";
import { STUFEN, STUFEN_LABEL, STUFEN_SOP, type Stufe } from "@/lib/crm";
import { ANTWORT_ARTEN, ANTWORT_LABEL, type AntwortArt } from "@/lib/kommunikation";
import type { Kontakt, Kontaktstand } from "@/app/api/kontakte/route";
import { followupLage } from "@/lib/followup";

/**
 * Der Investoren-Trichter eines Mandats – die Schritte 13 bis 17 des
 * Flowcharts als Tafel.
 *
 * Matching (vorgemerkt), Approach-Mail (angeschrieben), dann der Standardprozess:
 * Anfrage und Exposé, NDA, Datenraum, Preisfrage, Besichtigung. Jede Spalte
 * ist eine Station, jede Karte ein Investor. Ziehen setzt den Stand; „Antwort
 * erfassen“ wendet den Standardprozess an – Stufe, Todo, Follow-up-Leiter neu.
 */

const SPALTEN = STUFEN.filter((s) => s !== "abgesagt") as Stufe[];

export function InvestorTrichter({
  mandat,
  stand,
  neuLaden,
}: {
  mandat: string;
  stand: Kontaktstand | null;
  neuLaden: () => void;
}) {
  const [ziel, setZiel] = useState<Stufe | null>(null);
  const [gezogen, setGezogen] = useState<string | null>(null);
  const [vorlaeufig, setVorlaeufig] = useState<Record<string, Stufe>>({});
  const [fehler, setFehler] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [absagenAuf, setAbsagenAuf] = useState(false);
  const [antwortAuf, setAntwortAuf] = useState<string | null>(null);

  const kontakte = (stand?.kontakte ?? []).map((k) =>
    vorlaeufig[k.investorId] ? { ...k, status: vorlaeufig[k.investorId] } : k,
  );

  async function senden(k: Kontakt, body: Record<string, unknown>) {
    const r = await fetch("/api/kontakte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mandat,
        kontakte: [{ investorId: k.investorId, firma: k.firma, ansprechpartner: k.ansprechpartner, email: k.email, ...body }],
      }),
    });
    const a = (await r.json()) as { ok?: boolean; grund?: string; hinweis?: string; aufgaben?: number };
    if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
    return a;
  }

  async function setzen(k: Kontakt, status: Stufe) {
    if (k.status === status) return;
    setVorlaeufig((v) => ({ ...v, [k.investorId]: status }));
    setFehler(null);
    try {
      await senden(k, { status, letzterKontakt: new Date().toISOString() });
      neuLaden();
    } catch (e) {
      setVorlaeufig((v) => {
        const n = { ...v };
        delete n[k.investorId];
        return n;
      });
      setFehler(`„${k.firma ?? k.investorId}": ${e instanceof Error ? e.message : "nicht gespeichert"}`);
    }
  }

  async function nachgefasst(k: Kontakt) {
    setFehler(null);
    try {
      await senden(k, { status: k.status, nachgefasst: true });
      neuLaden();
    } catch (e) {
      setFehler(`„${k.firma ?? k.investorId}": ${e instanceof Error ? e.message : "nicht gespeichert"}`);
    }
  }

  async function antwort(k: Kontakt, art: AntwortArt) {
    setFehler(null);
    setHinweis(null);
    setAntwortAuf(null);
    try {
      const a = await senden(k, { antwort: art });
      setHinweis(
        a.hinweis ??
          `${k.firma ?? k.investorId}: „${ANTWORT_LABEL[art]}“ erfasst${a.aufgaben ? ` · ${a.aufgaben} Aufgabe${a.aufgaben === 1 ? "" : "n"} aus dem Standardprozess` : ""}.`,
      );
      neuLaden();
    } catch (e) {
      setFehler(`„${k.firma ?? k.investorId}": ${e instanceof Error ? e.message : "nicht gespeichert"}`);
    }
  }

  const inSpalte = (s: Stufe) => kontakte.filter((k) => k.status === s);
  const absagen = inSpalte("abgesagt");

  if (!stand) return null;
  if (stand.modus !== "live") {
    return (
      <div className="mt-3 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4 text-body text-seil-muted">
        Verteiler nicht erreichbar: {stand.grund ?? "unbekannt"}
      </div>
    );
  }
  if (kontakte.length === 0) {
    return (
      <div className="mt-3 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
        <div className="text-body text-seil-text">Noch niemand im Trichter.</div>
        <p className="mt-1 text-kicker leading-relaxed text-seil-muted">
          Wer unten im Abgleich ausgewählt und angeschrieben wird, erscheint hier als Karte und
          wandert mit jedem Schritt des Standardprozesses eine Spalte weiter.
        </p>
      </div>
    );
  }

  const fmt = (iso: string) => new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

  const Karte = ({ k }: { k: Kontakt }) => {
    const f = followupLage(k);
    const offenHier = antwortAuf === k.investorId;
    return (
      <article
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", k.investorId);
          setGezogen(k.investorId);
        }}
        className="cursor-grab rounded-[var(--seil-radius)] border border-seil-line bg-seil-card px-2.5 py-2 hover:border-seil-accent active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-1">
          <Link
            href={`/kunden/${encodeURIComponent(k.investorId)}`}
            className="block min-w-0 truncate text-body text-seil-text hover:text-seil-accent hover:underline"
          >
            {k.firma ?? k.investorId}
          </Link>
          <button
            type="button"
            title="Antwort nach Standardprozess erfassen"
            onClick={(e) => {
              e.preventDefault();
              setAntwortAuf(offenHier ? null : k.investorId);
            }}
            className={`shrink-0 rounded-seil border px-1.5 text-[10px] leading-4 ${
              offenHier ? "border-seil-accent text-seil-accent" : "border-seil-line text-seil-muted hover:border-seil-accent hover:text-seil-accent"
            }`}
          >
            Antwort ▾
          </button>
        </div>
        <div className="truncate text-kicker text-seil-muted">{k.ansprechpartner ?? k.email ?? "—"}</div>

        {offenHier ? (
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            {ANTWORT_ARTEN.map((a) => (
              <button
                key={a}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  void antwort(k, a);
                }}
                className="truncate rounded-seil border border-seil-line bg-seil-surface px-1.5 py-0.5 text-left text-[10px] text-seil-body hover:border-seil-accent hover:text-seil-accent"
              >
                {ANTWORT_LABEL[a]}
              </button>
            ))}
          </div>
        ) : null}

        {k.letzteAntwort ? (
          <div className="mt-1 text-[10px] text-seil-accent">
            Antwort: {ANTWORT_LABEL[k.letzteAntwort] ?? k.letzteAntwort}
            {k.letzteAntwortAm ? ` · ${fmt(k.letzteAntwortAm)}` : ""}
          </div>
        ) : null}

        {f.lage === "faellig" ? (
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="min-w-0 truncate text-[10px] text-seil-danger" title={`${f.name} fällig · ${f.tage} Tage still`}>
              {f.name} fällig · {f.tage} Tage still
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                void nachgefasst(k);
              }}
              className="shrink-0 rounded-seil border border-seil-line px-1.5 text-[10px] text-seil-body hover:border-seil-accent hover:text-seil-accent"
            >
              nachgefasst
            </button>
          </div>
        ) : f.lage === "stumm" ? (
          <div className="mt-0.5 text-[10px] text-seil-muted">
            {f.max > 1 ? "Final Follow up gesendet – kein Interesse angenommen" : "nachgefragt – läuft telefonisch"}
          </div>
        ) : f.lage === "wartet" ? (
          <div className="mt-0.5 text-[10px] text-seil-muted">
            wartet seit {f.tage === 0 ? "heute" : `${f.tage} Tag${f.tage === 1 ? "" : "en"}`}
            {k.followups > 0 ? ` · ${k.followups}/${f.max} nachgefasst` : ""}
          </div>
        ) : k.letzterKontakt ? (
          <div className="mt-0.5 text-[10px] text-seil-muted">zuletzt {fmt(k.letzterKontakt)}</div>
        ) : null}
      </article>
    );
  };

  const spalteProps = (s: Stufe) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (ziel !== s) setZiel(s);
    },
    onDragLeave: () => setZiel((z) => (z === s ? null : z)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain") || gezogen;
      setZiel(null);
      setGezogen(null);
      const k = kontakte.find((x) => x.investorId === id);
      if (k) void setzen(k, s);
    },
  });

  return (
    <div className="mt-3">
      {fehler ? (
        <p className="mb-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}
      {hinweis ? (
        <p className="mb-2 rounded-[var(--seil-radius)] border border-seil-line px-3 py-2 text-kicker text-seil-body">{hinweis}</p>
      ) : null}
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1280px] grid-cols-8 gap-2">
          {SPALTEN.map((stufe) => {
            const liste = inSpalte(stufe);
            return (
              <div
                key={stufe}
                {...spalteProps(stufe)}
                className={`flex min-h-[9rem] min-w-0 flex-col rounded-[var(--seil-radius)] border bg-seil-surface p-2 transition-colors ${
                  ziel === stufe ? "border-seil-accent bg-seil-accent-bg" : "border-seil-line"
                }`}
              >
                <div className="mb-2 px-0.5">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="truncate text-kicker text-seil-text">{STUFEN_LABEL[stufe]}</span>
                    <span className="rounded-seil bg-seil-card-alt px-1.5 text-kicker tabular-nums text-seil-muted">
                      {liste.length}
                    </span>
                  </div>
                  <div className="truncate text-[10px] text-seil-muted" title={STUFEN_SOP[stufe]}>
                    {STUFEN_SOP[stufe]}
                  </div>
                </div>
                <div className="grid min-w-0 grid-cols-1 gap-1.5">
                  {liste.map((k) => (
                    <Karte key={k.investorId} k={k} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        {...spalteProps("abgesagt")}
        className={`mt-1 rounded-[var(--seil-radius)] border border-dashed px-3 py-2 ${
          ziel === "abgesagt" ? "border-seil-danger bg-seil-danger-bg" : "border-seil-line"
        }`}
      >
        <button
          type="button"
          onClick={() => setAbsagenAuf((x) => !x)}
          className="text-kicker text-seil-muted hover:text-seil-text"
        >
          {absagenAuf ? "▾" : "▸"} Absagen ({absagen.length}) – Karte hierher ziehen; laut Standardprozess folgt die
          Frage nach den Investment-Kriterien
        </button>
        {absagenAuf && absagen.length > 0 ? (
          <div className="mt-2 grid gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
            {absagen.map((k) => (
              <Karte key={k.investorId} k={k} />
            ))}
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-kicker text-seil-muted">
        Die Spalten sind die Schritte 13 bis 17 eures Flowcharts. „Antwort ▾“ erfasst, was der Investor
        geschrieben hat – nach dem Standardprozess: Stufe, Todo an die zuständige Person, Follow-up-Leiter
        neu. Jede Änderung ist sofort gespeichert und steht im Verlauf.
      </p>
    </div>
  );
}
