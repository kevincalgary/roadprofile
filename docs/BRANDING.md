# RoadProfile — Brand & Design System

## Identity concept

RoadProfile's mark is built around two ideas: the **road** (a vehicle's history is a route, documented mile by mile) and **documentation** (a permanent, legible record). The wordmark pairs "Road" in charcoal with "Profile" in mint, sitting on a short dashed underline that reads as a lane marker. The app-icon concept ("RP") is a rounded-square charcoal badge with the mint monogram and a single diagonal mint stripe evoking a road shoulder line.

Both are implemented as code, not static images, so they render crisply at any size and adapt to light/dark themes:

- `components/brand/Wordmark.tsx`
- `components/brand/Logo.tsx`

Neither references, copies, or resembles any other automotive platform's name or logo.

## Color tokens

Defined once in `lib/theme.ts` (plain JS values, for native chart/SVG use) and mirrored in `tailwind.config.js` (for NativeWind utility classes) — keep the two in sync if either changes.

| Token | Light | Dark | Use |
|---|---|---|---|
| Mint accent | `#62C58F` | `#62C58F` | Primary actions, active states, brand accent |
| Charcoal (primary text) | `#1A1D1F` | — | Primary text (light theme) |
| Asphalt (secondary text) | `#5C6470` | — | Secondary text, icons, metadata |
| Warm white (background) | `#FBF9F6` | — | App background (light theme) |
| Card gray | `#F1EFEC` | — | Cards, controls, skeletons (light theme) |
| Amber | `#B8791A` on `#FCEED9` | `#E0A857` on `#3A2E14` | Unverified/disputed information, warnings |
| Danger red | `#C43D3D` on `#FBE4E4` | `#E37272` on `#3A1B1B` | Destructive actions, errors |
| Dark background | — | `#121415` | App background (dark theme) |
| Dark surface/card | — | `#1C1F21` / `#242829` | Surfaces, cards (dark theme) |

Contrast: mint-on-charcoal and charcoal/asphalt-on-warm-white were chosen to clear WCAG 2.2 AA for normal text at the sizes used; re-verify with a contrast checker if you adjust any of these values, especially the amber and danger pairs which carry meaning (unverified / destructive) and must stay legible.

## Type & shape

- Native/system sans-serif throughout (`fontFamily: ['System']` in `tailwind.config.js`) for maximum legibility and Dynamic Type / font-scaling support without bundling custom font files.
- Cards: `rounded-2xl` (20px). Buttons: fully pill-shaped (`rounded-pill` / 999px radius). Circular controls (avatars, icon buttons, the mobile nav's search button) are true circles sized to at least 44×44pt (`lib/theme.ts`'s `minTouchTarget`).

## Category color coding

Vehicle-record categories (maintenance, repair, damage, etc.) each get a consistent color used for timeline filter chips and badges — see `categoryColors` in `lib/theme.ts` and `components/vehicle/TimelineFilterBar.tsx`.

## Exported static assets

`scripts/generate-brand-assets.js` renders the assets below from the exact same geometry as `Logo.tsx` (charcoal rounded badge, clipped diagonal mint stripe, centered "RP") via SVG → `sharp`, rather than a hand-drawn approximation. Run `node scripts/generate-brand-assets.js` to regenerate all of them after changing the mark's colors/proportions in `Logo.tsx` — keep the two in sync manually, the same way `lib/theme.ts` and `tailwind.config.js` already have to be.

- [x] **1024×1024 App Store icon** (`assets/icon.png`) — opaque, full-bleed square, no pre-rounding (iOS applies its own corner mask).
- [x] **Android adaptive-icon layers** (`assets/android-icon-{background,foreground,monochrome}.png`) — the identity mark ("RP") lives in the foreground/monochrome layers only, sized and centered to survive a circular launcher mask (Google's ~66%-of-canvas safe-zone guideline, verified by simulating a circular crop); the background layer carries the charcoal fill + stripe, since a decorative background element doesn't need mask-safety the way the identity mark does.
- [x] **Splash screen** (`assets/splash-icon.png`) — the full rounded badge on a transparent surround, wired up via the `expo-splash-screen` plugin config in `app.json` (light `backgroundColor: #FBF9F6`, dark `#121415`, matching `lib/theme.ts`). A thin mint stroke was added around the badge's rounded edge specifically for dark mode — without it, the badge's charcoal fill (`#1A1D1F`) nearly disappears against the app's near-black dark background (`#121415`); with it, the badge is legible in both themes from one asset.
- [x] **Notification icon** (`assets/android-icon-monochrome.png`, already wired in `app.json`'s `expo-notifications` plugin config) — same white-on-transparent "RP" silhouette as the adaptive-icon monochrome layer; one asset satisfies both requirements.
- [x] **Favicon** (`assets/favicon.png`) — same rounded badge as the splash icon, rasterized at 512×512; modern browsers scale a single PNG favicon down cleanly, so this covers the classic-favicon through high-DPI range without needing a multi-file `.ico`.
- [ ] **Full web/PWA icon manifest set at each standard size** (16, 32, 180 apple-touch-icon, 192/512 PWA) — Expo's `web.favicon` config field only accepts one file; a real multi-size set needs either per-size files wired into a custom `public/` output or a PWA manifest generator, which wasn't attempted here.
- [ ] **Social share preview image** (`og:image` fallback) — needs locating/adding the actual Open Graph meta-tag hook for Expo Router's web output (likely a root `app/+html.tsx`), which wasn't investigated in this pass.

These are still a faithful **placeholder** upgrade over the generic Expo-template images that were there before, not a substitute for a real design-tool pass (see the top of this doc) — in particular the "RP" glyph is set in a system sans fallback available on the machine that rendered it (Liberation Sans), not whatever font a real brand pass would choose, and the exact stripe/badge proportions are a literal reproduction of `Logo.tsx`'s current values, unreviewed by a designer.
