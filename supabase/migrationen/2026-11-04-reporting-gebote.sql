-- SEIL Cockpit · Reporting nach Lucas Vorlage (04.11.2026): Gebote, Käufertyp,
-- Absagegrund und Ausstiegsstufe. Idempotent.

-- Ein Gebot je Investor und Mandat; es wandert von der Indikation über die
-- Due Diligence zum SEIL-HERO-Angebot. Beträge werden nie automatisch aus
-- Mails übernommen, nur von Hand erfasst. Änderungen stehen in der Spur.
create table if not exists gebot (
  id uuid primary key default gen_random_uuid(),
  mandat text not null,
  investor_id text not null,
  firma text,
  betrag numeric check (betrag is null or betrag >= 0),
  stufe text not null default 'indikation' check (stufe in ('indikation','due_diligence','hero')),
  preis_passt boolean,                       -- null = automatisch aus dem Kaufpreis des Mandats
  timeline boolean not null default false,
  finanzierung boolean not null default false,
  ohne_bedingungen boolean not null default false,
  circle_kunde boolean not null default false,
  zurueckgezogen boolean not null default false,
  quelle text check (quelle is null or quelle in ('mail','telefon','termin','sonstiges')),
  datum date default current_date,
  notiz text,
  erstellt timestamptz not null default now(),
  erstellt_durch text,
  geaendert timestamptz not null default now(),
  geaendert_durch text,
  unique (mandat, investor_id)
);
create index if not exists gebot_mandat on gebot(mandat);
alter table gebot enable row level security;
revoke all on gebot from anon, authenticated;
grant select, insert, update, delete on gebot to service_role;

-- Käuferprofil (Lucas Reporting): privat · semi-professionell · professionell/institutionell
alter table kunde add column if not exists kaeufertyp text;
alter table kunde drop constraint if exists kunde_kaeufertyp_check;
alter table kunde add constraint kunde_kaeufertyp_check check (kaeufertyp is null or kaeufertyp in ('privat','semiprofessionell','professionell'));

-- Absagegrund und die Stufe, in der jemand ausgestiegen ist (für „ausgeschieden“ im Funnel)
alter table kontakt add column if not exists absagegrund text;
alter table kontakt drop constraint if exists kontakt_absagegrund_check;
alter table kontakt add constraint kontakt_absagegrund_check check (absagegrund is null or absagegrund in ('preis','lage','finanzierung','zustand','timing','sonstiges'));
alter table kontakt add column if not exists ausgeschieden_bei text;
