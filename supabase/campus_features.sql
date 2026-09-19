-- Campus Companion: tribe chat, support pathways, shuttle times, digital readiness
-- and staff (coordinator/admin) write access.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- The script is idempotent, so running it again is safe.
--
-- Roles are read from the JWT *app_metadata* claim (`role`), which users cannot
-- edit themselves. Set it per user in Authentication -> Users, or with
--   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"coordinator"}' where email = '...';

-- ---------------------------------------------------------------------------
-- 0. Role helpers
-- ---------------------------------------------------------------------------

create or replace function public.app_role()
returns text
language sql
stable
as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') $$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$ select public.app_role() in ('coordinator', 'admin') $$;

-- ---------------------------------------------------------------------------
-- 1. Existing content tables: everyone can read, only staff can write.
--    (This is what lets the admin and coordinator screens save.)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  r record;
begin
  foreach t in array array['Contact', 'FAQ', 'Announcement', 'schedule_items', 'Venue', 'checklist_item']
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

-- The student checklist currently stores "done" on the shared row, so signed-in
-- students must be able to update it. (Known limitation: one shared tick for
-- everyone. Per-student progress would need its own table.)
drop policy if exists cc_checklist_toggle on public.checklist_item;
create policy cc_checklist_toggle on public.checklist_item
  for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 2. Support pathways ("I need help with...")
-- ---------------------------------------------------------------------------

create table if not exists public.support_pathways (
  support_pathway_id     uuid primary key default gen_random_uuid(),
  student_need           text not null,
  category               text,
  recommended_contact    text,
  contact_email          text,
  recommended_action     text,
  related_faq            text,
  related_resource_url   text,
  related_resource_label text,
  sort_order             int  not null default 0,
  created_at             timestamptz not null default now()
);

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
  days           text not null default 'Mon - Fri',
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
  foreach t in array array['support_pathways', 'shuttle_times', 'readiness_modules', 'readiness_steps', 'readiness_progress']
  loop
    execute format('alter table public.%I enable row level security', t);
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', r.policyname, t);
    end loop;
  end loop;
end
$$;

create policy cc_read on public.support_pathways for select to anon, authenticated using (true);
create policy cc_staff_insert on public.support_pathways for insert to authenticated with check (public.is_staff());
create policy cc_staff_update on public.support_pathways for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy cc_staff_delete on public.support_pathways for delete to authenticated using (public.is_staff());

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

  new.role := case when public.is_staff() then 'mentor' else 'student' end;

  select username into uname from public.community_profiles where auth_id = new.auth_id;
  new.display_name := coalesce(uname, case when public.is_staff() then 'Mentor' end);
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
-- 7. Starter content. Edit or delete from the coordinator screens afterwards.
-- ---------------------------------------------------------------------------

insert into public.support_pathways (student_need, category, recommended_contact, recommended_action, related_faq, sort_order)
select v.student_need, v.category, v.recommended_contact, v.recommended_action, v.related_faq, v.sort_order
from (values
  ('I am struggling with a module',          'Academic support',  'Your lecturer or programme coordinator',
   'Write down the exact part you are stuck on, then ask one focused question. Asking early is a smart academic habit.', 'Modules', 1),
  ('I am feeling overwhelmed or anxious',    'Wellness',          'Student counselling and wellness services',
   'You do not need the perfect words. Book a chat with a counsellor. Support is confidential and free for students.', 'Support', 2),
  ('I cannot pay for something I need',      'Financial aid',     'Financial aid office',
   'Speak to the financial aid office as early as you can. Many students need this help.', 'Registration', 3),
  ('I need learning support or accessibility help', 'Disability support', 'Disability services',
   'Let the disability unit know what would help you learn. They will guide you on the next step.', null, 4),
  ('I cannot log in or connect to Wi-Fi',    'IT support',        'IT Services (ITS) service desk',
   'Check your username, password and internet connection first. If it still does not work, contact the ITS service desk.', 'Wi-fi', 5),
  ('I want a mentor or someone who has been where I am', 'Peer mentoring', 'Your How2buddy mentor',
   'Your mentor is a senior student who remembers what the first weeks feel like. Say hello in your Tribe chat.', 'Orientation', 6),
  ('I need help studying or managing my time', 'Study skills',   'Academic advisor',
   'Try short focused study blocks and plan your week around your timetable. An advisor can help you build a routine.', null, 7)
) as v(student_need, category, recommended_contact, recommended_action, related_faq, sort_order)
where not exists (select 1 from public.support_pathways p where p.student_need = v.student_need);

-- SAMPLE shuttle times: replace with the real timetable before term starts.
insert into public.shuttle_times (shift, route_name, pickup_point, dropoff_point, departure_time, days, notes)
select v.shift, v.route_name, v.pickup_point, v.dropoff_point, v.departure_time::time, v.days, 'Sample time - update before term starts'
from (values
  ('morning',   'Residence to Campus', 'Residence',   'Main Campus', '06:30', 'Mon - Fri'),
  ('morning',   'Residence to Campus', 'Residence',   'Main Campus', '07:15', 'Mon - Fri'),
  ('morning',   'Residence to Campus', 'Residence',   'Main Campus', '08:00', 'Mon - Fri'),
  ('afternoon', 'Campus to Residence', 'Main Campus', 'Residence',   '13:00', 'Mon - Fri'),
  ('afternoon', 'Campus to Residence', 'Main Campus', 'Residence',   '15:30', 'Mon - Fri'),
  ('afternoon', 'Campus to Residence', 'Main Campus', 'Residence',   '17:00', 'Mon - Fri'),
  ('night',     'Campus to Residence', 'Main Campus', 'Residence',   '19:00', 'Mon - Fri'),
  ('night',     'Campus to Residence', 'Main Campus', 'Residence',   '21:00', 'Mon - Fri'),
  ('night',     'Campus to Residence', 'Main Campus', 'Residence',   '22:30', 'Mon - Fri')
) as v(shift, route_name, pickup_point, dropoff_point, departure_time, days)
where not exists (
  select 1 from public.shuttle_times s
  where s.shift = v.shift and s.route_name = v.route_name and s.departure_time = v.departure_time::time
);

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
