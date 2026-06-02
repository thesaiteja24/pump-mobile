export type ThemePreference = 'dark' | 'light' | 'system'

// ─── Colors ───────────────────────────────────────────────────────────────────

export const COLORS = {
  light: {
    background: '#F4F4F5',
    card: '#FFFFFF',
    input: '#E4E4E7',
    text: '#09090B',
    textSecondary: '#71717A',
    textMuted: '#A1A1AA',
    border: '#E4E4E7',
    borderStrong: '#A1A1AA',
    accent: '#3B82F6',
    danger: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#0EA5E9',
    white: '#FFFFFF',
    black: '#000000',
  },
  dark: {
    background: '#000000',
    card: '#18181B',
    input: '#27272A',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#52525B',
    border: '#27272A',
    borderStrong: '#52525B',
    accent: '#3B82F6',
    danger: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#0EA5E9',
    white: '#FFFFFF',
    black: '#000000',
  },
} as const

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const SPACING = {
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

// ─── Radius ───────────────────────────────────────────────────────────────────

export const RADIUS = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
  full: 9999,
} as const

// ─── Typography ───────────────────────────────────────────────────────────────

export const TYPOGRAPHY = {
  displayXl: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  displayMd: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  displaySm: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
  bodyLg: { fontSize: 18, lineHeight: 24, fontWeight: '500' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 20, fontWeight: '500' as const },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  bodySmStrong: { fontSize: 14, lineHeight: 16, fontWeight: '500' as const },
  caption: { fontSize: 12, lineHeight: 20, fontWeight: '400' as const },
  captionSm: { fontSize: 8, lineHeight: 12, fontWeight: '400' as const },
} as const
