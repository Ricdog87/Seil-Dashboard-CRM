"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  ClipboardList,
  Euro,
  FilePenLine,
  FileText,
  FolderOpen,
  Phone,
  RotateCcw,
  TriangleAlert,
  UserCheck,
} from "lucide-react";
import { faelligLabel, investorVon, objektVon, plusTage } from "@/lib/derive";
import { aufgaben, GF_ID, mitarbeiter } from "@/lib/mock-data";
import type { Aufgabe, AufgabenTyp } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  ICON_SM,
  ICON_STROKE,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  Tabs,
  TR,
  type Tone,
} from "@/components/ui";
import { EntityLink } from "@/components/cockpit";
import { AufgabenBoard } from "@/components/aufgaben-board";
import { useSitzung } from "@/components/sitzung";

const typMeta: Record<AufgabenTyp, { label: string; tone: Tone; icon: LucideIcon }> = {
  broker_call: { label: "Broker Call", tone: "accent", icon: Phone },
  preisanfrage: { label: "Preisanfrage", tone: "success", icon: Euro },
  freigabe: { label: "Freigabe", tone: "warning", icon: UserCheck },
  datenraum: { label: "Datenraum", tone: "neutral", icon: FolderOpen },
  unterlagen: { label: "Unterlagen", tone: "neutral", icon: FileText },
  nda: { label: "NDA", tone: "neutral", icon: FilePenLine },
  sonstiges: { label: "Aufgabe", tone: "neutral", icon: ClipboardList },
};

type Override = Partial<Pick<Aufgabe, "mitarbeiterId" | "faellig" | "erledigt">>;

/**
 * Aufgabenliste mit den im Kickoff gewünschten Eingriffen: Aufgaben lassen
 * sich neu zuweisen, verschieben und abhaken. Klickdummy: Änderungen leben
 * nur im Speicher dieser Sitzung – "Zurücksetzen" stellt den Stand wieder her.
 */
