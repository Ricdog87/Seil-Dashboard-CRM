# n8n-Workflows · SEIL Automatik-Kette (Skelette)

Neun importierbare n8n-Workflows: sechs bilden 1:1 die Automatik-Kette aus
dem Demo-Check vom 20.08. ab – das Ausführungs-Gegenstück zur Anzeige im
Cockpit (Vermarktungs-Screen) –, Workflow 07 flankiert sie mit dem täglichen
Statusbericht (Update-Call 28.08.), Workflow 08 koordiniert Besichtigungen
(Teilprozess aus dem Standardprozess Investorenkommunikation), Workflow 09
liefert den Datenraum-Stand aus Modul 01 an das Cockpit. Gedacht für die
n8n-Instanz auf dem Hostinger-Server („n8n Seil“), auf der Modul 01 bereits läuft.

| # | Workflow | Kettenglied | Trigger |
|---|---|---|---|
| 01 | Datenraum-Intake | Datenraum einlesen | Webhook `seil/datenraum` (Modul 01) |
| 02 | Matching | Matching – Standort zuerst | Webhook `seil/matching` |
| 03 | Mail-Vorbereitung | E-Mails vorbereiten (nur Entwürfe) | Webhook `seil/mail-vorbereitung` |
| 04 | Freigabe-Gate | Freigabe (Human-in-the-Loop) | Webhook `seil/freigabe` (Cockpit-Button) |
| 05 | Versand & Follow-up-Scheduler | Versand & Follow-ups | Webhook `seil/versand` + Cron 07:00 (Mo–Fr) |
| 06 | Antworterkennung | Antworterkennung | IMAP (Vertriebs-Postfach) |
| 07 | Status-Bericht | – (flankierend: Reporting) | Cron 08:00 (Mo–Fr) |
| 08 | Besichtigungs-Koordination | – (Teilprozess aus WF 06) | Webhook `seil/besichtigung` (aus WF 06) |
| 09 | Datenraum-Status-API | – (Leseweg Modul 01 → Cockpit, WF 06) | Webhook GET `seil/datenraum-status` (Header-Auth) |

**Versandprinzip:** WF 05 ist der einzige Punkt, an dem E-Mails oder
WhatsApp-Nachrichten an Investoren und Verkäuferseite hinausgehen. WF 06 und
WF 08 versenden selbst nichts, sondern übergeben *Versandaufträge* mit
Vorlagen-Schlüssel an `seil/versand`; WF 06 startet über `seil/followup-planen`
die Follow-up-Kette neu. Dadurch sitzen Freigabe-Prüfung, BCC-Regel und
Protokoll an genau einer Stelle. WF 07 versendet ausschließlich den internen
Statusbericht.

## Import

n8n → Workflows → **Import from File** → JSON wählen. Reihenfolge egal.
Alle neun sind bewusst **inaktiv** (`active: false`). Die Skelette nutzen
Switch-Node 3.2, Set-Node 3.4 und Wait-Node 1.1 – eine aktuelle n8n-1.x-Version
voraussetzen.

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
6. **Konfiguration in WF 05 setzen** (Node „Konfiguration (hier anpassen)“):
   `bccLeitung` (Leitung Vertrieb im BCC jeder ausgehenden Mail),
   `antwortenAutomatisch` (Standard-Antworten ohne Klick versenden oder als
   Entwurf zur Bestätigung ablegen – Workshop-Schalter), `maxStufen`
   (Voreinstellung 3), `whatsappAktiv`.
7. **Testlauf ausschließlich mit internen Adressen**, erst danach
   aktivieren. WF 05 ist der einzige Workflow, der an Investoren versendet –
   auch die Antwort-Vorlagen aus WF 06 und die Besichtigungs-Mails aus WF 08
   laufen als Versandaufträge durch ihn – und prüft vor jedem Versand den
   Freigabe-Status (doppelter Boden zum Freigabe-Gate).

## Feste Regeln aus dem Demo-Check (bitte nicht aufweichen)

- **Die Freigabe ist der einzige manuelle Pflicht-Stopp** – ohne Aufruf von
  `seil/freigabe` startet kein Versand.
- **Matching-Reihenfolge:** Standort zuerst, dann Assetklasse, dann
  Ticket-Spanne. Kein voller Treffer = kein Ausschluss (Markierung
  „manuell pruefen“, Liste bleibt manuell erweiterbar).
