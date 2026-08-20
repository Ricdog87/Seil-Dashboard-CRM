"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Aufgabe, Investor } from "@/lib/types";

/**
 * Sitzungszustand des Klickdummys – simuliert die Anmeldung und alle
 * Eingriffe, die im echten System in der Datenbank landen würden.
 * Alles lebt nur im Speicher dieser Sitzung; ein Reload stellt den
 * kuratierten Demostand wieder her.
 */

export type AufgabenPatch = Partial<Pick<Aufgabe, "mitarbeiterId" | "faellig" | "erledigt">>;

/** Ankaufsprofil-Pflege direkt im CRM (Demo-Check 20.08.) – statt externer Excel. */
export type ProfilPatch = Partial<Pick<Investor, "regionen" | "ticketMinMio" | "ticketMaxMio">>;

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
  profilPatches: Record<string, ProfilPatch>; // investorId → geänderte Profilfelder
  patchProfil: (investorId: string, patch: ProfilPatch) => void;
}

const SitzungsContext = createContext<Sitzung | null>(null);

export function SitzungsProvider({ children }: { children: React.ReactNode }) {
  const [mitarbeiterId, setMitarbeiterId] = useState("m5");
  const [aufgabenPatches, setAufgabenPatches] = useState<Record<string, AufgabenPatch>>({});
  const [signalErledigt, setSignalErledigt] = useState<Record<string, string>>({});
  const [notizen, setNotizen] = useState<SitzungsNotiz[]>([]);
  const [profilPatches, setProfilPatches] = useState<Record<string, ProfilPatch>>({});

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
      profilPatches,
      patchProfil: (investorId, patch) =>
        setProfilPatches((cur) => ({ ...cur, [investorId]: { ...cur[investorId], ...patch } })),
    }),
    [mitarbeiterId, aufgabenPatches, signalErledigt, notizen, profilPatches],
  );

  return <SitzungsContext.Provider value={wert}>{children}</SitzungsContext.Provider>;
}

export function useSitzung(): Sitzung {
  const ctx = useContext(SitzungsContext);
  if (!ctx) throw new Error("useSitzung nur innerhalb von SitzungsProvider verwenden");
  return ctx;
}
