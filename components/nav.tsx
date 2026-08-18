"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const punkte = [
  { href: "/", label: "Übersicht", auchAktivBei: ["/objekte", "/investoren"] },
  { href: "/vermarktung", label: "Vermarktung", auchAktivBei: [] },
  { href: "/aufgaben", label: "Aufgaben", auchAktivBei: [] },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <div className="mx-auto flex h-12 max-w-[1200px] items-center gap-8 px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold tracking-tight">SEIL Cockpit</span>
          <span className="text-[11px] text-ink-mute">Modul 02</span>
        </Link>
        <nav className="flex h-full items-center gap-1">
          {punkte.map((p) => {
            const aktiv =
              pathname === p.href || p.auchAktivBei.some((prefix) => pathname.startsWith(prefix));
            return (
              <Link
                key={p.href}
                href={p.href}
                className={`flex h-full items-center border-b-2 px-3 text-[13px] transition-colors ${
                  aktiv
                    ? "border-accent font-medium text-ink"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </nav>
        <span className="ml-auto rounded border border-line bg-paper px-2 py-0.5 text-[11px] text-ink-mute">
          Prototyp · Demodaten
        </span>
      </div>
    </header>
  );
}
