"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useModul01 } from "@/components/modul01";
import { BefehlsPalette } from "./befehlspalette";
import { SeilLogo } from "./seil-logo";

const punkte = [
  // Nur Seiten mit echten Daten. Vermarktung und Aufgaben sind Beispieldaten
  // und bleiben ausgeblendet, bis sie aus der Datenbank kommen.
  { href: "/", label: "Übersicht", auchAktivBei: [] },
  { href: "/mandate", label: "Mandate", auchAktivBei: ["/mandate/"] },
  { href: "/freigaben", label: "Freigaben", auchAktivBei: [] },
  { href: "/aufgaben", label: "Aufgaben", auchAktivBei: [] },
  { href: "/leistung", label: "Leistung", auchAktivBei: [] },
  { href: "/kunden", label: "Kunden", auchAktivBei: ["/kunden/"] },
  { href: "/prozess", label: "Prozess", auchAktivBei: [] },
];

export function TopNav({ benutzer }: { benutzer?: string }) {
  const pathname = usePathname();
  const { modus } = useModul01();
  const aufAnmeldeseite = pathname === "/anmelden";
  // Das Abzeichen muss sagen, was AUF DIESER SEITE steht, nicht ob irgendeine
  // Verbindung lebt. Sonst behauptet es "live" ueber erfundene Investoren.
  // Es gibt keine Demoseiten mehr: alles im Cockpit kommt aus OneDrive, dem
  // SEIL-Server oder der Datenbank.
  const abzeichen =
    modus === "live" || pathname.startsWith("/kunden") || pathname.startsWith("/prozess")
      ? { text: "Live", echt: true }
      : { text: "Modul 01 nicht erreichbar", echt: false };

  // Keine Zaehler mehr in der Navigation: die alten kamen aus Beispieldaten und
  // haetten neben echten Zahlen behauptet, es liege etwas zur Bearbeitung an.
  const zaehler: Record<string, number> = {};

  // Die Anmeldeseite bringt ihren eigenen Kopf mit; eine Leiste mit Punkten,
  // die alle wieder hierher fuehren, hilft niemandem beim Anmelden.
  if (aufAnmeldeseite) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-seil-line bg-seil-surface">
      {/* Mobil bricht die Leiste in zwei Zeilen: oben Logo + Bedienung, darunter die Navigation.
          Ab md ist alles eine Zeile – nichts darf das Dokument breiter als den Viewport machen. */}
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-4 px-4 sm:px-6 md:h-14 md:flex-nowrap md:gap-8">
        {/* Mindestabstand rechts = halbe Logohoehe */}
        <Link
          href="/"
          className="flex h-12 items-center gap-3 pr-3 md:h-auto"
          aria-label="SEIL Cockpit, Startseite"
        >
          <SeilLogo height={24} />
          <span className="hidden text-kicker tracking-kicker text-seil-muted uppercase sm:inline">
            Cockpit · Modul 02
          </span>
        </Link>

        <nav className="order-last -mx-4 flex h-11 w-[100vw] overflow-x-auto border-t border-seil-line px-2 sm:-mx-6 sm:px-4 md:order-none md:mx-0 md:h-14 md:w-auto md:border-t-0 md:px-0">
          {punkte.map((p) => {
            const aktiv =
              pathname === p.href || p.auchAktivBei.some((prefix) => pathname.startsWith(prefix));
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={aktiv ? "page" : undefined}
                className={`flex items-center whitespace-nowrap border-b px-3 text-body transition-colors ${
                  aktiv
                    ? "border-seil-accent text-seil-text"
                    : "border-transparent text-seil-muted hover:text-seil-text"
                }`}
              >
                {p.label}
                {zaehler[p.href] ? (
                  <span
                    // key = Wert: bei Änderung remountet der Badge und poppt kurz.
                    key={zaehler[p.href]}
                    className="seil-pop ml-1.5 rounded-seil bg-seil-card-alt px-1.5 text-kicker tabular-nums text-seil-muted"
                    aria-label={`${zaehler[p.href]} offen`}
                  >
                    {zaehler[p.href]}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <span className="ml-auto inline-flex items-center gap-3">
          <BefehlsPalette />
          {benutzer ? (
            <span className="inline-flex items-center gap-2">
              <span className="max-w-[9rem] truncate rounded-seil border border-seil-line bg-seil-card-alt px-2 py-0.5 text-kicker text-seil-body">
                {benutzer}
              </span>
              <form action="/api/abmelden" method="post">
                <button
                  type="submit"
                  className="rounded-seil border border-seil-line px-2 py-0.5 text-kicker text-seil-muted hover:border-seil-accent hover:text-seil-accent"
                >
                  Abmelden
                </button>
              </form>
            </span>
          ) : null}
          {!benutzer ? (
            <Link
              href="/anmelden"
              className="rounded-seil border border-seil-accent bg-seil-accent-bg px-2 py-0.5 text-kicker text-seil-text"
            >
              Anmelden
            </Link>
          ) : null}
          <span className={`hidden rounded-seil border px-2 py-0.5 text-kicker lg:inline ${abzeichen.echt ? "border-seil-accent text-seil-accent" : "border-seil-line bg-seil-card-alt text-seil-muted"}`}>
            {abzeichen.text}
          </span>
        </span>
      </div>
    </header>
  );
}
