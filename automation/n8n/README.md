# n8n-Workflows · SEIL Automatik-Kette (Skelette)

Neun importierbare n8n-Workflows: sechs bilden 1:1 die Automatik-Kette aus
dem Demo-Check vom 20.08. ab – das Ausführungs-Gegenstück zur Anzeige im
Cockpit (Vermarktungs-Screen) –, Workflow 07 flankiert sie mit dem täglichen
Statusbericht (Update-Call 28.08.), Workflow 08 koordiniert Besichtigungen
(Teilprozess aus dem Standardprozess Investorenkommunikation), Workflow 09
liefert den Datenraum-Stand aus Modul 01 an das Cockpit. Gedacht für die
n8n-Instanz auf dem SEIL-Server bei Hostinger (seit 28.10.2026, Konto SEIL). Modul 01
läuft noch auf dem älteren RSG-Server vom 03.08.; der Umzug ist offen (ANNAHMEN 59).

| # | Workflow | Kettenglied | Trigger |
|---|---|---|---|
| 01 | Lauf-Ende → Cockpit-Sync | Datenraum wird Mandat | Webhook `seil/datenraum` (Modul 01, nach jedem Lauf) |
| 02 | Matching | Matching – Standort zuerst | Webhook `seil/matching` |
| 03 | Mail-Vorbereitung | E-Mails vorbereiten (nur Entwürfe) | Webhook `seil/mail-vorbereitung` |
| 04 | Freigabe-Gate | Freigabe (Human-in-the-Loop) | Webhook `seil/freigabe` (Cockpit-Button) |
| 05 | Nachfass-Leiter (Follow-up) | Follow-ups (Standardprozess 15) | Cron 07:00 Mo–Fr (**aus**, bis SEIL freigibt) + Webhook `seil/followup-lauf` (Header-Auth); Altschnittstellen `seil/versand`, `seil/followup-planen` |
| 06 | Antworterkennung | Antworterkennung | IMAP (Vertriebs-Postfach) |
| 07 | Status-Bericht | – (flankierend: Reporting) | Cron 08:00 (Mo–Fr) |
| 08 | Besichtigungs-Koordination | – (Teilprozess aus WF 06) | Webhook `seil/besichtigung` (aus WF 06) |
| 09 | Datenraum-Status-API | – (Leseweg Modul 01 → Cockpit, WF 06) | Webhook GET `seil/datenraum-status` (Header-Auth) |

**Versandprinzip (Stand 02.11.2026):** Nach außen senden nur WF 05
(Nachfassmails) und WF 12 (Anschreiben aus dem Cockpit) – beide über dasselbe
Postfach, beide mit Demo-Umleitung und Bcc-Regel. WF 04/06/08 übergeben weiter
*Versandaufträge* an `seil/versand`; gesendet wird dort nur ein vollständiger
Auftrag (`email`, `betreff`, `text`), ein bloßer Vorlagen-Schlüssel wird
quittiert und nicht gesendet (Antwortvorlagen bearbeitet das Cockpit, kein
automatischer Antwortversand). `seil/followup-planen` ist nur noch eine
Quittung: den Follow-up-Stand führt das Cockpit (`POST /api/antwort` setzt die
Kette bei jeder Antwort zurück). WF 07 versendet ausschließlich den internen
Statusbericht.

## Import

n8n → Workflows → **Import from File** → JSON wählen. Reihenfolge egal.
Alle neun sind bewusst **inaktiv** (`active: false`). Die Skelette nutzen
Switch-Node 3.2, Set-Node 3.4 und Wait-Node 1.1 – eine aktuelle n8n-1.x-Version
voraussetzen.

## Vor der Aktivierung – Pflicht

