# Annahmen – bitte im Kundengespräch klären

Der Auftrag ließ an einigen Stellen bewusst Spielraum. Hier sind alle Punkte, an denen
für den Prototyp eine Annahme getroffen wurde – jeweils mit der gewählten Umsetzung.

## Prozess & Statusmodell

1. **Prozessmodell aus der Team-Excel (19.08.).** Der Prototyp folgt der echten
   Liste „SEIL Transaction Process“: bereinigt 26 Schritte in 4 Phasen, je
   Schritt Verantwortung und heutiges Tool (Word/PDF, Excel, PowerPoint,
   Outlook, OneDrive, Pipedrive). Als Verantwortliche führt die Excel Client,
   Legal Team, Investment Team, **Investment Team (India)**, Broker und Team –
   im Prototyp ist India unter „Investment Team“ zusammengefasst; welche
   Schritte real in Indien liegen, bitte im Gespräch klären. Für die kompakte
   Leiste wurden deutsche Kurzlabels gesetzt. → `lib/mock-data.ts`
2. **Bereinigungen gegenüber der Excel (bitte bestätigen):** Die Excel führt
   real 25 Statusspalten. Zwei kombinierte Einträge wurden für den Prototyp in
   je zwei Schritte geteilt („Indikatives Angebot/LOI Besichtigungen“ →
   Schritte 19+20, „Angebotsverhandlung Notarbeauftragung“ → Schritte 23+24);
   „Reporting (wöchentlich)“ läuft als Querschnitt in Phase 4 statt als eigener
   Schritt – zusammen ergibt das die 26 Schritte. Die Titel der Phasen 1+2 sind
   im Export abgeschnitten und hier gesetzt („Mandat & Bewertung“,
   „Vermarktungsvorbereitung“); Phasen 3+4 heißen wie im Original. Die
   Excel-Nummerierung (Lücken bei 13/17, doppelte 18) wurde auf 1–26
   durchnummeriert. Die Tool-Zuordnung je Schritt ist aus dem Export
   rekonstruiert.
3. **Statusvokabular:** Done / In Progress / Pending / N.A. wie in der Excel –
   das dort vereinzelt genutzte **„In Vorbereitung“** ist im Prototyp auf
   „Pending“ abgebildet (bitte bestätigen, falls es ein eigener Status bleiben
   soll). Mehrere Schritte können parallel „In Progress“ sein. „Aktueller
   Schritt“ (Tabelle, Board) ist der weiteste laufende Schritt; parallel
   Laufende werden als „+n parallel“ ausgewiesen. Der Prozessfortschritt zählt
   N.A. nicht mit.
4. **Lead + Vertretung** je Objekt wie in der Excel (Spalten Projekt Lead /
   Vertretung); die Stand-Notiz entspricht der Freitext-Notizspalte.
5. **Keine echten Daten übernommen:** Die Excel enthält reale Adressen, Preise
   und interne Notizen. Übernommen wurde ausschließlich die Struktur – alle
   Objekte, Zahlen und Notizen im Prototyp bleiben frei erfunden (Leitplanke).
6. **Antwortstatus je Investor-Kontakt** in 7 Stufen: Vorgemerkt → Keine Rückmeldung →
   Interesse / Preisanfrage → NDA unterzeichnet → Datenraum freigegeben → Abgesagt.
   Granularität und Benennung sind eine Setzung; ebenso die Annahme, dass jeder
   Investor **vor** der Datenraum-Freigabe ein Vermarktungs-NDA unterzeichnet.
7. **Follow-up-Automatik:** „nach 2 Tagen, bis zu 3 Stufen“ wurde als fester
   2-Tage-Rhythmus je Stufe interpretiert. Nach Stufe 3 ohne Antwort entsteht eine
   manuelle Nachfass-Aufgabe für den zuständigen Mitarbeiter (Annahme). Ein geplantes
   Follow-up gilt als überfällig, wenn sein Termin vor dem Referenztag liegt (etwa
   weil die Automatik angehalten wurde) – in den Demodaten kommt dieser Fall nicht
   vor, dort entsteht Handlungsbedarf durch die ausgeschöpfte Stufe 3.
8. **Antworterkennung:** Interesse erzeugt eine Aufgabe „Broker Call“ für den
   **objektzuständigen** Mitarbeiter (nicht für einen Pool); Preisanfragen werden als
   Aufgabe an das Investment-Team (im Prototyp: eine Person) geroutet.

## Freigabe (Human-in-the-Loop)

6. **Die Freigabe gilt für die ganze Liste,** nicht je Einzelkontakt, und wird vom
   objektzuständigen Mitarbeiter erteilt. Einzelne Kontakte vor Freigabe zu entfernen
   wäre eine sinnvolle Ergänzung – im Prototyp nicht umgesetzt.
