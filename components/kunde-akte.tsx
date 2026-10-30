"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NAMEN, PERSONEN } from "@/lib/sitzung-token";
import {
  ARTEN, ART_LABEL, STUFEN, STUFE_LABEL, STUFE_TON, type Art, type KundeAnsicht, type Stufe,
} from "@/lib/kunde";
import { PHASE_LABEL } from "@/lib/mandat";
import { Anschreiben } from "@/components/anschreiben";
import { AufgabenListe } from "@/components/aufgaben-liste";
import { NotizenListe } from "@/components/notizen-liste";
import { DokumenteCheckliste } from "@/components/dokumente-checkliste";
import type { Kundenliste } from "@/app/api/kunden/route";
import type { Mandatsliste } from "@/app/api/mandate/route";
import type { Historie, HistorieArt, HistorieEintrag } from "@/app/api/historie/route";

/**
 * Die Kundenakte.
 *
 * Aufgebaut wie eine Akte, nicht wie ein Formular: oben, wer das ist und wie
 * das Verhältnis steht; links die Geschichte – jede Mail, jede Freigabe, jeder
 * Stufenwechsel, jede Aufgabe, jede Notiz zu genau diesem Kunden, chronologisch;
 * rechts die Details, die man pflegt. Was aus OneDrive kommt, ist als solches
 * erkennbar und wird hier nicht überschrieben.
 */

const ART_ICON: Record<HistorieArt, { zeichen: string; ton: string; label: string }> = {
  mail: { zeichen: "✉", ton: "text-seil-accent border-seil-accent", label: "Anschreiben" },
  freigabe: { zeichen: "✕", ton: "text-seil-muted border-seil-line", label: "Abgelehnt" },
  stufe: { zeichen: "→", ton: "text-seil-success border-seil-success", label: "Stufe" },
  aufgabe: { zeichen: "☐", ton: "text-seil-warning border-seil-warning", label: "Aufgabe" },
  notiz: { zeichen: "✎", ton: "text-seil-body border-seil-line", label: "Notiz" },
  kontakt: { zeichen: "☎", ton: "text-seil-body border-seil-line", label: "Kontakt" },
  pflege: { zeichen: "·", ton: "text-seil-muted border-seil-line", label: "Pflege" },
};

