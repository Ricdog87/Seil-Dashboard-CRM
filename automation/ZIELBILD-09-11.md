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
| Follow-ups automatisch | WF 05 Nachfass-Leiter läuft gegen das Cockpit; seit 03.11. nach Lucas Statustracker: **3 Stufen** (FU1 · FU2 · FU3 = Final, Texte wortgleich aus seinem Flow), Abstand **2 Werktage**, auch nach Mappen-/Datenraum-Versand (`datenraum_freigegeben`); Preisfrage 1×; Zeitplan aus bis Freigabe durch SEIL; demoEmpfaenger gesetzt | Testlauf 02.11.: 1 fällig, HTTP 202, Cockpit `gespeichert: 1`; Offline-Test 03.11.: 3 fällig (Stufe 1, Final, Preisfrage), Stufe 4 nicht mehr fällig |
| Pre-Sound-Betreff als Mandats-Hinweis | WF 06 liest `SEIL • Ort \| Produkttyp \| „Objektname“` (auch hinter AW:/Re:) und schickt den Objektnamen als `mandatHinweis` an `POST /api/antwort`; die Route nutzt ihn nur, wenn dieselbe Adresse in mehreren Mandaten offen ist | WF 06 „Nachrichten vereinzeln“, `app/api/antwort/route.ts`, Offline-Test 4 Betreffe |
| Pre-Sound-Fakten aus dem Datenraum | Engine liest zusätzlich Baujahr, Grundstücksfläche, Flurstücke, WE/GE/Stellplätze, Leerstand %, JNKM SOLL — als Vorschläge mit Stimmen und Quelle (nie automatisch ins Mandat) | seil-doc-engine `src/pipeline/kennwerte.ts`, 412 Tests |
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

### 2.7 Lucas Skills als Referenz (erhalten 03.11., abgelegt unter `automation/vorlagen-seil/`)
- **Pre-Sound-Mail**: liest den Datenraum, bestimmt den Produkttyp (A Bestand · B Bestand mit
  Entwicklungspotenzial · C Entwicklungsgrundstück · D Sanierungsobjekt · E Forward/Neubau),
  schreibt die Mail im festen Bullet-Format (Mietfläche · Einheiten „ca. 16 WE | 4 GE“ ·
  Grundstücksfläche · Baujahr · Vermietungsstand · JNKM IST/SOLL), Betreff
  `SEIL • [Ort] | [Produkttyp] | „[Objektname]“`. → Engine liefert die Werte (2.1/2.2, seit
  03.11. inkl. Pre-Sound-Fakten); Mailformat gehört als Anschreiben-Vorlage in
  `lib/kommunikation.ts` bzw. WF 12; Produkttyp = neues Mandatsfeld (Auswahl A–E).
- **Investorenliste**: Filter Bundesland/Assetklasse/Ticket aus der Live-List, Scoring P1/P2
  (frühere positive Reaktionen, vergleichbare letzte Ankäufe), Ausschlüsse (Opt-out, interne
  Adressen, Dubletten) → in `lib/abgleich.ts` als Sortierung ergänzen; heute filtert der
  Abgleich nur Region + Assetklasse + Ticket.
- **Status-Tracker** → 2.4; **Pre-Sound erfassen** → 2.6 (Versandwelle = Mandat + Zeitpunkt +
  BCC-Liste).

### 2.8 Lucas Datenmodell (Live-List v4 / Statustracker) → Cockpit-Felder
Die Live-List ist kodiert (Code vor Zahl vor Text). Was das Cockpit davon übernehmen sollte,
damit Lucas Auswertungen weiter funktionieren:

