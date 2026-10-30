"use client";

import { useState } from "react";
import { STUFEN, STUFEN_LABEL, STUFEN_TON, type Stufe } from "@/lib/crm";
import type { Kontakt, Kontaktstand } from "@/app/api/kontakte/route";

/**
 * Der Verteiler eines Mandats – wer steht wo im Prozess.
 *
 * Das ist der Teil, der dem Cockpit bisher gefehlt hat: ein Gedächtnis. Wer
 * angeschrieben wurde, wer ein NDA unterschrieben hat, wer abgesagt hat. Eine
 * Änderung wird sofort gespeichert; geht das schief, springt die Stufe zurück
 * und sagt warum – eine Oberfläche, die eine nicht gespeicherte Änderung
 * anzeigt, ist schlimmer als eine, die hakt.
 */
export function Verteiler({
  mandat,
  stand,
  neuLaden,
}: {
  mandat: string;
  stand: Kontaktstand | null;
  neuLaden: () => void;
}) {
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichert, setSpeichert] = useState<string | null>(null);
  const [nurOffene, setNurOffene] = useState(false);
  // Was gerade gesetzt wurde, bevor der naechste Abruf es bestaetigt - damit
  // sich die Liste nicht traege anfuehlt.
  const [vorlaeufig, setVorlaeufig] = useState<Record<string, Stufe>>({});

  async function setzen(k: Kontakt, status: Stufe) {
    setSpeichert(k.investorId);
    setFehler(null);
    setVorlaeufig((v) => ({ ...v, [k.investorId]: status }));
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
      // Zurueck auf den Stand, der wirklich gespeichert ist. Eine Oberflaeche,
      // die eine nicht gespeicherte Aenderung anzeigt, ist schlimmer als eine,
      // die hakt.
      setVorlaeufig((v) => {
        const n = { ...v };
        delete n[k.investorId];
        return n;
      });
      setFehler(
        `„${k.firma ?? k.investorId}" konnte nicht gespeichert werden: ${
          e instanceof Error ? e.message : "unbekannt"
        }`,
      );
    } finally {
      setSpeichert(null);
    }
  }

  const kontakte = (stand?.kontakte ?? []).map((k) =>
    vorlaeufig[k.investorId] ? { ...k, status: vorlaeufig[k.investorId] } : k,
  );
  const offen = kontakte.filter((k) => k.status !== "abgesagt");
  const sichtbar = nurOffene ? offen : kontakte;

  const zaehler = (stufen: Stufe[]) => kontakte.filter((k) => stufen.includes(k.status)).length;
  const geantwortet = zaehler(["interesse", "preisanfrage", "nda_unterzeichnet", "datenraum_freigegeben"]);
  const stumm = zaehler(["angeschrieben", "nda_angefragt"]);

  if (!mandat) return null;

  if (stand && stand.modus !== "live") {
    return (
      <div className="mt-3 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
        <div className="text-body text-seil-text">Verteiler noch nicht angebunden.</div>
        <p className="mt-1 text-kicker leading-relaxed text-seil-muted">
          Sobald der Kontaktstand auf dem Server liegt ({stand.grund ?? "unbekannt"}), steht hier,
          wer angeschrieben ist, wer ein NDA unterschrieben hat und wer geantwortet hat.
        </p>
      </div>
    );
  }

  if (kontakte.length === 0) {
    return (
      <div className="mt-3 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
        <div className="text-body text-seil-text">Für dieses Mandat ist noch niemand im Verteiler.</div>
        <p className="mt-1 text-kicker leading-relaxed text-seil-muted">
          Wer unten im Abgleich ausgewählt und angeschrieben wird, landet hier – und bleibt hier,
          mit dem Stand, den er gerade hat.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
          Verteiler
        </span>
        <span className="text-body text-seil-text">{kontakte.length} im Prozess</span>
        <span className="text-body text-seil-success">{geantwortet} haben geantwortet</span>
        <span className={stumm > 0 ? "text-body text-seil-warning" : "text-body text-seil-muted"}>
          {stumm} ohne Rückmeldung
        </span>
        <span className="text-body text-seil-muted">{zaehler(["abgesagt"])} Absagen</span>
        <label className="ml-auto inline-flex items-center gap-2 text-kicker text-seil-muted">
          <input type="checkbox" checked={nurOffene} onChange={(e) => setNurOffene(e.target.checked)} />
          Absagen ausblenden
        </label>
      </div>

      {fehler ? (
        <p className="mb-2 rounded-[var(--seil-radius)] border border-seil-danger px-3 py-2 text-kicker text-seil-danger">
          {fehler}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--seil-radius)] border border-seil-line">
        <table className="w-full min-w-[720px] border-collapse text-body">
          <thead>
            <tr className="bg-seil-surface text-left text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
              <th className="px-3 py-2 font-medium">Investor</th>
              <th className="px-3 py-2 font-medium">Ansprechpartner</th>
              <th className="px-3 py-2 font-medium">Stand</th>
              <th className="px-3 py-2 font-medium">Letzter Kontakt</th>
              <th className="px-3 py-2 font-medium">Zuletzt geändert</th>
            </tr>
          </thead>
          <tbody>
            {sichtbar.map((k) => (
              <tr key={k.investorId} className="border-t border-seil-line hover:bg-seil-card-alt">
                <td className="px-3 py-2 text-seil-text">{k.firma ?? k.investorId}</td>
                <td className="px-3 py-2 text-seil-body">
                  {k.ansprechpartner ?? "—"}
                  {k.email ? (
                    <div className="text-kicker text-seil-muted">{k.email}</div>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={k.status}
                    disabled={speichert === k.investorId}
                    onChange={(e) => void setzen(k, e.target.value as Stufe)}
                    aria-label={`Stand von ${k.firma ?? k.investorId}`}
                    className={`rounded-seil border bg-seil-surface px-2 py-1 text-body ${STUFEN_TON[k.status]}`}
                  >
                    {STUFEN.map((s) => (
                      <option key={s} value={s}>
                        {STUFEN_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-seil-body">
                  {k.letzterKontakt
                    ? new Date(k.letzterKontakt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })
                    : "—"}
                </td>
                <td className="px-3 py-2 text-kicker text-seil-muted">{k.geaendertDurch ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-kicker leading-relaxed text-seil-muted">
        Eine Änderung ist sofort gespeichert und für alle sichtbar. Wer angeschrieben wird, kommt
        automatisch mit dem Stand „Angeschrieben“ hierher – alles danach trägt das Team ein,
        solange die Antworterkennung es nicht selbst kann.
      </p>
    </div>
  );
}
