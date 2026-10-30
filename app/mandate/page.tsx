import { headers } from "next/headers";
import { MandateAnsicht } from "@/components/mandate-ansicht";

export const dynamic = "force-dynamic";

export default async function MandateSeite() {
  const kuerzel = (await headers()).get("x-seil-benutzer") ?? "";
  return (
    <>
      <div className="mb-5">
        <h1 className="text-title text-seil-text">Mandate</h1>
        <p className="mt-1 text-body text-seil-body">
          Die Pipeline entlang eurer vier SOP-Phasen. Jede Karte zeigt, wo das Mandat steht, wie der
          Investoren-Trichter aussieht und was als Nächstes fällig ist.
        </p>
      </div>
      <MandateAnsicht kuerzel={kuerzel} />
    </>
  );
}
