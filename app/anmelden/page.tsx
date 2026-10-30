import { SeilLogo } from "@/components/seil-logo";

export const dynamic = "force-dynamic";

export default async function AnmeldenSeite({
  searchParams,
}: {
  searchParams: Promise<{ fehler?: string; weiter?: string; abgemeldet?: string }>;
}) {
  const s = await searchParams;
  const meldung =
    s.fehler === "1"
      ? "Kürzel oder Passwort stimmt nicht."
      : s.fehler === "2"
        ? "Die Anmeldung ist auf dem Server noch nicht eingerichtet."
        : s.abgemeldet
          ? "Abgemeldet. Bis später."
          : null;

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-4">
      <div className="mb-6 flex items-center gap-3">
        <SeilLogo />
        <div className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">
          Cockpit · Modul 02
        </div>
      </div>

      <h1 className="text-title text-seil-text">Anmelden</h1>
      <p className="mt-1 text-body text-seil-body">
        Mit dem persönlichen Kürzel, nicht mit der Mailadresse.
      </p>

      {meldung ? (
        <p
          role="status"
          className={`mt-4 rounded-[var(--seil-radius)] border px-3 py-2 text-body ${
            s.fehler
              ? "border-seil-danger bg-seil-danger-bg text-seil-text"
              : "border-seil-line bg-seil-card text-seil-body"
          }`}
        >
          {meldung}
        </p>
      ) : null}

      <form action="/api/anmelden" method="post" className="mt-5 grid gap-3">
        <input type="hidden" name="weiter" value={s.weiter ?? "/"} />
        <label className="grid gap-1">
          <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Kürzel</span>
          <input
            id="kuerzel"
            name="kuerzel"
            autoComplete="username"
            autoCapitalize="none"
            autoFocus
            required
            placeholder="z. B. ag"
            className="h-9 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card-alt px-3 text-body text-seil-text placeholder:text-seil-muted focus:border-seil-accent focus:outline-none"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-kicker uppercase tracking-[var(--seil-tracking-kicker)] text-seil-muted">Passwort</span>
          <input
            id="passwort"
            name="passwort"
            type="password"
            autoComplete="current-password"
            required
            className="h-9 rounded-[var(--seil-radius)] border border-seil-line bg-seil-card-alt px-3 text-body text-seil-text focus:border-seil-accent focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="mt-1 h-9 rounded-[var(--seil-radius)] border border-seil-accent bg-seil-accent-bg text-body text-seil-text hover:border-seil-accent-dk"
        >
          Anmelden
        </button>
      </form>

      <p className="mt-6 text-kicker leading-relaxed text-seil-muted">
        Die Anmeldung gilt zwölf Stunden. Danach ist sie erneut nötig. Passwort vergessen oder
        verloren: bei Aylin melden.
      </p>
    </main>
  );
}
