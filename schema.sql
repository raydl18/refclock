-- RefClock Supabase schema

create table if not exists games (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now(),
  home_team         text not null,
  away_team         text not null,
  home_score        integer not null default 0,
  away_score        integer not null default 0,
  duration_per_half integer not null,
  events            jsonb not null default '[]',
  notes             text
);

-- Users can only read/write their own games
alter table games enable row level security;

create policy "owner select" on games
  for select using (auth.uid() = user_id);

create policy "owner insert" on games
  for insert with check (auth.uid() = user_id);

create policy "owner delete" on games
  for delete using (auth.uid() = user_id);