1. **Keine Basis-URL mehr einzutragen:** Die Workflows rufen sich seit 29.10.
   intern über `http://localhost:5678/webhook/…` auf – unabhängig von Domain
   und Zertifikat. Von außen (Cockpit) kommen Aufrufe über Caddy mit echtem
   Zertifikat; siehe `deploy/UEBERGABE-VPS.md` im Repo `seil-doc-engine`.
   Die Absenderadresse ist gesetzt: `deals@seil.com`, das von der IT
   eingerichtete Sammelpostfach. WF 06 liest daraus, WF 05 sendet darüber,
   WF 08 legt die Besichtigungstermine in dessen Kalender.
2. **Credentials nur im n8n-Credential-Store** anlegen – drei Stück:
   `Microsoft Graph (SEIL)` (OAuth2, Client Credentials, Token-URL
   `https://login.microsoftonline.com/<TENANT>/oauth2/v2.0/token`, Scope
   `https://graph.microsoft.com/.default`) für Postfach, Kalender und Liveliste;
   `Anthropic (SEIL)` (Header Auth, `x-api-key`) für WF 03/06;
   `Seil Webhook Secret` (Header Auth, `X-Seil-Secret`) für die `seil/*`-Webhooks.
   Seit 29.10. läuft kein IMAP und kein SMTP mehr – alles über Graph aus
   `deals@seil.com`, begrenzt per Exchange-RBAC auf genau dieses Postfach.
3. **Webhook-Absicherung:** Header-Auth/Secret zwischen Cockpit und den
   `seil/*`-Webhooks setzen (insbesondere `seil/freigabe`).
4. **Daten-Ablage anbinden:** Die `NoOp`-Nodes („Ablage …“, „Aufgabe …“)
   sind Platzhalter für die Cockpit-Datenbank, die mit der
   Modul-02-Umsetzung kommt; übergangsweise n8n Data Table oder Sheet.
5. **KI-Nodes einhängen:** In 03 (Textgenerierung) und 06 (Klassifikation)
   sitzt jeweils eine simple Fallback-Logik – produktiv gehört ein
   LLM-/Agent-Node davor, die Heuristik bleibt als Absicherung.
6. **Konfiguration in WF 05 setzen** (Node „Betriebsart (hier umschalten)“,
   auf dem Server aus `/opt/seil/n8n-konfig.json`): `cockpitBasis`, `absender`,
   `demoEmpfaenger` (bleibt gesetzt bis zur Freigabe), `signaturHtml`,
   `rechtshinweisHtml`, `bccAdressen` (Kürzel → Adresse) und `bccStandard`
   (`ms,zustaendig`), `maxStufen` (4), `followupTage` (2), `maxProLauf` (40),
   `betreffVorlage`, `vorlagen` (Texte der Leiter, Stand lib/kommunikation.ts).
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
- **Matching-Datenbasis ist die Liveliste** (Sales-Update 28.09.): keine fest
  gespeicherten Ankaufsprofile, sondern die täglich gepflegte Investorenliste
  aus OneDrive samt der letzten Ankäufe je Investor. „Zuletzt Vergleichbares
  gekauft“ sortiert nur, es ersetzt kein Kriterium.
- **Freigabe erfolgt gesammelt:** WF 04 nimmt eine Liste von Entwürfen entgegen
  und teilt sie in einzeln protokollierte Versandaufträge. Ohne diesen Aufruf
  versendet WF 05 nichts – das Vier-Augen-Prinzip bleibt unverändert.
- **Follow-ups (WF 05, Stand 02.11.2026):** alle 2 Tage ohne Antwort, Leiter
  mit 4 Stufen (1. Follow Up · 2. Follow Up · weiteres im Wechsel · Final
  Follow up), nach einer Preisfrage genau eine Nachfrage. Fällig heißt: Stufe
  angeschrieben / interesse / nda_angefragt (oder preisanfrage), E-Mail
  vorhanden, letzter Kontakt ≥ 2 Tage, `followups` < 4, kein verschobenes
  `naechstesFollowUp`. Quelle ist das Cockpit (`GET /api/mandate`, `GET
  /api/kontakte?mandat=…`), nach dem Versand meldet WF 05 `POST /api/kontakte
  { nachgefasst: true }` – nur bei HTTP 202 vom Postfach.
