import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/stores/authStore'
import { useUser } from '@/stores/userStore'
import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useNetworkStatus } from './useNetworkStatus'

const SYNC_COOLDOWN_MS = 60 * 1000 // 1 minute cooldown

/**
 * Hook to fetch initial data when the user opens the app or comes back online.
 * Separates logic for public data (no auth) and user data (auth required).
 *
 * Public reference data (exercises, equipment, muscleGroups) is now managed
 * entirely by TanStack Query via useExercises / useEquipment / useMuscleGroups
 * hooks — those hooks automatically refetch on foreground / network reconnect
 * because they are mounted in screens that need them. We still explicitly
 * invalidate them here so the cache is refreshed even if those screens are
 * not currently mounted (e.g. after a long background session).
 */
export function useInitialDataFetch() {
	const { isConnected, isInternetReachable } = useNetworkStatus()
	const isAuthenticated = useAuth(s => s.isAuthenticated)
	const isOnline = isConnected && isInternetReachable !== false

	const lastFetchTime = useRef<number>(0)
	const prevAuth = useRef(isAuthenticated)
	const appState = useRef(AppState.currentState)
	const isOnlineRef = useRef(isOnline)

	// Keep refs updated
	useEffect(() => {
		isOnlineRef.current = isOnline
	}, [isOnline])

	const triggerFetch = async (source: string, force = false) => {
		if (!isOnlineRef.current) return

		const now = Date.now()
		const timeSinceLast = now - lastFetchTime.current

		if (!force && timeSinceLast < SYNC_COOLDOWN_MS) {
			console.log(
				`[InitialFetch] Skipping fetch (${source}). Cooldown active (${Math.round((SYNC_COOLDOWN_MS - timeSinceLast) / 1000)}s remaining).`
			)
			return
		}

		console.log(`[InitialFetch] Triggering fetch (${source})...`)
		lastFetchTime.current = now

		// 1. Invalidate public reference data so TanStack Query refetches it
		//    in the background (non-blocking — screens see cached data instantly)
		fetchPublicData()

		// 2. Fetch user-specific data (only if logged in)
		if (useAuth.getState().isAuthenticated) {
			fetchUserData()
		}
	}

	// 1. AppState Handler (Foreground)
	useEffect(() => {
		const subscription = AppState.addEventListener('change', nextAppState => {
			if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
				triggerFetch('foreground')
			}
			appState.current = nextAppState
		})

		return () => {
			subscription.remove()
		}
	}, [])

	// 2. Network/Auth Handler
	useEffect(() => {
		const isAuthLogin = !prevAuth.current && isAuthenticated
		prevAuth.current = isAuthenticated

		if (isOnline) {
			if (isAuthLogin) {
				// Always fetch on login, ignore cooldown
				triggerFetch('login', true)
			} else {
				triggerFetch('network/mount')
			}
		}
	}, [isOnline, isAuthenticated])
}

/**
 * Invalidate reference catalogue queries so TanStack Query refetches them.
 * Because staleTime is Infinity the refetch only happens when the queries
 * are actually invalid — and components still render the cached data instantly.
 */
async function fetchPublicData() {
	console.log('[InitialFetch] Invalidating public reference data...')
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all }),
		queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all }),
		queryClient.invalidateQueries({ queryKey: queryKeys.muscleGroups.all }),
	])
}

async function fetchUserData() {
	console.log('[InitialFetch] Fetching user data...')
	try {
		const user = useAuth.getState().user
		if (!user?.userId) return

		// Fetch user-specific data concurrently
		await Promise.all([useUser.getState().getUserData(user.userId)])
	} catch (error) {
		console.error('[InitialFetch] Error fetching user data:', error)
	}
}
