"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, UserCheck } from "lucide-react";
import { Badge, Button, Card, ICON_MD, ICON_STROKE, Select, Toast } from "@/components/ui";

export function ObjektAuswahl({
  optionen,
  aktivId,
}: {
  optionen: { id: string; name: string }[];
  aktivId: string;
}) {
  const router = useRouter();
  return (
    <Select
      label="Objekt"
      value={aktivId}
      onChange={(e) => router.push(`/vermarktung?objekt=${e.target.value}`)}
    >
      {optionen.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </Select>
  );
}

/**
 * Der einzige Human-in-the-Loop-Schritt der Vermarktung: Versand startet erst,
 * wenn ein Mitarbeiter die abgeglichene Investorenliste freigibt.
 * Der Klick ist im Prototyp eine reine UI-Demonstration ohne echte Aktion.
 */
export function FreigabeKarte({
  ausstehend,
  anzahlInvestoren,
  abgleichKriterien,
  freigegebenDurch,
  freigegebenAm,
}: {
  ausstehend: boolean;
  anzahlInvestoren: number;
  abgleichKriterien: string;
  freigegebenDurch?: string;
  freigegebenAm?: string;
}) {
  const [demoFreigegeben, setDemoFreigegeben] = useState(false);

  if (!ausstehend) {
    return (
      <Card className="mb-6 flex items-center gap-3 px-4 py-3">
        <CircleCheck
          size={ICON_MD}
          strokeWidth={ICON_STROKE}
          className="shrink-0 text-seil-success"
          aria-hidden
        />
        <p>
          <span className="text-seil-text">Investorenliste freigegeben</span>
          <span className="text-seil-muted">
            {" "}
            – am {freigegebenAm} durch {freigegebenDurch}. Versand und Follow-up laufen automatisch.
          </span>
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-6 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <UserCheck
            size={ICON_MD}
            strokeWidth={ICON_STROKE}
            className="mt-px shrink-0 text-seil-warning"
            aria-hidden
          />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-seil-text">
                Freigabe erforderlich: Versand an {anzahlInvestoren} Investoren
              </h2>
              <Badge tone="warning">Manueller Schritt</Badge>
            </div>
            <p className="mt-2 max-w-[70ch] text-seil-muted">
              Die Investorenliste wurde automatisch mit den Ankaufsprofilen abgeglichen (
              {abgleichKriterien}). Erst nach Freigabe durch einen Mitarbeiter startet der Versand
              als Presound-Mail an den BCC-Verteiler – danach übernimmt die Automatik Follow-ups
              (alle 2 Tage, max. 3 Stufen) und Antworterkennung.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {demoFreigegeben ? (
            <Toast tone="success" icon={CircleCheck}>
              Freigabe erfasst
            </Toast>
          ) : (
            <Button variant="primary" onClick={() => setDemoFreigegeben(true)}>
              Investorenliste freigeben
            </Button>
          )}
          <span className="text-kicker text-seil-muted">Prototyp – ohne echte Aktion</span>
        </div>
      </div>
    </Card>
  );
}
