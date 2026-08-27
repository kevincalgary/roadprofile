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

## What still needs a designer/production pass

The code-based logo/wordmark are a complete, usable identity for in-app rendering, but shipping to the App Store / Play Store requires exported static assets a design tool (Figma, Illustrator, etc.) produces more reliably than hand-computed PNG rasterization:

- [ ] 1024×1024 App Store icon (flatten `Logo.tsx`'s composition to a static PNG)
- [ ] Android adaptive-icon layers: foreground, background, monochrome (currently placeholder Expo defaults in `assets/`)
- [ ] Splash screen
- [ ] Favicon / web app icons at standard sizes (16, 32, 180, 192, 512)
- [ ] Notification icon (Android requires white-on-transparent monochrome art)
- [ ] Social share preview image (used as a fallback `og:image` for pages without a vehicle cover photo)

Until those are produced, `app.json` points at the default Expo-template placeholder images so builds don't fail — see `docs/LAUNCH_CHECKLIST.md`.
