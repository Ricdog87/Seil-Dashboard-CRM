"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Holt eine Live-Quelle und führt sie selbstständig nach, damit ein laufender
 * Datenraum-Lauf im Cockpit sichtbar wird, ohne dass jemand neu lädt.
 *
 * Pausiert, solange der Tab im Hintergrund liegt: ein offenes Cockpit auf einem
 * Nebenbildschirm soll den Server nicht dauerhaft befragen.
 */
export function useLive<T>(pfad: string, taktMs = 15000) {
  const [daten, setDaten] = useState<T | null>(null);
  const [abgerufen, setAbgerufen] = useState<Date | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const laufend = useRef(false);

  const holen = useCallback(async () => {
    if (laufend.current) return;
    laufend.current = true;
    setLaeuft(true);
    try {
      const r = await fetch(pfad, { cache: "no-store" });
      setDaten((await r.json()) as T);
      setAbgerufen(new Date());
    } catch {
      // Ein verpasster Takt ist kein Fehler: der naechste holt es nach.
    } finally {
      laufend.current = false;
      setLaeuft(false);
    }
  }, [pfad]);

  useEffect(() => {
    void holen();
    const takt = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") void holen();
    }, taktMs);
    const beiSichtbar = () => {
      if (document.visibilityState === "visible") void holen();
    };
    document.addEventListener("visibilitychange", beiSichtbar);
    return () => {
      clearInterval(takt);
      document.removeEventListener("visibilitychange", beiSichtbar);
    };
  }, [holen, taktMs]);

  return { daten, abgerufen, laeuft, holen };
}

/** "14:02:31" – kurz, ohne Datum, weil es immer heute ist. */
export function uhrzeit(d: Date | null): string {
  return d ? d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
}
