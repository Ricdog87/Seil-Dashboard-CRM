---
name: investorenliste
description: "Erstellt eine priorisierte Investorenliste als Excel mit 200er-BCC-Blöcken inkl. Prüfung von Abmeldungen und strukturellen Absagen, wenn der Nutzer „Investorenliste: [Adresse]“ eingibt."
---

# Investorenliste (SEIL Real Estate)

Auslöser: Der Nutzer schreibt „Investorenliste: [Adresse]“ (Schreibweise egal). Die Adresse nach dem Doppelpunkt ist die einzige Eingabe.

Ziel: Aus der Master-Investorenliste so viele ansprechbare Kontakte wie möglich ziehen, Abmeldungen und strukturell unpassende Investoren sicher ausschließen, den Rest priorisieren und in BCC-Blöcken à 200 Adressen als Excel liefern.

Nicht Teil dieses Skills: Tracking der Ansprache, Versand von Mails, Änderungen an der Master-Liste. Du liest nur und lieferst eine Datei.

Fehlt die Adresse oder ist sie mehrdeutig, frage nach. Immer nur eine Frage pro Nachricht, immer als anklickbare Optionen. Bei Unsicherheit fragen statt raten.

## SCHRITT 1 – OBJEKT ERFASSEN
- Mandatsordner per sharepoint_folder_search nach Ort und Straße suchen. Ablage meist unter „2 _ SEIL REAL ESTATE/01_Mandate/1 _ Transaktions Mandate/1_ alle/[Ort]/[Straße]/[Hausnummer]“. Bei mehreren Treffern Pfade nennen und nachfragen.
- Aus Teaser, Exposé, Mieterliste oder Objektaufnahme-Mail ziehen: Assetklasse/Objektart (Wohnen, WGH, Gewerbe, Hotel/Boarding, Grundstück/Projekt), Produkttyp (Bestand, Bestand mit Potenzial, Entwicklung, Sanierung, Forward), Ort, Bundesland, Region, Einheiten, Fläche, Volumen bzw. Preis (falls vorgegeben), Baujahr, interner Objektname.
- Diese Objektdaten sind die Basis für den Vergleichbarkeits-Check in Schritt 3B. Fehlende Werte im Übersichtsblatt als „fehlt“ ausweisen.

## SCHRITT 2 – MASTER-LISTE LADEN
- Datei: Master_Investorenliste_SEIL_v[Nummer].xlsx. Immer die höchste Versionsnummer verwenden (die Liste wird künftig automatisch fortgeschrieben, v19 ist nur der Stand Okt. 2026).
- Suche per sharepoint_search mit „Master_Investorenliste_SEIL“, dann „Master_Investorenliste“, dann „Investorenliste_SEIL“. Bei mehreren Versionen die höchste Nummer nehmen, bei gleicher Nummer die zuletzt geänderte.
- Findet die Suche nichts: eine Frage stellen mit den Optionen „Link schicke ich“ und „Datei hänge ich an“.
- Alle Blätter lesen. Spalten für Name, Unternehmen, E-Mail, Telefon und alle Fokus-Spalten (Region, Assetklasse, Volumen, Kategorie) identifizieren. Version, Pfad und Anzahl Kontakte im Übersichtsblatt festhalten.
- E-Mail-Adressen normalisieren (Kleinschreibung, Leerzeichen entfernen). Abgleich immer über die E-Mail-Adresse.

## SCHRITT 3 – AUSSCHLUSSPRÜFUNG (PFLICHT, VOLLSTÄNDIG)
Dieser Schritt ist der wichtigste. Er wird bei jedem Aufruf komplett durchgeführt, nie abgekürzt.

### Quellen
1. Alle Investoren- und Ansprachelisten der Mandate: sharepoint_search mit „Investorenliste“, „Anspracheliste“, „Interessenten“ (fileType xlsx), alle Ergebnisseiten über nextOffset abarbeiten. Relevante Spalten: Ergebnis, Kommentar, Absagegrund, Bearbeiterkommentar.
2. Outlook: eigenes Postfach [Postfach Objektbetreuer] sowie [Postfach invest@] und [Postfach Geschäftsführung] (mailboxOwnerEmail). Alle Ergebnisseiten abarbeiten.
3. Eine Blacklist-Datei, falls auffindbar (sharepoint_search „Blacklist“). Die Pipedrive-Blacklist ist nicht direkt erreichbar. Das immer im Übersichtsblatt als „nicht geprüft“ vermerken.

