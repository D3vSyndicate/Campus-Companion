-- HOD content is separate from coordinator content so its permissions remain explicit.
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

alter table public.hod_programme_content enable row level security;
alter table public.hod_assignments enable row level security;
alter table public.hod_contacts enable row level security;

do $$
begin
  create policy "Authenticated users can read HOD programme content" on public.hod_programme_content
    for select to authenticated using (true);
  create policy "HOD and admins can manage programme content" on public.hod_programme_content
    for all to authenticated
    using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('hod', 'admin'))
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('hod', 'admin'));
  create policy "Authenticated users can read HOD assignments" on public.hod_assignments
    for select to authenticated using (true);
  create policy "HOD and admins can manage assignments" on public.hod_assignments
    for all to authenticated
    using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('hod', 'admin'))
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('hod', 'admin'));
  create policy "Authenticated users can read HOD contacts" on public.hod_contacts
    for select to authenticated using (true);
  create policy "HOD and admins can manage HOD contacts" on public.hod_contacts
    for all to authenticated
    using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('hod', 'admin'))
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('hod', 'admin'));
exception when duplicate_object then null;
end
$$;
