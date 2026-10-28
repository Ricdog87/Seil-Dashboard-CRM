# Quellen der PDFs

Die PDFs in `docs/` werden aus HTML erzeugt. Die Quelle liegt hier, damit sich
ein Dokument nachziehen lässt, ohne es neu zu schreiben – frühere Quellen sind
verloren gegangen, weil sie nur im temporären Verzeichnis lagen.

| PDF | Quelle |
| --- | --- |
| `SEIL-Workshop-30-10.pdf` | `workshop-30-10.html` |

Die anderen drei PDFs im Ordner stammen aus einer Zeit ohne abgelegte Quelle.

## Erzeugen

```bash
node docs/quellen/pdf-erzeugen.mjs
```

Das Skript umhüllt die HTML-Datei mit demselben Gerüst, das die
Veröffentlichung setzt, schaltet auf die helle Variante, verhindert Umbrüche
mitten in einer Karte und schreibt das PDF. `scale` steuert den Seitenumbruch:
kleinere Werte füllen nicht zwangsläufig weniger Seiten, weil ganze Blöcke
zusammengehalten werden – nach einer Änderung also die Seitenzahl prüfen.
