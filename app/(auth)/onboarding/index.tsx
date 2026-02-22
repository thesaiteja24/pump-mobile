import { Button } from '@/components/ui/Button'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { router } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function OnboardingWelcome() {
	const colors = useThemeColor()
	const isAuthenticated = useAuth(s => s.isAuthenticated)

	// If already authenticated, we shouldn't be here ideally, but logic in _layout should handle it.
	// However, for the "I have an account" flow, we just navigate to login.

	const handleGetStarted = () => {
		router.push('/(auth)/onboarding/demographics')
	}

	const handleLogin = () => {
		// Navigate to login, user skips onboarding data collection
		router.replace('/(auth)/login')
	}

	return (
		<SafeAreaView className="flex-1 bg-white px-6 dark:bg-black">
			<View className="flex-[3] items-center justify-center">
				{/* Placeholder for illustration */}
				{/* <View className="mb-8 h-64 w-64 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
          <Text className="text-6xl">💪</Text>
        </View> */}

				<Text className="text-center text-4xl text-black dark:text-white" style={{ fontFamily: 'Monoton' }}>
					PUMP
				</Text>
				<Text className="mt-4 text-center text-lg text-neutral-500 dark:text-neutral-400">
					Your personal workout companion.
					{'\n'}Track, Analyze, Evolve.
				</Text>
			</View>

			<View className="flex-1 justify-end gap-3 pb-8">
				<Button title="Get Started" variant="primary" onPress={handleGetStarted} className="w-full" haptic />
				<Button title="I have an account" variant="ghost" onPress={handleLogin} className="w-full" haptic />
			</View>
		</SafeAreaView>
	)
}
