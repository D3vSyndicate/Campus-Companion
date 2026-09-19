-- =============================================================================
-- Campus Companion — timetable + shuttle schedule setup
-- =============================================================================
--
-- HOW TO RUN THIS
--   1. Open your Supabase project -> SQL Editor -> New query.
--   2. Paste this whole file in.
--   3. Press Run.
--
-- It prints a summary table at the end so you can see what landed.
--
-- This script is SELF-CONTAINED: it creates the permission helpers, both tables,
-- their security rules, and the data. You do not need to run anything first.
--
-- It is also SAFE TO RUN AGAIN, as many times as you like. Re-running replaces
-- the seeded rows rather than duplicating them, and never touches rows you added
-- yourself through the app or by hand.
--
-- It contains the same content as these two migrations, so running both paths is
-- harmless — do not worry if you have already applied them:
--   supabase/migrations/20260919140000_timetable_slots.sql
--   supabase/migrations/20260919150000_shuttle_seed.sql
--
-- -----------------------------------------------------------------------------
-- BEFORE YOU TRUST THE TIMETABLE DATA — two known gaps
-- -----------------------------------------------------------------------------
--   * FRIDAY IS MISSING. No Friday sheet was supplied, so there are no Friday
--     rows. Section 6 at the bottom shows you how to add them.
--   * MONDAY IS SEEDED SWITCHED OFF. The Monday sheet is labelled 2024 while
--     Tuesday and Thursday are labelled 2026, so Monday's rows load with
--     is_active = false and students do not see them. Once you have checked
--     Monday against the current printed timetable, run the one-liner in
--     section 6 to switch it on.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Permission helpers
-- -----------------------------------------------------------------------------
-- These decide who is allowed to CHANGE the data. Students can always read it.
-- Staff = anyone whose account has app_metadata.role set to 'coordinator' or
-- 'admin'. If you already ran supabase/campus_features.sql these are unchanged.

create or replace function public.app_role()
returns text
language sql
stable
as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') $$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$ select public.app_role() in ('coordinator', 'admin') $$;


-- -----------------------------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------------------------

-- 2a. The weekly lecture timetable.
--
-- One row = one block on the printed timetable grid. The grid's 14 periods are:
--    1  07:45-08:20     6  11:00-11:35    11  14:25-15:00
--    2  08:20-08:55     7  11:45-12:20    12  15:00-15:35
--    3  09:05-09:40     8  12:20-12:55    13  15:45-16:20
--    4  09:40-10:15     9  13:05-13:40    14  16:20-16:55
--    5  10:25-11:00    10  13:40-14:15

create table if not exists public.timetable_slots (
  slot_id      uuid primary key default gen_random_uuid(),
  stream       text not null,                                    -- "DIP SD 1st", "BIT 1st", ...
  year_level   int  not null default 1,
  weekday      int  not null check (weekday between 1 and 7),    -- 1 = Monday ... 5 = Friday
  period_start int  not null check (period_start between 1 and 14),
  period_end   int  not null check (period_end between 1 and 14),
  start_time   time not null,
  end_time     time not null,
  module_code  text not null,
  activity     text,                                             -- LECT, PRAC, TUT, TEST
  venue        text,
  semester     text,
  source_year  int,                                              -- which printed sheet it came from
  source_note  text,
  is_active    boolean not null default true,                    -- false = hidden from students
  created_at   timestamptz not null default now()
);

-- Add anything missing, in case an earlier version of the table already exists.
alter table public.timetable_slots add column if not exists source_year int;
alter table public.timetable_slots add column if not exists source_note text;
alter table public.timetable_slots add column if not exists is_active boolean not null default true;

create index if not exists timetable_slots_stream_day
  on public.timetable_slots (stream, weekday);

-- 2b. The shuttle timetable.
--
-- This table may already exist from supabase/campus_features.sql — the admin and
-- coordinator shuttle screens write to it. Created here only if it is missing.

