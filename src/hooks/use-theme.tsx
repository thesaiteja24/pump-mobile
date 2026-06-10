import { useContext } from 'react'

import { ThemeContext } from '@/context/theme-context'

import type {
  ThemeColorModes,
  ThemeColors,
  ThemeContextValue,
  ThemeEffects,
  ThemeRadius,
  ThemeSpacing,
  ThemeTypography,
} from '@/context/theme-context'

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

export type {
  ThemeColorModes,
  ThemeColors,
  ThemeContextValue,
  ThemeEffects,
  ThemeRadius,
  ThemeSpacing,
  ThemeTypography,
}
