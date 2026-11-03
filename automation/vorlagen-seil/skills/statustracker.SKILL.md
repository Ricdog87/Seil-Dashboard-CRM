---
name: "statustracker"
description: "Erstellt oder aktualisiert den SEIL-Statustracker (Funnel- und Follow-up-Excel) zu einer versendeten Pre-Sound-Mail. Auslöser: „Statustracker: [Adresse, Betreff der Pre-Sound-Mail oder Objektname]“."
---

# Eingabe
- Start mit „Statustracker: [X]“. [X] ist die Objektadresse, der Betreff der Pre-Sound-Mail oder der Objektname (z. B. Codename wie „Riva“, „Mercator“).
- Jeder Lauf ist eine komplette Neuauswertung aller Mails bis jetzt mit heutigem Stand-Datum. Liegt die Datei des letzten Laufs im Chat oder in einem verbundenen Ordner vor, zusätzlich die Änderungen gegenüber diesem Stand in der Abschlussausgabe nennen.
- Ohne Rückfrage direkt starten. Nur wenn sich [X] nicht eindeutig einer Pre-Sound-Kampagne zuordnen lässt, vorher nachfragen (eine Frage, anklickbare Optionen mit den gefundenen Betreffs). Läuft der Skill unbeaufsichtigt (geplante Aufgabe), nie nachfragen, sondern die Annahme in der Abschlussausgabe nennen.

# Betreff ermitteln
Pre-Sound-Mail = BCC-Erstansprache zu einem Objekt an viele externe Empfänger aus einem SEIL-Postfach (Gesendete Elemente).
1. [X] ist ein Betreff: Mails mit exakt diesem Betreff verwenden.
2. [X] ist eine Adresse oder ein Objektname:
   a) In den Gesendeten Elementen von invest@, nj@, ln@ und dem eigenen Postfach nach Straße, Ort und Objektname suchen (Betreff und Text). Treffer nur verwenden, wenn die Mail eine Pre-Sound-Mail ist (BCC an viele externe Empfänger, kein „AW:“, „WG:“, „RE:“).
   b) Zusätzlich im SEIL-Team-Meeting-Tracker (SharePoint, Datei „SEIL_Team-Meeting.xlsx“, Blatt „Tracker“) Adresse und Portfolio- bzw. Codenamen abgleichen, um Adresse und Objektname einander zuzuordnen.
   c) Zuordnung nur, wenn Betreff oder Text der Pre-Sound-Mail die Adresse, den Ort mit eindeutiger Objektbeschreibung oder den Objektnamen belegt. Ort allein reicht nicht.
3. Gehören mehrere Betreffs nachweislich zum selben Objekt (z. B. Schreibvarianten mit und ohne „SEIL •“, Groß-/Kleinschreibung), alle als Wellen auswerten und die Varianten in der Abschlussausgabe nennen.
4. Passen mehrere verschiedene Kampagnen und ist nicht belegbar, welche gemeint ist: nachfragen (unbeaufsichtigt: alle belegten auswerten und Annahme nennen).
5. Wird keine Pre-Sound-Mail gefunden: abbrechen und die durchsuchten Postfächer und Suchbegriffe nennen. Keine Datei erzeugen.

# Rolle
Du bist Transaktionsanalyst bei SEIL Real Estate. Du wertest E-Mail-Verläufe einer Investorenansprache vollständig und belegbar aus.

# Aufgabe
Finde alle Ausgangsmails mit dem ermittelten Betreff in allen verknüpften Postfächern. Ermittle für jeden angeschriebenen Empfänger, welche Stufen des Deal Funnels er erreicht hat, ob er noch aktiv ist und welches Follow-up als Nächstes fällig ist. Gib das Ergebnis als Excel-Datei (.xlsx) aus und liefere die Datei immer direkt mit. Ist ein Ordner verbunden, die Datei zusätzlich dort ablegen. Die Datei muss bei jedem Lauf exakt gleich aufgebaut sein und der SEIL Corporate Identity folgen.

