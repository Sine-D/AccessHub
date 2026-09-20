-- AC-185. New dedicated public-directory table: does not overwrite existing team tables.
begin;
create table if not exists public.accesshub_places (
 id text primary key,
 title text not null,
 type text not null check (type in ('seller','ngo','company','delivery','service','event')),
 lat double precision not null check(lat between -90 and 90),
 lng double precision not null check(lng between -180 and 180),
 address text not null,
 badge text,
 category text,
 accessibility_features text[] not null default '{}',
 accessibility_rating double precision not null default 0 check(accessibility_rating between 0 and 5),
 image text not null default '',
 published boolean not null default false,
 constraint known_accessibility_features check(accessibility_features <@ array['wheelchair_ramp','step_free','accessible_parking','accessible_restroom','braille','sign_language','tactile_paving','elevator','high_contrast']::text[])
);
create index if not exists accesshub_places_features_gin on public.accesshub_places using gin(accessibility_features);
alter table public.accesshub_places enable row level security;
grant select on public.accesshub_places to anon,authenticated;
-- Idempotent creation; no mutation privileges granted to public clients.
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='accesshub_places' and policyname='Read published accesshub places') then
  create policy "Read published accesshub places" on public.accesshub_places for select to anon,authenticated using(published=true);
 end if;
end $$;
commit;