7. **Abgleichkriterien der Investorenliste:** Assetklasse, Ticketgröße und Region als
   Matching-Dimensionen angenommen (so auch im Ankaufsprofil dargestellt).

## Datenraum / Modul 01

8. **Standard-Dokumentencheckliste mit 12 Positionen** (Grundbuchauszug, Mietverträge,
   Energieausweis, Altlastenauskunft …) ist eine plausible Setzung. Die echte
   Checkliste kommt aus Modul 01 und kann abweichen – ggf. auch je Assetklasse
   unterschiedlich.
9. **Schnittstellen-Annahme:** Modul 01 liefert je Dokument einen Status
   (vorhanden / in Prüfung / ausstehend) plus einen Stand-Zeitstempel. Im Prototyp
   ist das simuliert und überall mit „Modul 01“ gekennzeichnet.
10. **„Datenräume mit Lücken“** zählt nur angeforderte Datenräume mit unvollständiger
    Checkliste – ein noch gar nicht angeforderter Datenraum (Ärztehaus) zählt nicht
    als Lücke.

## Übersicht & Aufgaben

11. **KPI-Auswahl:** Die vier Kacheln (laufende Transaktionen, offene Aufgaben,
    Investoren ohne Rückmeldung, Datenräume mit Lücken) wurden aus dem Auftrag
    abgeleitet und als wichtigste Steuerungsgrößen angenommen.
12. **„Investoren ohne Rückmeldung“** = angeschriebene Kontakte ohne jede Antwort;
    „mit Handlungsbedarf“ = Follow-up überfällig oder Stufe 3 ausgeschöpft.
13. **Team-Modell:** 4 Personen inkl. „Investment-Team“ als zuweisbare Einheit für
    Preisanfragen. Rollen, Namen und Zuständigkeiten sind frei erfunden.

## Struktur & Design

14. **Auftraggeber hat keinen eigenen Screen** (der Auftrag definiert genau fünf).
    Auftraggeber werden als Panel am Objekt-Detail dargestellt; als dritte Entität
    sind sie im Datenmodell aber vollwertig angelegt.
15. **Navigation:** Drei Menüpunkte (Übersicht, Vermarktung, Aufgaben); Objekt- und
    Investor-Detail sind nur über Verlinkungen erreichbar – bewusst keine
    zusätzlichen Listen-Screens.
16. **Vermarktungs-Screen** zeigt nur Objekte, deren Investorenseite gestartet ist
    (Auswahl per Dropdown); vorausgewählt ist das Objekt mit ausstehender Freigabe.
17. **Begriffe:** Der Denglisch-Mix aus dem Auftrag (Valuation, Broker Call, Listing,
    Teaser) wurde im UI beibehalten; Datums- und Zahlenformate sind deutsch
    („17,4 Mio. €“, „18.08.2026“).
18. **Referenzdatum:** Der Prototyp „lebt“ am 18.08.2026 – Überfälligkeiten und
    „heute fällig“ beziehen sich auf dieses fixe Datum (`HEUTE` in
    `lib/mock-data.ts`).
19. **Demodaten-Dramaturgie:** Damit auf fünf Screens alle Zustände gleichzeitig
    sichtbar sind (Interesse, Preisanfrage, Absage, Stufe 1–3, Freigabe ausstehend,
    Datenraum-Lücken …), sind einzelne Zeitabstände in den Demodaten bewusst
    gestreckt und nicht in jedem Fall streng im 2-Tage-Raster.

## Integrationen & Automationen (aus Angebot AG2026-SEIL-03 und Kickoff 17.08.)

Der Prototyp ist ein Klickdummy – alle folgenden Punkte sind **nur als Anzeige
simuliert**; die echte Anbindung ist Umsetzungsteil von Modul 02.

20. **Se Circle:** Im Kickoff als zentrale Entscheidung benannt. Im Prototyp als
    eigene Karte am Se-Circle-Objekt (Richtung, letzter Sync, synchronisierte
    Feldgruppen), als Sync-Aktivitäten und im Systemstatus der Übersicht
    dargestellt. Welche Felder Se Circle konkret liefert und ob zurückgeschrieben
    wird, ist offen – angenommen ist ein täglicher Sync Se Circle → Cockpit.
21. **KI-Extraktion aus dem Datenraum** (Grundbuch, Mieterlisten): je Objekt als
    Feldliste mit Wert, Quelldokument und Prüfstatus dargestellt. Annahme: die
    Übernahme ins CRM bestätigt ein Mitarbeiter (Human-in-the-Loop, gleiche
    Philosophie wie die Listen-Freigabe); unsichere Werte (Staffelmieten,
    Flächenabweichung beim Distressed Asset) werden zur Prüfung markiert.
    Der Demo-Klick „Prüfen & übernehmen“ wirkt nur in der Sitzung.
