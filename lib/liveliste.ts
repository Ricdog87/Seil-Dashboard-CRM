import type { LiveInvestor } from "@/app/api/investoren/route";

/**
 * Die Investoren-Liveliste aus OneDrive (n8n WF 10), serverseitig geladen.
 *
 * Eine Stelle für den Abruf, damit Abgleich, Antworterkennung und die
 * Investoren-Route denselben Weg nehmen: Adresse und Geheimnis aus der
 * Umgebung, nichts zwischengespeichert – die Liste in OneDrive bleibt die
 * einzige Quelle.
 */
export async function livelisteLaden(grenze = 2000): Promise<{ investoren: LiveInvestor[]; gesamt: number | null } | null> {
  const url = process.env.INVESTOREN_URL;
  if (!url) return null;
  const ziel = new URL(url);
  ziel.searchParams.set("limit", String(Math.min(Math.max(grenze, 1), 2000)));
  try {
    const res = await fetch(ziel, {
      headers: process.env.MODUL01_SECRET ? { "X-Seil-Secret": process.env.MODUL01_SECRET } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.INVESTOREN_TIMEOUT_MS ?? 15000)),
    });
    if (!res.ok) return null;
    const roh: unknown = await res.json();
    const d = (Array.isArray(roh) ? roh[0] : roh) as { investoren?: LiveInvestor[]; gesamt?: number } | undefined;
    return { investoren: Array.isArray(d?.investoren) ? d.investoren : [], gesamt: d?.gesamt ?? null };
  } catch {
    return null;
  }
}
