-- Mentor groups, made real.
--
-- supabase/mentor_groups.sql creates the tables and the join and review rules. The screens for a group's
-- page, its members, its requests, its QR code and its announcements were still showing sample data
-- because a few things were missing. This adds them. Safe to run more than once.
--
--   - Names: a mentor needs to see who asked to join, and a student needs to see who their mentor is.
--     Names live in the sign-in table, which the app cannot read, so small functions hand back only
--     what each person is allowed to see.
--   - Removing a member, and a QR code that can really be replaced.
--   - Announcements: a mentor can post to their own group, with a priority.

-- ---------------------------------------------------------------------------------------------------
-- A person's display name. Only the functions below use it: nobody can call it directly.
-- ---------------------------------------------------------------------------------------------------
create or replace function public.mg_person_name(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(u.email, '@', 1), ''),
    'Student'
  )
  from auth.users u
  where u.id = uid
$$;

revoke all on function public.mg_person_name(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------
-- Announcements get a priority, and the mentor of a group may post to it.
-- ---------------------------------------------------------------------------------------------------
alter table public.mentor_group_announcements
  add column if not exists priority text not null default 'normal';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.mentor_group_announcements'::regclass and conname = 'mentor_group_announcements_priority_check'
  ) then
    alter table public.mentor_group_announcements
      add constraint mentor_group_announcements_priority_check check (priority in ('normal', 'important', 'urgent'));
  end if;
end
$$;

drop policy if exists mentor_group_announcements_insert on public.mentor_group_announcements;
create policy mentor_group_announcements_insert on public.mentor_group_announcements
  for insert to authenticated
  with check (
    mentor_id = auth.uid()
    and exists (select 1 from public.mentor_groups g where g.id = group_id and g.mentor_id = auth.uid())
  );

drop policy if exists mentor_group_announcements_delete on public.mentor_group_announcements;
create policy mentor_group_announcements_delete on public.mentor_group_announcements
  for delete to authenticated
  using (mentor_id = auth.uid());

grant select, insert, delete on public.mentor_group_announcements to authenticated;

