-- PISA Hub — admin schema
-- Run once in Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).
-- Safe to re-run: guarded with IF NOT EXISTS / CREATE OR REPLACE where possible.

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, holds their role.
-- Supabase auth.users already exists (managed by Supabase Auth) — we extend it.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'maintainer' check (role in ('maintainer', 'admin')),
  created_at timestamptz not null default now()
);

-- SECURITY: profiles are created only by an admin (Users tab -> /api/users, which uses the
-- service-role key). There is deliberately NO trigger that gives new sign-ups a profile:
-- an earlier version made every new auth user a "maintainer", which - with Supabase's public
-- sign-up enabled - would let anyone on the internet create an account with edit access.
-- Someone without a profile row has no access at all (has_role() is false for them).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Helper used inside RLS policies below: does the current user have at least `min_role`?
create or replace function public.has_role(min_role text)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and (
        role = 'admin'
        or (min_role = 'maintainer' and role = 'maintainer')
      )
  );
$$ language sql security definer stable;

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id text primary key,                 -- matches the existing `id` convention in js/main.js, e.g. "diwali-2026"
  title text not null,
  tagline text,
  event_date timestamptz not null,
  end_date timestamptz,
  location text,
  register_link text,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id) on delete cascade,
  storage_key text not null,           -- R2 object key, e.g. events/diwali-2026/<uuid>.jpg
  is_poster boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  section text not null default 'committee' check (section in ('exec', 'committee')),
  instagram text,
  linkedin text,
  quote text,
  storage_key text,                    -- R2 object key for headshot, null = fallback avatar
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_photos enable row level security;
alter table public.team_members enable row level security;

-- profiles: users can read their own row; only admins can read/edit everyone's.
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (user_id = auth.uid() or public.has_role('admin'));

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles
  for all using (public.has_role('admin')) with check (public.has_role('admin'));

-- events: public can read published events; maintainers/admins can read+write everything.
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read" on public.events
  for select using (status = 'published' or public.has_role('maintainer'));

drop policy if exists "events_maintainer_write" on public.events;
create policy "events_maintainer_write" on public.events
  for all using (public.has_role('maintainer')) with check (public.has_role('maintainer'));

-- event_photos: readable if the parent event is readable; writable by maintainers/admins.
drop policy if exists "event_photos_public_read" on public.event_photos;
create policy "event_photos_public_read" on public.event_photos
  for select using (
    public.has_role('maintainer')
    or exists (select 1 from public.events e where e.id = event_id and e.status = 'published')
  );

drop policy if exists "event_photos_maintainer_write" on public.event_photos;
create policy "event_photos_maintainer_write" on public.event_photos
  for all using (public.has_role('maintainer')) with check (public.has_role('maintainer'));

-- team_members: public read always; maintainers/admins write.
drop policy if exists "team_public_read" on public.team_members;
create policy "team_public_read" on public.team_members
  for select using (true);

drop policy if exists "team_maintainer_write" on public.team_members;
create policy "team_maintainer_write" on public.team_members
  for all using (public.has_role('maintainer')) with check (public.has_role('maintainer'));

-- ---------------------------------------------------------------------------
-- Table-level grants. RLS policies above control *which rows* each role can
-- touch, but Postgres checks table-level GRANTs first — without these, every
-- query (even ones RLS would allow) fails with "permission denied for table".
-- This is the standard Supabase pattern: grant broadly here, restrict with RLS.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- One-time bootstrap of the FIRST admin on a brand-new project: create the user in the
-- Supabase dashboard (Authentication -> Users -> Add user), then run this with their email.
-- Every other account is created from the admin portal's Users tab.
-- ---------------------------------------------------------------------------
-- insert into public.profiles (user_id, display_name, role)
-- select id, email, 'admin' from auth.users where email = 'you@example.com'
-- on conflict (user_id) do update set role = 'admin';

-- ---------------------------------------------------------------------------
-- Gallery thumbnails (added with the Gallery module). Admin uploads store a
-- resized full image (storage_key) plus a small thumbnail (thumb_key) so the
-- public gallery grid stays fast with 1000+ photos. Older rows have no thumb.
-- ---------------------------------------------------------------------------
alter table public.event_photos add column if not exists thumb_key text;

-- ---------------------------------------------------------------------------
-- Gallery photos are public only after the event has ended. Posters stay public
-- for any published event (they are the marketing image for upcoming events).
-- The site already hides early photos in the UI; this enforces it in the database
-- so they can't be fetched from the API either. Maintainers/admins see everything.
-- "Ended" = end_date, or event_date + 6 hours when no end_date is set (same rule as the site).
-- ---------------------------------------------------------------------------
drop policy if exists "event_photos_public_read" on public.event_photos;
create policy "event_photos_public_read" on public.event_photos
  for select using (
    public.has_role('maintainer')
    or exists (
      select 1 from public.events e
      where e.id = event_photos.event_id
        and e.status = 'published'
        and (
          event_photos.is_poster
          or coalesce(e.end_date, e.event_date + interval '6 hours') <= now()
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Team: which semester a member belongs to, and which group they sit in on the
-- public Team page. term is 'spring' | 'fall'; group_title is e.g. 'Executive Board'.
-- Members without term/year are not shown publicly (legacy rows).
-- ---------------------------------------------------------------------------
alter table public.team_members
  add column if not exists term text check (term in ('spring','fall')),
  add column if not exists year int check (year between 2006 and 2100),
  add column if not exists group_title text;

-- ---------------------------------------------------------------------------
-- Usernames: people can sign in with a username instead of an email. Supabase only knows
-- emails, so /api/auth-username resolves the username to the account's email on the server.
-- username_key is a lower-cased copy, so "ShivamBhatt" and "shivambhatt" are the same login
-- and only one of them can exist. Existing accounts have no username until an admin sets one
-- (Users tab); they keep signing in with their email in the meantime.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists username text check (username ~ '^[A-Za-z0-9._]{3,30}$');
alter table public.profiles
  add column if not exists username_key text generated always as (lower(username)) stored;
create unique index if not exists profiles_username_key_idx on public.profiles (username_key);
