# Gedächtnis für Modul 01 · der Datenraum-Agent wird mit jedem Lauf besser

Ein Sprachmodell lernt nicht aus API-Aufrufen. Was mit jedem Lauf besser werden
kann, ist das System um das Modell herum – und genau das ist dieser Dienst:

1. **Erinnern.** Jede Einordnung und jede Entscheidung des Teams im
   Datenraum-Center (bestätigt oder korrigiert) wird gespeichert: Pfad, Name,
   Merkmale, Kategorie. Nie der Inhalt eines Dokuments.
2. **Wiedererkennen.** Vor jeder neuen Einordnung sucht der Dienst die
   ähnlichsten bestätigten Dateien. Ist eine fast identisch, wird ihre Kategorie
   übernommen – ohne Modellaufruf, in Millisekunden.
3. **Vormachen.** Sonst bekommt Claude die SOP-Kategorien, die freigegebenen
   Regeln und die ähnlichsten bestätigten Beispiele in den Prompt. Korrekturen
   des Teams wiegen dabei am meisten.
4. **Verdichten.** Auf Zuruf destilliert Claude aus den Korrekturen seit dem
   letzten Mal Regelvorschläge („Dateien mit MV_ am Anfang sind Mietverträge“).
   Sie werden Entwürfe; erst eine Freigabe durch das Team macht sie aktiv.
   Niemand lernt dem System unbemerkt etwas Falsches an.
5. **Messen.** Je Lauf: Anteil aus dem Gedächtnis, Anteil Modell, Trefferquote
   (bestätigt ohne Korrektur), Konfidenz-Kalibrierung, Lernkurve über die Läufe.
   Das sind die Zahlen der Abnahme (Kriterium A4).

Der stabile Teil des Prompts (Rolle, SOP, Regeln) wird gecacht; pro Datei
wechseln nur Beispiele und Datei. Modell: `claude-opus-5-5`, Effort `low` –
Einordnung ist eine einfache Aufgabe, der Preis bleibt klein.

## Auf dem SEIL-Server starten (Hostinger, neben n8n)

```bash
cd /opt/seil && git clone <repo> cockpit   # oder bestehenden Checkout nutzen
cd cockpit/modul01/gedaechtnis
cp .env.beispiel .env                       # ANTHROPIC_API_KEY und GEDAECHTNIS_SECRET eintragen – nie ins Repo
docker compose up -d --build
curl -s http://127.0.0.1:8787/gesund        # { ok: true, modell: "claude-opus-5-5", … }
```

Ohne Docker: Node ≥ 22.13, `npm ci --omit=dev`, `npm start` (SQLite ist in Node
eingebaut, keine nativen Abhängigkeiten). Die Datenbank liegt in `./daten/`
(Docker: `/daten`), eine Datei – Sicherung ist ein `cp`.

Der Dienst hört nur auf 127.0.0.1. n8n erreicht ihn über
`http://host.docker.internal:8787` (so in `docker-compose.yml` vorbereitet)
oder im selben Docker-Netz über `http://gedaechtnis:8787`. Jede Anfrage außer
`/gesund` braucht den Header `X-Seil-Secret`.

## Anbindung an die Engine (Stand 03.11.2026, Abnahme A10)

Die Engine (seil-doc-engine) ruft den Dienst direkt im Docker-Netz auf
(`GEDAECHTNIS_URL=http://gedaechtnis:8787`, Compose-Profil `gedaechtnis` in
`docker-compose.seil-prod.yml`; Einrichtung in `deploy/BETRIEB.md` → „Gedächtnis“).
Sie schickt bei `/einordnen` ihre **eigene, aus dem Dokumentinhalt gewonnene
Einordnung** mit (`vorschlag: { kategorie, konfidenz }`). Ohne Gedächtnis-Treffer
übernimmt der Dienst diese als Quelle `engine` — kein zweiter Modellaufruf. Bei einem
Treffer antwortet er mit der bestätigten Kategorie und `vorlage { dateiname,
aehnlichkeit, bestaetigung }` (`qc` = Mensch, `auto` = Engine). Die Engine entscheidet:
gleiche Kategorie bestätigt (von Menschen bestätigt → „bestätigen“-Fall wird automatisch
abgelegt), andere Kategorie → immer Prüfung. Das Modell des Dienstes wird damit nur noch
für `/destillieren` gebraucht. Die n8n-Anbindung unten bleibt als Alternative beschrieben.

## Anbindung in Modul 01 (n8n)

Drei Aufrufe, drei HTTP-Request-Knoten:

**1. Je Datei vor dem Ablegen – `POST /einordnen`**
```json
{ "lauf": "Portfolio-Otto-Probe-30-10_20261030-070222", "auftraggeber": "Otto Grundbesitz",
  "pfad": "Mietverträge/EG", "dateiname": "MV_EG_links_2019.pdf",
  "textauszug": "erste 2000 Zeichen, optional", "groesse": 234567, "mime": "application/pdf" }
```
Antwort: `vorschlagId`, `kategorie`, `light`, `dateinameVorschlag`, `konfidenz`,
`pruefungNoetig` (unter der Schwelle oder unklar oder geschützt), `begruendung`,
`fehlendeAngaben`, `geschuetzt`, `quelle` (`gedaechtnis` | `modell` | `heuristik`).
Für ganze Läufe gibt es `POST /einordnen/stapel` mit `dateien: [...]` (bis 500).

