import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  CircleX,
  Clock,
  Euro,
  FilePenLine,
  FolderCheck,
  Handshake,
} from "lucide-react";
import type { KontaktStatus } from "@/lib/types";
import { Badge, Card, type Tone } from "@/components/ui";

/* --- Textbausteine -------------------------------------------------------- */

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-kicker tracking-kicker text-seil-muted uppercase">{children}</span>
  );
}

export function SeitenKopf({ titel, untertitel }: { titel: string; untertitel?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-title text-seil-text">{titel}</h1>
      {untertitel ? <p className="mt-1 max-w-[70ch] text-seil-muted">{untertitel}</p> : null}
    </div>
  );
}

export function EntityLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-seil-text underline-offset-2 hover:text-seil-accent hover:underline">
      {children}
    </Link>
  );
}

/* --- Antwortstatus eines Investors zu einem Objekt ------------------------ */

export const kontaktStatusMeta: Record<
  KontaktStatus,
  { label: string; tone: Tone; icon: LucideIcon }
> = {
  vorgemerkt: { label: "Vorgemerkt", tone: "neutral", icon: Bookmark },
  angeschrieben: { label: "Keine Rückmeldung", tone: "warning", icon: Clock },
  interesse: { label: "Interesse", tone: "success", icon: Handshake },
  preisanfrage: { label: "Preisanfrage", tone: "success", icon: Euro },
  nda_unterzeichnet: { label: "NDA unterzeichnet", tone: "info", icon: FilePenLine },
  datenraum_freigegeben: { label: "Datenraum freigegeben", tone: "info", icon: FolderCheck },
  abgesagt: { label: "Abgesagt", tone: "neutral", icon: CircleX },
};

export function KontaktStatusBadge({ status }: { status: KontaktStatus }) {
  const meta = kontaktStatusMeta[status];
  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {meta.label}
    </Badge>
  );
}

/* --- KPI-Kachel -----------------------------------------------------------
   Die einzige Stelle, an der die Display-Groesse verwendet wird. */

export function KpiKachel({
  label,
  wert,
  sub,
  href,
}: {
  label: string;
  wert: number | string;
  sub?: string;
  href?: string;
}) {
  const inhalt = (
    <>
      <Kicker>{label}</Kicker>
      <div className="mt-2 text-display text-seil-text">{wert}</div>
      {sub ? <div className="mt-2 text-seil-muted">{sub}</div> : null}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-seil border border-seil-line bg-seil-card px-4 py-3 transition-colors hover:border-seil-accent"
      >
        {inhalt}
      </Link>
    );
  }
  return <Card className="px-4 py-3">{inhalt}</Card>;
}

/* --- Fortschritt (Datenraum-Checkliste) ---------------------------------- */

export function Fortschritt({
  vorhanden,
  gesamt,
  breit = false,
}: {
  vorhanden: number;
  gesamt: number;
  breit?: boolean;
}) {
  const anteil = gesamt === 0 ? 0 : vorhanden / gesamt;
  const voll = gesamt > 0 && vorhanden === gesamt;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        className={`h-1 overflow-hidden rounded-full bg-seil-card-alt ${breit ? "w-28" : "w-16"}`}
        aria-hidden
      >
        <span
          className={`block h-full rounded-full ${voll ? "bg-seil-success" : "bg-seil-warning"}`}
          style={{ width: `${Math.round(anteil * 100)}%` }}
        />
      </span>
      {/* Der Zahlenwert steht immer daneben - der Balken allein traegt nichts. */}
      <span className="text-seil-body">
        {vorhanden}/{gesamt}
      </span>
    </span>
  );
}

/* --- Follow-up-Stufe ------------------------------------------------------ */

export function FollowUpStufe({ stufe }: { stufe: 0 | 1 | 2 | 3 }) {
  if (stufe === 0) return <span className="text-seil-muted">–</span>;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="inline-flex gap-1" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 w-1.5 rounded-full ${n <= stufe ? "bg-seil-accent" : "bg-seil-line"}`}
          />
        ))}
      </span>
      <span className="text-seil-body">Stufe {stufe}/3</span>
    </span>
  );
}
