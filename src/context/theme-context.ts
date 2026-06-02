import { createContext } from 'react'

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/config/tokens'

import type { ThemePreference } from '@/config/tokens'

export type ThemeColors = typeof COLORS.light | typeof COLORS.dark
export type ThemeSpacing = typeof SPACING
export type ThemeRadius = typeof RADIUS
export type ThemeTypography = typeof TYPOGRAPHY

export interface ThemeContextValue {
  isDark: boolean
  preference: ThemePreference
  setTheme: (pref: ThemePreference) => void
  colors: ThemeColors
  spacing: ThemeSpacing
  radius: ThemeRadius
  typography: ThemeTypography
  layout: {
    flex1: { flex: number }
    center: { justifyContent: 'center', alignItems: 'center' }
    row: { flexDirection: 'row' }
    rowAlign: { flexDirection: 'row', alignItems: 'center' }
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
    column: { flexDirection: 'column' }
    selfCenter: { alignSelf: 'center' }
    wFull: { width: '100%' }
    hFull: { height: '100%' }
  }
}

export const layoutStyles = {
  flex1: { flex: 1 },
  center: { justifyContent: 'center' as const, alignItems: 'center' as const },
  row: { flexDirection: 'row' as const },
  rowAlign: { flexDirection: 'row' as const, alignItems: 'center' as const },
  rowBetween: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  column: { flexDirection: 'column' as const },
  selfCenter: { alignSelf: 'center' as const },
  wFull: { width: '100%' as const },
  hFull: { height: '100%' as const },
}

export const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  preference: 'system',
  setTheme: () => undefined,
  colors: COLORS.light,
  spacing: SPACING,
  radius: RADIUS,
  typography: TYPOGRAPHY,
  layout: layoutStyles,
})
