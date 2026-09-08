-- Step 5 (Monetization) schema.
--
-- Not run automatically - same as 2026-08-17-add-is-synced.sql, apply this
-- yourself via the Supabase SQL editor or `supabase db push` before
-- deploying the updated `fetch-lyrics` function or the new
-- `revenuecat-webhook` function, otherwise both will error on missing
-- tables/functions.
--
-- Both tables are only ever touched by edge functions using the
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS entirely in Supabase's
-- Postgres setup - so RLS is enabled with deliberately ZERO policies here.
-- That's not an oversight: it means `anon`/`authenticated` (i.e. any client
-- request, however it's authenticated) gets zero direct access to either
-- table, full stop. Nothing here needs to be readable by the app directly -
-- quota state comes back to the client through the fetch-lyrics SSE `meta`
-- event instead (see fetch-lyrics/index.ts), and Pro status comes from the
-- RevenueCat SDK on-device, not a DB read.

-- ==========================================
-- FREE-TRIAL QUOTA (PIVOT II: 3 free translations/day for un-cached tracks)
-- ==========================================
create table public.translation_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  count int not null default 0,
  primary key (user_id, usage_date)
);
alter table public.translation_usage enable row level security;

-- Atomic "is there quota left, and if so consume one" check. Row-locked
-- (`for update`) so two concurrent requests from the same user (e.g. two
-- devices, or a fast double-tap) can't both read the same pre-increment
-- count and both get allowed past a 3rd/4th slot that only actually exists
-- once.
create or replace function public.consume_translation_quota(
  p_user_id uuid,
  p_daily_limit int
) returns table(allowed boolean, used_count int)
language plpgsql
as $$
declare
  current_count int;
begin
  insert into public.translation_usage (user_id, usage_date, count)
  values (p_user_id, current_date, 0)
  on conflict (user_id, usage_date) do nothing;

  select count into current_count from public.translation_usage
    where user_id = p_user_id and usage_date = current_date
    for update;

  if current_count >= p_daily_limit then
    return query select false, current_count;
  else
    update public.translation_usage set count = count + 1
      where user_id = p_user_id and usage_date = current_date;
    return query select true, current_count + 1;
  end if;
end;
$$;

-- ==========================================
-- SUBSCRIPTION STATUS (kept in sync by supabase/functions/revenuecat-webhook)
-- ==========================================
create table public.subscribers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_pro boolean not null default false,
  entitlement text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
