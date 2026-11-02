# Zielbild 09.11.2026 — Umsetzung des SEIL-Termins vom 02.11.2026

Stand 02.11.2026, abends. Ergebnis des Termins mit Luca und Nino: Fokus bleibt Modul 01
und Modul 02 im Standardprozess; Philipp-Thema (API/Dashboard Dritter) ausgeklammert;
zusätzliche Anbindungen erst nach dem Kernprojekt. **Zusage: Dashboard und Automatismus
bis Montag, 09.11.2026** (Ricardo). Danach Review-Call.

Dieses Dokument teilt die Punkte in zwei Spuren: **Automatik** (Engine, n8n, APIs —
diese Session) und **Cockpit-Oberfläche** (Modul 02 — Cockpit-Session). Jede Zeile
nennt, was schon da ist, was fehlt und woran „fertig“ gemessen wird. Keine Geheimnisse,
keine Kundendaten.

## 1. Sofort umgesetzt (02.11., Automatik)

| Punkt aus dem Termin | Umsetzung | Nachweis |
|---|---|---|
| Abwesenheitsmails dürfen nicht als Antwort zählen | WF 06 erkennt Betreff-Präfixe (Automatische Antwort, Out of office, Unzustellbar …), Systemabsender und kurze Abwesenheitstexte; solche Mails gehen **nicht** ans Cockpit, kein Stufen-/Follow-up-Reset, keine Aufgabe, nur Protokoll | `automation/n8n/06-antworterkennung.json` (Knoten „Automatische Antwort?“), Offline-Test 6 Fälle |
| Assetklassen: max. 5 Kategorien, KI schlägt vor, Mensch gibt frei | Engine liest je Dokument `objektart` in SEILs Klassen (Mehrfamilienhaus, Wohn- und Geschäftshaus, Wohnanlage, Grundstück, Ausnahme) und zählt je Lauf zusammen; WF 01 setzt die Assetklasse **nicht mehr automatisch**; WF 09 liefert sie als „Assetklasse (Vorschlag)“ mit Status `pruefen` | seil-doc-engine `src/pipeline/kennwerte.ts`, WF 09 „Läufe → Cockpit-Zeilen“ |
| Projektseite: Key Facts (Jahresnettokaltmiete, Einheiten, Fläche) | Engine liest sie aus Mieterlisten/Flächenaufstellungen/Exposés (nur Angaben für das ganze Objekt) und liefert sie als Vorschläge mit Stimmen und Quellkategorie; Objektadresse „sicher“ ab 3 übereinstimmenden Dokumenten | WF 09 Kennwerte `Einheiten (Vorschlag)`, `Fläche (Vorschlag)`, `Jahresnettokaltmiete (Vorschlag)`, `Objektadresse` |
| Follow-ups automatisch | WF 05 Nachfass-Leiter (4 Stufen, Preisfrage 1×) läuft gegen das Cockpit; Zeitplan aus bis Freigabe durch SEIL; demoEmpfaenger gesetzt | Testlauf 02.11.: 1 fällig, HTTP 202, Cockpit `gespeichert: 1` |
| Jede abgeschlossene Aufgabe löst den nächsten Schritt aus | Antwort → Cockpit (`POST /api/antwort`) setzt Stufe + Aufgabe; Lauf-Ende → WF 01 → Mandat; Stammdaten → `POST /api/mandate` (nur leere Felder) | WF 01/06, `lib/kontakte-schreiben.ts` |

## 2. Cockpit-Oberfläche bis 09.11. (Modul 02 — Cockpit-Session)

Die Datenseite ist vorhanden: `GET /api/mandate`, `GET /api/kontakte?mandat=…` (Stufe,
letzter Kontakt, followups, letzte Antwort), `GET /api/aufgaben`, `GET /api/historie`
(Aktivitäten/Protokoll), `GET /api/modul01/status` (Datenraum-Stand, Kennwerte,
Vorschläge, Qualitätskennzahlen). Die folgenden Punkte sind Oberfläche und Datenmodell:

### 2.1 Reporting-Dashboard je Projekt (Lucas lokales Tool ersetzen)
- Trichter je Mandat: Ansprachen → Interessensbekundungen (anfrage/infos) → NDA →
  Datenraum → Preisfrage/Gebote → Besichtigung; Absagen separat. Quelle: `kontakt.status`,
  `aktivitaet` (art antwort/versand), `followups`.
- Darstellung: Sankey (Ansprache → Reaktion → Ergebnis), Kuchen (Reaktionsarten),
  Top-Bieter-Liste (Preisfrage/Angebote, sobald Gebotsfelder existieren → siehe 2.5).
- Drill-down: Klick auf ein Segment → Kontaktliste mit Prozessschritt; Klick auf Kontakt →
  Kundenakte.
- **PDF-Export** je Projekt für das Verkäufer-Reporting (Kopf: Projektname, Stand, Key
  Facts; Trichter; Liste der Interessenten ohne Interna).
- Daten kommen aus dem CRM, nicht aus Excel; manuell nachgetragene Kontakte (Telefon,
  WhatsApp) über den bestehenden Stufen-Dialog.
- Fertig = ein Mandat zeigt alle Zahlen live, PDF exportierbar, Zahlen stimmen mit
  `GET /api/kontakte` überein.