- **Follow-ups:** alle 2 Tage; Stufe 1 und 2 mit festen Vorlagen, Stufe 2
  fragt aktiv nach aktuellen Zielregionen; weitere Stufen mit zwei
  alternierenden Vorlagen; die letzte Stufe ist eine Final-Mail, danach nur
  noch eine manuelle Nachfass-Aufgabe. Voreinstellung: maximal 3 Stufen
  (Angebot/Demo-Check) – siehe Workshop-Frage unten.
- **WhatsApp nur über Superchat** (professionelle Lösung,
  datenschutzkonform) – keine privaten Accounts, keine direkte Meta-API.
- **Preisanfragen werden nie schriftlich beantwortet** (Standardprozess):
  Erstantwort-Vorlage, Aufgabe „Rückruf durch die Geschäftsführung“,
  Folge-Aufgabe „Gespräch stattgefunden?“; bei erneuter schriftlicher
  Preisanfrage die feste Vorlage „Auskunft nur telefonisch“.
- **Leitung Vertrieb im BCC** jeder ausgehenden Mail – zentraler Parameter
  in WF 05, nicht je Workflow.
- Antworten mit Regions-/Profilinformation erzeugen ein
  **Ankaufsprofil-Update** – Investorendaten leben im CRM, nicht in Excel.

## Unterlagen vom 31.08. – Prozess-Flowchart & Standardprozess Investorenkommunikation

Am 31.08. hat SEIL zwei Dokumente geliefert. Beide sind eingearbeitet –
**nur die Struktur**, keine Vorlagentexte, Namen oder Adressen (die bleiben
bewusst außerhalb dieses Repositorys, siehe unten).

**1. Transaktionsprozess-Flowchart – der zu autorisierende Prozess.**
Das Flowchart ist die Referenz, gegen die SEIL die Automatik-Kette
freigeben soll („Workflow autorisieren“). Abgleich mit unserem Modell:

- Die Kette deckt den Flowchart-Ablauf bis zum Broker Call ab (dort endet
  das Chart); Datenraum → Matching → Mailversand → Antwort → Broker Call
  entsprechen WF 01–06.
- **Neu aus dem Flowchart – Call-Center-Rolle:** Vor dem Broker Call sitzt
  ein telefonischer Erstkontakt durch ein Call-Center (Standardfragen),
  eröffnet durch ein Kickoff-Briefing (Teams-Termin). In der Kette bislang
  nicht abgebildet → Kandidat für ein eigenes Glied bzw. eine
  Aufgaben-Route in WF 06 (Workshop-Thema).
- **Aktivitäten-Logging:** Das Flowchart protokolliert Aktivitäten im
  bisherigen CRM. Das Cockpit übernimmt das (Aktivitäten-Historie ist im
  Prototyp bereits angelegt); in n8n schreiben die Ablage-Nodes später in
  dieselbe Historie.
- Am Matching-Schritt steht im Flowchart eine offene „Excel?“-Anmerkung –
  genau die Lücke, die Ankaufsprofile im CRM + WF 02 schließen.

**2. Standardprozess Investorenkommunikation (Entscheidungstabelle).**
Die Struktur steckt Zeile für Zeile in den Workflows:

- **WF 05** – Stufenlogik (zwei feste Vorlagen, danach alternierend,
  Abschluss mit Final-Mail), Leitung im BCC als zentraler Parameter,
  Webhook `seil/followup-planen` für den Neustart der Kette.
- **WF 06** – Routing: Anfrage → Antwort + Follow-up neu (2 Tage) + Broker
  Call; Absage → Kriterien-Rückfrage + Follow-up neu (2 Tage); Kriterien
  erhalten → Übergabe + Termin; Preisanfrage → Mini-Sequenz (Erstantwort,
  Rückruf GF, Folge-Aufgabe „Gespräch stattgefunden?“, bei Wiederholung feste
  Vorlage „nur telefonisch“); Unterlagen-Anfrage mit drei Unterfällen nach
  Datenraum-Abgleich; Telefonwunsch → Geschäftsführung; Besichtigung → WF 08.
  Jede Route setzt nur Parameter (Vorlage, Follow-up neu?, Aufgabe?), ein
  generischer Ausführer übergibt an WF 05.
- **WF 08** – Besichtigungs-Koordination in vier Schritten: Bestätigung an
  den Investor, Anfrage an die Verkäuferseite, Warten auf deren Antwort
  (Wait-Node, Zeitlimit 3 Tage), Terminbestätigung + Kalendereintrag im
  zentralen Vertriebskalender nach Titelkonvention, Teammitglied einladen.

