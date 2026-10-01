/**
 * Calm, warm dark theme with a single accent. Panic keeps its own color so it
 * is always recognisable; Premium is marked with a muted amber, never a crown.
 */
export const Colors = {
  bg: {
    base: '#111315',
    elevated: '#171A1D',
  },
  surface: {
    card: '#1C2024',
    card2: '#252A2F',
  },
  text: {
    primary: '#F3F0EA',
    secondary: 'rgba(243,240,234,0.66)',
    tertiary: 'rgba(243,240,234,0.42)',
  },
  accent: {
    main: '#7CCFB6',
    soft: 'rgba(124,207,182,0.14)',
    /** Text and icons placed on top of the accent color. */
    on: '#0F1F1A',
  },
  danger: {
    panic: '#FF6A5C',
    soft: 'rgba(255,106,92,0.14)',
  },
  premium: {
    main: '#E3B871',
    soft: 'rgba(227,184,113,0.14)',
  },
  hairline: 'rgba(243,240,234,0.08)',
} as const;

export const Radius = {
  card: 18,
  cardSmall: 14,
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
