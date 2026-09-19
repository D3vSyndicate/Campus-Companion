-- Campus Companion: tribe chat, support pathways, shuttle times, digital readiness
-- and staff (coordinator/admin) write access.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- The script is idempotent, so running it again is safe.
--
-- Roles are read from the server-controlled `raw_app_meta_data` claim (`role`).
-- Set it per user in Authentication -> Users, or with
--   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"coordinator"}' where email = '...';
-- Roles used by the app: student (default), mentor (FYS buddy), coordinator, hod, admin.
-- For a buddy use '{"role":"mentor"}', then place them in a tribe with assign_mentor_to_tribe (below).

-- ---------------------------------------------------------------------------
-- 0. Role helpers
-- ---------------------------------------------------------------------------

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  -- A user with no role set counts as a student. The app treats them the same way, because students
  -- usually only have a role in their sign-up details. supabase/mentor_groups.sql relies on this.
  -- The role stored in the database is the current one, so it wins. An EMPTY stored role counts as missing,
  -- and then the role in the login token is used. It is never the other way round: a role that was changed
  -- in the database must not be undone by an older login token.
  select coalesce(nullif(lower(trim(coalesce(
    nullif(trim((select raw_app_meta_data ->> 'role' from auth.users where id = auth.uid())), ''),
    nullif(trim(auth.jwt() -> 'app_metadata' ->> 'role'), ''),
    ''
  ))), ''), 'student')
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$ select public.app_role() in ('coordinator', 'admin') $$;

grant execute on function public.app_role() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- FYS buddies (senior student mentors). They read everything students read and chat in their
-- tribe as a mentor, but they cannot edit content.
create or replace function public.is_mentor()
returns boolean
language sql
stable
as $$ select public.app_role() = 'mentor' $$;

-- ---------------------------------------------------------------------------
-- 1. Existing content tables: everyone can read, only staff can write.
--    (This is what lets the admin and coordinator screens save.)
-- ---------------------------------------------------------------------------

create table if not exists public.digital_readiness (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text,
  steps          text[] not null default '{}',
  sort_order     integer not null default 0,
  reference_url  text,
  video_url      text,
  image_urls     jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

do $$
declare
  t text;
  r record;
begin
  foreach t in array array['Contact', 'FAQ', 'Announcement', 'schedule_items', 'Venue', 'checklist_item', 'Support_pathway', 'digital_readiness']
  loop
    execute format('alter table public.%I enable row level security', t);

    for r in select policyname from pg_policies
             where schemaname = 'public' and tablename = t and policyname like 'cc\_%'
    loop
      execute format('drop policy %I on public.%I', r.policyname, t);
    end loop;

    execute format('create policy cc_read on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy cc_staff_insert on public.%I for insert to authenticated with check (public.is_staff())', t);
    execute format('create policy cc_staff_update on public.%I for update to authenticated using (public.is_staff()) with check (public.is_staff())', t);
    execute format('create policy cc_staff_delete on public.%I for delete to authenticated using (public.is_staff())', t);
  end loop;
end
$$;

-- Venues can be pinned on the campus map (set from the coordinator and admin Venue screens).
alter table public."Venue" add column if not exists latitude  double precision;
alter table public."Venue" add column if not exists longitude double precision;

-- The student checklist currently stores "done" on the shared row, so signed-in
-- students must be able to update it. (Known limitation: one shared tick for
-- everyone. Per-student progress would need its own table.)
drop policy if exists cc_checklist_toggle on public.checklist_item;
create policy cc_checklist_toggle on public.checklist_item
  for update to authenticated using (true) with check (true);

-- Announcements keep the time they were posted in posted_by, and the app shows a NEW tag for recent
-- ones. Give the column a default, so an announcement added straight from the Supabase dashboard is
-- stamped too. Only done when the column really is a timestamp.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'Announcement' and column_name = 'posted_by'
      and data_type in ('timestamp with time zone', 'timestamp without time zone')
  ) then
    alter table public."Announcement" alter column posted_by set default now();
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Support pathways ("I need help with...") use the existing "Support_pathway"
--    table, covered by the policies in section 1. Nothing new to create here.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. Shuttle times (morning / afternoon / night shifts)
-- ---------------------------------------------------------------------------

