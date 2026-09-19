-- First-year lecture timetable
--
-- The app can show a student their orientation sessions (schedule_items) and campus events (event),
-- but not their actual lectures. This adds the weekly teaching timetable so the calendar can show
-- all three together.
--
-- A row is one block on the printed timetable grid: a stream (for example "DIP SD 1st"), a weekday,
-- the period range it covers, and what happens in it. The grid's 14 periods are fixed:
--
--   1  07:45-08:20    6  11:00-11:35   11  14:25-15:00
--   2  08:20-08:55    7  11:45-12:20   12  15:00-15:35
--   3  09:05-09:40    8  12:20-12:55   13  15:45-16:20
--   4  09:40-10:15    9  13:05-13:40   14  16:20-16:55
--   5  10:25-11:00   10  13:40-14:15
--
-- SOURCE AND ITS LIMITS — read before trusting this data.
--
-- The seed below was transcribed from photographs of the printed School of IT timetable, so it
-- carries that source's gaps. Each row records where it came from in source_year and source_note:
--
--   * FRIDAY IS MISSING ENTIRELY. No Friday sheet was supplied, so no Friday rows exist. A student
--     looking at Friday sees an empty day, which is not the same as having no lectures.
--   * THE MONDAY SHEET IS LABELLED 2024 while the Tuesday and Thursday sheets are labelled 2026.
--     Monday's rows are seeded with source_year = 2024 and is_active = false, so they are stored
--     but NOT shown, rather than sending first-years to a two-year-old venue. Set is_active = true
--     once someone has checked Monday against the current printed timetable.
--   * Merged cells on the printed grid are ambiguous at the edges. Where a block visibly spans the
--     three diploma streams it has been written out once per stream.
--
-- Safe to run more than once. Depends on public.is_staff() from supabase/campus_features.sql.

do $$
begin
  if to_regprocedure('public.is_staff()') is null then
    raise exception 'public.is_staff() is missing. Run supabase/campus_features.sql before this migration.';
  end if;
end
$$;

