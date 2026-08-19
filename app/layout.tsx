import type { Metadata } from "next";
import { TopNav } from "@/components/nav";
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
          <TopNav />
          <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
        </SitzungsProvider>
        <footer className="mx-auto max-w-[1200px] border-t border-seil-line px-6 py-6 text-kicker text-seil-muted">
          SEIL Cockpit · Modul 02 · Visueller Prototyp mit frei erfundenen Demodaten – keine echten
          Objekte, Investoren oder Dokumente. Datenraum-Status: Anzeige aus Modul 01 (hier
          simuliert).
        </footer>
      </body>
    </html>
  );
}
