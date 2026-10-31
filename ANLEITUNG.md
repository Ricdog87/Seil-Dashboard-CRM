# SEIL Cockpit · Leitfaden für das Team

Das Cockpit ist Modul 02: das CRM der SEIL Real Estate, gebaut entlang eures
Flowcharts „SEIL Transaction Process“ (17 Schritte) und des „Standardprozess
Kommunikation Investoren“. Es ersetzt Pipedrive und die Excel-Listen durch
**ein** System: Mandate, Kunden, Investoren-Trichter, Aufgaben, Freigaben und
Zahlen – alles live aus OneDrive, dem SEIL-Server (Modul 01) und der Datenbank.
Nichts darin ist von Hand nachgetragen.

Adresse: https://seil-cockpit.vercel.app · Anmeldung mit Kürzel und Passwort
(12 Stunden gültig). Die Zugänge hat jede Person einzeln bekommen.

## Der Morgen in vier Schritten

1. **Übersicht öffnen.** Oben dein Stand gegen deine Ziele, darunter die
   Kennzahlen des Teams, die Pipeline, deine Aufgaben und der Verlauf.
   Tobias sieht hier zusätzlich den Freigabe-Eingang.
2. **Aufgaben abarbeiten.** Überfällig, heute, diese Woche. Aufgaben mit der
   Marke „aus dem Prozess“ hat niemand getippt – sie kommen aus dem
   Standardprozess (Exposé senden, Rückruf Herr Seil, Besichtigung …).
3. **Trichter pflegen.** Im Mandat die Antworten erfassen („Antwort ▾“ an der
   Karte) oder Karten ziehen. Fällige Follow-ups stehen rot an der Karte.
4. **Freigaben erteilen** (nur Tobias): Entwurf links, Empfänger rechts mit
   Haken – freigeben oder ablehnen. Freigegeben heißt: die Automatik sendet.

## Die Bereiche

| Bereich | Wofür |
|---|---|
| **Übersicht** | Dein Tag: Leistung gegen Ziel, Kennzahlen, Pipeline, Freigaben (Tobias), Aufgaben, Verlauf |
| **Mandate** | Pipeline-Tafel (Spalten = Abschnitte des Flowcharts, Karten ziehen) oder Liste; jedes Mandat mit Stammdaten, Wirtschaftlichkeit, Standarddokumenten, den 17 Schritten, dem Investoren-Trichter, Suche und Anschreiben, Aufgaben, Notizen und Verlauf |
| **Freigaben** | Der Eingang für Tobias: jedes Anschreiben wartet hier, bis er es freigibt |
| **Aufgaben** | Meine Aufgaben nach Fälligkeit; Geschäftsführung sieht das ganze Team und verteilt |
| **Leistung** | Eigene Ziele gegen Ist; Geschäftsführung: Umsatz, Pipeline-Wert, Forecast, Team |
| **Kunden** | Alle Investoren aus der Liveliste plus Auftraggeber und Partner; Klick öffnet die Akte mit kompletter Historie |
| **Prozess** | Das Flowchart als Tafel und der Standardprozess mit Vorlagen – zum Nachlesen |

`⌘K` / `Strg+K` öffnet die Suche über Kunden und Mandate.

## Der Prozess, wie das Cockpit ihn führt

**Auftraggeberseite (Schritte 1–12).** Ein Datenraum in Modul 01 wird
automatisch zu einem Mandat im Cockpit (Schritt 8 → 9). Das Team trägt
Stadt, **Region (Bundesland)**, Assetklasse, Kaufpreis und Provision ein,
hakt die Standarddokumente ab und setzt die Schritte auf Läuft/Erledigt.
Der Datenraum-Stand kommt live aus Modul 01.

**Investorenseite (Schritte 13–17).**

- **13 Matching:** sobald Region und Assetklasse stehen, gleicht das Cockpit
  gegen die Liveliste ab (Standort zuerst, dann Assetklasse und Ticket) und
  merkt passende Investoren mit E-Mail vor. „Abgleich jetzt“ wiederholt das.
- **14 Approach-Mail:** im Mandat Investoren auswählen, Anschreiben verfassen,
  „Zur Freigabe geben“. Tobias gibt frei, die Automatik versendet (BCC).
- **15 E-Mail-Kommunikation:** jede Antwort wird nach dem Standardprozess
  erfasst – von Hand („Antwort ▾“) oder durch die Antworterkennung. Das
  Cockpit setzt die Stufe, legt das Todo an und startet die Follow-up-Leiter
  neu: 1. Follow Up, 2. Follow Up, weiteres, Final – alle zwei Tage.
- **16/17 Phone Call und Broker Call:** Preisfragen gehen als Rückruf an
  Herrn Seil (nur telefonisch), Besichtigungswünsche als Vier-Schritte-Kette
  an die zuständige Person – als Aufgaben am Investor.

Trichter-Stufen: Vorgemerkt → Angeschrieben → Anfrage/Exposé → NDA angefragt →
NDA unterzeichnet → Datenraum frei → Preisfrage → Besichtigung. Abgesagt steht
daneben und löst laut Standardprozess die Frage nach den Investment-Kriterien aus.

## Rollen

- **Geschäftsführung** (Tobias, Max, Nino): alle Aufgaben, Verteilung, Umsatz,
  Pipeline-Wert, Forecast, Ziele aller, Ziele setzen.
- **Freigabe** (Tobias): einziger Freigeber für Anschreiben.
- **Alle anderen**: eigene Aufgaben, eigene Ziele gegen Ist, das Team nur als
  Summe. Mandate und Kunden sind gemeinsam – ein Team verkauft zusammen.
- **Automatik**: tritt als „automatik“ auf, legt Mandate und Prozessaufgaben
  an, bewegt den Trichter aus Antworten, versendet nach Freigabe.

## Was automatisch läuft – und was nicht

Automatisch: Datenraum → Mandat, Abgleich → Verteiler, Freigabe → Versand,
Antwort → Stufe + Todo + Follow-up-Uhr, Datenraum-Stand, Kennzahlen, Spur.

Von Hand: Stammdaten und Wirtschaftlichkeit am Mandat, Standarddokumente,
Schritte 1–7 und 10–12, Anschreiben verfassen, Freigabe, Antworten ohne
Antworterkennung, Aufgaben abhaken, Ziele setzen.

Noch nicht scharf: der zeitgesteuerte Follow-up-Versand (WF 05, Cron aus) und
der Echtversand an Investoren (Demo-Umleitung an eine interne Adresse, bis
SEIL den Echtversand freigibt). Das Cockpit zeigt Fälligkeiten trotzdem.

## Wenn etwas nicht stimmt

Screenshot mit zwei Sätzen Kontext in die Feedback-Gruppe. Jede Seite sagt
selbst, wenn eine Quelle nicht erreichbar ist („Modul 01 nicht erreichbar“,
„Verteiler nicht erreichbar: …“) – das ist kein Fehler der Seite, sondern der
Hinweis, wo zu schauen ist. Entscheidungen und Setzungen stehen in
ANNAHMEN.md, die Übergabe in UEBERGABE.md.
