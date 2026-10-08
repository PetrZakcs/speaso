/**
 * Light, warm pastel theme (inspired by wellbeing apps like VOS): cream
 * background, white cards with soft shadows, one sage accent for actions and
 * pastel tints per activity type. Panic keeps its own coral.
 */
export const Colors = {
  bg: {
    base: '#F7F3EE',
    elevated: '#FFFFFF',
  },
  surface: {
    card: '#FFFFFF',
    card2: '#F1ECE5',
  },
  text: {
    primary: '#1F2430',
    secondary: 'rgba(31,36,48,0.64)',
    tertiary: 'rgba(31,36,48,0.42)',
  },
  accent: {
    main: '#3F7F6C',
    soft: '#E2EFE9',
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
  hairline: 'rgba(31,36,48,0.08)',
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
    shadowColor: '#5B4A36',
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
  soraExtraBold: 'Sora-ExtraBold',
  soraSemiBold: 'Sora-SemiBold',
  soraRegular: 'Sora-Regular',
  dmSansBold: 'DMSans-Bold',
  dmSansSemiBold: 'DMSans-SemiBold',
  dmSansMedium: 'DMSans-Medium',
  dmSansRegular: 'DMSans-Regular',
} as const;

export const HitSlop = { top: 12, bottom: 12, left: 12, right: 12 };