- **WhatsApp nur über Superchat** (professionelle Lösung,
  datenschutzkonform) – keine privaten Accounts, keine direkte Meta-API.
- **Preisanfragen werden nie schriftlich beantwortet** (Standardprozess):
  Erstantwort-Vorlage, Aufgabe „Rückruf durch die Geschäftsführung“,
  Folge-Aufgabe „Gespräch stattgefunden?“; bei erneuter schriftlicher
  Preisanfrage die feste Vorlage „Auskunft nur telefonisch“.
- **Bcc-Regel (02.11.2026):** Kürzel → Adresse steht nur in
  `/opt/seil/n8n-konfig.json` (`bccAdressen`, z. B. `ms` = Geschäftsführung);
  `zustaendig` löst sich über `mandat.zustaendig` auf. WF 05 setzt
  `bccStandard` auf jede Nachfassmail, WF 12 nimmt `bcc` (Kürzel oder
  Adressen) im Auftrag entgegen. Mit Demo-Empfänger entfällt Bcc.
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

- **WF 05** – Stufenlogik der Leiter (1 · 2 · weiteres im Wechsel · Final),
  Preisfrage mit genau einer Nachfrage, Bcc-Regel über Kürzel; den Stand der
  Kette führt das Cockpit, `seil/followup-planen` quittiert nur noch.
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

**Vorlagentexte:** Die Texte der Nachfass-Leiter stehen in
`lib/kommunikation.ts` (`FOLLOWUP_LEITER`, das Cockpit zeigt sie) und als
`vorlagen` im Konfigurationsknoten von WF 05 – ohne Telefonnummern und ohne
Signatur. Signatur, Rechtshinweis, Telefonnummern und Bcc-Adressen stehen
ausschließlich in `/opt/seil/n8n-konfig.json` auf dem Server. Die Texte
lassen sich dort ebenfalls überschreiben (`vorlagen`), ohne Neuimport der
Workflow-Datei. (Ursprünglich war ein n8n-Data-Store vorgesehen; die
Data-Table-IDs sind je Instanz verschieden und per Import nicht reproduzierbar
zu binden – deshalb die Konfigurationsdatei.)

**Follow-up-Stufen – entschieden 02.11.2026:** `maxStufen = 4` (1. · 2. ·
weiteres · Final), wie `FOLLOWUP_LEITER` im Cockpit; nach einer Preisfrage
genau eine Nachfrage. Der Zeitplan von WF 05 bleibt ausgeschaltet, bis SEIL
den Echtversand freigibt; bis dahin Testläufe nur mit `demoEmpfaenger`.

## Anbindung Modul 01 (Datenraum-Automatik – echte Daten)

Stand 02.11.2026. Zwei Wege, beide mit demselben Header-Geheimnis:

```
Modul 01 ──POST seil/datenraum (nach jedem Lauf)──▶ WF 01 ──POST /api/modul01/sync──▶ Cockpit legt Mandat an
Cockpit  ──GET  /api/modul01/status ──▶ WF 09 ──▶ Läufe + Zählwerte aus der Modul-01-Datenbank
```

**Lauf-Ende (WF 01):** Die Engine ruft den Webhook mit
`{ lauf, objekt, status, fehler, quelle: "modul01", zeitpunkt, kennwerte }` auf — keine
Dokumentinhalte. WF 01 stößt im Cockpit `POST /api/modul01/sync` an; das Cockpit
liest die Läufe über WF 09, legt für jeden echten Datenraum ein Mandat an
(Name = Laufname ohne Zeitstempel, Phase Vorbereitung) und antwortet
`{ ok, angelegt, uebersprungen, abgleiche }`. Test- und Demoläufe (`TEST-…`,
`DEMO-…`) stehen unter `uebersprungen`. Einrichtung auf der Engine-Seite:
`LAUF_ENDE_WEBHOOK_URL` / `LAUF_ENDE_WEBHOOK_SECRET` (seil-doc-engine,
`deploy/BETRIEB.md`).

