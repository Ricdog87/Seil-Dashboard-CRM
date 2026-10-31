-- SEIL Cockpit · Modul 01 → Modul 02: Region für den Abgleich, Zeitpunkt des
-- letzten Abgleichs, Herkunft des Mandats. Idempotent.
alter table mandat add column if not exists region text;
alter table mandat add column if not exists abgleich_am timestamptz;
alter table mandat add column if not exists quelle text not null default 'cockpit';
alter table mandat drop constraint if exists mandat_quelle_check;
alter table mandat add constraint mandat_quelle_check check (quelle in ('cockpit','modul01'));
comment on column mandat.region is 'Bundesland – hartes Kriterium des Abgleichs gegen die Liveliste (Flowchart 13)';
comment on column mandat.abgleich_am is 'Letzter automatischer Abgleich gegen die Liveliste';
comment on column mandat.quelle is 'cockpit = von Hand angelegt, modul01 = aus einem Datenraum-Lauf';