create table if not exists public.shuttle_times (
  shuttle_id     uuid primary key default gen_random_uuid(),
  shift          text not null check (shift in ('morning', 'afternoon', 'night')),
  route_name     text not null,
  pickup_point   text,
  dropoff_point  text,
  departure_time time not null,
  days           text not null default 'Mon - Fri',
  notes          text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

alter table public.shuttle_times add column if not exists is_active boolean not null default true;


-- -----------------------------------------------------------------------------
-- 3. Security rules — everyone reads, only staff writes
-- -----------------------------------------------------------------------------

alter table public.timetable_slots enable row level security;
alter table public.shuttle_times   enable row level security;

do $$
declare
  t text;
  r record;
begin
  foreach t in array array['timetable_slots', 'shuttle_times']
  loop
    -- Clear any old policies first so re-running this file cannot stack duplicates.
    for r in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', r.policyname, t);
    end loop;

    execute format(
      'create policy cc_read on public.%I for select to anon, authenticated using (true)', t);
    execute format(
      'create policy cc_staff_insert on public.%I for insert to authenticated with check (public.is_staff())', t);
    execute format(
      'create policy cc_staff_update on public.%I for update to authenticated using (public.is_staff()) with check (public.is_staff())', t);
    execute format(
      'create policy cc_staff_delete on public.%I for delete to authenticated using (public.is_staff())', t);
  end loop;
end
$$;


-- -----------------------------------------------------------------------------
-- 4. Timetable data — first-year streams only
-- -----------------------------------------------------------------------------
-- Only rows this script planted are removed, so anything you added yourself
-- survives a re-run.

delete from public.timetable_slots
where source_note = 'seeded from printed timetable screenshots';

insert into public.timetable_slots
  (stream, year_level, weekday, period_start, period_end, start_time, end_time,
   module_code, activity, venue, semester, source_year, source_note, is_active)
values
  -- === MONDAY — from the sheet labelled 2024, so loaded SWITCHED OFF ==========
  ('DIP SD 1st', 1, 1,  1,  2, '07:45', '08:55', 'ONT1030/SDS1010', 'PRAC', 'LAB M104, R128, R226, R126, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP CN 1st', 1, 1,  1,  2, '07:45', '08:55', 'ONT1030/SDS1010', 'PRAC', 'LAB M104, R128, R226, R126, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SS 1st', 1, 1,  1,  2, '07:45', '08:55', 'ONT1030/SDS1010', 'PRAC', 'LAB M104, R128, R226, R126, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SD 1st', 1, 1,  3,  4, '09:05', '10:15', 'ONT1030/SDS1010', 'PRAC', 'LAB M104, R128, R226, R126, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP CN 1st', 1, 1,  3,  4, '09:05', '10:15', 'ONT1030/SDS1010', 'PRAC', 'LAB M104, R128, R226, R126, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SS 1st', 1, 1,  3,  4, '09:05', '10:15', 'ONT1030/SDS1010', 'PRAC', 'LAB M104, R128, R226, R126, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SD 1st', 1, 1,  5,  6, '10:25', '11:35', 'WCI1010', 'PRAC', 'LAB R126, R128, R226, R227, M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP CN 1st', 1, 1,  5,  6, '10:25', '11:35', 'WCI1010', 'PRAC', 'LAB R126, R128, R226, R227, M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SS 1st', 1, 1,  5,  6, '10:25', '11:35', 'WCI1010', 'PRAC', 'LAB R126, R128, R226, R227, M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SD 1st', 1, 1,  7,  8, '11:45', '12:55', 'WCI1010', 'PRAC', 'LAB R126, R128, R226, R227, M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP CN 1st', 1, 1,  7,  8, '11:45', '12:55', 'WCI1010', 'PRAC', 'LAB R126, R128, R226, R227, M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SS 1st', 1, 1,  7,  8, '11:45', '12:55', 'WCI1010', 'PRAC', 'LAB R126, R128, R226, R227, M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SD 1st', 1, 1,  9, 10, '13:05', '14:15', 'WIH1040', 'PRAC', 'LAB R128, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP CN 1st', 1, 1,  9, 10, '13:05', '14:15', 'WIH1040', 'PRAC', 'LAB R128, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SS 1st', 1, 1,  9, 10, '13:05', '14:15', 'WIH1040', 'PRAC', 'LAB R128, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SD 1st', 1, 1, 11, 12, '14:25', '15:35', 'WIH1040', 'PRAC', 'LAB R128, M119, R230', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP CN 1st', 1, 1, 11, 12, '14:25', '15:35', 'WIH1040', 'PRAC', 'LAB R128, M119, R230', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SS 1st', 1, 1, 11, 12, '14:25', '15:35', 'WIH1040', 'PRAC', 'LAB R128, M119, R230', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('BIT 1st',    1, 1,  1,  2, '07:45', '08:55', 'MABN112', 'LECT', 'J018', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('BIT 1st',    1, 1,  5,  6, '10:25', '11:35', 'ITPP100', 'LECT', 'J018', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('BIT 1st',    1, 1,  9, 10, '13:05', '14:15', 'IITP102', 'PRAC', 'M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),

  -- === TUESDAY — 2026 sheet ==================================================
  ('DIP SD 1st', 1, 2,  1,  2, '07:45', '08:55', 'WCI1010', 'LECT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SD 1st', 1, 2,  7,  8, '11:45', '12:55', 'ONT1030/SDS1010', 'TUT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 2,  3,  4, '09:05', '10:15', 'ONT1030/SDS1010', 'TUT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 2,  5,  6, '10:25', '11:35', 'WCI1010', 'LECT', 'Newtonian_10', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 2,  5,  6, '10:25', '11:35', 'ONT1030/SDS1010', 'TUT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 2,  7,  8, '11:45', '12:55', 'WCI1010', 'LECT', 'Newtonian_10', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SD 1st', 1, 2, 11, 12, '14:25', '15:35', 'TESTS', 'TEST', null, 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 2, 11, 12, '14:25', '15:35', 'TESTS', 'TEST', null, 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 2, 11, 12, '14:25', '15:35', 'TESTS', 'TEST', null, 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st',    1, 2,  3,  4, '09:05', '10:15', 'IITP102', 'PRAC', 'LAB R128', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st',    1, 2,  9, 10, '13:05', '14:15', 'WRAV102', 'LECT', 'M154', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),

  -- === WEDNESDAY =============================================================
  ('DIP SD 1st', 1, 3,  1,  4, '07:45', '10:15', 'ONT1030/SDS1010', 'PRAC', 'R128, R126', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 3,  1,  4, '07:45', '10:15', 'ONT1030/SDS1010', 'PRAC', 'R128, R126', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 3,  1,  4, '07:45', '10:15', 'ONT1030/SDS1010', 'PRAC', 'R128, R126', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SD 1st', 1, 3,  5,  6, '10:25', '11:35', 'ITS1110/ITS1010/SIS1000/SIS1010', 'LECT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 3,  7,  8, '11:45', '12:55', 'ITS1110/ITS1010/SIS1000/SIS1010', 'LECT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SD 1st', 1, 3,  9, 10, '13:05', '14:15', 'ITS1110/ITS1010/SIS1000/SIS1010', 'PRAC', 'LAB M004, R230', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 3,  9, 10, '13:05', '14:15', 'ITS1110/ITS1010/SIS1000/SIS1010', 'PRAC', 'LAB M004, R230', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 3,  9, 10, '13:05', '14:15', 'ITS1110/ITS1010/SIS1000/SIS1010', 'PRAC', 'LAB M004, R230', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st',    1, 3,  1,  2, '07:45', '08:55', 'ICNF102', 'PRAC', 'LABS M104', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st',    1, 3,  5,  6, '10:25', '11:35', 'WRAV102', 'LECT', 'South 127_0_0018', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st',    1, 3,  9, 10, '13:05', '14:15', 'WRAV102', 'PRAC', 'South Campus lab 4', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),

  -- === THURSDAY ==============================================================
  ('DIP SD 1st', 1, 4,  3,  4, '09:05', '10:15', 'WCI1010', 'TUT', 'N1', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SD 1st', 1, 4,  7,  8, '11:45', '12:55', 'ONT1030/SDS1010', 'TUT', 'Mapungubwe_003', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SD 1st', 1, 4,  9, 10, '13:05', '14:15', 'WIH1040', 'PRAC', 'LAB M119, R128', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 4,  3,  4, '09:05', '10:15', 'ONT1030/SDS1010', 'TUT', 'M154', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 4,  5,  6, '10:25', '11:35', 'WCI1010', 'TUT', 'N1', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 4,  7,  8, '11:45', '12:55', 'WIH1040', 'PRAC', 'LAB M104, M119', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 4,  1,  2, '07:45', '08:55', 'WCI1010', 'TUT', 'N1', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 4,  5,  6, '10:25', '11:35', 'ONT1030/SDS1010', 'TUT', 'Mapungubwe_003', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 4,  7,  8, '11:45', '12:55', 'WIH1040', 'PRAC', 'LAB M104, M119', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st',    1, 4,  1,  2, '07:45', '08:55', 'MABN112', 'LECT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st',    1, 4,  3,  4, '09:05', '10:15', 'IITP102', 'LECT', 'M222', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st',    1, 4,  5,  6, '10:25', '11:35', 'STAV102', 'PRAC', '35 00 40', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true);

  -- === FRIDAY — nothing supplied. See section 6 to add it. ====================


-- -----------------------------------------------------------------------------
-- 5. Shuttle data — Gqeberha 2026
-- -----------------------------------------------------------------------------
-- George campus is not in the source sheet, so George students see nothing yet.

delete from public.shuttle_times where notes = 'Gqeberha 2026 schedule';

-- The ten standard stops share one timetable, so they are generated by pairing
-- every stop with every departure time rather than typed out 80 times.
insert into public.shuttle_times
  (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'morning', stop, stop, 'Campus', departure, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array[
  'Korsten (PSA 163 Durban Rd)',
  'Sydenham (Klesal/Varsity Park)',
  'North End (Law Court & Pier 14)',
  'Kalinga House - Richmond Hill',
  'The Suites - Rink Street',
  'Russell Road (Home Choice)',
  'Central (Belmont Terrace)',
  'Feather Market Hall (Govan Mbeki Ave)',
  'Walmer PSA',
  'Kings Beach, Humewood and Forrest Hill'
]) as stop,
unnest(array['06:45', '07:45', '08:45', '09:45']::time[]) as departure;

insert into public.shuttle_times
  (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'afternoon', stop, 'Campus', stop, departure, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array[
  'Korsten (PSA 163 Durban Rd)',
  'Sydenham (Klesal/Varsity Park)',
  'North End (Law Court & Pier 14)',
  'Kalinga House - Richmond Hill',
  'The Suites - Rink Street',
  'Russell Road (Home Choice)',
  'Central (Belmont Terrace)',
  'Feather Market Hall (Govan Mbeki Ave)',
  'Walmer PSA',
  'Kings Beach, Humewood and Forrest Hill'
]) as stop,
unnest(array['12:30', '14:30', '16:00', '17:30']::time[]) as departure;

-- Three routes run their own timetable.
insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'morning', 'Summerstrand - Missionvale (Medical School)', 'Summerstrand', 'Missionvale', d, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['07:00', '09:00']::time[]) as d;

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'afternoon', 'Summerstrand - Missionvale (Medical School)', 'Missionvale', 'Summerstrand', d, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['13:30', '15:30', '17:30']::time[]) as d;

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'morning', 'Hopper (Campus to Campus)', 'Campus', 'Campus', d, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['07:00', '08:00', '09:00', '11:00']::time[]) as d;

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'afternoon', 'Hopper (Campus to Campus)', 'Campus', 'Campus', d, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['12:00', '14:30', '16:00', '17:00']::time[]) as d;

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'morning', 'Summerstrand Student Village', 'Student Village', 'Campus', d, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['07:00', '08:00', '09:00', '11:00']::time[]) as d;

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'afternoon', 'Summerstrand Student Village', 'Campus', 'Student Village', d, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['12:00', '14:00', '16:00', '17:00']::time[]) as d;

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'night', 'Night Shift Shuttles', 'Campus', 'Residences', d, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['18:30', '20:30', '22:00']::time[]) as d;


