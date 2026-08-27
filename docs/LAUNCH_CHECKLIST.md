# RoadProfile — App Store / Google Play Launch Checklist

## Legal (do this first — everything else assumes it's done)

- [ ] Have a lawyer review and finalize `docs/legal/PRIVACY_POLICY.md`, `docs/legal/TERMS.md`, `docs/legal/COMMUNITY_GUIDELINES.md`, and the in-app disclaimer text. These are placeholders, not final legal documents.
- [ ] Confirm the minimum-age threshold used in `app/(auth)/sign-up.tsx` (currently 16) with counsel — it interacts with COPPA/GDPR-minor rules and varies by target market.
- [ ] Decide and document a DMCA / copyright-claim process for uploaded photos.
- [ ] Confirm data-retention and law-enforcement-request policies for VIN/vehicle history data.
- [ ] Publish the finalized legal docs at stable public URLs and update the links in `app/(auth)/sign-up.tsx` and any footer/settings screens.

## Branding assets

- [ ] Export the RP mark (`components/brand/Logo.tsx`) and RoadProfile wordmark (`components/brand/Wordmark.tsx`) as final production assets: 1024×1024 App Store icon, Android adaptive-icon foreground/background/monochrome layers, favicon, splash screen, notification icon (Android requires a white-on-transparent monochrome PNG).
- [ ] Replace every placeholder file in `assets/` with the final exports.
- [ ] Generate App Store screenshots (6.7", 6.5", 5.5" iPhone + iPad if supported) and Google Play screenshots (phone + tablet) showing real (seeded demo) content, not empty states.
- [ ] Write App Store / Play Store listing copy: short description, full description, keywords, "What's New."

## Apple App Store

- [ ] Apple Developer Program enrollment active.
- [ ] `eas build --platform ios --profile production` succeeds and `eas submit --platform ios` uploads to App Store Connect.
- [ ] Fill out App Store Connect's **App Privacy** questionnaire — RoadProfile collects: account email (not shown publicly), profile info (public), location (city/region text, not precise geolocation), user content (photos/documents/messages), and usage data if analytics are added. Declare each accurately.
- [ ] Sign in with Apple: if Google Sign-In is offered, Apple requires Sign in with Apple also be offered (App Store Review Guideline 4.8). Either ship both or neither.
- [ ] Age rating questionnaire: reflects UGC, messaging, and user-to-user interaction (typically 12+/17+ tier depending on moderation strength — discuss with legal/compliance).
- [ ] Verify camera/photo-library usage strings in `app.json` (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`) read naturally and match actual usage.
- [ ] Test the full delete-account flow on a real device before submitting — Apple requires in-app account deletion (Guideline 5.1.1(v)), which RoadProfile has (`app/(app)/account/delete-account.tsx`).
- [ ] Test VIN barcode scanning permission flow on a real device (simulator camera is unreliable for barcode detection).

## Google Play

- [ ] Google Play Console account active, app created.
- [ ] `eas build --platform android --profile production` succeeds and `eas submit --platform android` uploads.
- [ ] Complete the **Data Safety** section mirroring the Apple App Privacy answers above.
- [ ] Target API level meets Play's current minimum (Expo SDK 57 / React Native 0.86 should already satisfy this — confirm at submission time since Play's minimum rises periodically).
- [ ] Content rating questionnaire (IARC) — reflects UGC and messaging.
- [ ] Verify the `CAMERA` and `READ_MEDIA_IMAGES` permission declarations in `app.json` are justified in the Play Console's permissions declaration form.

## Backend readiness

- [ ] Production Supabase project provisioned (not the free/dev tier, if scale is expected).
- [ ] All migrations applied via `supabase db push` (never the dev `seed.sql`).
- [ ] RLS verified enabled on every table (every migration in `supabase/migrations/` calls `alter table ... enable row level security` — spot-check in the dashboard's Table Editor before launch).
- [ ] Storage bucket policies verified (`0013_storage_buckets.sql`) — confirm public buckets only expose what's intended.
- [ ] Edge functions (`delete-account`, `send-push`) deployed; `send-push` webhook wired.
- [ ] Apple/Google OAuth providers configured if offering social sign-in (see `docs/DEPLOYMENT.md`).
- [ ] Email templates (confirmation, password reset) customized with RoadProfile branding and correct redirect domain.
- [ ] Rate limiting reviewed: Supabase Auth's built-in rate limits cover sign-up/sign-in; consider adding a WAF/edge rate limit in front of Storage uploads if abuse is a concern.
- [ ] A moderator account exists in production (`user_roles.role = 'moderator'`, set via SQL/service role — never via client) before launch, so the report queue has an owner from day one.

## Pre-launch QA pass

- [ ] Full signup → onboarding → VIN search → create vehicle → add record → publish → comment → follow → message → notification loop tested on iOS, Android, and web.
- [ ] Accessibility pass: VoiceOver (iOS), TalkBack (Android), keyboard-only navigation (web), 200% text zoom (web), reduced-motion setting respected.
- [ ] Offline/slow-network pass: kill network mid-upload, confirm retry/recovery messaging appears instead of a silent failure.
- [ ] Moderator dashboard smoke test with the seeded demo report/VIN-correction/duplicate-request rows.
- [ ] Confirm demo/seed data is **not** present in the production database.

## Post-launch

- [ ] Monitor the report queue and VIN-correction queue daily for the first weeks.
- [ ] Set up error monitoring (see `docs/DEPLOYMENT.md`) before meaningful traffic arrives.
- [ ] Have a rollback plan for `supabase db push` (test migrations against a staging project first).
