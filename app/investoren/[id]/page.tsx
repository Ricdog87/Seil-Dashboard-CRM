import { redirect } from "next/navigation";

export default async function InvestorSeite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/kunden/${id}`);
}
