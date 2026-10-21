# Vibes Admin

An admin dashboard for the **NYC Vibes** database — the Supabase project behind the
AI restaurant "vibe check" creation + rating app. Built with Next.js 16, `@supabase/ssr`,
Tailwind v4 and Recharts, deployed on Vercel.

Every route is behind a **Google login wall** and only users with
`profiles.is_superadmin = TRUE` may enter.

## What it does

- **Overview** — creative live statistics: activity over time, net sentiment by cuisine,
  engagement distribution, top & most-controversial vibes, most active creators/voters.
- **AI Media** — full **CRUD** on `vibes` (the AI-generated vibe checks): create, read,
  update, delete.
- **Users** — **read** all `profiles` with per-user vibe/vote counts and a detail page.
- **Ratings** — **read** every `vibe_votes` row (upvotes/downvotes) with aggregates and
  up/down filtering.

## The data (shared with the main app)

| Table | Role |
|---|---|
| `profiles` | users (read) — gains an `is_superadmin` column |
| `vibes` | AI-generated media (create/read/update/delete) |
| `vibe_votes` | upvotes/downvotes, `vote` ∈ {1, -1} (read) |
| `restaurants` | referenced for joins/stats (read) |

## Setup

1. **Run the migration.** In Supabase → SQL Editor, run [`supabase/admin.sql`](supabase/admin.sql).
   It adds `profiles.is_superadmin`, the superadmin RLS policies (which let an admin read
   *all* rows and do CRUD on vibes), and bootstraps the first admin.
2. **Env vars.** Copy `.env.local.example` → `.env.local` and fill in the **same**
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the main app.
   Only the public anon key is used — security is enforced by RLS + the superadmin check,
   so no service-role key is needed.
3. `npm install && npm run dev` → http://localhost:3000

## How access is enforced (defense in depth)

1. **Edge (`proxy.ts`)** — any request to a non-public path without a session is
   redirected to `/login`.
2. **Server (`app/(admin)/layout.tsx`)** — `requireSuperadmin()` checks
   `is_superadmin`; logged-in non-admins get a "no access" screen and never see data.
3. **Mutations (`app/(admin)/media/actions.ts`)** — every create/update/delete calls
   `assertSuperadmin()` and throws otherwise.
4. **Database (RLS)** — Supabase policies only expose the full dataset / allow writes to a
   superadmin, so even a leaked anon key can't read or change anything.

## "Won't you lock yourself out?"

If the admin UI requires `is_superadmin = TRUE`, and the only way to set that field were
*through* the login-walled UI, nobody could ever get in. The way out is **direct database
access, outside the app**: the **Supabase SQL Editor** (and the service-role key) bypass
the app and its RLS entirely. We flip the first admin's flag by hand there:

```sql
update public.profiles set is_superadmin = true
where email = 'alynatakahashi2006@gmail.com';
```

(The account must have signed into the main app once so its `profiles` row exists.) After
that, the bootstrapped admin can manage everything from the UI.

## Deploying to Vercel

1. Push to a new GitHub repo, import it as a **new Vercel project**.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the project's
   Environment Variables.
3. In **Supabase → Authentication → URL Configuration**, and in the **Google Cloud OAuth
   client's Authorized redirect URIs**, add `https://<your-vercel-domain>/auth/callback`.
   (Skipping this is the usual reason Google login fails on a fresh domain.)
4. **Turn off Deployment Protection** (Vercel → Project → Settings → Deployment Protection)
   so the site opens in Incognito.
