-- Campus Companion: database health check.
--
-- READ ONLY. It changes nothing. Paste it into the Supabase SQL editor and press Run.
--
-- You get one list. Anything that is not "ok" says what to do:
--   MISSING  run supabase/setup_all.sql
--   CHECK    a table has fewer staff rules than expected: run supabase/setup_all.sql
--   NO ROLE  that account cannot log in to the app yet: give it a role (supabase/set_roles.sql)
--   NONE     no tribe exists yet, so students cannot join one: an admin creates one under Tribes

with
tables (t) as (values
  ('Contact'), ('FAQ'), ('Announcement'), ('schedule_items'), ('Venue'), ('checklist_item'),
  ('Support_pathway'), ('digital_readiness'), ('it_programmes'), ('event'), ('shuttle_times'),
  ('sport_recreation'), ('faq_suggestions'), ('coordinator_content'), ('hod_programme_content'),
  ('hod_assignments'), ('hod_resources'), ('hod_contacts'), ('community_groups'), ('community_members'),
  ('community_profiles'), ('community_messages'), ('mentor_groups'), ('mentor_group_members'),
  ('mentor_group_requests'), ('mentor_group_announcements')
),
staff_tables (t) as (values
  ('Contact'), ('FAQ'), ('Announcement'), ('schedule_items'), ('Venue'), ('checklist_item'),
  ('Support_pathway'), ('digital_readiness'), ('shuttle_times'), ('sport_recreation'), ('event'), ('it_programmes')
),
fns (f) as (values
  ('app_role'), ('is_staff'), ('is_mentor'), ('is_hod_manager'), ('join_my_tribe'), ('assign_mentor_to_tribe'),
  ('list_tribe_buddies'), ('remove_mentor_from_tribe'), ('request_to_join_mentor_group'), ('review_mentor_group_request')
),
cols (tbl, col) as (values
  ('event', 'event_date'), ('event', 'start_time'), ('event', 'end_time'), ('event', 'cost'), ('event', 'signup_url'),
  ('event', 'is_active'), ('Venue', 'latitude'), ('Venue', 'longitude'),
  ('community_profiles', 'conduct_accepted_at'), ('hod_programme_content', 'category')
),
counts (t, n) as (
  select t,
         case when to_regclass('public.' || quote_ident(t)) is null then null
              else (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', t), false, true, '')))[1]::text::int
         end
  from tables
),
report as (
  select 1 as ord, 'Table' as section, t as item,
         case when n is null then 'MISSING' else 'ok' end as status,
         case when n is null then 'run supabase/setup_all.sql' else n || ' rows' end as detail
  from counts

  union all
  select 2, 'Column', tbl || '.' || col,
         case when exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = tbl and c.column_name = col) then 'ok' else 'MISSING' end,
         ''
  from cols

  union all
  select 3, 'Staff rules', s.t,
         case when s.n >= 4 then 'ok' else 'CHECK' end,
         s.n || ' rules start with cc_ (expect 4 or more)'
  from (select t, (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = st.t and p.policyname like 'cc\_%') as n from staff_tables st) s

  union all
  select 4, 'Function', f,
         case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = f) then 'ok' else 'MISSING' end,
         ''
  from fns

  union all
  select 5, 'Rule', 'A chat name needs the code of conduct',
         case when exists (select 1 from pg_trigger where tgname = 'community_profiles_require_conduct') then 'ok' else 'MISSING' end, ''
  union all
  select 5, 'Rule', 'Chat messages are stamped by the server',
         case when exists (select 1 from pg_trigger where tgname = 'community_messages_before_insert') then 'ok' else 'MISSING' end, ''

  union all
  select 6, 'Tribe', 'tribes created',
         case when coalesce((select n from counts where t = 'community_groups'), 0) > 0 then 'ok' else 'NONE' end,
         coalesce((select n from counts where t = 'community_groups'), 0) || ' tribe(s), '
           || coalesce((select n from counts where t = 'community_members'), 0) || ' member(s), '
           || coalesce((select n from counts where t = 'community_profiles'), 0) || ' chat name(s)'

  union all
  select 7, 'Account', coalesce(u.email, u.id::text),
         -- The app trusts app_metadata for every role, but a role in the sign-up details only counts for "student".
         case when lower(btrim(u.raw_app_meta_data ->> 'role')) in ('student', 'mentor', 'coordinator', 'hod', 'admin') then 'ok'
              when lower(btrim(u.raw_user_meta_data ->> 'role')) = 'student' then 'ok'
              else 'NO ROLE' end,
         'role in app_metadata: ' || coalesce(format('%L', u.raw_app_meta_data ->> 'role'), 'none')
           || case when u.raw_app_meta_data ->> 'role' is null and u.raw_user_meta_data ->> 'role' is not null
                   then ' (using ' || format('%L', u.raw_user_meta_data ->> 'role') || ' from sign-up details)' else '' end
  from auth.users u
)
select section, item, status, detail
from report
order by ord, item;