| Live-List | Codes | Cockpit heute | Zu tun |
|---|---|---|---|
| Status je Mandat (`MANDAT:CODE`) | AV angeboten · NF nachgefasst · IN Interesse · NA NDA angefordert · NV NDA versandt · NU NDA unterzeichnet · UE Unterlagen erhalten · CA Call/Termin · BE Besichtigung · DD Due Diligence · AN Angebot abgegeben · AB Absage · VS Verkäuferseite · KV Kaufvertrag | `kontakt.status` (angeschrieben, interesse, nda_angefragt, datenraum_freigegeben, preisanfrage, besichtigung, abgesagt …) | Zuordnungstabelle Stufe ↔ Code in `lib/crm.ts`; fehlende Stufen ergänzen: `nda_versandt`, `nda_unterzeichnet`, `due_diligence`, `angebot_abgegeben`, `kaufvertrag`; Export der Kontakte mit Code-Spalte |
| Absagegrund (nur bei AB) | STO Standort · STR Objektstruktur · GEW Gewerbeanteil · PRS Preis · TIM Timing · SUCH Suchraster · VGB vergeben · LEE Leerstand/Zustand | Freitext `notiz` | Auswahlfeld `absagegrund` am Kontakt (Pflicht bei Absage) — Basis für „Top Absagegründe“ im Reporting (2.1) |
| Objektart Suchraster | MFH · WGH · WA · WP · ETW · EFH · ZFH · RH · MA · STW · SEN · BH · WO · BÜ · EH · HOT · PFL · LOG · GH · MIX · GRD · PE | Liveliste-Vokabular in `lib/abgleich.ts` | Zuordnung der fünf Mandats-Klassen: Mehrfamilienhaus → MFH/WO/WP; Wohn- und Geschäftshaus → WGH/GH/MIX; Wohnanlage → WA/WP; Grundstück → GRD/PE; Ausnahme → manuell |
| Bundesland | ISO 3166-2:DE (BW, BY, BE … TH, AT, CH), Mehrfachwerte mit `;` | `mandat.region` = Bundesland ausgeschrieben | Kürzel-Tabelle in `lib/abgleich.ts` (beide Richtungen) |
| Ticket / WE | Ticket min/max in Mio. € · WE min/max | Ticket-Spanne | WE-Spanne in den Abgleich aufnehmen (Engine liefert `einheiten`) |
| Ankauf 1–3 | `Datum\|Ort\|BL\|Objektart\|Größe\|Preis\|Quelle` | „zuletzt Vergleichbares gekauft“ sortiert | Parser für das Format; Scoring P1 = vergleichbarer Ankauf (BL + Objektart + Größe ±50 %) |
| Investorentyp · Kontaktrolle · Strategie · Lageklasse · Deal-Struktur | PRV/FO/WU/GEN/KVG/PE/BT/PD/INST/KOM · GF/AKQ/AM/ASS · CORE/CORE+/VA/OPP/AUF · A/B/C/D/UML · AD/SD/BEIDE | Nur Firma/Name | Anzeige in der Kundenakte (read-only aus der Liveliste), Filter in der Investorensuche |
| Opt-out · Ausschluss | J + Datum · NUR-RM / NUR-NW / NUR-NORD / KEIN-GEW / KEIN-ANG | — | Harter Ausschluss im Abgleich (Opt-out nie anschreiben; neues Angebot trotz Opt-out = Prüffall) |
| Angebote (Versandwellen) | PS Pre-Sound · NF Nachfass · EV Einzelversand · PA Portalantwort; je Mail und Mandat eine Zeile, Empfängeranzahl, Reaktionen | `aktivitaet` (art versand) | Welle als eigene Entität (Mandat, Datum, Art, Empfänger-IDs) — Grundlage für Trichter „Ansprachen“ und für WF 05 |
| Statustracker-Trichter | Erstkontakt → Interesse → NDA erhalten → NDA zurück → Mappe/DR light → Feedback; FU1–FU3 je Gruppe (Erstkontakt / NDA / Mappe) | `followups`, `followupLage()` | Gruppenlogik: Stufenwechsel durch eine Person setzt `followups` auf 0 (neue Leiter); 2.4-Ansicht zeigt FU-Stand je Gruppe |
| Verkäufer-Reporting (PDF) | Kopf (Objekt, Stand, Version), KPI-Zeile, Trichter 6 Stufen, Käuferprofile, Top Bieter mit Sterne-Ranking, Top Absagegründe | — | Vorlage `automation/vorlagen-seil/muster/SEIL_Reporting_Musterobjekt_V1.pdf`; Versionsnummer + „verschickt am“ je Reporting (Lucas Kanban: Offen · In Arbeit · Fertig · Verschickt, wochenweise) |

Grundsätze aus Lucas Regeln, die auch für das Cockpit gelten: nie löschen, nie einen befüllten
Wert durch leer ersetzen, Status nur nach vorne (AV/NF werden von jeder Reaktion ersetzt, KV nie
überschrieben), Abwesenheitsnotizen und Eingangsbestätigungen zählen nicht, Unzustellbar =
Prüffall „E-Mail ungültig“, Kontakt-IDs nie neu vergeben.

## 3. Offene Entscheidungen (SEIL)
1. Datenraum light: Kategorienauswahl ohne Schwärzung bauen oder bis zur Schwärzung warten?
2. Kaufpreis im Mandat: bleibt manuell (Vorschlag).
3. WhatsApp (Superchat, Business-Account): nach stabilem E-Mail-Prozess, nicht vor 09.11.
4. SharePoint-Migration (Nino/Eileen): bis dahin OneDrive-Freigabe je Mandatsordner von Hand.
5. Echtversand: demoEmpfaenger bleibt gesetzt, bis SEIL freigibt; Zeitplan WF 05 aus.

