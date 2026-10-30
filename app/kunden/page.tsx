import { headers } from "next/headers";
import { KundenListe } from "@/components/kunden-liste";

export const dynamic = "force-dynamic";

export default async function KundenSeite() {
  const kuerzel = (await headers()).get("x-seil-benutzer") ?? "";
  return (
    <>
      <div className="mb-5">
        <h1 className="text-title text-seil-text">Kunden</h1>
        <p className="mt-1 text-body text-seil-body">
          Investoren, Auftraggeber, Interessenten und Partner – mit Betreuer und Stand. Die
          Stammdaten kommen live aus der Liste in OneDrive, gepflegt wird hier.
        </p>
      </div>
      <KundenListe kuerzel={kuerzel} />
    </>
  );
}
