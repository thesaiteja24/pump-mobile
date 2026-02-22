import { useThemeColor } from '@/hooks/useThemeColor'
import { Stack } from 'expo-router'

export default function OnboardingLayout() {
	const colors = useThemeColor()

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: colors.background },
			}}
		>
			<Stack.Screen name="index" />
			<Stack.Screen
				name="demographics"
				options={{
					presentation: 'card',
				}}
			/>
			<Stack.Screen
				name="metrics"
				options={{
					presentation: 'card',
				}}
			/>
		</Stack>
	)
}
