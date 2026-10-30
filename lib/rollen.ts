/**
 * Wer sieht was.
 *
 * Die Geschäftsführung – Tobias, Max, Nino – sieht alle Aufgaben, verteilt sie
 * und bekommt die wirtschaftliche Sicht mit Umsatz und Zielen aller. Alle
 * anderen sehen ihre eigene Maske: ihre Aufgaben, ihre Ziele, ihren Stand.
 * Mandate und Kunden bleiben gemeinsam – ein Team verkauft zusammen.
 *
 * Wer zur Geschäftsführung gehört, steht in der Umgebung (GESCHAEFTSFUEHRUNG),
 * nicht im Code. Die Vorgabe hier ist der Stand vom Workshop am 30.10.
 */
export function geschaeftsfuehrung(): string[] {
  return (process.env.GESCHAEFTSFUEHRUNG ?? "tp,ms,ng")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

export function istGeschaeftsfuehrung(kuerzel: string | null | undefined): boolean {
  return !!kuerzel && geschaeftsfuehrung().includes(kuerzel.toLowerCase());
}
