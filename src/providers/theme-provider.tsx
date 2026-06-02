import * as SystemUI from 'expo-system-ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Appearance, useColorScheme } from 'react-native'

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/config/tokens'
import { layoutStyles, ThemeContext } from '@/context/theme-context'
import { mmkvStorageAdapter } from '@/lib/storage'

import type { ThemePreference } from '@/config/tokens'

const THEME_KEY = 'theme.preference'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme()
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const stored = mmkvStorageAdapter.getItem(THEME_KEY) as ThemePreference | null
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      return stored
    }
    return 'system'
  })

  const isDark = useMemo(() => {
    if (preference === 'dark')
      return true
    if (preference === 'light')
      return false
    return systemScheme === 'dark'
  }, [preference, systemScheme])

  useEffect(() => {
    const bg = isDark ? COLORS.dark.background : COLORS.light.background
    SystemUI.setBackgroundColorAsync(bg).catch(() => {})

    Appearance.setColorScheme(
      preference === 'system' ? 'unspecified' : (isDark ? 'dark' : 'light'),
    )
  }, [isDark, preference])

  const setTheme = useCallback((pref: ThemePreference) => {
    setPreference(pref)
    if (pref === 'system') {
      mmkvStorageAdapter.removeItem(THEME_KEY)
    }
    else {
      mmkvStorageAdapter.setItem(THEME_KEY, pref)
    }
  }, [])

  const value = useMemo(
    () => ({
      isDark,
      preference,
      setTheme,
      colors: isDark ? COLORS.dark : COLORS.light,
      spacing: SPACING,
      radius: RADIUS,
      typography: TYPOGRAPHY,
      layout: layoutStyles,
    }),
    [isDark, preference, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
