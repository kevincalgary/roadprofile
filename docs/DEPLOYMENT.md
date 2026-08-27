# RoadProfile — Deployment Guide

## Web (responsive site + installable PWA)

RoadProfile's web target is a static/single-page Expo Router export.

```bash
npx expo export --platform web
```

This produces `dist/`, a static bundle you can host on any static host (Vercel, Netlify, Cloudflare Pages, S3+CloudFront, etc.). Point your host at `dist/` as the build output directory, with `npx expo export --platform web` as the build command.

**PWA installability**: `app.json`'s `web` block sets `name`, `shortName`, `themeColor`, and `backgroundColor`, which Expo uses to generate the web manifest. Verify after export that `dist/manifest.json` (or equivalent) references the RoadProfile icon assets before shipping — swap in the final exported app-icon PNGs (see `docs/BRANDING.md`).

**SEO / shareable URLs**: Vehicle, record, list, and profile pages set per-page `<title>`/`<meta description>`/Open Graph tags via `expo-router/head` (see `app/vehicle/[vin].tsx`, `app/record/[id].tsx`, `app/list/[id].tsx`, `app/u/[username].tsx`). Confirm your host serves `index.html` for all routes (SPA fallback / rewrite rule) so deep links like `/vehicle/1HGCM82633A004352` load correctly on refresh.

## iOS and Android (EAS Build)

RoadProfile uses [EAS Build](https://docs.expo.dev/build/introduction/) rather than local Xcode/Gradle builds for release artifacts.

```bash
npm install -g eas-cli
eas login
eas build:configure
```

This generates `eas.json`. A minimal production profile:

```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

Build:

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

Submit:

```bash
eas submit --platform ios
eas submit --platform android
```

### Required before your first build

- Set `expo.ios.bundleIdentifier` and `expo.android.package` in `app.json` to your real reverse-DNS identifiers (placeholders are currently `ca.truenorthernlabs.roadprofile`).
- Generate final app icon / splash / adaptive-icon / notification-icon PNGs from the RP mark (`components/brand/Logo.tsx`) at the required sizes and replace the placeholder files in `assets/`.
- Push notifications: run `eas credentials` to set up an Apple Push key and Firebase Cloud Messaging credentials — required for `expo-notifications` to deliver on real devices.
- Set production `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` as EAS build secrets (`eas secret:create`) or in `eas.json`'s `env` block — never commit real keys.

## Apple / Google sign-in

Both are wired client-side via `lib/api/auth.ts`'s `signInWithOAuth`, but require provider configuration before they'll work:

1. Supabase Dashboard → Authentication → Providers → enable Apple and/or Google.
2. Follow Supabase's provider-specific setup (Apple: Services ID + private key; Google: OAuth client ID/secret).
3. Add the redirect URL Supabase gives you to each provider's allowed-redirects list.
4. Add your app's custom scheme (`roadprofile://`) as an allowed redirect in Supabase's Auth settings (**Authentication → URL Configuration → Redirect URLs**).

Until configured, `signInWithOAuth` will surface Supabase's own "provider not enabled" error to the user — sign-in with email/password keeps working regardless.

## Database migrations in production

```bash
supabase link --project-ref <ref>
supabase db push
```

Never run `supabase/seed.sql` against a production project.

## Edge functions

```bash
supabase functions deploy delete-account
supabase functions deploy send-push
```

Wire `send-push` as a Database Webhook on `public.notifications` INSERT (see `docs/SETUP.md` step 3).

## Monitoring / error reporting

No error-monitoring SDK is wired in by default (to avoid picking a vendor for you). Recommended: add [Sentry's Expo SDK](https://docs.sentry.io/platforms/react-native/manual-setup/expo/) — it hooks into `app/_layout.tsx` in a few lines and needs no other code changes since all data access already funnels through `lib/api/*`, which is where you'd add breadcrumbs/`Sentry.captureException` in each module's catch paths if you want request-level detail.
