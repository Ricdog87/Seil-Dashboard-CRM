import type { Metadata } from "next";
import { TopNav } from "@/components/nav";
import { Modul01Provider } from "@/components/modul01";
import { SitzungsProvider } from "@/components/sitzung";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEIL Cockpit · Prototyp",
  description:
    "SEIL Cockpit (Modul 02) – visueller Frontend-Prototyp für Transaktionsberatung: Objekte, Investoren und Auftraggeber relational verknüpft. Klickdummy mit Demodaten, ohne Backend.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <SitzungsProvider>
          <Modul01Provider>
            <TopNav />
            <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
          </Modul01Provider>
        </SitzungsProvider>
        <footer className="mx-auto max-w-[1200px] border-t border-seil-line px-4 py-6 text-kicker text-seil-muted sm:px-6">
          SEIL Cockpit · Modul 02 · Visueller Prototyp mit frei erfundenen Demodaten – keine echten
          Objekte, Investoren oder Dokumente. Datenraum-Status aus Modul 01 – live, sobald die
          Anbindung konfiguriert ist, sonst Demodaten.
        </footer>
      </body>
    </html>
  );
}