create table if not exists public.timetable_slots (
  slot_id      uuid primary key default gen_random_uuid(),
  -- The printed grid's row label, e.g. "DIP SD 1st", "BIT 1st".
  stream       text not null,
  year_level   int  not null default 1,
  -- 1 = Monday ... 5 = Friday, matching the printed sheets.
  weekday      int  not null check (weekday between 1 and 7),
  period_start int  not null check (period_start between 1 and 14),
  period_end   int  not null check (period_end between 1 and 14),
  start_time   time not null,
  end_time     time not null,
  module_code  text not null,
  -- LECT, PRAC, TUT, TEST — as printed.
  activity     text,
  venue        text,
  semester     text,
  -- Which printed sheet this row came from, so a stale year can be found and fixed.
  source_year  int,
  source_note  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.timetable_slots add column if not exists source_year int;
alter table public.timetable_slots add column if not exists source_note text;
alter table public.timetable_slots add column if not exists is_active boolean not null default true;

create index if not exists timetable_slots_stream_day on public.timetable_slots (stream, weekday);

alter table public.timetable_slots enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'timetable_slots'
  loop
    execute format('drop policy %I on public.timetable_slots', r.policyname);
  end loop;
end
$$;

create policy cc_read on public.timetable_slots
  for select using (true);

create policy cc_staff_insert on public.timetable_slots
  for insert with check (public.is_staff());

create policy cc_staff_update on public.timetable_slots
  for update using (public.is_staff()) with check (public.is_staff());

create policy cc_staff_delete on public.timetable_slots
  for delete using (public.is_staff());

-- ---------------------------------------------------------------------------
-- Seed: first-year streams only (DIP SD/CN/SS 1st and BIT 1st)
-- ---------------------------------------------------------------------------

-- Re-running replaces the seeded rows rather than duplicating them. Rows added by staff through the
-- app have source_note null and are left alone.
delete from public.timetable_slots where source_note = 'seeded from printed timetable screenshots';

insert into public.timetable_slots
  (stream, year_level, weekday, period_start, period_end, start_time, end_time, module_code, activity, venue, semester, source_year, source_note, is_active)
values
  -- MONDAY — from the sheet labelled 2024. Inactive until verified: see the note at the top.
  ('DIP SD 1st', 1, 1, 1, 2, '07:45', '08:55', 'ONT1030/SDS1010', 'PRAC', 'LAB M104, R128, R226, R126, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP CN 1st', 1, 1, 1, 2, '07:45', '08:55', 'ONT1030/SDS1010', 'PRAC', 'LAB M104, R128, R226, R126, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SS 1st', 1, 1, 1, 2, '07:45', '08:55', 'ONT1030/SDS1010', 'PRAC', 'LAB M104, R128, R226, R126, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SD 1st', 1, 1, 3, 4, '09:05', '10:15', 'ONT1030/SDS1010', 'PRAC', 'LAB M104, R128, R226, R126, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP CN 1st', 1, 1, 3, 4, '09:05', '10:15', 'ONT1030/SDS1010', 'PRAC', 'LAB M104, R128, R226, R126, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SS 1st', 1, 1, 3, 4, '09:05', '10:15', 'ONT1030/SDS1010', 'PRAC', 'LAB M104, R128, R226, R126, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SD 1st', 1, 1, 5, 6, '10:25', '11:35', 'WCI1010', 'PRAC', 'LAB R126, R128, R226, R227, M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP CN 1st', 1, 1, 5, 6, '10:25', '11:35', 'WCI1010', 'PRAC', 'LAB R126, R128, R226, R227, M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SS 1st', 1, 1, 5, 6, '10:25', '11:35', 'WCI1010', 'PRAC', 'LAB R126, R128, R226, R227, M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SD 1st', 1, 1, 7, 8, '11:45', '12:55', 'WCI1010', 'PRAC', 'LAB R126, R128, R226, R227, M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP CN 1st', 1, 1, 7, 8, '11:45', '12:55', 'WCI1010', 'PRAC', 'LAB R126, R128, R226, R227, M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SS 1st', 1, 1, 7, 8, '11:45', '12:55', 'WCI1010', 'PRAC', 'LAB R126, R128, R226, R227, M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SD 1st', 1, 1, 9, 10, '13:05', '14:15', 'WIH1040', 'PRAC', 'LAB R128, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP CN 1st', 1, 1, 9, 10, '13:05', '14:15', 'WIH1040', 'PRAC', 'LAB R128, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SS 1st', 1, 1, 9, 10, '13:05', '14:15', 'WIH1040', 'PRAC', 'LAB R128, M119', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SD 1st', 1, 1, 11, 12, '14:25', '15:35', 'WIH1040', 'PRAC', 'LAB R128, M119, R230', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP CN 1st', 1, 1, 11, 12, '14:25', '15:35', 'WIH1040', 'PRAC', 'LAB R128, M119, R230', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('DIP SS 1st', 1, 1, 11, 12, '14:25', '15:35', 'WIH1040', 'PRAC', 'LAB R128, M119, R230', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('BIT 1st', 1, 1, 1, 2, '07:45', '08:55', 'MABN112', 'LECT', 'J018', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('BIT 1st', 1, 1, 5, 6, '10:25', '11:35', 'ITPP100', 'LECT', 'J018', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),
  ('BIT 1st', 1, 1, 9, 10, '13:05', '14:15', 'IITP102', 'PRAC', 'M104', 'SEM 2', 2024, 'seeded from printed timetable screenshots', false),

  -- TUESDAY — 2026 sheet.
  ('DIP SD 1st', 1, 2, 1, 2, '07:45', '08:55', 'WCI1010', 'LECT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SD 1st', 1, 2, 7, 8, '11:45', '12:55', 'ONT1030/SDS1010', 'TUT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 2, 3, 4, '09:05', '10:15', 'ONT1030/SDS1010', 'TUT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 2, 5, 6, '10:25', '11:35', 'WCI1010', 'LECT', 'Newtonian_10', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 2, 5, 6, '10:25', '11:35', 'ONT1030/SDS1010', 'TUT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 2, 7, 8, '11:45', '12:55', 'WCI1010', 'LECT', 'Newtonian_10', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SD 1st', 1, 2, 11, 12, '14:25', '15:35', 'TESTS', 'TEST', null, 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 2, 11, 12, '14:25', '15:35', 'TESTS', 'TEST', null, 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 2, 11, 12, '14:25', '15:35', 'TESTS', 'TEST', null, 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st', 1, 2, 3, 4, '09:05', '10:15', 'IITP102', 'PRAC', 'LAB R128', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st', 1, 2, 9, 10, '13:05', '14:15', 'WRAV102', 'LECT', 'M154', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),

  -- WEDNESDAY
  ('DIP SD 1st', 1, 3, 1, 4, '07:45', '10:15', 'ONT1030/SDS1010', 'PRAC', 'R128, R126', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 3, 1, 4, '07:45', '10:15', 'ONT1030/SDS1010', 'PRAC', 'R128, R126', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 3, 1, 4, '07:45', '10:15', 'ONT1030/SDS1010', 'PRAC', 'R128, R126', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SD 1st', 1, 3, 5, 6, '10:25', '11:35', 'ITS1110/ITS1010/SIS1000/SIS1010', 'LECT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 3, 7, 8, '11:45', '12:55', 'ITS1110/ITS1010/SIS1000/SIS1010', 'LECT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SD 1st', 1, 3, 9, 10, '13:05', '14:15', 'ITS1110/ITS1010/SIS1000/SIS1010', 'PRAC', 'LAB M004, R230', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 3, 9, 10, '13:05', '14:15', 'ITS1110/ITS1010/SIS1000/SIS1010', 'PRAC', 'LAB M004, R230', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 3, 9, 10, '13:05', '14:15', 'ITS1110/ITS1010/SIS1000/SIS1010', 'PRAC', 'LAB M004, R230', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st', 1, 3, 1, 2, '07:45', '08:55', 'ICNF102', 'PRAC', 'LABS M104', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st', 1, 3, 5, 6, '10:25', '11:35', 'WRAV102', 'LECT', 'South 127_0_0018', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st', 1, 3, 9, 10, '13:05', '14:15', 'WRAV102', 'PRAC', 'South Campus lab 4', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),

  -- THURSDAY
  ('DIP SD 1st', 1, 4, 3, 4, '09:05', '10:15', 'WCI1010', 'TUT', 'N1', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SD 1st', 1, 4, 7, 8, '11:45', '12:55', 'ONT1030/SDS1010', 'TUT', 'Mapungubwe_003', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SD 1st', 1, 4, 9, 10, '13:05', '14:15', 'WIH1040', 'PRAC', 'LAB M119, R128', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 4, 3, 4, '09:05', '10:15', 'ONT1030/SDS1010', 'TUT', 'M154', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 4, 5, 6, '10:25', '11:35', 'WCI1010', 'TUT', 'N1', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP CN 1st', 1, 4, 7, 8, '11:45', '12:55', 'WIH1040', 'PRAC', 'LAB M104, M119', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 4, 1, 2, '07:45', '08:55', 'WCI1010', 'TUT', 'N1', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 4, 5, 6, '10:25', '11:35', 'ONT1030/SDS1010', 'TUT', 'Mapungubwe_003', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('DIP SS 1st', 1, 4, 7, 8, '11:45', '12:55', 'WIH1040', 'PRAC', 'LAB M104, M119', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st', 1, 4, 1, 2, '07:45', '08:55', 'MABN112', 'LECT', 'N2', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st', 1, 4, 3, 4, '09:05', '10:15', 'IITP102', 'LECT', 'M222', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true),
  ('BIT 1st', 1, 4, 5, 6, '10:25', '11:35', 'STAV102', 'PRAC', '35 00 40', 'SEM 2', 2026, 'seeded from printed timetable screenshots', true);

  -- FRIDAY: no sheet was supplied. Add rows here once one is.
