import { useAuth } from '@/stores/authStore'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

type Props = {
	children: React.ReactNode
	redirectTo?: string
}

export default function AuthGuard({ children, redirectTo = '/(auth)/login' }: Props) {
	const router = useRouter()
	const isAuthenticated = useAuth(s => s.isAuthenticated)
	const hasRestored = useAuth(s => s.hasRestored)

	useEffect(() => {
		if (!hasRestored) return

		if (!isAuthenticated) {
			router.replace(redirectTo as any)
		}
	}, [hasRestored, isAuthenticated, redirectTo, router])

	// While booting, never decide
	if (!hasRestored) {
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator />
			</View>
		)
	}

	// Redirect in progress
	if (!isAuthenticated) {
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator />
			</View>
		)
	}

	return <>{children}</>
}