**Technische Härtung (01.09.):** Switch-Nodes auf Version 3.2 (dynamische
Ausgänge – Version 1 hatte fest vier), Code-Nodes verarbeiten alle Items eines
Laufs (IMAP-Stapel, fällige Kontakte), Send-Email-Parameter korrigiert (BCC
unter `options`, HTML-Format explizit).

**Vorlagentexte bleiben draußen:** Die Mail-Vorlagen aus dem
Standardprozess-Dokument werden beim Setup als Einträge im
n8n-Data-Store hinterlegt (Quelle: das SEIL-Dokument selbst) – sie
gehören nicht in dieses Repository und nicht in die Workflow-JSONs.

**⚠ Workshop-Frage – Follow-up-Stufen:** Angebot und Demo-Check sagen
„alle 2 Tage, maximal 3 Stufen“; das Standardprozess-Dokument beschreibt
eine offene Follow-up-Kette mit abschließender Final-Mail. WF 05 ist auf
`maxStufen = 3` voreingestellt und pro Kampagne überschreibbar – die
verbindliche Regel legt der Workshop fest.

## Anbindung Modul 01 (Datenraum-Automatik – echte Daten)

Modul 01 ist die erste echte Datenquelle der Kette – und seit 01.09. auch die
erste echte Datenquelle des Cockpits. Das Prinzip ist bewusst einfach:
**Modul 01 schreibt (WF 01), das Cockpit liest (WF 09)** – ein Schreibweg,
ein Leseweg, eine Ablage (`datenraum_status`, eine Zeile je Objekt).

```
Modul 01 ──POST seil/datenraum──▶ WF 01 ──▶ Ablage datenraum_status ◀──GET seil/datenraum-status── WF 09
                                  │  (upsert je Objekt)                        ▲              ▲
                                  └─ Objekt unbekannt → Deal anlegen      Cockpit-Route     WF 06
                                     (Nino, 28.08.: „Create data room     /api/modul01/    Datenraum-
                                      → Deal im CRM“)                     status (Server)  Abgleich
```

**Schreibweg – Vertrag an WF 01** (Header-Auth-Credential am Webhook, Header
`X-Seil-Secret`, Wert nur im Credential-Store):

```
POST https://N8N-BASIS-URL/webhook/seil/datenraum
Header: X-Seil-Secret: <gemeinsames Secret>
Body:
{
  "objektId": "…",              // Kennung im Cockpit; fehlt sie → neuer Datenraum (Create deal)
  "objektName": "…",            // Anzeigename, Fallback für die Zuordnung
  "quelle": "modul01",
  "stand": "2026-08-21T12:00:00Z",
  "objekt": {                   // nur bei neuem Datenraum: legt den Deal im Cockpit an
    "name": "…", "adresse": "…", "stadt": "…", "assetklasse": "…", "flaeche": "…", "kaufpreisMio": 0
  },
  "dokumente": [
    { "name": "Grundbuchauszug", "status": "vorhanden" },   // vorhanden | in_pruefung | ausstehend (tolerant: ok/done/review/fehlt …)
    { "name": "Mieterliste",     "status": "ausstehend" }
  ],
  "kennwerte": [                 // optional: KI-ausgelesene Werte – Übernahme bleibt Human-in-the-Loop
    { "feld": "Mietflaeche", "wert": "8.310 m²", "quelle": "Mieterliste", "pruefstatus": "pruefen" }
  ],
  "freigaben": [                 // optional, Workshop-Thema Datenraum-Freigaben: wer hat wann Zugang bekommen
    { "investorEmail": "…", "freigegebenAm": "2026-08-22T09:00:00Z" }
  ]
}
```

**Leseweg – Antwort von WF 09** (`GET seil/datenraum-status?objektId=…`,
Header-Auth wie oben; ohne `objektId` alle Objekte):

```
{ "stand": "<ISO>", "objekte": [ { "objektId", "objektName", "stand", "dokumente": [...], "kennwerte": [...], "freigaben": [...] } ] }
```

**Cockpit-Seite:** Die Next.js-Route `/api/modul01/status` ruft WF 09
serverseitig ab (URL und Secret nur in der Server-Umgebung, siehe
`.env.example`), ordnet die Datenräume über `MODUL01_OBJEKT_MAP` den
Cockpit-Objekten zu und liefert dem Browser nur den normalisierten Stand. Ohne
Konfiguration antwortet sie mit `modus: "demo"` – das Cockpit zeigt dann
unverändert die Demodaten, sichtbar gekennzeichnet. Live überlagert werden
ausschließlich Datenraum-Checkliste und KI-Kennwerte; Datenräume ohne Mandat
im Cockpit werden gezählt („ohne Mandat“) – produktiv legt WF 01 dafür den
Deal an. Kein Schreibweg vom Cockpit nach Modul 01.

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

