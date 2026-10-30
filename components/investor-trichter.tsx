"use client";

import { useState } from "react";
import Link from "next/link";
import { STUFEN, STUFEN_LABEL, type Stufe } from "@/lib/crm";
import type { Kontakt, Kontaktstand } from "@/app/api/kontakte/route";

/**
 * Der Investoren-Trichter eines Mandats – die Investorenseite der SOP als Tafel.
 *
 * Schritte 15 bis 19 der SOP sind genau dieser Weg: Approach-Mailing, NDA,
 * Datenraum Light, Broker Call bei Interesse, indikatives Angebot. Jede Spalte
 * ist eine dieser Stationen, jede Karte ein Investor. Ziehen setzt den Stand –
 * dasselbe, was in der Listenansicht die Auswahl tut, nur mit Blick auf den
 * ganzen Trichter.
 */

const SPALTEN: { stufe: Stufe; hinweis: string }[] = [
  { stufe: "vorgemerkt", hinweis: "SOP 14 · aus dem Abgleich" },
  { stufe: "angeschrieben", hinweis: "SOP 15 · Approach-Mailing" },
  { stufe: "nda_angefragt", hinweis: "SOP 16 · NDA unterwegs" },
  { stufe: "nda_unterzeichnet", hinweis: "SOP 16 · NDA liegt vor" },
  { stufe: "datenraum_freigegeben", hinweis: "SOP 18 · Datenraum Light" },
  { stufe: "interesse", hinweis: "SOP 17 · Broker Call" },
  { stufe: "preisanfrage", hinweis: "SOP 19 · Richtung LOI" },
];

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
  const [absagenAuf, setAbsagenAuf] = useState(false);

  const kontakte = (stand?.kontakte ?? []).map((k) =>
    vorlaeufig[k.investorId] ? { ...k, status: vorlaeufig[k.investorId] } : k,
  );

  async function setzen(k: Kontakt, status: Stufe) {
    if (k.status === status) return;
    setVorlaeufig((v) => ({ ...v, [k.investorId]: status }));
    setFehler(null);
    try {
      const r = await fetch("/api/kontakte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mandat,
          kontakte: [
            {
              investorId: k.investorId,
              firma: k.firma,
              ansprechpartner: k.ansprechpartner,
              email: k.email,
              status,
              letzterKontakt: new Date().toISOString(),
            },
          ],
        }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
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
          wandert mit jedem Schritt eine Spalte weiter.
        </p>
      </div>
    );
  }

  const Karte = ({ k }: { k: Kontakt }) => (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", k.investorId);
        setGezogen(k.investorId);
      }}
      className="cursor-grab rounded-[var(--seil-radius)] border border-seil-line bg-seil-card px-2.5 py-2 hover:border-seil-accent active:cursor-grabbing"
    >
      <Link
        href={`/kunden/${encodeURIComponent(k.investorId)}`}
        className="block truncate text-body text-seil-text hover:text-seil-accent hover:underline"
      >
        {k.firma ?? k.investorId}
      </Link>
      <div className="truncate text-kicker text-seil-muted">{k.ansprechpartner ?? k.email ?? "—"}</div>
      {k.letzterKontakt ? (
        <div className="mt-0.5 text-[10px] text-seil-muted">
          zuletzt {new Date(k.letzterKontakt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
        </div>
      ) : null}
    </article>
  );

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
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1100px] grid-cols-7 gap-2">
          {SPALTEN.map(({ stufe, hinweis }) => {
            const liste = inSpalte(stufe);
            return (
              <div
                key={stufe}
                {...spalteProps(stufe)}
                className={`flex min-h-[9rem] flex-col rounded-[var(--seil-radius)] border bg-seil-surface p-2 transition-colors ${
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
                  <div className="truncate text-[10px] text-seil-muted">{hinweis}</div>
                </div>
                <div className="grid gap-1.5">
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
          {absagenAuf ? "▾" : "▸"} Absagen ({absagen.length}) – Karte hierher ziehen, um abzusagen
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
        Die Spalten sind die Schritte 14 bis 19 eurer SOP. Jede Verschiebung ist sofort gespeichert
        und steht im Verlauf. {STUFEN.length - SPALTEN.length - 1 > 0 ? "" : ""}
      </p>
    </div>
  );
}
