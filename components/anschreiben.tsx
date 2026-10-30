"use client";

import { useState } from "react";
import type { VersandEmpfaenger } from "@/app/api/versand/route";

/**
 * Anschreiben schreiben und rausgeben – der CRM-Teil des Cockpits.
 *
 * Zwei Wege, bewusst getrennt: „zur Freigabe“ legt je Empfänger einen Entwurf
 * in den Freigabe-Eingang, wo die Geschäftsführung ihn sieht, bevor ihn ein
 * Investor sieht. „Jetzt senden“ geht sofort raus und steht deshalb hinter einer
 * zweiten Bestätigung.
 */
export function Anschreiben({
  objekt,
  empfaenger,
  onFertig,
}: {
  objekt: string;
  empfaenger: VersandEmpfaenger[];
  onFertig?: () => void;
}) {
  const mitMail = empfaenger.filter((e) => e.email);
  const ohneMail = empfaenger.length - mitMail.length;

  const [betreff, setBetreff] = useState(objekt ? `${objekt} – Investment-Opportunität` : "");
  const [text, setText] = useState(
    `Sehr geehrte Damen und Herren,\n\nwir betreuen aktuell ein Objekt, das zu Ihrem Ankaufsprofil passt: ${objekt}.\n\nGerne senden wir Ihnen die Unterlagen nach Zeichnung einer Vertraulichkeitserklärung zu. Sagen Sie uns kurz Bescheid, ob wir Ihnen den Teaser schicken dürfen.\n\nMit freundlichen Grüßen`,
  );
  const [sicher, setSicher] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string } | null>(null);

  async function senden(modus: "freigabe" | "sofort") {
    setLaeuft(true);
    setAntwort(null);
    try {
      const r = await fetch("/api/versand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objekt, betreff, text, modus, empfaenger: mitMail }),
      });
      const a = (await r.json()) as { ok?: boolean; grund?: string; anzahl?: number };
      setAntwort(
        a.ok
          ? {
              ok: true,
              text:
                modus === "freigabe"
                  ? `${a.anzahl} Entwürfe liegen im Freigabe-Eingang.`
                  : `${a.anzahl} Anschreiben sind in den Versand gegangen.`,
            }
          : { ok: false, text: a.grund ?? "Die Automatik hat den Auftrag nicht angenommen." },
      );
      if (a.ok) {
        setSicher(false);
        onFertig?.();
      }
    } catch (e) {
      setAntwort({ ok: false, text: e instanceof Error ? e.message : "nicht erreichbar" });
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <div className="mt-3 rounded-[var(--seil-radius)] border border-seil-accent bg-seil-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-body text-seil-text">Anschreiben an {mitMail.length} Investoren</h3>
        <span className="text-kicker text-seil-muted">
          {ohneMail > 0 ? `${ohneMail} ohne E-Mail-Adresse bleiben außen vor` : "alle mit E-Mail-Adresse"}
        </span>
      </div>

      <label className="mt-3 grid gap-1 text-kicker text-seil-muted">
        Betreff
        <input
          value={betreff}
          onChange={(e) => setBetreff(e.target.value)}
          className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body text-seil-text"
        />
      </label>
      <label className="mt-2 grid gap-1 text-kicker text-seil-muted">
        Text
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={9}
          className="rounded-seil border border-seil-line bg-seil-surface px-2 py-1 text-body leading-relaxed text-seil-text"
        />
      </label>
      <p className="mt-1 text-kicker text-seil-muted">
        Signatur und rechtlicher Hinweis hängt die Automatik an – sie stehen zentral, damit sie in
        jeder Mail gleich sind.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={laeuft || mitMail.length === 0}
          onClick={() => void senden("freigabe")}
          className="rounded-seil border border-seil-accent bg-seil-accent-bg px-3 py-1 text-body text-seil-text disabled:opacity-50"
        >
          {laeuft ? "…" : "Zur Freigabe geben"}
        </button>

        <label className="inline-flex items-center gap-2 text-kicker text-seil-muted">
          <input type="checkbox" checked={sicher} onChange={(e) => setSicher(e.target.checked)} />
          ohne Freigabe sofort senden
        </label>
        <button
          type="button"
          disabled={!sicher || laeuft || mitMail.length === 0}
          onClick={() => void senden("sofort")}
          className="rounded-seil border border-seil-line px-3 py-1 text-body text-seil-muted hover:border-seil-danger hover:text-seil-danger disabled:opacity-40"
        >
          Jetzt senden
        </button>
      </div>

      {antwort ? (
        <p
          className={`mt-2 text-kicker ${antwort.ok ? "text-seil-success" : "text-seil-danger"}`}
        >
          {antwort.text}
        </p>
      ) : null}
    </div>
  );
}
