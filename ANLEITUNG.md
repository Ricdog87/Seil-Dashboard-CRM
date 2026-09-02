# SEIL Cockpit · Leitfaden

Das Cockpit ersetzt Pipedrive und die Excel-Liste durch **ein** System:
Objekte, Investoren und Auftraggeber sind relational verknüpft, der
Transaktionsprozess (26 Schritte in 4 Phasen, wie eure Team-Liste) ist je
Objekt sichtbar, und die Routinearbeit – Follow-ups, Antworterkennung,
Datenraum-Status – läuft automatisch. Ihr entscheidet an den Stellen, die
Urteilskraft brauchen.

## Der Morgen in 4 Schritten

1. **Anmelden.** Oben rechts „Arbeiten als“ wählen – das Cockpit stellt sich
   auf euch ein (Begrüßung, eure Aufgaben, euer Name an Notizen).
2. **Posteingang triagieren.** Die Antworterkennung legt jede eingegangene
   Antwort mit Kernaussage und Vorschlag ab. Standardfälle (Interesse →
   Broker Call, Preisanfrage → Rückruf durch die Geschäftsführung) hat die Automatik schon
   verarbeitet; den Rest macht ihr mit einem Klick zur Aufgabe.
3. **Meine Aufgaben abarbeiten.** Heute Fälliges und Überfälliges steht
   direkt auf der Übersicht – Abhaken genügt, alle Zähler ziehen live mit.
4. **Pipeline prüfen.** Laufende Transaktionen als Tabelle (sortierbar per
   Spaltenkopf) oder als Board – eine Spalte je Phase.

## Die fünf Bereiche

| Bereich | Wofür |
|---|---|
| **Übersicht** | Euer Tag: Posteingang, eigene Aufgaben, KPIs mit 7-Tage-Trend, alle Transaktionen |
| **Objekt-Detail** | Prozessleiste (26 Schritte, je Schritt Beschreibung + offene Aufgaben), Datenraum-Checkliste live aus Modul 01 (sobald verbunden, sonst Demo – die Karte sagt es), KI-ausgelesene Kennwerte, verknüpfte Investoren, komplette Historie, Notizen |
| **Investor-Detail** | Ankaufsprofil – Zielregionen und Ticket direkt bearbeitbar (statt Excel), alle verknüpften Objekte mit Antwortstatus, Kommunikationshistorie |
| **Vermarktung** | Automatik-Kette (Datenraum → Matching → Freigabe → Follow-up), Verteiler je Objekt mit Match- und Antwortstatus – oben die Freigabe |
| **Aufgaben** | Kanban (Spalten = Fälligkeit, Karten ziehen oder per Griff-Menü verschieben = umplanen) oder Liste, nach Mitarbeiter filterbar, Broker Calls hervorgehoben |

**Alles ist verbunden:** Objekt anklicken zeigt seine Investoren, Investor
anklicken seine Objekte – der Kern, den Pipedrive nicht konnte. `⌘K` /
`Strg+K` öffnet die Suche über alles.

## Das läuft automatisch

- Matching der Investorenliste – Standort zuerst, dann Assetklasse und Ticket
- Follow-ups alle 2 Tage (max. 3 Stufen) über E-Mail + WhatsApp (Superchat);
  Stufe 2 und die Absage-Bestätigung fragen nach Zielregionen – Antworten
  aktualisieren das Profil
- Antworterkennung nach Standardprozess: Interesse → Broker Call beim Zuständigen, Absage → Kriterien-Rückfrage, Preisanfrage → Rückruf durch die Geschäftsführung (nur telefonisch), Unterlagen → Datenraum-Abgleich, Besichtigung → Termin-Koordination
- Datenraum-Status und Dokumenten-Checkliste aus Modul 01 – live im Cockpit, sobald die Anbindung konfiguriert ist
- Se-Circle-Sync für Off-Market-Objekte, KI-Extraktion aus Datenraum-Dokumenten, KI-Teaser-Entwürfe
- Täglicher Status-Report an das Team

Dazwischen: das **Backoffice** bereitet vor (Rent Roll, Datenraum, NDA-Versand,
Fotograf) – der Vertrieb übernimmt erst bei konkretem Interesse.

## Hier entscheidet ihr

- **Freigabe der Investorenliste** vor jedem Versand – der einzige Pflicht-Stopp
- **Übernahme KI-gelesener Werte** ins CRM („Prüfen & übernehmen“)
- **Triage** der Signale, die die Automatik nicht selbst zuordnet
- Broker Calls, Besichtigungen, Verhandlung – wie immer

## Der GF-Blick

„Arbeiten als“ **Max Seil** schaltet die Übersicht auf das
Geschäftsführungs-Dashboard: Pipeline gesamt und in aktiver Vermarktung,
Honorarpotenzial (Modellrechnung), Antwortquote, Summen je Phase,
Vermarktungs-Funnel, alle Mandate nach Volumen, Risiken und die Auslastung
im Team – **nur Zahlen, nichts zum Eintragen**. Zurück zur operativen
Sicht: einfach wieder einen Mitarbeiter wählen.

**Bericht exportieren:** Auf Übersicht und GF-Blick erzeugt „Bericht
exportieren (HTML)“ den Statusbericht als Datei zum Weitergeben –
dasselbe HTML-Produkt, das die Automatik werktäglich um 08:00 an das
Team versendet.

## Unterwegs auf dem Handy

Das Cockpit läuft im Browser auch auf dem Smartphone – gleiche Daten,
gleiche Funktionen, kein abgespecktes Extra-Layout:

- **Board-Karten verschieben:** Griff-Symbol antippen → „Verschieben nach …“
  (ersetzt das Ziehen, das es auf Touchscreens nicht gibt)
- **Breite Tabellen:** innerhalb der Karte seitlich wischen
- **Suche:** Lupen-Symbol oben in der Kopfleiste (statt `⌘K`)

## Stand heute

Dies ist der **Klickdummy zur Abstimmung**: alle Daten sind erfunden
(Ausnahme: Nino als Demo-Nutzer), Eingriffe gelten nur für die laufende
Sitzung, ein Reload stellt den Demostand wieder her. Das produktive
Modul 02 ergänzt Persistenz, Mail-Anbindung, echte Automatik und den
einmaligen Pipedrive-Import. Was wir vor dem Bau von euch bestätigt
brauchen, steht in [`ANNAHMEN.md`](ANNAHMEN.md).
