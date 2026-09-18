create table if not exists public.coordinator_content (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.coordinator_content enable row level security;

do $$
begin
  create policy "Authenticated users can read coordinator content"
    on public.coordinator_content
    for select
    to authenticated
    using (true);
exception when duplicate_object then null;
end
$$;

do $$
begin
  create policy "Coordinators and admins can insert coordinator content"
    on public.coordinator_content
    for insert
    to authenticated
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('coordinator', 'admin'));
exception when duplicate_object then null;
end
$$;

do $$
begin
  create policy "Coordinators and admins can update coordinator content"
    on public.coordinator_content
    for update
    to authenticated
    using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('coordinator', 'admin'))
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('coordinator', 'admin'));
exception when duplicate_object then null;
end
$$;

do $$
begin
  create policy "Coordinators and admins can delete coordinator content"
    on public.coordinator_content
    for delete
    to authenticated
    using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('coordinator', 'admin'));
exception when duplicate_object then null;
end
$$;