### A) Abmeldungen (immer ausschließen, unabhängig vom Datum)
- In den Listen: Absagegrund „Verteiler-Abmeldung“ oder Kommentar mit Abmeldung, aus Verteiler genommen, keine Mails mehr, Löschung, Kontakt entfernen.
- In Outlook Suchbegriffe: abmelden, Abmeldung, austragen, Verteiler, „keine weiteren“, „keine Mails“, „nicht mehr anschreiben“, „nicht mehr kontaktieren“, löschen, Löschung, unsubscribe, remove, DSGVO, Widerspruch, Werbung.
- Jede Fundstelle eindeutig der absendenden Adresse zuordnen. Ausgeschlossen wird die Adresse der Person. Das ganze Unternehmen (Domain) nur, wenn die Mail das ausdrücklich für das Unternehmen sagt. Freemail-Domains (gmail, gmx, web.de, t-online, outlook, hotmail, yahoo, icloud usw.) nie auf Domain-Ebene ausschließen.
- Unzustellbar-Meldungen (NDR) als eigene Kategorie „Unzustellbar“ ausschließen.

### B) Strukturelle Absagen bei vergleichbaren Objekten
Ausschließen, wenn ein Investor ein früheres Objekt mit einem Grund abgesagt hat, der nachweislich auch auf dieses Objekt zutrifft. Den genannten Grund immer gegen die Objektdaten aus Schritt 1 prüfen.
- Typische übertragbare Gründe: Region bzw. Standort (z. B. „nur Berlin“, „nur Rhein-Main“, „max. 30 km von Dortmund“, „Krefeld nicht im Einzugsgebiet“) wenn das neue Objekt ebenfalls außerhalb liegt. Objektart bzw. Investmentfokus (z. B. „nur Projektentwicklung“, „keine Bestandsimmobilien“, „kein Neubau“, „keine Boardinghouses“, „nur Wohnanlagen ab 1950“, „keine Holzdecken“) wenn das neue Objekt das Kriterium ebenfalls verletzt. Größe bzw. Volumen (zu klein, zu groß) wenn das neue Objekt in derselben Größenordnung liegt.
- In den Listen meist als Absagegrund „Standort / Lage“ oder als Kategorie, die mit „Objekt“ beginnt, geführt. Die Kategorie allein reicht nicht, entscheidend ist der Wortlaut im Kommentar bzw. in der Mail.
- Nicht übertragbar, Kontakt bleibt in der Liste: Preis bzw. fehlende Preisangabe, „kein Bedarf“ ohne Begründung, „gerade an anderem Objekt dran“, Zustand des konkreten Objekts, Timing, Abwesenheitsnotiz.
- Outlook-Suchbegriffe für Absagen: Absage, „kein Interesse“, „passt nicht“, „nicht in unser“, Investmentfokus, Investitionsprofil, Suchprofil, „ausschließlich“, „nur in“, Einzugsgebiet, „zu klein“, „zu groß“.
- Ist unklar, ob der Grund auf das neue Objekt zutrifft: nicht selbst entscheiden. Kontakt kommt ins Blatt „Zu prüfen“ und NICHT in die BCC-Blöcke.

### C) Für dieses Objekt bereits angesprochen
- Prüfen: bestehende Investorenliste im Mandatsordner, versendete BCC-Mails zum Objekt (Suche nach Ort, Straße, internem Objektnamen), ImmoScout-Anfragen.
- Bereits angesprochene Kontakte ausschließen (Kategorie „Bereits angesprochen“). Gibt der Nutzer eine Folgewelle an alle vor, nachfragen.

### D) Bereinigung
- Dubletten (gleiche E-Mail) nur einmal führen.
- Ungültige E-Mail-Formate und interne Adressen (@seil.com) ausschließen.

