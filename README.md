# OARS UMD Dashboard for Saltwater Intrusion

This repository contains the planning documents and a local demonstration dashboard for the OARS Mid-Atlantic Tool.

## Run the dashboard locally

Requirements: Node.js 22.13 or newer and pnpm.

```powershell
cd dashboard
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser. Keep the terminal running while using the dashboard. Stop the server with `Ctrl+C`.

## Current prototype scope

- Public OARS landing page
- Public registration for landowners, agencies, and Extension Officers with administrator approval
- Role-based access for landowners, agencies, Extension Officers, and administrators
- Extension Officer portfolios, assisted assessment workflow, and program-application tracking
- Audited account approval, assignment, deactivation, reactivation, and administrator invitations
- Property location, land type, and user relationship
- Demonstration saltwater intrusion scorecard
- Ranked landowner goals
- Explained program and practice recommendations
- Searchable and comparable resource catalog
- Demonstration GIS layer controls
- Printable assessment results

The prototype uses synthetic information and does not persist personal or property data. OARS must approve the scoring methodology, recommendation rules, GIS sources, authentication, and privacy requirements before production use.

## Supabase setup

Copy `dashboard/.env.example` to `dashboard/.env.local`, add the project URL,
publishable key, and server-only secret key, then apply the SQL migration in
`dashboard/supabase/migrations`. Public users verify their email and remain
pending until an OARS administrator approves the account.

For a local Supabase environment with Docker Desktop running:

```powershell
cd dashboard
supabase start
supabase db reset --local --no-seed
```

Create the first administrator in Supabase Auth, then set the matching
`public.profiles` row to `role = 'admin'` and `status = 'active'`. For a local
demonstration environment, `pnpm seed:demo` creates the four role fixtures after
the migration is applied. Do not run demo seeding against production.

The server-only `SUPABASE_SECRET_KEY` is used for approval, invitation,
assignment, and account lifecycle operations. It must never be exposed to the
browser.

### Google sign-in and registration

OARS supports Google as an alternative to email/password authentication. Public
accounts created with Google still remain pending until an administrator approves
them.

1. In Google Cloud Console, configure the OAuth consent screen and create a Web
   application OAuth client.
2. Add the Supabase callback URL shown under **Authentication > Providers >
   Google** as an authorized redirect URI in Google Cloud.
3. In Supabase, open **Authentication > Providers > Google**, enable it, and enter
   the Google client ID and client secret.
4. Under **Authentication > URL Configuration**, add the local callback
   `http://localhost:3000/auth/callback` and the equivalent production callback
   URL to the redirect allow list.

Keep the Google client secret in the Supabase dashboard; do not add it to the
browser environment or commit it to this repository.

## Verification

```powershell
cd dashboard
pnpm test
pnpm lint
pnpm build
```

See [the dashboard development plan](docs/dashboard-development-plan.md) for the documented requirements, phases, decisions, and acceptance criteria.

## Netlify deployment

The app uses Next.js with server-side API routes. The repository-root
`netlify.toml` sets base `dashboard`, build command `pnpm build`, and publish
folder `.next` (relative to the base). Netlify automatically installs its Next.js
adapter. Do not publish the repository root, use `dist`, or add a static SPA
redirect: account management and OAuth callbacks require the server runtime.

Set these variables in Netlify **Project configuration → Environment variables**:

| Variable | Scope | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Builds and Functions | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Builds and Functions | Public publishable key |
| `SUPABASE_SECRET_KEY` | Functions only | A current, unexposed secret key |

On plans without per-scope controls, set the secret without any public prefix;
the `server-only` module prevents frontend imports. Never put the secret in
`next.config.ts`'s `env` field, `NEXT_PUBLIC_*`, or `VITE_*` variables. The app
does not need a JWKS URL environment variable. Public variables are embedded at
build time, so trigger a new deployment after changing them.

For this site, set Supabase's Site URL to `https://oars-umd.netlify.app` and allow
`https://oars-umd.netlify.app/auth/callback` and
`http://localhost:3000/auth/callback` as authentication redirect URLs. Review
and apply the existing `dashboard/supabase/migrations` through your current
Supabase migration workflow; do not reset an existing remote database. The
separate `oars_test_*` migration from the older local prototype is not used by
this branch.

A Netlify 404 cannot be fixed with Supabase credentials alone: this runtime fix
must first be merged into Netlify's configured deployment branch (`main`).
