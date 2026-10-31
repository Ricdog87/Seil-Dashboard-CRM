import { ProzessTafel } from "@/components/prozess-tafel";
import { Standardprozess } from "@/components/standardprozess";
import { PROZESS_SCHRITTE } from "@/lib/sop";

/**
 * Die SOP, nach der das Cockpit gebaut ist: das Flowchart „SEIL Transaction
 * Process“ und der Standardprozess Kommunikation Investoren. Hier zum
 * Nachlesen – im Mandat steht derselbe Prozess mit dem jeweiligen Stand.
 */
export const dynamic = "force-static";

export default function ProzessSeite() {
  return (
    <>
      <div className="mb-5">
        <h1 className="text-title text-seil-text">SEIL Transaction Process</h1>
        <p className="mt-1 text-body text-seil-body">
          Euer Flowchart – {PROZESS_SCHRITTE.length} Schritte von „Portfolio for potential Exit“ bis „Broker Call“,
          mit Responsible und Tool wie im Diagramm. Jedes Mandat läuft genau diese Schritte entlang; was heute
          das Cockpit übernimmt, steht an der Kachel.
        </p>
      </div>

      <ProzessTafel />

      <section className="mt-8">
        <div className="mb-3">
          <h2 className="text-title text-seil-text">Standardprozess Kommunikation Investoren</h2>
          <p className="mt-1 text-body text-seil-body">
            Schritt 15 des Flowcharts im Detail: Was der Investor tut, was SEIL antwortet, was zu tun ist. Im
            Trichter eines Mandats wird jede Antwort nach dieser Tabelle erfasst – von Hand oder durch die
            Antworterkennung – und bewegt den Investor, legt die Aufgabe an und startet die Follow-up-Leiter neu.
          </p>
        </div>
        <Standardprozess />
      </section>

      <p className="mt-6 text-kicker leading-relaxed text-seil-muted">
        Quellen: SEIL Transaction Process Flowchart und Standardprozess Kommunikation Investoren (Stand 12.09.2024),
        übergeben am 31.10.2026. Abweichungen und Setzungen des Cockpits stehen in ANNAHMEN.md ab Punkt 107.
      </p>
    </>
  );
}
