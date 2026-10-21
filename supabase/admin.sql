-- =============================================================================
-- Admin area migration — run this in Supabase > SQL Editor (one time).
--
-- It does three things:
--   1. Adds profiles.is_superadmin (the flag the admin UI gates on).
--   2. Adds a helper + RLS policies so a superadmin can READ all users/votes and
--      do full CRUD on vibes. (Without these, the existing RLS would let the admin
--      see only their OWN profile row and nothing else.)
--   3. Bootstraps the first superadmin — see the very bottom.
-- =============================================================================

-- 1. The flag -----------------------------------------------------------------
alter table public.profiles
  add column if not exists is_superadmin boolean not null default false;

-- 2a. Helper: "is the current caller a superadmin?"
-- SECURITY DEFINER so the function can read profiles without tripping RLS, and a
-- locked-down search_path so it can't be hijacked.
create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_superadmin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- 2b. profiles: superadmins can read EVERY profile (READ users requirement).
drop policy if exists "Superadmins can read all profiles" on public.profiles;
create policy "Superadmins can read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_superadmin());

-- 2c. vibes: superadmins get full CRUD (the "AI generated media" requirement).
drop policy if exists "Superadmins can read all vibes" on public.vibes;
create policy "Superadmins can read all vibes"
  on public.vibes for select
  to authenticated
  using (public.is_superadmin());

drop policy if exists "Superadmins can insert vibes" on public.vibes;
create policy "Superadmins can insert vibes"
  on public.vibes for insert
  to authenticated
  with check (public.is_superadmin());

drop policy if exists "Superadmins can update vibes" on public.vibes;
create policy "Superadmins can update vibes"
  on public.vibes for update
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

drop policy if exists "Superadmins can delete vibes" on public.vibes;
create policy "Superadmins can delete vibes"
  on public.vibes for delete
  to authenticated
  using (public.is_superadmin());

-- 2d. vibe_votes: superadmins can read every vote (READ ratings requirement).
drop policy if exists "Superadmins can read all votes" on public.vibe_votes;
create policy "Superadmins can read all votes"
  on public.vibe_votes for select
  to authenticated
  using (public.is_superadmin());

-- restaurants is already publicly readable, so no new policy is needed for joins.

-- 3. Bootstrap the first superadmin ------------------------------------------
-- This is the answer to "won't you lock yourself out?": the admin UI requires
-- is_superadmin = true, but no one can grant it through that locked UI. We grant
-- it here, OUTSIDE the app, using direct database access (the SQL Editor bypasses
-- the app and RLS entirely). The account must have signed into the original app
-- at least once so its profiles row exists.
update public.profiles
  set is_superadmin = true
  where email = 'alynatakahashi2006@gmail.com';

-- Sanity check — should return your row with is_superadmin = true:
-- select id, email, is_superadmin from public.profiles where is_superadmin;
