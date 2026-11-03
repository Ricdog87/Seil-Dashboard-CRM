# Vorlagen und Referenzen von SEIL (Luca, Stand 02.11.2026)

Erhalten am 03.11.2026 als OneDrive-Ordner. Hier liegt nur, was **keine Kundendaten**
enthält: Lucas vier Claude-Skills (Prozessbeschreibungen), die Muster für NDA und
Mandatsvereinbarung, die Reporting-Muster und die Logik seines Nachfass-Flows.
**Nicht im Repo** (Kundendaten, bleiben lokal bei Ricardo): Statustracker, Investorenlisten,
Live-List, Portfoliomappen, Mieterlisten, die echte Pre-Sound-Mail, der Screenshot des
Reporting-Kanbans (zeigt echte Objekte) und der Rohexport des Power-Automate-Flows
(enthält Tenant-, Benutzer- und Postfach-IDs).

In den Skill-Texten sind persönliche Postfächer durch Rollen ersetzt (`[Postfach
Objektbetreuer]`, `[Postfach Geschäftsführung]`, `[Postfach invest@]`); `@seil.com` als
Domänenregel („interne Adressen ausschließen“) blieb stehen.

## Dateien

| Datei | Was es ist | Wofür wir es nutzen |
|---|---|---|
| `skills/pre-sound-mail.SKILL.md` | Pre-Sound-Mail aus dem Datenraum schreiben: Daten ziehen (Mieterliste, Grundbuch, Planung), Produkttyp A–E bestimmen, Planungsrechts-Leiter, Betreff `SEIL • [Ort] \| [Produkttyp] \| „[Objektname]“`, Bullet-Format, NDA-Satz | Engine liefert die Kennwerte (Baujahr, Grundstücksfläche, Flurstücke, WE/GE/Stellplätze, Leerstand, JNKM IST/SOLL) als Vorschläge; WF 06 liest den Betreff als Mandats-Hinweis; Anschreiben-Vorlage für `lib/kommunikation.ts` / WF 12 |
| `skills/pre-sound-erfassen.SKILL.md` | Gesendete Pre-Sound-Mail in Outlook finden, BCC-Block und Versandzeit erfassen | Postfach-Sync (Zielbild 2.6): Versandwelle = Mandat + Zeitpunkt + Empfängerliste |
| `skills/investorenliste.SKILL.md` | Investorenliste je Objekt aus der Live-List: Filter Bundesland/Assetklasse/Ticket, Scoring P1/P2, Ausschlüsse (Opt-out, interne Adressen, Dubletten) | `lib/abgleich.ts` (Matching + Sortierung), WF 10 |
| `skills/statustracker.SKILL.md` | Statustracker-Excel je Objekt: Wellen, Empfänger, Antworten, Trichterstufen, FU1–FU3 | Zielbild 2.4 (Status-Tracker-Ansicht im Cockpit), WF 05 (3 Stufen, Werktage) |
| `muster/01_NDA_deutsch_Muster.docx` / `…english…` + PDF | NDA-Muster DE/EN (Platzhalter) | NDA-Versand nach Interessensbekundung (Standardprozess) |
| `muster/01_Mandatsvereinbarung_SRE_Musterstadt_26.11.2025.docx` / `Mandate Agreement …` | Mandatsvereinbarung (Musterstadt) | Referenz für Mandatsanlage / Felder im Cockpit |
| `muster/SEIL_Reporting_Musterobjekt_V1.pdf` / `Sampleobject` | Verkäufer-Reporting je Objekt (DE/EN) | Vorlage für den PDF-Export (Zielbild 2.1) |

## Pre-Sound Nachfass (Lucas Power-Automate-Flow) — Logik

Trigger: eine gesendete Pre-Sound-Mail (Betreff-Filter, Ordner). Die Mail geht **An: eigenes
Postfach, BCC: alle Investoren**. Dann dreimal dieselbe Schleife:

1. Warten (Test: 1 Minute; Betrieb: 2 Werktage laut Statustracker).
2. Alle Mails seit dem Versandzeitpunkt holen (Graph `me/messages?$filter=receivedDateTime ge …`).
3. Treffer = Betreff enthält den Pre-Sound-Betreff (Groß/Klein egal) → Absenderadressen = „hat geantwortet“.
4. Offen = BCC-Liste minus Antworter.
5. Offen leer → Ende. Sonst FU-Mail `AW: <Betreff>` an eigenes Postfach, BCC = Offen.

Texte (wortgleich in WF 05 `vorlagen` übernommen):

- **FU1:** „Guten Tag, haben Sie ein Feedback für uns? Freundliche Grüße“
- **FU2:** „Guten Tag, da wir keine Rückmeldung erhalten haben, möchten wir nochmals höflich
  nachfragen, ob weiteres Interesse besteht? Freundliche Grüße“
- **FU3 (Final):** „Guten Tag, da wir nichts mehr von Ihnen hören, gehen wir davon aus, dass Sie
  kein weiteres Interesse haben. Bitte beachten Sie, dass wir kein klassisches Maklerunternehmen
  sind. Wir hinterlegen grundsätzlich keine Suchprofile, sondern fokussieren uns auf den
  professionellen Austausch mit unseren Kunden. Freundliche Grüße“

Was wir anders machen (und warum): WF 05 nachfasst **je Kontakt** aus dem Cockpit-Stand
(Stufe, letzter Kontakt, Antwort erkannt durch WF 06), nicht per Betreff-Abgleich über das
ganze Postfach — damit zählen Abwesenheitsmails nicht als Antwort, Telefon-/WhatsApp-Rückmeldungen
lassen sich im Cockpit nachtragen und die Kette endet sauber nach FU3. Einzelmails statt einer
BCC-Sammelmail, damit jede Antwort eindeutig einem Kontakt zugeordnet wird.

## Reporting-Kanban (Lucas lokales Tool) — Aufbau

Wochenweise Spalten (KW mit Zeitraum, Status „vor Start / läuft / erledigt“, Zähler
„Versand n/m · intern n/m“). Darunter ein Board je Woche mit vier Spalten **Offen · In Arbeit ·
Fertig · Verschickt**; jede Karte = ein Objekt mit Versionsnummer (V7, V21 …), „Stand
<Datum>“, „verschickt <Datum>“, Kennzeichen „intern“ oder „Versand“, Empfängergruppe
(Auftraggeber) und Zuständigem; Filter „Nur Versand / Nur intern / Nur noch nicht erledigt“;
Kopf mit „PDF herunterladen“, „Einstellungen“, Papierkorb; Zähler „22 aktive Objekte · 31
archiviert · 195 Versionen · 56 Entwürfe offen“. Reiter: Reportings · Interessenten ·
Kundenseite. → Zielbild 2.1: das Cockpit ersetzt dieses Tool; Versionierung + Versandstatus je
Reporting sind die beiden Felder, die über das heutige Datenmodell hinausgehen.