create table if not exists public.shuttle_times (
  shuttle_id     uuid primary key default gen_random_uuid(),
  shift          text not null check (shift in ('morning', 'afternoon', 'night')),
  route_name     text not null,
  pickup_point   text,
  dropoff_point  text,
  departure_time time not null,
  days           text default 'Mon - Fri',
  notes          text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Digital readiness tutorial (modules -> steps, with per-student progress)
-- ---------------------------------------------------------------------------

create table if not exists public.readiness_modules (
  module_id    uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  icon         text not null default 'laptop-outline',   -- any Ionicons name
  sort_order   int  not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.readiness_steps (
  step_id     uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.readiness_modules(module_id) on delete cascade,
  sort_order  int  not null default 0,
  title       text not null,
  body        text,
  media_type  text not null default 'none' check (media_type in ('none', 'image', 'video')),
  media_url   text,          -- public URL from the readiness-media storage bucket
  link_url    text,
  link_label  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.readiness_progress (
  auth_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  step_id      uuid not null references public.readiness_steps(step_id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (auth_id, step_id)
);

-- Public bucket for the tutorial images and videos.
insert into storage.buckets (id, name, public)
values ('readiness-media', 'readiness-media', true)
on conflict (id) do nothing;

drop policy if exists cc_readiness_media_read   on storage.objects;
drop policy if exists cc_readiness_media_insert on storage.objects;
drop policy if exists cc_readiness_media_update on storage.objects;
drop policy if exists cc_readiness_media_delete on storage.objects;

create policy cc_readiness_media_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'readiness-media');
create policy cc_readiness_media_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'readiness-media' and public.is_staff());
create policy cc_readiness_media_update on storage.objects
  for update to authenticated using (bucket_id = 'readiness-media' and public.is_staff());
create policy cc_readiness_media_delete on storage.objects
  for delete to authenticated using (bucket_id = 'readiness-media' and public.is_staff());

-- ---------------------------------------------------------------------------
-- 5. Policies for the new tables
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  r record;
begin
  foreach t in array array['shuttle_times', 'readiness_modules', 'readiness_steps', 'readiness_progress']
  loop
    execute format('alter table public.%I enable row level security', t);
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', r.policyname, t);
    end loop;
  end loop;
end
$$;

create policy cc_read on public.shuttle_times for select to anon, authenticated using (is_active or public.is_staff());
create policy cc_staff_insert on public.shuttle_times for insert to authenticated with check (public.is_staff());
create policy cc_staff_update on public.shuttle_times for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy cc_staff_delete on public.shuttle_times for delete to authenticated using (public.is_staff());

create policy cc_read on public.readiness_modules for select to anon, authenticated using (is_published or public.is_staff());
create policy cc_staff_insert on public.readiness_modules for insert to authenticated with check (public.is_staff());
create policy cc_staff_update on public.readiness_modules for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy cc_staff_delete on public.readiness_modules for delete to authenticated using (public.is_staff());

create policy cc_read on public.readiness_steps for select to anon, authenticated using (
  public.is_staff() or exists (
    select 1 from public.readiness_modules m
    where m.module_id = readiness_steps.module_id and m.is_published
  )
);
create policy cc_staff_insert on public.readiness_steps for insert to authenticated with check (public.is_staff());
create policy cc_staff_update on public.readiness_steps for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy cc_staff_delete on public.readiness_steps for delete to authenticated using (public.is_staff());

create policy cc_own_select on public.readiness_progress for select to authenticated using (auth_id = auth.uid());
create policy cc_own_insert on public.readiness_progress for insert to authenticated with check (auth_id = auth.uid());
create policy cc_own_delete on public.readiness_progress for delete to authenticated using (auth_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. Tribe: mentor-group chat between students
--    Uses the existing community_groups / community_profiles / community_messages
--    tables and adds community_members so each student belongs to one tribe.
-- ---------------------------------------------------------------------------

create table if not exists public.community_groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  mentor_name  text,
  member_count int  not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.community_profiles (
  id         uuid primary key default gen_random_uuid(),
  auth_id    uuid not null unique,
  username   text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.community_messages (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null,
  auth_id      uuid,
  role         text not null default 'student',
  display_name text,
  message_text text not null,
  created_at   timestamptz not null default now()
);

-- Make sure the columns the app relies on exist if the tables predate this script.
alter table public.community_groups   add column if not exists mentor_name  text;
alter table public.community_groups   add column if not exists member_count int not null default 0;
alter table public.community_profiles add column if not exists auth_id      uuid;
alter table public.community_profiles add column if not exists username     text;
alter table public.community_messages add column if not exists auth_id      uuid;
alter table public.community_messages add column if not exists role         text not null default 'student';
alter table public.community_messages add column if not exists display_name text;

-- Code of conduct. A chat name can only be created once the student has accepted the Tribe code of
-- conduct: no bullying, no swearing, and respect for the University's public communication platforms.
-- The app sends the acceptance together with the new chat name and the database refuses a new chat name
-- without it. The time is set here, so it cannot be back-dated, and it cannot be cleared or changed later.
-- Chat names that already exist are left as they are.
alter table public.community_profiles add column if not exists conduct_accepted_at timestamptz;

create or replace function public.community_profiles_require_conduct()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.conduct_accepted_at is null then
      raise exception 'Please accept the Tribe code of conduct before choosing a chat name.';
    end if;
    new.conduct_accepted_at := now();
  else
    new.conduct_accepted_at := old.conduct_accepted_at;
  end if;
  return new;
end
$$;

drop trigger if exists community_profiles_require_conduct on public.community_profiles;
create trigger community_profiles_require_conduct
  before insert or update on public.community_profiles
  for each row execute function public.community_profiles_require_conduct();

create table if not exists public.community_members (
  auth_id   uuid primary key references auth.users(id) on delete cascade,  -- one tribe per student
  group_id  uuid not null references public.community_groups(id) on delete cascade,
  joined_at timestamptz not null default now()
);

-- Server decides who is speaking, so students cannot post as someone else or as a mentor.
create or replace function public.community_messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  new.auth_id := auth.uid();
  if new.auth_id is null then
    raise exception 'You need to be signed in to send a message.';
  end if;

  new.role := case when public.is_staff() or public.is_mentor() then 'mentor' else 'student' end;

  select username into uname from public.community_profiles where auth_id = new.auth_id;
  new.display_name := coalesce(uname, case when public.is_staff() or public.is_mentor() then 'Mentor' end);
  if new.display_name is null then
    raise exception 'Choose a chat name before sending a message.';
  end if;

  new.message_text := btrim(new.message_text);
  if new.message_text = '' or length(new.message_text) > 1000 then
    raise exception 'Messages must be between 1 and 1000 characters.';
  end if;

  return new;
end
$$;

drop trigger if exists community_messages_before_insert on public.community_messages;
create trigger community_messages_before_insert
  before insert on public.community_messages
  for each row execute function public.community_messages_before_insert();

-- Puts the signed-in student into the tribe with the fewest members (or returns theirs).
create or replace function public.join_my_tribe()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  gid uuid;
begin
  if uid is null then
    raise exception 'You need to be signed in to join a tribe.';
  end if;

  select group_id into gid from public.community_members where auth_id = uid;
  if gid is not null then
    return gid;
  end if;

  -- Buddies are placed by a coordinator (see assign_mentor_to_tribe), never auto-assigned like students.
  if public.is_mentor() then
    return null;
  end if;

  select g.id into gid
  from public.community_groups g
  left join public.community_members m on m.group_id = g.id
  group by g.id, g.created_at
  order by count(m.auth_id), g.created_at
  limit 1;

  if gid is null then
    return null;  -- no tribes created yet
  end if;

  insert into public.community_members (auth_id, group_id) values (uid, gid)
  on conflict (auth_id) do nothing;

  update public.community_groups
  set member_count = (select count(*) from public.community_members where group_id = gid)
  where id = gid;

  return gid;
end
$$;

revoke all on function public.join_my_tribe() from public, anon;
grant execute on function public.join_my_tribe() to authenticated;

-- Coordinators and admins place a buddy in a tribe by the buddy's email address:
--   select public.assign_mentor_to_tribe('buddy@mandela.ac.za', '<group id from community_groups>');
-- Running it again with a different group moves the buddy.
create or replace function public.assign_mentor_to_tribe(mentor_email text, target_group uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  mentor_id uuid;
begin
  if not public.is_staff() then
    raise exception 'Only coordinators and admins can place a buddy in a tribe.';
  end if;

  select id into mentor_id from auth.users where lower(email) = lower(btrim(mentor_email));
  if mentor_id is null then
    raise exception 'No account was found for that email address.';
  end if;

  insert into public.community_members (auth_id, group_id) values (mentor_id, target_group)
  on conflict (auth_id) do update set group_id = excluded.group_id;

  update public.community_groups g
  set member_count = (select count(*) from public.community_members m where m.group_id = g.id);
end
$$;

revoke all on function public.assign_mentor_to_tribe(text, uuid) from public, anon;
grant execute on function public.assign_mentor_to_tribe(text, uuid) to authenticated;

-- Who is placed where. The app cannot read auth.users, so staff get emails through this function.
create or replace function public.list_tribe_buddies()
returns table (email text, group_id uuid, group_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Only coordinators and admins can see who is placed in which tribe.';
  end if;

  return query
    select u.email::text, m.group_id, g.name
    from public.community_members m
    join auth.users u on u.id = m.auth_id
    join public.community_groups g on g.id = m.group_id
    where u.raw_app_meta_data ->> 'role' = 'mentor'
    order by g.name, u.email;
end
$$;

revoke all on function public.list_tribe_buddies() from public, anon;
grant execute on function public.list_tribe_buddies() to authenticated;

-- Takes a buddy out of their tribe. Only works on buddy accounts, so a student is never removed by mistake.
create or replace function public.remove_mentor_from_tribe(mentor_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  mentor_id uuid;
begin
  if not public.is_staff() then
    raise exception 'Only coordinators and admins can remove a buddy from a tribe.';
  end if;

  select id into mentor_id
  from auth.users
  where lower(email) = lower(btrim(mentor_email)) and raw_app_meta_data ->> 'role' = 'mentor';
  if mentor_id is null then
    raise exception 'No buddy account was found for that email address.';
  end if;

  delete from public.community_members where auth_id = mentor_id;

  update public.community_groups g
  set member_count = (select count(*) from public.community_members m where m.group_id = g.id);
end
$$;

revoke all on function public.remove_mentor_from_tribe(text) from public, anon;
grant execute on function public.remove_mentor_from_tribe(text) to authenticated;

-- Replace any older community_* policies with a single, membership-based set.
do $$
declare
  t text;
  r record;
begin
  foreach t in array array['community_groups', 'community_profiles', 'community_messages', 'community_members']
  loop
    execute format('alter table public.%I enable row level security', t);
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', r.policyname, t);
    end loop;
  end loop;
end
$$;

create policy cc_member_select on public.community_members
  for select to authenticated using (auth_id = auth.uid() or public.is_staff());
create policy cc_staff_write on public.community_members
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy cc_group_select on public.community_groups
  for select to authenticated using (
    public.is_staff()
    or id in (select group_id from public.community_members where auth_id = auth.uid())
  );
create policy cc_group_staff_write on public.community_groups
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy cc_profile_select on public.community_profiles
  for select to authenticated using (auth_id = auth.uid() or public.is_staff());
create policy cc_profile_insert on public.community_profiles
  for insert to authenticated with check (auth_id = auth.uid());
create policy cc_profile_update on public.community_profiles
  for update to authenticated using (auth_id = auth.uid()) with check (auth_id = auth.uid());

create policy cc_message_select on public.community_messages
  for select to authenticated using (
    public.is_staff()
    or group_id in (select group_id from public.community_members where auth_id = auth.uid())
  );
create policy cc_message_insert on public.community_messages
  for insert to authenticated with check (
    auth_id = auth.uid()
    and (
      public.is_staff()
      or group_id in (select group_id from public.community_members where auth_id = auth.uid())
    )
  );

-- Live updates for the chat.
do $$
begin
  alter publication supabase_realtime add table public.community_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$$;

-- ---------------------------------------------------------------------------
-- 6b. FAQ suggestions: buddies send in questions students keep asking, coordinators review them.
--     Contains no student information.
-- ---------------------------------------------------------------------------

create table if not exists public.faq_suggestions (
  suggestion_id uuid primary key default gen_random_uuid(),
  question      text not null,
  note          text,
  suggested_by  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status        text not null default 'new' check (status in ('new', 'added', 'dismissed')),
  created_at    timestamptz not null default now()
);

do $$
declare
  r record;
begin
  alter table public.faq_suggestions enable row level security;
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'faq_suggestions'
  loop
    execute format('drop policy %I on public.faq_suggestions', r.policyname);
  end loop;
end
$$;

-- Buddies (and staff) can send one in, always as "new". Buddies only ever see their own.
create policy cc_suggest_insert on public.faq_suggestions
  for insert to authenticated
  with check (suggested_by = auth.uid() and status = 'new' and (public.is_mentor() or public.is_staff()));
create policy cc_suggest_select on public.faq_suggestions
  for select to authenticated using (public.is_staff() or suggested_by = auth.uid());
create policy cc_staff_update on public.faq_suggestions
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy cc_staff_delete on public.faq_suggestions
  for delete to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------
-- 7. Starter content. Edit or delete from the coordinator screens afterwards.
-- ---------------------------------------------------------------------------

-- The real shuttle schedule is added by supabase/migrations/20260919150000_shuttle_times_2026.sql. Run it after
-- this file. It also removes the placeholder starter times an older version of this script added.

-- Tutorial modules. Steps (text, images, videos) are added later from the coordinator screens.
insert into public.readiness_modules (title, description, icon, sort_order)
select v.title, v.description, v.icon, v.sort_order
from (values
  ('Basic computer skills',       'Find your way around a computer: files, folders, keyboard shortcuts and staying safe online.', 'desktop-outline',  1),
  ('Using Funda',                 'Funda may be new to you. This guide will help you find your modules, announcements and learning materials.', 'school-outline', 2),
  ('Printing on campus',          'How to print and collect your documents, step by step.',                                      'print-outline',    3),
  ('Connecting to campus Wi-Fi',  'Get connected to eduroam so you can work anywhere on campus.',                                'wifi-outline',     4),
  ('Getting help from ITS',       'How to reach IT Services and what to try before you ask for help.',                           'help-buoy-outline', 5)
) as v(title, description, icon, sort_order)
where not exists (select 1 from public.readiness_modules m where m.title = v.title);

insert into public.readiness_steps (module_id, sort_order, title, body, link_url, link_label)
select m.module_id, 1, 'Log in to Funda',
       'Go to funda.mandela.ac.za and log in using your student number. Check the announcements before you start any assignment.',
       'https://funda.mandela.ac.za', 'Open Funda'
from public.readiness_modules m
where m.title = 'Using Funda'
  and not exists (select 1 from public.readiness_steps s where s.module_id = m.module_id);

-- ---------------------------------------------------------------------------
-- 8. Sport & recreation, gym sign-up
--    Students read these; coordinators and admins manage them from the app.
--    Campus events are in public.event: see supabase/migrations/20260919130000_event_schedule.sql.
-- ---------------------------------------------------------------------------

create table if not exists public.sport_recreation (
  item_id        uuid primary key default gen_random_uuid(),
  kind           text not null default 'club' check (kind in ('club', 'facility', 'gym')),
  name           text not null,
  campus         text,
  venue          text,
  description    text,
  schedule       text,      -- training times or opening hours
  cost           text,
  how_to_join    text,      -- one step per line
  what_to_bring  text,
  contact_name   text,
  contact_email  text,
  contact_phone  text,
  link_url       text,
  sort_order     int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

do $$
declare
  t text;
  r record;
begin
  foreach t in array array['sport_recreation']
  loop
    execute format('alter table public.%I enable row level security', t);
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', r.policyname, t);
    end loop;
    execute format('create policy cc_read on public.%I for select to anon, authenticated using (is_active or public.is_staff())', t);
    execute format('create policy cc_staff_insert on public.%I for insert to authenticated with check (public.is_staff())', t);
    execute format('create policy cc_staff_update on public.%I for update to authenticated using (public.is_staff()) with check (public.is_staff())', t);
    execute format('create policy cc_staff_delete on public.%I for delete to authenticated using (public.is_staff())', t);
  end loop;
end
$$;

-- The real Sport & gym content (the Madibaz clubs, how to join and the sport office numbers) is added by
-- supabase/migrations/20260919140000_sport_gym_madibaz.sql. Run it after this file. It also removes any
-- unedited "SAMPLE:" rows.
