import { headers } from "next/headers";
import { LeistungSeite } from "@/components/leistung-seite";
import { istGeschaeftsfuehrung } from "@/lib/rollen";

export const dynamic = "force-dynamic";

export default async function LeistungPage() {
  const kuerzel = (await headers()).get("x-seil-benutzer") ?? "";
  const gf = istGeschaeftsfuehrung(kuerzel);
  return (
    <>
      <div className="mb-5">
        <h1 className="text-title text-seil-text">Leistung</h1>
        <p className="mt-1 text-body text-seil-body">
          {gf
            ? "Umsatz, Pipeline und Forecast für das Team – und Ziel gegen Ist für jede Person."
            : "Dein Stand gegen deine Ziele – und das Team als Ganzes."}
        </p>
      </div>
      <LeistungSeite kuerzel={kuerzel} />
    </>
  );
}
