import { useContext } from 'react'

import { ThemeContext } from '@/context/theme-context'

import type { ThemeColors, ThemeContextValue, ThemeRadius, ThemeSpacing, ThemeTypography } from '@/context/theme-context'

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

export type { ThemeColors, ThemeContextValue, ThemeRadius, ThemeSpacing, ThemeTypography }
