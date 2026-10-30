import { SeitenKopf } from "@/components/cockpit";
import { InvestorenLive } from "@/components/investoren-live";

export default function InvestorenSeite() {
  return (
    <>
      <SeitenKopf
        titel="Investoren"
        untertitel="Live aus der Investorenliste in OneDrive – dieselbe Quelle, mit der das Matching arbeitet."
      />
      <InvestorenLive />
    </>
  );
}