22. **KI-generierte Teaser & Listings:** als Pipeline auf der Vermarktung
    dargestellt (KI-Entwurf → Prüfung durch das Team → Versand); beim
    Wohnportfolio wartet der geprüfte Teaser auf die Listen-Freigabe.
    Ob die Prüfung verpflichtend sein soll, ist eine Annahme.
23. **Pipedrive-Migration:** Der einmalige Export/Import aus dem Angebot ist als
    Quelle-Tag am Investor („Pipedrive-Import“) dargestellt – ein eigener
    Import-Screen würde die Fünf-Screen-Grenze sprengen.
24. **Status-Reports:** Im Angebot enthalten („Status-Reports“, dort mit
    Telegram nur als Beispiel genannt); im Kickoff wurde kein Kanal besprochen.
    Die Anzeige ist deshalb bewusst kanalneutral („Status-Report heute 08:00 an
    das Team versendet“). Kanal, Inhalt, Frequenz und Empfängerkreis sind im
    Kundengespräch festzulegen.
25. **Presound-Mail an BCC-Verteiler vs. KI-personalisierte Ansprache:** Das
    Angebot nennt eine „KI-personalisierte Ansprache mit Freigabe-Workflow“, im
    Kickoff wurde der heutige Ist-Prozess als Presound-Mail an einen
    BCC-Verteiler beschrieben. Der Prototyp zeigt den Versand als Sammelmail
    (Benennung aus dem Kickoff) – ob die Ansprache künftig je Investor
    KI-personalisiert erzeugt und einzeln freigegeben wird, ist zu klären; das
    verändert Freigabe-Granularität und Datenmodell.
26. **Distressed Assets:** Im Kickoff als Sonderfall mit typisch unvollständigen
    Unterlagen genannt – im Prototyp als Merkmal am Fachmarktzentrum (7/12
    Dokumente) dargestellt. Ob Distressed-Fälle eine eigene Prozessvariante
    brauchen, ist offen.
27. **Flexible Gestaltbarkeit:** Im Kickoff wurde gewünscht, dass das Dashboard
    Prozessänderungen erlaubt. Im Klickdummy demonstriert: Aufgaben lassen sich
    neu zuweisen, um 2 Tage verschieben und abhaken (nur in der Sitzung,
    „Zurücksetzen“ stellt den Stand wieder her). Das Umsortieren der
    Prozessschritte selbst bleibt dem echten System vorbehalten – die Schritte
    sind hier bewusst fest verdrahtet.
28. **Board-Ansicht:** Die Übersicht bietet zusätzlich zur Tabelle ein Board
    mit **4 Spalten = die 4 Phasen der Team-Excel** („Mandat & Bewertung“ bis
    „Angebote & Reporting“). Jede Karte hängt in der Phase ihres weitesten
    laufenden Schritts. Karten folgen dem Prozessstatus – ein manuelles
    Verschieben von Karten wäre im echten System eine Statusänderung und ist
    im Klickdummy bewusst nicht simuliert.
29. **Interaktiver Prozess:** „Das Dashboard soll den gesamten
    Transaktionsprozess interaktiv abbilden“ (Kickoff) ist als klickbare
    Prozessleiste umgesetzt: jeder Schritt öffnet ein Detailpanel mit
    Beschreibung, Verantwortung (Team / Automatik / manuelle Freigabe) und –
    beim aktiven Schritt – offenen Aufgaben und letzten Aktivitäten. Die
    Texte je Schritt sind eine Setzung und bitte fachlich gegenzulesen.

## Corporate Design

30. **CI-Quelle:** Palette, Typo-Raster und Abstände sind verbindlich aus der
    SEIL-Präsentationsvorlage übernommen (siehe `DESIGN.md`). Die Statusfarben
    sind bewusst entsättigt ergänzt – sie sind nicht Teil der Präsentations-CI.
31. **Schrift:** Die Vorlage setzt Avenir Next (lizenzpflichtig); im Web ersetzt
    durch Inter, lokal gehostet. Freigabe durch SEIL steht aus.
32. **Logo:** Die Logo-Datei aus der Vorlage ist beschnitten und wird deshalb
    nicht angezeigt (typografische Wortmarke als Platzhalter). Auf seil.com liegt
    ein vollständiges SVG, aber nur in dunkler Farbe – für die dunkle Kopfleiste
    wird eine weiße SVG-Variante von SEIL benötigt („nie einfärben“-Regel).
