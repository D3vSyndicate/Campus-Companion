-- School of IT Programmes
--
-- Students read programme information and the academic advisor's details in the app.
-- Coordinators and admins add and edit programmes from the staff screens.
--
-- Safe to run more than once, and safe to run against a database where public.it_programmes already
-- exists: the table is only created if missing, every column is added only if missing, and the row
-- level security policies are replaced with exactly the set below.
--
-- Depends on public.is_staff() from supabase/campus_features.sql (true for the coordinator and admin
-- roles only). Run that file first.

do $$
begin
  if to_regprocedure('public.is_staff()') is null then
    raise exception 'public.is_staff() is missing. Run supabase/campus_features.sql before this migration.';
  end if;
end
$$;

create table if not exists public.it_programmes (
  id                    uuid primary key default gen_random_uuid(),
  programme_name        text not null,
  description           text,
  year_structure        text,                                  -- one line per year level, e.g. "Year 1: ..."
  key_modules           text[] not null default '{}',
  career_possibilities  text[] not null default '{}',
  academic_expectations text,
  advisor_name          text,
  advisor_contact       text,                                  -- email address, phone number or link
  advisor_availability  text,                                  -- e.g. "Mon - Thu, 09:00 - 15:00"
  display_order         int  not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- If the table was created earlier with some columns missing, add them.
alter table public.it_programmes add column if not exists programme_name        text;
alter table public.it_programmes add column if not exists description           text;
alter table public.it_programmes add column if not exists year_structure        text;
alter table public.it_programmes add column if not exists key_modules           text[] not null default '{}';
alter table public.it_programmes add column if not exists career_possibilities  text[] not null default '{}';
alter table public.it_programmes add column if not exists academic_expectations text;
alter table public.it_programmes add column if not exists advisor_name          text;
alter table public.it_programmes add column if not exists advisor_contact       text;
alter table public.it_programmes add column if not exists advisor_availability  text;
alter table public.it_programmes add column if not exists display_order         int not null default 0;
alter table public.it_programmes add column if not exists created_at            timestamptz not null default now();
alter table public.it_programmes add column if not exists updated_at            timestamptz not null default now();

create index if not exists it_programmes_display_order_idx
  on public.it_programmes (display_order, programme_name);

-- Keep updated_at honest whenever a programme is edited.
create or replace function public.it_programmes_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists it_programmes_touch_updated_at on public.it_programmes;
create trigger it_programmes_touch_updated_at
  before update on public.it_programmes
  for each row execute function public.it_programmes_touch_updated_at();

alter table public.it_programmes enable row level security;

-- Replace any earlier policies so the result is exactly the set below.
do $$
declare
  r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'it_programmes'
  loop
    execute format('drop policy %I on public.it_programmes', r.policyname);
  end loop;
end
$$;

-- Everyone can read, including students who are not signed in yet.
create policy cc_read on public.it_programmes
  for select to anon, authenticated using (true);

-- Only coordinators and admins can change programmes.
create policy cc_staff_insert on public.it_programmes
  for insert to authenticated with check (public.is_staff());

create policy cc_staff_update on public.it_programmes
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy cc_staff_delete on public.it_programmes
  for delete to authenticated using (public.is_staff());
