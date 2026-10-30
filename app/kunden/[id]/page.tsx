import Link from "next/link";
import { KundeDetail } from "@/components/kunde-detail";

export const dynamic = "force-dynamic";

export default async function KundeSeite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Link href="/kunden" className="text-kicker text-seil-accent hover:underline">
        ← alle Kunden
      </Link>
      <KundeDetail id={decodeURIComponent(id)} />
    </>
  );
}
