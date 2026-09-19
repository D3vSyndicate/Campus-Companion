-- Campus events schedule
--
-- The app reads events from public.event (title, description, venue_id, category, image_url,
-- organizer). That table has no date or time, so an events schedule cannot say when anything happens.
-- This migration adds what is missing and sets the security rules:
--   everyone can read visible events, only coordinators and admins can change them.
--
-- Safe to run more than once, and safe to run against the existing table: the table is only created
-- if missing, columns are only added if missing, and no existing data is changed.
--
-- Depends on public.is_staff() from supabase/campus_features.sql. Run that file first.

do $$
begin
  if to_regprocedure('public.is_staff()') is null then
    raise exception 'public.is_staff() is missing. Run supabase/campus_features.sql before this migration.';
  end if;
end
$$;

create table if not exists public.event (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  venue_id    uuid references public."Venue" (venue_id) on delete set null,
  category    text,
  image_url   text,
  organizer   text,
  created_at  timestamptz not null default now()
);

-- When and how much
alter table public.event add column if not exists event_date date;
alter table public.event add column if not exists start_time time;
alter table public.event add column if not exists end_time   time;
alter table public.event add column if not exists cost       text;
alter table public.event add column if not exists signup_url text;
-- Lets staff hide an event without deleting it.
alter table public.event add column if not exists is_active  boolean not null default true;

create index if not exists event_event_date_idx on public.event (event_date, start_time);

alter table public.event enable row level security;

-- Replace any earlier policies so the result is exactly the set below.
do $$
declare
  r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'event'
  loop
    execute format('drop policy %I on public.event', r.policyname);
  end loop;
end
$$;

-- Everyone can read, including students who are not signed in yet. Hidden events are staff-only.
create policy cc_read on public.event
  for select to anon, authenticated using (is_active or public.is_staff());

create policy cc_staff_insert on public.event
  for insert to authenticated with check (public.is_staff());

create policy cc_staff_update on public.event
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy cc_staff_delete on public.event
  for delete to authenticated using (public.is_staff());
