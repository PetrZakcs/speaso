-- Anonymous onboarding answers, sent only after the user opts in.
-- The app can only INSERT (anon key); reading is for the team in the dashboard.
create table if not exists public.onboarding_answers (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  install_id       text not null,
  lang             text not null,
  platform         text not null,
  app_version      text,
  situations       text[] not null default '{}',
  situations_other text,
  goal             text,
  goal_other       text,
  scenario_title   text,
  scenario_phrase  text,
  age_group        text,
  daily_minutes    int
);

create index if not exists onboarding_answers_install_idx on public.onboarding_answers (install_id);

alter table public.onboarding_answers enable row level security;

-- Insert-only for the app. No select/update/delete policies → anon can't read anything back.
drop policy if exists "app can insert answers" on public.onboarding_answers;
create policy "app can insert answers"
  on public.onboarding_answers
  for insert
  to anon
  with check (
    char_length(install_id) between 6 and 64
    and coalesce(char_length(situations_other), 0) <= 500
    and coalesce(char_length(goal_other), 0) <= 500
    and coalesce(char_length(scenario_title), 0) <= 200
    and coalesce(char_length(scenario_phrase), 0) <= 500
  );

-- Latest answer per install, for analysis.
create or replace view public.onboarding_answers_latest
with (security_invoker = true) as
select distinct on (install_id) *
from public.onboarding_answers
order by install_id, created_at desc;
