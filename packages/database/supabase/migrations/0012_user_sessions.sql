-- One active session token per user (concurrent login lock)
create table if not exists public.user_sessions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  session_token uuid not null,
  device_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_sessions_token_idx on public.user_sessions (session_token);

alter table public.user_sessions enable row level security;

create policy "Users read own session"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own session"
  on public.user_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users update own session"
  on public.user_sessions for update
  using (auth.uid() = user_id);

create policy "Users delete own session"
  on public.user_sessions for delete
  using (auth.uid() = user_id);