function tagLabel(iso: string): string {
  const d = new Date(iso);
  const heute = new Date();
  const gestern = new Date(); gestern.setDate(heute.getDate() - 1);
  const gleich = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (gleich(d, heute)) return "Heute";
  if (gleich(d, gestern)) return "Gestern";
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function Zeitleiste({ eintraege }: { eintraege: HistorieEintrag[] }) {
  if (eintraege.length === 0) {
    return (
      <div className="rounded-[var(--seil-radius)] border border-dashed border-seil-line p-6 text-center text-body text-seil-muted">
        Noch keine Geschichte. Das erste Anschreiben, die erste Notiz oder der erste Stufenwechsel
        erscheinen hier.
      </div>
    );
  }
  const gruppen: { tag: string; eintraege: HistorieEintrag[] }[] = [];
  for (const e of eintraege) {
    const tag = tagLabel(e.zeit);
    const g = gruppen[gruppen.length - 1];
    if (g && g.tag === tag) g.eintraege.push(e);
    else gruppen.push({ tag, eintraege: [e] });
  }
  return (
    <div className="grid gap-5">
      {gruppen.map((g) => (
        <div key={g.tag}>
          <div className="mb-2 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">{g.tag}</div>
          <ol className="relative ml-3 border-l border-seil-line">
            {g.eintraege.map((e) => {
              const m = ART_ICON[e.art];
              return (
                <li key={e.id} className="relative pb-4 pl-6 last:pb-0">
                  <span
                    className={`absolute -left-[11px] top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border bg-seil-card text-[11px] ${m.ton}`}
                    aria-label={m.label}
                  >
                    {m.zeichen}
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-body text-seil-text">{e.titel}</span>
                    <span className="text-kicker tabular-nums text-seil-muted">
                      {new Date(e.zeit).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-kicker text-seil-muted">
                    {[e.durch ? (NAMEN[e.durch] ?? e.durch) : "Automatik", e.mandat ? `Mandat ${e.mandat}` : null, e.detail]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}

export function KundeAkte({ id, kuerzel, darfVerteilen = false }: { id: string; kuerzel: string; darfVerteilen?: boolean }) {
  const [kunde, setKunde] = useState<KundeAnsicht | null>(null);
  const [fehlt, setFehlt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [historie, setHistorie] = useState<Historie | null>(null);
  const [mandate, setMandate] = useState<Mandatsliste | null>(null);
  const [tab, setTab] = useState<"historie" | "aufgaben" | "notizen" | "mandate">("historie");
  const [schreiben, setSchreiben] = useState(false);

  const holen = useCallback(async () => {
    try {
      const r = await fetch(`/api/kunden?suche=${encodeURIComponent(id)}`, { cache: "no-store" });
      const l = (await r.json()) as Kundenliste;
      const k = l.kunden.find((x) => x.id.toLowerCase() === id.toLowerCase()) ?? null;
      setKunde(k);
      setFehlt(!k);
      if (k) {
        const h = await fetch(`/api/historie?investor=${encodeURIComponent(k.id)}&firma=${encodeURIComponent(k.firma)}`, { cache: "no-store" });
        setHistorie((await h.json()) as Historie);
      }
    } catch {
      setFehler("nicht erreichbar");
    }
  }, [id]);

  useEffect(() => {
    void holen();
    fetch("/api/mandate", { cache: "no-store" }).then((r) => r.json() as Promise<Mandatsliste>).then(setMandate).catch(() => undefined);
  }, [holen]);

  async function pflegen(aenderung: Partial<KundeAnsicht>) {
    if (!kunde) return;
    setKunde({ ...kunde, ...aenderung });
    setFehler(null);
    try {
      const r = await fetch("/api/kunden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: kunde.id, firma: kunde.firma, ansprechpartner: kunde.ansprechpartner, email: kunde.email, ...aenderung }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string };
      if (!a.ok) throw new Error(a.grund ?? "nicht gespeichert");
      await holen();
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "nicht erreichbar");
      await holen();
    }
  }

  if (fehlt) {
    return (
      <div className="mt-4 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4 text-body text-seil-text">
        Zu „{id}“ ist nichts gefunden worden.
      </div>
    );
  }
  if (!kunde) return <p className="mt-4 text-body text-seil-muted">Akte wird geladen …</p>;

  const alsAuftraggeber = (mandate?.mandate ?? []).filter(
    (m) => m.auftraggeberId === kunde.id || (!m.auftraggeberId && m.auftraggeber === kunde.firma),
  );
  const imProzess = historie?.imProzess ?? [];
  const offeneAufgaben = historie?.offeneAufgaben ?? 0;
  const letzte = historie?.eintraege[0];

  const Fakt = ({ k, v }: { k: string; v: string | null | undefined }) => (
    <div className="min-w-0">
      <div className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">{k}</div>
      <div className={`truncate text-body ${v ? "text-seil-text" : "text-seil-muted"}`}>{v || "—"}</div>
    </div>
  );

  const tabs: { id: typeof tab; label: string; zahl?: number }[] = [
    { id: "historie", label: "Historie", zahl: historie?.eintraege.length },
    { id: "aufgaben", label: "Aufgaben", zahl: offeneAufgaben },
    { id: "notizen", label: "Notizen" },
    { id: "mandate", label: "Mandate", zahl: imProzess.length + alsAuftraggeber.length },
  ];

  return (
    <>
      {/* Kopf: wer, in welchem Verhältnis, betreut von wem */}
      <header className="mt-3 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-title text-seil-text">{kunde.firma}</h1>
              <span className="rounded-seil border border-seil-line bg-seil-card-alt px-2 py-0.5 text-kicker text-seil-body">
                {ART_LABEL[kunde.art]}
              </span>
              <span className={`rounded-seil border px-2 py-0.5 text-kicker ${STUFE_TON[kunde.stufe]}`}>
                {STUFE_LABEL[kunde.stufe]}
              </span>
            </div>
            <div className="mt-1 text-body text-seil-body">
              {kunde.ansprechpartner ?? "ohne Ansprechpartner"}
              <span className="text-seil-muted">
                {" · "}
                {kunde.betreuer ? `betreut von ${NAMEN[kunde.betreuer] ?? kunde.betreuer}` : "noch kein Betreuer"}
                {" · "}
                {kunde.herkunft === "cockpit" ? "im Cockpit angelegt" : "Stammdaten aus OneDrive"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {kunde.email ? (
              <button
                type="button"
                onClick={() => setSchreiben((x) => !x)}
                className="rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-body text-seil-text"
              >
                {schreiben ? "Anschreiben schließen" : "Anschreiben"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setTab("aufgaben")}
              className="rounded-seil border border-seil-line px-3 py-1 text-body text-seil-body hover:border-seil-accent hover:text-seil-accent"
            >
              Aufgabe
            </button>
            <button
              type="button"
              onClick={() => setTab("notizen")}
              className="rounded-seil border border-seil-line px-3 py-1 text-body text-seil-body hover:border-seil-accent hover:text-seil-accent"
            >
              Notiz
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-seil-line px-5 py-3 md:grid-cols-5">
          <Fakt k="E-Mail" v={kunde.email} />
          <Fakt k="Telefon" v={kunde.telefon} />
          <Fakt k="Standorte" v={kunde.regionen.join(", ")} />
          <Fakt
            k="Ticket"
            v={kunde.ticketMinMio === null && kunde.ticketMaxMio === null ? null : `${kunde.ticketMinMio ?? "?"}–${kunde.ticketMaxMio ?? "?"} Mio. €`}
          />
          <Fakt k="Letzte Aktivität" v={letzte ? `${tagLabel(letzte.zeit)} · ${letzte.titel}` : null} />
        </div>
      </header>

      {fehler ? (
        <p className="mt-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">{fehler}</p>
      ) : null}

      {schreiben && kunde.email ? (
        <Anschreiben
          objekt=""
          empfaenger={[{ id: kunde.id, firma: kunde.firma, ansprechpartner: kunde.ansprechpartner, email: kunde.email }]}
          onFertig={() => { setSchreiben(false); void holen(); }}
        />
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Links: die Geschichte */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex gap-1 border-b border-seil-line">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 px-3 py-2 text-body ${
                  tab === t.id ? "border-seil-accent text-seil-text" : "border-transparent text-seil-muted hover:text-seil-text"
                }`}
              >
                {t.label}
                {t.zahl ? <span className="ml-1.5 text-kicker tabular-nums text-seil-muted">{t.zahl}</span> : null}
              </button>
            ))}
          </div>

          {tab === "historie" ? (
            historie ? <Zeitleiste eintraege={historie.eintraege} /> : <p className="text-body text-seil-muted">lädt …</p>
          ) : null}
          {tab === "aufgaben" ? <AufgabenListe titel="Aufgaben" investorId={kunde.id} kompakt ohneKopf darfVerteilen={darfVerteilen} /> : null}
          {tab === "notizen" ? <NotizenListe investorId={kunde.id} kompakt /> : null}
          {tab === "mandate" ? (
            <div className="grid gap-3">
              {imProzess.length > 0 ? (
                <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card">
                  <div className="border-b border-seil-line px-4 py-2 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
                    Als Investor im Prozess
                  </div>
                  {imProzess.map((p) => (
                    <div key={p.mandat} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-seil-line px-4 py-2 last:border-0">
                      <Link href={`/mandate/${encodeURIComponent(p.mandat)}`} className="text-body text-seil-text hover:text-seil-accent hover:underline">
                        {p.mandat}
                      </Link>
                      <span className="text-kicker text-seil-body">
                        {p.statusLabel}
                        {p.letzterKontakt ? ` · zuletzt ${new Date(p.letzterKontakt).toLocaleDateString("de-DE")}` : ""}
                        {p.followups > 0 ? ` · ${p.followups}× nachgefasst` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {alsAuftraggeber.length > 0 ? (
                <div>
                  <div className="mb-2 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Als Auftraggeber</div>
                  {alsAuftraggeber.map((m) => (
                    <div key={m.id} className="mb-3 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Link href={`/mandate/${encodeURIComponent(m.name)}`} className="text-body text-seil-text hover:text-seil-accent hover:underline">{m.name}</Link>
                        <span className="text-kicker text-seil-muted">{[m.stadt, PHASE_LABEL[m.phase]].filter(Boolean).join(" · ")}</span>
                      </div>
                      <DokumenteCheckliste mandat={m.name} kompakt />
                    </div>
                  ))}
                </div>
              ) : null}
              {imProzess.length === 0 && alsAuftraggeber.length === 0 ? (
                <div className="rounded-[var(--seil-radius)] border border-dashed border-seil-line p-6 text-center text-body text-seil-muted">
                  In keinem Mandat – weder als Investor noch als Auftraggeber.
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Rechts: Details und Profil */}
        <aside className="grid content-start gap-4">
          <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
            <div className="mb-3 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Details</div>
            <div className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-kicker text-seil-muted">Art</span>
                <select value={kunde.art} onChange={(e) => void pflegen({ art: e.target.value as Art })} className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text">
                  {ARTEN.map((a) => <option key={a} value={a}>{ART_LABEL[a]}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-kicker text-seil-muted">Stufe</span>
                <select value={kunde.stufe} onChange={(e) => void pflegen({ stufe: e.target.value as Stufe })} className={`rounded-seil border bg-seil-surface px-2 py-1 text-body ${STUFE_TON[kunde.stufe]}`}>
                  {STUFEN.map((s) => <option key={s} value={s}>{STUFE_LABEL[s]}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-kicker text-seil-muted">Betreuer</span>
                <select value={kunde.betreuer ?? ""} onChange={(e) => void pflegen({ betreuer: e.target.value || null })} className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text">
                  <option value="">niemand</option>
                  {Object.entries(PERSONEN).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-kicker text-seil-muted">Telefon</span>
                <input defaultValue={kunde.telefon ?? ""} onBlur={(e) => { if (e.target.value !== (kunde.telefon ?? "")) void pflegen({ telefon: e.target.value || null }); }} placeholder="—" className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text placeholder:text-seil-muted" />
              </label>
              <label className="grid gap-1">
                <span className="text-kicker text-seil-muted">Merkzettel</span>
                <textarea defaultValue={kunde.notiz ?? ""} rows={3} onBlur={(e) => { if (e.target.value !== (kunde.notiz ?? "")) void pflegen({ notiz: e.target.value }); }} placeholder="Was man über diesen Kunden wissen sollte" className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body leading-relaxed text-seil-text placeholder:text-seil-muted" />
              </label>
            </div>
          </div>

          <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Ankaufsprofil</span>
              <span className="text-[10px] text-seil-muted">aus OneDrive</span>
            </div>
            <dl className="grid gap-2 text-body">
              <div><dt className="text-kicker text-seil-muted">Standorte</dt><dd className="text-seil-text">{kunde.regionen.join(", ") || "—"}</dd></div>
              <div><dt className="text-kicker text-seil-muted">Assetklassen</dt><dd className="text-seil-text">{kunde.assetklassen.join(", ") || "—"}</dd></div>
              <div><dt className="text-kicker text-seil-muted">Ticket</dt><dd className="text-seil-text">{kunde.ticketMinMio === null && kunde.ticketMaxMio === null ? "—" : `${kunde.ticketMinMio ?? "?"}–${kunde.ticketMaxMio ?? "?"} Mio. €`}</dd></div>
              <div><dt className="text-kicker text-seil-muted">Hat bereits gekauft</dt><dd className="text-seil-text">{kunde.letzteAnkaeufe.join(", ") || "—"}</dd></div>
            </dl>
            <p className="mt-3 text-[10px] leading-relaxed text-seil-muted">
              Wird in der Investorenliste in OneDrive gepflegt, nicht hier.
            </p>
          </div>

          {imProzess.length > 0 ? (
            <div className="rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
              <div className="mb-2 text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Im Prozess</div>
              {imProzess.map((p) => (
                <div key={p.mandat} className="flex items-baseline justify-between gap-2 py-1 text-body">
                  <Link href={`/mandate/${encodeURIComponent(p.mandat)}`} className="truncate text-seil-text hover:text-seil-accent hover:underline">{p.mandat}</Link>
                  <span className="shrink-0 text-kicker text-seil-accent">{p.statusLabel}</span>
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
