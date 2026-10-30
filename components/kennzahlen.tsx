"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Pipeline } from "@/app/api/pipeline/route";
import type { Modul01Stand } from "@/lib/modul01";
import type { Kundenliste } from "@/app/api/kunden/route";

/**
 * Die Zahlen, die einem Makler-Team am Morgen etwas sagen.
 *
 * Nicht „wie viele Zeilen hat die Datenbank“, sondern: Wo stehen die Mandate,
 * wie viele Investoren sind im Gespräch, wie viele haben geantwortet, was
 * wartet auf eine Freigabe, was ist überfällig. Alles aus denselben Quellen wie
 * der Rest des Cockpits – keine Zahl hier wird separat gepflegt.
 */
export function Kennzahlen() {
  const [pipe, setPipe] = useState<Pipeline | null>(null);
  const [dr, setDr] = useState<Modul01Stand | null>(null);
  const [kunden, setKunden] = useState<Kundenliste | null>(null);

  useEffect(() => {
    const laden = () => {
      fetch("/api/pipeline", { cache: "no-store" }).then((r) => r.json()).then(setPipe).catch(() => undefined);
      fetch("/api/modul01/status", { cache: "no-store" }).then((r) => r.json()).then(setDr).catch(() => undefined);
      fetch("/api/kunden", { cache: "no-store" }).then((r) => r.json()).then(setKunden).catch(() => undefined);
    };
    laden();
    const t = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") laden();
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const karten = pipe?.karten ?? [];
  const aktiv = karten.filter((k) => !["ruht", "verloren", "abschluss"].includes(k.phase));
  const inVermarktung = karten.filter((k) => ["vermarktung", "angebote"].includes(k.phase)).length;
  const sum = (f: (k: (typeof karten)[number]) => number) => karten.reduce((n, k) => n + f(k), 0);
  const angeschrieben = sum((k) => k.verteiler.angeschrieben);
  const geantwortet = sum((k) => k.verteiler.nda + k.verteiler.interesse);
  const quote = angeschrieben > 0 ? Math.round((geantwortet / angeschrieben) * 100) : null;
  const nda = sum((k) => k.verteiler.nda);
  const interesse = sum((k) => k.verteiler.interesse);
  const freigaben = sum((k) => k.freigabenOffen);
  const ueberfaellig = sum((k) => k.aufgabenUeberfaellig);
  const followups = sum((k) => k.followupsFaellig);
  const pruefen = dr
    ? [...Object.values(dr.objekte ?? {}), ...(dr.unbekannt ?? [])].reduce((n, o) => n + (o.dokumente?.length ?? 0), 0)
    : null;
  const gepflegt = kunden ? kunden.kunden.filter((k) => k.herkunft !== "liveliste").length : null;

  const Kachel = ({
    wert,
    label,
    sub,
    href,
    ton = "",
  }: {
    wert: string;
    label: string;
    sub?: string;
    href?: string;
    ton?: string;
  }) => {
    const inhalt = (
      <>
        <div className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">{label}</div>
        <div className={`mt-1 text-display tabular-nums ${ton || "text-seil-text"}`}>{wert}</div>
        {sub ? <div className="mt-1 truncate text-kicker text-seil-muted">{sub}</div> : null}
      </>
    );
    const kl = "min-w-0 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card px-4 py-3 transition-colors";
    return href ? (
      <Link href={href} className={`${kl} hover:border-seil-accent`}>
        {inhalt}
      </Link>
    ) : (
      <div className={kl}>{inhalt}</div>
    );
  };

  const z = (n: number | null | undefined) => (pipe ? String(n ?? 0) : "—");

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
      <Kachel wert={z(aktiv.length)} label="Mandate aktiv" sub={`${inVermarktung} in Vermarktung`} href="/mandate" />
      <Kachel
        wert={kunden?.modus ? String(kunden.gesamt) : "—"}
        label="Kunden"
        sub={gepflegt !== null ? `${gepflegt} im CRM gepflegt` : "aus OneDrive"}
        href="/kunden"
      />
      <Kachel wert={z(angeschrieben)} label="Angeschrieben" sub="Investoren in Gesprächen" />
      <Kachel
        wert={pipe ? (quote !== null ? `${quote} %` : "—") : "—"}
        label="Antwortquote"
        sub={`${geantwortet} haben reagiert`}
        ton={quote !== null && quote >= 20 ? "text-seil-success" : ""}
      />
      <Kachel wert={z(nda)} label="NDAs" sub={`${interesse} mit Interesse`} />
      <Kachel
        wert={z(freigaben)}
        label="Freigaben"
        sub="warten auf Tobias"
        href="/freigaben"
        ton={freigaben > 0 ? "text-seil-warning" : ""}
      />
      <Kachel
        wert={z(ueberfaellig + followups)}
        label="Überfällig"
        sub={`${ueberfaellig} Aufgaben · ${followups} Follow-ups`}
        href="/aufgaben"
        ton={ueberfaellig + followups > 0 ? "text-seil-danger" : ""}
      />
      <Kachel
        wert={pruefen === null ? "—" : String(pruefen)}
        label="Zu prüfen"
        sub="Datenraum-Prüffälle"
        ton={pruefen && pruefen > 0 ? "text-seil-warning" : ""}
      />
    </section>
  );
}
