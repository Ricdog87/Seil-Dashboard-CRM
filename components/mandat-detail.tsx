"use client";

import { useCallback, useEffect, useState } from "react";
import { NAMEN, PERSONEN } from "@/lib/sitzung-token";
import { PHASEN, PHASE_LABEL, PHASE_TON, type Mandat, type Phase } from "@/lib/mandat";
import { fmtEur } from "@/lib/leistung";
import { AufgabenListe } from "@/components/aufgaben-liste";
import { NotizenListe } from "@/components/notizen-liste";
import { AktivitaetenListe } from "@/components/aktivitaeten-liste";
import { MandatProzess } from "@/components/mandat-prozess";
import { DokumenteCheckliste } from "@/components/dokumente-checkliste";
import type { Kundenliste } from "@/app/api/kunden/route";
import type { Mandatsliste } from "@/app/api/mandate/route";

/**
 * Ein Mandat auf einer Seite: Stammdaten, der Prozess entlang der SOP, der
 * Verteiler, die Aufgaben, die Notizen und der Verlauf.
 *
 * Alles, was jemand über dieses Mandat wissen will, ohne dass er zwischen
 * Ansichten springen muss – das ist der Unterschied zwischen einer Tabelle und
 * einem CRM.
 */
export function MandatDetail({ mandat, kuerzel, darfVerteilen = false }: { mandat: string; kuerzel: string; darfVerteilen?: boolean }) {
  const [stand, setStand] = useState<Mandat | null>(null);
  const [fehlt, setFehlt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [auftraggeber, setAuftraggeber] = useState<{ id: string; firma: string }[]>([]);

  // Die Auftraggeber unter den Kunden - fuer die Auswahl am Mandat.
  useEffect(() => {
    fetch("/api/kunden?quelle=cockpit", { cache: "no-store" })
      .then((r) => r.json() as Promise<Kundenliste>)
      .then((l) => setAuftraggeber(l.kunden.filter((k) => k.art === "auftraggeber").map((k) => ({ id: k.id, firma: k.firma }))))
      .catch(() => undefined);
  }, []);

  const holen = useCallback(async () => {
    try {
      const r = await fetch("/api/mandate", { cache: "no-store" });
      const l = (await r.json()) as Mandatsliste;
      const m = l.mandate.find((x) => x.name === mandat) ?? null;
      setStand(m);
      setFehlt(l.modus === "live" && !m);
    } catch {
      // naechster Versuch
    }
  }, [mandat]);

  useEffect(() => {
    void holen();
  }, [holen]);

  async function setzen(aenderung: Partial<Mandat>) {
    setStand((s) => (s ? { ...s, ...aenderung } : s));
    setFehler(null);
    try {
      const r = await fetch("/api/mandate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: mandat, ...aenderung }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
    } finally {
      await holen();
    }
  }

  const Feld = ({
    label,
    wert,
    feld,
  }: {
    label: string;
    wert: string | null;
    feld: keyof Mandat;
  }) => (
    <label className="grid gap-1">
      <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
        {label}
      </span>
      <input
        defaultValue={wert ?? ""}
        onBlur={(e) => {
          if (e.target.value !== (wert ?? "")) void setzen({ [feld]: e.target.value } as Partial<Mandat>);
        }}
        placeholder="—"
        className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text placeholder:text-seil-muted"
      />
    </label>
  );

  return (
    <>
      <h1 className="mt-3 text-title text-seil-text">{mandat}</h1>

      {fehler ? (
        <p className="mt-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}

      {fehlt ? (
        <div className="mt-3 rounded-[var(--seil-radius)] border border-seil-warning bg-seil-warning-bg p-4">
          <p className="text-body text-seil-text">Dieses Mandat gibt es im CRM noch nicht.</p>
          <button
            type="button"
            onClick={() => void setzen({ zustaendig: kuerzel || null, laufPraefix: mandat })}
            className="mt-2 rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-body text-seil-text"
          >
            Jetzt als Mandat anlegen
          </button>
        </div>
      ) : stand ? (
        <div className="mt-3 grid gap-3 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feld label="Stadt" wert={stand.stadt} feld="stadt" />
          <Feld label="Assetklasse" wert={stand.assetklasse} feld="assetklasse" />
          <div className="grid gap-1">
            <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
              Auftraggeber
            </span>
            <select
              value={stand.auftraggeberId ?? ""}
              onChange={(e) => {
                const id = e.target.value || null;
                const k = auftraggeber.find((x) => x.id === id);
                void setzen({ auftraggeberId: id, auftraggeber: k?.firma ?? stand.auftraggeber });
              }}
              className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
            >
              <option value="">{stand.auftraggeber ? `${stand.auftraggeber} (Freitext)` : "— noch nicht zugeordnet"}</option>
              {auftraggeber.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.firma}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-seil-muted">
              Auftraggeber sind Kunden der Art „Auftraggeber“ – unter Kunden anlegen.
            </span>
          </div>
          <div className="grid gap-1">
            <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
              Phase
            </span>
            <select
              value={stand.phase}
              onChange={(e) => void setzen({ phase: e.target.value as Phase })}
              className={`rounded-seil border bg-seil-surface px-2 py-1 text-body ${PHASE_TON[stand.phase]}`}
            >
              {PHASEN.map((p) => (
                <option key={p} value={p}>
                  {PHASE_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
              Zuständig
            </span>
            <select
              value={stand.zustaendig ?? ""}
              onChange={(e) => void setzen({ zustaendig: e.target.value || null })}
              className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
            >
              <option value="">niemand</option>
              {Object.entries(PERSONEN).map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-body text-seil-muted">wird geladen …</p>
      )}

      {stand ? (
        <section className="mt-5 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Wirtschaftlichkeit</span>
            <span className="text-kicker text-seil-muted">
              {stand.honorarErwartet ? `Erwartetes Honorar ${fmtEur(stand.honorarErwartet)}` : "Kaufpreis und Provision eintragen – daraus ergibt sich das erwartete Honorar"}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="grid gap-1">
              <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Kaufpreis €</span>
              <input type="number" inputMode="decimal" defaultValue={stand.kaufpreis ?? ""} onBlur={(e) => {
                const kp = e.target.value === "" ? null : Number(e.target.value);
                if (kp !== (stand.kaufpreis ?? null)) {
                  const erw = kp !== null && stand.provisionProzent ? Math.round(kp * stand.provisionProzent / 100) : stand.honorarErwartet;
                  void setzen({ kaufpreis: kp, honorarErwartet: erw ?? null });
                }
              }} placeholder="z. B. 8500000" className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body tabular-nums text-seil-text placeholder:text-seil-muted" />
            </label>
            <label className="grid gap-1">
              <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Provision %</span>
              <input type="number" inputMode="decimal" step="0.1" defaultValue={stand.provisionProzent ?? ""} onBlur={(e) => {
                const pz = e.target.value === "" ? null : Number(e.target.value);
                if (pz !== (stand.provisionProzent ?? null)) {
                  const erw = pz !== null && stand.kaufpreis ? Math.round(stand.kaufpreis * pz / 100) : stand.honorarErwartet;
                  void setzen({ provisionProzent: pz, honorarErwartet: erw ?? null });
                }
              }} placeholder="z. B. 3" className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body tabular-nums text-seil-text placeholder:text-seil-muted" />
            </label>
            <label className="grid gap-1">
              <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Honorar erwartet €</span>
              <input type="number" inputMode="decimal" key={stand.honorarErwartet ?? "leer"} defaultValue={stand.honorarErwartet ?? ""} onBlur={(e) => {
                const h = e.target.value === "" ? null : Number(e.target.value);
                if (h !== (stand.honorarErwartet ?? null)) void setzen({ honorarErwartet: h });
              }} placeholder="oder Pauschale" className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body tabular-nums text-seil-text placeholder:text-seil-muted" />
            </label>
            <label className="grid gap-1">
              <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-success">Honorar realisiert €</span>
              <input type="number" inputMode="decimal" defaultValue={stand.honorarIst ?? ""} onBlur={(e) => {
                const h = e.target.value === "" ? null : Number(e.target.value);
                if (h !== (stand.honorarIst ?? null)) void setzen({ honorarIst: h });
              }} placeholder="nach Signing" className="rounded-seil border border-seil-success/50 bg-seil-surface px-2 py-1 text-body tabular-nums text-seil-text placeholder:text-seil-muted" />
            </label>
            <label className="grid gap-1">
              <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Abschluss am</span>
              <input type="date" defaultValue={stand.abschlussAm ?? ""} onBlur={(e) => {
                const d = e.target.value || null;
                if (d !== (stand.abschlussAm ?? null)) void setzen({ abschlussAm: d, ...(d ? { phase: "abschluss" as Phase } : {}) });
              }} className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text" />
            </label>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-seil-muted">
            Das erwartete Honorar fließt gewichtet nach Phase in den Pipeline-Wert; das realisierte zählt am Abschlusstag auf das Umsatzziel. Ein Abschlussdatum setzt die Phase auf Abschluss.
          </p>
        </section>
      ) : null}

      <DokumenteCheckliste mandat={mandat} kompakt />
      <MandatProzess mandat={mandat} />
      <AufgabenListe mandat={mandat} zustaendig={undefined} titel="Aufgaben" darfVerteilen={darfVerteilen} />
      <NotizenListe mandat={mandat} />
      <AktivitaetenListe mandat={mandat} />
    </>
  );
}
