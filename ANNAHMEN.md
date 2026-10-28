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

