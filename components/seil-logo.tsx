import Image from "next/image";

/**
 * SEIL-Logo, weisse Variante.
 *
 * ACHTUNG - Zustand der Quelldatei:
 * /public/seil-logo.png ist unveraendert aus der Praesentationsvorlage
 * extrahiert (ppt/media/image-1-1.png, PNG mit Alpha). Die Datei ist dort
 * bereits beschnitten: der Bildmarke fehlen links rund 28 % (Sechseck-Spitze
 * abgeschnitten), dem Wortzeichen rechts das letzte "E" von ESTATE.
 * Deshalb wird sie vorerst NICHT angezeigt - ein sichtbar angeschnittenes
 * Logo ist schlechter als keines.
 *
 * Sobald eine unbeschnittene Datei (bevorzugt SVG) unter /public/seil-logo.svg
 * bzw. .png liegt: Konstante auf true setzen, fertig. Sonst nichts aendern.
 */
const LOGO_DATEI_VOLLSTAENDIG = false;

const SEITENVERHAELTNIS = 1600 / 672;

export function SeilLogo({ height = 24 }: { height?: number }) {
  if (!LOGO_DATEI_VOLLSTAENDIG) {
    // Typografischer Platzhalter in der CI-Schrift - nie eingefaerbt, nie verzerrt.
    return (
      <span className="text-title leading-none tracking-[0.18em] text-seil-text">SEIL</span>
    );
  }

  return (
    <Image
      src="/seil-logo.png"
      alt="SEIL Real Estate"
      width={Math.round(height * SEITENVERHAELTNIS)}
      height={height}
      priority
      /* Mindestabstand = halbe Logohoehe, Breite folgt immer der Hoehe. */
      style={{ height, width: "auto" }}
    />
  );
}
