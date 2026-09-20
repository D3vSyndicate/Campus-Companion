-- Coordinator CRUD repair.
-- Run after supabase/campus_features.sql in the Supabase SQL editor.

-- The role helpers (public.app_role() and public.is_staff()) are defined once, in supabase/campus_features.sql.
-- They are not redefined here, so running this file can never replace them. (An earlier version of this file
-- redefined app_role(), which dropped the rule that an account with no role counts as a student.)

do $$
begin
  if to_regprocedure('public.is_staff()') is null then
    raise exception 'public.is_staff() is missing. Run supabase/campus_features.sql first.';
  end if;
end
$$;

-- Keep the policy decision independent from a client-supplied role and from a
-- potentially stale app_role lookup. Supabase signs app_metadata into the JWT.
create or replace function public.coordinator_can_manage()
returns boolean
language sql
stable
as $$
  select lower(trim(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')))
    in ('coordinator', 'admin')
$$;

grant execute on function public.coordinator_can_manage() to authenticated;

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
      'create policy cc_staff_insert on public.%I for insert to authenticated with check (public.coordinator_can_manage())',
      table_name
    );
    execute format(
      'create policy cc_staff_update on public.%I for update to authenticated using (public.coordinator_can_manage()) with check (public.coordinator_can_manage())',
      table_name
    );
    execute format(
      'create policy cc_staff_delete on public.%I for delete to authenticated using (public.coordinator_can_manage())',
      table_name
    );

    if table_name = 'checklist_item' then
      execute 'create policy cc_checklist_toggle on public.checklist_item for update to authenticated using (true) with check (true)';
    end if;
  end loop;
end
$$;
