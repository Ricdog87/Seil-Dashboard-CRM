import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { TopNav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEIL Cockpit · Prototyp",
  description:
    "SEIL Cockpit (Modul 02) – visueller Frontend-Prototyp für Transaktionsberatung: Objekte, Investoren und Auftraggeber relational verknüpft. Klickdummy mit Demodaten, ohne Backend.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={GeistSans.variable}>
      <body>
        <TopNav />
        <main className="mx-auto max-w-[1200px] px-6 py-6">{children}</main>
        <footer className="mx-auto max-w-[1200px] px-6 pt-2 pb-8 text-[11px] text-ink-mute">
          SEIL Cockpit · Modul 02 · Visueller Prototyp mit frei erfundenen Demodaten – keine echten
          Objekte, Investoren oder Dokumente. Datenraum-Status: Anzeige aus Modul 01 (hier
          simuliert).
        </footer>
      </body>
    </html>
  );
}
