---
name: "pre-sound-erfassen"
description: "Trägt eine gerade verschickte Pre-Sound-Mail (BCC-Welle aus invest@ oder ln@) in Lucas Follow-up-Liste ein. Auslöser: „Pre-Sound erfassen“, optional mit Objektname."
---

# Pre-Sound erfassen

Luca schreibt „Pre-Sound erfassen“ (optional mit Objektname, z. B. „Pre-Sound erfassen Am See“). Du findest die BCC-Massenmail der letzten 30 Minuten und legst sie als Pre-Sound-Welle in der Follow-up-Liste an. Antworte auf Deutsch, kurz, ohne Semikolons im Fließtext. Rückfragen einzeln und als anklickbare Optionen (AskUserQuestion).

## 1. Ordner finden
- device_bash: `ls -d "$HOME"/mnt/Follow-up-Liste*`. Das ist der Ordner FU (auf dem Laptop: C:\Users\Lm_ni\Desktop\Follow-up-Liste).
- Fehlt er: device_request_folder_access für `C:\Users\Lm_ni\Desktop\Follow-up-Liste` anfragen.
- Skript: FU/_system/update_followup.py. Regeln: FU/_system/regeln.md, Abschnitt 10 lesen.

## 2. Mail finden
- Jetzt-Zeit in UTC bestimmen (device_bash `date -u +%Y-%m-%dT%H:%M:%S`), minus 30 Minuten = Startzeit.
- outlook_email_search (ToolSearch "outlook email search") mit mailboxOwnerEmail="[Postfach invest@]", folderName="Sent Items", afterDateTime=Startzeit, limit 25. Zusätzlich Lucas eigenes Postfach: folderName="Sent Items", afterDateTime=Startzeit.
- Wird das Ergebnis in eine Datei ausgelagert, mit python auswerten (JSON-Array aus {type,text}, text ist JSON mit subject, recipients, sentDateTime, summary, internetMessageId).
- Pre-Sound = Mail mit mindestens 40 Empfängern, Betreff ohne AW:/Re:/WG:. Hat Luca einen Objektnamen genannt, nur Mails mit diesem Namen im Betreff.
- Nichts gefunden: Zeitraum auf heute ab 00:00 erweitern und Luca die Treffer als Optionen anbieten. Mehrere Treffer: ebenfalls fragen.
- Ist es eine Nachfass-Runde (AW:/Re: mit vielen Empfängern) zu einer Welle, die schon in der Liste steht: keine neue Welle, sondern die bestehende Welle im Verlauf ergänzen.

## 3. Welle aufbauen
- BCC-Block = alle Empfänger ohne @seil.com, kleingeschrieben, ohne Doppelte.
- Gleich prüfen, ob schon Antworten da sind: mailboxOwnerEmail="[Postfach invest@]", folderName="Inbox", afterDateTime=Versandzeit (ohne query), plus Lucas Posteingang. Behandlung exakt nach regeln.md Abschnitt 10: Antwortende aus dem BCC-Block nehmen und je Antwort einen Vorgang anlegen (Interesse/Rückfrage → konkretes To-do, Absage mit Grund → „Absage in Investorenliste eintragen (Grund: …)“ mit vorlage "aus", Absage ohne Grund → „Grund der Absage erfragen“ mit vorlage "begruendung", Abmeldung → „Abmeldung in Investorenliste eintragen“ mit vorlage "aus"). Abwesenheitsnotizen und automatische Eingangsbestätigungen bleiben im BCC. Dauerhaft unzustellbare Adressen aus dem BCC nehmen und im Verlauf der Welle nennen.
- FU 1 fällig = Versanddatum plus 2 Werktage (Sa/So zählen nicht).
- Wellen-Eintrag für updates (eine Zeile):
  {"key": "presound|" + Betreff kleingeschrieben, "kontakt": "Pre-Sound-Welle invest@ (N BCC)", "betreff": Originalbetreff, "datum" und "wartend_ab": Versanddatum (YYYY-MM-DD), "richtung": "Ich warte auf Antwort", "done_initial": true, "einschaetzung": "Wartet auf Antwort · FU 1 ab TT.MM.", "aktion": "FU 1 ab TT.MM.: BCC-Block kopieren, als BCC-Antwort auf die Pre-Sound-Mail mit FU-Text aus invest@ senden", "kontext": 1 Satz mit Objekt, Versandzeit, Anzahl BCC, Rückfragen, Absagen, unzustellbar, noch ohne Antwort, "verlauf": ["TT.MM. Luca: Pre-Sound <Objekt> an N BCC versendet [Mail invest@]", …], "suche": 2–3 Objektwörter aus dem Betreff, "bcc": [Liste ohne Antwortende]}
- Antwort-Vorgänge: key = Absender-Adresse kleingeschrieben + "|" + Betreff ohne AW:/Re:, Richtung "Andere warten auf mich", Einschätzung "Offen", Verlauf mit Beleg [Mail invest@], Suchbegriff = Adresse + Objektwort.
- Sprachregeln: „Provision“ statt „Courtage“, nie „Ankaufsprofil“, keine Semikolons im Text. Die Investorenliste selbst nie ändern.

## 4. Schreiben
- Die JSON-Datei direkt auf dem Laptop schreiben (device_bash mit python, nicht über Dateiübertragung): FU/_system/updates_presound.json im Format {"stand": "TT.MM.JJJJ HH:MM", "postfach": "[Postfach Objektbetreuer]", "rows": [...]}.
- Prüfen, ob die Liste in Excel geöffnet ist (device_stage_files auf FU/Follow-up-Liste.xlsx, Hinweis saveBackBlocked). Wenn ja, Luca bitten, sie zu speichern und zu schließen (eine Frage mit Option „Ist geschlossen“).
- `cd FU && python3 _system/update_followup.py Follow-up-Liste.xlsx _system/updates_presound.json`. Das Skript sichert vorher in _system/backups. Den Marker last_run.txt NICHT ändern.
- Die aktualisierte Liste per device_stage_files holen und mit SendUserFile mitliefern (Hinweis: nur zur Ansicht, die echte Liste liegt im Ordner).

## 5. Abschluss (2–4 Zeilen)
Welle eingetragen (Objekt, Versandzeit, N BCC), FU 1 fällig am TT.MM., bisherige Antworten mit Anzahl je Typ, und dass der tägliche Lauf ab jetzt Antworten aus invest@ einsortiert und die FU-Runden fortschreibt.