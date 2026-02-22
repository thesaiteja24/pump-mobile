import AuthGuard from '@/components/auth/AuthGuard'
import { useThemeColor } from '@/hooks/useThemeColor'
import { Stack } from 'expo-router'
import React from 'react'

export default function AppLayout() {
	const colors = useThemeColor()
	return (
		<AuthGuard redirectTo="/(auth)/login">
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: {
						backgroundColor: colors.background,
					},
				}}
			>
				<Stack.Screen name="(tabs)" />
			</Stack>
		</AuthGuard>
	)
}
