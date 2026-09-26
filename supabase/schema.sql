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

-- ===========================================================================
-- CONTRIBUTOR role + approval workflow
--
-- A contributor can ADD things but nothing they add is public until a maintainer or admin
-- approves it. Enforced here in the database (RLS + triggers), not just in the admin screens:
--   * events: they create their own events as 'draft', "submit" them ('pending'), and can
--     edit/withdraw/delete only their own drafts. They can never publish or touch live events.
--   * event_photos: they add photos (approved = false, invisible to the public) to any live
--     event or their own draft; they can only edit/delete their own not-yet-approved photos.
--   * no access at all to team members, other users, or anyone's approved content.
-- Maintainers/admins see everything and approve: events -> 'published', photos -> approved = true.
-- ===========================================================================

-- 1. the new role ------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('maintainer', 'admin', 'contributor'));

-- has_role('maintainer') is true only for maintainer/admin, so every existing write policy
-- already excludes contributors. This helper is for the contributor-specific policies.
create or replace function public.is_contributor()
returns boolean as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'contributor');
$$ language sql security definer stable;

-- 2. who created what, and review state --------------------------------------
alter table public.events add column if not exists created_by uuid references public.profiles(user_id) on delete set null;
alter table public.events add column if not exists review_note text;      -- why it was sent back
alter table public.events add column if not exists submitted_at timestamptz;
alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check check (status in ('draft', 'pending', 'published'));

alter table public.event_photos add column if not exists created_by uuid references public.profiles(user_id) on delete set null;
-- existing photos stay visible: the column defaults to true. Contributor uploads are forced to false by the trigger below.
alter table public.event_photos add column if not exists approved boolean not null default true;

-- 3. triggers that enforce the rules (a contributor cannot get around these) --
create or replace function public.events_guard() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.created_by is null then new.created_by := auth.uid(); end if;
    if public.is_contributor() then
      new.created_by := auth.uid();
      if new.status = 'published' then new.status := 'draft'; end if;
      new.review_note := null;
      new.submitted_at := case when new.status = 'pending' then now() else null end;
    end if;
    return new;
  end if;

  -- UPDATE
  if public.is_contributor() then
    if old.created_by is distinct from auth.uid() then
      raise exception 'You can only change events you created.';
    end if;
    if new.id <> old.id or new.created_by is distinct from old.created_by then
      raise exception 'Ownership of an event cannot be changed.';
    end if;
    if old.status = 'published' then
      raise exception 'Published events can only be changed by a maintainer or admin.';
    elsif old.status = 'pending' then
      if new.status <> 'draft' then
        raise exception 'This event is waiting for review. Withdraw it to make changes.';
      end if;
    elsif new.status not in ('draft', 'pending') then
      raise exception 'Only a maintainer or admin can publish an event.';
    end if;
    if new.status = 'pending' and old.status <> 'pending' then
      new.submitted_at := now();
      new.review_note := null;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;
drop trigger if exists events_guard_trg on public.events;
create trigger events_guard_trg before insert or update on public.events
  for each row execute function public.events_guard();

create or replace function public.event_photos_guard() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.created_by is null then new.created_by := auth.uid(); end if;
    if public.is_contributor() then
      new.created_by := auth.uid();
      new.approved := false;
      -- a poster only belongs on the contributor's own draft event, never on a live one
      if new.is_poster and not exists (
        select 1 from public.events e where e.id = new.event_id and e.created_by = auth.uid() and e.status = 'draft'
      ) then
        raise exception 'Posters can only be added to your own draft events.';
      end if;
    end if;
    return new;
  end if;

  -- UPDATE: a contributor may only re-order their own pending photos
  if public.is_contributor() then
    if (new.approved, new.created_by, new.event_id, new.storage_key, new.thumb_key, new.is_poster)
       is distinct from (old.approved, old.created_by, old.event_id, old.storage_key, old.thumb_key, old.is_poster) then
      raise exception 'Only a maintainer or admin can change or approve photos.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;
