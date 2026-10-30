import Link from "next/link";
import { headers } from "next/headers";
import { LiveBand } from "@/components/live-band";
import { LiveDatenraeume } from "@/components/live-datenraeume";
import { FreigabenEingang } from "@/components/freigaben-eingang";
import { MandateListe } from "@/components/mandate-liste";
import { AufgabenListe } from "@/components/aufgaben-liste";
import { AktivitaetenListe } from "@/components/aktivitaeten-liste";
import { darfFreigeben } from "@/lib/freigabe";
import { NAMEN } from "@/lib/sitzung-token";

/**
 * Die Übersicht: was heute ansteht, und zwar für die Person, die davorsitzt.
 *
 * Erst die eigenen Aufgaben, dann die Freigaben (wer sie erteilen darf, sieht
 * sie hier zuerst), dann die eigenen Mandate. Die Live-Zahlen stehen oben,
 * weil sie den Rahmen geben, nicht weil sie das Wichtigste sind.
 */
export const dynamic = "force-dynamic";

export default async function UebersichtSeite() {
  const kuerzel = (await headers()).get("x-seil-benutzer") ?? "";
  const name = NAMEN[kuerzel] ?? kuerzel;
  const darf = darfFreigeben(kuerzel);

  const werkzeuge = [
    {
      titel: "Datenraum-Center",
      text: "Datenräume erstellen, Prüffälle abarbeiten, Schwärzung freigeben. Modul 01 auf dem SEIL-Server.",
      href: "https://srv2104755.hstgr.cloud/qc",
    },
    {
      titel: "Automatik",
      text: "Die Abläufe von der Datenraum-Übernahme bis zur Antworterkennung, mit Protokoll jedes Laufs.",
      href: "https://srv2104755.hstgr.cloud/",
    },
  ];

  return (
    <>
      <div className="mb-5">
        <h1 className="text-title text-seil-text">{name ? `Guten Tag, ${name}` : "Übersicht"}</h1>
        <p className="mt-1 text-body text-seil-body">
          Was heute ansteht – Aufgaben, Freigaben und Mandate. Alle Zahlen kommen aus OneDrive, dem
          SEIL-Server und der Datenbank.
        </p>
      </div>

      <LiveBand />

      <div className="mt-5">
        <AufgabenListe zustaendig={kuerzel} titel="Meine Aufgaben" kompakt />
      </div>

      {darf ? (
        <FreigabenEingang kompakt kuerzel={name} darfEntscheiden />
      ) : null}

      <div className="mt-5">
        <MandateListe kuerzel={kuerzel} />
      </div>

      <LiveDatenraeume />

      <AktivitaetenListe grenze={15} />

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        {werkzeuge.map((w) => (
          <Link
            key={w.titel}
            href={w.href}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4 transition-colors hover:border-seil-accent"
          >
            <div className="text-body text-seil-text">{w.titel}</div>
            <p className="mt-1 text-kicker leading-relaxed text-seil-muted">{w.text}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