### 2.2 Projektseite
- Kopf: Bild (Upload oder Pfad im Datenraum), Name, Phase, Zuständig, Key Facts
  (Jahresnettokaltmiete, Einheiten, Fläche) mit **Freigabe-Knopf** für die Vorschläge aus
  Modul 01 (Status `pruefen` → `uebernommen`; übernommene Werte in `mandat` speichern:
  neue Spalten `einheiten`, `flaeche_qm`, `jahresnettokaltmiete`, `bild_url`).
- Assetklasse als Auswahl aus den **fünf Klassen** (Mehrfamilienhaus, Wohn- und
  Geschäftshaus, Wohnanlage, Grundstück, Ausnahme) mit dem Modul-01-Vorschlag vorbelegt,
  Freigabe durch Klick. Das Matching gegen die Liveliste (`lib/abgleich.ts`) braucht eine
  Zuordnung der fünf Klassen auf das Liveliste-Vokabular (Wohnen, Büro, Einzelhandel …) —
  Tabelle im Code, Vorschlag: MFH/Wohnanlage → Wohnen; WGH → Wohnen + Einzelhandel;
  Grundstück → Entwicklung/Grundstück; Ausnahme → manuell.
- Top-Bieter-Block (siehe 2.5).
- Projektbenennung: Name ab Teaser-Erstellung, früher möglich (heute: Name = Laufname
  ohne Zeitstempel; Umbenennen muss `lauf_praefix` behalten, damit Modul 01 weiter
  zuordnet).

### 2.3 Rollen und Sichtbarkeit
- Tobi (Geschäftsführung) sieht alle Mandate; Objektbetreuer sehen nur Mandate mit
  `zustaendig = eigenes Kürzel` (plus Mandate ohne Zuständigen). Umsetzung in den
  Listen-Routen (`/api/mandate`, `/api/kontakte`, `/api/aufgaben`) über
  `x-seil-benutzer`; `lib/rollen.ts` erweitern um `darfMandatSehen(kuerzel, mandat)`.
- Maschinenzugang „automatik“ sieht alles (unverändert).

### 2.4 Status-Tracker (Lucas Excel) im Tool
- Je Kontakt: erledigt / Follow-up nötig / Notiz — entspricht `kontakt.status`,
  `followupLage()` (lib/followup.ts) und `notiz`. Fehlt: eine Listenansicht je Mandat mit
  Häkchen-Spalten und „nächste Aktion“ (aus `followupLage` + ANTWORT_REGELN) und ein
  Excel/CSV-Export. Lucas Datei dient als Abgleich der Spalten (anfordern).

### 2.5 Gebote / Top-Bieter
- Heute gibt es die Stufe `preisanfrage`, aber kein Gebotsfeld. Vorschlag: Tabelle
  `gebot` (mandat, investor_id, betrag, art indikativ/bindend, datum, quelle mail/telefon,
  notiz) + `POST /api/gebote`; Top-Bieter = höchste Gebote je Mandat. Eingabe im Cockpit
  (Preise werden nie automatisch aus Mails übernommen — Grundregel).

### 2.6 Postfach-Synchronisation
- Heute: WF 06 liest ein Postfach (deals@) und meldet Antworten mit Art ans Cockpit;
  Zuordnung zum Mandat über die Absenderadresse im Verteiler.
- Ziel: alle Teampostfächer, Zuordnung eingehender Mails zu Projekten (Betreff-Muster
  „… für Portfolio Otto“, Verteiler-Treffer, Konversations-ID). Umsetzung in n8n
  (Automatik), Anzeige in der Kundenakte/Projektseite (Cockpit). Erst nach 2.1–2.3.

### 2.7 Lucas Skills als Referenz (anfordern)
- **Pre-Sound-Mail**: liest den Datenraum, füllt eine Word-Vorlage mit Werten aus der
  Mieterliste (gelbe Felder manuell). → Engine liefert die Werte (2.1/2.2); die Vorlage
  gehört als Anschreiben-Vorlage in `lib/kommunikation.ts` bzw. den Versand (WF 12).
- **Investorenliste**: Scoring P1/P2 (frühere positive Reaktionen, vergleichbare Objekte,
  Bundesland-Raster) → in `lib/abgleich.ts` als Sortierung ergänzen (Reaktionshistorie aus
  `aktivitaet`, Vergleichsobjekte aus der Liveliste); heute filtert der Abgleich nur
  Region + Assetklasse + Ticket.
- **Status-Tracker** → 2.4.

## 3. Offene Entscheidungen (SEIL)
1. Datenraum light: Kategorienauswahl ohne Schwärzung bauen oder bis zur Schwärzung warten?
2. Kaufpreis im Mandat: bleibt manuell (Vorschlag).
3. WhatsApp (Superchat, Business-Account): nach stabilem E-Mail-Prozess, nicht vor 09.11.
4. SharePoint-Migration (Nino/Eileen): bis dahin OneDrive-Freigabe je Mandatsordner von Hand.
5. Echtversand: demoEmpfaenger bleibt gesetzt, bis SEIL freigibt; Zeitplan WF 05 aus.

## 4. Reihenfolge bis 09.11.
Di 03.11. Modul 01 A6/A10, Rollen (2.3) · Mi 04.11. Projektseite + Vorschlags-Freigabe
(2.2), Status-Tracker-Ansicht (2.4) · Do 05.11. Abnahmelauf Modul 01, Dashboard (2.1) ·
Fr 06.11. Übergabe Modul 01, Dashboard-PDF, Gebote (2.5) · Mo 09.11. Review-Call.
