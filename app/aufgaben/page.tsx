import { AufgabenListe } from "@/components/aufgaben-client";
import { SeitenKopf } from "@/components/ui";

export default function AufgabenSeite() {
  return (
    <>
      <SeitenKopf
        titel="Aufgaben"
        untertitel="Nach Mitarbeiter gefiltert – Broker Calls aus der Antworterkennung sind hervorgehoben."
      />
      <AufgabenListe />
    </>
  );
}
