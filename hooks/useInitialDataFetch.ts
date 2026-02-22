import { useAuth } from '@/stores/authStore'
import { useEquipment } from '@/stores/equipmentStore'
import { useExercise } from '@/stores/exerciseStore'
import { useMuscleGroup } from '@/stores/muscleGroupStore'
import { useTemplate } from '@/stores/templateStore'
import { useUser } from '@/stores/userStore'
import { useWorkout } from '@/stores/workoutStore'
import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useNetworkStatus } from './useNetworkStatus'

const SYNC_COOLDOWN_MS = 60 * 1000 // 1 minute cooldown

/**
 * Hook to fetch initial data when the user opens the app or comes back online.
 * Separates logic for public data (no auth) and user data (auth required).
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

		// 1. Fetch public data
		fetchPublicData()

		// 2. Fetch user-specific data (only if logged in)
		// accessing the *latest* auth state from store directly strictly for the fetch check
		// or relying on the prop. The prop is reactive.
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

async function fetchPublicData() {
	console.log('[InitialFetch] Fetching public data...')
	try {
		// Fetch system data concurrently
		await Promise.all([
			useEquipment.getState().getAllEquipment(),
			useMuscleGroup.getState().getAllMuscleGroups(),
			useExercise.getState().getAllExercises(),
		])
	} catch (error) {
		console.error('[InitialFetch] Error fetching public data:', error)
	}
}

async function fetchUserData() {
	console.log('[InitialFetch] Fetching user data...')
	try {
		const user = useAuth.getState().user
		if (!user?.userId) return

		// Fetch user-specific data concurrently
		await Promise.all([
			useUser.getState().getUserData(user.userId),
			useTemplate.getState().getAllTemplates(),
			useWorkout.getState().getAllWorkouts(),
		])
	} catch (error) {
		console.error('[InitialFetch] Error fetching user data:', error)
	}
}