-- ---------------------------------------------------------------------------------------------------
-- One group, with its numbers. Mentors also get how many requests are waiting and the QR token.
-- ---------------------------------------------------------------------------------------------------
create or replace function public.mentor_group_overview(target_group uuid)
returns table (
  id uuid,
  name text,
  programme text,
  description text,
  max_capacity integer,
  member_count integer,
  pending_count integer,
  mentor_name text,
  is_mine boolean,
  qr_token uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id,
    g.name,
    g.programme,
    g.description,
    g.max_capacity,
    (select count(*)::integer from public.mentor_group_members m where m.group_id = g.id),
    case when g.mentor_id = auth.uid()
      then (select count(*)::integer from public.mentor_group_requests r where r.group_id = g.id and r.status = 'pending')
      else 0 end,
    public.mg_person_name(g.mentor_id),
    (g.mentor_id = auth.uid()),
    case when g.mentor_id = auth.uid() then g.qr_token else null end
  from public.mentor_groups g
  where g.id = target_group
    and auth.uid() is not null
    and (g.is_active or g.mentor_id = auth.uid())
$$;

-- ---------------------------------------------------------------------------------------------------
-- The groups a student can ask to join, with a true head count. A student cannot count the members of a
-- group they are not in (that table is private), so the count has to come from here.
-- ---------------------------------------------------------------------------------------------------
create or replace function public.list_open_mentor_groups()
returns table (
  id uuid,
  name text,
  programme text,
  description text,
  max_capacity integer,
  member_count integer,
  mentor_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id,
    g.name,
    g.programme,
    g.description,
    g.max_capacity,
    (select count(*)::integer from public.mentor_group_members m where m.group_id = g.id),
    public.mg_person_name(g.mentor_id)
  from public.mentor_groups g
  where g.is_active and auth.uid() is not null
  order by g.created_at desc
$$;

-- ---------------------------------------------------------------------------------------------------
-- The mentor's own view of who is in the group and who is waiting.
-- ---------------------------------------------------------------------------------------------------
create or replace function public.list_mentor_group_members(target_group uuid)
returns table (student_id uuid, student_name text, student_number text, joined_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.student_id,
    public.mg_person_name(m.student_id),
    coalesce(u.raw_user_meta_data ->> 'student_number', ''),
    m.joined_at
  from public.mentor_group_members m
  join public.mentor_groups g on g.id = m.group_id
  join auth.users u on u.id = m.student_id
  where m.group_id = target_group and g.mentor_id = auth.uid()
  order by m.joined_at desc
$$;

create or replace function public.list_mentor_group_requests(target_group uuid)
returns table (id uuid, student_id uuid, student_name text, student_number text, requested_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.student_id,
    public.mg_person_name(r.student_id),
    coalesce(u.raw_user_meta_data ->> 'student_number', ''),
    r.requested_at
  from public.mentor_group_requests r
  join public.mentor_groups g on g.id = r.group_id
  join auth.users u on u.id = r.student_id
  where r.group_id = target_group and r.status = 'pending' and g.mentor_id = auth.uid()
  order by r.requested_at desc
$$;

-- ---------------------------------------------------------------------------------------------------
-- Removing a member, and replacing the QR code.
-- ---------------------------------------------------------------------------------------------------
create or replace function public.remove_mentor_group_member(target_group uuid, member uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.mentor_groups g where g.id = target_group and g.mentor_id = auth.uid()) then
    raise exception 'Only the mentor of this group can remove a member.';
  end if;
  delete from public.mentor_group_members where group_id = target_group and student_id = member;
end
$$;

create or replace function public.regenerate_mentor_group_qr(target_group uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  fresh uuid := gen_random_uuid();
  changed integer;
begin
  update public.mentor_groups set qr_token = fresh where id = target_group and mentor_id = auth.uid();
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'Only the mentor of this group can replace its QR code.';
  end if;
  return fresh;
end
$$;

-- ---------------------------------------------------------------------------------------------------
-- Joining by scanning a QR code. The code carries the group's token, not its id, so replacing the token
-- really does stop an old code working. Scanning only ever sends a request.
-- ---------------------------------------------------------------------------------------------------
create or replace function public.request_to_join_mentor_group_by_token(scan_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  found_group uuid;
begin
  select g.id into found_group from public.mentor_groups g where g.qr_token = scan_token and g.is_active;
  if found_group is null then
    raise exception 'This QR code is not valid any more. Ask your mentor for a new one.';
  end if;
  return public.request_to_join_mentor_group(found_group);
end
$$;

-- ---------------------------------------------------------------------------------------------------
-- Where the signed-in student stands: member, pending, rejected, removed, or no row at all (not asked yet).
-- ---------------------------------------------------------------------------------------------------
create or replace function public.my_mentor_group_state()
returns table (group_id uuid, group_name text, state text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
    select m.group_id, g.name, 'member'::text
    from public.mentor_group_members m
    join public.mentor_groups g on g.id = m.group_id
    where m.student_id = auth.uid()
    limit 1;
  if found then return; end if;

  return query
    -- An approved request with no membership left means the mentor removed them.
    select r.group_id, g.name, case when r.status = 'approved' then 'removed' else r.status end
    from public.mentor_group_requests r
    join public.mentor_groups g on g.id = r.group_id
    where r.student_id = auth.uid()
    order by r.requested_at desc
    limit 1;
end
$$;

-- Only signed-in people may call any of these.
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'mentor_group_overview(uuid)',
    'list_open_mentor_groups()',
    'list_mentor_group_members(uuid)',
    'list_mentor_group_requests(uuid)',
    'remove_mentor_group_member(uuid, uuid)',
    'regenerate_mentor_group_qr(uuid)',
    'request_to_join_mentor_group_by_token(uuid)',
    'my_mentor_group_state()'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated', fn);
  end loop;
end
$$;

notify pgrst, 'reload schema';
