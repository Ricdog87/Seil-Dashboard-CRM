"use client";

import { mitarbeiterVon } from "@/lib/derive";
import { useSitzung } from "./sitzung";

/**
 * Rollen-Weiche der Übersicht – drei Ebenen aus dem Sales-Update (28.09.):
 * Geschäftsführung sieht den rein lesenden Zahlen-Blick, die Sales Leadership
 * zusätzlich zum eigenen Tag die Portfolio-Ebene über alle Mandate, Staff den
 * eigenen Tag. Alle Äste kommen fertig gerendert von der Seite – hier fällt nur die Wahl.
 */
export function UebersichtWeiche({
  gf,
  portfolio,
  operativ,
}: {
  gf: React.ReactNode;
  portfolio: React.ReactNode;
  operativ: React.ReactNode;
}) {
  const { mitarbeiterId } = useSitzung();
  const ebene = mitarbeiterVon(mitarbeiterId)?.ebene ?? "team";

  if (ebene === "fuehrung") return <>{gf}</>;
  if (ebene === "leitung")
    return (
      <>
        {portfolio}
        {operativ}
      </>
    );
  return <>{operativ}</>;
}
