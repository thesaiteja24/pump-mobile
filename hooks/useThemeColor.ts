import tailwindConfig from '@/tailwind.config'
import { useEffect } from 'react'
import { Appearance } from 'react-native'
import resolveConfig from 'tailwindcss/resolveConfig'

const fullConfig = resolveConfig(tailwindConfig)

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
		200: '#e5e5e5',
		500: '#737373',
		800: '#262626',
		900: '#171717',
	},
}

type ColorToken = keyof typeof COLORS

export function useThemeColor() {
	const isDark = true

	const colors = {
		...COLORS,
		// Add semantic overrides if needed for dark mode specifically
		scheme: 'dark' as const,
		isDark: true,
		text: COLORS.white,
		background: COLORS.black,
		icon: COLORS.white,
	}

	return colors
}
