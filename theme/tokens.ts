/**
 * VOS-inspired: one brand green, airy mint backgrounds, white cards; colour
 * comes mostly from activity tiles/illustrations. Immersive moments
 * (check-in, breathing, panic) use the dark "calm" palette.
 *
 * v2 "Depth": everything tappable stands on a solid ledge (a darker step of
 * its own colour) and sinks into it when pressed. See `Depth` and Raised.
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
    /** Solid 3D edge under raised white surfaces (cards, tiles, secondary buttons). */
    ledge: '#D5E5DB',
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
    /** 3D edge under green buttons and selected tiles. */
    ledge: '#1F5C3E',
  },
  /** The second brand colour: warm apricot, used sparingly (streak, wave echo, highlights). */
  brand: {
    main: '#E07A4F',
    soft: '#FBE7DC',
    ledge: '#B85B33',
    /** Text on apricot — white fails contrast (3.0:1). */
    on: '#3A1A0A',
  },
  danger: {
    panic: '#E0604F',
    soft: '#FBE4DF',
    /** 3D edge under panic-tinted tiles. */
    ledge: '#F2C9C1',
  },
  premium: {
    main: '#A8771F',
    soft: '#F7ECD6',
  },
  hairline: 'rgba(20,36,28,0.08)',
  /** Top rim light on raised faces and the stripe on progress fills. */
  highlight: 'rgba(255,255,255,0.75)',
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
  /** Ledge under the calm orb. */
  ledge: '#0E1A14',
} as const;

/** Pastel tile background + matching ink, one per activity family. */
export const Tints = {
  sage: { bg: '#E2EFE9', fg: '#3F7F6C', ledge: '#C6DDD2' },
  lavender: { bg: '#ECE7F8', fg: '#6E59B5', ledge: '#D5CCEE' },
  peach: { bg: '#FCE8DC', fg: '#B9643B', ledge: '#F2CDB6' },
  sky: { bg: '#E1EDF9', fg: '#3F72AA', ledge: '#C3D7EE' },
  butter: { bg: '#FAF0D2', fg: '#9A7623', ledge: '#EEDDA6' },
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
  /** Soft green ambient under a ledge; the ledge itself is a solid View (see Raised). */
  ambient: '0px 10px 24px rgba(31,77,54,0.10)',
  /** Rim light along the top inside edge of a raised face. */
  rim: 'inset 0px 2px 0px rgba(255,255,255,0.75)',
  rimOnColor: 'inset 0px 2px 0px rgba(255,255,255,0.22)',
  /** Sunken tracks: progress bar, unselected marks. */
  well: 'inset 0px 2px 3px rgba(20,36,28,0.10)',
} as const;

/**
 * Depth v2: height of the solid ledge under a raised element. Pressing moves
 * the face down by the same amount so it sinks into its ledge.
 */
export const Depth = {
  fill: 2,
  tile: 3,
  card: 4,
  button: 5,
  hero: 8,
} as const;

export const Radius = {
  card: 22,
  cardSmall: 16,
  chip: 12,
  /** 3D buttons: a rounded rect so the ledge reads as a solid block. */
  button: 18,
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
  button: 16,
  screenTitle: 24,
  cardTitle: 16,
  cardTitleSmall: 14,
  body: 15,
  bodySmall: 13,
  meta: 12,
  micro: 10,
} as const;

/**
 * Fraunces (soft serif) carries the voice: headings, numbers, quotes.
 * DM Sans does the quiet work: body, labels, buttons.
 */
export const FontFamily = {
  heading: 'Fraunces-SemiBold',
  headingBold: 'Fraunces-Bold',
  /** Accents: names, kickers, quotes — the human, handwritten-ish touch. */
  headingItalic: 'Fraunces-Italic',
  headingSemiBoldItalic: 'Fraunces-SemiBoldItalic',
  dmSansBold: 'DMSans-Bold',
  dmSansSemiBold: 'DMSans-SemiBold',
  dmSansMedium: 'DMSans-Medium',
  dmSansRegular: 'DMSans-Regular',
} as const;

export const HitSlop = { top: 12, bottom: 12, left: 12, right: 12 };
