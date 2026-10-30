import { NextResponse, type NextRequest } from "next/server";
import { SITZUNG_COOKIE, sitzungPruefen, zugaenge } from "@/lib/sitzung-token";
import { SYSTEM_KUERZEL } from "@/lib/rollen";

/**
 * Zugangsschutz fürs Cockpit.
 *
 * Normalfall ist die Anmeldeseite mit Sitzungs-Cookie. Zusätzlich wird eine
 * Basic-Auth-Kopfzeile akzeptiert, damit bestehende Lesezeichen und Prüfungen
 * weiter funktionieren und niemand ausgesperrt ist, falls die Sitzung klemmt.
 *
 * Die Automatik (n8n) hat kein Cookie. Sie meldet sich an den /api-Routen mit
 * dem gemeinsamen Geheimnis (X-Seil-Secret) – demselben, mit dem das Cockpit
 * ihre Webhooks aufruft – und tritt als „automatik“ auf. Nur an /api: eine
 * Maschine braucht keine Seiten.
 *
 * Ohne hinterlegte Zugänge lässt die Middleware durch: eine fehlende
 * Umgebungsvariable soll die Seite nicht unbrauchbar machen.
 */
export async function middleware(request: NextRequest) {
  const liste = zugaenge();
  if (Object.keys(liste).length === 0) return NextResponse.next();

  const pfad = request.nextUrl.pathname;
  if (pfad === "/anmelden" || pfad.startsWith("/api/anmelden") || pfad.startsWith("/api/abmelden")) {
    return NextResponse.next();
  }

  const geheimnis = process.env.COCKPIT_SECRET ?? process.env.COCKPIT_PASS ?? "";
  const ausCookie = await sitzungPruefen(request.cookies.get(SITZUNG_COOKIE)?.value, geheimnis);
  const angemeldet = ausCookie ?? ausKopfzeile(request, liste) ?? ausMaschine(request, pfad);

  if (angemeldet) {
    const kopfzeilen = new Headers(request.headers);
    kopfzeilen.set("x-seil-benutzer", angemeldet);
    return NextResponse.next({ request: { headers: kopfzeilen } });
  }

  const ziel = new URL("/anmelden", request.url);
  if (pfad !== "/") ziel.searchParams.set("weiter", pfad + request.nextUrl.search);
  return NextResponse.redirect(ziel);
}

/** Maschinenzugang der Automatik: nur an /api, nur mit dem gemeinsamen Geheimnis. */
function ausMaschine(request: NextRequest, pfad: string): string | null {
  if (!pfad.startsWith("/api/")) return null;
  const soll = process.env.MODUL01_SECRET ?? "";
  const ist = request.headers.get("x-seil-secret") ?? "";
  if (!soll || soll.length !== ist.length) return null;
  let abweichung = 0;
  for (let i = 0; i < soll.length; i++) abweichung |= soll.charCodeAt(i) ^ ist.charCodeAt(i);
  return abweichung === 0 ? SYSTEM_KUERZEL : null;
}

/** Alte Basic-Auth-Kopfzeile, weiterhin gültig. */
function ausKopfzeile(request: NextRequest, liste: Record<string, string>): string | null {
  const kopf = request.headers.get("authorization") ?? "";
  if (!kopf.startsWith("Basic ")) return null;
  let entschluesselt = "";
  try {
    entschluesselt = atob(kopf.slice(6));
  } catch {
    return null;
  }
  const trenner = entschluesselt.indexOf(":");
  if (trenner <= 0) return null;
  const b = entschluesselt.slice(0, trenner).toLowerCase();
  const p = entschluesselt.slice(trenner + 1);
  const soll = liste[b];
  if (soll === undefined || soll.length !== p.length) return null;
  let abweichung = 0;
  for (let i = 0; i < soll.length; i++) abweichung |= soll.charCodeAt(i) ^ p.charCodeAt(i);
  return abweichung === 0 ? b : null;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
