-- Gqeberha shuttle schedule, 2026
--
-- public.shuttle_times already exists (supabase/campus_features.sql) and the admin and coordinator
-- screens already write to it — it was just empty. This seeds it from the printed 2026 Gqeberha
-- schedule so "Learn Your Shuttles" has something to show on a fresh database.
--
-- LIMITS OF THIS DATA:
--   * Gqeberha only. The George campus shuttle is not in the source, so George students see nothing.
--   * The printed sheet gives no night-shift times per stop — only a single "Night Shift Shuttles"
--     row (18:30, 20:30, 22:00). It is seeded as one route rather than guessed per stop.
--   * Days are recorded as "Mon - Fri" because the sheet does not state weekend service.
--
-- Safe to run more than once: the seeded rows are identified by their note and replaced.

delete from public.shuttle_times where notes = 'Gqeberha 2026 schedule';

-- The ten standard stops share one timetable, so they are generated rather than typed out 80 times.
insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select
  'morning',
  stop,
  stop,
  'Campus',
  departure,
  'Mon - Fri',
  'Gqeberha 2026 schedule'
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

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select
  'afternoon',
  stop,
  'Campus',
  stop,
  departure,
  'Mon - Fri',
  'Gqeberha 2026 schedule'
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
select 'morning', 'Summerstrand - Missionvale (Medical School)', 'Summerstrand', 'Missionvale', departure, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['07:00', '09:00']::time[]) as departure;

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'afternoon', 'Summerstrand - Missionvale (Medical School)', 'Missionvale', 'Summerstrand', departure, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['13:30', '15:30', '17:30']::time[]) as departure;

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'morning', 'Hopper (Campus to Campus)', 'Campus', 'Campus', departure, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['07:00', '08:00', '09:00', '11:00']::time[]) as departure;

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'afternoon', 'Hopper (Campus to Campus)', 'Campus', 'Campus', departure, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['12:00', '14:30', '16:00', '17:00']::time[]) as departure;

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'morning', 'Summerstrand Student Village', 'Student Village', 'Campus', departure, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['07:00', '08:00', '09:00', '11:00']::time[]) as departure;

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'afternoon', 'Summerstrand Student Village', 'Campus', 'Student Village', departure, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['12:00', '14:00', '16:00', '17:00']::time[]) as departure;

insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select 'night', 'Night Shift Shuttles', 'Campus', 'Residences', departure, 'Mon - Fri', 'Gqeberha 2026 schedule'
from unnest(array['18:30', '20:30', '22:00']::time[]) as departure;
