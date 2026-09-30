export const Colors = {
  bg: {
    base: '#020810',
    elevated: '#0A1628',
  },
  surface: {
    card: '#132040',
    card2: '#182950',
  },
  text: {
    primary: '#F0F6FF',
    secondary: 'rgba(240,246,255,0.6)',
    tertiary: 'rgba(240,246,255,0.4)',
  },
  primary: {
    blue: '#2563EB',
    blueDeep: '#1741C4',
  },
  accent: {
    cyan: '#38BDF8',
  },
  danger: {
    panic: '#EF4444',
    panicLight: '#ff7a7a',
    panicDark: '#b91c1c',
  },
  premium: {
    gold: '#F59E0B',
    goldDeep: '#d97706',
    goldDark: '#b45309',
  },
  success: {
    green: '#10B981',
  },
  therapist: {
    purple: '#8B5CF6',
    purpleDeep: '#6d28d9',
  },
  hairline: 'rgba(240,246,255,0.08)',
} as const;

export const Gradients = {
  primary: ['#1741C4', '#2563EB'] as const,
  panic: ['#ff7a7a', '#EF4444', '#b91c1c'] as const,
  gold: ['#d97706', '#F59E0B'] as const,
  purple: ['#8B5CF6', '#6d28d9'] as const,
};

export const Radius = {
  card: 22,
  cardSmall: 18,
  chip: 14,
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
  hero: 30,
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
