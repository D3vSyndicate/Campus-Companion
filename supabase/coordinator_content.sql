create table if not exists public.coordinator_content (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.coordinator_content enable row level security;

drop policy if exists "Authenticated users can read coordinator content" on public.coordinator_content;
create policy "Authenticated users can read coordinator content"
  on public.coordinator_content for select to authenticated using (true);

drop policy if exists "Coordinators and admins can insert coordinator content" on public.coordinator_content;
create policy "Coordinators and admins can insert coordinator content"
  on public.coordinator_content for insert to authenticated
  with check (public.is_staff());

drop policy if exists "Coordinators and admins can update coordinator content" on public.coordinator_content;
create policy "Coordinators and admins can update coordinator content"
  on public.coordinator_content for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Coordinators and admins can delete coordinator content" on public.coordinator_content;
create policy "Coordinators and admins can delete coordinator content"
  on public.coordinator_content for delete to authenticated
  using (public.is_staff());
