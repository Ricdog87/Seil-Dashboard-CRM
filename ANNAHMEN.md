# Annahmen – bitte im Kundengespräch klären

Der Auftrag ließ an einigen Stellen bewusst Spielraum. Hier sind alle Punkte, an denen
für den Prototyp eine Annahme getroffen wurde – jeweils mit der gewählten Umsetzung.

## Prozess & Statusmodell

1. **Prozessmodell aus der Team-Excel (19.08.).** Der Prototyp folgt der echten
   Liste „SEIL Transaction Process“: bereinigt 26 Schritte in 4 Phasen, je
   Schritt Verantwortung und heutiges Tool (Word/PDF, Excel, PowerPoint,
   Outlook, OneDrive, Pipedrive). Als Verantwortliche führt die Excel Client,
   Legal Team, Investment Team, Investment Team (India), Broker und Team.
   **Die indische Einheit gibt es nicht mehr** (bestätigt am 28.10.); ihre
   Schritte laufen im Prototyp unter „Investment Team“. Für die kompakte
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
   **objektzuständigen** Mitarbeiter (nicht für einen Pool). Preisanfragen werden
   nach dem Standardprozess Investorenkommunikation **nie schriftlich beantwortet**:
   Die Automatik versendet die Erstantwort-Vorlage und erzeugt die Aufgabe „Rückruf
   durch die Geschäftsführung“ beim Objektzuständigen, Leitung im BCC (bis 31.08.
   war im Prototyp eine Aufgabe ans Investment-Team hinterlegt, siehe Punkt 50).

## Freigabe (Human-in-the-Loop)

9. **Die Freigabe gilt für die ganze Liste,** nicht je Einzelkontakt, und wird vom
   objektzuständigen Mitarbeiter erteilt. Einzelne Kontakte vor Freigabe zu entfernen
   wäre eine sinnvolle Ergänzung – im Prototyp nicht umgesetzt.
10. **Abgleichkriterien der Investorenliste:** Assetklasse, Ticketgröße und Region als
   Matching-Dimensionen angenommen (so auch im Ankaufsprofil dargestellt).

## Datenraum / Modul 01

11. **Standard-Dokumentencheckliste mit 12 Positionen** (Grundbuchauszug, Mietverträge,
   Energieausweis, Altlastenauskunft …) ist eine plausible Setzung. Die echte
   Checkliste kommt aus Modul 01 und kann abweichen – ggf. auch je Assetklasse
   unterschiedlich.
12. **Schnittstellen-Annahme:** Modul 01 liefert je Dokument einen Status
   (vorhanden / in Prüfung / ausstehend) plus einen Stand-Zeitstempel. Im Prototyp
   ist das simuliert und überall mit „Modul 01“ gekennzeichnet.
13. **„Datenräume mit Lücken“** zählt nur angeforderte Datenräume mit unvollständiger
    Checkliste – ein noch gar nicht angeforderter Datenraum (Ärztehaus) zählt nicht
    als Lücke.

## Übersicht & Aufgaben

14. **KPI-Auswahl:** Die vier Kacheln (laufende Transaktionen, offene Aufgaben,
    Investoren ohne Rückmeldung, Datenräume mit Lücken) wurden aus dem Auftrag
    abgeleitet und als wichtigste Steuerungsgrößen angenommen.
15. **„Investoren ohne Rückmeldung“** = angeschriebene Kontakte ohne jede Antwort;
    „mit Handlungsbedarf“ = Follow-up überfällig oder Stufe 3 ausgeschöpft.
16. **Team-Modell:** Das Sales-/Investment-Team der Übersicht vom 19.10. mit
    **echten Namen, Rollen und Funktionen** (Punkt 55), dazu „Investment-Team“
    als zuweisbare Einheit für Preisanfragen. Ohne Kontaktdaten; zum GF-Konto
    siehe Punkt 43. **Alle Objekte, Auftraggeber und Investoren bleiben fiktiv** –
    echt ist nur, wer bei SEIL arbeitet, nicht womit.

## Struktur & Design

17. **Auftraggeber hat keinen eigenen Screen** (der Auftrag definiert genau fünf).
    Auftraggeber werden als Panel am Objekt-Detail dargestellt; als dritte Entität
    sind sie im Datenmodell aber vollwertig angelegt.
18. **Navigation:** Drei Menüpunkte (Übersicht, Vermarktung, Aufgaben); Objekt- und
    Investor-Detail sind nur über Verlinkungen erreichbar – bewusst keine
    zusätzlichen Listen-Screens.
19. **Vermarktungs-Screen** zeigt nur Objekte, deren Investorenseite gestartet ist
    (Auswahl per Dropdown); vorausgewählt ist das Objekt mit ausstehender Freigabe.
20. **Begriffe:** Der Denglisch-Mix aus dem Auftrag (Valuation, Broker Call, Listing,
    Teaser) wurde im UI beibehalten; Datums- und Zahlenformate sind deutsch
    („17,4 Mio. €“, „20.08.2026“).
21. **Referenzdatum:** Der Prototyp „lebt“ am 26.10.2026 (Montag) – Überfälligkeiten
    und „heute fällig“ beziehen sich auf dieses fixe Datum (`HEUTE` in
    `lib/mock-data.ts`). Vor dem Team-Workshop am 30.10. wurde der Stichtag vom
    31.08. um genau acht Wochen nachgezogen; die Verschiebung erfolgt immer in
    Vielfachen von sieben Tagen, damit die Wochentags-Dramaturgie erhalten bleibt
    (Pre-Sounding-Mails Montag 07:12, Follow-ups zum Wochenstart fällig, n8n-Cron
    `0 7 * * 1-5`). Die Weltuhren-Leiste und die tageszeitabhängige
    Begrüßung laufen dagegen bewusst live (Frankfurt · London · New York ·
    Dubai · Singapur) – Zonenauswahl bitte bestätigen.
22. **Demodaten-Dramaturgie:** Damit auf fünf Screens alle Zustände gleichzeitig
    sichtbar sind (Interesse, Preisanfrage, Absage, Stufe 1–3, Freigabe ausstehend,
    Datenraum-Lücken …), sind einzelne Zeitabstände in den Demodaten bewusst
    gestreckt und nicht in jedem Fall streng im 2-Tage-Raster.

## Integrationen & Automationen (aus Angebot AG2026-SEIL-03 und Kundentermin 17.08.)

Der Prototyp ist ein Klickdummy – alle folgenden Punkte sind **nur als Anzeige
simuliert**. Die echte Anbindung ist Umsetzungsteil von Modul 02 – mit Ausnahme
der ausdrücklich als **Ausbaustufe** markierten Punkte (Se Circle,
Profilanreicherung/Auto-Matching; siehe Punkte 23 und 46).

23. **Se Circle:** Im Kundentermin als zentrale Entscheidung benannt.
    **Scope-Klarstellung (Projektstand 28.08.):** Die Anbindung ist als
    Ausbaustufe nach der 8-Wochen-Umsetzung vorgesehen; das Zielsystem startet
    mit einem Se-Circle-**Statusfeld** am Objekt. Der Prototyp zeigt darüber
    hinaus, wie die spätere Anbindung aussehen könnte: als eigene Karte am
    Se-Circle-Objekt (Richtung, letzter Sync, synchronisierte Feldgruppen), als
    Sync-Aktivitäten und im Systemstatus der Übersicht – entsprechend
    gekennzeichnet. Welche Felder Se Circle konkret liefert und ob
    zurückgeschrieben wird, ist offen – angenommen ist ein täglicher Sync
    Se Circle → Cockpit.
24. **KI-Extraktion aus dem Datenraum** (Grundbuch, Mieterlisten): je Objekt als
    Feldliste mit Wert, Quelldokument und Prüfstatus dargestellt. Annahme: die
    Übernahme ins CRM bestätigt ein Mitarbeiter (Human-in-the-Loop, gleiche
    Philosophie wie die Listen-Freigabe); unsichere Werte (Staffelmieten,
    Flächenabweichung beim Distressed Asset) werden zur Prüfung markiert.
    Der Demo-Klick „Prüfen & übernehmen“ wirkt nur in der Sitzung.
25. **KI-generierte Teaser & Listings:** als Pipeline auf der Vermarktung
    dargestellt (KI-Entwurf → Prüfung durch das Team → Versand); beim
    Wohnportfolio wartet der geprüfte Teaser auf die Listen-Freigabe.
    Ob die Prüfung verpflichtend sein soll, ist eine Annahme.
26. **Pipedrive-Migration:** Der einmalige Export/Import aus dem Angebot ist als
    Quelle-Tag am Investor („Pipedrive-Import“) dargestellt – ein eigener
    Import-Screen würde die Fünf-Screen-Grenze sprengen.
27. **Status-Reports:** Im Angebot enthalten („Status-Reports“, dort mit
    Telegram nur als Beispiel genannt); im Kundentermin wurde kein Kanal besprochen.
    Die Anzeige ist deshalb bewusst kanalneutral („Status-Report heute 08:00 an
    das Team versendet“). Kanal, Inhalt, Frequenz und Empfängerkreis sind im
    Kundengespräch festzulegen.
