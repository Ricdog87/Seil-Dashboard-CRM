import type { Metadata } from "next";
import { StatusTracker } from "@/components/status-tracker";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ name: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { name } = await params;
  return { title: `Statustracker ${decodeURIComponent(name)} – SEIL Real Estate` };
}

export default async function StatusTrackerSeite({ params }: Params) {
  const { name } = await params;
  return <StatusTracker mandat={decodeURIComponent(name)} />;
}
