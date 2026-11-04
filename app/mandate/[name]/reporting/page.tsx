import type { Metadata } from "next";
import { ReportingBericht } from "@/components/reporting-bericht";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ name: string }> };

/** Der Seitentitel wird beim „Als PDF speichern“ zum Dateinamen. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { name } = await params;
  return { title: `Reporting ${decodeURIComponent(name)} – SEIL Real Estate` };
}

export default async function ReportingSeite({ params }: Params) {
  const { name } = await params;
  return <ReportingBericht mandat={decodeURIComponent(name)} />;
}
