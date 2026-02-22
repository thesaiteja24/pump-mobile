import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
import { Pressable, PressableProps, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'

// Longer rainbow gradient for smooth loop
const RAINBOW_COLORS = [
	'#ff0000',
	'#ff7f00',
	'#00ff00',
	'#0000ff',
	'#4b0082',
	'#8f00ff',
	'#ff0000',
	'#ff7f00',
	'#00ff00',
	'#0000ff',
	'#4b0082',
	'#8f00ff',
] as const

interface AnimatedButtonProps extends Omit<PressableProps, 'children'> {
	iconName?: keyof typeof Ionicons.glyphMap
	iconSize?: number
	iconColor?: string
	height?: number
	width?: number
}

export default function AnimatedButton({
	iconName = 'sparkles',
	iconSize = 24,
	iconColor = '#fff',
	height = 48,
	width = 40,
	...pressableProps
}: AnimatedButtonProps) {
	const translateX = useSharedValue(0)

	useEffect(() => {
		// Longer distance for smoother loop
		translateX.value = withRepeat(withTiming(-300, { duration: 4000, easing: Easing.linear }), -1, true)
	}, [])

	const gradientAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}))

	return (
		<Pressable
			className="overflow-hidden rounded-full"
			style={{ minHeight: height, minWidth: width }}
			{...pressableProps}
		>
			<Animated.View
				style={[
					{
						position: 'absolute',
						top: 0,
						left: 0,
						width: 600, // longer gradient for smooth loop
						height: '100%',
					},
					gradientAnimatedStyle,
				]}
			>
				<LinearGradient
					colors={RAINBOW_COLORS}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={{ width: '100%', height: '100%' }}
				/>
			</Animated.View>

			<View
				style={{
					minHeight: height,
					minWidth: width,
					alignItems: 'center',
					justifyContent: 'center',
					paddingHorizontal: 16,
					paddingVertical: 8,
				}}
			>
				<Ionicons name={iconName} color={iconColor} size={iconSize} />
			</View>
		</Pressable>
	)
}
