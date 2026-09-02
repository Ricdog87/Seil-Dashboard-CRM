"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { FolderCheck, Radio, TriangleAlert } from "lucide-react";
import { objekte } from "@/lib/mock-data";
import { DEMO_STAND, fmtStand, verbindeObjekt, type Modul01Stand } from "@/lib/modul01";
import type { Objekt } from "@/lib/types";
import { Badge, ICON_SM, ICON_STROKE } from "@/components/ui";

/**
 * Modul 01 im Cockpit: ein Provider holt den Datenraum-Stand über die serverseitige Route,
 * alle Datenraum-Anzeigen ziehen ihn über `useObjektLive` / `useObjekteLive`. Ohne Anbindung
 * (Modus „demo“) sind die Objekte exakt die Demodaten – die Oberfläche ändert sich nicht.
 */
const Modul01Context = createContext<Modul01Stand>(DEMO_STAND);

export function Modul01Provider({
  children,
  intervallMs = 5 * 60_000,
}: {
  children: React.ReactNode;
  intervallMs?: number;
}) {
  const [stand, setStand] = useState<Modul01Stand>(DEMO_STAND);

  useEffect(() => {
    let aktiv = true;
    const laden = async () => {
      try {
        const r = await fetch("/api/modul01/status", { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as Modul01Stand;
        if (aktiv) setStand(d);
      } catch {
        // Route nicht erreichbar → Demo-Stand bleibt stehen.
      }
    };
    laden();
    const timer = setInterval(laden, intervallMs);
    return () => {
      aktiv = false;
      clearInterval(timer);
    };
  }, [intervallMs]);

  return <Modul01Context.Provider value={stand}>{children}</Modul01Context.Provider>;
}

export const useModul01 = () => useContext(Modul01Context);

/** Ein Objekt mit dem Live-Stand aus Modul 01 (falls verbunden und zugeordnet). */
export function useObjektLive(objekt: Objekt): Objekt {
  const stand = useModul01();
  return useMemo(() => verbindeObjekt(objekt, stand.objekte[objekt.id]), [objekt, stand]);
}

/** Alle Objekte, Datenraum jeweils mit Live-Stand überlagert. */
export function useObjekteLive(): Objekt[] {
  const stand = useModul01();
  return useMemo(() => objekte.map((o) => verbindeObjekt(o, stand.objekte[o.id])), [stand]);
}

/** Systemstatus-Zeile: sagt ehrlich, woher der Datenraum-Status kommt. */
export function Modul01Status() {
  const s = useModul01();
  if (s.modus === "live") {
    const anzahl = Object.keys(s.objekte).length;
    return (
      <p className="inline-flex items-center gap-2" data-modul01="live">
        <Radio size={ICON_SM} strokeWidth={ICON_STROKE} className="text-seil-success" aria-hidden />
        Modul 01: verbunden · Stand {fmtStand(s.stand ?? s.abgerufen)} · {anzahl}{" "}
        {anzahl === 1 ? "Datenraum" : "Datenräume"} live
        {s.unbekannt.length > 0 ? ` · ${s.unbekannt.length} ohne Mandat im Cockpit` : ""}
      </p>
    );
  }
  if (s.modus === "fehler") {
    return (
      <p className="inline-flex items-center gap-2" data-modul01="fehler">
        <TriangleAlert size={ICON_SM} strokeWidth={ICON_STROKE} className="text-seil-warning" aria-hidden />
        Modul 01: nicht erreichbar ({s.grund}) – Demo-Daten
      </p>
    );
  }
  return (
    <p className="inline-flex items-center gap-2" data-modul01="demo">
      <FolderCheck size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
      Modul 01: Demo-Daten – Live-Anbindung vorbereitet
    </p>
  );
}

/** Quelle des Datenraum-Status am Objekt – live aus Modul 01 oder Demodaten. */
export function DatenquelleBadge({ objekt }: { objekt: Objekt }) {
  return objekt.datenquelle === "modul01" ? (
    <Badge tone="success" icon={Radio}>
      Modul 01 · live
    </Badge>
  ) : (
    <Badge tone="info">Modul 01 · Demo</Badge>
  );
}
