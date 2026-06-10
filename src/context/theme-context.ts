import { createContext } from 'react'

import { colorModes, createLegacyColors, effects, radius, spacing, typography } from '@/theme'

import type { ThemeColorModes, ThemeEffects, ThemeLegacyColors, ThemePreference, ThemeRadius, ThemeSpacing, ThemeTypography } from '@/theme'

export type { ThemeColorModes, ThemeEffects, ThemeLegacyColors, ThemeRadius, ThemeSpacing, ThemeTypography }
export type ThemeColors = ThemeLegacyColors

export interface ThemeContextValue {
  isDark: boolean
  preference: ThemePreference
  setTheme: (pref: ThemePreference) => void
  colorModes: ThemeColorModes
  /** @deprecated Use colorModes instead. Kept while screens migrate. */
  colors: ThemeColors
  spacing: ThemeSpacing
  radius: ThemeRadius
  typography: ThemeTypography
  effects: ThemeEffects
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
  colorModes: colorModes.light,
  colors: createLegacyColors(colorModes.light),
  spacing,
  radius,
  typography,
  effects,
  layout: layoutStyles,
})
