# RoadProfile

A public, crowdsourced vehicle-history platform and automotive social network. Every vehicle has a permanent public profile tied to its complete VIN; owners, former owners, mechanics, dealers, and enthusiasts document its maintenance, repairs, mileage, modifications, and history so future buyers can see the whole story.

One Expo Router + TypeScript codebase targets iPhone, Android, and the web (responsive site + installable PWA), backed by Supabase (Postgres, Auth, Storage, Realtime, Edge Functions).

## Quick start

```bash
npm install
cp .env.example .env   # fill in Supabase URL/anon key — see docs/SETUP.md
supabase start && supabase db reset   # local Postgres + apply migrations + seed demo data
npm run web             # or npm run ios / npm run android
```

Full setup instructions: **[docs/SETUP.md](docs/SETUP.md)**. Deployment (EAS builds, web hosting, edge functions): **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**. Store submission: **[docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md)**.

## What's implemented

- **Auth & onboarding** — email sign-up/verify/reset, persistent sessions, Apple/Google sign-in wiring (needs provider config), username/profile setup, minimum-age + ToS/Privacy/Guidelines acceptance.
- **VIN search & creation** — exact/partial VIN, year/make/model/trim/user/list/keyword search, camera barcode scan with mandatory verify-before-submit, community vehicle-profile creation when no record exists, moderated short-VIN exception path.
- **Vehicle profiles** — cover photo, spec badges (community-submitted vs. verified), mileage graph, contributor/follower/post counts, category-filtered timeline, buyer-facing history summary with PDF export.
- **Records** — all 11 contribution categories, draft/preview/publish, 1–5 photos + redaction-guided document attachments with EXIF/GPS stripping, automatic revision history, mileage-inconsistency flagging.
- **Feed** — Following/Discover tabs, pagination, pull-to-refresh, skeletons, empty/error states.
- **Comments & replies**, mentions, notifications for both.
- **Lists** — My/Following/Explore, collaborators, public/private, add/remove vehicles.
- **Messaging** — one-to-one realtime chat, message requests, mute/delete/block, shared-object messages.
- **Notifications** — all 9 types, New/Earlier grouping, deep links, push registration + send-push edge function.
- **Corrections & moderation** — VIN/spec correction workflow, duplicate-vehicle merge tool, report queue, warn/suspend/ban, content removal with history, audit log — all gated behind a server-enforced moderator role the client can never self-assign.
- **Data export & account deletion**, with public contributions anonymized-but-retained rather than deleted (see `docs/legal/PRIVACY_POLICY.md` §7).
- **Full RLS-protected Postgres schema** (`supabase/migrations/`) covering every table in the spec, plus SECURITY DEFINER RPCs for every moderator/account action a client shouldn't be trusted to run directly.

## Known gaps / next steps

Documented explicitly rather than silently shipped:

- **App-store-ready icon/splash assets** — the RP mark and wordmark are implemented as real components (`components/brand/`), not yet exported as static PNGs at required sizes. See `docs/BRANDING.md`.
- **Appeals workflow** — the moderation dashboard covers reports, VIN corrections, duplicates, user actions, removal history, and the audit log; a structured appeals queue (distinct from re-reporting) wasn't in the data model this build followed and would need a small schema addition.
- **External VIN-decode provider** — `lib/services/vin-provider.ts` defines the swappable interface and ships a local-only fallback that never guesses specs, exactly as specified; no provider is wired in since none was licensed.
- **Legal documents** — `docs/legal/*.md` are structured, feature-accurate drafts, explicitly flagged as requiring professional legal review before publication.
- **Native builds** — this environment can build/typecheck/test the app and produce a working web export, but can't produce signed iOS/Android binaries; `docs/DEPLOYMENT.md` covers the EAS Build steps to do that from a machine with Apple/Google credentials.

## Tech stack

Expo Router (universal iOS/Android/web) · TypeScript · NativeWind (Tailwind for RN) · Supabase (Postgres + RLS, Auth, Storage, Realtime, Edge Functions) · Jest + Testing Library

See `docs/SETUP.md` for the full project layout.
