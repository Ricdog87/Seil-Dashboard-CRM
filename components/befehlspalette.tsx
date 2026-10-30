"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Building2, FolderOpen, LayoutDashboard, Search, Stamp, Users } from "lucide-react";
import { ICON_SM, ICON_STROKE, Input } from "@/components/ui";
import type { LiveInvestoren } from "@/app/api/investoren/route";
import type { Modul01Stand } from "@/lib/modul01";

interface Treffer {
  id: string;
  gruppe: string;
  icon: LucideIcon;
  titel: string;
  detail?: string;
  href: string;
}

const BEREICHE: Treffer[] = [
  { id: "b1", gruppe: "Bereiche", icon: LayoutDashboard, titel: "Übersicht", href: "/" },
  { id: "b2", gruppe: "Bereiche", icon: Stamp, titel: "Freigaben", href: "/freigaben" },
  { id: "b3", gruppe: "Bereiche", icon: Users, titel: "Kunden", href: "/kunden" },
];

/**
 * Die Suche des Cockpits – über die echten Kunden, nicht über Beispiele.
 *
 * Gesucht wird dort, wo die Daten leben: der Investorenname geht an die
 * Liveliste in OneDrive, die Datenräume kommen aus Modul 01. Die Liste ist zu
 * groß, um sie in den Browser zu laden, deshalb sucht der Server mit – mit
 * kurzer Verzögerung, damit nicht jeder Tastendruck eine Abfrage auslöst.
 */
export function BefehlsPalette() {
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const [frage, setFrage] = useState("");
  const [aktiv, setAktiv] = useState(0);
  const [investoren, setInvestoren] = useState<LiveInvestoren | null>(null);
  const [raeume, setRaeume] = useState<Modul01Stand | null>(null);
  const [sucht, setSucht] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOffen((o) => !o);
        setFrage("");
        setAktiv(0);
      }
      if (e.key === "Escape") setOffen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Datenräume einmal beim Öffnen – es sind wenige, die passen in den Browser.
  useEffect(() => {
    if (!offen || raeume) return;
    fetch("/api/modul01/status", { cache: "no-store" })
      .then((r) => r.json() as Promise<Modul01Stand>)
      .then(setRaeume)
      .catch(() => undefined);
  }, [offen, raeume]);

  // Investoren sucht der Server: 1362 Einträge gehören nicht in den Browser.
  useEffect(() => {
    if (!offen) return;
    const q = frage.trim();
    setSucht(true);
    const t = setTimeout(
      () => {
        fetch(`/api/investoren?limit=40${q ? `&suche=${encodeURIComponent(q)}` : ""}`, {
          cache: "no-store",
        })
          .then((r) => r.json() as Promise<LiveInvestoren>)
          .then(setInvestoren)
          .catch(() => undefined)
          .finally(() => setSucht(false));
      },
      q ? 250 : 0,
    );
    return () => clearTimeout(t);
  }, [offen, frage]);

  const treffer = useMemo(() => {
    const q = frage.trim().toLowerCase();
    const passt = (t: Treffer) => !q || `${t.titel} ${t.detail ?? ""}`.toLowerCase().includes(q);

    const datenraeume: Treffer[] = raeume
      ? [...Object.values(raeume.objekte ?? {}), ...(raeume.unbekannt ?? [])].map((o, i) => ({
          id: `dr-${i}`,
          gruppe: "Datenräume",
          icon: FolderOpen,
          titel: (o.objektName ?? "").replace(/_\d{8}-\d{6}$/, ""),
          detail: `${o.dokumente?.length ?? 0} offene Prüffälle`,
          href: "/",
        }))
      : [];

    const kunden: Treffer[] = (investoren?.investoren ?? []).slice(0, 12).map((i) => ({
      id: i.id,
      gruppe: "Kunden",
      icon: Building2,
      titel: i.firma,
      detail: [i.ansprechpartner, (i.regionen ?? []).join(", ")].filter(Boolean).join(" · "),
      href: `/kunden/${encodeURIComponent(i.id)}`,
    }));

    return [...kunden, ...datenraeume.filter(passt), ...BEREICHE.filter(passt)].slice(0, 12);
  }, [frage, investoren, raeume]);

  const oeffne = (t: Treffer) => {
    setOffen(false);
    router.push(t.href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOffen(true);
          setFrage("");
          setAktiv(0);
        }}
        className="inline-flex h-control items-center gap-2 rounded-seil border border-seil-line bg-seil-card-alt px-2.5 text-body text-seil-muted transition-colors hover:text-seil-text"
      >
        <Search size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
        <span className="sr-only">Suchen</span>
        <span className="hidden md:inline" aria-hidden>
          Suchen
        </span>
        <kbd className="hidden rounded-seil border border-seil-line px-1 text-kicker sm:inline">⌘K</kbd>
      </button>

      {offen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-seil-bg/80 px-4 pt-14 sm:pt-24"
          onClick={() => setOffen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Cockpit durchsuchen"
        >
          <div
            className="w-full max-w-xl rounded-seil border border-seil-line bg-seil-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-seil-line p-2">
              <Input
                autoFocus
                value={frage}
                placeholder="Kunde, Ansprechpartner, Region oder Datenraum …"
                aria-label="Suchbegriff"
                className="w-full"
                onChange={(e) => {
                  setFrage(e.target.value);
                  setAktiv(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setAktiv((a) => Math.min(a + 1, treffer.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setAktiv((a) => Math.max(a - 1, 0));
                  }
                  if (e.key === "Enter" && treffer[aktiv]) oeffne(treffer[aktiv]);
                }}
              />
            </div>
            {treffer.length === 0 ? (
              <p className="px-4 py-6 text-center text-kicker text-seil-muted">
                {sucht ? "sucht …" : `Keine Treffer für „${frage}“.`}
              </p>
            ) : (
              <ul className="max-h-[50vh] overflow-y-auto py-1" role="listbox">
                {treffer.map((t, i) => {
                  const Icon = t.icon;
                  return (
                    <li key={`${t.gruppe}-${t.id}`} role="option" aria-selected={i === aktiv}>
                      <button
                        type="button"
                        onClick={() => oeffne(t)}
                        onMouseEnter={() => setAktiv(i)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-body ${
                          i === aktiv ? "bg-seil-card-alt text-seil-text" : "text-seil-body"
                        }`}
                      >
                        <Icon
                          size={ICON_SM}
                          strokeWidth={ICON_STROKE}
                          className="shrink-0 text-seil-muted"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{t.titel}</span>
                          {t.detail ? (
                            <span className="block truncate text-kicker text-seil-muted">
                              {t.detail}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-kicker text-seil-muted">{t.gruppe}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="border-t border-seil-line px-4 py-2 text-kicker text-seil-muted">
              ↑↓ wählen · Enter öffnen · Esc schließen · gesucht wird in der Liveliste
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
