"use client";

import { useState } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { fmtTicket } from "@/lib/derive";
import type { Investor } from "@/lib/types";
import { Badge, Button, Card, CardHeader, ICON_SM, ICON_STROKE, Input } from "@/components/ui";
import { Kicker } from "@/components/cockpit";
import { useSitzung } from "./sitzung";

/**
 * Ankaufsprofil direkt im CRM pflegen – Beschluss aus dem Demo-Check (20.08.):
 * keine externen Excel-Tabellen mehr. Zielregionen und Ticket sind editierbar
 * (Prototyp: nur diese Sitzung); das Matching in der Vermarktung zieht live mit.
 */
export function AnkaufsprofilKarte({ investor }: { investor: Investor }) {
  const { profilPatches, patchProfil } = useSitzung();
  const effektiv = { ...investor, ...profilPatches[investor.id] };
  const [bearbeiten, setBearbeiten] = useState(false);
  const [neueRegion, setNeueRegion] = useState("");
  const geaendert = !!profilPatches[investor.id];

  const regionEntfernen = (r: string) =>
    patchProfil(investor.id, { regionen: effektiv.regionen.filter((x) => x !== r) });

  const regionHinzu = () => {
    const r = neueRegion.trim();
    if (!r || effektiv.regionen.includes(r)) return;
    patchProfil(investor.id, { regionen: [...effektiv.regionen, r] });
    setNeueRegion("");
  };

  const ticketSetzen = (feld: "ticketMinMio" | "ticketMaxMio", roh: string) => {
    // Leeres Feld (auch der Zwischenzustand beim Neu-Tippen) darf nicht als 0 landen.
    if (roh.trim() === "") return;
    const wert = Number(roh);
    if (!Number.isFinite(wert) || wert < 0) return;
    patchProfil(investor.id, { [feld]: wert });
  };

  return (
    <Card>
      <CardHeader
        title="Ankaufsprofil"
        meta={
          <span className="inline-flex items-center gap-3">
            <span>Buy-Side</span>
            <Button
              variant="ghost"
              icon={bearbeiten ? Check : Pencil}
              onClick={() => setBearbeiten((b) => !b)}
            >
              {bearbeiten ? "Fertig" : "Bearbeiten"}
            </Button>
          </span>
        }
      />
      <dl className="flex flex-col gap-4 px-4 py-4">
        <div>
          <dt>
            <Kicker>Ticketgröße</Kicker>
          </dt>
          <dd className="mt-1 text-seil-text">
            {bearbeiten ? (
              <span className="inline-flex items-center gap-2">
                <Input
                  type="number"
                  value={effektiv.ticketMinMio}
                  aria-label="Ticket von (Mio. Euro)"
                  className="w-20"
                  onChange={(e) => ticketSetzen("ticketMinMio", e.target.value)}
                />
                <span className="text-seil-muted">–</span>
                <Input
                  type="number"
                  value={effektiv.ticketMaxMio}
                  aria-label="Ticket bis (Mio. Euro)"
                  className="w-20"
                  onChange={(e) => ticketSetzen("ticketMaxMio", e.target.value)}
                />
                <span className="text-seil-muted">Mio. €</span>
              </span>
            ) : (
              fmtTicket(effektiv.ticketMinMio, effektiv.ticketMaxMio)
            )}
          </dd>
        </div>
        <div>
          <dt>
            <Kicker>Assetklassen</Kicker>
          </dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {effektiv.assetklassen.map((a) => (
              <Badge key={a} tone="neutral">
                {a}
              </Badge>
            ))}
          </dd>
        </div>
        <div>
          <dt>
            <Kicker>Zielregionen</Kicker>
          </dt>
          <dd className="mt-2 flex flex-wrap items-center gap-1.5">
            {effektiv.regionen.map((r) =>
              bearbeiten ? (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 rounded-seil border border-seil-line bg-seil-card-alt px-2 py-0.5 text-kicker text-seil-body"
                >
                  {r}
                  <button
                    type="button"
                    aria-label={`Zielregion ${r} entfernen`}
                    onClick={() => regionEntfernen(r)}
                    // -m-1/p-1: Trefferfläche ~24px, ohne das Chip-Layout zu vergrößern.
                    className="-m-1 rounded-seil p-1 text-seil-muted transition-colors hover:text-seil-text"
                  >
                    <X size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
                  </button>
                </span>
              ) : (
                <Badge key={r} tone="neutral">
                  {r}
                </Badge>
              ),
            )}
            {bearbeiten ? (
              <form
                className="inline-flex items-center gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  regionHinzu();
                }}
              >
                <Input
                  value={neueRegion}
                  placeholder="Region ergänzen …"
                  aria-label="Neue Zielregion"
                  className="w-40"
                  onChange={(e) => setNeueRegion(e.target.value)}
                />
                <Button type="submit" icon={Plus} disabled={!neueRegion.trim()}>
                  <span className="sr-only">Zielregion hinzufügen</span>
                </Button>
              </form>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>
            <Kicker>Kontakt</Kicker>
          </dt>
          <dd className="mt-1 text-seil-body">
            {investor.telefon}
            <br />
            {investor.email}
          </dd>
        </div>
        {investor.notiz ? (
          <div>
            <dt>
              <Kicker>Notiz</Kicker>
            </dt>
            <dd className="mt-1 text-seil-body">{investor.notiz}</dd>
          </div>
        ) : null}
        {investor.quelle ? (
          <div>
            <dt>
              <Kicker>Quelle</Kicker>
            </dt>
            <dd className="mt-2">
              <Badge tone="neutral">{investor.quelle}</Badge>
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="border-t border-seil-line px-4 py-2 text-kicker text-seil-muted">
        Direkt im CRM gepflegt – keine externe Excel (Demo-Check 20.08.). Follow-up Stufe 2 fragt
        Zielregionen automatisch ab; das Matching in der Vermarktung zieht sofort mit.
        {geaendert ? " Prototyp: Änderungen gelten nur in dieser Sitzung." : ""}
      </p>
    </Card>
  );
}
