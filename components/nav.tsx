"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SeilLogo } from "./seil-logo";

const punkte = [
  { href: "/", label: "Übersicht", auchAktivBei: ["/objekte", "/investoren"] },
  { href: "/vermarktung", label: "Vermarktung", auchAktivBei: [] },
  { href: "/aufgaben", label: "Aufgaben", auchAktivBei: [] },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-seil-line bg-seil-surface">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-8 px-6">
        {/* Mindestabstand rechts = halbe Logohoehe */}
        <Link
          href="/"
          className="flex items-center gap-3 pr-3"
          aria-label="SEIL Cockpit, Startseite"
        >
          <SeilLogo height={24} />
          <span className="hidden text-kicker tracking-kicker text-seil-muted uppercase sm:inline">
            Cockpit · Modul 02
          </span>
        </Link>

        <nav className="flex h-full">
          {punkte.map((p) => {
            const aktiv =
              pathname === p.href || p.auchAktivBei.some((prefix) => pathname.startsWith(prefix));
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={aktiv ? "page" : undefined}
                className={`flex items-center border-b px-3 text-body transition-colors ${
                  aktiv
                    ? "border-seil-accent text-seil-text"
                    : "border-transparent text-seil-muted hover:text-seil-text"
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </nav>

        <span className="ml-auto rounded-seil border border-seil-line bg-seil-card-alt px-2 py-0.5 text-kicker text-seil-muted">
          Prototyp · Demodaten
        </span>
      </div>
    </header>
  );
}
