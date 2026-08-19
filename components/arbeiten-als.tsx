"use client";

import { mitarbeiter } from "@/lib/mock-data";
import { Select } from "@/components/ui";
import { useSitzung } from "./sitzung";

/**
 * Simulierte Anmeldung: Der Umschalter stellt das Cockpit auf die Sicht
 * eines Mitarbeiters (Meine Aufgaben, Zähler, Notiz-Autor). Im echten
 * System ersetzt ihn der Login.
 */
export function ArbeitenAls() {
  const { mitarbeiterId, setMitarbeiterId } = useSitzung();
  return (
    <Select
      aria-label="Arbeiten als"
      value={mitarbeiterId}
      onChange={(e) => setMitarbeiterId(e.target.value)}
    >
      {mitarbeiter.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </Select>
  );
}
