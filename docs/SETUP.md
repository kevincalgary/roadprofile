# RoadProfile — Setup Guide

RoadProfile is a single Expo Router codebase that targets iPhone, Android, and web (as a responsive site and installable PWA) from one TypeScript source tree, backed by Supabase (Postgres, Auth, Storage, Realtime, Edge Functions).

## 1. Prerequisites

- Node.js 20+ and npm
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase` or see docs)
- Docker (for local Supabase via `supabase start`) — optional but recommended for development
- An Expo account + [EAS CLI](https://docs.expo.dev/eas/) for native builds (`npm install -g eas-cli`)
- Xcode (for iOS) / Android Studio (for Android) if you want to run native simulators

## 2. Install dependencies

```bash
npm install
```

## 3. Supabase project

### Local development (recommended to start)

```bash
supabase start          # boots local Postgres + Auth + Storage + Studio
supabase db reset       # applies every migration in supabase/migrations, then supabase/seed.sql
```

`supabase start` prints a local API URL and anon key — copy those into `.env` (see step 4).

### Hosted project (for staging/production)

1. Create a project at [supabase.com](https://supabase.com).
2. `supabase link --project-ref <your-project-ref>`
3. `supabase db push` to apply `supabase/migrations/*.sql` in order.
4. Do **not** run `supabase/seed.sql` against production — it creates fictional demo accounts and is for local/dev only.
5. In the dashboard: **Authentication → Providers**, enable Email, and optionally Apple/Google (see `docs/DEPLOYMENT.md` for OAuth redirect URLs).
6. In **Authentication → Email Templates**, confirm the "Confirm signup" and "Reset password" templates use your production domain.
7. Deploy edge functions:
   ```bash
   supabase functions deploy delete-account
   supabase functions deploy send-push
   ```
8. Set edge function secrets (service role key is provided automatically as `SUPABASE_SERVICE_ROLE_KEY`). `send-push` also needs a webhook secret so its public URL can't be called by anyone who finds it — generate one and set it:
   ```bash
   supabase secrets set SEND_PUSH_WEBHOOK_SECRET=$(openssl rand -hex 32)
   ```
9. Wire the `send-push` function as a **Database Webhook**: Dashboard → Database → Webhooks → New webhook → table `notifications`, event `INSERT`, target the deployed `send-push` function URL, and add an HTTP header `x-webhook-secret` set to the same value as `SEND_PUSH_WEBHOOK_SECRET`.

## 4. Environment variables

```bash
cp .env.example .env
```

Fill in:

- `EXPO_PUBLIC_SUPABASE_URL` — from `supabase start` output or your hosted project's API settings
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — same place
- `EXPO_PUBLIC_VIN_PROVIDER` — leave as `local` until an approved external VIN-decode provider is integrated (see `lib/services/vin-provider.ts`)

These are read at build/bundle time by Expo (`EXPO_PUBLIC_*` variables are inlined into the client bundle — never put secrets here).

## 5. Run the app

```bash
npm run web       # responsive website / PWA, in the browser
npm run ios       # requires Xcode + a simulator or the Expo Go / dev client
npm run android   # requires Android Studio + an emulator or the Expo Go / dev client
```

## 6. Type-check and test

```bash
npm run typecheck
npm test
```

## 7. Regenerating types from the live schema

Once a project is linked, keep `lib/types/database.ts` in sync with the schema:

```bash
supabase gen types typescript --linked > lib/types/database.generated.ts
```

(The hand-written types in `lib/types/database.ts` were authored to match `supabase/migrations/*.sql` exactly; reconcile the two if you regenerate.)

## Project layout

```
app/                    Expo Router routes (screens) — shared across iOS/Android/web
  (auth)/                Welcome, sign-in/up, onboarding
  (app)/                 Authenticated tab area (home, search, lists, messages, account, notifications)
  vehicle/, record/, u/, list/, moderation/   Public + moderator routes
components/             Reusable UI, nav, vehicle, feed, comments, lists, messages, moderation, brand components
lib/
  api/                   One module per domain — every Supabase query lives here, not in screens
  services/vin-provider.ts   Replaceable VIN-decode service interface
  types/database.ts      Hand-authored types mirroring the SQL schema
  vin.ts                 VIN normalization/validation (shared by client forms and documented for parity with DB constraints)
supabase/
  migrations/             Ordered SQL migrations (schema, RLS, triggers, RPCs)
  seed.sql                 Fictional demo data (local/dev only)
  functions/                Edge functions (delete-account, send-push)
__tests__/                Jest unit/component tests
docs/                     This file, deployment guide, launch checklist, legal placeholders
```