Jeder Ausschluss braucht einen Beleg: Mandat bzw. Objekt, Datum, kurzes Zitat, Datei mit Pfad oder Mail-Betreff.

## SCHRITT 4 – PRIORISIERUNG (HISTORIE ZUERST)
- P1: Früher Interesse, NDA, Datenraum, Gebot, Besichtigung oder LOI bei einem vergleichbaren Objekt (gleiche Assetklasse und gleiche Region bzw. gleicher Produkttyp).
- P2: Früher Interesse oder NDA bei einem anderen Objekt.
- P3: Kein Kontaktverlauf, aber Region und/oder Assetklasse passen laut Fokus-Spalten der Master-Liste. Hat die Master-Liste keine Fokus-Spalten, entfällt P3 und das wird im Übersichtsblatt vermerkt.
- P4: Alle übrigen ansprechbaren Kontakte.
- Innerhalb einer Stufe: Kontakte mit Name und Unternehmen vor reinen E-Mail-Adressen, dann jüngster Kontaktzeitpunkt, dann Unternehmen alphabetisch.
- Keine eigene strategische Gewichtung über diese Regeln hinaus. Die Begründung der Stufe steht je Kontakt in einer Spalte (z. B. „NDA Riva 09/2026“).

## SCHRITT 5 – BCC-BLÖCKE
- Alle ansprechbaren Kontakte in Prioritätsreihenfolge in Blöcke à 200 Adressen aufteilen. Block 1 enthält die höchste Priorität. Der letzte Block darf kleiner sein.
- So viele Kontakte wie möglich: Jeder nicht ausgeschlossene und nicht zu prüfende Kontakt landet in einem Block.

## SCHRITT 6 – AUSGABE ALS EXCEL
Erstelle die Datei mit dem xlsx-Skill. Dateiname: Investorenliste_[Ort]_[Straße-Hausnummer]_[JJJJ-MM-TT].xlsx

Blätter:
1. Übersicht: Objekt und Eckdaten, Erstellungsdatum, Master-Liste (Version, Pfad, Anzahl), Anzahl je Ausschlussgrund, Anzahl „Zu prüfen“, Anzahl in Blöcken, Anzahl Blöcke, Anzahl je Priorität, geprüfte Quellen (Postfächer, Dateien, Suchbegriffe), Hinweise (z. B. Pipedrive-Blacklist nicht geprüft, fehlende Objektdaten). Kontrollzeile: Master-Kontakte = in Blöcken + ausgeschlossen + zu prüfen + Dubletten.
2. BCC-Blöcke: Block-Nr. | Anzahl | Prioritäten im Block | BCC-Adressen kopierfertig für Outlook (getrennt durch „; “).
3. Kontakte: Nr. | Block | Priorität | Begründung Priorität | Name | Unternehmen | E-Mail | Telefon | Quelle.
4. Ausgeschlossen: E-Mail | Name | Unternehmen | Kategorie (Abmeldung, Strukturelle Absage, Unzustellbar, Bereits angesprochen, Ungültig/Intern) | Beleg.
5. Zu prüfen: E-Mail | Name | Unternehmen | Grund der Unsicherheit | Beleg.

Format: Arial, Kopfzeile fett, fixierte Kopfzeile, Autofilter, deutsches Datumsformat. Keine Tracking-Spalten (Tracking läuft separat).

## SCHRITT 7 – SELBSTPRÜFUNG VOR DER AUSGABE
- Kein Block hat mehr als 200 Adressen.
- Keine E-Mail kommt doppelt vor.
- Keine Adresse aus „Ausgeschlossen“ oder „Zu prüfen“ steht in einem Block (programmatisch gegenprüfen).
- Kontrollzeile im Übersichtsblatt geht auf.
- Jeder Ausschluss hat einen Beleg.
Wenn ein Punkt nicht erfüllt ist, korrigieren.

## AUSGABE
Datei direkt mitliefern. Im Chat nur ein bis zwei Sätze: Anzahl Kontakte in Blöcken, Anzahl Blöcke, Anzahl ausgeschlossen, Anzahl zu prüfen. Keine Wiederholung des Inhalts. Kein Semikolon im Fließtext.
