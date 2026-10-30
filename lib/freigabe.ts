/**
 * Wer freigeben darf.
 *
 * Im Workshop am 30.10. hat das Team festgelegt: alle ausgehenden Anschreiben
 * gibt genau eine Person frei. Wer das ist, steht in der Umgebung und nicht im
 * Code – eine Vertretung im Urlaub ist eine Konfiguration, kein neues Release.
 */
export function freigeber(): string[] {
  return (process.env.FREIGEBER ?? "tp")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

export function darfFreigeben(kuerzel: string | undefined | null): boolean {
  return !!kuerzel && freigeber().includes(kuerzel.toLowerCase());
}
