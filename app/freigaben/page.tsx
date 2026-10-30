import { headers } from "next/headers";
import { FreigabenEingang } from "@/components/freigaben-eingang";
import { darfFreigeben } from "@/lib/freigabe";
import { NAMEN } from "@/lib/sitzung-token";

export const dynamic = "force-dynamic";

export default async function FreigabenSeite() {
  const kuerzel = (await headers()).get("x-seil-benutzer") ?? "";
  const darf = darfFreigeben(kuerzel);

  return (
    <>
      <div className="mb-5">
        <h1 className="text-title text-seil-text">Freigaben</h1>
        <p className="mt-1 text-body text-seil-body">
          {darf
            ? "Links der Entwurf, rechts die Empfänger. Haken weg heißt: der bekommt nichts. Erst die Freigabe löst den Versand aus."
            : "Hier liegen die Anschreiben, die auf eine Freigabe warten. Entscheiden darf sie nur die dafür benannte Person – mitlesen alle."}
        </p>
      </div>
      <FreigabenEingang
        kuerzel={NAMEN[kuerzel] ?? kuerzel}
        darfEntscheiden={darf}
      />
    </>
  );
}