6. Follow-up-Leiter: WF 05 fährt seit 03.11. drei Stufen (Lucas Vorgabe). `FOLLOWUP_LEITER` in
   `lib/kommunikation.ts` kennt vier — Cockpit auf drei angleichen (Cockpit-Session), sonst zeigt
   `followupLage()` eine Stufe zu viel.

## 4. Reihenfolge bis 09.11.
Di 03.11. Modul 01 A6/A10, Rollen (2.3) · Mi 04.11. Projektseite + Vorschlags-Freigabe
(2.2), Status-Tracker-Ansicht (2.4) · Do 05.11. Abnahmelauf Modul 01, Dashboard (2.1) ·
Fr 06.11. Übergabe Modul 01, Dashboard-PDF, Gebote (2.5) · Mo 09.11. Review-Call.

## 5. Stand 12.11.2026 und Vorgehen bis zum Launch

Die Reihenfolge aus Abschnitt 4 ist überholt: Die Weiterentwicklung von Modul 02 ruhte ab
03.11. bis zur Übergabe von Modul 01 (Abnahme 13.11.). Für den Weg zum Launch gilt der Ablauf,
den Nino am 12.11. noch einmal festgehalten hat (so am 02.11. besprochen):

1. **Unterlagen und Anforderungen** — erledigt (Termin 02.11., Unterlagen 03.11.).
2. **Weiterentwicklung mit Zwischensessions** mit Luca und Nino: Abgleich Stand ↔ Anforderungen,
   Rückfragen. Sobald beide das Modul für reif halten, folgt der Workshop mit dem Team.
3. **Workshop mit dem Team:** Modul vorstellen, jede Person spielt die Funktionen live durch,
   Input des Sales-Teams aufnehmen.
4. **Optimierungen** aus dem Workshop.
5. **Abschluss-Workshop mit Abnahme** durch das Team.

Terminvorschlag RSG: Zwischensession 1 am 13.11., Zwischensession 2 am 20.11., Team-Workshop
am 24.11., Abnahme am 27.11., Launch am 30.11. — der Team-Workshop hängt an der Freigabe durch
Luca und Nino.

### Stand der Punkte aus Abschnitt 2

| Punkt | Stand 12.11. | Offen |
|---|---|---|
| 2.1 Reporting je Projekt, PDF | fertig, live (ANNAHMEN 121–126) | Abgleich mit Lucas lokalem Tool in der Zwischensession; Sankey/Kuchen und Drill-down nur, wenn gewünscht |
| 2.2 Projektseite | fertig, live seit 12.11. (ANNAHMEN 130–131) | Projektbild (`bild_url`) fehlt noch; Zuordnung der fünf Assetklassen zu den Begriffen der Liveliste in der Zwischensession bestätigen |
| 2.3 Rollen und Sichtbarkeit | Entscheidung offen | Workshop 30.10.: Mandate bleiben für alle sichtbar; Termin 02.11.: Objektbetreuer sehen nur eigene. In der Zwischensession klären, dann `darfMandatSehen` |
| 2.4 Status-Tracker-Ansicht | fertig, live seit 12.11. (ANNAHMEN 132) | Abgleich mit Lucas Excel in der Zwischensession: Stufen-Zuordnung, Absagegründe (drei Vokabulare), Export als CSV statt xlsx |
| 2.5 Gebote / Top-Bieter | fertig, live (ANNAHMEN 123–124) | — |
| 2.6 Postfach-Synchronisation | offen | braucht Postfach-Rechte (Mahr EDV); Vorschlag: nach dem Launch |
| 2.7 Lucas Skills | teilweise | Pre-Sound-Mail als Vorlage; Scoring P1/P2 und Ausschlüsse im Abgleich |
| 2.8 Live-List-Codes | teilweise | Käufertyp und Absagegrund sind da (ANNAHMEN 125); fehlende Stufen (Due Diligence, Angebot abgegeben, Kaufvertrag), Code-Zuordnung, Bundesland-Kürzel, WE-Spanne, Opt-out, Versandwellen |
| 3.6 Follow-up-Leiter | fertig, live seit 12.11. (ANNAHMEN 133) | — |

Abhängigkeit außerhalb des Cockpits: Die Investorenliste liegt seit dem Umzug nach SharePoint
(07./08.11.) an einem neuen Ort; bis die Automatik dort wieder lesen darf, läuft der Abgleich
nicht (WF 10). Zuschnitt der Bibliotheken und Rechte: Mahr EDV.
