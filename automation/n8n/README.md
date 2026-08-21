# n8n-Workflows · SEIL Automatik-Kette (Skelette)

Sechs importierbare n8n-Workflows, 1:1 entlang der Automatik-Kette aus dem
Demo-Check vom 20.08. – das Ausführungs-Gegenstück zur Anzeige im Cockpit
(Vermarktungs-Screen). Gedacht für die n8n-Instanz auf dem Hostinger-Server
(„n8n Seil“).

| # | Workflow | Kettenglied | Trigger |
|---|---|---|---|
| 01 | Datenraum-Intake | Datenraum einlesen | Webhook `seil/datenraum` (Modul 01) |
| 02 | Matching | Matching – Standort zuerst | Webhook `seil/matching` |
| 03 | Mail-Vorbereitung | E-Mails vorbereiten (nur Entwürfe) | Webhook `seil/mail-vorbereitung` |
| 04 | Freigabe-Gate | Freigabe (Human-in-the-Loop) | Webhook `seil/freigabe` (Cockpit-Button) |
| 05 | Versand & Follow-up-Scheduler | Versand & Follow-ups | Webhook `seil/versand` + Cron 07:00 (Mo–Fr) |
| 06 | Antworterkennung | Antworterkennung | IMAP (Vertriebs-Postfach) |

## Import

n8n → Workflows → **Import from File** → JSON wählen. Reihenfolge egal.
Alle sechs sind bewusst **inaktiv** (`active: false`).

## Vor der Aktivierung – Pflicht

1. **Platzhalter ersetzen:** `https://N8N-BASIS-URL/...` in den
   HTTP-Request-Nodes durch die echte Webhook-Basis der Instanz;
   `vertrieb@BEISPIEL-DOMAIN.de` durch die echte Absenderadresse.
2. **Credentials nur im n8n-Credential-Store** anlegen (SMTP, IMAP,
   Superchat-API) – niemals in die Workflow-JSONs schreiben.
3. **Webhook-Absicherung:** Header-Auth/Secret zwischen Cockpit und den
   `seil/*`-Webhooks setzen (insbesondere `seil/freigabe`).
4. **Daten-Ablage anbinden:** Die `NoOp`-Nodes („Ablage …“, „Aufgabe …“)
   sind Platzhalter für die Cockpit-Datenbank, die mit der
   Modul-02-Umsetzung kommt; übergangsweise n8n Data Table oder Sheet.
5. **KI-Nodes einhängen:** In 03 (Textgenerierung) und 06 (Klassifikation)
   sitzt jeweils eine simple Fallback-Logik – produktiv gehört ein
   LLM-/Agent-Node davor, die Heuristik bleibt als Absicherung.
6. **Testlauf ausschließlich mit internen Adressen**, erst danach
   aktivieren. WF 05 ist der einzige Workflow, der etwas versendet – und
   prüft vor jedem Versand den Freigabe-Status (doppelter Boden zum
   Freigabe-Gate).

## Feste Regeln aus dem Demo-Check (bitte nicht aufweichen)

- **Die Freigabe ist der einzige manuelle Pflicht-Stopp** – ohne Aufruf von
  `seil/freigabe` startet kein Versand.
- **Matching-Reihenfolge:** Standort zuerst, dann Assetklasse, dann
  Ticket-Spanne. Kein voller Treffer = kein Ausschluss (Markierung
  „manuell pruefen“, Liste bleibt manuell erweiterbar).
- **Follow-ups:** alle 2 Tage, maximal 3 Stufen; Stufe 2 fragt aktiv nach
  aktuellen Zielregionen; nach Stufe 3 ohne Antwort nur noch eine manuelle
  Nachfass-Aufgabe.
- **WhatsApp nur über Superchat** (professionelle Lösung,
  datenschutzkonform) – keine privaten Accounts, keine direkte Meta-API.
- Antworten mit Regions-/Profilinformation erzeugen ein
  **Ankaufsprofil-Update** – Investorendaten leben im CRM, nicht in Excel.

## Anbindung Modul 01 (Datenraum-Automatik – echte Daten)

Modul 01 ist die erste echte Datenquelle der Kette. Ziel ist immer der
Webhook von WF 01:

```
POST https://N8N-BASIS-URL/webhook/seil/datenraum
Header: X-Seil-Secret: <gemeinsames Secret>
Body:
{
  "objektId": "…",              // oder objektName, solange es keine Cockpit-DB gibt
  "quelle": "modul01",
  "stand": "2026-08-21T12:00:00Z",
  "dokumente": [
    { "name": "Grundbuchauszug", "status": "vorhanden" },   // vorhanden | in_pruefung | ausstehend
    { "name": "Mieterliste",     "status": "ausstehend" }
  ],
  "kennwerte": [                 // optional: KI-ausgelesene Werte
    { "feld": "Mietflaeche", "wert": "8.310 m²", "quelle": "Mieterliste", "pruefstatus": "pruefen" }
  ]
}
```

Je nachdem, wie Modul 01 technisch gebaut ist, gibt es drei Andock-Varianten:

- **A – Modul 01 läuft selbst in n8n:** Am Ende des Modul-01-Workflows ein
  HTTP-Request- oder Execute-Workflow-Node auf WF 01 (kleinster Eingriff,
  bevorzugt).
- **B – Modul 01 schreibt in OneDrive/Ordnerstruktur:** In WF 01 den
  Webhook-Trigger durch einen OneDrive-Trigger ersetzen; die
  Normalisierung dahinter bleibt gleich.
- **C – Modul 01 liefert Exporte (Excel/CSV):** Vorgeschalteter
  Parser-Workflow, der den Export auf obigen Vertrag mappt.

Grundsätze: Der Klickdummy (dieses Repo) bleibt demo-only – echte
SEIL-Daten laufen ausschließlich durch die n8n-Instanz und landen nie im
Prototyp oder in diesem Repository. Feld-Mapping wird an EINEM
Beispiel-Export festgelegt, nicht am Gesamtbestand.

Die Workflows enthalten ausschließlich Struktur und Platzhalter –
keine echten Daten, keine Zugangsdaten.
