-- Upsert updates need an explicit WITH CHECK on user_sessions
drop policy if exists "Users update own session" on public.user_sessions;

create policy "Users update own session"
  on public.user_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
