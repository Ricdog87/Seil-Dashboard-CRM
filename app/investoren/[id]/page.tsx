import { InvestorDetailLive } from "@/components/investor-detail-live";

export const dynamic = "force-dynamic";

export default async function InvestorSeite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvestorDetailLive id={decodeURIComponent(id)} />;
}
