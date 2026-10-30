import { headers } from "next/headers";
import Link from "next/link";
import { MandatDetail } from "@/components/mandat-detail";
import { istGeschaeftsfuehrung } from "@/lib/rollen";

export const dynamic = "force-dynamic";

export default async function MandatSeite({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const mandat = decodeURIComponent(name);
  const kuerzel = (await headers()).get("x-seil-benutzer") ?? "";

  return (
    <>
      <Link href="/mandate" className="text-kicker text-seil-accent hover:underline">
        ← alle Mandate
      </Link>
      <MandatDetail mandat={mandat} kuerzel={kuerzel} darfVerteilen={istGeschaeftsfuehrung(kuerzel)} />
    </>
  );
}
