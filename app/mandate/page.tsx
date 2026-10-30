import { headers } from "next/headers";
import { MandateListe } from "@/components/mandate-liste";

export const dynamic = "force-dynamic";

export default async function MandateSeite() {
  const kuerzel = (await headers()).get("x-seil-benutzer") ?? "";
  return (
    <>
      <div className="mb-5">
        <h1 className="text-title text-seil-text">Mandate</h1>
        <p className="mt-1 text-body text-seil-body">
          Jedes Mandat mit Phase, Zuständigkeit und dem Stand entlang der SOP. Ein Datenraum aus
          Modul 01 wird mit einem Klick zum Mandat.
        </p>
      </div>
      <MandateListe kuerzel={kuerzel} />
    </>
  );
}
