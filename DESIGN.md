# Design-System · SEIL Cockpit

Verbindlich für alles, was im Cockpit gebaut wird. Kurz gehalten – wer hier
etwas nicht findet, hält sich an die Regel darunter.

**Die eine Regel:** Hex-Werte stehen ausschließlich in `app/tokens.css`.
Überall sonst wird ausschließlich über Tailwind-Klassen referenziert
(`bg-seil-card`, `text-seil-muted`, `border-seil-line` …). `tailwind.config.ts`
enthält bewusst keine Farbwerte, nur Verweise auf die Variablen.

---

## Palette

Aus der SEIL-Präsentationsvorlage extrahiert (`ppt/theme` + Folien-XML) und
damit verbindlich.

| Token | Wert | Wofür |
|---|---|---|
| `seil-bg` | `#121214` | Seitenhintergrund |
| `seil-surface` | `#1A1A1E` | Panels, Kopfleiste, Tabellenflächen |
| `seil-card` | `#232328` | Karten |
| `seil-card-alt` | `#2A2A31` | Badges, Zeilen-Hover, Eingabefelder |
| `seil-line` | `#37373F` | Rahmen, Trennlinien |
| `seil-text` | `#F4F5F6` | Primärtext, Überschriften, Werte |
| `seil-body` | `#C2C6CC` | Fließtext, Tabellenwerte |
| `seil-muted` | `#8A8F97` | Labels, Metadaten, Platzhalter |
| `seil-accent` | `#9DAAB8` | **einziger** Akzent: aktiv, Fokus, Links |
| `seil-accent-dk` | `#748596` | Akzent gedrückt / hover |

Es gibt genau einen Akzent. Wer einen zweiten braucht, braucht in Wahrheit
Hierarchie – die entsteht über Größe, Weißraum und Position, nicht über Farbe.

## Statusfarben

Nicht Teil der Präsentations-CI. Bewusst entsättigt ergänzt, damit sie sich in
die Palette einfügen statt zu schreien. Kein Vollton-Rot, kein Vollton-Grün.
Jeder Ton zusätzlich als 12 %-Fläche (`-bg`), erzeugt per `color-mix`.

| Token | Wert | Bedeutung im Cockpit |
|---|---|---|
| `seil-success` | `#7FB894` | erledigt, vollständig, positive Rückmeldung (Interesse, Preisanfrage) |
| `seil-warning` | `#C9A56B` | wartet auf jemanden: offene Freigabe, keine Rückmeldung, Dokument ausstehend |
| `seil-danger` | `#D5948E` | überfällig, Eskalation, manuelles Nachfassen nötig |
| `seil-info` | `#86A6D0` | neutrale Systeminformation: Modul-01-Status, NDA, Datenraum-Freigabe |

**Farbe trägt nie allein die Information.** Jedes Badge führt Text, meist
zusätzlich ein Icon. Der Fortschrittsbalken hat immer `7/12` daneben, die
Follow-up-Punkte immer `Stufe 2/3`. `StatusDot` ist ohne Label nicht zulässig.

Geprüft am gerenderten Screen über alle fünf Seiten (614 Textknoten):
schlechtester Fließtext 4.81:1, schlechtestes Label 4.38:1 – keine Verstöße.

## Typografie

Die Vorlage setzt Avenir Next (Theme-Fallback Calibri Light / Calibri). Im Web
ersetzt durch **Inter**, lokal aus `/public/fonts` – kein Google-CDN, kein
Request an Dritte.

| Token | Größe | Wofür |
|---|---|---|
| `text-kicker` | 11 px | Labels, Tabellenköpfe, Metadaten – **uppercase, `tracking-kicker` (0.08em)** |
| `text-body` | 13 px | Fließtext, Tabellen, Buttons, Badges |
| `text-title` | 20 px | Seitentitel, Wortmarke |
| `text-display` | 24 px | **ausschließlich** die vier KPI-Zahlen auf der Übersicht |

- Höchstens drei Größen pro Screen. Vier Screens nutzen 11/13/20, die Übersicht
  zusätzlich 24 für die KPI-Zeile – das ist die einzige Ausnahme.
