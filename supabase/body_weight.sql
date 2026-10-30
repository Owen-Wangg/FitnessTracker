-- Body weight tracking: one entry per user per day.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists public.body_weights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date        date not null,
  weight      numeric(5, 1) not null check (weight > 0 and weight < 1500),
  created_at  timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.body_weights enable row level security;

drop policy if exists "own body weights" on public.body_weights;
create policy "own body weights" on public.body_weights
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