28. **Presound-Mail an BCC-Verteiler vs. KI-personalisierte Ansprache:** Das
    Angebot nennt eine „KI-personalisierte Ansprache mit Freigabe-Workflow“, im
    Kundentermin wurde der heutige Ist-Prozess als Presound-Mail an einen
    BCC-Verteiler beschrieben. Der Prototyp zeigt den Versand als Sammelmail
    (Benennung aus dem Kundentermin) – ob die Ansprache künftig je Investor
    KI-personalisiert erzeugt und einzeln freigegeben wird, ist zu klären; das
    verändert Freigabe-Granularität und Datenmodell.
    **Präzisierung E-Mail-Abgleich (Projektstand 28.08.):** Der Mail-Sync läuft
    über die **gemeinsame Sales-Adresse** (BCC-Sync). Einbezogen werden die
    Postfächer des Investment-Teams; die Postfächer von Maximilian Seil und Nino
    Grubisic ausdrücklich **nicht**. Die Automatik deckt die drei Szenarien aus
    dem Angebot ab (Response, Preisanfrage, kein Rücklauf) – inklusive
    automatischer Eingangsbestätigung bei eingehenden Antworten. Der einzige
    Human-in-the-Loop-Schritt im Versandprozess ist die Listen-Freigabe
    (Punkt 9); alles danach läuft automatisch.
29. **Distressed Assets:** Im Kundentermin als Sonderfall mit typisch unvollständigen
    Unterlagen genannt – im Prototyp als Merkmal am Fachmarktzentrum (7/12
    Dokumente) dargestellt. Ob Distressed-Fälle eine eigene Prozessvariante
    brauchen, ist offen.
30. **Flexible Gestaltbarkeit:** Im Kundentermin wurde gewünscht, dass das Dashboard
    Prozessänderungen erlaubt. Im Klickdummy demonstriert: Aufgaben lassen sich
    neu zuweisen, um 2 Tage verschieben und abhaken (nur in der Sitzung,
    „Zurücksetzen“ stellt den Stand wieder her). Das Umsortieren der
    Prozessschritte selbst bleibt dem echten System vorbehalten – die Schritte
    sind hier bewusst fest verdrahtet.
31. **Board-Ansicht:** Die Übersicht bietet zusätzlich zur Tabelle ein Board
    mit **4 Spalten = die 4 Phasen der Team-Excel** („Mandat & Bewertung“ bis
    „Angebote & Reporting“). Jede Karte hängt in der Phase ihres weitesten
    laufenden Schritts. Karten folgen dem Prozessstatus – ein manuelles
    Verschieben von Karten wäre im echten System eine Statusänderung und ist
    im Klickdummy bewusst nicht simuliert.
32. **Interaktiver Prozess:** „Das Dashboard soll den gesamten
    Transaktionsprozess interaktiv abbilden“ (Kundentermin) ist als klickbare
    Prozessleiste umgesetzt: jeder Schritt öffnet ein Detailpanel mit
    Beschreibung, Verantwortung (Team / Automatik / manuelle Freigabe) und –
    beim aktiven Schritt – offenen Aufgaben und letzten Aktivitäten. Die
    Texte je Schritt sind eine Setzung und bitte fachlich gegenzulesen.

## Corporate Design

33. **CI-Quelle:** Palette, Typo-Raster und Abstände sind verbindlich aus der
    SEIL-Präsentationsvorlage übernommen (siehe `DESIGN.md`). Die Statusfarben
    sind bewusst entsättigt ergänzt – sie sind nicht Teil der Präsentations-CI.
34. **Schrift:** Die Vorlage setzt Avenir Next (lizenzpflichtig); im Web ersetzt
    durch Inter, lokal gehostet. Freigabe durch SEIL steht aus.
35. **Logo:** Die Logo-Datei aus der Vorlage ist beschnitten und wird deshalb
    nicht angezeigt (typografische Wortmarke als Platzhalter). Auf seil.com liegt
    ein vollständiges SVG, aber nur in dunkler Farbe – für die dunkle Kopfleiste
    wird eine weiße SVG-Variante von SEIL benötigt („nie einfärben“-Regel).

## Täglicher Arbeitsmodus (Pipedrive-Ablösung)

36. **„Arbeiten als“ statt Login:** Der Umschalter in der Kopfleiste simuliert
    die Anmeldung und personalisiert Übersicht, Aufgaben und Notiz-Autor. Im
    echten System ersetzt ihn ein Login; Rollen/Rechte (wer sieht was, wer darf
    freigeben) sind offen.
37. **Posteingang der Antworterkennung:** Erkannte Antworten (Interesse,
    Preisanfrage, Besichtigungswunsch, Rückfrage, Absage) landen als Signale im
    Posteingang der Übersicht. Standardfälle verarbeitet die Automatik selbst
    (sichtbar als „verarbeitet“); alles andere wird per Klick zur Aufgabe.
    Annahme: Diese Zweiteilung – Automatik für Standardfälle, Mensch für den
    Rest – bitte bestätigen.
38. **Globale Suche (⌘K/Strg+K):** durchsucht im Prototyp Objekte, Investoren
    und offene Aufgaben. Ob produktiv auch Volltext über Aktivitäten,
    Kommunikation und Datenraum-Dokumente gesucht werden soll, ist offen.
39. **Notizen am Objekt:** direkt in der Historie erfassbar (im Prototyp nur
    für die Sitzung). Ob Notizen auch am Investor und am Auftraggeber erfasst
    werden sollen, ist offen.

40. **Aufgaben-Board (Kanban):** Die Spalten sind bewusst Fälligkeits-Horizonte
    (Heute inkl. Überfälligem, Morgen, Später, Erledigt), keine Prozessphasen –
    eine Karte ziehen heißt umplanen, „Erledigt“ heißt abhaken. Beim Zug nach
    „Später“ setzt der Prototyp den frühesten Tag des Horizonts; das echte
    System würde nach einem Datum fragen. Die Prozess-Schritte der
    Transaktionen sind absichtlich **nicht** per Drag & Drop verschiebbar:
    Das wäre eine Statusänderung mit Folgewirkungen (Freigaben, Automatik)
    und gehört mit Regeln ins echte System.
41. **Mobilnutzung:** Das Cockpit ist als responsive Web-Oberfläche auch am
    Smartphone lesbar und bedienbar – Anlass: mindestens ein Teammitglied
    arbeitet ausschließlich mobil. Die Kopfleiste bricht in zwei Zeilen,
    Board-Spalten stapeln untereinander, breite Tabellen scrollen innerhalb
    ihrer Karte seitlich. Weil es Drag & Drop auf Touchscreens nicht gibt,
    öffnet das Griff-Symbol jeder Board-Karte ein „Verschieben nach …“-Menü
    (gleiche Wirkung wie Ziehen); die Suche öffnet mobil über das
    Lupen-Symbol. Annahme: Eine responsive Web-App genügt – keine native
    App, kein separates Mobil-Layout mit reduziertem Funktionsumfang.
42. **Bewegung (Motion-Design):** Das Cockpit nutzt dosierte Bewegung im Stil
    eines Handelsterminals – Aktivitäten-Ticker auf der Übersicht, hochzählende
    KPI-Zahlen, sich zeichnende Sparklines, sanft pulsierende laufende
    Prozessschritte, kurz aufpoppende Zähler. Alles dient der Orientierung
    (was ist neu, was läuft), nichts ist Dekoration; Dauer 150–450 ms, der
    Ticker läuft langsam und pausiert bei Hover. Nutzer mit „Bewegung
    reduzieren“ im Betriebssystem sehen das Cockpit vollständig statisch
    (prefers-reduced-motion). Annahme: Diese Dosierung ist gewollt – mehr
    Effekte (z. B. animierte Diagramme, Parallax) bitte nur auf expliziten
    Wunsch.
43. **GF-Konto (Maximilian Seil) mit eigenem Dashboard:** „Arbeiten als“ Maximilian Seil
    schaltet die Übersicht auf eine **rein lesende Geschäftsführungs-Sicht**:
    Projektsummen (Pipeline gesamt, in aktiver Vermarktung), Honorarpotenzial,
    Antwortquote, Projektsummen je Prozessphase, Vermarktungs-Funnel, alle
    Mandate nach Volumen, Risiken („Braucht Aufmerksamkeit“) und die
    Auslastung im Team. Kein Posteingang, keine Aufgabenliste, keine
    Eingabemöglichkeiten – der GF trägt nichts ein; er taucht deshalb auch
    nicht im Aufgaben-Filter oder in der Zuweisung auf, und die Notiz-Erfassung
    ist in seiner Sicht ausgeblendet. Zwei Annahmen dazu: (a) Das
    **Honorarpotenzial ist eine reine Modellrechnung mit 1,5 %** auf die
    Pipeline – der echte Satz (und ob je Mandat individuell) ist mit SEIL zu
    klären. (b) Im echten System wird diese Rollen-Sicht über Login/Rechte
    gesteuert, nicht über den Umschalter.
