"use client";

import { useCallback, useEffect, useState } from "react";
import { NAMEN } from "@/lib/sitzung-token";
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
import { Anschreiben } from "@/components/anschreiben";
import { AufgabenListe } from "@/components/aufgaben-liste";
import { AktivitaetenListe } from "@/components/aktivitaeten-liste";
import type { Kundenliste } from "@/app/api/kunden/route";

/**
 * Ein Kunde auf einer Seite: Stammdaten aus der Liveliste, der CRM-Stand
 * darüber, Aufgaben, Verlauf – und der direkte Weg zum Anschreiben.
 */
export function KundeDetail({ id }: { id: string }) {
  const [kunde, setKunde] = useState<KundeAnsicht | null>(null);
  const [fehlt, setFehlt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [schreiben, setSchreiben] = useState(false);

  const holen = useCallback(async () => {
    try {
      const r = await fetch(`/api/kunden?suche=${encodeURIComponent(id)}`, { cache: "no-store" });
      const l = (await r.json()) as Kundenliste;
      const k = l.kunden.find((x) => x.id.toLowerCase() === id.toLowerCase()) ?? l.kunden[0] ?? null;
      setKunde(k);
      setFehlt(!k);
    } catch {
      setFehler("nicht erreichbar");
    }
  }, [id]);

  useEffect(() => {
    void holen();
  }, [holen]);

  async function pflegen(aenderung: Partial<KundeAnsicht>) {
    if (!kunde) return;
    setKunde({ ...kunde, ...aenderung });
    setFehler(null);
    try {
      const r = await fetch("/api/kunden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: kunde.id,
          firma: kunde.firma,
          ansprechpartner: kunde.ansprechpartner,
          email: kunde.email,
          ...aenderung,
        }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
      await holen();
    }
  }

  if (fehlt) {
    return (
      <div className="mt-4 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
        <p className="text-body text-seil-text">Zu „{id}“ ist nichts gefunden worden.</p>
      </div>
    );
  }
  if (!kunde) return <p className="mt-4 text-body text-seil-muted">wird geladen …</p>;

  const Zeile = ({ k, v }: { k: string; v: string }) => (
    <div className="flex flex-wrap gap-x-3 border-b border-seil-line py-2 last:border-0">
      <span className="w-40 shrink-0 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
        {k}
      </span>
      <span className="min-w-0 text-body text-seil-text">{v}</span>
    </div>
  );

  return (
    <>
      <h1 className="mt-3 text-title text-seil-text">{kunde.firma}</h1>
      <p className="mt-1 text-body text-seil-body">
        {kunde.ansprechpartner ?? "ohne Ansprechpartner"}
        {kunde.herkunft === "cockpit" ? " · im Cockpit angelegt" : " · aus der Liveliste"}
      </p>

      {fehler ? (
        <p className="mt-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card px-4 py-2">
          <Zeile k="E-Mail" v={kunde.email ?? "— nicht hinterlegt"} />
          <Zeile k="Telefon" v={kunde.telefon ?? "— nicht hinterlegt"} />
          <Zeile k="Standorte" v={kunde.regionen.join(", ") || "— nicht hinterlegt"} />
          <Zeile k="Assetklassen" v={kunde.assetklassen.join(", ") || "— nicht hinterlegt"} />
          <Zeile
            k="Ticket"
            v={
              kunde.ticketMinMio === null && kunde.ticketMaxMio === null
                ? "— nicht hinterlegt"
                : `${kunde.ticketMinMio ?? "?"}–${kunde.ticketMaxMio ?? "?"} Mio.`
            }
          />
          <Zeile k="Hat bereits gekauft" v={kunde.letzteAnkaeufe.join(", ") || "— nichts hinterlegt"} />
        </div>

        <div className="grid content-start gap-3 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
          <label className="grid gap-1">
            <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
              Art
            </span>
            <select
              value={kunde.art}
              onChange={(e) => void pflegen({ art: e.target.value as Art })}
              className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
            >
              {ARTEN.map((a) => (
                <option key={a} value={a}>
                  {ART_LABEL[a]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
              Stufe
            </span>
            <select
              value={kunde.stufe}
              onChange={(e) => void pflegen({ stufe: e.target.value as Stufe })}
              className={`rounded-seil border bg-seil-surface px-2 py-1 text-body ${STUFE_TON[kunde.stufe]}`}
            >
              {STUFEN.map((s) => (
                <option key={s} value={s}>
                  {STUFE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
              Betreuer
            </span>
            <select
              value={kunde.betreuer ?? ""}
              onChange={(e) => void pflegen({ betreuer: e.target.value || null })}
              className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
            >
              <option value="">niemand</option>
              {Object.entries(NAMEN).map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
              Notiz
            </span>
            <textarea
              defaultValue={kunde.notiz ?? ""}
              rows={3}
              onBlur={(e) => {
                if (e.target.value !== (kunde.notiz ?? "")) void pflegen({ notiz: e.target.value });
              }}
              placeholder="Was man über diesen Kunden wissen sollte"
              className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body leading-relaxed text-seil-text placeholder:text-seil-muted"
            />
          </label>
        </div>
      </div>

      {kunde.email ? (
        schreiben ? (
          <Anschreiben
            objekt=""
            empfaenger={[
              {
                id: kunde.id,
                firma: kunde.firma,
                ansprechpartner: kunde.ansprechpartner,
                email: kunde.email,
              },
            ]}
            onFertig={() => setSchreiben(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setSchreiben(true)}
            className="mt-3 rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-body text-seil-text"
          >
            Anschreiben verfassen
          </button>
        )
      ) : (
        <p className="mt-3 text-kicker text-seil-muted">
          Ohne E-Mail-Adresse lässt sich von hier aus nichts verschicken.
        </p>
      )}

      <AufgabenListe titel="Aufgaben zu diesem Kunden" mandat={undefined} />
      <AktivitaetenListe grenze={20} />
    </>
  );
}
