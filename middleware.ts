import { NextResponse, type NextRequest } from "next/server";

/**
 * Passwortschutz für das Cockpit.
 *
 * Sobald das Cockpit echte Datenraum-Stände aus Modul 01 zeigt, darf es nicht
 * mehr offen im Netz stehen. Der Schutz ist bewusst durchlässig, wenn er nicht
 * konfiguriert ist: ohne COCKPIT_USER und COCKPIT_PASS verhält sich die Seite
 * wie bisher. So kann eine fehlende Variable die Demo nicht blockieren.
 */
export function middleware(request: NextRequest) {
  const benutzer = process.env.COCKPIT_USER;
  const passwort = process.env.COCKPIT_PASS;
  if (!benutzer || !passwort) return NextResponse.next();

  const kopf = request.headers.get("authorization") ?? "";
  if (kopf.startsWith("Basic ")) {
    let entschluesselt = "";
    try {
      entschluesselt = atob(kopf.slice(6));
    } catch {
      entschluesselt = "";
    }
    const trenner = entschluesselt.indexOf(":");
    if (trenner > 0) {
      const b = entschluesselt.slice(0, trenner);
      const p = entschluesselt.slice(trenner + 1);
      if (gleich(b, benutzer) && gleich(p, passwort)) return NextResponse.next();
    }
  }

  return new NextResponse("Anmeldung erforderlich.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="SEIL Cockpit", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

/** Vergleich ohne frühen Abbruch, damit die Laufzeit nichts über den Wert verrät. */
function gleich(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let abweichung = 0;
  for (let i = 0; i < a.length; i++) abweichung |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return abweichung === 0;
}

export const config = {
  // Statisches und Build-Artefakte bleiben frei, sonst lädt die Seite nicht.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
