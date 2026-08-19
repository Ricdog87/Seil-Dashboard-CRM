# Annahmen – bitte im Kundengespräch klären

Der Auftrag ließ an einigen Stellen bewusst Spielraum. Hier sind alle Punkte, an denen
für den Prototyp eine Annahme getroffen wurde – jeweils mit der gewählten Umsetzung.

## Prozess & Statusmodell

1. **Benennung und Kurzform der Prozessschritte.** Die 6 + 6 Schritte aus dem Auftrag
   wurden übernommen; für die kompakte Prozessleiste wurden Kurzlabels gesetzt
   („Erstinfo“, „Agreement & Vollmacht“, „Freigabe Liste“ …). → `lib/mock-data.ts`
2. **Beide Seiten laufen sichtbar parallel.** Annahme: Die Investorenseite startet
   erst, wenn die Eigentümerseite (fast) abgeschlossen ist – die Prozessleiste zeigt
   aber immer beide Seiten. Ausnahme im Demodatensatz: der Logistikpark wird trotz
   einer Datenraum-Lücke bereits vermarktet (Nachlieferung läuft) – ob das real
   zulässig ist, bitte bestätigen.
3. **Antwortstatus je Investor-Kontakt** in 7 Stufen: Vorgemerkt → Keine Rückmeldung →
   Interesse / Preisanfrage → NDA unterzeichnet → Datenraum freigegeben → Abgesagt.
   Granularität und Benennung sind eine Setzung; ebenso die Annahme, dass jeder
   Investor **vor** der Datenraum-Freigabe ein Vermarktungs-NDA unterzeichnet.
4. **Follow-up-Automatik:** „nach 2 Tagen, bis zu 3 Stufen“ wurde als fester
   2-Tage-Rhythmus je Stufe interpretiert. Nach Stufe 3 ohne Antwort entsteht eine
   manuelle Nachfass-Aufgabe für den zuständigen Mitarbeiter (Annahme). Ein geplantes
   Follow-up gilt als überfällig, wenn sein Termin vor dem Referenztag liegt (etwa
   weil die Automatik angehalten wurde) – in den Demodaten kommt dieser Fall nicht
   vor, dort entsteht Handlungsbedarf durch die ausgeschöpfte Stufe 3.
5. **Antworterkennung:** Interesse erzeugt eine Aufgabe „Broker Call“ für den
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
    Quelle-Kennzeichnung am Objekt (Boardinghouse Europaviertel) und als
    Sync-Aktivität dargestellt. Welche Felder Se Circle liefert und in welche
    Richtung synchronisiert wird, ist offen.
21. **KI-Extraktion aus dem Datenraum** (Grundbuch, Mieterlisten): als
    „KI-ausgelesen“-Zeile in der Datenraum-Karte und als Aktivitäten mit
    Quelle „KI“ dargestellt. Das konkrete Feldmapping ins CRM ist offen.
22. **KI-generierte Teaser & Listings:** als Aktivität am Wohnportfolio
    dargestellt (Entwurf → menschliche Prüfung → Abstimmung mit Auftraggeberin).
    Ob die Prüfung verpflichtend sein soll, ist eine Annahme.
23. **Pipedrive-Migration:** Der einmalige Export/Import aus dem Angebot ist als
    Quelle-Tag am Investor („Pipedrive-Import“) dargestellt – ein eigener
    Import-Screen würde die Fünf-Screen-Grenze sprengen.
24. **Status-Reports via Telegram:** als Statuszeile auf der Übersicht angedeutet
    („heute 08:00 versendet“). Inhalt, Frequenz und Empfängerkreis sind offen.
25. **Presound-Mail an BCC-Verteiler:** Benennung aus dem Kickoff übernommen
    (Freigabe-Karte und Automatik-Zeile der Vermarktung).
26. **Distressed Assets:** Im Kickoff als Sonderfall mit typisch unvollständigen
    Unterlagen genannt – im Prototyp als Merkmal am Fachmarktzentrum (7/12
    Dokumente) dargestellt. Ob Distressed-Fälle eine eigene Prozessvariante
    brauchen, ist offen.
27. **Flexible Gestaltbarkeit:** Im Kickoff wurde gewünscht, dass das Dashboard
    Prozessänderungen erlaubt (z. B. Aufgaben verschieben, Schritte umsortieren).
    Das ist eine Eigenschaft des späteren Systems und im Klickdummy nicht
    abgebildet – die Prozessschritte sind hier bewusst fest verdrahtet.

## Corporate Design

28. **CI-Quelle:** Palette, Typo-Raster und Abstände sind verbindlich aus der
    SEIL-Präsentationsvorlage übernommen (siehe `DESIGN.md`). Die Statusfarben
    sind bewusst entsättigt ergänzt – sie sind nicht Teil der Präsentations-CI.
29. **Schrift:** Die Vorlage setzt Avenir Next (lizenzpflichtig); im Web ersetzt
    durch Inter, lokal gehostet. Freigabe durch SEIL steht aus.
30. **Logo:** Die Logo-Datei aus der Vorlage ist beschnitten und wird deshalb
    nicht angezeigt (typografische Wortmarke als Platzhalter). Auf seil.com liegt
    ein vollständiges SVG, aber nur in dunkler Farbe – für die dunkle Kopfleiste
    wird eine weiße SVG-Variante von SEIL benötigt („nie einfärben“-Regel).
