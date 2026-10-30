import { NextResponse } from "next/server";
import { SITZUNG_COOKIE, sitzungErzeugen, zugaenge } from "@/lib/sitzung-token";

export const dynamic = "force-dynamic";

/** Prüft Kürzel und Passwort und setzt das Sitzungs-Cookie. */
export async function POST(request: Request): Promise<NextResponse> {
  const form = await request.formData();
  const kuerzel = String(form.get("kuerzel") ?? "").trim().toLowerCase();
  const passwort = String(form.get("passwort") ?? "");
  const weiter = String(form.get("weiter") ?? "/") || "/";

  const liste = zugaenge();
  const soll = liste[kuerzel];
  const geheimnis = process.env.COCKPIT_SECRET ?? process.env.COCKPIT_PASS ?? "";

  // Gleich lange Prüfung, damit die Dauer nichts über den Treffer verrät.
  let passt = soll !== undefined && soll.length === passwort.length;
  if (passt && soll !== undefined) {
    let abweichung = 0;
    for (let i = 0; i < soll.length; i++) abweichung |= soll.charCodeAt(i) ^ passwort.charCodeAt(i);
    passt = abweichung === 0;
  }

  if (!passt || !geheimnis) {
    const ziel = new URL("/anmelden", request.url);
    ziel.searchParams.set("fehler", geheimnis ? "1" : "2");
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
