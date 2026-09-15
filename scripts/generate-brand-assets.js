#!/usr/bin/env node
/**
 * Generates static PNG brand assets from the same geometry as
 * components/brand/Logo.tsx, so the exported files are a faithful
 * reproduction of the in-app mark rather than a hand-drawn approximation.
 *
 * This is a stand-in for a real design-tool export (see docs/BRANDING.md,
 * which explicitly flags these as needing a professional pass before
 * shipping) — good enough to replace the generic Expo template placeholders
 * currently in assets/, not a substitute for that pass.
 *
 * Usage: node scripts/generate-brand-assets.js
 */
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'assets');

const CHARCOAL = '#1A1D1F';
const MINT = '#62C58F';
const WHITE = '#FFFFFF';
const FONT = 'Liberation Sans, DejaVu Sans, sans-serif';

/**
 * The diagonal stripe from Logo.tsx, reproduced exactly: an unrotated rect
 * at (left, top) sized (1.4*size, 0.22*size), rotated -35deg about its own
 * center — matching CSS/RN's default transform-origin.
 */
function stripe(size) {
  const w = size * 1.4;
  const h = size * 0.22;
  const x = -size * 0.2;
  const y = size * 0.62;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${MINT}" transform="rotate(-35 ${cx} ${cy})" />`;
}

function rpText(size, fontScale) {
  const fontSize = size * fontScale;
  return `<text x="${size / 2}" y="${size / 2}" font-family="${FONT}" font-weight="bold" font-size="${fontSize}" fill="${WHITE}" text-anchor="middle" dominant-baseline="central">RP</text>`;
}

/**
 * Full badge: rounded charcoal square + clipped stripe + centered "RP".
 * Matches Logo.tsx's on-screen look (used where the badge itself, not an
 * OS-composited icon, is what's displayed). When floating on a transparent
 * surround (splash/favicon use), a thin mint-400 stroke is added around the
 * rounded edge -- without it the charcoal badge nearly disappears against
 * the app's own near-black dark-mode background (#121415 vs. the badge's
 * #1A1D1F), which read as unfinished rather than intentional.
 */
function badgeSvg(size, { rounded = true, includeText = true, transparentOutsideRounding = false } = {}) {
  const rx = rounded ? size * 0.28 : 0;
  const strokeWidth = size * 0.012;
  const bgClip = transparentOutsideRounding
    ? `<clipPath id="badge"><rect x="0" y="0" width="${size}" height="${size}" rx="${rx}" /></clipPath>`
    : '';
  const bg = transparentOutsideRounding
    ? ''
    : `<rect x="0" y="0" width="${size}" height="${size}" rx="${rx}" fill="${CHARCOAL}" />`;
  const clipAttr = transparentOutsideRounding ? 'clip-path="url(#badge)"' : '';
  const outline = transparentOutsideRounding
    ? `<rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${size - strokeWidth}" height="${size - strokeWidth}" rx="${rx}" fill="none" stroke="${MINT}" stroke-width="${strokeWidth}" stroke-opacity="0.55" />`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>${bgClip}</defs>
    ${transparentOutsideRounding ? `<rect x="0" y="0" width="${size}" height="${size}" rx="${rx}" fill="${CHARCOAL}" clip-path="url(#badge)" />` : bg}
    <g ${clipAttr}>${stripe(size)}</g>
    ${outline}
    ${includeText ? rpText(size, 0.42) : ''}
  </svg>`;
}

/** Android adaptive-icon background layer: charcoal fill + stripe, full bleed, no text (the identity mark lives in the foreground layer instead — keeps it legible regardless of OEM mask shape). */
function adaptiveBackgroundSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect x="0" y="0" width="${size}" height="${size}" fill="${CHARCOAL}" />
    ${stripe(size)}
  </svg>`;
}

/** Android adaptive-icon foreground / monochrome layer: white "RP" only, on transparent, sized and centered to survive any launcher mask shape (Google's ~66%-of-canvas safe-zone guideline). */
function adaptiveForegroundSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${rpText(size, 0.3)}
  </svg>`;
}

async function render(svg, outPath, size) {
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log('wrote', path.relative(process.cwd(), outPath));
}

async function main() {
  // App icon: opaque, full-bleed square (no pre-rounding/transparency --
  // iOS applies its own corner mask; see docs/BRANDING.md).
  await render(badgeSvg(1024, { rounded: false, includeText: true, transparentOutsideRounding: false }), path.join(OUT, 'icon.png'), 1024);

  // Android adaptive icon: two full-bleed opaque/transparent layers the OS composites and masks itself.
  await render(adaptiveBackgroundSvg(1024), path.join(OUT, 'android-icon-background.png'), 1024);
  await render(adaptiveForegroundSvg(1024), path.join(OUT, 'android-icon-foreground.png'), 1024);
  // Android 13+ themed/monochrome icon -- must be a single-color silhouette on transparent.
  // Reused as-is for the status-bar notification icon too (see app.json's expo-notifications plugin config).
  await render(adaptiveForegroundSvg(1024), path.join(OUT, 'android-icon-monochrome.png'), 1024);

  // Splash: the full rounded badge, transparent outside it, so it reads as a mark floating on the splash backgroundColor rather than a hard square tile.
  await render(badgeSvg(1024, { rounded: true, includeText: true, transparentOutsideRounding: true }), path.join(OUT, 'splash-icon.png'), 1024);

  // Favicon: same rounded badge, smaller raster (browsers upscale/downscale fine; this covers the classic-favicon through high-DPI/PWA range in one file).
  await render(badgeSvg(1024, { rounded: true, includeText: true, transparentOutsideRounding: true }), path.join(OUT, 'favicon.png'), 512);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
