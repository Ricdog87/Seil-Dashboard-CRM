"use client";

import { GF_ID } from "@/lib/mock-data";
import { useSitzung } from "./sitzung";

/**
 * Rollen-Weiche der Übersicht: „Arbeiten als“ Max Seil (Geschäftsführung)
 * zeigt den rein lesenden GF-Blick, alle anderen den operativen Tag.
 * Beide Äste kommen fertig gerendert von der Seite – hier fällt nur die Wahl.
 */
export function UebersichtWeiche({
  gf,
  operativ,
}: {
  gf: React.ReactNode;
  operativ: React.ReactNode;
}) {
  const { mitarbeiterId } = useSitzung();
  return <>{mitarbeiterId === GF_ID ? gf : operativ}</>;
}
