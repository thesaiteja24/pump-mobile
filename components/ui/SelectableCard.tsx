import { useThemeColor } from '@/hooks/useThemeColor'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

interface SelectableCardProps {
	selected: boolean
	onSelect: () => void
	title: string
	icon?: React.ReactNode
	className?: string
}

export function SelectableCard({ selected, onSelect, title, icon, className }: SelectableCardProps) {
	const colors = useThemeColor()

	return (
		<Pressable
			onPress={() => {
				Haptics.selectionAsync()
				onSelect()
			}}
			className={`items-center justify-center rounded-2xl border p-4 ${
				selected
					? 'border-primary bg-blue-50/50 dark:bg-blue-900/20'
					: 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
			} ${className}`}
		>
			{/* <View className="mb-2">{icon}</View> */}
			<Text
				className={`text-base font-semibold ${
					selected ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'
				}`}
			>
				{title}
			</Text>
			{selected && <View className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />}
		</Pressable>
	)
}