44. **Anpassungen aus dem Demo-Check (20.08., 11:30, mit Nino):** Die
    Automatisierung des Transaktionsprozesses hat oberste Priorität und ist im
    Prototyp als **Automatik-Kette** auf der Vermarktung sichtbar (Datenraum
    einlesen → Matching → E-Mails vorbereiten → Freigabe → Versand &
    Follow-ups → Antworterkennung; einziger manueller Stopp: die Freigabe).
    Konkrete Setzungen daraus, bitte bestätigen:
    - **Matching, Standort zuerst:** Der Abgleich prüft Standort, dann
      Assetklasse, dann Ticket-Spanne. Da alle Demo-Objekte im
      Rhein-Main-Gebiet liegen, gilt der Standort bei den regionalen
      Obermengen (Rhein-Main, Hessen, Deutschland, Top-7, DACH) als
      getroffen – die echte Geometrie (PLZ/Radius?) ist offen. Kein voller
      Treffer schließt nicht aus: solche Kontakte sind als „manuell ergänzt“
      markiert – das System bleibt für menschliche Eingriffe offen.
    - **Anforderungsprofile im CRM:** Zielregionen und Ticket sind direkt am
      Investor editierbar (keine externen Excel-Tabellen); das Matching in
      der Vermarktung zieht live mit. Prototyp: nur für die Sitzung.
    - **Zielregionen-Rückfrage im Follow-up:** Stufe 2 und die
      Absage-Bestätigung fragen aktiv nach aktuellen Zielregionen; erkannte
      Antworten erscheinen als „Profil-Update“ im Posteingang und
      aktualisieren das Ankaufsprofil automatisch (Demo: Rückfrage, Antwort
      und Profil-Übernahme am Beispiel einer Absage mit neuem
      Regionswunsch).
    - **WhatsApp über Superchat:** Follow-ups laufen zusätzlich als WhatsApp
      über eine professionelle Lösung (Superchat, datenschutzkonform, keine
      privaten Accounts). Die Eignungsprüfung von Superchat ist laut Meeting
      noch offen – im Prototyp nur als Kanal-Anzeige simuliert.
    - **Backoffice-Verantwortung:** Administrative Vorbereitung (Rent Roll,
      Standarddokumente, Datenraum-Aufbau, Fotograf) liegt beim Backoffice –
      in der Prozessleiste als eigene Verantwortung sichtbar. Der
      NDA-**Versand** ist als Hinweis am Schritt „NDA Vermarktung“ vermerkt;
      das Drafting bleibt beim Legal Team (Verantwortung „Extern“). Der
      Vertrieb übernimmt erst ab konkretem Interesse.
    - **Neuer Vertriebs-Mitarbeiter nicht als Nutzer angelegt:** Die im
      Meeting vorgestellte operative Unterstützung im Vertrieb ist bewusst
      **nicht** als echte Person im Prototyp – Namensregel wie bei allen
      echten Personen; auf ausdrücklichen Wunsch ergänzbar (wie Nino/Max).

## Projektstand-Abgleich (28.08.)

45. **Begriffe & Zeitplan:** Der Termin am 17.08. war ein Kundentermin
    (Vorgespräch) – in diesem Repository durchgängig so benannt. Der
    vertragliche **Kickoff-Workshop** zu Modul 02 steht noch aus; die
    8-Wochen-Umsetzung beginnt mit dem Kickoff-Workshop, nicht mit den
    Vorgesprächen.

46. **Ausbaustufen – nicht im 8-Wochen-Scope:** Investoren-**Profilanreicherung**
    und **automatisches Matching** (Objekt ↔ Ankaufsprofil) sind produktiv als
    Ausbaustufe vorgesehen, ebenso die **Se-Circle-Anbindung** (Punkt 23).
    Im Prototyp bleiben Matching-Spalte, Profil-Pflege und die Matching-Stufe
    der Automatik-Kette auf Wunsch aus dem Demo-Check (Punkt 44) sichtbar –
    sie zeigen den **Zielzustand** der Ausbaustufe. Für die 8-Wochen-Umsetzung
    gilt: Die Investorenliste je Objekt erstellt das Team, Ankaufsprofile
    werden manuell gepflegt. Die Priorisierung (Demo-Check: „Matching als
    Kernstück“ vs. Scope der Beauftragung) bitte im Kickoff-Workshop
    festhalten.

47. **Zweiteilung des Prozesses in der UI:** Der Transaktionsprozess ist
    zweigeteilt – erst Auftraggeber-/Eigentümerseite, dann Investorenseite –
    und soll so in der UI erscheinen. Umsetzung im Prototyp: Die Prozessleiste
    gruppiert die 4 Phasen der Team-Excel unter zwei Seiten-Überschriften,
    **„Auftraggeberseite“** (Phasen 1–2, Schritte 1–14) und
    **„Investorenseite“** (Phasen 3–4, Schritte 15–26). Die Grenze liegt am
    Freigabe-Schritt 14 (Approach-Mailing) – konsistent mit Punkt 19
    („Investorenseite gestartet“). Zuordnung und Benennung („Auftraggeber-“
    vs. „Eigentümerseite“) bitte bestätigen.
48. **Beschlüsse aus dem Update-Call (28.08., mit Nino und dem Vertrieb):**
    - **Server-Migration beschlossen:** Die n8n-Instanz (läuft derzeit auf
      RSG-Infrastruktur) wird zeitnah in die Domain der SEIL Group
      übertragen. Voraussetzung für den Live-Gang der Automatik ist der
      Office-365-/IMAP-Zugang – der entsteht mit der Entkopplung vom
      bisherigen IT-Dienstleister durch den neuen Dienstleister
      (3-Monats-Testphase vereinbart). Laut Geschäftsführung hat die
      Lösung des Onboarding-/Tenant-Migrations-Themas oberste Priorität;
      bis dahin keine Tests mit Demodaten auf der Automatik (doppelte
      Arbeit, unnötige Kosten – Konsens im Call).
    - **Workshop zur Prozess-Feinabstimmung** nach IT-Migration und
      Live-Gang. Dort werden insbesondere die im Call benannten Lücken der
      Automatik-Kette geschlossen: NDA-Handling, Datenraum-Freigaben und
      Broker-Benachrichtigungen als eigene Glieder bzw. Verfeinerungen.
    - **Reporting als Exportprodukt:** Der Statusbericht soll unkompliziert
      direkt aus dem Dashboard exportierbar sein und als HTML-Produkt an
      die Automatik angebunden werden. Im Prototyp umgesetzt als
      „Bericht exportieren (HTML)“ auf Übersicht und GF-Blick – erzeugt
      eine eigenständige HTML-Datei im SEIL-CI mit den Live-Zahlen der
      Sitzung; produktiv erzeugt und versendet die Automatik denselben
      Bericht werktäglich 08:00. Die Reporting-Vorlage von SEIL steht noch
      aus und kann Layout/Inhalte ändern.
    - **Ausstehende Unterlagen von SEIL:** Prozess-Excel (mehrere Reiter),
      dokumentierter Standard-Kommunikationsprozess, Reporting-Info/HTML –
      Input für die Verfeinerung der Workflows vor dem Workshop.

## Unterlagen vom 31.08. (Flowchart & Standardprozess)

49. **Zwei SEIL-Dokumente eingetroffen und eingearbeitet – nur die
    Struktur, keine Inhalte:** Am 31.08. lagen das
    Transaktionsprozess-Flowchart (der Prozess, den SEIL als Referenz für
    die Automatik autorisieren soll) und der dokumentierte Standardprozess
    Investorenkommunikation (Entscheidungstabelle, Stand 09/2024) vor.
    Konsequenzen und bewusste Abgrenzungen:
    - **Flowchart-Deltas zum bisherigen Modell:** (a) Vor dem Broker Call
      sitzt ein telefonischer Erstkontakt durch ein **Call-Center**
      (Standardfragen), eröffnet durch ein **Kickoff-Briefing**
      (Teams-Termin) – bislang nicht in der Automatik-Kette abgebildet,
      als Workshop-Thema vorgemerkt (eigenes Glied bzw. Aufgaben-Route in
      WF 06). (b) **Aktivitäten-Logging** im CRM ist im Flowchart
      explizit – deckt sich mit der Aktivitäten-Historie des Prototyps.
      (c) Am Matching-Schritt steht eine offene **„Excel?“-Anmerkung** –
      die Lücke, die Ankaufsprofile im CRM + WF 02 schließen sollen.
      (d) Das Flowchart endet am Broker Call – die Kette deckt den
      gezeichneten Prozess damit vollständig ab.
    - **Standardprozess → WF 05/06:** Die Stufenlogik (zwei feste
      Vorlagen, danach alternierend, Abschluss mit Final-Mail; Leitung
      optional im BCC) steckt jetzt in WF 05; der Entscheidungsbaum
      (Absage → Kriterien-Rückfrage, Kriterien erhalten → Übergabe +
      Termin, Preisanfragen nur telefonisch durch die Geschäftsführung,
      Unterlagen-Anfragen mit drei Unterfällen, Telefonwunsch-Routing,
      Besichtigungs-Ablauf mit Kalendereintrag) in WF 06. Die
      Absage-Rückfrage bestätigt nachträglich die im Prototyp erzählte
      Zielregionen-Geschichte (Punkt 44).
    - **Vorlagentexte bewusst nicht übernommen:** Die Mail-Vorlagen,
      Namen und Postfach-Adressen aus dem Standardprozess-Dokument
      bleiben außerhalb des Repositorys (Namensregel Punkt 16). Beim
      Setup wandern die Vorlagen als Einträge in den n8n-Data-Store,
      Quelle ist das SEIL-Dokument selbst.
    - **⚠ Diskrepanz Follow-up-Stufen (Workshop-Frage):** Angebot und
      Demo-Check sagen „alle 2 Tage, maximal 3 Stufen“; das
      Standardprozess-Dokument beschreibt eine offene Follow-up-Kette mit
      abschließender Final-Mail. WF 05 ist auf maximal 3 Stufen
      voreingestellt (pro Kampagne überschreibbar); die verbindliche
      Regel legt der Workshop fest.
    - **Neu: WF 07 Status-Bericht** ergänzt die Kette als flankierenden
      Workflow (werktäglich 08:00, HTML-Bericht im SEIL-CI an
      Geschäftsführung + Leitung Vertrieb) – die produktive Seite des
      „Bericht exportieren“-Knopfs aus Punkt 48; Layout wird an die noch
      ausstehende Reporting-Vorlage von SEIL angeglichen.

