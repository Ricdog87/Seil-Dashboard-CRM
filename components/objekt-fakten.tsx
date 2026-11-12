"use client";

import { useCallback, useEffect, useState } from "react";
import { PRODUKTTYPEN, PRODUKTTYP_LABEL, type FaktText, type Mandat, type Produkttyp } from "@/lib/mandat";
import { istOffen, uebernahme, type FaktSchluessel, type Vorschlag } from "@/lib/kennwerte";
import type { Vorschlagsliste } from "@/app/api/mandate/vorschlaege/route";

/**
 * Key Facts und Objektfakten eines Mandats – die Projektseite.
 *
 * Jedes Feld lässt sich von Hand füllen. Hat Modul 01 beim Sortieren des
 * Datenraums einen Wert gelesen, steht er als Vorschlag mit Quelle unter dem
 * Feld; ein Klick übernimmt ihn. Von selbst kommt nichts ins Mandat.
 */
type Aenderung = Partial<Mandat> & { uebernommen?: string[] };

const KICKER = "text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted";
const EINGABE =
  "rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text placeholder:text-seil-muted";

const ZAHLEN: { schluessel: "einheiten" | "flaecheQm" | "jahresnettokaltmiete"; label: string; platz: string }[] = [
  { schluessel: "einheiten", label: "Einheiten", platz: "z. B. 16" },
  { schluessel: "flaecheQm", label: "Mietfläche m²", platz: "z. B. 1240" },
  { schluessel: "jahresnettokaltmiete", label: "Jahresnettokaltmiete €", platz: "z. B. 128000" },
];

const TEXTE: { schluessel: FaktText; label: string; platz: string; breit?: boolean }[] = [
  { schluessel: "baujahr", label: "Baujahr", platz: "z. B. 1962" },
  { schluessel: "grundstueck", label: "Grundstücksfläche", platz: "z. B. 610 m²" },
  { schluessel: "einheitenMix", label: "Einheiten WE | GE", platz: "z. B. 16 WE | 4 GE" },
  { schluessel: "leerstand", label: "Leerstand", platz: "z. B. 0 %" },
  { schluessel: "adresse", label: "Objektadresse", platz: "Straße, PLZ Ort", breit: true },
  { schluessel: "flurstuecke", label: "Flurstücke", platz: "Gemarkung, Flur, Flurstück", breit: true },
];

