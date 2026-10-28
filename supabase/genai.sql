-- =============================================================================
-- Week 7 — GenAI observability migration. Run this in Supabase > SQL Editor ONCE,
-- after (or instead of) supabase/admin.sql.
--
-- It creates the GenAI backend tables the Week-7 admin panel observes — prompt
-- chains, LLM providers/models, generation requests/responses, examples, terms,
-- signup allowlists and images — and locks every one of them to superadmins with
-- the same `public.is_superadmin()` gate the rest of the app already uses.
--
-- Running it is idempotent: every object uses `if not exists` / `create or
-- replace` / `on conflict do nothing`, so re-running it is safe.
-- =============================================================================

-- 0. Make sure the superadmin flag + helper exist (admin.sql creates these too;
--    repeated here so this file is self-contained and order-independent). --------
alter table public.profiles
  add column if not exists is_superadmin boolean not null default false;

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

-- A tiny helper to keep the per-table policy boilerplate below readable: it grants
-- a superadmin full read + write on one table and turns RLS on for it.
create or replace function public._grant_superadmin_all(tbl regclass)
returns void
language plpgsql
as $$
declare
  name text := split_part(tbl::text, '.', 2);
begin
  execute format('alter table %s enable row level security', tbl);
  execute format('drop policy if exists "Superadmins manage %s" on %s', name, tbl);
  execute format(
    'create policy "Superadmins manage %s" on %s for all to authenticated '
    || 'using (public.is_superadmin()) with check (public.is_superadmin())',
    name, tbl
  );
end;
$$;

