-- AC-142 / AC-143. Add public place details and Community Hub summary fields.
begin;

alter table public.accesshub_places
  add column if not exists description text not null default '',
  add column if not exists contact_phone text,
  add column if not exists website text,
  add column if not exists opening_hours text[] not null default '{}',
  add column if not exists community_rating double precision,
  add column if not exists community_review_count integer not null default 0,
  add column if not exists verification_badge text,
  add column if not exists last_verified_at timestamptz;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'accesshub_places_community_rating_range'
  ) then
    alter table public.accesshub_places
      add constraint accesshub_places_community_rating_range
      check (community_rating is null or community_rating between 0 and 5);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'accesshub_places_review_count_nonnegative'
  ) then
    alter table public.accesshub_places
      add constraint accesshub_places_review_count_nonnegative
      check (community_review_count >= 0);
  end if;
end $$;

commit;

