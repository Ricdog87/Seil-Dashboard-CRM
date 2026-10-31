-- SEIL Cockpit · Transaktionsprozess nach dem Flowchart (17 Schritte) und
-- Standardprozess Kommunikation Investoren. Einmal im Supabase-SQL-Editor
-- ausführen (Projekt „seil“). Idempotent.
--
-- Alte Schrittnummern (26er-Liste) → neue (17er-Liste):
-- 1→1, 2/3→2, 4→3, 5→4, 6→5, 7→6, 8→7, 9→8, 10→9, 11→10, 13→11, 14→13, 15→14, 16→15, 17→17;
-- 12 (NDA Vermarktung), 18–26 entfallen (gehören zu Schritt 15 bzw. liegen hinter dem Flowchart).
begin;
create temp table _map (alt int primary key, neu int);
insert into _map values (1,1),(2,2),(3,2),(4,3),(5,4),(6,5),(7,6),(8,7),(9,8),(10,9),(11,10),(13,11),(14,13),(15,14),(16,15),(17,17);
delete from mandat_schritt s where not exists (select 1 from _map m where m.alt = s.schritt);
delete from mandat_schritt s using mandat_schritt t, _map ms, _map mt
  where s.mandat = t.mandat and s.id <> t.id and ms.alt = s.schritt and mt.alt = t.schritt and ms.neu = mt.neu
    and (s.geaendert < t.geaendert or (s.geaendert = t.geaendert and s.id < t.id));
update mandat_schritt s set schritt = m.neu from _map m where m.alt = s.schritt and m.neu <> s.schritt;
drop table _map;
alter table mandat_schritt drop constraint if exists mandat_schritt_schritt_check;
alter table mandat_schritt add constraint mandat_schritt_schritt_check check (schritt >= 1 and schritt <= 17);

-- Trichter: „Besichtigung“ als Stufe (Flowchart 17 · Site visit); letzte Antwort nach Standardprozess.
alter table kontakt drop constraint if exists kontakt_status_check;
alter table kontakt add constraint kontakt_status_check check (status in (
  'vorgemerkt','angeschrieben','interesse','nda_angefragt','nda_unterzeichnet','datenraum_freigegeben','preisanfrage','besichtigung','abgesagt'));
alter table kontakt add column if not exists letzte_antwort text;
alter table kontakt add column if not exists letzte_antwort_am timestamptz;
alter table kontakt drop constraint if exists kontakt_letzte_antwort_check;
alter table kontakt add constraint kontakt_letzte_antwort_check check (letzte_antwort is null or letzte_antwort in (
  'anfrage','absage','kriterien','preisfrage','infos','telefonat','besichtigung','sonstiges'));
comment on column kontakt.letzte_antwort is 'Einordnung der letzten Antwort nach Standardprozess Kommunikation Investoren';
commit;
