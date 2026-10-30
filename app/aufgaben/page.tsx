import { headers } from "next/headers";
import { AufgabenTafel } from "@/components/aufgaben-tafel";

export const dynamic = "force-dynamic";

export default async function AufgabenSeite() {
  const kuerzel = (await headers()).get("x-seil-benutzer") ?? "";
  return (
    <>
      <div className="mb-5">
        <h1 className="text-title text-seil-text">Aufgaben</h1>
        <p className="mt-1 text-body text-seil-body">
          Was brennt, was heute ansteht, was diese Woche kommt. Aufgaben aus dem Trichter sind
          markiert – die hat niemand getippt.
        </p>
      </div>
      <AufgabenTafel kuerzel={kuerzel} />
    </>
  );
}
