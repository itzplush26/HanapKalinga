-- Shared DB-backed rate limiter for API hardening (DDoS/brute-force mitigation).

create table if not exists public.request_rate_limits (
  key text primary key,
  count integer not null default 0,
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists request_rate_limits_updated_at_idx
  on public.request_rate_limits(updated_at);

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_ms integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window interval := make_interval(secs => greatest(p_window_seconds, 1));
  v_row public.request_rate_limits%rowtype;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'rate limit key is required';
  end if;

  if p_limit < 1 then
    raise exception 'rate limit must be at least 1';
  end if;

  delete from public.request_rate_limits
  where updated_at < (v_now - interval '2 days');

  select *
  into v_row
  from public.request_rate_limits
  where key = p_key
  for update;

  if not found then
    insert into public.request_rate_limits (key, count, window_started_at, updated_at)
    values (p_key, 1, v_now, v_now);

    return query select true, greatest(p_limit - 1, 0), 0;
    return;
  end if;

  if v_row.window_started_at <= (v_now - v_window) then
    update public.request_rate_limits
    set count = 1,
        window_started_at = v_now,
        updated_at = v_now
    where key = p_key;

    return query select true, greatest(p_limit - 1, 0), 0;
    return;
  end if;

  if v_row.count >= p_limit then
    return query
      select
        false,
        0,
        greatest((extract(epoch from ((v_row.window_started_at + v_window) - v_now)) * 1000)::integer, 0);
    return;
  end if;

  update public.request_rate_limits
  set count = v_row.count + 1,
      updated_at = v_now
  where key = p_key;

  return query select true, greatest(p_limit - (v_row.count + 1), 0), 0;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated, service_role;