# Verknüpfte Postfächer
1. Durchsuche das eigene Postfach nach dem ermittelten Betreff.
2. Ermittle aus jeder gefundenen Welle das Absenderpostfach und alle @seil.com-Adressen in An und CC. Das sind die verknüpften Postfächer.
3. Durchsuche jedes dieser Postfächer vollständig nach dem Betreff und nach allen Folgemails. Prüfe in jedem Postfach zusätzlich den Ordner „Gesendete Elemente“ im Zeitraum ab der ersten Welle.
4. Ist ein Postfach nicht zugänglich, weiterarbeiten und das in der Abschlussausgabe nennen.

# Suchtechnik (Microsoft-365-Connector)
- In geteilten Postfächern entweder Suchbegriff oder Datumsfilter verwenden, nicht beides. Für den Betreff mit Suchbegriff suchen, für Gesendete Elemente mit Datumsfenster ohne Suchbegriff listen.
- Immer alle Ergebnisseiten abrufen (offset bzw. cursor), bis keine weiteren Ergebnisse kommen.
- Empfängerlisten von Wellen und Sammel-Nachfassmails immer aus der vollständig gelesenen Mail (BCC) übernehmen, nie aus Suchergebnis-Zusammenfassungen. Adressen per Skript bzw. Datei verarbeiten, nicht von Hand abtippen.
- Für viele Einzelmails (Signaturen, Telefonnummern) das Lesen an Subagenten delegieren und nur die Fakten zurückmelden lassen.

# Vorgehen
1. Wellen: Jede gesendete Mail mit exakt identischem Betreff ist eine Welle (Datum, Uhrzeit in deutscher Zeit, Absenderpostfach). Mails mit Präfix wie „AW:“, „WG:“, „RE:“ sind keine Welle. Sammel-Mails mit Präfix an viele Empfänger sind Nachfassmails (siehe Follow-up-Logik).
2. Empfänger: Alle Adressen aus An, CC und BCC aller Wellen erfassen. Interne Adressen (@seil.com) nicht aufnehmen. Jede Person in einer eigenen Zeile. Dubletten über alle Wellen und Postfächer zusammenführen (Schlüssel: E-Mail-Adresse, ohne Beachtung der Groß- und Kleinschreibung). Reihenfolge: nach der ersten Welle, in der die Adresse vorkommt, innerhalb der Welle in Versandreihenfolge.
3. Für jeden Empfänger alle zugehörigen Nachrichten auswerten: Antworten, Weiterleitungen, Folgemails mit abweichendem Betreff (z. B. „AW:“, „WG:“, „NDA“, „Datenraum“, Portalanfragen zum selben Objekt) sowie Mails von anderen Adressen derselben Firmendomain. Freemail-Domains zählen dabei nicht als Firmendomain: gmail, googlemail, gmx (alle Endungen), web.de, yahoo (alle Endungen), ymail, t-online, outlook, hotmail, live, icloud, me.com, aol, arcor, freenet, mail.de. Auch zitierte Verläufe innerhalb von Mails auswerten.
4. Zuordnung über die E-Mail-Adresse. Eine Antwort von einer abweichenden Adresse nur zuordnen, wenn die zitierte Ursprungs- oder Nachfassmail, eine Weiterleitung oder die Firmendomain die Verbindung belegt. Die Zuordnung im Kommentar vermerken. Namensgleichheit allein reicht nicht. Nicht zuordenbare Antworten in der Abschlussausgabe auflisten.
5. Antworten, die sich ausdrücklich auf ein anderes Objekt beziehen, zählen nicht als Reaktion auf dieses Objekt. Ergebnis „Offen“ und im Kommentar „unklar: Antwort betrifft [Objekt]“.
6. Jede belegte Funnel-Stufe mit ✓ markieren. Ergebnis und Absagegrund nach den Regeln unten setzen.
7. Namen aus Signatur oder Anzeigename der Antwortmails übernehmen, Telefonnummern aus der Signatur der Antwortmails (Tel vor Mobil, keine Fax- und keine SEIL-Nummern). Automatische Antworten, Abwesenheitsnotizen und Unzustellbarkeitsmeldungen liefern keine Telefonnummer.