-- -----------------------------------------------------------------------------
-- 6. Editing it later — copy these, change the values, run them on their own
-- -----------------------------------------------------------------------------
-- Everything below is commented out. Nothing here runs when you run this file.

-- ---- Switch Monday on, once you have checked it against the printed sheet ----
-- update public.timetable_slots set is_active = true where weekday = 1;

-- ---- Hide a day again (useful if a sheet turns out to be wrong) --------------
-- update public.timetable_slots set is_active = false where weekday = 1;

-- ---- Add a Friday lecture ---------------------------------------------------
-- weekday 5 = Friday. Change the stream, periods, times, module, venue.
-- insert into public.timetable_slots
--   (stream, year_level, weekday, period_start, period_end, start_time, end_time,
--    module_code, activity, venue, semester, source_year, is_active)
-- values
--   ('DIP SD 1st', 1, 5, 1, 2, '07:45', '08:55', 'WCI1010', 'LECT', 'N2', 'SEM 2', 2026, true);

-- ---- Change one lecture's venue ---------------------------------------------
-- update public.timetable_slots
--    set venue = 'N1'
--  where stream = 'BIT 1st' and weekday = 2 and module_code = 'WRAV102';

-- ---- Delete a lecture that no longer runs -----------------------------------
-- delete from public.timetable_slots
--  where stream = 'BIT 1st' and weekday = 2 and module_code = 'WRAV102';

