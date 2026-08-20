"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { aufgaben, signale } from "@/lib/mock-data";
import { ArbeitenAls } from "./arbeiten-als";
import { BefehlsPalette } from "./befehlspalette";
import { SeilLogo } from "./seil-logo";
import { useSitzung } from "./sitzung";

const punkte = [
  { href: "/", label: "Übersicht", auchAktivBei: ["/objekte", "/investoren"] },
  { href: "/vermarktung", label: "Vermarktung", auchAktivBei: [] },
  { href: "/aufgaben", label: "Aufgaben", auchAktivBei: [] },
];

export function TopNav() {
  const pathname = usePathname();
  const { aufgabenPatches, signalErledigt } = useSitzung();

  // Live-Zähler: hängen am Sitzungszustand und sinken beim Abhaken/Triagieren mit.
  const offeneAufgaben = aufgaben
    .map((t) => ({ ...t, ...aufgabenPatches[t.id] }))
    .filter((t) => !t.erledigt).length;
  const offeneSignale = signale.filter(
    (sg) => sg.status === "offen" && !signalErledigt[sg.id],
  ).length;
  const zaehler: Record<string, number> = { "/": offeneSignale, "/aufgaben": offeneAufgaben };

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
          <ArbeitenAls />
          <span className="hidden rounded-seil border border-seil-line bg-seil-card-alt px-2 py-0.5 text-kicker text-seil-muted lg:inline">
            Prototyp · Demodaten
          </span>
        </span>
      </div>
    </header>
  );
}