50. **Nachschärfung 01.09. – Zeile-für-Zeile-Abgleich mit dem Standardprozess,
    technische Härtung der Skelette:**
    - **Ein Versandpunkt:** WF 05 ist der einzige Workflow, der an Investoren
      und Verkäuferseite versendet. WF 06 (Antworten) und WF 08
      (Besichtigung) übergeben Versandaufträge mit Vorlagen-Schlüssel;
      Freigabe-Prüfung, BCC-Regel (Leitung Vertrieb) und Protokoll sitzen an
      einer Stelle. **Bitte bestätigen:** Standard-Antworten nach
      Standardprozess gehen automatisch hinaus (Schalter
      `antwortenAutomatisch`; Alternative: Entwurf zur Bestätigung).
    - **Rückkopplung:** Nach beantworteter Anfrage und nach der
      Absage-Rückfrage startet die Follow-up-Kette neu („2 Tage später
      nachfassen“ laut Tabelle) – bislang endete sie in WF 06.
    - **Preisanfragen** sind eine Mini-Sequenz (Erstantwort, Rückruf durch
      die Geschäftsführung, Folge-Aufgabe „Gespräch stattgefunden?“, bei
      Wiederholung feste Vorlage „nur telefonisch“). Im Prototyp ersetzt das
      die frühere Aufgabe ans Investment-Team (Punkt 8 angepasst); der
      Rückruf wird vom Objektzuständigen koordiniert, Leitung im BCC.
    - **Besichtigung** als eigener Workflow 08 mit Zustand (Warten auf die
      Verkäuferseite, Terminbestätigung, Kalendereintrag nach
      Titelkonvention); benötigt nach dem Office-365-Umzug die Anbindung des
      zentralen Vertriebskalenders.
    - **Cockpit-Posteingang** kennt jetzt dieselben Kategorien wie die
      Automatik (Unterlagen-Anfrage, Telefonwunsch ergänzt; je ein
      verarbeitetes Demo-Signal mit Historie).
    - **Technik:** Switch-Nodes auf Version 3.2 (Version 1 hat fest vier
      Ausgänge, das Routing braucht acht), Code-Nodes verarbeiten alle Items
      eines Laufs, Send-Email-Parameter korrigiert (BCC unter Optionen,
      HTML-Format explizit). Ohne diese Korrekturen wäre der Import zwar
      gelungen, das Routing aber stumm falsch gelaufen.

## Anbindung Modul 01 (01.09.)

51. **Modul 01 ist an das Cockpit angedockt – als Leseweg, nicht als Kopie:**
    - **Ein Schreibweg, ein Leseweg:** Modul 01 schreibt über WF 01 in die
      Ablage `datenraum_status`; das Cockpit liest über WF 09 und eine
      serverseitige Route. Das Cockpit schreibt nichts zurück nach Modul 01.
    - **Zuordnung per Umgebung:** Welcher Datenraum zu welchem Mandat gehört,
      steht in `MODUL01_OBJEKT_MAP` (Server-Umgebung) – echte Kennungen und
      Namen bleiben damit außerhalb des Repositorys. Fallback: passt die
      Kennung direkt zur Cockpit-ID, wird sie ohne Mapping zugeordnet.
    - **„Create deal“ (Nino, 28.08.):** Ein Datenraum ohne Mandat im Cockpit
      wird produktiv von WF 01 als Deal angelegt (Objekt-Block im Vertrag). Im
      Prototyp zählt der Systemstatus solche Datenräume nur („ohne Mandat im
      Cockpit“) – anlegen braucht die Produktivbasis (Datenbank).
    - **Was live wird:** ausschließlich Datenraum-Checkliste und KI-Kennwerte
      (Übernahme ins CRM bleibt Human-in-the-Loop, Punkt 44). Kontakte,
      Aufgaben, Aktivitäten bleiben Demodaten – Datenraum-Freigaben je Investor
      sind im Vertrag vorgesehen, die UI dazu ist Workshop-Thema (Punkt 48).
    - **Betrieb:** Abruf alle 5 Minuten, Zeitlimit 4 s; bei Fehler oder
      fehlender Konfiguration fällt das Cockpit sichtbar auf Demodaten zurück
      (Systemstatus „nicht erreichbar“ bzw. „Demo-Daten“). Secret nur im
      Header `X-Seil-Secret` zwischen Server und n8n.
    - **Status-Vokabular:** Modul 01 darf eigene Begriffe liefern (ok, done,
      review, fehlt …) – WF 01 und die Cockpit-Route bilden tolerant auf
      vorhanden / in Prüfung / ausstehend ab; Unbekanntes gilt als ausstehend.

## Sales-Prozess-Update (28.09.) und Teamübersicht (19.10.)

52. **Beschlüsse aus dem Sales-Update mit Leitung Sales, Head of Sales und
    Transaction Management – im Prototyp umgesetzt:**
    - **Sammelfreigabe statt Einzelfreigabe:** Mail-Entwürfe werden gesammelt
      im Dashboard freigegeben, über alle Mandate hinweg. Das Vier-Augen-Prinzip
      bleibt (Human in the Loop, ausdrücklich mit Blick auf den EU AI Act), nur
      der Klickaufwand sinkt. Umgesetzt als Freigabe-Karte auf der Übersicht;
      WF 04 nimmt eine Liste von Entwürfen entgegen und teilt sie in einzelne,
      je Entwurf protokollierte Versandaufträge auf.
    - **Keine gespeicherten Ankaufsprofile – die Liveliste ist die Wahrheit:**
      Laut Head of Sales pflegt der Vertrieb keine festen Profile, sondern eine
      **täglich aktualisierte Investorenliste in OneDrive**, die unter anderem
      die **letzten Ankäufe** je Investor enthält. Diese Liste ist die
      Vorselektion fürs Matching. Im Cockpit heißt die Karte weiter
      „Ankaufsprofil“, weist aber die Liveliste als Quelle samt Stand aus und
      zeigt die letzten Ankäufe. WF 02 nimmt die Liveliste entgegen; „zuletzt
      Vergleichbares gekauft“ geht als Zusatzsignal in die Sortierung ein,
      ersetzt aber nie die drei harten Kriterien (Standort, Assetklasse,
      Ticket). **Offen:** Feld-Mapping an einem echten Auszug der Liste.
    - **Drei Sichtebenen statt zwei:** Staff sieht die eigenen Mandate, die
      Sales Leadership zusätzlich eine Portfolio-Ebene über alle Mandate
      (Volumen, wartende Freigaben, Auslastung je Person), die Geschäftsführung
      weiterhin den rein lesenden Zahlen-Blick. Der „Arbeiten als“-Umschalter
      gruppiert nach diesen Ebenen.
    - **Tagesprioritäten für die Morgenabstimmung:** Je Person ein bis zwei
      Prioritäten, abhakbar, in der Portfolio-Ebene gebündelt – damit
      Priorisierungsänderungen im Tool statt im Kalender landen.
    - **Mehrere Ansprechpartner je Objekt:** Besichtigungen laufen oft über
      Hausverwaltung oder Hausmeister, Unterlagen über eine andere Person.
      Das Objekt führt jetzt mehrere Kontakte mit Rolle und Kennzeichen
      „extern“; die Besichtigungs-Automatik (WF 08) schreibt den dort
      hinterlegten Kontakt an.
    - **Datenraum Light und Full:** Modul 01 teilt den unsortierten
      Kunden-Datenraum nach SOP in zwei Stufen – Light für die erste Ansprache,
      Full nach NDA. Die Stufe steht im Datenraum-Vertrag (WF 01) und als
      Kennzeichen an der Datenraum-Karte.
    - **Persönliche Kommunikation bleibt manuell:** Direkter Kundenaustausch
      und Verhandlungen werden ausdrücklich nicht automatisiert.

53. **Teamübersicht vom 19.10. – zunächst nur die Struktur:** Die gelieferte
    Rollen- und Berichtsstruktur (drei Bereiche Management, Sales Leadership und
    Staff; je Person Rolle und Funktion wie Buyer Communication, Valuation,
    Data Room Management, Deal Reporting) wurde vollständig abgebildet, die
    Personennamen zunächst nicht. **Überholt durch Punkt 55** – die echten
    Namen sind inzwischen freigegeben und gesetzt.

54. **Noch offen aus dem Sales-Update:** Team-Auswertung über die
    Portfolio-Ebene hinaus (Auswertung je Zeitraum) ist als V2 benannt und
    nicht gebaut. Ebenfalls offen: die Integration der **Auftraggeber-
    kommunikation** (Vorschlag der Leitung Sales) und der Umgang mit dem
    vollständigen 33-Schritte-Prozess – im Prototyp sind 26 Schritte
    abgebildet (Punkt 2), die Reduktion wurde im Termin kritisch angemerkt.

