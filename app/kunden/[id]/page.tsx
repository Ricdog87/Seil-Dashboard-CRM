import Link from "next/link";
import { headers } from "next/headers";
import { KundeAkte } from "@/components/kunde-akte";
import { istGeschaeftsfuehrung } from "@/lib/rollen";

export const dynamic = "force-dynamic";

export default async function KundeSeite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kuerzel = (await headers()).get("x-seil-benutzer") ?? "";
  return (
    <>
      <Link href="/kunden" className="text-kicker text-seil-accent hover:underline">
        ← alle Kunden
      </Link>
      <KundeAkte id={decodeURIComponent(id)} kuerzel={kuerzel} darfVerteilen={istGeschaeftsfuehrung(kuerzel)} />
    </>
  );
}
