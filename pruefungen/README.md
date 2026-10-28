# Prüfungen

Browser-Prüfläufe gegen das laufende Cockpit. Sie ersetzen keine Unit-Tests,
sondern halten die Zustände fest, die in Demos und Workshops gezeigt werden –
wenn einer davon verschwindet, fällt es hier auf und nicht vor dem Team.

## Ausführen

```bash
npm run build && npm start        # in einem Terminal
npm run pruefen                   # in einem zweiten
```

Die Läufe erwarten das Cockpit auf `http://localhost:3000` und einen
Chromium unter `/opt/pw-browsers/chromium` (Pfad in den Dateien anpassen,
falls der Browser woanders liegt).

## Was geprüft wird

| Datei | Inhalt |
| --- | --- |
| `sales-update.mjs` | Beschlüsse aus dem Sales-Update: drei Sichtebenen, Portfolio, Tagesprioritäten, Sammelfreigabe, Liveliste als Matching-Grundlage, Ansprechpartner, Datenraum-Stufen, Mobilansicht ohne Querscroll. |
| `stichtag.mjs` | Der Demo-Stichtag. Die Demodaten werden in Vielfachen von sieben Tagen nachgezogen; der Lauf prüft, dass kein altes Datum zurückbleibt und dass die Zustandsmuster (überfällig, heute fällig, Follow-up-Stufen, Datenraum-Lücken) die Verschiebung unverändert überleben. |

`stichtag.mjs` vergleicht am Ende gegen die veröffentlichte Version. Steht dort
schon derselbe Stand, ist dieser Vergleich trivial erfüllt – er greift genau
dann, wenn lokal verschoben und noch nicht ausgeliefert wurde.
