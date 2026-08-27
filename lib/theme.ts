// Design tokens as plain JS values, for the places NativeWind classes can't
// reach (chart libraries, native StatusBar/SystemUI config, inline SVG).
// Keep these in sync with tailwind.config.js.

export const colors = {
  mint: '#62C58F',
  mintDark: '#3B8C60',
  mintLight: '#A7E5C3',
  charcoal: '#1A1D1F',
  asphalt: '#5C6470',
  asphaltLight: '#8A919B',
  warmWhite: '#FBF9F6',
  cardGray: '#F1EFEC',
  amber: '#B8791A',
  amberBg: '#FCEED9',
  danger: '#C43D3D',
  dangerBg: '#FBE4E4',
  dark: {
    bg: '#121415',
    surface: '#1C1F21',
    card: '#242829',
    border: '#33383B',
    text: '#F2F0EC',
    textSecondary: '#A7ADB3',
  },
} as const;

export interface Palette {
  background: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentText: string;
  amber: string;
  amberBg: string;
  danger: string;
  dangerBg: string;
}

export const light: Palette = {
  background: colors.warmWhite,
  surface: '#FFFFFF',
  card: colors.cardGray,
  border: '#E4E0D8',
  text: colors.charcoal,
  textSecondary: colors.asphalt,
  accent: colors.mint,
  accentText: '#0F2518',
  amber: colors.amber,
  amberBg: colors.amberBg,
  danger: colors.danger,
  dangerBg: colors.dangerBg,
};

export const dark: Palette = {
  background: colors.dark.bg,
  surface: colors.dark.surface,
  card: colors.dark.card,
  border: colors.dark.border,
  text: colors.dark.text,
  textSecondary: colors.dark.textSecondary,
  accent: colors.mint,
  accentText: '#0F2518',
  amber: '#E0A857',
  amberBg: '#3A2E14',
  danger: '#E37272',
  dangerBg: '#3A1B1B',
};

export type ThemePalette = typeof light;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  card: 20,
  cardLg: 28,
  pill: 999,
};

export const minTouchTarget = 44;

// Category → color mapping used for timeline filter chips and record badges.
// Chosen for AA contrast against both light card and dark card backgrounds.
export const categoryColors: Record<string, string> = {
  maintenance: '#3B8C60',
  repair: '#B8791A',
  inspection: '#3B6EA5',
  modification: '#7B4FA0',
  damage: '#C43D3D',
  recall: '#C43D3D',
  sale_auction: '#5C6470',
  ownership_experience: '#2C6A48',
  mileage_update: '#3B6EA5',
  general_history: '#5C6470',
  photo_sighting: '#4CAE79',
};
