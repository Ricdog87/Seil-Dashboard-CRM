import Link from "next/link";
import { LiveBand } from "@/components/live-band";
import { LiveDatenraeume } from "@/components/live-datenraeume";

/**
 * Übersicht mit ausschließlich echten Daten.
 *
 * Die frühere Demo-Übersicht (Mandate, Aufgaben, Vermarktung aus Beispieldaten)
 * ist bewusst nicht mehr verlinkt: seit das Team eigene Zugänge hat, würde
 * erfundenes Material neben echtem für Verwirrung sorgen. Sie liegt als
 * page.demo.tsx.bak im Repository und kommt zurück, sobald die Mandate aus
 * der Datenbank kommen.
 */
export default function UebersichtSeite() {
  const werkzeuge = [
    {
      titel: "Investorenliste",
      text: "Alle Investoren live aus OneDrive, mit Suche über Firma, Region und Assetklasse.",
      href: "/investoren",
      extern: false,
    },
    {
      titel: "Datenraum-Center",
      text: "Datenräume erstellen, Prüffälle abarbeiten, Schwärzung freigeben. Modul 01 auf dem SEIL-Server.",
      href: "https://srv2104755.hstgr.cloud/qc",
      extern: true,
    },
    {
      titel: "Automatik",
      text: "Die zehn Abläufe von der Datenraum-Übernahme bis zur Antworterkennung, mit Protokoll jedes Laufs.",
      href: "https://srv2104755.hstgr.cloud/",
      extern: true,
    },
  ];

  return (
    <>
      <div className="mb-5">
        <h1 className="text-title text-seil-text">Übersicht</h1>
        <p className="mt-1 text-body text-seil-body">
          Alles auf dieser Seite kommt direkt aus OneDrive und von eurem Server. Es gibt hier keine
          Beispieldaten mehr.
        </p>
      </div>

      <LiveBand />
      <LiveDatenraeume />

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {werkzeuge.map((w) => (
          <Link
            key={w.titel}
            href={w.href}
            target={w.extern ? "_blank" : undefined}
            rel={w.extern ? "noreferrer" : undefined}
            className="min-w-0 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card p-4 transition-colors hover:border-seil-accent"
          >
            <div className="text-body text-seil-text">{w.titel}</div>
            <p className="mt-1 text-kicker leading-relaxed text-seil-muted">{w.text}</p>
          </Link>
        ))}
      </section>

      <section className="mt-5 rounded-[var(--seil-radius)] border border-seil-line bg-seil-surface p-4">
        <h2 className="text-body text-seil-text">Was als Nächstes kommt</h2>
        <p className="mt-1 text-kicker leading-relaxed text-seil-muted">
          Mandate, Aufgaben und der Vermarktungsstand erscheinen hier, sobald sie aus der Datenbank
          kommen statt aus Beispieldaten. Die Tabellen dafür stehen bereits. Bis dahin sind der
          Datenraum und die Investorenliste die beiden Stellen, an denen mit echten Daten gearbeitet
          wird.
        </p>
      </section>
    </>
  );
}