- Keine Fettschrift-Orgie: Überschriften laufen in Regular (400). Hierarchie
  kommt über Farbe (`seil-text` vs. `seil-body` vs. `seil-muted`) und Abstand.
- `font-variant-numeric: tabular-nums` gilt global. Beträge und Datumsangaben
  dürfen zwischen Zeilen nicht springen.

## Layout & Dichte

- **4px-Raster.** Abstände immer als Vielfaches (Tailwind `gap-2`, `gap-4`, `gap-6`).
- **Tabellenzeile 38 px** (`--seil-row-h`, Zielkorridor 36–40). Bedienelemente 28 px (`--seil-control-h`).
- **Radius einheitlich 6 px** (`rounded-seil`). Kein anderer Radius.
- **Rahmen statt Schatten.** Es gibt keinen einzigen `box-shadow`.
- Trennung über Linien und Weißraum, nicht über gestapelte Karten.
- Keine Verläufe, keine Glows, keine Emoji-Icons.
- Icons ausschließlich **Lucide**, `strokeWidth 1.5`, Größe **16 oder 20**
  (`ICON_SM` / `ICON_MD` aus `components/ui`). Keine anderen Werte.

## Fokus & Tastatur

Ein Fokusring liegt global auf `:focus-visible`: 2 px `seil-accent`, 2 px
Offset. Geprüft: **100 von 100** interaktiven Elementen über alle fünf Screens
zeigen einen sichtbaren Ring. Wer ein Element baut, das den Ring unterdrückt,
baut es falsch.

## Bausteine

`components/ui/` enthält die Primitives. **Alles andere baut ausschließlich
darauf auf** – kein Screen definiert eigene Farben, Rahmen oder Abstände.

`Button` · `Badge` · `Card` (+`CardHeader`, `CardBody`) · `Table`
(+`THead`, `TBody`, `TR`, `TH`, `TD`) · `Input` (+`Checkbox`) · `Select` ·
`Tabs` · `Toast` · `EmptyState` · `StatusDot`

`components/cockpit.tsx` enthält die fachlichen Bausteine (KPI-Kachel,
Fortschritt, Follow-up-Stufe, Antwortstatus-Badge, Seitenkopf, Kicker,
EntityLink) – gebaut aus den Primitives, nicht daneben.

## Logo

`/public/seil-logo.png` ist die weiße Variante, unverändert aus der
Präsentationsvorlage extrahiert (`ppt/media/image-1-1.png`, PNG mit Alpha).

> **Offener Punkt:** Die Datei ist bereits in der Vorlage beschnitten – der
> Bildmarke fehlen links rund 28 % (Sechseck-Spitze), dem Wortzeichen rechts
> das letzte „E" von ESTATE. Sie wird deshalb aktuell **nicht angezeigt**;
> stattdessen läuft eine typografische Wortmarke „SEIL" in der CI-Schrift.
> Sobald eine unbeschnittene Datei vorliegt (bevorzugt SVG): in
> `components/seil-logo.tsx` die Konstante `LOGO_DATEI_VOLLSTAENDIG` auf `true`
> setzen. Sonst nichts.

Regeln, sobald das Logo läuft: nur in der Kopfleiste (und später im Login).
Nie einfärben, nie verzerren – die Breite folgt immer der Höhe. Mindestabstand
ringsum = halbe Logohöhe.

---

## Do

- Neue Fläche gebraucht? `Card` nehmen.
- Neuer Status? Erst prüfen, ob `success` / `warning` / `danger` / `info` passt.
- Zahl in einer Tabelle? `<TD numeric>`.
- Label über einem Wert? `<Kicker>`.
- Rückmeldung nach einer Aktion? `Toast` – inline, nie als Overlay.

## Don't

- Kein Hex-, `rgb()`- oder `hsl()`-Wert außerhalb von `app/tokens.css`.
- Keine Tailwind-Standardfarben (`bg-gray-800`, `text-blue-500` …).
- Kein zweiter Akzent, kein Vollton-Rot/Grün.
- Kein `box-shadow`, kein Verlauf, kein Glow.
- Keine vierte Schriftgröße auf einem Screen.
- Kein Icon außerhalb von Lucide, keine andere Strichstärke als 1.5.
- Farbe nie als einziger Informationsträger.
