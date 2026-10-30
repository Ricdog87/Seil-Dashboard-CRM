import Link from "next/link";
import { headers } from "next/headers";
import { Kennzahlen } from "@/components/kennzahlen";
import { LeistungPersoenlich } from "@/components/leistung-persoenlich";
import { PipelineTafel } from "@/components/pipeline-tafel";
import { FreigabenEingang } from "@/components/freigaben-eingang";
import { AufgabenListe } from "@/components/aufgaben-liste";
import { AktivitaetenListe } from "@/components/aktivitaeten-liste";
import { darfFreigeben } from "@/lib/freigabe";
import { istGeschaeftsfuehrung } from "@/lib/rollen";
import { NAMEN } from "@/lib/sitzung-token";

/**
 * Die Übersicht eines Makler-Teams am Morgen.
 *
 * Oben die Zahlen, die etwas sagen. Darunter die Pipeline – wo stehen die
 * Mandate. Dann, was diese Person heute angeht: Freigaben, falls sie sie
 * erteilen darf, und die eigenen Aufgaben. Unten der Verlauf: was ist seit
 * gestern passiert.
 */
export const dynamic = "force-dynamic";

export default async function UebersichtSeite() {
  const kuerzel = (await headers()).get("x-seil-benutzer") ?? "";
  const name = NAMEN[kuerzel] ?? kuerzel;
  const darf = darfFreigeben(kuerzel);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-title text-seil-text">{name ? `Guten Tag, ${name.split(" ")[0]}` : "Übersicht"}</h1>
          <p className="mt-1 text-body text-seil-body">
            Alles live aus OneDrive, dem SEIL-Server und der Datenbank – nichts hier ist von Hand
            nachgetragen.
          </p>
        </div>
        <Link
          href="https://srv2104755.hstgr.cloud/qc"
          target="_blank"
          rel="noreferrer"
          className="rounded-seil border border-seil-line px-3 py-1 text-kicker text-seil-body hover:border-seil-accent hover:text-seil-accent"
        >
          Datenraum-Center öffnen ↗
        </Link>
      </div>

      <LeistungPersoenlich kuerzel={kuerzel} />

      <div className="mt-5">
        <Kennzahlen />
      </div>

      <div className="mt-5">
        <PipelineTafel kuerzel={kuerzel} kompakt />
      </div>

      {darf ? <FreigabenEingang kompakt kuerzel={name} darfEntscheiden /> : null}

      <div className="mt-5">
        <AufgabenListe zustaendig={kuerzel} titel="Meine Aufgaben" kompakt darfVerteilen={istGeschaeftsfuehrung(kuerzel)} />
      </div>

      <AktivitaetenListe grenze={15} />
    </>
  );
}
