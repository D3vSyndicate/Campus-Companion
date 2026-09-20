-- Checklist progress, one set of ticks per student.
--
-- Until now a tick was stored on the shared checklist_item row, so one student ticking a task ticked it
-- for every other student too. Progress now lives in its own table with one row per student and task,
-- and a student can only ever see and change their own rows. Safe to run more than once.

create table if not exists public.checklist_progress (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id    text not null,
  done       boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.checklist_progress enable row level security;

drop policy if exists cc_progress_select on public.checklist_progress;
create policy cc_progress_select on public.checklist_progress
  for select to authenticated using (user_id = auth.uid());

drop policy if exists cc_progress_insert on public.checklist_progress;
create policy cc_progress_insert on public.checklist_progress
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists cc_progress_update on public.checklist_progress;
create policy cc_progress_update on public.checklist_progress
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists cc_progress_delete on public.checklist_progress;
create policy cc_progress_delete on public.checklist_progress
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.checklist_progress to authenticated;

-- The old shared tick is not used any more. Only staff may change the task rows themselves.
drop policy if exists cc_checklist_toggle on public.checklist_item;

notify pgrst, 'reload schema';