55. **Echte Namen im Prototyp – auf ausdrückliche Weisung:** Vor dem Workshop am
    30.10. wurde entschieden, dass sich jeder im Team wiederfinden soll. Gesetzt
    sind deshalb die echten **Namen, Rollen, Funktionen und Bereiche** des
    Sales-/Investment-Teams aus der Übersicht vom 19.10.

    **Bewusst nicht übernommen:** E-Mail-Adressen, akademische Abschlüsse,
    Firmensitz und Handelsregisternummer. Das Cockpit liegt ohne Anmeldung
    öffentlich erreichbar und das Repository auf GitHub; neun echte Postfächer
    wären dort abgreifbar. Für die Wiedererkennung genügen Name, Kürzel und
    Rolle. Adressen gehören produktiv ins Verzeichnis des Mandanten, nicht in
    Demodaten.

    **Drei Punkte, die beim Übertragen aufgefallen sind:**

    - *Nino Grubisic steht nicht in der Übersicht.* Sie führt allein Maximilian
      Seil als Geschäftsführung. Da Nino das Projekt auf Kundenseite führt,
      bleibt sein Konto bestehen – ist aber eine Setzung und keine Ableitung
      aus dem Dokument.
    - *Die Analystenstelle wird als offen geführt.* Die Übersicht führt sie mit
      Stand 19.10. besetzt, die Geschäftsführung hat am 26.10. mitgeteilt, dass
      es keinen Analysten mehr gibt. Entschieden: Rolle und Aufgaben bleiben,
      der Personenname entfällt (`unbesetzt: true`). Die Team-Tafel weist
      „Stelle offen“ aus, der Umschalter nennt die Rolle statt eines Namens.
      Damit zeigt das Cockpit genau die Arbeit, die gerade niemand übernimmt –
      und das ist die Liste, die die Automatik tragen muss.
    - *Zwei Sammelpostfächer als eigener Bereich.* Die Übersicht führt unter
      „Backoffice“ ein Sammelpostfach für Investorenanfragen und einen
      Sales-Verteiler. Das beantwortet eine bislang offene Frage: Antworten
      laufen nicht in persönliche Postfächer, sondern in ein Sammelpostfach –
      genau das, was WF 06 (Antworterkennung) liest und WF 05 (Versand) als
      Absender braucht. Die Adressen gehören in den n8n-Credential-Store, nicht
      ins Repository. Für den IT-Termin ist damit geklärt, **welches** Postfach
      freigegeben werden muss.

56. **Repository und Demo-Seite bleiben öffentlich – bewusste Entscheidung:**
    Mit den echten Personendaten wurde geprüft, ob das GitHub-Repository auf
    privat gestellt werden soll. Entschieden wurde dagegen: Repository und
    Vercel-Deployment bleiben öffentlich erreichbar, damit Geschäftsführung und
    Team ohne Hürde zugreifen können.

    **Was das bedeutet:** Name, Kürzel, Rolle und Funktion der Personen aus der
    Übersicht vom 19.10. sind öffentlich einsehbar – im Repository zusätzlich in
    der Git-Historie, die eine spätere Korrektur nicht mehr entfernt. Keine
    Kontaktdaten, keine Abschlüsse, keine Firmenstammdaten (Punkt 55); zwei
    Prüfläufe sichern das ab.

    **Umkehrbar bleibt:** die Sichtbarkeit des Repositorys (GitHub → Settings →
    Change repository visibility) und der Zugriff auf die Seite (Vercel
    Deployment Protection). Die Historie bleibt davon unberührt – wer die Daten
    nachträglich entfernen will, braucht ein Umschreiben der Historie oder ein
    neues Repository.

57. **Abgleich mit den vier SEIL-Originaldokumenten (28.10.):** Gegengelesen
    wurden das Transaction-Process-Flowchart, der Standardprozess
    Investorenkommunikation (korrigierte Fassung), die SOP „Anlage und
    Standardisierung eines SEIL REAL ESTATE Datenraums“ und die
    Terminologie-Tabelle „Datenraum System“, beide vom 18.02.2026.

    **Korrigiert, weil es dem Original widersprach:**

    - *Zeitpunkt der Datenraum-Stufen.* Der Prototyp beschriftete Light als
      Stufe „für die erste Ansprache“ und Full als „nach NDA“. Die SOP sagt
      etwas anderes: **Light geht raus, nachdem das NDA unterzeichnet ist**,
      Full typischerweise **nach Abgabe eines indikativen Angebots**. Die
      Reihenfolge in der Prozessleiste (18 Light → 19 indikatives Angebot →
      21 Full) war bereits richtig, nur Typ, Karte und Workshop-Unterlage
      sagten das Gegenteil. Nachgezogen.
    - *Dokumentliste.* `STANDARD_DOKUMENTE` enthielt zwölf frei erfundene
      Bezeichnungen. Ersetzt durch die **20 Kategorien der SOP** mit deren
      Ordnernamen. Zuvor fehlten Denkmalschutz, Bilder, Mietrückstände,
      Grundsteuer, Brandschutz, Wartungs- und Serviceverträge und Gutachten;
      zusammengelegt war, was die SOP trennt (Altlasten/Baulasten,
      Grundrisse/Ansichten/Schnitte); erfunden waren „Instandhaltungs- und
      Capex-Historie“ und „Jahresabrechnung / BWA“.
    - *Light ist ein Auszug, keine eigene Struktur.* Die Terminologie-Tabelle
      benennt die **elf** Kategorien des Light-Datenraums. `LIGHT_KATEGORIEN`
      bildet sie ab; die Datenraum-Karte zeigt im Light-Zustand nur diese elf.
    - *Schwärzung.* SOP 1.1 verlangt, eigentümerbezogene Informationen vor
      Bereitstellung des Light-Datenraums zu schwärzen oder zu entfernen. Das
      kam im Prototyp nicht vor. Jetzt als Zustand `schwaerzung` am Datenraum
      und als sichtbarer Vorbehalt an der Karte – ein Freigabe-Tor, kein
      Hinweis: ohne diesen Schritt geht der Light-Datenraum mit
      Eigentümerdaten raus.

    **Bestätigt, stimmt überein:** 15 der 17 Flowchart-Kästen sind als
    Schritte 1–17 abgebildet, mit den englischen Originalbezeichnungen. Die
    Follow-up-Logik des Standardprozesses (Stufe 1 und 2 feste Vorlagen,
    weitere alternierend, Final-Mail) steckt unverändert in WF 05. Preisanfragen
    werden nie schriftlich beantwortet, bei erneuter schriftlicher Anfrage
    greift die Vorlage „Auskunft nur telefonisch“. Die BCC-Regel und die
    Besichtigungskette samt Kalendertitel „BES mit …“ entsprechen der Vorlage.

    **Am 28.10. entschieden:**

    - *Call-Center entfällt.* Die beiden Flowchart-Kästen „Kickoff with Call
      center“ und „Phone Call (Standard Process / Questions)“ gehören nicht zum
      Umfang. Damit bildet der Prototyp 15 der 17 Kästen ab, und die fehlenden
      zwei sind eine Entscheidung, kein Rückstand.
    - *Preisauskunft wird je Mandat hinterlegt.* Die korrigierte Excel enthält
      zwei Varianten – eine verweist auf die Geschäftsführung, eine auf den
      Partner (Head of Sales). Keine von beiden ist generell richtig: Die Excel
      begründet beide gleich („kümmert sich persönlich um **dieses** Mandat“),
      es ist also eine Eigenschaft des Mandats, nicht des Prozesses. Umgesetzt
      als `preisauskunftId` am Objekt. **Regelfall ist der Head of Sales**, weil
      die Funktion laut Teamübersicht Seller Communication und Deal Execution
      trägt und 50–80 parallele Verkaufsvorhaben nicht über einen einzigen
      Geschäftsführer laufen können; die Geschäftsführung bleibt die Ausnahme
      für persönlich betreute Mandate. WF 06 wählt Vorlage und Rückruf-Aufgabe
      danach aus.
    - *Dritter Dokumentzustand gebaut.* `unklar` nach SOP 8.1: Das Dokument
      liegt im richtigen Ordner, eine Angabe im Dateinamen ist UNBEKANNT. Es
      trägt einen `qcHinweis`, der den Eintrag auf der QC-Liste bildet, und
      zählt bewusst **nicht** als vorhanden – die Definition of Done der SOP
      verlangt korrekte Benennung.
    - *Ordner-Nummerierung bleibt bei Modul 01.* Bestätigt: Das interne Werkzeug
      aus der SOP ist dort angesiedelt, nicht im Cockpit.

    **Noch offen zur Ordner-Nummerierung:** Die SOP sagt nicht, **wo** die
    QC-Liste geführt wird – Datei im Datenraum, Tabelle oder Aufgabe. Der
    Prototyp führt sie am Dokument; wenn SEIL ein eigenes Format hat, wird
    darauf abgebildet.

58. **Sammelpostfach steht fest: `deals@seil.com` (28.10.).** Die IT hat es
    eingerichtet. Es ersetzt die bisherige Annahme `invest@seil.com`, die aus
    der Kopfzeile des Standardprozesses (Stand 12.09.2024) und der Teamübersicht
    stammte. Über dieses Postfach läuft alles: WF 06 liest die Antworten daraus,
    WF 05 sendet darüber, WF 08 legt die Besichtigungstermine in dessen Kalender.
    In den Workflow-Dateien ist die Adresse gesetzt.

    **Vier Adressen fehlen noch** und stehen weiter als Platzhalter:
    `leitung@…` (die Leitung im BCC jeder ausgehenden Mail – der Standardprozess
    nennt hier zwei Personen, keine Sammeladresse), `cockpit@…` als Absender des
    täglichen Statusberichts sowie dessen beide Empfänger
    `geschaeftsfuehrung@…` und `vertriebsleitung@…`. Diese werden nicht geraten.

