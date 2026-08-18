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

// --- Badge -----------------------------------------------------------------

export type BadgeTon = "ok" | "warn" | "crit" | "accent" | "neutral";

const tonKlassen: Record<BadgeTon, string> = {
  ok: "bg-ok-tint text-ok",
  warn: "bg-warn-tint text-warn",
  crit: "bg-crit-tint text-crit",
  accent: "bg-accent-tint text-accent",
  neutral: "bg-neutral-tint text-ink-soft",
};

export function Badge({
  ton,
  icon: Icon,
  children,
}: {
  ton: BadgeTon;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${tonKlassen[ton]}`}
    >
      {Icon ? <Icon size={11} strokeWidth={2.2} aria-hidden /> : null}
      {children}
    </span>
  );
}

// --- Antwortstatus eines Investors zu einem Objekt -------------------------

export const kontaktStatusMeta: Record<
  KontaktStatus,
  { label: string; ton: BadgeTon; icon: LucideIcon }
> = {
  vorgemerkt: { label: "Vorgemerkt", ton: "neutral", icon: Bookmark },
  angeschrieben: { label: "Keine Rückmeldung", ton: "warn", icon: Clock },
  interesse: { label: "Interesse", ton: "ok", icon: Handshake },
  preisanfrage: { label: "Preisanfrage", ton: "ok", icon: Euro },
  nda_unterzeichnet: { label: "NDA unterzeichnet", ton: "accent", icon: FilePenLine },
  datenraum_freigegeben: { label: "Datenraum freigegeben", ton: "accent", icon: FolderCheck },
  abgesagt: { label: "Abgesagt", ton: "neutral", icon: CircleX },
};

export function KontaktStatusBadge({ status }: { status: KontaktStatus }) {
  const meta = kontaktStatusMeta[status];
  return (
    <Badge ton={meta.ton} icon={meta.icon}>
      {meta.label}
    </Badge>
  );
}

// --- KPI-Kachel ------------------------------------------------------------

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
      <div className="text-[11px] font-medium tracking-wide text-ink-mute uppercase">{label}</div>
      <div className="mt-1 text-[26px] leading-none font-semibold">{wert}</div>
      {sub ? <div className="mt-1.5 text-[12px] text-ink-soft">{sub}</div> : null}
    </>
  );
  const klasse = "karte block px-4 py-3";
  return href ? (
    <Link href={href} className={`${klasse} transition-colors hover:border-line-strong`}>
      {inhalt}
    </Link>
  ) : (
    <div className={klasse}>{inhalt}</div>
  );
}

// --- Fortschrittsbalken (Datenraum) ---------------------------------------

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
  const voll = vorhanden === gesamt && gesamt > 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`h-1.5 overflow-hidden rounded-full bg-neutral-tint ${breit ? "w-28" : "w-16"}`}
        aria-hidden
      >
        <span
          className={`block h-full rounded-full ${voll ? "bg-ok" : "bg-warn"}`}
          style={{ width: `${Math.round(anteil * 100)}%` }}
        />
      </span>
      <span className="text-[12px] whitespace-nowrap tabular-nums text-ink-soft">
        {vorhanden}/{gesamt}
      </span>
    </span>
  );
}

// --- Follow-up-Stufe -------------------------------------------------------

export function FollowUpStufe({ stufe }: { stufe: 0 | 1 | 2 | 3 }) {
  if (stufe === 0) {
    return <span className="text-[12px] text-ink-mute">–</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 w-1.5 rounded-full ${n <= stufe ? "bg-ink-soft" : "bg-line-strong"}`}
          />
        ))}
      </span>
      <span className="text-[12px] whitespace-nowrap tabular-nums text-ink-soft">Stufe {stufe}/3</span>
    </span>
  );
}

// --- Seitenkopf & Kleinkram ------------------------------------------------

export function SeitenKopf({ titel, untertitel }: { titel: string; untertitel?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[20px] font-semibold tracking-tight">{titel}</h1>
      {untertitel ? <p className="mt-0.5 text-[13px] text-ink-soft">{untertitel}</p> : null}
    </div>
  );
}

export function LeerHinweis({ text }: { text: string }) {
  return <div className="px-4 py-6 text-center text-[12px] text-ink-mute">{text}</div>;
}

export function EntityLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-ink hover:text-accent hover:underline">
      {children}
    </Link>
  );
}
