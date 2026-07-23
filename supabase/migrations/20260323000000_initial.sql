-- Promptr initial schema: profiles, checklists, daily plans, reminders

create extension if not exists "pgcrypto";

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text not null default 'Pacific/Auckland',
  text_size text not null default 'large' check (text_size in ('medium', 'large', 'xlarge')),
  accent text not null default '#007AFF',
  reduce_motion boolean not null default false,
  home_layout text not null default 'plan_first' check (home_layout in ('plan_first', 'routines_first')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lasting checklists (custom)
create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default 'Your custom checklist',
  icon text not null default 'sparkle',
  color text not null default '#007AFF',
  steps jsonb not null default '[]'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index checklists_user_id_idx on public.checklists (user_id) where archived = false;

-- Daily plans
create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table public.daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.daily_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  checklist_id uuid references public.checklists (id) on delete set null,
  preset_id text,
  title text not null,
  scheduled_time time,
  sort_order int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'done', 'skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (checklist_id is not null or preset_id is not null)
);

create index daily_plan_items_plan_id_idx on public.daily_plan_items (plan_id);
create index daily_plan_items_user_id_idx on public.daily_plan_items (user_id);

-- Reminder settings (one row per user)
create table public.reminder_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_enabled boolean not null default true,
  calendar_enabled boolean not null default false,
  lead_minutes int not null default 15 check (lead_minutes >= 0 and lead_minutes <= 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Queued reminder jobs
create table public.reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_item_id uuid references public.daily_plan_items (id) on delete cascade,
  channel text not null check (channel in ('email', 'calendar')),
  fire_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  error text,
  calendar_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reminder_jobs_due_idx on public.reminder_jobs (fire_at) where status = 'pending';

-- Per-user Google Calendar tokens (refresh token stored server-side)
create table public.google_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  scope text,
  updated_at timestamptz not null default now()
);

-- Auto-create profile + reminder settings on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  insert into public.reminder_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger checklists_updated_at before update on public.checklists
  for each row execute function public.set_updated_at();
create trigger daily_plans_updated_at before update on public.daily_plans
  for each row execute function public.set_updated_at();
create trigger daily_plan_items_updated_at before update on public.daily_plan_items
  for each row execute function public.set_updated_at();
create trigger reminder_settings_updated_at before update on public.reminder_settings
  for each row execute function public.set_updated_at();
create trigger reminder_jobs_updated_at before update on public.reminder_jobs
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.checklists enable row level security;
alter table public.daily_plans enable row level security;
alter table public.daily_plan_items enable row level security;
alter table public.reminder_settings enable row level security;
alter table public.reminder_jobs enable row level security;
alter table public.google_tokens enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

create policy "checklists_all_own" on public.checklists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_plans_all_own" on public.daily_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_plan_items_all_own" on public.daily_plan_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reminder_settings_all_own" on public.reminder_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reminder_jobs_select_own" on public.reminder_jobs for select using (auth.uid() = user_id);
create policy "reminder_jobs_insert_own" on public.reminder_jobs for insert with check (auth.uid() = user_id);
create policy "reminder_jobs_update_own" on public.reminder_jobs for update using (auth.uid() = user_id);
create policy "reminder_jobs_delete_own" on public.reminder_jobs for delete using (auth.uid() = user_id);

-- google_tokens: users can read existence but not insert/update via client freely —
-- Edge Functions use service role. Allow select of own row (without exposing to others).
create policy "google_tokens_select_own" on public.google_tokens for select using (auth.uid() = user_id);
create policy "google_tokens_upsert_own" on public.google_tokens for insert with check (auth.uid() = user_id);
create policy "google_tokens_update_own" on public.google_tokens for update using (auth.uid() = user_id);
create policy "google_tokens_delete_own" on public.google_tokens for delete using (auth.uid() = user_id);

-- API roles need table privileges in addition to RLS policies
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
