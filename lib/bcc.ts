import { dbLesen, datenbankAktiv } from "@/lib/supabase";
import { preisauskunft } from "@/lib/rollen";

/**
 * Die bcc-Regel des Standardprozesses: „MS und JD auf bcc“ – Geschäftsführung
 * und die zuständige Person des Mandats lesen jede Investorenmail mit.
 *
 * Das Cockpit kennt keine Mailadressen des Teams (öffentliches Repo); es
 * übergibt Kürzel, die Automatik löst sie aus ihrer Konfiguration auf.
 */
export async function bccKuerzel(mandat: string | null | undefined, durch?: string | null): Promise<string[]> {
  const menge = new Set<string>([preisauskunft()]);
  if (mandat && datenbankAktiv()) {
    try {
      const [m] = await dbLesen<{ zustaendig: string | null }>("mandat", `name=eq.${encodeURIComponent(mandat)}&select=zustaendig&limit=1`);
      if (m?.zustaendig) menge.add(m.zustaendig.toLowerCase());
    } catch {
      // ohne Zuständigen bleibt es bei der Geschäftsführung
    }
  }
  if (durch && durch !== "automatik" && /^[a-z]{2,4}$/i.test(durch)) menge.add(durch.toLowerCase());
  return [...menge];
}