## Betriebsmodell (Beschluss 25.08., präzisiert im Update-Call 28.08.)

- **Server gehört SEIL – Migration beschlossen:** Die n8n-Instanz läuft
  derzeit noch auf RSG-Infrastruktur und wird zeitnah in die Domain der
  SEIL Group übertragen (Konsens aus dem Update-Call). Datenhoheit und
  Kosten liegen damit beim Kunden; RSG arbeitet als Dienstleister mit
  eigenem n8n-Nutzer + n8n-API-Key (Auftragsverarbeitungsvertrag
  SEIL ↔ RSG schließen).
- **Voraussetzung für den Live-Gang:** Zugang zu Office 365 (Maildomain,
  IMAP) der SEIL Group. Der entsteht mit der Entkopplung vom bisherigen
  IT-Dienstleister durch den neuen Dienstleister (3-Monats-Testphase);
  die Tenant-Migration hat laut Geschäftsführung oberste Priorität. Bis
  dahin bewusst keine Testläufe mit Demodaten (doppelte Arbeit, unnötige
  Kosten – Konsens im Call).
- **Workshop nach Live-Gang:** Feinabstimmung der Kette am echten Prozess.
  Bereits benannte Erweiterungspunkte: **NDA-Handling**,
  **Datenraum-Freigaben**, **Broker-Benachrichtigungen** und die
  **Call-Center-Rolle aus dem Flowchart** als eigene Glieder bzw.
  Verfeinerungen von WF 05/06. Input liegt seit 31.08. vor:
  Transaktionsprozess-Flowchart und Standardprozess
  Investorenkommunikation (siehe Abschnitt oben); offen ist nur noch die
  Reporting-Vorlage.
- **Reporting-Anbindung:** Der Statusbericht ist als HTML-Produkt
  definiert – im Cockpit als Export-Button umgesetzt („Bericht exportieren
  (HTML)“); produktiv erzeugt und versendet ihn **WF 07** werktäglich
  08:00 an Geschäftsführung + Leitung Vertrieb. Sobald SEIL die eigene
  Reporting-Vorlage nachliefert, wird das Layout im Code-Node angeglichen.
- **Claude-API-Key gehört SEIL:** SEIL legt ein eigenes Konto in der
  Anthropic Console an (empfohlen: eigener Workspace „SEIL Cockpit“ mit
  monatlichem Budget-Limit als Kostenairbag) und erzeugt dort den API-Key.
  Der Key wird **ausschließlich im n8n-Credential-Store** hinterlegt –
  nie in Workflow-JSONs, nie bei RSG.
- **Modell:** Standard für alle KI-Nodes ist `claude-opus-5`
  (Mail-/Teaser-Entwürfe, Zielregionen-Extraktion, Klassifikation der
  Antworterkennung). Aufruf: `POST https://api.anthropic.com/v1/messages`
  mit Header `x-api-key` aus dem Credential-Store und
  `anthropic-version: 2023-06-01`. Die Mengen sind klein (Klassifikation
  ≈ Bruchteile von Cents, Entwurf ≈ wenige Cents) – ein Modellwechsel auf
  günstigere Stufen ist eine reine Kostenentscheidung von SEIL/RSG, kein
  technisches Muss.
- **Reihenfolge zur Modul-2-Anbindung:** (1) SEIL-VPS + n8n,
  (2) Workflows importieren + Claude-Key als Credential,
  (3) Modul 01 andocken (Daten-Vertrag oben) und den Leseweg ins Cockpit
  scharf schalten (WF 09 aktivieren, `MODUL01_*` in der Cockpit-Umgebung
  setzen – ab dann zeigt das Cockpit echte Datenraum-Stände, der Rest bleibt
  Demo), (4) Produktivbasis des Cockpits (Datenbank + Login) – erst danach
  (5) die Cockpit-Webhooks (`seil/freigabe` u. a.). Bis (4) arbeitet n8n
  eigenständig (Data Tables als Ablage).

Die Workflows enthalten ausschließlich Struktur und Platzhalter –
keine echten Daten, keine Zugangsdaten.