# Funnel-Stufen (je eine Spalte, Wert ✓ oder leer)
1. Erstkontakt: Ausgangsmail an die Person versendet (bei allen Empfängern ✓)
2. Interesse: Person hat Interesse bekundet oder eine inhaltliche Rückfrage zum Objekt gestellt (z. B. bittet um weitere Informationen, Exposé oder NDA, fragt nach Kaufpreis bzw. Preisvorstellung, Adresse, Mieterliste oder Provision). Auch eine reine Preisfrage zählt als Interesse (✓).
3. NDA erhalten: NDA an die Person verschickt
4. NDA zurück: unterschriebenes NDA zurückerhalten
5. Mappe / DR light: Mappe oder Datenraum light verschickt bzw. freigegeben. Ein Teaser allein zählt nicht, dann leer und „unklar: nur Teaser versendet“.
6. Feedback Mappe / DR: Rückmeldung auf Mappe oder Datenraum erhalten
Regeln: Nur Stufen mit Beleg in einer Mail ankreuzen. Übersprungene Stufen bleiben leer. Eine Absage entfernt keine Häkchen.

# Ergebnis (genau ein Wert)
- Offen: keine Antwort nach Erstkontakt. Automatische Antworten, Abwesenheitsnotizen und Unzustellbarkeitsmeldungen zählen nicht als Antwort, Hinweis in den Kommentar.
- Weiter: mindestens eine Antwort zu diesem Objekt und keine Absage
- Absage: Person hat abgesagt, egal auf welcher Stufe. Grund im Wortlaut in den Kommentar, Kategorie in die Spalte Absagegrund.

# Absagegrund (genau eine Kategorie, nur bei „Absage“, sonst leer)
1. Standort / Lage
2. Objekt (Größe, Assetklasse, Baujahr, Bauweise, Investmentfokus, Strategie)
3. Preis / fehlende Preisangabe
4. Kein Bedarf / ohne Begründung (auch: keine Kapazität, andere Ankäufe)
5. Verteiler-Abmeldung
Nur diese fünf Werte, exakt so geschrieben. Bei mehreren Gründen den zuerst genannten wählen.

# Follow-up-Logik
- Intervall: alle 2 Tage.
- Follow-up ist jede Mail von SEIL an die Person nach der jeweiligen Stufe, die nachfasst, ohne eine neue Stufe auszulösen. Beispiele sind die Frage nach Feedback oder Interesse, die Erinnerung an die NDA-Rücksendung oder die Nachfrage zum Feedback auf die Mappe. Sammel-Nachfassmails (z. B. „AW:“ auf die Welle per BCC) zählen für jede enthaltene Person. Mailings zu anderen Objekten zählen nicht.
- Gruppe Erstkontakt: Ergebnis „Offen“ und Zustellung nicht gescheitert. Gezählt werden Follow-ups nach der letzten Welle an die Person.
- Gruppe NDA: NDA erhalten ✓, NDA zurück leer, Ergebnis nicht „Absage“. Gezählt werden Follow-ups nach dem NDA-Versand.
- Gruppe Mappe: Mappe / DR light ✓, Feedback leer, Ergebnis nicht „Absage“. Gezählt werden Follow-ups nach dem Mappen- bzw. Datenraumversand.
- Die Person steht auf dem Blatt „FU[Anzahl bisheriger Follow-ups + 1] [Gruppe]“. Nach drei Follow-ups ohne Reaktion steht sie auf keinem Follow-up-Blatt mehr. Im Hauptblatt kommt dann in den Kommentar „3 Follow-ups ohne Reaktion“.
- Letzter Kontakt: Datum der Stufen-Mail bzw. des letzten Follow-ups. Fällig am: Letzter Kontakt plus 2 Tage.
- Follow-up-Texte und -Reihenfolge folgen der SEIL-SOP (FU1 = 1. Follow Up, FU2 = 2. Follow Up, FU3 = Final Follow up). Die SOP-Regel „weitere Follow-ups abwechseln“ entfällt, nach FU3 (Final) endet die Kette.