59. **Abgleich über alle elf Projekttermine (29.10.):** Für die Übergabe am 30.10.
    wurden die Gemini-Protokolle vom 03.08., 05.08. (zwei), 12.08., 14.08., 17.08.
    (zwei), 20.08., 28.09. und 28.10. (zwei) in ihren strukturierten Teilen
    vollständig gelesen und die Rohtranskripte gezielt durchsucht. Ergebnis in
    `docs/SEIL-Uebergabe-Checkliste.pdf` (Quelle `docs/quellen/`). Drei Dinge
    standen in keinem bisherigen Dokument:

    - **Modul 01 läuft auf einem zweiten Server.** Die Datenraum-Engine samt
      QM-Center wurde am 03.08. auf einem Hostinger-Server angelegt, der RSG
      gehört. Der am 28.10. gekaufte SEIL-Server trägt nur die neun
      Modul-02-Workflows. „Übergeben und nichts mehr damit zu tun haben“
      setzt den Umzug der Engine voraus – oder die Übertragung des alten
      Servers. Dazu stehen vier Zusagen zum QM-Center vom 03./05.08. (Hyperlink,
      lesbare Namen, Dropdown, Ordnerkontext) und die Schwärzung zur
      Bestätigung offen.
    - **Cockpit-Hosting und Quellcode liegen auf RSG-Konten.** Vercel-Projekt
      und GitHub-Repository gehören RSG; eine Übertragung an SEIL wurde nie
      besprochen. Ohne sie bleibt RSG Betreiber des Cockpits.
    - **Eine Produktivbasis für das Cockpit war nie Thema.** In keinem Termin
      fiel das Wort Datenbank oder Anmeldung. Das Cockpit ist ein Prototyp
      ohne Speicher; „das Team arbeitet im Cockpit“ (Stufe 3) ist damit eine
      offene Entscheidung, keine Restarbeit.

    Außerdem zur Vollständigkeit festgehalten: der buchhalterische Abschluss
    von Modul 01 (14.08.) als Voraussetzung der Modul-02-Rechnungen, die
    Se-Circle-Anbindung (17.08. „zentral“, gebaut als Platzhalter), Pipedrive-
    Altdaten (nie besprochen), die vier Gesellschaften (14.08., offen). Als
    überholt markiert: die 482-GB-Kopie (05.08.), der Backup-Freelancer, die
    Anforderungsprofile im CRM, der Workshop „nach der Migration“.

    **Korrektur am Onepager:** Die Fassung vom 01.09. nannte für WF 03 einen
    „KI-Node: Claude“ und für WF 02 den Abgleich „gegen alle Ankaufsprofile“.
    Beides stimmte nicht mehr: WF 03 füllt Vorlagen, der KI-Knoten ist ein
    Platzhalter; WF 02 arbeitet gegen die Liveliste, der Lade-Knoten ist ein
    Platzhalter. Der Onepager benennt die Platzhalter jetzt ausdrücklich.

60. **Umbau der Automatik auf Microsoft Graph (29.10.):** Für die Anbindung am
    30.10. wurden sechs Workflows umgebaut. Postfach, Kalender und Liveliste
    laufen über **eine** App-Registrierung und **ein** n8n-Credential
    (`Microsoft Graph (SEIL)`, Client Credentials). Gründe: Exchange Online
    erlaubt kein Passwort-IMAP mehr; Graph passt zur Exchange-RBAC-Begrenzung auf
    `deals@seil.com`, die der IT vorgegeben ist; und Versand über Graph verlässt
    das Haus wie jede Outlook-Mail – SPF/DKIM-Arbeiten entfallen.

    - **WF 06** pollt alle zwei Minuten ungelesene Mails, markiert sie als
      gelesen und vereinzelt sie; der Klassifizierer blieb unverändert.
    - **WF 05** sendet über `sendMail`, BCC an die Leitung; Felder werden nach
      dem Versand aus dem Vorknoten zurückgeholt, weil Graph mit leerem Body
      antwortet.
    - **WF 08** legt den Termin per `events` an, 60 Minuten, Teammitglied
      eingeladen.
    - **WF 03** ruft Claude (`claude-opus-5`) mit der Vorlage als Leitplanke
      auf – keine Preise, keine Zusagen – und fällt ohne Key auf die gefüllte
      Vorlage zurück (`quelle: 'vorlage'`). Danach fordert WF 03 die Freigabe
      bei WF 04 an.
    - **WF 04** hat einen zweiten Eingang: Freigabe-Mail mit zwei Links an die
      Leitung, Wait bis 7 Tage, „freigeben“ läuft in dieselbe Sammelfreigabe wie
      der Cockpit-Klick. Damit ist Stufe 2 ohne Cockpit-Speicher betreibbar.
    - **WF 02** liest die Liveliste direkt aus der Excel in SharePoint
      (`workbook/usedRange`); Site, Datei, Blatt und Spaltenzuordnung stehen im
      Konfigurationsknoten.

    **Bewusst nicht verdrahtet:** die Ablage. n8n Data Tables brauchen IDs, die
    erst beim Anlegen entstehen; blind erzeugte Knoten würden den Import still
    brechen. Spezifiziert sind fünf Tabellen, angelegt wird am 30.10. Bis dahin
    läuft die Kette einmal durch; Nachfass-Stufen und die Freigabe-Nachprüfung
    vor dem Versand brauchen die Tabellen.

61. **Modul 01 gefunden und eingeordnet (29.10.):** Modul 01 ist das private
    Repository `Ricdog87/seil-doc-engine` – eine TypeScript-Anwendung, kein
    n8n-Workflow. Sie enthält die SOP maschinenlesbar (`config/doc_types.yaml`,
    `config/naming.yaml`), die Pipeline, das Datenraum-Center unter `/qc` und
    **die Schwärzung** (`src/redaction/`, `config/schwaerzung.yaml`). Die seit
    dem 03.08. offene Frage ist damit beantwortet: **Die Schwärzung ist gebaut**
    – inklusive Verifikations-Gate, das jede Ausgabedatei erneut text-extrahiert
    und bei auffindbarer Fundstelle einen Prüffall erzeugt, statt still
    auszuliefern.

    Ebenfalls geklärt: Das QM-Center ist Teil dieser Anwendung (Basic-Auth über
    `QC_USER`/`QC_PASS`), und die vier Zusagen vom 03./05.08. (Hyperlink,
    lesbare Dateinamen, Dropdown statt „Belassen“, Ordnerkontext) sind laut
    README umgesetzt. Das Repository bringt mit
    `docker-compose.seil-prod.yml` einen vollständigen Stack mit: Postgres,
    n8n, Engine und Caddy mit Let's-Encrypt-TLS – gebaut für genau diesen Fall.

62. **Der VPS liefert ein ungültiges Zertifikat und antwortet mit 404 (29.10.):**
    Nachgemessen: `srv2104755.hstgr.cloud` präsentiert
    `CN = TRAEFIK DEFAULT CERT` (selbstsigniert, SAN auf einen
    Traefik-Platzhalternamen) und beantwortet jeden Pfad mit `404`.
    Kontrollprobe durch denselben Proxy: example.com, api.github.com und
    hostinger.com antworten mit 200/301 – der Fehler liegt also am Server, nicht
    an der Messung. **Die Aussage vom 28.10., der Zertifikatsfehler komme vom
    Egress-Proxy dieser Session, war falsch.**

    Ursache: Die Hostinger-Vorlage stellt n8n hinter Traefik, ohne eine Route
    für den VPS-Hostnamen und ohne Zertifikatsausstellung.

    **Folgen und Behebung:**

    - Cockpit-Webhooks erreichen die Automatik nicht – gelöst durch den
      Compose-Stack aus `seil-doc-engine` (Caddy holt ein echtes Zertifikat);
      für den Fall ohne eigene DNS-Einträge liegt dort jetzt
      `deploy/Caddyfile.einhost`, das n8n und das Datenraum-Center unter dem
      VPS-Hostnamen zusammenführt.
    - Aufrufe zwischen Workflows hätten am Zertifikat scheitern müssen, still.
      **Behoben:** Alle elf WF→WF-Aufrufe laufen jetzt über
      `http://localhost:5678/webhook/…`. Das ist unabhängig von Domain und
      Zertifikat und bleibt auch nach einem Hostnamenwechsel gültig. Der
      Platzhalter `N8N-BASIS-URL` entfällt damit vollständig.


## 63. Liveliste und Mandatsordner liegen in einem persoenlichen OneDrive

Die am 29.10. uebermittelten Links zeigen auf den Mandanten-Host `*-my.sharepoint.com`
unter `/personal/<benutzer>/`. Beides liegt damit im persoenlichen OneDrive eines
Mitarbeiters, nicht in einer SharePoint-Teamwebsite.

Folgen: ein persoenliches OneDrive wird nach dem Austritt des Mitarbeiters samt
Inhalt geloescht, es hat keinen Team-Eigentuemer und laesst sich nicht wie eine
Teamwebsite verwalten. `Sites.Selected` greift dort nicht sinnvoll; eine Freigabe
waere nur auf Ordner- und Dateiebene moeglich
(`Files.SelectedOperations.Selected`, `ListItems.SelectedOperations.Selected`).

Empfehlung an den Kunden: beides vor dem Produktivbetrieb in eine Teamwebsite
verschieben. Die Entscheidung liegt beim Kunden und ist zum Zeitpunkt dieser
Notiz offen.

Technische Konsequenz im Repo: WF02 baut die Graph-URL nicht mehr fest als
`/sites/<id>/drive`, sondern aus dem Konfigurationsfeld `graphBasis`. Damit
laufen beide Varianten ohne Codeaenderung: `/sites/<SITE-ID>/drive` fuer eine
Teamwebsite, `/drives/<DRIVE-ID>` fuer OneDrive oder eine einzelne Bibliothek.
Modul 01 unterstuetzt `driveId` bereits von sich aus.

