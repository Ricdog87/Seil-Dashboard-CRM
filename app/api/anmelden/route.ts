import { NextResponse } from "next/server";
import { SITZUNG_COOKIE, sitzungErzeugen, zugaenge } from "@/lib/sitzung-token";

export const dynamic = "force-dynamic";

/** Prüft Kürzel und Passwort und setzt das Sitzungs-Cookie. */
export async function POST(request: Request): Promise<NextResponse> {
  const form = await request.formData();
  const eingabe = String(form.get("kuerzel") ?? "").trim().toLowerCase();
  const passwortRoh = String(form.get("passwort") ?? "");
  const weiter = String(form.get("weiter") ?? "/") || "/";

  // Wer die Mailadresse einträgt, soll das erfahren und nicht raten müssen.
  // Der Hinweis verrät nichts: er sagt nur, dass hier das Kürzel hingehört.
  const nachMail = eingabe.includes("@");
  const kuerzel = nachMail ? eingabe.split("@")[0] : eingabe;

  const liste = zugaenge();
  const soll = liste[kuerzel];
  const geheimnis = process.env.COCKPIT_SECRET ?? process.env.COCKPIT_PASS ?? "";

  /** Zeichenweiser Vergleich – die Dauer soll nichts über den Treffer verraten. */
  const stimmt = (eingegeben: string) => {
    if (soll === undefined || soll.length !== eingegeben.length) return false;
    let abweichung = 0;
    for (let i = 0; i < soll.length; i++) abweichung |= soll.charCodeAt(i) ^ eingegeben.charCodeAt(i);
    return abweichung === 0;
  };

  // Aus einer Nachricht kopierte Passwörter tragen oft ein Leerzeichen oder
  // einen Zeilenumbruch mit. Das ist kein falsches Passwort, das ist die
  // Zwischenablage – deshalb zählt auch die getrimmte Fassung.
  const passt = stimmt(passwortRoh) || stimmt(passwortRoh.trim());

  if (!passt || !geheimnis) {
    const ziel = new URL("/anmelden", request.url);
    ziel.searchParams.set("fehler", !geheimnis ? "2" : nachMail ? "3" : "1");
    if (weiter !== "/") ziel.searchParams.set("weiter", weiter);
    return NextResponse.redirect(ziel, { status: 303 });
  }

  const antwort = NextResponse.redirect(new URL(weiter, request.url), { status: 303 });
  antwort.cookies.set({
    name: SITZUNG_COOKIE,
    value: await sitzungErzeugen(kuerzel, geheimnis),
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 3600,
  });
  return antwort;
}
