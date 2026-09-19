-- Coordinator CRUD repair.
-- Run after supabase/campus_features.sql in the Supabase SQL editor.

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when lower(trim(coalesce((select raw_app_meta_data ->> 'role' from auth.users where id = auth.uid()), ''))) = 'admin'
      or lower(trim(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', ''))) = 'admin'
      then 'admin'
    when lower(trim(coalesce((select raw_app_meta_data ->> 'role' from auth.users where id = auth.uid()), ''))) = 'coordinator'
      or lower(trim(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', ''))) = 'coordinator'
      then 'coordinator'
    else lower(trim(coalesce(
      (select raw_app_meta_data ->> 'role' from auth.users where id = auth.uid()),
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    )))
  end
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$ select public.app_role() in ('coordinator', 'admin') $$;

grant execute on function public.app_role() to authenticated;
grant execute on function public.is_staff() to authenticated;

do $$
begin
  if to_regprocedure('public.is_staff()') is null then
    raise exception 'public.is_staff() is missing. Run supabase/campus_features.sql first.';
  end if;
end
$$;

do $$
declare
  table_name text;
  policy record;
begin
  foreach table_name in array array[
    'Contact',
    'FAQ',
    'Announcement',
    'schedule_items',
    'Venue',
    'checklist_item',
    'Support_pathway',
    'digital_readiness'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is null then
      raise notice 'Skipping missing Coordinator table public.%', table_name;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', table_name);

    for policy in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = table_name
    loop
      execute format('drop policy %I on public.%I', policy.policyname, table_name);
    end loop;

    execute format(
      'create policy cc_read on public.%I for select to anon, authenticated using (true)',
      table_name
    );
    execute format(
      'create policy cc_staff_insert on public.%I for insert to authenticated with check (public.is_staff())',
      table_name
    );
    execute format(
      'create policy cc_staff_update on public.%I for update to authenticated using (public.is_staff()) with check (public.is_staff())',
      table_name
    );
    execute format(
      'create policy cc_staff_delete on public.%I for delete to authenticated using (public.is_staff())',
      table_name
    );

    if table_name = 'checklist_item' then
      execute 'create policy cc_checklist_toggle on public.checklist_item for update to authenticated using (true) with check (true)';
    end if;
  end loop;
end
$$;