drop trigger if exists event_photos_guard_trg on public.event_photos;
create trigger event_photos_guard_trg before insert or update on public.event_photos
  for each row execute function public.event_photos_guard();

-- 4. row-level security ------------------------------------------------------
-- events (these ADD to the existing policies; policies are OR-ed together)
drop policy if exists "events_contributor_read_own" on public.events;
create policy "events_contributor_read_own" on public.events
  for select using (created_by = auth.uid());

drop policy if exists "events_contributor_insert" on public.events;
create policy "events_contributor_insert" on public.events
  for insert with check (public.is_contributor() and created_by = auth.uid() and status in ('draft', 'pending'));

drop policy if exists "events_contributor_update" on public.events;
create policy "events_contributor_update" on public.events
  for update using (public.is_contributor() and created_by = auth.uid() and status in ('draft', 'pending'))
  with check (created_by = auth.uid() and status in ('draft', 'pending'));

drop policy if exists "events_contributor_delete" on public.events;
create policy "events_contributor_delete" on public.events
  for delete using (public.is_contributor() and created_by = auth.uid() and status = 'draft');

-- event_photos: the public (and contributors, for other people's photos) only ever see APPROVED photos
drop policy if exists "event_photos_public_read" on public.event_photos;
create policy "event_photos_public_read" on public.event_photos
  for select using (
    public.has_role('maintainer')
    or exists (
      select 1 from public.events e
      where e.id = event_photos.event_id
        and e.status = 'published'
        and event_photos.approved
        and (
          event_photos.is_poster
          or coalesce(e.end_date, e.event_date + interval '6 hours') <= now()
        )
    )
  );

drop policy if exists "event_photos_contributor_read_own" on public.event_photos;
create policy "event_photos_contributor_read_own" on public.event_photos
  for select using (created_by = auth.uid());

drop policy if exists "event_photos_contributor_insert" on public.event_photos;
create policy "event_photos_contributor_insert" on public.event_photos
  for insert with check (
    public.is_contributor() and created_by = auth.uid() and approved = false
    and exists (select 1 from public.events e where e.id = event_id and (e.status = 'published' or e.created_by = auth.uid()))
  );

drop policy if exists "event_photos_contributor_update" on public.event_photos;
create policy "event_photos_contributor_update" on public.event_photos
  for update using (public.is_contributor() and created_by = auth.uid() and approved = false)
  with check (created_by = auth.uid() and approved = false);

drop policy if exists "event_photos_contributor_delete" on public.event_photos;
create policy "event_photos_contributor_delete" on public.event_photos
  for delete using (public.is_contributor() and created_by = auth.uid() and approved = false);

-- profiles: maintainers can see contributors (to manage them and to show who submitted what)
drop policy if exists "profiles_maintainer_reads_contributors" on public.profiles;
create policy "profiles_maintainer_reads_contributors" on public.profiles
  for select using (public.has_role('maintainer') and role = 'contributor');

-- ===========================================================================
-- Defence in depth: refuse odd-looking ids and file keys at the source.
-- The site also escapes everything it displays, so this is a second lock on the same door:
-- a contributor calling the database directly can no longer store an id / file key that
-- contains quotes, angle brackets or spaces. (Existing data was checked and already conforms.)
-- ===========================================================================
alter table public.events drop constraint if exists events_id_format;
alter table public.events add constraint events_id_format check (id ~ '^[a-z0-9][a-z0-9-]{0,80}$');

alter table public.event_photos drop constraint if exists event_photos_key_format;
alter table public.event_photos add constraint event_photos_key_format check (
  storage_key ~ '^(events|team)/[A-Za-z0-9._/-]+$'
  and (thumb_key is null or thumb_key ~ '^(events|team)/[A-Za-z0-9._/-]+$')
);

alter table public.team_members drop constraint if exists team_members_key_format;
alter table public.team_members add constraint team_members_key_format check (
  storage_key is null or storage_key ~ '^team/[A-Za-z0-9._/-]+$'
);
