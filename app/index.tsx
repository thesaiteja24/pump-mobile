import { useMyProfileQuery } from '@/hooks/queries/useMe'
import { useAuth } from '@/stores/authStore'
import { SelfUser } from '@/types/user'
import { Redirect } from 'expo-router'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
	const isAuthenticated = useAuth(s => s.isAuthenticated)
	const { data: user } = useMyProfileQuery()
	const selfUser = user as SelfUser

	const hasRestored = useAuth(s => s.hasRestored)
	const hasSeenOnboarding = useAuth(s => s.hasSeenOnboarding)
	const logout = useAuth(s => s.logout)

	// Strict Privacy Policy Enforcement
	React.useEffect(() => {
		if (isAuthenticated && selfUser && !selfUser.privacyPolicyAcceptedAt) {
			logout()
		}
	}, [isAuthenticated, selfUser, logout])

	if (!hasRestored) {
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator />
			</View>
		)
	}

	if (isAuthenticated && selfUser && !selfUser.privacyPolicyAcceptedAt) {
		return <Redirect href="/(auth)/login" />
	}

	if (!isAuthenticated && !hasSeenOnboarding) {
		return <Redirect href="/(auth)/onboarding" />
	}

	return <Redirect href={isAuthenticated ? '/(app)/(tabs)/home' : '/(auth)/login'} />
}
