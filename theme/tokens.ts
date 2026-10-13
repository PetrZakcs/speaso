/**
 * VOS-inspired: one brand green, airy mint backgrounds, white cards; colour
 * comes mostly from activity tiles/illustrations. Immersive moments
 * (check-in, breathing, panic) use the dark "calm" palette.
 */
export const Colors = {
  bg: {
    base: '#F2F7F4',
    elevated: '#FFFFFF',
  },
  surface: {
    card: '#FFFFFF',
    card2: '#E8F1EC',
    /** Pale mint for plan cards and highlighted blocks. */
    mint: '#E4F2EA',
  },
  text: {
    primary: '#14241C',
    secondary: 'rgba(20,36,28,0.62)',
    tertiary: 'rgba(20,36,28,0.40)',
  },
  accent: {
    main: '#2E7D57',
    soft: '#DCEFE4',
    /** Text and icons placed on top of the accent color. */
    on: '#FFFFFF',
  },
  danger: {
    panic: '#E0604F',
    soft: '#FBE4DF',
  },
  premium: {
    main: '#A8771F',
    soft: '#F7ECD6',
  },
  hairline: 'rgba(20,36,28,0.08)',
} as const;

/** Dark green palette for immersive, calming screens. */
export const Calm = {
  bgFrom: '#1F3B2D',
  bgTo: '#0E1A14',
  card: 'rgba(255,255,255,0.07)',
  text: '#EEF6F1',
  muted: 'rgba(238,246,241,0.62)',
  accent: '#74C69A',
  track: 'rgba(255,255,255,0.12)',
} as const;

/** Pastel tile background + matching ink, one per activity family. */
export const Tints = {
  sage: { bg: '#E2EFE9', fg: '#3F7F6C' },
  lavender: { bg: '#ECE7F8', fg: '#6E59B5' },
  peach: { bg: '#FCE8DC', fg: '#B9643B' },
  sky: { bg: '#E1EDF9', fg: '#3F72AA' },
  butter: { bg: '#FAF0D2', fg: '#9A7623' },
} as const;
export type TintName = keyof typeof Tints;

/** Soft card elevation for the light theme. */
export const Shadow = {
  card: {
    shadowColor: '#1F4D36',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const Radius = {
  card: 22,
  cardSmall: 16,
  chip: 12,
  pill: 999,
  sheet: 30,
} as const;

export const Spacing = {
  screenH: 20,
  cardPad: 18,
  cardPadLarge: 22,
  gap: 12,
  sectionGap: 16,
} as const;

export const FontSize = {
  hero: 32,
  screenTitle: 24,
  cardTitle: 16,
  cardTitleSmall: 14,
  body: 15,
  bodySmall: 13,
  meta: 12,
  micro: 10,
} as const;

export const FontFamily = {
  soraBold: 'Sora-Bold',
  /** Big, confident screen titles. */
  display: 'Sora-Bold',
  soraExtraBold: 'Sora-ExtraBold',
  soraSemiBold: 'Sora-SemiBold',
  soraRegular: 'Sora-Regular',
  dmSansBold: 'DMSans-Bold',
  dmSansSemiBold: 'DMSans-SemiBold',
  dmSansMedium: 'DMSans-Medium',
  dmSansRegular: 'DMSans-Regular',
} as const;

export const HitSlop = { top: 12, bottom: 12, left: 12, right: 12 };
