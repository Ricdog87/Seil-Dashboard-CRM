# Quellen der PDFs

Die PDFs in `docs/` werden aus HTML erzeugt. Die Quelle liegt hier, damit sich
ein Dokument nachziehen lässt, ohne es neu zu schreiben – frühere Quellen sind
verloren gegangen, weil sie nur im temporären Verzeichnis lagen.

| PDF | Quelle |
| --- | --- |
| `SEIL-Workshop-30-10.pdf` | `workshop-30-10.html` |
| `SEIL-n8n-Import-Aylin.pdf` | `import-aylin.html` |
| `SEIL-Uebergabe-Checkliste.pdf` | `uebergabe-checkliste.html` |
| `SEIL-Automatik-Kette-Onepager.pdf` | `automatik-kette-onepager.html` |
| `SEIL-Anbindung-Donnerstag.pdf` | `anbindung-donnerstag.html` |
| `SEIL-IT-Checkliste.pdf` | `it-checkliste.html` (Skala 0.71, zwei Seiten) |

Nur `SEIL-Cockpit-Anleitung.pdf` stammt noch aus einer Zeit ohne abgelegte Quelle.

## Erzeugen

```bash
node docs/quellen/pdf-erzeugen.mjs <quelle.html> <ziel.pdf> [skala]
# z. B.
node docs/quellen/pdf-erzeugen.mjs docs/quellen/import-aylin.html docs/SEIL-n8n-Import-Aylin.pdf 0.92
```

Voraussetzungen: `npm install --no-save playwright-core` und ein Chromium unter
`/opt/pw-browsers/chromium`. Zum Nachzählen der Seiten dient `pypdfium2` – in
dieser Umgebung liegt es unter `python3.13`, während `python3` auf 3.11 zeigt.

Das Skript umhüllt die HTML-Datei mit demselben Gerüst, das die
Veröffentlichung setzt, schaltet auf die helle Variante, verhindert Umbrüche
mitten in einer Karte und schreibt das PDF. `scale` steuert den Seitenumbruch:
kleinere Werte füllen nicht zwangsläufig weniger Seiten, weil ganze Blöcke
zusammengehalten werden – nach einer Änderung also die Seitenzahl prüfen.