-- ---- Add a whole new stream (it appears in the app automatically) ------------
-- The app builds its class picker from whatever streams exist in this table, so
-- adding rows with a new stream name is all that is needed.
-- insert into public.timetable_slots
--   (stream, year_level, weekday, period_start, period_end, start_time, end_time,
--    module_code, activity, venue, semester, source_year, is_active)
-- values
--   ('DIP SD 2nd', 2, 1, 1, 2, '07:45', '08:55', 'ITP2020', 'LECT', 'Newtonian_10', 'SEM 2', 2026, true);

-- ---- Add a new shuttle stop with the standard morning times -----------------
-- insert into public.shuttle_times
--   (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
-- select 'morning', 'New Stop Name', 'New Stop Name', 'Campus', d, 'Mon - Fri', 'added by hand'
-- from unnest(array['06:45', '07:45', '08:45', '09:45']::time[]) as d;

-- ---- Change a shuttle departure time ----------------------------------------
-- update public.shuttle_times
--    set departure_time = '07:15'
--  where route_name = 'Walmer PSA' and departure_time = '07:45';

-- ---- Take a shuttle route out of service without deleting it ----------------
-- update public.shuttle_times set is_active = false where route_name = 'Walmer PSA';


-- =============================================================================
-- 7. What landed — this is the table you will see when the script finishes
-- =============================================================================

select 'Timetable — shown to students' as item,
       count(*)::text as amount,
       string_agg(distinct stream, ', ' order by stream) as detail
  from public.timetable_slots where is_active

union all
select 'Timetable — hidden (Monday, unverified)',
       count(*)::text,
       'switch on with: update public.timetable_slots set is_active = true where weekday = 1;'
  from public.timetable_slots where not is_active

union all
select 'Timetable — days covered',
       count(distinct weekday)::text || ' of 5',
       string_agg(distinct
         case weekday when 1 then 'Mon' when 2 then 'Tue' when 3 then 'Wed'
                      when 4 then 'Thu' when 5 then 'Fri' end, ', ')
  from public.timetable_slots where is_active

union all
select 'Shuttle departures',
       count(*)::text,
       count(distinct route_name)::text || ' routes'
  from public.shuttle_times where is_active

union all
select 'Shuttle — by shift',
       count(*)::text,
       string_agg(distinct shift, ', ' order by shift)
  from public.shuttle_times where is_active;
