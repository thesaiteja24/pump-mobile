import type { TextStyle, ViewStyle } from 'react-native'

export type ThemePreference = 'dark' | 'light' | 'system'

export const primitives = {
  base: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },
  blue: {
    500: '#3B82F6',
    600: '#2563EB',
  },
  red: {
    500: '#EF4444',
    600: '#DC2626',
  },
  amber: {
    500: '#F59E0B',
    600: '#D97706',
  },
  green: {
    500: '#10B981',
    600: '#059669',
  },
} as const

export const colorModes = {
  light: {
    base: primitives.base,
    text: {
      primary: primitives.neutral[950],
      secondary: primitives.neutral[600],
      muted: primitives.neutral[400],
      inverse: primitives.base.white,
      accent: primitives.blue[600],
      danger: primitives.red[600],
      warning: primitives.amber[600],
      success: primitives.green[600],
      info: primitives.blue[600],
    },
    background: {
      primary: '#F7F7F8',
      secondary: primitives.neutral[100],
      inverse: primitives.neutral[950],
    },
    surface: {
      primary: primitives.base.white,
      secondary: primitives.neutral[100],
      tertiary: primitives.neutral[200],
      inverse: primitives.neutral[950],
    },
    border: {
      primary: primitives.neutral[200],
      secondary: primitives.neutral[100],
      strong: primitives.neutral[400],
    },
    foreground: {
      primary: primitives.neutral[950],
      secondary: primitives.neutral[600],
      muted: primitives.neutral[400],
      inverse: primitives.base.white,
      accent: primitives.blue[600],
      danger: primitives.red[600],
      warning: primitives.amber[600],
      success: primitives.green[600],
      info: primitives.blue[600],
    },
  },
  dark: {
    base: primitives.base,
    text: {
      primary: primitives.base.white,
      secondary: primitives.neutral[400],
      muted: primitives.neutral[600],
      inverse: primitives.neutral[950],
      accent: primitives.blue[500],
      danger: primitives.red[500],
      warning: primitives.amber[500],
      success: primitives.green[500],
      info: primitives.blue[500],
    },
    background: {
      primary: primitives.base.black,
      secondary: primitives.neutral[950],
      inverse: primitives.base.white,
    },
    surface: {
      primary: primitives.neutral[900],
      secondary: primitives.neutral[800],
      tertiary: primitives.neutral[700],
      inverse: primitives.base.white,
    },
    border: {
      primary: primitives.neutral[800],
      secondary: primitives.neutral[900],
      strong: primitives.neutral[600],
    },
    foreground: {
      primary: primitives.base.white,
      secondary: primitives.neutral[400],
      muted: primitives.neutral[600],
      inverse: primitives.neutral[950],
      accent: primitives.blue[500],
      danger: primitives.red[500],
      warning: primitives.amber[500],
      success: primitives.green[500],
      info: primitives.blue[500],
    },
  },
} as const

export const spacing = {
  none: 0,
  xxs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  tabBar: 110,
} as const

export const radius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
  full: 9999,
} as const

export const typography = {
  fontFamily: {
    inter: 'Inter_400Regular',
    interMedium: 'Inter_500Medium',
    interSemiBold: 'Inter_600SemiBold',
    interBold: 'Inter_700Bold',
  },
  fontSize: {
    captionSm: 8,
    caption: 12,
    bodySm: 14,
    body: 16,
    bodyLg: 18,
    displaySm: 20,
    displayMd: 24,
    displayXl: 32,
  },
  lineHeight: {
    12: 12,
    16: 16,
    20: 20,
    24: 24,
    28: 28,
    32: 32,
    40: 40,
  },
  displayXl: { fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 40 } satisfies TextStyle,
  displayMd: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 32 } satisfies TextStyle,
  displaySm: { fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 28 } satisfies TextStyle,
  bodyLg: { fontFamily: 'Inter_500Medium', fontSize: 18, lineHeight: 24 } satisfies TextStyle,
  body: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 } satisfies TextStyle,
  bodyStrong: { fontFamily: 'Inter_500Medium', fontSize: 16, lineHeight: 20 } satisfies TextStyle,
  bodySm: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 } satisfies TextStyle,
  bodySmStrong: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 16 } satisfies TextStyle,
  caption: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 20 } satisfies TextStyle,
  captionSm: { fontFamily: 'Inter_400Regular', fontSize: 8, lineHeight: 12 } satisfies TextStyle,
} as const

export const effects = {
  none: {
    shadowColor: primitives.base.transparent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: primitives.base.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: primitives.base.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  modal: {
    shadowColor: primitives.base.black,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>

export function createLegacyColors(mode: typeof colorModes.light | typeof colorModes.dark) {
  return {
    background: mode.background.primary,
    card: mode.surface.primary,
    input: mode.surface.secondary,
    text: mode.text.primary,
    textSecondary: mode.text.secondary,
    textMuted: mode.text.muted,
    border: mode.border.primary,
    borderStrong: mode.border.strong,
    accent: mode.foreground.accent,
    danger: mode.foreground.danger,
    warning: mode.foreground.warning,
    success: mode.foreground.success,
    info: mode.foreground.info,
    white: mode.base.white,
    black: mode.base.black,
  }
}

export type ThemeColorModes = typeof colorModes.light | typeof colorModes.dark
export type ThemeLegacyColors = ReturnType<typeof createLegacyColors>
export type ThemeSpacing = typeof spacing
export type ThemeRadius = typeof radius
export type ThemeTypography = typeof typography
export type ThemeEffects = typeof effects
