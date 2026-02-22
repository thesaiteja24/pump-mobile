import { useThemeColor } from '@/hooks/useThemeColor'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Platform, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SyncStatus from '../ui/SyncStatus'

type IoniconName = keyof typeof Ionicons.glyphMap

type RightIcon = {
	name: IoniconName
	onPress: () => void
	disabled?: boolean
	color?: string // optional per-icon color override
}

type CustomHeaderProps = {
	title: string
	leftIcon?: IoniconName
	rightIcons?: RightIcon[]
	onLeftPress?: () => void
	iconColor?: string // global override for enabled icon color
}

export default function CustomHeader({ title, leftIcon, rightIcons = [], onLeftPress, iconColor }: CustomHeaderProps) {
	const insets = useSafeAreaInsets()
	const colors = useThemeColor()
	const headerHeight = Platform.OS === 'ios' ? 44 + insets.top : 56 + insets.top

	const baseIconColor = iconColor ? iconColor : colors.icon

	return (
		<View
			className="flex w-full flex-row items-center justify-between px-4"
			style={{
				height: headerHeight,
				paddingTop: insets.top,
				backgroundColor: colors.background,
			}}
		>
			{/* Left icon */}
			{leftIcon && (
				<TouchableOpacity onPress={onLeftPress}>
					<Ionicons name={leftIcon} size={24} color={baseIconColor} />
				</TouchableOpacity>
			)}

			{/* Title */}
			{leftIcon ? (
				<View className="absolute left-0 right-0 items-center" style={{ marginTop: insets.top }}>
					<Text className="text-xl font-semibold" style={{ color: colors.text }} numberOfLines={1}>
						{title}
					</Text>
				</View>
			) : (
				<Text className="text-xl font-semibold" style={{ color: colors.text }} numberOfLines={1}>
					{title}
				</Text>
			)}

			{/* Right icons */}
			<View className="flex w-auto flex-row items-center justify-end">
				<SyncStatus />
				{rightIcons.map((item, index) => {
					const color = item.disabled
						? '#9ca3af'
						: item.color // individual override
							? item.color
							: baseIconColor // global or system color

					return (
						<TouchableOpacity
							key={index}
							onPress={item.disabled ? undefined : item.onPress}
							disabled={!!item.disabled}
							className="px-2"
							accessibilityRole="button"
							accessibilityState={{ disabled: !!item.disabled }}
						>
							<Ionicons name={item.name} size={24} color={color} />
						</TouchableOpacity>
					)
				})}
			</View>
		</View>
	)
}
