-- SESC Events - Phase 0 & 1 Schema
-- Run this SQL in your Supabase project's SQL editor or via Supabase CLI.

-- 1) PROFILES TABLE ---------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key default auth.uid(),
  full_name text,
  student_id text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep profiles.id in sync with auth.users.id
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

-- Users can see and update their own profile
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Profiles are selectable by owner'
  ) then
    create policy "Profiles are selectable by owner"
      on public.profiles
      for select
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Profiles are updatable by owner'
  ) then
    create policy "Profiles are updatable by owner"
      on public.profiles
      for update
      using (auth.uid() = id);
  end if;
end $$;


-- 2) EVENTS TABLE -----------------------------------------------------------

-- Optional enums for type and status (you can also use plain text)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_type') then
    create type public.event_type as enum ('onsite', 'virtual');
  end if;

  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type public.event_status as enum ('draft', 'published', 'archived');
  end if;
end $$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  type public.event_type not null,
  location text,
  meeting_url text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer,
  status public.event_status not null default 'draft',
  flyer_image_url text,
  color_code text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- Public can read only published events
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and policyname = 'Public can read published events'
  ) then
    create policy "Public can read published events"
      on public.events
      for select
      using (status = 'published');
  end if;
end $$;

-- Authenticated users can manage events for now (to be tightened to admins later)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and policyname = 'Authenticated users can manage events (temp)'
  ) then
    create policy "Authenticated users can manage events (temp)"
      on public.events
      for all
      using (auth.role() = 'authenticated');
  end if;
end $$;


-- 3) EVENT REGISTRATIONS TABLE ---------------------------------------------

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'registered',
  attended boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.event_registrations enable row level security;

-- Only authenticated users can see and manage their own registrations
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'event_registrations'
      and policyname = 'Users can read own registrations'
  ) then
    create policy "Users can read own registrations"
      on public.event_registrations
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'event_registrations'
      and policyname = 'Users can insert own registrations'
  ) then
    create policy "Users can insert own registrations"
      on public.event_registrations
      for insert
      with check (auth.uid() = user_id);
  end if;

  -- Attendance updates will be restricted to admins at the app level for now.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'event_registrations'
      and policyname = 'Users can update own registrations'
  ) then
    create policy "Users can update own registrations"
      on public.event_registrations
      for update
      using (auth.uid() = user_id);
  end if;
end $$;


-- 4) STORAGE BUCKET FOR FLYERS ---------------------------------------------

-- Create bucket for event flyers (idempotent-ish; will error if exists when run twice)
-- Uncomment and run once if bucket doesn't exist:
-- select storage.create_bucket('event-flyers', public := true);

-- Optionally enforce policies on the bucket via the Supabase dashboard.

