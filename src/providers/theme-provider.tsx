import * as SystemUI from 'expo-system-ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Appearance, useColorScheme } from 'react-native'

import { layoutStyles, ThemeContext } from '@/context/theme-context'
import { mmkvStorageAdapter } from '@/lib/storage'
import { colorModes, createLegacyColors, effects, radius, spacing, typography } from '@/theme'

import type { ThemePreference } from '@/theme'

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
    const bg = isDark ? colorModes.dark.background.primary : colorModes.light.background.primary
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
    () => {
      const activeColorModes = isDark ? colorModes.dark : colorModes.light
      return {
        isDark,
        preference,
        setTheme,
        colorModes: activeColorModes,
        colors: createLegacyColors(activeColorModes),
        spacing,
        radius,
        typography,
        effects,
        layout: layoutStyles,
      }
    },
    [isDark, preference, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
