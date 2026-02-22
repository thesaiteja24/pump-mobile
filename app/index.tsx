import { useAuth } from '@/stores/authStore'
import { Redirect } from 'expo-router'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
	const user = useAuth(s => s.user)
	const isAuthenticated = useAuth(s => s.isAuthenticated)
	const hasRestored = useAuth(s => s.hasRestored)
	const hasSeenOnboarding = useAuth(s => s.hasSeenOnboarding)
	const logout = useAuth(s => s.logout)

	if (!hasRestored) {
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator />
			</View>
		)
	}

	// Strict Privacy Policy Enforcement
	React.useEffect(() => {
		if (isAuthenticated && !user?.privacyPolicyAcceptedAt) {
			logout()
		}
	}, [isAuthenticated, user?.privacyPolicyAcceptedAt])

	if (isAuthenticated && !user?.privacyPolicyAcceptedAt) {
		return <Redirect href="/(auth)/login" />
	}

	if (!isAuthenticated && !hasSeenOnboarding) {
		return <Redirect href="/(auth)/onboarding" />
	}

	return <Redirect href={isAuthenticated ? '/(app)/(tabs)/discover' : '/(auth)/login'} />
}
