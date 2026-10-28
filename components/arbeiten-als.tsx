"use client";

import { mitarbeiter } from "@/lib/mock-data";
import type { Sichtebene } from "@/lib/types";
import { Select } from "@/components/ui";
import { useSitzung } from "./sitzung";

/** Drei Sichtebenen laut Sales-Update 28.09. – Stab arbeitet nicht im Cockpit. */
const GRUPPEN: { ebene: Sichtebene; label: string }[] = [
  { ebene: "fuehrung", label: "Geschäftsführung" },
  { ebene: "leitung", label: "Sales Leadership" },
  { ebene: "team", label: "Staff" },
];

/**
 * Simulierte Anmeldung: Der Umschalter stellt das Cockpit auf die Sicht
 * einer Person. Gruppiert nach Sichtebene, weil davon abhängt, was die
 * Übersicht zeigt – eigene Mandate, Portfolio oder Gesamtperformance.
 * Im echten System ersetzt ihn der Login.
 */
export function ArbeitenAls() {
  const { mitarbeiterId, setMitarbeiterId } = useSitzung();
  return (
    <Select
      aria-label="Arbeiten als"
      value={mitarbeiterId}
      onChange={(e) => setMitarbeiterId(e.target.value)}
    >
      {GRUPPEN.map(({ ebene, label }) => {
        const leute = mitarbeiter.filter((m) => m.ebene === ebene);
        if (leute.length === 0) return null;
        return (
          <optgroup key={ebene} label={label}>
            {leute.map((m) => (
              <option key={m.id} value={m.id}>
                {m.unbesetzt ? `${m.rolle} (nicht besetzt)` : m.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </Select>
  );
}