export function AufgabenListe() {
  // Geteilter Sitzungszustand: Abhaken auf der Übersicht und hier bleiben synchron.
  const { aufgabenPatches, patchAufgabe, resetAufgaben } = useSitzung();
  const [filterId, setFilterId] = useState<string>("alle");
  const [erledigteAnzeigen, setErledigteAnzeigen] = useState(false);
  const [ansicht, setAnsicht] = useState<string>("board");

  const patch = (id: string, o: Override) => patchAufgabe(id, o);

  const effektiv = useMemo(
    () => aufgaben.map((t) => ({ ...t, ...aufgabenPatches[t.id] })),
    [aufgabenPatches],
  );

  const zeilen = useMemo(() => {
    const gefiltert = effektiv.filter(
      (t) =>
        (filterId === "alle" || t.mitarbeiterId === filterId) && (erledigteAnzeigen || !t.erledigt),
    );
    return [...gefiltert].sort((a, b) => {
      if (a.erledigt !== b.erledigt) return a.erledigt ? 1 : -1;
      return a.faellig < b.faellig ? -1 : 1;
    });
  }, [effektiv, filterId, erledigteAnzeigen]);

  const offenJeMitarbeiter = (id: string) =>
    effektiv.filter((t) => t.mitarbeiterId === id && !t.erledigt).length;

  // Die GF-Rolle taucht hier nicht auf: Max trägt nichts ein und bekommt nichts zugewiesen.
  const operativesTeam = mitarbeiter.filter((m) => m.id !== GF_ID);

  const filter = [
    { id: "alle", label: "Alle", count: effektiv.filter((t) => !t.erledigt).length },
    ...operativesTeam.map((m) => ({ id: m.id, label: m.name, count: offenJeMitarbeiter(m.id) })),
  ];

  const geaendert = Object.keys(aufgabenPatches).length;

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <Tabs items={filter} activeId={filterId} onChange={setFilterId} label="Nach Mitarbeiter filtern" />
        <span className="inline-flex items-center gap-4">
          {geaendert > 0 ? (
            <Button icon={RotateCcw} onClick={resetAufgaben}>
              Zurücksetzen ({geaendert})
            </Button>
          ) : null}
          {ansicht === "liste" ? (
            <Checkbox
              label="Erledigte anzeigen"
              checked={erledigteAnzeigen}
              onChange={(e) => setErledigteAnzeigen(e.target.checked)}
            />
          ) : null}
          <Tabs
            label="Ansicht der Aufgaben"
            activeId={ansicht}
            onChange={setAnsicht}
            items={[
              { id: "board", label: "Board" },
              { id: "liste", label: "Liste" },
            ]}
          />
        </span>
      </div>
      <p className="mb-4 text-kicker text-seil-muted">
        {ansicht === "board"
          ? "Karten ziehen oder am Griff das Verschieben-Menü öffnen (fürs Handy): Spalte = neue Fälligkeit, „Erledigt“ hakt ab – Prototyp: Änderungen gelten nur in dieser Sitzung."
          : "Zuweisung und Fälligkeit lassen sich direkt in der Liste ändern – Prototyp: Änderungen gelten nur in dieser Sitzung."}
      </p>

      {ansicht === "board" ? (
        <AufgabenBoard filterId={filterId} />
      ) : (
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Fällig</TH>
              <TH>Aufgabe</TH>
              <TH>Typ</TH>
              <TH>Objekt</TH>
              <TH>Investor</TH>
              <TH>Zuständig</TH>
              <TH>
                <span className="sr-only">Aktionen</span>
              </TH>
            </TR>
          </THead>
          <TBody>
            {zeilen.map((t) => {
              const meta = typMeta[t.typ];
              const obj = t.objektId ? objektVon(t.objektId) : undefined;
              const inv = t.investorId ? investorVon(t.investorId) : undefined;
              const faellig = faelligLabel(t.faellig);
              const brokerCall = t.typ === "broker_call" && !t.erledigt;
              return (
                <TR key={t.id} highlight={brokerCall}>
                  <TD className="whitespace-nowrap">
                    {t.erledigt ? (
                      <span className="inline-flex items-center gap-1.5 text-seil-muted">
                        <Check size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden /> erledigt
                      </span>
                    ) : faellig.ton === "crit" ? (
                      <span className="inline-flex items-center gap-1.5 text-seil-danger">
                        <TriangleAlert size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
                        {faellig.text}
                      </span>
                    ) : faellig.ton === "warn" ? (
                      <span className="text-seil-warning">{faellig.text}</span>
                    ) : (
                      <span className="text-seil-body">{faellig.text}</span>
                    )}
                  </TD>
                  <TD className={t.erledigt ? "text-seil-muted" : "text-seil-text"}>{t.titel}</TD>
                  <TD>
                    <Badge tone={meta.tone} icon={meta.icon}>
                      {meta.label}
                    </Badge>
                  </TD>
                  <TD>
                    {obj ? (
                      <EntityLink href={`/objekte/${obj.id}`}>{obj.name}</EntityLink>
                    ) : (
                      <span className="text-seil-muted">–</span>
                    )}
                  </TD>
                  <TD>
                    {inv ? (
                      <EntityLink href={`/investoren/${inv.id}`}>{inv.firma}</EntityLink>
                    ) : (
                      <span className="text-seil-muted">–</span>
                    )}
                  </TD>
                  <TD>
                    <Select
                      aria-label={`Zuständig für: ${t.titel}`}
                      value={t.mitarbeiterId}
                      onChange={(e) => patch(t.id, { mitarbeiterId: e.target.value })}
                      disabled={t.erledigt}
                    >
                      {operativesTeam.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </Select>
                  </TD>
                  <TD className="whitespace-nowrap">
                    {t.erledigt ? (
                      <Button variant="ghost" onClick={() => patch(t.id, { erledigt: false })}>
                        Wieder öffnen
                      </Button>
                    ) : (
                      <span className="inline-flex gap-1.5">
                        <Button
                          variant="ghost"
                          aria-label={`„${t.titel}“ um 2 Tage verschieben`}
                          onClick={() => patch(t.id, { faellig: plusTage(t.faellig, 2) })}
                        >
                          +2 Tage
                        </Button>
                        <Button
                          variant="ghost"
                          aria-label={`„${t.titel}“ als erledigt markieren`}
                          onClick={() => patch(t.id, { erledigt: true })}
                        >
                          Erledigt
                        </Button>
                      </span>
                    )}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
      )}
    </>
  );
}
