import { useThemeColor } from '@/hooks/useThemeColor'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import React from 'react'
import { useColorScheme } from 'react-native'

interface UnitToggleProps {
	options: string[]
	selectedIndex: number
	onOnChange: (index: number) => void
}

export function UnitToggle({ options, selectedIndex, onOnChange }: UnitToggleProps) {
	const isDark = useColorScheme() === 'dark'
	const colors = useThemeColor()

	return (
		<SegmentedControl
			values={options}
			selectedIndex={selectedIndex}
			onChange={event => {
				onOnChange(event.nativeEvent.selectedSegmentIndex)
			}}
			// backgroundColor={isDark ? "#262626" : "#f5f5f5"}
			tintColor={isDark ? '#404040' : 'white'}
			activeFontStyle={{
				color: colors.text,
				fontWeight: '600',
			}}
			fontStyle={{
				color: colors.neutral[500],
			}}
			style={{ height: 40 }}
		/>
	)
}
