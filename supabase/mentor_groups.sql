-- Mentor groups: mentors create groups, students request membership, mentors approve.
-- Run this file in the Supabase SQL editor. It is safe to run by itself.

-- Role helpers are included here so this file also works on its own. They are only created when they
-- are missing: supabase/campus_features.sql has the fuller versions (it reads the role from the
-- database and ignores capitals and spaces), and running this file must never replace them.
do $$
begin
  if to_regprocedure('public.app_role()') is null then
    execute $fn$
      create function public.app_role()
      returns text
      language sql
      stable
      as $body$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'student') $body$
    $fn$;
  end if;

  if to_regprocedure('public.is_mentor()') is null then
    execute $fn$
      create function public.is_mentor()
      returns boolean
      language sql
      stable
      as $body$ select public.app_role() = 'mentor' $body$
    $fn$;
  end if;
end
$$;

create table if not exists public.mentor_groups (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 100),
  programme text not null check (length(btrim(programme)) between 2 and 100),
  description text not null default '',
  max_capacity integer not null check (max_capacity > 0),
  qr_token uuid not null default gen_random_uuid() unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mentor_group_members (
  group_id uuid not null references public.mentor_groups(id) on delete cascade,
  student_id uuid not null unique references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, student_id)
);

create table if not exists public.mentor_group_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mentor_groups(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (group_id, student_id)
);

create table if not exists public.mentor_group_announcements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mentor_groups(id) on delete cascade,
  mentor_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.mentor_groups enable row level security;
alter table public.mentor_group_members enable row level security;
alter table public.mentor_group_requests enable row level security;
alter table public.mentor_group_announcements enable row level security;

drop policy if exists mentor_groups_read on public.mentor_groups;
drop policy if exists mentor_groups_mentor_write on public.mentor_groups;
create policy mentor_groups_read on public.mentor_groups for select to authenticated
  using (is_active or mentor_id = auth.uid());
create policy mentor_groups_mentor_write on public.mentor_groups for all to authenticated
  using (mentor_id = auth.uid() and public.is_mentor())
  with check (mentor_id = auth.uid() and public.is_mentor());

drop policy if exists mentor_group_members_read on public.mentor_group_members;
create policy mentor_group_members_read on public.mentor_group_members for select to authenticated
  using (student_id = auth.uid() or exists (
    select 1 from public.mentor_groups g where g.id = group_id and g.mentor_id = auth.uid()
  ));

drop policy if exists mentor_group_requests_read on public.mentor_group_requests;
create policy mentor_group_requests_read on public.mentor_group_requests for select to authenticated
  using (student_id = auth.uid() or exists (
    select 1 from public.mentor_groups g where g.id = group_id and g.mentor_id = auth.uid()
  ));

drop policy if exists mentor_group_announcements_read on public.mentor_group_announcements;
create policy mentor_group_announcements_read on public.mentor_group_announcements for select to authenticated
  using (exists (
    select 1 from public.mentor_group_members m where m.group_id = mentor_group_announcements.group_id and m.student_id = auth.uid()
  ) or mentor_id = auth.uid());

create or replace function public.request_to_join_mentor_group(target_group uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  request_id uuid;
  group_capacity integer;
  member_total integer;
begin
  if uid is null or public.app_role() <> 'student' then
    raise exception 'Only students can request to join a mentor group.';
  end if;
  if exists (select 1 from public.mentor_group_members where student_id = uid) then
    raise exception 'You already belong to a mentor group.';
  end if;
  select max_capacity into group_capacity from public.mentor_groups where id = target_group and is_active;
  if group_capacity is null then raise exception 'This mentor group is no longer available.'; end if;
  select count(*) into member_total from public.mentor_group_members where group_id = target_group;
  if member_total >= group_capacity then raise exception 'This mentor group is full.'; end if;
  insert into public.mentor_group_requests (group_id, student_id)
  values (target_group, uid)
  on conflict (group_id, student_id) do update set status = 'pending', requested_at = now(), reviewed_at = null
  returning id into request_id;
  return request_id;
end
$$;

create or replace function public.review_mentor_group_request(request_id uuid, decision text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  request_row public.mentor_group_requests%rowtype;
  group_capacity integer;
  member_total integer;
begin
  if public.app_role() <> 'mentor' or decision not in ('approved', 'rejected') then
    raise exception 'Invalid mentor group review.';
  end if;
  select r.* into request_row from public.mentor_group_requests r
  join public.mentor_groups g on g.id = r.group_id
  where r.id = request_id and r.status = 'pending' and g.mentor_id = uid
  for update;
  if request_row.id is null then raise exception 'Join request not found.'; end if;
  if decision = 'approved' then
    if exists (select 1 from public.mentor_group_members where student_id = request_row.student_id) then
      raise exception 'This student already belongs to a mentor group.';
    end if;
    select max_capacity into group_capacity from public.mentor_groups where id = request_row.group_id;
    select count(*) into member_total from public.mentor_group_members where group_id = request_row.group_id;
    if member_total >= group_capacity then raise exception 'This mentor group is full.'; end if;
    insert into public.mentor_group_members (group_id, student_id) values (request_row.group_id, request_row.student_id);
  end if;
  update public.mentor_group_requests set status = decision, reviewed_at = now() where id = request_id;
end
$$;

grant execute on function public.request_to_join_mentor_group(uuid) to authenticated;
grant execute on function public.review_mentor_group_request(uuid, text) to authenticated;
