# Übergabe SEIL Cockpit (Modul 02) · Stand 31.10.2026

Dieses Dokument ist die Übergabe an SEIL und an den Betrieb der Automatik.
Keine Geheimnisse hier – Zugänge liegen bei den Personen, Schlüssel in den
Umgebungen (Vercel, n8n-Credential-Store, Server-Konfiguration).

## 1. Was läuft wo

| Baustein | Ort | Zweck |
|---|---|---|
| Cockpit (Modul 02) | Vercel, Projekt `seil-cockpit`, Region Frankfurt (fra1), Domain seil-cockpit.vercel.app, Branch `claude/seil-cockpit-modul-02-2mcq9u` | CRM, Prozess, Freigaben, Zahlen |
| Datenbank | Supabase, Projekt `seil` (eu-central-1) | Mandate, Kontakte, Schritte, Aufgaben, Notizen, Kunden, Ziele, Freigaben, Spur |
| Modul 01 (Datenraum) | SEIL-Server (Hostinger, Deutschland), Datenraum-Center unter `/qc` | Sortieren, Umbenennen, Schwärzen nach SOP; Status-API für das Cockpit |
| Automatik (n8n) | derselbe Server | Investoren-Liveliste (WF 10), Datenraum-Status (WF 09), Versand (WF 12/05), Antworterkennung (WF 06), Besichtigung (WF 08) |
| Liveliste | OneDrive-Excel | einzige Quelle der Investoren; das Cockpit legt den CRM-Stand darüber |

Code: GitHub `Ricdog87/Seil-Dashboard-CRM` (derzeit öffentlich – siehe offene Punkte).

## 2. Zugänge

- **Persönliche Logins** (Kürzel + Passwort): ms, ng, tp, ns, ab, ln, lk, ml, ag.
  Alle neun am 31.10. gegen die Produktion geprüft: Anmeldung erfolgreich.
  Hinterlegt in der Vercel-Variable `COCKPIT_LOGINS`; Passwörter liegen bei den Personen.
- **Teamkonto** `seil` (Anzeige „SEIL Team“): Variable `COCKPIT_USER`/`COCKPIT_PASS`.
  Nur für gemeinsame Prüfungen – es kann keine Aufgaben zugeteilt bekommen.
- **Rollen** über Variablen: `GESCHAEFTSFUEHRUNG` = tp,ms,ng · `FREIGEBER` = tp ·
  `PREISAUSKUNFT` = ms (Standard, nicht gesetzt).
- **Maschinenzugang**: Header `X-Seil-Secret` = `MODUL01_SECRET` an `/api/*`,
  tritt als „automatik“ auf. Damit ruft die Automatik `/api/antwort`,
  `/api/modul01/sync`, `/api/mandate`, `/api/kontakte`.