Konkrete Pfade, Dateinamen und Personennamen des Kunden stehen bewusst nicht in
diesem Repo.

## 64. Entscheidung: Anbindung bleibt auf OneDrive

Der Kunde hat am 29.10. entschieden, Investorenliste und Mandatsordner im
persoenlichen OneDrive zu belassen. Die Bedenken aus Punkt 63 bleiben als
Hinweis bestehen und sind damit erledigt; der Umzug auf eine Teamwebsite ist
eine Entscheidung des Kunden fuer spaeter.

Daraus folgt fuer die Berechtigungen: nicht `Sites.Selected`, sondern
`Files.SelectedOperations.Selected` und `ListItems.SelectedOperations.Selected`,
vergeben auf genau zwei Elemente eines Laufwerks:

- Investorenliste, Rolle `read`
- Mandatsordner, Rolle `write`

Die Vergabe laeuft ueber `POST /v1.0/drives/<DRIVE-ID>/items/<ITEM-ID>/permissions`.
Drive- und Element-IDs werden aus den Freigabelinks aufgeloest
(`GET /v1.0/shares/u!<token>/driveItem`).

Modul 01 unterstuetzt diesen Fall bereits ueber `MS_DRIVE_ID`; das
SharePoint-Feature-Flag `SHAREPOINT_ENABLED` bleibt leer. WF02 nutzt
`graphBasis` = `/drives/<DRIVE-ID>` (siehe Punkt 63).

## 65. Kundenkennungen stehen in Umgebungsvariablen, nicht im Repository

Die IT hat am 29.10. Laufwerks- und Elementkennungen geliefert. Das sind
Kundendaten und gehoeren nicht ins Repository; gleichzeitig wuerde ein
Neuimport der Workflows Werte ueberschreiben, die jemand von Hand in der
n8n-Oberflaeche eingetragen hat.

Deshalb liest WF02 seine Konfiguration jetzt aus Umgebungsvariablen:

- `SEIL_DRIVE_ID` — das Laufwerk
- `SEIL_ITEM_LIVELISTE` — die Investorenliste
- `SEIL_BLATT_LIVELISTE` — Name des Arbeitsblatts, Vorgabe `Tabelle1`

Die Werte stehen in `/opt/seil/.env` und werden im Compose an den n8n-Dienst
durchgereicht. n8n erlaubt `$env` in Ausdruecken standardmaessig
(`N8N_BLOCK_ENV_ACCESS_IN_NODE` ist `false`). In der Ausdrucksvorschau der
Oberflaeche erscheint `$env` haeufig leer; beim Lauf wird es aufgeloest.

Folge: ein Neuimport ist jederzeit gefahrlos, die Konfiguration haengt am
Server und nicht an der importierten Datei.

## 66. Die echte Liveliste ist anders aufgebaut als angenommen

Am 29.10. wurde die Investorenliste erstmals technisch gelesen. Sie hat 1571
Zeilen und 23 Spalten und ist eine Kontaktliste des Vertriebs, kein
Ankaufsprofil. Daraus drei Konsequenzen.

**Ticketspanne steht in einer Spalte, in Euro.** Die Spalte enthaelt Werte der
Form `1000000-10000000`. WF02 erwartete zwei Spalten in Millionen. Die
Zeilenumsetzung liest jetzt wahlweise zwei Spalten oder eine Spanne und rechnet
Werte ab 100000 als Euro in Millionen um.

**Assetklasse ist kaum gepflegt.** In einer Stichprobe von 20 Zeilen war die
Spalte einmal gefuellt, die Ticketspanne in der Haelfte der Zeilen. Region ist
vollstaendig vorhanden. Ein hartes Und ueber alle drei Kriterien haette
praktisch keinen Investor als Treffer ergeben.

Deshalb gilt jetzt: **eine fehlende Angabe ist unbekannt, nicht ausgeschlossen.**
Ein Kriterium ohne Daten liefert `null` statt `false`, der Investor erscheint
mit dem Hinweis, welche Angabe in der Liveliste fehlt. Ein voller Treffer
verlangt weiterhin, dass alle drei Kriterien bekannt und erfuellt sind.

Das ist eine Annahme, die der Kunde bestaetigen sollte. Die Alternative waere,
die Liveliste zu pflegen, bevor das Matching belastbar wird.

**Spaltennamen und Kennungen stehen nicht im Repository.** Sie sind Kundendaten.
WF02 traegt Platzhalter; die echten Werte kommen beim Import aus einer
Konfigurationsdatei auf dem Server (`importieren.mjs --konfig`). Damit bleibt
das Repository frei von Kundendaten, und ein Neuimport setzt die Konfiguration
jedes Mal neu, statt sie zu verlieren.

Korrektur zu Punkt 65: der dort beschriebene Weg ueber `$env` ist verworfen.
Die eingesetzte n8n-Version sperrt den Zugriff auf Umgebungsvariablen in
Ausdruecken standardmaessig. Ihn zu oeffnen haette jedem, der Workflows
bearbeiten darf, auch das Datenbankpasswort und den Verschluesselungsschluessel
zugaenglich gemacht. Die Konfigurationsdatei loest dasselbe Problem, ohne diese
Rechte aufzuweichen.

## 67. Das Cockpit bekommt einen Passwortschutz

Das Cockpit war bis zum 30.10. ohne Anmeldung oeffentlich erreichbar. Solange
es reine Demodaten zeigt, ist das vertretbar. Sobald es echte Datenraum-Staende
aus Modul 01 anzeigt, waere es die Veroeffentlichung von Mandatsdaten.

Deshalb gibt es jetzt eine Middleware mit HTTP-Basic-Auth, gesteuert ueber
`COCKPIT_USER` und `COCKPIT_PASS`. Sind beide nicht gesetzt, laesst die
Middleware durch. Das ist Absicht: eine fehlende Variable soll die Seite nicht
blockieren, sondern sie auf den bisherigen Stand zuruecksetzen.

Das ist eine Zwischenloesung fuer die Uebergabe, kein Benutzerkonzept. Ein
richtiger Login mit Rollen gehoert zur Cockpit-Ausbaustufe mit Datenbank.

## 68. Zwei unterbrochene Ketten repariert, Umleitung vor dem Versand

Vor dem Scharfschalten am 30.10. wurden alle neun Workflows auf
unterbrochene Verbindungen geprueft. Zwei Stellen waren tot:

- **WF02**: Der Auslöser "Matching-Anstoß" war mit nichts verbunden. Der
  Workflow haette auf einen Anstoss nicht reagiert.
- **WF05**: Die Verzweigung "WhatsApp-Kanal?" hatte nur den WhatsApp-Ausgang
  verdrahtet. Der E-Mail-Ausgang fuehrte ins Leere, der Versandknoten war
  verwaist. Es waere nie eine Mail verschickt worden.

Beides ist verbunden; die Gegenpruefung ueber alle neun Workflows meldet
keine verwaisten Knoten und keinen Ausloeser ohne Ziel mehr.

**Umleitung vor dem Versand.** WF05 bekommt vor dem Versandknoten zwei neue
Knoten: "Betriebsart (hier umschalten)" mit dem Feld `demoEmpfaenger` und
"Demo-Umleitung anwenden". Ist eine Adresse eingetragen, geht jede Mail
dorthin statt an den Investor, mit Vermerk des eigentlichen Empfaengers im
Text und dem Zusatz [VORFÜHRUNG] im Betreff. Leer bedeutet echter Versand.

Grund: Die Empfaengeradresse stammt aus der echten Liveliste mit 1571
Investoren. Eine versehentlich versendete Mail laesst sich nicht
zurueckholen. Die Umleitung macht aus einem unumkehrbaren Risiko eine
Einstellung, die beim Import gesetzt wird.

## 69. Scharfschaltung am 30.10., Befunde

Beim Einschalten traten vier Fehler zutage, die vorher nicht sichtbar waren,
weil nie ein Workflow aktiv war.

1. **WF07 hing an SMTP.** Der Versandknoten war beim Graph-Umbau uebersehen
   worden und liess sich nicht aktivieren. Jetzt Versand ueber Graph aus
   deals@, Empfaenger als konfigurierbares Feld.
2. **WF02 ohne Obergrenze.** Der Abgleich gab alle 1571 Zeilen der Liveliste
   weiter, wodurch fuer jeden Investor ein eigener Aufruf der
   Mail-Vorbereitung lief. n8n stuerzte ab. Es werden jetzt hoechstens
   `maxVorschlaege` Treffer weitergereicht, Vorgabe fuenf.
3. **Doppelte geschweifte Klammern in Vorlagentexten.** `{{assetklasse}}`
   innerhalb eines n8n-Ausdrucks brach den Parser. Platzhalter heissen jetzt
   `[assetklasse]`.
4. **WF04 baut den Freigabe-Link, bevor es ihn gibt.** Die Mail an die
   Leitung verwendet `$execution.resumeUrl`, die Wartestelle steht aber erst
   danach im Ablauf. Das ist ein Konstruktionsfehler und noch offen; WF04 und
   WF05 sind deshalb ausgeschaltet.

Stand danach: sieben von neun aktiv, die Kette Intake, Matching und
Mail-Vorbereitung laeuft nachweislich durch.

**Umleitung vor dem Versand** steht in der Konfiguration auf eine
RSG-Adresse. Bevor WF05 wieder eingeschaltet wird, muss diese Entscheidung
bewusst getroffen werden.

## 70. Freigabe-Gate repariert, Kette komplett live

Zwei Ursachen, nicht eine.