Regel für das Datenraum-Center: Ist `pruefungNoetig` wahr, **keinen** Dateinamen
vorbelegen, sondern Prüfung verlangen (Workshop 30.10., Abnahme A4).

**2. Wenn das Team im Datenraum-Center bestätigt oder korrigiert – `POST /bestaetigen`**
```json
{ "vorschlagId": 4711, "kategorie": "Mietverträge", "dateiname": "Mietverträge_Bergstr-12_EG-links_2019-03-01.pdf",
  "durch": "lk", "quelle": "qc" }
```
Auch automatisch abgelegte Dateien mit hoher Konfidenz bitte bestätigen
(`quelle: "auto"`), sonst fehlt dem Gedächtnis die Bestätigung. Stapel:
`POST /bestaetigen/stapel` mit `entscheidungen: [...]`.

**3. Am Ende des Laufs – `POST /lauf/abschliessen`** `{ "lauf": "…" }` liefert die
Kennzahlen des Laufs; sie gehören in den Status für das Cockpit (WF 09).

## Weitere Endpunkte

| Pfad | Zweck |
|---|---|
| `GET /gesund` | Zustand, Modell, Anzahl Beispiele und Regeln, Token-Statistik (ohne Geheimnis) |
| `GET /kennzahlen?lauf=…&auftraggeber=…` | Trefferquote, Anteile, Kalibrierung, Lernkurve |
| `GET /beispiele?pfad=…&dateiname=…&auftraggeber=…` | Was das Gedächtnis zu einer Datei weiß |
| `POST /destillieren` | Regelentwürfe aus den Korrekturen seit dem letzten Mal |
| `GET /regeln?status=entwurf\|aktiv\|verworfen` | Regeln lesen |
| `POST /regeln` `{bereich, text, begruendung, status}` | Regel von Hand anlegen |
| `POST /regeln/:id` `{status: "aktiv" \| "verworfen", durch}` | Entwurf freigeben oder verwerfen |

Empfehlung: `POST /destillieren` einmal wöchentlich per n8n-Cron, die Entwürfe
als Aufgabe an die Geschäftsführung; Freigabe über `POST /regeln/:id`.

## Konfiguration (`.env`)

| Variable | Bedeutung | Standard |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic-Schlüssel (vom SDK gelesen; mit Engine-Anbindung nur für `/destillieren`) | – |
| `GEDAECHTNIS_SECRET` | Pflichtheader `X-Seil-Secret` | leer = nur localhost |
| `GEDAECHTNIS_MODELL` | Modell | `claude-opus-5-5` |
| `GEDAECHTNIS_EFFORT` | Denktiefe der Einordnung | `low` |
| `GEDAECHTNIS_TREFFER` | Ähnlichkeit, ab der ein Beispiel ohne Modell übernommen wird | `0.92` |
| `GEDAECHTNIS_SCHWELLE` | Konfidenz, unter der Prüfung Pflicht ist | `0.95` |
| `GEDAECHTNIS_BEISPIELE` | Beispiele im Prompt | `8` |
| `GEDAECHTNIS_TESTMODUS` | `1` = ohne Modell (Heuristik + Gedächtnis) | aus |

## Sicherheit und Datenschutz

- Gespeichert werden Pfade, Dateinamen, Kategorien und Entscheidungen – keine
  Dokumentinhalte. Der optionale Textauszug geht nur an das Modell und wird
  nicht abgelegt. Protokolliert werden Methode, Pfad, Status, Dauer.
- Schlüssel und Geheimnis liegen in `.env` (ignoriert) oder im Credential-Store.
- Der Dienst hört lokal; nach außen führt kein Port.
- Ablehnungen oder Störungen des Modells fallen auf die Stichwort-Heuristik
  zurück und werden als solche gekennzeichnet (`quelle`, `hinweis`). Kein
  stiller Ausfall.

## Test

```bash
npm test   # startet den Dienst im Testmodus und spielt einen Lauf durch:
           # Heuristik → Korrektur → Gedächtnis-Treffer → Kennzahlen → Regeln → Destillation
```

## Grenzen – ehrlich

- „Schlauer“ heißt: weniger Modellaufrufe, weniger Korrekturen, bessere
  Kalibrierung über die Läufe. Die Lernkurve zeigt es. Ein Modell, das sich
  selbst verändert, ist das nicht – und soll es auch nicht sein.
- Ähnlichkeit ist lexikalisch (Tokens und Trigramme aus Pfad und Name). Für
  Dateinamen reicht das; für Inhalte bleibt das Modell zuständig.
- Regeln werden nur aktiv, wenn ein Mensch sie freigibt. Das ist Absicht.