- **Datenbank**: `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (nur Server, RLS an,
  anon/authenticated ohne Rechte).

## 3. Schnittstellen Modul 01 ↔ Modul 02

| Richtung | Weg | Stand |
|---|---|---|
| Modul 01 → Cockpit: Datenraum-Stand | WF 09 `seil/datenraum-status` → `/api/modul01/status` | läuft („Live“-Abzeichen) |
| Modul 01 → Cockpit: Datenraum wird Mandat | Cockpit liest die Läufe und legt fehlende Mandate selbst an (bei jedem Laden der Pipeline); zusätzlich `POST /api/modul01/sync` für den Aufruf am Ende eines Laufs | läuft; Test-/Demoläufe (Name `TEST-`, `DEMO-`) ausgenommen |
| Modul 01 → Cockpit: Stammdaten | `POST /api/mandate` mit `name`, `laufPraefix`, `stadt`, `region` (Bundesland), `assetklasse`, `kaufpreis` – sobald Modul 01 sie aus dem Datenraum liest | API bereit, Modul 01 liefert heute nur Zählwerte |
| Cockpit: Abgleich → Verteiler | automatisch, sobald Region + Assetklasse am Mandat stehen; `POST /api/mandate/abgleich` von Hand | läuft (Standort → Assetklasse → Ticket, nur mit E-Mail, höchstens 400) |
| Cockpit → Automatik: Versand | Freigabe im Cockpit → WF 12 `seil/cockpit-anschreiben` (Graph sendMail) | läuft, **Demo-Umleitung an interne Adresse aktiv** |
| Automatik → Cockpit: Antworten | WF 06 → `POST /api/antwort` (Arten des Standardprozesses, alte Namen werden übersetzt) | läuft |
| Automatik: Follow-up-Versand | WF 05, Cron 07:00 | **aus**, bis Vorlagen und Kontaktquelle stehen; Cockpit zeigt Fälligkeiten |
| Liveliste → Cockpit | WF 10 `seil/investoren` → `/api/investoren`, `/api/kunden` | läuft (1.362 Einträge, 1.198 mit E-Mail) |

## 4. Datenbank (Supabase, Schema public)

`mandat` (Name = Schlüssel, Phase, Zuständig, Region, Assetklasse, Kaufpreis,
Provision, Honorar, Abschluss, Quelle, Abgleich), `kontakt` (Mandat × Investor,
9 Trichter-Stufen, Follow-ups, letzte Antwort), `mandat_schritt` (1–17),
`mandat_dokument` (20 Standarddokumente), `aufgaben`, `notizen`, `aktivitaet`
(Spur), `kunde`, `ziel`, `freigabe_eingang`.
Migrationen zum Nachvollziehen: `supabase/migrationen/`.

## 5. Prozess, wie gebaut

Flowchart 17 Schritte (`lib/sop.ts`), Standardprozess Investorkommunikation
als Regelwerk (`lib/kommunikation.ts`), Trichter (`lib/crm.ts`), Follow-up-Leiter
(`lib/followup.ts`), eine Schreibstelle für den Trichter (`lib/kontakte-schreiben.ts`),
Modul 01 → 02 (`lib/modul01-sync.ts`). Jede Abweichung und Setzung: ANNAHMEN.md.

## 6. Prüfungen am 31.10.2026

- Neun persönliche Logins: Anmeldung erfolgreich.
- `/prozess`, Pipeline, Mandatsseite, Trichter: gerendert, keine Überläufe.
- Antwort „Anfrage“ und „Besichtigung“ am Testmandat: Stufe, Aufgabe, Spur, Badge.
- Migrationen (17 Schritte, Stufen, letzte Antwort; Region/Abgleich/Quelle): angewendet.
- Freigabe → WF 12 → Graph 202: am 30.10. durchgängig geprüft.
- `POST /api/modul01/sync` mit Maschinengeheimnis: Testläufe übersprungen, echte Datenräume
  hatten schon Mandate. Region „Bayern“ + „Wohnen“ am Testmandat: 22 passen, 1 mit E-Mail,
  1 neu vorgemerkt – automatisch beim Speichern.
- Oberfläche mit dem Teamkonto geprüft (Übersicht, Leistung, Aufgaben, Freigaben, Kunden,
  Mandate, Mandat, Prozess). Die Geschäftsführungs-Sicht (Umsatz, Team-Aufgaben, Freigabe-Eingang)
  bitte mit einem GF-Login gegenprüfen – fremde persönliche Konten werden hier nicht benutzt.

## 7. Offene Punkte (Entscheidungen bei SEIL)

1. **Echtversand freigeben**: `demoEmpfaenger` in WF 12/05 leeren. Bis dahin
   gehen Anschreiben an die interne Adresse.
2. **Testdaten entfernen**: Testkunde „Otto Grundbesitz (Testkunde)“, zwei
   Testkontakte, Testaufgaben und das Mandat „Portfolio-Otto-Probe-30-10“.
3. **Repository privat stellen und Eigentum übertragen**: GitHub-Repo, Vercel-Projekt
   (SEIL-Team) und Supabase-Organisation an SEIL. Alternativ Umzug auf den
   SEIL-Server zum Betriebsstart (≥ 4 GB RAM, SEIL-Domain; Supabase bleibt extern).
4. **Ziele und Wirtschaftlichkeit eintragen** (Geschäftsführung): Ziele unter
   Leistung, Kaufpreis/Provision je Mandat. Vorher bleiben Umsatz und Forecast 0.
5. **Region und Assetklasse je Mandat pflegen** – sonst kein automatischer Abgleich.
6. **OneDrive → SharePoint** (IT, ~1,5 Tage) für globalen Ordnerzugriff.
7. **Flächenaufstellung** als 21. Standardkategorie – wenn das Team zustimmt.
8. **SEIL Circle**: Abstimmung mit Nino und Philipp (gemeinsame Supabase, Felder).
9. **Follow-up-Leiter in WF 05** auf vier Stufen und Vorlagen hinterlegen, dann Cron an.
10. **Mandatsnummer** statt Laufname als Schlüssel? Frage für Montag.

## 8. Montag, 02.11., 15:00 – Prozess-Deep-Dive mit Luca und Nino

Mitbringen: ein echtes Mandat durchspielen – Datenraum rein, Mandat entsteht,
Region/Assetklasse setzen, Abgleich, Anschreiben, Freigabe, Antworten erfassen,
Besichtigung. Varianten: mit/ohne NDA, dünner/dichter Datenraum, Einzelobjekt/
Portfolio. Ergebnis: Liste der Abweichungen zwischen SOP und Praxis.
