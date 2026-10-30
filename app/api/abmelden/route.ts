import { NextResponse } from "next/server";
import { SITZUNG_COOKIE } from "@/lib/sitzung-token";

export const dynamic = "force-dynamic";

/** Meldet ab, indem das Sitzungs-Cookie gelöscht wird. */
export async function POST(request: Request): Promise<NextResponse> {
  const antwort = NextResponse.redirect(new URL("/anmelden?abgemeldet=1", request.url), { status: 303 });
  antwort.cookies.set({ name: SITZUNG_COOKIE, value: "", path: "/", maxAge: 0 });
  return antwort;
}
