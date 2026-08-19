"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Building2, ClipboardList, LayoutDashboard, Megaphone, Search, Users } from "lucide-react";
import { aufgaben, investoren, objekte } from "@/lib/mock-data";
import { ICON_SM, ICON_STROKE, Input } from "@/components/ui";

interface Treffer {
  id: string;
  gruppe: string;
  icon: LucideIcon;
  titel: string;
  detail?: string;
  href: string;
}

/** Suchraum: Objekte, Investoren, offene Aufgaben und die drei Bereiche. */
function alleTreffer(): Treffer[] {
  return [
    { id: "p1", gruppe: "Bereiche", icon: LayoutDashboard, titel: "Übersicht", href: "/" },
    { id: "p2", gruppe: "Bereiche", icon: Megaphone, titel: "Vermarktung", href: "/vermarktung" },
    { id: "p3", gruppe: "Bereiche", icon: ClipboardList, titel: "Aufgaben", href: "/aufgaben" },
    ...objekte.map((o) => ({
      id: o.id,
      gruppe: "Objekte",
      icon: Building2,
      titel: o.name,
      detail: `${o.assetklasse} · ${o.stadt}`,
      href: `/objekte/${o.id}`,
    })),
    ...investoren.map((i) => ({
      id: i.id,
      gruppe: "Investoren",
      icon: Users,
      titel: i.firma,
      detail: `${i.typ} · ${i.ansprechpartner}`,
      href: `/investoren/${i.id}`,
    })),
    ...aufgaben
      .filter((t) => !t.erledigt)
      .map((t) => ({
        id: t.id,
        gruppe: "Offene Aufgaben",
        icon: ClipboardList,
        titel: t.titel,
        href: "/aufgaben",
      })),
  ];
}

/**
 * Globale Suche des Cockpits: öffnet mit Cmd/Ctrl+K (oder über den Such-Knopf
 * in der Kopfleiste), findet Objekte, Investoren und Aufgaben, navigiert per
 * Enter. Bewusst ohne Schatten und Verlauf – Rahmen auf abgedunkeltem Grund.
 */
export function BefehlsPalette() {
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const [frage, setFrage] = useState("");
  const [aktiv, setAktiv] = useState(0);

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

  const treffer = useMemo(() => {
    const q = frage.trim().toLowerCase();
    const alle = alleTreffer();
    const gefiltert = q
      ? alle.filter((t) => `${t.titel} ${t.detail ?? ""}`.toLowerCase().includes(q))
      : alle;
    return gefiltert.slice(0, 9);
  }, [frage]);

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
        <span className="hidden md:inline">Suchen</span>
        <kbd className="rounded-seil border border-seil-line px-1 text-kicker">⌘K</kbd>
      </button>

      {offen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-seil-bg/80 px-4 pt-24"
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
                placeholder="Objekt, Investor oder Aufgabe suchen …"
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
                Keine Treffer für „{frage}“.
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
              ↑↓ wählen · Enter öffnen · Esc schließen
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
