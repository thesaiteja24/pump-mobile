import { useColorScheme } from 'nativewind'
import tailwindConfig from '../../tailwind.config'
import resolveConfig from 'tailwindcss/resolveConfig'

resolveConfig(tailwindConfig)

// Manual map for now since resolving tailwind config at runtime in expo can be tricky without extra setup.
// In a full nativewind setup we might rely on CSS vars, but this is a safe bridge.
const COLORS = {
  primary: '#3b82f6',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#f97316',
  black: '#000000',
  white: '#ffffff',
  neutral: {
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
}

export function useThemeColor() {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const colors = {
    ...COLORS,
    scheme: (colorScheme || 'light') as 'light' | 'dark',
    isDark,
    text: isDark ? COLORS.white : COLORS.black,
    background: isDark ? COLORS.black : COLORS.white,
    icon: isDark ? COLORS.white : COLORS.black,
    card: isDark ? COLORS.neutral[900] : COLORS.white,
    border: isDark ? COLORS.neutral[800] : COLORS.neutral[200],
    muted: isDark ? COLORS.neutral[500] : COLORS.neutral[500],
  }

  return colors
}
