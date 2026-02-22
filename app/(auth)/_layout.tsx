import { useThemeColor } from '@/hooks/useThemeColor'
import { Stack } from 'expo-router'

export default function Layout() {
	const colors = useThemeColor()
	return (
		<>
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: {
						backgroundColor: colors.background,
					},
				}}
			>
				<Stack.Screen name="login" options={{ headerShown: false }} />
				<Stack.Screen name="verify-otp" options={{ headerShown: false }} />
			</Stack>
		</>
	)
}
