import type { Metadata } from "next";
import { headers } from "next/headers";
import { NAMEN } from "@/lib/sitzung-token";
import { TopNav } from "@/components/nav";
import { Modul01Provider } from "@/components/modul01";
import { SitzungsProvider } from "@/components/sitzung";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEIL Cockpit · Modul 02",
  description:
    "SEIL Cockpit (Modul 02) – Transaktionsprozess, Datenräume aus Modul 01 und die Investoren-Liveliste aus OneDrive.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const kuerzel = (await headers()).get("x-seil-benutzer") ?? "";
  const angemeldet = NAMEN[kuerzel] ?? (kuerzel || undefined);

  return (
    <html lang="de">
      <body>
        <SitzungsProvider>
          <Modul01Provider>
            <TopNav benutzer={angemeldet} />
            <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
          </Modul01Provider>
        </SitzungsProvider>
        <footer className="mx-auto max-w-[1200px] border-t border-seil-line px-4 py-6 text-kicker text-seil-muted sm:px-6">
          SEIL Cockpit · Modul 02 · Datenräume aus Modul 01 und Investoren aus der Liveliste in
          OneDrive, bei jedem Aufruf frisch gelesen. Vertraulich – nur für das SEIL-Team.
        </footer>
      </body>
    </html>
  );
}