# Formatvorgabe (SEIL Corporate Identity, gilt für alle Blätter)
- Primärfarben: Schwarz #000000, SEIL-Blau #738697, Weiß #FFFFFF
- Rastertöne SEIL-Blau: 10 % #F1F3F5, 20 % #E3E7EA, 40 % #C7CFD5
- Grautöne Schwarz: 15 % #D9D9D9, 50 % #7F7F7F, 65 % #595959
- Schrift ausschließlich Arial, Regular und Bold
- Keine weiteren Farben. Einzige Ausnahme ist die rote Fristmarkierung (Füllung #FFC7CE, Schrift #9C0006 Bold).
- In openpyxl alle Farben mit Alpha-Kanal angeben (z. B. FF000000).
- Gitternetzlinien aus, Zoom 110 %, Querformat, auf eine Seitenbreite skalieren, Kopfzeile der Tabelle als Druck-Wiederholungszeile, Fußzeile links „SEIL Real Estate GmbH · Vertraulich“ (Arial 8), rechts „Seite &P von &N“.
- Zeilenhöhen: 1: 8 | 2: 30 | 3: 18 | 4: 10 | 5: 28 | 6: 30 | 7: 16 | 8: 12 | 9: 42 | Datenzeilen: 20 (Ausnahme Follow-up-Blätter: Zeile 7 = 60)
- Datenzeilen: Arial 10, Schwarz, vertikal zentriert, keine senkrechten Linien, nur Rahmen unten dünn in #E3E7EA. Zebrastreifen in ungeraden Zeilen in #F1F3F5 per bedingter Formatierung.
- Kopfzeile Tabelle (Zeile 9): Füllung Schwarz, Arial 10 Bold, Weiß, vertikal zentriert, Umbruch an. Autofilter bis zur letzten Datenzeile.
- Keine zusätzlichen Farben, Schriften, Icons, Diagramme oder Blätter außer den hier definierten.

## Blatt 1 „Statustracker“
- Fenster fixieren bei D10
- Spaltenbreiten: A 2 | B 8 | C 30 | D bis J je 11 | K 38 | L 20 | M 12 | N 30 | O 17 | P 38
- B2: „Statustracker“, Arial 18 Bold, unten ausgerichtet. P2: „SEIL REAL ESTATE“, Arial 10 Bold, rechtsbündig, unten.
- B3: „SEIL • [Name] • [Region]   |   Versand [TT.MM.JJJJ], [HH:MM] Uhr“, Arial 10, SEIL-Blau. Mehrere Wellen chronologisch, getrennt durch „ · “. [Name] ist die Objektbezeichnung aus dem Betreff ohne Präfix „SEIL・“ und ohne Ortsangabe. [Region] ist der Ort aus der Zeile „Lage“ der Ausgangsmail.
- P3: „Stand: [TT.MM.JJJJ]“ (Erstellungsdatum), Arial 10, SEIL-Blau, rechtsbündig. B3 bis P3 Rahmen unten mittelstark Schwarz.
- Funnel-Leiste Zeile 5 bis 7: Zeile 5 Beschriftung in Großbuchstaben Arial 8 Bold Grau 50 %, unten, Umbruch an. Zeile 6 Wert per Formel Arial 16 Bold, vertikal zentriert. Zeile 7 Quote ggü. Erstkontakt Arial 8 Bold SEIL-Blau, Format 0 %, zentriert.
  B: „GESAMT“ | =COUNTA($N$10:$N$1000) | B6 Füllung Schwarz, Schrift Weiß, B5 in Schwarz
  D: „ERSTKONTAKT“ | =COUNTIF(D$10:D$1000,"✓")
  E: „INTERESSE“ | =COUNTIF(E$10:E$1000,"✓") | E7: =IFERROR(E6/$D$6,0)
  F: „NDA ERHALTEN“ | =COUNTIF(F$10:F$1000,"✓") | F7: =IFERROR(F6/$D$6,0)
  G: „NDA ZURÜCK“ | =COUNTIF(G$10:G$1000,"✓") | G7: =IFERROR(G6/$D$6,0)
  H: „MAPPE / DR LIGHT“ | =COUNTIF(H$10:H$1000,"✓") | H7: =IFERROR(H6/$D$6,0)
  I: „FEEDBACK MAPPE / DR“ | =COUNTIF(I$10:I$1000,"✓") | I7: =IFERROR(I6/$D$6,0)
  J: „WEITER“ | =COUNTIF($J$10:$J$1000,"Weiter")
  K: „OFFEN“ | =COUNTIF($J$10:$J$1000,"Offen")
  L: „ABSAGE“ | =COUNTIF($J$10:$J$1000,"Absage")
  C7: „Quote ggü. Erstkontakt“, Arial 8, Grau 50 %, rechtsbündig. B bis J zentriert, K und L linksbündig mit Einzug 1. B6 bis P6 Rahmen unten mittelstark SEIL-Blau.
- Kopfzeile: Nr. | Name | Erstkontakt | Interesse | NDA erhalten | NDA zurück | Mappe / DR light | Feedback Mappe / DR | Ergebnis | Kommentar | Absagegrund | Datum letzter Schritt | E-Mail | Telefon | Bearbeiterkommentar
- B, D bis J und M zentriert, alle anderen linksbündig mit Einzug 1. K und P mit Zeilenumbruch.
- M als echtes Datum DD.MM.YYYY (Datum der Mail zur zuletzt erreichten Stufe oder zur Absage, bei reinem Erstkontakt das Datum der letzten Welle an diese Person). O als Text (@).
- Dropdowns: D10:I1000 nur „✓“ | J10:J1000 Offen, Weiter, Absage | L10:L1000 die fünf Absagegrund-Kategorien
- Inhalte: B laufende Nummer. C Vor- und Nachname, Firma in Klammern. Ohne belegten Namen nur die Firma aus der Domain in Klammern, bei Freemail ohne belegten Namen leer. K Kommentar kurz und sachlich mit Datum und Wortlaut. N E-Mail-Adresse. O Telefon. P leer lassen.
- Bedingte Formatierung (Reihenfolge = Priorität, „Anhalten, wenn wahr“ außer bei den letzten zwei):
  1. M10:M1000, =AND($M10<>"",$J10<>"Absage",TODAY()-$M10>2): Fristmarkierung rot
  2. J10:J1000: =$J10="Weiter" Füllung SEIL-Blau, Schrift Weiß Bold | =$J10="Absage" Füllung Grau 15 %, Schrift Grau 65 % Bold | =$J10="Offen" Füllung Weiß, Schrift Grau 50 % Bold
  3. D10:I1000, =AND(D10="✓",$J10="Absage"): Füllung Grau 15 %, Schrift Grau 65 % Bold
  4. D10:I1000, =D10="✓": Füllung Blau 40 %, Schrift Schwarz Bold
  5. B10:P1000, =$J10="Absage": Schrift Grau 50 %
  6. B10:P1000, =AND($N10<>"",MOD(ROW(),2)=1): Füllung Blau 10 %

## Blätter 2 bis 10 (Follow-up)
- Blattnamen in dieser Reihenfolge: „FU1 Erstkontakt“, „FU2 Erstkontakt“, „FU3 Erstkontakt“, „FU1 NDA“, „FU2 NDA“, „FU3 NDA“, „FU1 Mappe“, „FU2 Mappe“, „FU3 Mappe“. Alle neun Blätter immer anlegen, auch wenn sie leer sind.
- Fenster fixieren bei D10
- Spaltenbreiten: A 2 | B 8 | C 30 | D 30 | E 17 | F 14 | G 13 | H 13 | I 45 | J 38
- B2: „Follow-up [1|2|3] nach Erstkontakt“ bzw. „… nach NDA-Versand“ bzw. „… nach Mappe / DR light“, Arial 18 Bold. J2: „SEIL REAL ESTATE“ wie Blatt 1.
- B3: „SEIL • [Name] • [Region]   |   Follow-up fällig: [frühestes Fällig-Datum] – [spätestes Fällig-Datum]   |   Intervall 2 Tage“ (bei nur einem Datum nur dieses, ohne Einträge „keine Einträge“), Arial 10, SEIL-Blau. J3: „Stand: [TT.MM.JJJJ]“. B3 bis J3 Rahmen unten mittelstark Schwarz.
- Zeile 7: Follow-up-Text laut SEIL-SOP („Standardprozess Transaktion, Kommunikation SEIL.xlsx“, Blatt „Process“, Stand 21.10.2025). B7:J7 verbunden, Arial 9, Schwarz, linksbündig, oben, Umbruch an, Füllung Blau 10 %, Zeilenhöhe 60. Inhalt beginnt mit „Text FU[1|2|3]: “, danach der Text wörtlich, Zeilenumbrüche wie unten. Gleiche Texte für Erstkontakt, NDA und Mappe:
  - FU1: „Guten Tag,
    haben Sie ein Feedback für uns?
    Freundliche Grüße [Signatur]“
  - FU2: „Guten Tag,
    da wir keine Rückmeldung erhalten haben, möchten wir nochmals höflich nachfragen, ob weiteres Interesse besteht?
    Freundliche Grüße [Signatur]“
  - FU3 (Final Follow up): „Guten Tag,
    da wir nichts mehr von Ihnen hören, gehen wir davon aus, dass Sie kein weiteres Interesse haben. Bitte beachten Sie, dass wir kein klassisches Maklerunternehmen sind. Wir hinterlegen grundsätzlich keine Suchprofile, sondern fokussieren uns auf den professionellen Austausch mit unseren Kunden.
    Freundliche Grüße [Signatur]“
  Texte nicht umformulieren, kürzen oder ergänzen.
- Zeile 5/6: B „GESAMT“ | =COUNTA($D$10:$D$1000) (B6 Füllung Schwarz, Schrift Weiß). D „FÄLLIG BIS HEUTE“ | =COUNTIF($H$10:$H$1000,"<="&TODAY()). Formatierung wie Funnel-Leiste. B6 bis J6 Rahmen unten mittelstark SEIL-Blau.
- Kopfzeile: Nr. | Name | E-Mail | Telefon | Letzter Kontakt | Bisherige Follow-ups | Fällig am | Kommentar | Bearbeiterkommentar
- B, F, G, H zentriert, alle anderen linksbündig mit Einzug 1. I und J mit Zeilenumbruch. F und H als echtes Datum DD.MM.YYYY, E als Text (@).
- Inhalte: Name, E-Mail, Telefon und Kommentar wie in Blatt 1. G Anzahl bisheriger Follow-ups der Gruppe. J leer lassen.
- Sortierung: nach Fällig am aufsteigend, bei Gleichstand in der Reihenfolge von Blatt 1.
- Bedingte Formatierung: 1. H10:H1000, =AND($H10<>"",$H10<=TODAY()): Fristmarkierung rot, „Anhalten, wenn wahr“. 2. B10:J1000, =AND($D10<>"",MOD(ROW(),2)=1): Füllung Blau 10 %.

# Technik
- Datei mit openpyxl erzeugen. Die Formeln mit LibreOffice nur an einer Kopie auf Fehler prüfen, die gelieferte Datei nicht mit LibreOffice neu speichern (sonst gehen „Anhalten, wenn wahr“ und Farben der bedingten Formatierung verloren). In der gelieferten Datei „beim Öffnen neu berechnen“ aktivieren.
- Fristen laufen dynamisch gegen TODAY(), nie gegen ein festes Datum.
- Dateiname: Statustracker_[Name]_[TTMMJJJJ].xlsx

# Regeln
- Nur belegbare Informationen eintragen. Nichts erfinden oder schätzen. Fehlt eine Angabe, Zelle leer lassen.
- Ist eine Stufe oder das Ergebnis nicht eindeutig, Stufe leer lassen bzw. „Offen“ setzen und im Kommentar „unklar: [Grund]“ vermerken.
- Keine eigene Priorisierung oder Bewertung der Investoren.
- Formatvorgabe ohne Abweichung umsetzen.
- Das Wort „Ankaufsprofil“ nirgends verwenden.
- Keine Semikolons im Fließtext der Abschlussausgabe.

# Abschluss
Nach der Datei kurz auf Deutsch ausgeben:
- ausgewertete Wellen (Datum, Uhrzeit, Postfach, Anzahl Empfänger)
- durchsuchte und nicht zugängliche Postfächer
- erkannte Nachfassmails (Datum, Anzahl Empfänger)
- Anzahl Empfänger gesamt, je Funnel-Stufe, Offen / Weiter / Absage, je Absagegrund-Kategorie
- Anzahl je Follow-up-Blatt mit Fälligkeitsbereich
- Liste der Fälle mit „unklar“
- nicht zuordenbare Antworten von abweichenden Adressen
- verwendeter Betreff (bei Eingabe von Adresse oder Objektname mit Beleg der Zuordnung)
- Änderungen gegenüber dem letzten Stand, falls die vorherige Datei vorliegt