**Leseweg (WF 09):** `GET seil/datenraum-status` liefert Läufe und Zählwerte
(verarbeitet, abgelegt, in Prüfung, Dubletten) je Objekt; die Cockpit-Route
`/api/modul01/status` ruft ihn serverseitig ab.

**Stammdaten (WF 01, seit 02.11.2026):** `kennwerte` enthält nur die Werte, die
mehrere Dokumente des Laufs übereinstimmend nennen (`plz`, `ort`, `strasse`,
`nutzung`; „sicher“-Regel der Engine: ≥ 3 Dokumente und ≥ 60 % Übereinstimmung).
WF 01 übersetzt sie in die Mandatsfelder — Ort → `stadt`, Ort → `region`
(Bundesland) über die Tabelle `stadtBundesland`, Nutzung → `assetklasse` über
`nutzungAssetklasse` — und schreibt sie mit `POST /api/mandate` **nur in leere
Felder** des Mandats. Beide Tabellen stehen im Knoten „Cockpit (hier anpassen)“
und kommen auf dem Server aus `/opt/seil/n8n-konfig.json` (Startbestand in
`konfig.beispiel.json`: 251 Städte; `nutzungAssetklasse` nur `wohnen → Wohnen`,
weil „gewerbe“ und „gemischt“ im Liveliste-Vokabular — Büro, Einzelhandel,
Logistik … — nicht eindeutig sind: Eintrag erst nach Freigabe durch SEIL).
Unbekannte Stadt oder Nutzung → Feld bleibt leer. Keine Stammdaten bei
Testläufen, fehlgeschlagenen Läufen oder wenn das Mandat im Cockpit fehlt.
Kaufpreis, Ziele und Freigaben schreibt die Automatik nie (Grundregel 3).
Die Antwort an die Engine enthält `stammdaten: { ok, geschrieben, abgleich, fehler | grund }`.

Der frühere Skelett-Vertrag dieses Abschnitts (Ablage `datenraum_status`,
Checkliste, Kennwerte, Deal anlegen in WF 01) ist damit überholt: Matching und
Abgleich macht das Cockpit selbst, den Stand liest es über WF 09.

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

## Umbau 29.10. – was verdrahtet ist, was Platzhalter bleibt

| WF | Verdrahtet | Platzhalter (noOp) bis die Data Tables stehen |
|---|---|---|
| 02 | Liveliste aus SharePoint über Graph `workbook/usedRange`, Spaltenzuordnung im Konfigurationsknoten | Verteiler-Vorschlag ablegen |
| 03 | Claude über `POST /v1/messages` (Vorlage als Leitplanke, Fallback auf Vorlagenfüllung), Freigabe-Anforderung an WF 04 | Entwurf ablegen |
| 04 | Zweiter Eingang `seil/freigabe-anfordern`: Freigabe-Mail mit zwei Links, Wait bis 7 Tage, Ergebnis in dieselbe Sammelfreigabe | Audit-Ablage |
| 05 | Versand über Graph `sendMail` aus deals@, BCC Leitung | Kontakte laden, Protokoll, Freigabe-Nachprüfung |
| 06 | Alle 2 Minuten ungelesene Mails aus deals@ über Graph, als gelesen markieren, vereinzeln | Signale/Aufgaben im Cockpit, Profil-Update |
| 08 | Kalendereintrag über Graph `events` im Kalender von deals@ | Nachfass-Aufgabe |

Die Platzhalter werden an fünf n8n Data Tables gehängt (`kontakte`, `entwuerfe`,
`freigaben`, `versand`, `datenraum_status`); Spalten siehe
`docs/SEIL-Anbindung-Donnerstag.pdf`, Teil 3. Die Tabellen-IDs entstehen erst beim
Anlegen in der Oberfläche, deshalb sind die Knoten nicht vorab verdrahtet.

