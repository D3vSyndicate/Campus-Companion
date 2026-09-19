-- Head of department (HOD) content.
--
-- Run this in the Supabase SQL editor. It is safe to run more than once: it creates what is missing
-- and replaces the access policies, so running it again also repairs a half-finished earlier run.
--
-- HOD content lives in its own tables, apart from coordinator content, so who may change what stays
-- explicit. Everyone signed in can read it (students see it under Programme information); only a
-- head of department or an admin can change it.
--
-- The HOD's account needs "role": "hod" in app_metadata (see supabase/set_roles.sql).
--
-- Depends on public.app_role() from supabase/campus_features.sql. Run that file first.

do $$
begin
  if to_regprocedure('public.app_role()') is null then
    raise exception 'public.app_role() is missing. Run supabase/campus_features.sql before this file.';
  end if;
end
$$;

-- Same role lookup as everything else in the app (public.app_role() ignores capitals and spaces).
create or replace function public.is_hod_manager()
returns boolean
language sql
stable
as $$ select public.app_role() in ('hod', 'admin') $$;

create table if not exists public.hod_programme_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.hod_assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  due_date date,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

create table if not exists public.hod_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- Programme information and departmental expectations share this table, told apart by category:
-- 'programme' or 'expectation'. Notes written before this column existed count as programme information.
alter table public.hod_programme_content add column if not exists category text not null default 'programme';

create table if not exists public.hod_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text,
  created_at timestamptz not null default now()
);

alter table public.hod_programme_content enable row level security;
alter table public.hod_assignments enable row level security;
alter table public.hod_contacts enable row level security;
alter table public.hod_resources enable row level security;

-- Programme information and expectations
drop policy if exists "Authenticated users can read HOD programme content" on public.hod_programme_content;
create policy "Authenticated users can read HOD programme content" on public.hod_programme_content
  for select to authenticated using (true);
drop policy if exists "HOD and admins can manage programme content" on public.hod_programme_content;
create policy "HOD and admins can manage programme content" on public.hod_programme_content
  for all to authenticated
  using (public.is_hod_manager())
  with check (public.is_hod_manager());

-- Assignments
drop policy if exists "Authenticated users can read HOD assignments" on public.hod_assignments;
create policy "Authenticated users can read HOD assignments" on public.hod_assignments
  for select to authenticated using (true);
drop policy if exists "HOD and admins can manage assignments" on public.hod_assignments;
create policy "HOD and admins can manage assignments" on public.hod_assignments
  for all to authenticated
  using (public.is_hod_manager())
  with check (public.is_hod_manager());

-- Department contacts
drop policy if exists "Authenticated users can read HOD contacts" on public.hod_contacts;
create policy "Authenticated users can read HOD contacts" on public.hod_contacts
  for select to authenticated using (true);
drop policy if exists "HOD and admins can manage HOD contacts" on public.hod_contacts;
create policy "HOD and admins can manage HOD contacts" on public.hod_contacts
  for all to authenticated
  using (public.is_hod_manager())
  with check (public.is_hod_manager());

-- Support resources
drop policy if exists "Authenticated users can read HOD resources" on public.hod_resources;
create policy "Authenticated users can read HOD resources" on public.hod_resources
  for select to authenticated using (true);
drop policy if exists "HOD and admins can manage HOD resources" on public.hod_resources;
create policy "HOD and admins can manage HOD resources" on public.hod_resources
  for all to authenticated
  using (public.is_hod_manager())
  with check (public.is_hod_manager());

-- Tell the API to pick up the new tables and column now. Without this it can keep answering
-- "table not found" for a minute or two after this script has run.
notify pgrst, 'reload schema';
