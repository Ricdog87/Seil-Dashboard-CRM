-- Projektseite (Zielbild 2.2): Key Facts am Mandat, Produkttyp, weitere Objektfakten.
-- Nur zusätzliche Spalten, nichts wird geändert oder gelöscht. Am 12.11.2026 eingespielt.
alter table public.mandat
  add column if not exists einheiten integer,
  add column if not exists flaeche_qm numeric,
  add column if not exists jahresnettokaltmiete numeric,
  add column if not exists produkttyp text,
  add column if not exists fakten jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'mandat_produkttyp_gueltig') then
    alter table public.mandat
      add constraint mandat_produkttyp_gueltig check (produkttyp is null or produkttyp in ('A','B','C','D','E'));
  end if;
end $$;

comment on column public.mandat.einheiten is 'Key Fact: Anzahl Einheiten (von Hand oder aus Modul 01 übernommen)';
comment on column public.mandat.flaeche_qm is 'Key Fact: Miet-/Wohnfläche in m²';
comment on column public.mandat.jahresnettokaltmiete is 'Key Fact: Jahresnettokaltmiete in Euro';
comment on column public.mandat.produkttyp is 'Produkttyp nach Pre-Sound-Skill: A Bestand, B Bestand mit Entwicklungspotenzial, C Entwicklungsgrundstück, D Sanierungsobjekt, E Forward/Neubau';
comment on column public.mandat.fakten is 'Weitere Objektfakten als Text: baujahr, grundstueck, flurstuecke, einheitenMix, leerstand, adresse';
