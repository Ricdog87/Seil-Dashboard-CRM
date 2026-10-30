import { headers } from "next/headers";
import { AufgabenListe } from "@/components/aufgaben-liste";
import { NAMEN } from "@/lib/sitzung-token";

export const dynamic = "force-dynamic";

export default async function AufgabenSeite() {
  const kuerzel = (await headers()).get("x-seil-benutzer") ?? "";
  return (
    <>
      <div className="mb-5">
        <h1 className="text-title text-seil-text">Aufgaben</h1>
        <p className="mt-1 text-body text-seil-body">
          Oben die eigenen, darunter alle. Eine Aufgabe ohne Zuständigen und ohne Datum ist ein
          Zettel – beides lässt sich hier setzen.
        </p>
      </div>
      <AufgabenListe zustaendig={kuerzel} titel={`Meine Aufgaben (${NAMEN[kuerzel] ?? kuerzel})`} kompakt />
      <AufgabenListe titel="Alle Aufgaben" />
    </>
  );
}