**Der Freigabe-Link.** Die Mail an die Leitung baute den Entscheidungslink aus
`$execution.resumeUrl`, also aus der wartenden Ausfuehrung. Das ist fragil und
wirkt nur, solange die Ausfuehrung lebt. Ersetzt durch einen eigenen Webhook
`seil/freigabe-link` (GET, damit jeder Mailclient ihn oeffnen kann). Die
Freigabe wirkt dadurch auch Tage spaeter. Wartestelle und der zugehoerige
Zweig sind entfallen.

**Der eigentliche Fehler.** Microsoft Graph antwortet auf `sendMail` mit
HTTP 202 und leerem Rumpf. Die Versandknoten waren auf `responseFormat: json`
gestellt und brachen daran ab, mit der nichtssagenden Meldung
"Cannot read properties of undefined (reading 'data')". Alle vier Knoten, die
an Graph schreiben, lesen die Antwort jetzt als Text.

Nachweis am 30.10.: Die Kette Matching, Mail-Vorbereitung und Freigabe-Gate
laeuft vollstaendig gruen durch, und im Ordner "Gesendet" von deals@seil.com
liegen die Freigabe-Mails.

## 71. Mails in SEIL-Gestaltung, Datenfluss repariert

Die erste echte Freigabe-Mail war unbrauchbar: leere Felder bei Objekt und
Empfaenger, stehengebliebene Platzhalter, ein Hinweis der KI an den Leser und
rohe Links. Drei Ursachen.

**Der Datenfluss brach ab.** WF02 reichte an WF03 ausschliesslich die
Objekt-Kennung weiter, keine Objektdaten und keinen Investor. Jetzt gehen
Objekt (Name, Region, Assetklasse, Kaufpreis), Investor (Firma,
Ansprechpartner, Mailadresse) und die Trefferbegruendung durch die ganze
Kette.

**Die Liveliste wurde unvollstaendig gelesen.** Mailadresse, Firma und
Vorname fehlten in der Spaltenzuordnung. Ohne Mailadresse gibt es keinen
Empfaenger.

**Die Mails waren roher Text.** Freigabe-Mail und Investorenmail sind jetzt
HTML in der SEIL-Gestaltung: Kopf, Faktenblock, Trefferbegruendung als
farbige Marken, Entwurf im Rahmen, zwei Schaltflaechen statt roher Links.

Signatur und Rechtshinweis der SEIL Group stehen **nicht im Repository**,
sondern in der Konfigurationsdatei auf dem Server. Das Cockpit-Repository
ist oeffentlich.

**Auswahl korrigiert.** Ohne vollen Treffer schlug das Matching einfach die
bestsortierten Investoren vor, auch solche mit nachweislich falschem
Standort. Jetzt gilt: Standort muss passen, fehlende Angaben sind erlaubt,
nachweislich falsche nicht. Lieber kein Vorschlag als ein falscher.

72. **Transaktionsprozess im Cockpit.** Die sieben Stufen auf der Übersicht rechnen ausschließlich
    mit Live-Werten: Dokument- und Prüfzahlen aus Modul 01 (WF 09), Treffer aus der
    Investoren-Liveliste (WF 10). Stufen ohne Datenquelle stehen auf „wartet“ und bekommen keine
    erfundene Zahl.
73. **Abgleich über die ganze Liste.** `/api/investoren` nimmt jetzt ein `limit` entgegen; die
    Prozessansicht fordert 2000 an, damit „x von 1362“ stimmt und nicht aus einem Ausschnitt
    stammt. Der Standort ist das harte Kriterium; Assetklasse und Ticket verengen nur dort, wo die
    Liste gepflegt ist (Stand 30.10.: 1314 von 1362 mit Region, 12 mit Ticket).
74. **Freigabe-Eingang.** Tabelle `freigabe_eingang` in Supabase, RLS aktiv und ohne Richtlinie:
    der öffentliche Schlüssel kommt nicht heran. Das Cockpit hält keinen Datenbankzugang, es liest
    und entscheidet über WF 11 mit demselben Header-Geheimnis wie bei Modul 01. Wer entschieden
    hat, kommt aus dem Sitzungs-Cookie, nicht aus dem Browser.
75. **Anschreiben aus dem Cockpit (WF 12).** Versand läuft weiterhin ausschließlich über das
    SEIL-Postfach in n8n; Vercel bekommt keine Postfach-Zugangsdaten. Die Umleitung auf einen
    Demo-Empfänger aus WF 05 gilt auch hier, und „sofort senden“ steht hinter einer zweiten
    Bestätigung. Obergrenze 50 Empfänger je Auftrag.

76. **Freigabe ist eine Sendung, kein Entwurf.** Links der Text, rechts die Empfänger, einzeln
    abwählbar (Vorgabe aus dem Workshop 30.10.). Die Zeilen einer Sendung tragen dieselbe Kennung
    in der Spalte `sendung`; die Entscheidung geht für mehrere Entwürfe auf einmal raus.
    Freigeben darf nur, wer in `FREIGEBER` steht – derzeit `tp`. Die Route weist eine fremde
    Entscheidung auch dann ab, wenn sie direkt geschickt wird.
77. **Kontaktstand (CRM-Gedächtnis).** Tabelle `kontakt`, ein Eintrag je Mandat und Investor, RLS
    aktiv und ohne Richtlinie. Acht Stufen von „vorgemerkt“ bis „abgesagt“, als Prüfung in der
    Spalte: eine neue Stufe ist eine Migration und keine stille Freitexteingabe. Gelesen und
    geschrieben über WF 13, nicht direkt – das Cockpit hält weiterhin keinen Datenbankzugang.
78. **Vorgemerkt ist nicht angeschrieben.** Wer in einen Versand geht, steht danach im Verteiler:
    bei „sofort senden“ als angeschrieben, bei „zur Freigabe“ als vorgemerkt. Auf angeschrieben
    setzt ihn erst der tatsächliche Versand. Schlägt dieser Eintrag fehl, ist der Versand
    trotzdem passiert – die Antwort sagt das über `imVerteiler`, statt es zu verschweigen.

79. **Das Dashboard folgt der SOP, nicht einem eigenen Schema.** Die 26 Schritte in vier Phasen
    stehen jetzt in `lib/sop.ts` statt zwischen den Beispieldaten – sie sind der bestätigte Ablauf
    des Teams, keine Demo. Die vorher gezeigte Siebener-Kette war meine Erfindung und ist weg.
80. **Abgeleitet schlägt eingetragen.** Schritte 9, 14, 15, 16, 17, 18 und 19 liest das Cockpit aus
    den Live-Quellen (Modul 01, Liveliste, Freigabe-Eingang, Verteiler) und lässt sie nicht von
    Hand setzen. Sonst stünden zwei Wahrheiten zum selben Schritt, und die ältere gewinnt
    irgendwann. Die übrigen 19 Schritte trägt das Team ein, gespeichert in `mandat_schritt`.
81. **Schrittstand je Mandat, nicht je Objekt-ID.** Geschlüsselt wird über den Namen des
    Datenraum-Laufs ohne Zeitstempel (`Portfolio-Otto-Probe-30-10`). Ein zweiter Lauf desselben
    Mandats trifft damit denselben Stand; ein umbenanntes Mandat beginnt von vorn – das ist der
    Preis dafür, ohne Mandats-ID auszukommen, und sollte mit SEIL geklärt werden.

82. **Mandat ist nicht gleich Datenraum-Lauf.** Ein Mandat lebt länger: es hat Namen, Stadt,
    Auftraggeber, Phase und Zuständigen, bevor der erste Ordner hochgeladen ist, und bleibt
    bestehen, wenn ein zweiter Lauf kommt. Tabelle `mandat`, Schlüssel ist der Name; `lauf_praefix`
    verbindet es mit Modul 01. Ein Lauf ohne Mandat erscheint im Cockpit als Vorschlag
    („Create Deal“ aus der SOP, Schritt 10).
83. **Historie.** Jede Änderung über das Cockpit schreibt eine Zeile nach `aktivitaet`: Mandat,
    Schritt, Kontakt, Versand, Freigabe, Aufgabe, Notiz. Schlägt das Protokollieren fehl, wird es
    geschluckt – ein Protokolleintrag darf nie der Grund sein, dass eine Freigabe scheitert. Was
    fehlt, fehlt sichtbar in der Historie und nicht als stiller Fehler anderswo.
84. **Jeder sieht sein Cockpit.** Die Zuständigkeit hängt am Mandat (`zustaendig`), nicht am
    Investor: ein Investor gehört allen, ein Mandat einer Person. Die Übersicht zeigt zuerst die
    eigenen Aufgaben und Mandate, mit einem Schalter auf alle. Die Freigaben sieht nur, wer sie
    erteilen darf.
85. **Keine Demoseiten mehr.** `/vermarktung` und `/objekte/[id]` sind entfernt, nicht nur
    ausgeblendet – zusammen mit den Komponenten, die nur noch sie benutzt haben. Das Abzeichen in
    der Kopfzeile sagt deshalb nur noch „Live“ oder dass Modul 01 nicht erreichbar ist.
86. **Die Datenbank ist der Weg, nicht die Ausnahme.** Freigaben, Verteiler, Schritte, Mandate,
    Aufgaben, Notizen und Historie liest und schreibt das Cockpit direkt (serverseitig, Schlüssel
    nur in der Umgebung). Der Mailversand bleibt in n8n. Ohne `SUPABASE_SERVICE_KEY` fällt das
    Cockpit auf die n8n-Abläufe zurück, soweit es sie gibt, und sagt sonst, dass es nicht
    angebunden ist.
