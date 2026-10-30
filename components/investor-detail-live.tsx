"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Anschreiben } from "@/components/anschreiben";
import type { LiveInvestor, LiveInvestoren } from "@/app/api/investoren/route";

/**
 * Ein Kunde aus der Liveliste.
 *
 * Gesucht wird über dieselbe Route wie überall sonst – es gibt keine zweite,
 * stillere Kopie der Daten. Wer hier etwas ändern will, ändert es in OneDrive;
 * das Cockpit schreibt in die Liste nicht hinein.
 */
export function InvestorDetailLive({ id }: { id: string }) {
  const [stand, setStand] = useState<LiveInvestoren | null>(null);
  const [schreiben, setSchreiben] = useState(false);

  useEffect(() => {
    fetch(`/api/investoren?limit=100&suche=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<LiveInvestoren>)
      .then(setStand)
      .catch(() => setStand({ modus: "fehler", grund: "nicht erreichbar", investoren: [] }));
  }, [id]);

  const treffer: LiveInvestor | undefined =
    stand?.investoren.find((i) => i.id.toLowerCase() === id.toLowerCase()) ?? stand?.investoren[0];

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
      <Link href="/investoren" className="text-kicker text-seil-accent hover:underline">
        ← zurück zur Liste
      </Link>

      {!stand ? (
        <p className="mt-4 text-body text-seil-muted">wird geladen …</p>
      ) : !treffer ? (
        <div className="mt-4 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4">
          <p className="text-body text-seil-text">
            {stand.modus === "live"
              ? `In der Liveliste steht kein Eintrag zu „${id}“.`
              : `Die Liveliste ist gerade nicht erreichbar (${stand.grund ?? "unbekannt"}).`}
          </p>
        </div>
      ) : (
        <>
          <h1 className="mt-3 text-title text-seil-text">{treffer.firma}</h1>
          <p className="mt-1 text-body text-seil-body">
            {treffer.ansprechpartner ?? "ohne Ansprechpartner in der Liste"}
          </p>

          <div className="mt-4 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card px-4 py-2">
            <Zeile k="E-Mail" v={treffer.email ?? "— nicht hinterlegt"} />
            <Zeile k="Standorte" v={(treffer.regionen ?? []).join(", ") || "— nicht hinterlegt"} />
            <Zeile k="Assetklassen" v={(treffer.assetklassen ?? []).join(", ") || "— nicht hinterlegt"} />
            <Zeile
              k="Ticket"
              v={
                treffer.ticketMinMio === null && treffer.ticketMaxMio === null
                  ? "— nicht hinterlegt"
                  : `${treffer.ticketMinMio ?? "?"}–${treffer.ticketMaxMio ?? "?"} Mio.`
              }
            />
            <Zeile
              k="Hat bereits gekauft"
              v={(treffer.letzteAnkaeufe ?? []).join(", ") || "— nichts hinterlegt"}
            />
          </div>

          {treffer.email ? (
            schreiben ? (
              <Anschreiben
                objekt=""
                empfaenger={[
                  {
                    id: treffer.id,
                    firma: treffer.firma,
                    ansprechpartner: treffer.ansprechpartner,
                    email: treffer.email,
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
              Ohne E-Mail-Adresse in der Liste lässt sich von hier aus nichts verschicken.
            </p>
          )}

          <p className="mt-4 text-kicker leading-relaxed text-seil-muted">
            Alles auf dieser Seite steht genau so in der Investorenliste in OneDrive. Was dort fehlt,
            fehlt auch hier – geändert wird in der Liste, nicht im Cockpit.
          </p>
        </>
      )}
    </>
  );
}