export function ObjektFakten({
  mandat,
  stand,
  setzen,
}: {
  mandat: string;
  stand: Mandat;
  setzen: (aenderung: Aenderung) => Promise<void>;
}) {
  const [liste, setListe] = useState<Vorschlagsliste | null>(null);
  const [laedt, setLaedt] = useState(false);

  const holen = useCallback(async () => {
    setLaedt(true);
    try {
      const r = await fetch(`/api/mandate/vorschlaege?name=${encodeURIComponent(mandat)}`, { cache: "no-store" });
      setListe((await r.json()) as Vorschlagsliste);
    } catch {
      setListe({ modus: "fehler", grund: "Modul 01 nicht erreichbar", lauf: null, vorschlaege: [] });
    } finally {
      setLaedt(false);
    }
  }, [mandat]);

  useEffect(() => {
    void holen();
  }, [holen]);

  const offen = (liste?.vorschlaege ?? []).filter((v) => istOffen(stand, v));
  const offenZu = (schluessel: FaktSchluessel): Vorschlag | undefined => offen.find((v) => v.schluessel === schluessel);

  async function uebernehmen(vorschlaege: Vorschlag[]) {
    const aenderung: Aenderung = { uebernommen: [] };
    const fakten: Partial<Record<FaktText, string>> = {};
    for (const v of vorschlaege) {
      const teil = uebernahme(v);
      if (!teil) continue;
      if (teil.fakten) Object.assign(fakten, teil.fakten);
      else Object.assign(aenderung, teil);
      aenderung.uebernommen?.push(v.label);
    }
    if (Object.keys(fakten).length > 0) aenderung.fakten = fakten;
    if ((aenderung.uebernommen ?? []).length === 0) return;
    await setzen(aenderung);
  }

  const VorschlagZeile = ({ v }: { v: Vorschlag }) => (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-snug text-seil-body">
      <span>
        Modul 01: <span className="text-seil-text">{v.wert}</span>
        {v.quelle ? <span className="text-seil-muted"> · {v.quelle}</span> : null}
      </span>
      {uebernahme(v) ? (
        <button
          type="button"
          onClick={() => void uebernehmen([v])}
          className="rounded-seil border border-seil-accent px-1.5 py-0 text-[11px] text-seil-accent hover:bg-seil-accent-bg"
        >
          Übernehmen
        </button>
      ) : (
        <span className="text-seil-muted">keine eindeutige Zahl – bitte von Hand eintragen</span>
      )}
    </span>
  );

  const status =
    liste === null || laedt
      ? "Vorschläge aus Modul 01 werden geladen …"
      : liste.modus === "aus"
        ? "Modul 01 ist nicht angebunden – Werte von Hand eintragen"
        : liste.modus === "fehler"
          ? (liste.grund ?? "Modul 01 nicht erreichbar")
          : liste.vorschlaege.length === 0
            ? liste.lauf
              ? "Der Datenraum-Lauf hat keine Objektwerte geliefert"
              : "Noch kein Datenraum-Lauf zu diesem Mandat"
            : offen.length === 0
              ? "Alle Vorschläge aus Modul 01 sind übernommen"
              : `${offen.length} ${offen.length === 1 ? "Vorschlag" : "Vorschläge"} aus Modul 01 offen`;

  const assetVorschlag = offenZu("assetklasse");

  return (
    <section className="mt-5 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className={KICKER}>Objekt · Key Facts</span>
        <span className="flex flex-wrap items-center gap-2 text-kicker text-seil-muted">
          <span className={offen.length > 0 ? "text-seil-accent" : undefined}>{status}</span>
          {offen.filter((v) => uebernahme(v)).length > 1 ? (
            <button
              type="button"
              onClick={() => void uebernehmen(offen)}
              className="rounded-seil border border-seil-accent bg-seil-accent-bg px-2 py-0.5 text-kicker text-seil-text"
            >
              Alle übernehmen
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void holen()}
            disabled={laedt}
            className="rounded-seil border border-seil-line px-2 py-0.5 text-kicker text-seil-body hover:border-seil-accent hover:text-seil-accent disabled:opacity-40"
          >
            Neu laden
          </button>
        </span>
      </div>

      {assetVorschlag ? (
        <div className="mb-3 rounded-seil border border-seil-line bg-seil-surface px-3 py-2">
          <span className={KICKER}>Assetklasse</span>
          <div className="mt-1">
            <VorschlagZeile v={assetVorschlag} />
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ZAHLEN.map((f) => {
          const wert = stand[f.schluessel] ?? null;
          const v = offenZu(f.schluessel);
          return (
            <label key={f.schluessel} className="grid content-start gap-1">
              <span className={KICKER}>{f.label}</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={f.schluessel === "einheiten" ? 1 : "any"}
                key={`${f.schluessel}-${wert ?? "leer"}`}
                defaultValue={wert ?? ""}
                onBlur={(e) => {
                  const neu = e.target.value === "" ? null : Number(e.target.value);
                  if (neu !== wert) void setzen({ [f.schluessel]: neu } as Aenderung);
                }}
                placeholder={f.platz}
                className={`${EINGABE} tabular-nums`}
              />
              {v ? <VorschlagZeile v={v} /> : null}
            </label>
          );
        })}
        <label className="grid content-start gap-1">
          <span className={KICKER}>Produkttyp</span>
          <select
            value={stand.produkttyp ?? ""}
            onChange={(e) => void setzen({ produkttyp: (e.target.value || null) as Produkttyp | null })}
            className={EINGABE}
          >
            <option value="">— wählen</option>
            {PRODUKTTYPEN.map((p) => (
              <option key={p} value={p}>
                {PRODUKTTYP_LABEL[p]}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-seil-muted">Bestimmt Betreff und Aufbau der Pre-Sound-Mail.</span>
        </label>

        {TEXTE.map((f) => {
          const wert = stand.fakten?.[f.schluessel] ?? "";
          const v = offenZu(f.schluessel);
          return (
            <label key={f.schluessel} className={`grid content-start gap-1 ${f.breit ? "sm:col-span-2" : ""}`}>
              <span className={KICKER}>{f.label}</span>
              <input
                key={`${f.schluessel}-${wert}`}
                defaultValue={wert}
                onBlur={(e) => {
                  if (e.target.value.trim() !== wert) void setzen({ fakten: { [f.schluessel]: e.target.value } });
                }}
                placeholder={f.platz}
                className={EINGABE}
              />
              {v ? <VorschlagZeile v={v} /> : null}
            </label>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-seil-muted">
        Modul 01 liest diese Werte beim Sortieren des Datenraums aus den Unterlagen und nennt die Quelle (z. B. „6/10,
        mieterliste“ = sechs von zehn Dokumenten mit dieser Angabe, aus der Mieterliste). Ins Mandat kommt ein Wert erst
        mit „Übernehmen“ oder von Hand.{" "}
        {liste?.lauf ? `Stand: Lauf ${liste.lauf}.` : null}
      </p>
    </section>
  );
}