-- 1. LLM providers (OpenAI, Anthropic, …) -----------------------------------------
create table if not exists public.llm_providers (
  id          bigint generated always as identity primary key,
  name        text    not null,
  slug        text    not null unique,
  base_url    text,
  api_key_env text,                       -- name of the env var holding the key, NOT the key
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
select public._grant_superadmin_all('public.llm_providers');

-- 2. LLM models (gpt-4o-mini, claude-opus-4, …) ------------------------------------
create table if not exists public.llm_models (
  id                  bigint generated always as identity primary key,
  provider_id         bigint not null references public.llm_providers(id) on delete cascade,
  name                text   not null,    -- human label
  model_id            text   not null,    -- API id, e.g. "gpt-4o-mini"
  context_window      integer,
  input_cost_per_1k   numeric,
  output_cost_per_1k  numeric,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);
select public._grant_superadmin_all('public.llm_models');

-- 3. Prompt chains (a named multi-step prompting pipeline) -------------------------
create table if not exists public.prompt_chains (
  id          bigint generated always as identity primary key,
  name        text    not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
select public._grant_superadmin_all('public.prompt_chains');

-- 4. Prompt chain steps (ordered steps within a chain) -----------------------------
create table if not exists public.prompt_chain_steps (
  id                   bigint generated always as identity primary key,
  chain_id             bigint not null references public.prompt_chains(id) on delete cascade,
  step_order           integer not null default 1,
  name                 text   not null,
  system_prompt        text,
  user_prompt_template text,
  model_id             bigint references public.llm_models(id) on delete set null,
  created_at           timestamptz not null default now()
);
select public._grant_superadmin_all('public.prompt_chain_steps');

-- 5. Prompt chain mix (how chains are weighted/blended — read + UPDATE in the UI) --
create table if not exists public.prompt_chain_mix (
  id         bigint generated always as identity primary key,
  chain_id   bigint not null references public.prompt_chains(id) on delete cascade,
  weight     numeric not null default 1,   -- relative probability in the A/B mix
  is_enabled boolean not null default true,
  notes      text,
  updated_at timestamptz not null default now()
);
select public._grant_superadmin_all('public.prompt_chain_mix');

-- 6. Terms (glossary / controlled vocabulary used in generation) -------------------
create table if not exists public.terms (
  id         bigint generated always as identity primary key,
  term       text not null,
  definition text,
  category   text,
  created_at timestamptz not null default now()
);
select public._grant_superadmin_all('public.terms');

-- 7. Generation requests (a user's request to generate a caption — read) -----------
create table if not exists public.generation_requests (
  id            bigint generated always as identity primary key,
  user_id       uuid   references public.profiles(id)   on delete set null,
  restaurant_id bigint references public.restaurants(id) on delete set null,
  chain_id      bigint references public.prompt_chains(id) on delete set null,
  input         text,
  status        text not null default 'pending',  -- pending | completed | failed
  created_at    timestamptz not null default now()
);
select public._grant_superadmin_all('public.generation_requests');

-- 8. LLM responses (raw model output logged per request/step — read) ---------------
create table if not exists public.llm_responses (
  id                bigint generated always as identity primary key,
  request_id        bigint references public.generation_requests(id) on delete cascade,
  model_id          bigint references public.llm_models(id)          on delete set null,
  step_id           bigint references public.prompt_chain_steps(id)  on delete set null,
  prompt            text,
  response          text,
  prompt_tokens     integer,
  completion_tokens integer,
  latency_ms        integer,
  created_at        timestamptz not null default now()
);
select public._grant_superadmin_all('public.llm_responses');

-- 9. AI generation examples (few-shot examples — CRUD) -----------------------------
create table if not exists public.ai_generation_examples (
  id         bigint generated always as identity primary key,
  label      text,
  input      text not null,
  output     text not null,
  chain_id   bigint references public.prompt_chains(id) on delete set null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
select public._grant_superadmin_all('public.ai_generation_examples');

-- 10. Allowed signup domains (email-domain allowlist — CRUD) -----------------------
create table if not exists public.allowed_signup_domains (
  id         bigint generated always as identity primary key,
  domain     text not null unique,        -- e.g. "columbia.edu"
  note       text,
  created_at timestamptz not null default now()
);
select public._grant_superadmin_all('public.allowed_signup_domains');

-- 11. Whitelisted e-mail addresses (per-address allowlist — CRUD) ------------------
create table if not exists public.whitelisted_emails (
  id         bigint generated always as identity primary key,
  email      text not null unique,
  note       text,
  created_at timestamptz not null default now()
);
select public._grant_superadmin_all('public.whitelisted_emails');

-- 12. Images (metadata for files uploaded to Storage — CRUD + upload) --------------
create table if not exists public.images (
  id          bigint generated always as identity primary key,
  bucket      text not null default 'images',
  path        text not null,              -- object path inside the bucket
  alt         text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
select public._grant_superadmin_all('public.images');

-- =============================================================================
-- Storage bucket for image uploads.
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Public bucket => anyone can READ the object URLs; only superadmins may write.
drop policy if exists "Superadmins upload images" on storage.objects;
create policy "Superadmins upload images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and public.is_superadmin());

drop policy if exists "Superadmins update images" on storage.objects;
create policy "Superadmins update images"
  on storage.objects for update to authenticated
  using (bucket_id = 'images' and public.is_superadmin())
  with check (bucket_id = 'images' and public.is_superadmin());

drop policy if exists "Superadmins delete images" on storage.objects;
create policy "Superadmins delete images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'images' and public.is_superadmin());

-- =============================================================================
-- Seed data — small, safe, idempotent. Gives the read-only pages something to
-- show and the CRUD pages realistic starting rows. Delete freely from the UI.
-- =============================================================================

-- Providers
insert into public.llm_providers (name, slug, base_url, api_key_env)
values
  ('OpenAI',    'openai',    'https://api.openai.com/v1',   'OPENAI_API_KEY'),
  ('Anthropic', 'anthropic', 'https://api.anthropic.com',   'ANTHROPIC_API_KEY')
on conflict (slug) do nothing;

-- Models
insert into public.llm_models (provider_id, name, model_id, context_window, input_cost_per_1k, output_cost_per_1k)
select p.id, m.name, m.model_id, m.ctx, m.inc, m.outc
from (values
  ('openai',    'GPT-4o mini',     'gpt-4o-mini',       128000, 0.00015, 0.0006),
  ('anthropic', 'Claude Opus 4.8', 'claude-opus-4-8',   200000, 0.015,   0.075)
) as m(slug, name, model_id, ctx, inc, outc)
join public.llm_providers p on p.slug = m.slug
where not exists (select 1 from public.llm_models x where x.model_id = m.model_id);

-- A prompt chain + two steps + a mix row
insert into public.prompt_chains (name, description)
select 'Vibe caption v1', 'Two-step chain: brainstorm then polish a restaurant vibe caption.'
where not exists (select 1 from public.prompt_chains where name = 'Vibe caption v1');

insert into public.prompt_chain_steps (chain_id, step_order, name, system_prompt, user_prompt_template, model_id)
select c.id, s.ord, s.name, s.sys, s.tmpl,
       (select id from public.llm_models order by id limit 1)
from public.prompt_chains c
cross join (values
  (1, 'Brainstorm', 'You are a witty NYC food critic.', 'Give 3 vibe ideas for {{restaurant}} ({{cuisine}}).'),
  (2, 'Polish',     'You refine captions to one punchy line.', 'Polish the best idea into one caption: {{ideas}}')
) as s(ord, name, sys, tmpl)
where c.name = 'Vibe caption v1'
  and not exists (select 1 from public.prompt_chain_steps st where st.chain_id = c.id and st.step_order = s.ord);

insert into public.prompt_chain_mix (chain_id, weight, is_enabled, notes)
select c.id, 1.0, true, 'Default — 100% of traffic.'
from public.prompt_chains c
where c.name = 'Vibe caption v1'
  and not exists (select 1 from public.prompt_chain_mix m where m.chain_id = c.id);

-- Terms
insert into public.terms (term, definition, category)
values
  ('vibe',    'A short AI-generated impression of a restaurant''s atmosphere.', 'product'),
  ('net',     'Upvotes minus downvotes on a vibe.',                             'metric')
on conflict do nothing;

-- A couple of generation requests + responses so the read pages show data
insert into public.generation_requests (restaurant_id, chain_id, input, status)
select (select id from public.restaurants order by id limit 1),
       (select id from public.prompt_chains where name = 'Vibe caption v1'),
       'Generate a vibe for the first restaurant.',
       'completed'
where exists (select 1 from public.restaurants)
  and not exists (select 1 from public.generation_requests);

insert into public.llm_responses (request_id, model_id, prompt, response, prompt_tokens, completion_tokens, latency_ms)
select r.id,
       (select id from public.llm_models order by id limit 1),
       'Give 3 vibe ideas…',
       'Cozy, candle-lit, and quietly confident.',
       42, 18, 900
from public.generation_requests r
where not exists (select 1 from public.llm_responses);

-- Allowlists (the Columbia / Barnard sign-in domains this course uses)
insert into public.allowed_signup_domains (domain, note)
values
  ('columbia.edu', 'Columbia University'),
  ('barnard.edu',  'Barnard College')
on conflict (domain) do nothing;

insert into public.whitelisted_emails (email, note)
values ('alynatakahashi2006@gmail.com', 'Bootstrap admin')
on conflict (email) do nothing;

-- Clean up the helper so it doesn't linger in the schema.
drop function if exists public._grant_superadmin_all(regclass);

-- Sanity check — every table below should now exist with RLS enabled:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
