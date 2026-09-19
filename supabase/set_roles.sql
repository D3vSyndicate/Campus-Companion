-- Fix "I can log in as student, admin and HOD, but not coordinator or mentor".
--
-- The app only trusts a role stored in app_metadata (which only the server can set).
-- A role stored in user_metadata is accepted for "student" only, because users can edit
-- user_metadata themselves. Accounts created with role = coordinator/mentor in user_metadata
-- therefore have no role as far as the app is concerned.
--
-- Run these in the Supabase SQL editor, one step at a time. Do not run step 3 blindly.

-- 1. See every account and where its role is stored.
--    A problem looks like: app_role is empty and user_role says coordinator (or mentor, admin, hod).
select email,
       raw_app_meta_data  ->> 'role' as app_role,
       raw_user_meta_data ->> 'role' as user_role
from auth.users
order by email;

-- 2. Give a specific account its role. Edit the email and role, then run it once per person.
--    Roles: student, mentor, coordinator, hod, admin.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "coordinator"}'::jsonb
where lower(email) = lower('their.email@mandela.ac.za');

-- 3. Accounts that CLAIM a staff role in user_metadata but have none in app_metadata.
--    Review this list by hand. Anyone can put any role in user_metadata when they sign up, so only
--    fix the people you actually know (using step 2). Do not bulk-promote this list.
select email, raw_user_meta_data ->> 'role' as claimed_role, created_at
from auth.users
where coalesce(raw_app_meta_data ->> 'role', '') = ''
  and raw_user_meta_data ->> 'role' in ('coordinator', 'mentor', 'hod', 'admin')
order by created_at;

-- 4. Check that the database rules which let staff save changes are in place.
--    A coordinator who sees "You do not have permission" usually has one of two problems: their role is
--    missing in step 1, or these rules are missing. Each staff-managed table should list four rules that
--    start with cc_ (cc_read, cc_staff_insert, cc_staff_update, cc_staff_delete). If a table is missing
--    or has fewer, run supabase/campus_features.sql in the SQL editor.
select tablename, string_agg(policyname, ', ' order by policyname) as rules
from pg_policies
where schemaname = 'public'
  and policyname like 'cc\_%'
group by tablename
order by tablename;

-- After changing a role, that person must sign out and back in so their login carries the new role.
