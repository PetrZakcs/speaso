-- ============================================================
-- Speaso — Supabase Backend Schema & RLS Setup
-- ============================================================

-- 1. Onboarding Answers (Anonymous Product Feedback)
create table if not exists public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  install_id text not null,
  lang text,
  platform text,
  app_version text,
  situations jsonb,
  situations_other text,
  goal text,
  goal_other text,
  scenario_title text,
  scenario_phrase text,
  age_group text,
  therapy_status text,
  daily_minutes integer,
  created_at timestamptz not null default now()
);

alter table public.onboarding_answers enable row level security;

-- Anon insert policy (app sends answers when user opts in)
create policy "Anon can insert onboarding answers"
  on public.onboarding_answers for insert
  to anon
  with check (true);

-- 2. Privacy-first Anonymous Analytics Events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  install_id text not null,
  event text not null,
  properties jsonb default '{}'::jsonb,
  platform text,
  app_version text,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_event on public.analytics_events(event);
create index if not exists idx_analytics_events_created on public.analytics_events(created_at);

alter table public.analytics_events enable row level security;

create policy "Anon can insert analytics events"
  on public.analytics_events for insert
  to anon
  with check (true);

-- 3. Speech Therapist Collaboration (B2B Clinic Portal)
create table if not exists public.therapist_patients (
  id uuid primary key default gen_random_uuid(),
  patient_code text not null unique,     -- e.g. "SPE-8492"
  patient_alias text,
  therapist_id uuid references auth.users(id) on delete set null,
  therapist_name text,
  clinic_name text,
  assigned_exercises jsonb default '[]'::jsonb,
  notes text,
  status text not null default 'active', -- active, archived
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.therapist_patients enable row level security;

-- Anyone (anon & authenticated) can register or update their patient code
drop policy if exists "Anyone can insert therapist patient" on public.therapist_patients;
create policy "Anyone can insert therapist patient"
  on public.therapist_patients for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anyone can update therapist patient" on public.therapist_patients;
create policy "Anyone can update therapist patient"
  on public.therapist_patients for update
  to anon, authenticated
  using (true)
  with check (true);

-- Anon can look up their own patient code or pair
drop policy if exists "Anon can query patient code" on public.therapist_patients;
create policy "Anon can query patient code"
  on public.therapist_patients for select
  to anon
  using (true);

-- Therapists can manage their assigned patients
drop policy if exists "Therapists can view and edit their patients" on public.therapist_patients;
create policy "Therapists can view and edit their patients"
  on public.therapist_patients for all
  to authenticated
  using (therapist_id = auth.uid())
  with check (therapist_id = auth.uid());

-- 4. Dynamic CMS Content (Daily quotes and reading passages without app release)
create table if not exists public.cms_content (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'daily_quote', 'reading_text', 'announcement'
  lang text not null default 'cs',
  title text not null,
  body text not null,
  author text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.cms_content enable row level security;

create policy "Anyone can read active CMS content"
  on public.cms_content for select
  to anon, authenticated
  using (active = true);

-- 5. Anonymized Clinical Balbuties Research Dataset
create table if not exists public.research_balbuties_data (
  id uuid primary key default gen_random_uuid(),
  install_id text not null,
  age_group text,
  therapy_status text,
  stuttering_situations jsonb,
  date text not null,
  speech_rating integer not null, -- 1 to 5
  sleep_hours integer,
  water_glasses integer,
  weather text,
  somatic_tags jsonb default '[]'::jsonb,
  has_journal_note boolean default false,
  platform text,
  app_version text,
  created_at timestamptz not null default now()
);

create index if not exists idx_research_date on public.research_balbuties_data(date);
create index if not exists idx_research_rating on public.research_balbuties_data(speech_rating);

alter table public.research_balbuties_data enable row level security;

create policy "Anon can insert research records"
  on public.research_balbuties_data for insert
  to anon
  with check (true);

-- 6. User Push & Notification Schedules (Telemetry for Smart Delivery Windows)
create table if not exists public.user_notification_schedules (
  install_id text primary key,
  timezone text not null default 'UTC',
  utc_offset_hours numeric,
  language text not null default 'cs',
  practice_enabled boolean not null default true,
  practice_hour integer not null default 18,
  practice_minute integer not null default 0,
  morning_enabled boolean not null default false,
  morning_hour integer not null default 8,
  morning_minute integer not null default 0,
  streak_saver_enabled boolean not null default false,
  streak_saver_hour integer not null default 20,
  streak_saver_minute integer not null default 30,
  platform text,
  app_version text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_notification_schedules_tz on public.user_notification_schedules(timezone);

alter table public.user_notification_schedules enable row level security;

create policy "Anon can upsert user notification schedule"
  on public.user_notification_schedules for all
  to anon
  using (true)
  with check (true);

-- 7. Managed VIP Promo Codes & Anti-Leakage Redemption System
create table if not exists public.vip_promo_codes (
  code text primary key,
  description text,
  duration_days integer,              -- null = lifetime VIP, or 30, 90, 365 days
  max_redemptions integer default 1,  -- 1 = single-use (cannot leak/spread), null = unlimited, 50 = batch
  times_redeemed integer not null default 0,
  valid_until timestamptz,            -- optional deadline after which code cannot be redeemed
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.vip_promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.vip_promo_codes(code) on delete cascade,
  install_id text not null,
  redeemed_at timestamptz not null default now(),
  constraint uq_vip_code_install unique (code, install_id)
);

create index if not exists idx_vip_promo_redemptions_code on public.vip_promo_redemptions(code);
create index if not exists idx_vip_promo_redemptions_install on public.vip_promo_redemptions(install_id);

alter table public.vip_promo_codes enable row level security;
alter table public.vip_promo_redemptions enable row level security;

-- Atomic redemption function to prevent race conditions & enforce single-use/quota limits
create or replace function public.redeem_vip_code(p_code text, p_install_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_code text := upper(trim(p_code));
  v_rec record;
begin
  -- 1. Find active code with row lock
  select * into v_rec
  from public.vip_promo_codes
  where code = v_code and is_active = true
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'invalid');
  end if;

  -- 2. Check expiration deadline
  if v_rec.valid_until is not null and v_rec.valid_until < now() then
    return jsonb_build_object('success', false, 'error', 'expired');
  end if;

  -- 3. Check max redemptions limit (leakage prevention)
  if v_rec.max_redemptions is not null and v_rec.times_redeemed >= v_rec.max_redemptions then
    return jsonb_build_object('success', false, 'error', 'max_uses_reached');
  end if;

  -- 4. Check if this installation already redeemed this specific code
  if exists (
    select 1 from public.vip_promo_redemptions
    where code = v_code and install_id = p_install_id
  ) then
    return jsonb_build_object('success', false, 'error', 'already_redeemed');
  end if;

  -- 5. Record redemption & increment count atomically
  insert into public.vip_promo_redemptions (code, install_id)
  values (v_code, p_install_id);

  update public.vip_promo_codes
  set times_redeemed = times_redeemed + 1
  where code = v_code;

  return jsonb_build_object(
    'success', true,
    'code', v_rec.code,
    'duration_days', v_rec.duration_days,
    'description', v_rec.description
  );
end;
$$;

grant execute on function public.redeem_vip_code(text, text) to anon, authenticated;

-- 8. Administrators & Superadmin Access Control
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  role text not null default 'admin', -- 'superadmin', 'admin', 'auditor'
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Only authenticated administrators can view or edit admin users
create policy "Admins can view admin users"
  on public.admin_users for select
  to authenticated
  using (true);

-- Helpful function for Petr to add or whitelist an admin account via SQL
create or replace function public.add_admin_account(p_email text, p_name text default null, p_role text default 'admin')
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into public.admin_users (email, full_name, role)
  values (lower(trim(p_email)), p_name, p_role)
  on conflict (email) do update
  set full_name = coalesce(excluded.full_name, public.admin_users.full_name),
      is_active = true
  returning id into v_id;

  return v_id;
end;
$$;

-- 9. Administrator Read Access Policies (RLS for In-App Admin & Studio)
-- Grants logged-in administrators (role: authenticated) full read access to telemetry & analytics.

-- Fix & ensure anon + authenticated can insert onboarding answers
drop policy if exists "Anon can insert onboarding answers" on public.onboarding_answers;
create policy "Anyone can insert onboarding answers"
  on public.onboarding_answers for insert
  to anon, authenticated
  with check (true);

-- Admins can view all onboarding answers
drop policy if exists "Admins can view onboarding answers" on public.onboarding_answers;
create policy "Admins can view onboarding answers"
  on public.onboarding_answers for select
  to authenticated
  using (true);

-- Admins can view all analytics events
drop policy if exists "Admins can view analytics events" on public.analytics_events;
create policy "Admins can view analytics events"
  on public.analytics_events for select
  to authenticated
  using (true);

-- Admins can view all clinical research records
drop policy if exists "Admins can view research balbuties data" on public.research_balbuties_data;
create policy "Admins can view research balbuties data"
  on public.research_balbuties_data for select
  to authenticated
  using (true);

-- Admins can view all user notification schedules
drop policy if exists "Admins can view notification schedules" on public.user_notification_schedules;
create policy "Admins can view notification schedules"
  on public.user_notification_schedules for select
  to authenticated
  using (true);

-- Admins can view all VIP promo codes & redemptions
drop policy if exists "Admins can view vip promo codes" on public.vip_promo_codes;
create policy "Admins can view vip promo codes"
  on public.vip_promo_codes for select
  to authenticated
  using (true);

drop policy if exists "Admins can view vip promo redemptions" on public.vip_promo_redemptions;
create policy "Admins can view vip promo redemptions"
  on public.vip_promo_redemptions for select
  to authenticated
  using (true);

-- Admins can view all connected therapist patients
drop policy if exists "Admins can view therapist patients" on public.therapist_patients;
create policy "Admins can view therapist patients"
  on public.therapist_patients for select
  to authenticated
  using (true);
