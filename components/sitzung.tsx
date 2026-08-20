"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Aufgabe } from "@/lib/types";

/**
 * Sitzungszustand des Klickdummys – simuliert die Anmeldung und alle
 * Eingriffe, die im echten System in der Datenbank landen würden.
 * Alles lebt nur im Speicher dieser Sitzung; ein Reload stellt den
 * kuratierten Demostand wieder her.
 */

export type AufgabenPatch = Partial<Pick<Aufgabe, "mitarbeiterId" | "faellig" | "erledigt">>;

export interface SitzungsNotiz {
  id: string;
  objektId: string;
  text: string;
  mitarbeiterId: string;
}

interface Sitzung {
  mitarbeiterId: string;
  setMitarbeiterId: (id: string) => void;
  aufgabenPatches: Record<string, AufgabenPatch>;
  patchAufgabe: (id: string, patch: AufgabenPatch) => void;
  resetAufgaben: () => void;
  signalErledigt: Record<string, string>; // signalId → Verarbeitungshinweis
  verarbeiteSignal: (id: string, hinweis: string) => void;
  notizen: SitzungsNotiz[];
  notizErfassen: (objektId: string, text: string) => void;
}

const SitzungsContext = createContext<Sitzung | null>(null);

export function SitzungsProvider({ children }: { children: React.ReactNode }) {
  const [mitarbeiterId, setMitarbeiterId] = useState("m5");
  const [aufgabenPatches, setAufgabenPatches] = useState<Record<string, AufgabenPatch>>({});
  const [signalErledigt, setSignalErledigt] = useState<Record<string, string>>({});
  const [notizen, setNotizen] = useState<SitzungsNotiz[]>([]);

  const wert = useMemo<Sitzung>(
    () => ({
      mitarbeiterId,
      setMitarbeiterId,
      aufgabenPatches,
      patchAufgabe: (id, patch) =>
        setAufgabenPatches((cur) => ({ ...cur, [id]: { ...cur[id], ...patch } })),
      resetAufgaben: () => setAufgabenPatches({}),
      signalErledigt,
      verarbeiteSignal: (id, hinweis) =>
        setSignalErledigt((cur) => ({ ...cur, [id]: hinweis })),
      notizen,
      notizErfassen: (objektId, text) =>
        setNotizen((cur) => [
          { id: `n${cur.length + 1}`, objektId, text, mitarbeiterId },
          ...cur,
        ]),
    }),
    [mitarbeiterId, aufgabenPatches, signalErledigt, notizen],
  );

  return <SitzungsContext.Provider value={wert}>{children}</SitzungsContext.Provider>;
}

export function useSitzung(): Sitzung {
  const ctx = useContext(SitzungsContext);
  if (!ctx) throw new Error("useSitzung nur innerhalb von SitzungsProvider verwenden");
  return ctx;
}
