import { queryClient } from '@/lib/queryClient'
import { registerUnauthorizedHandler } from '@/lib/authSession'
import { setAccessToken } from '@/services/api'
import { sendOtpService, verifyOtpService } from '@/services/authService'
import { type User } from '@/types/auth'
import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'

type AuthState = {
	user: User | null
	accessToken: string | null
	isAuthenticated: boolean

	// Boot invariant
	hasRestored: boolean

	// UI state
	isLoading: boolean
	isGoogleLoading: boolean

	hasSeenOnboarding: boolean
	completeOnboarding: () => Promise<void>

	sendOtp: (payload: any) => Promise<any>
	verifyOtp: (payload: any) => Promise<any>
	googleLogin: (idToken: string, privacyAccepted?: boolean, privacyPolicyVersion?: string | null) => Promise<any>
	restoreFromStorage: () => Promise<void>
	setUser: (user: Partial<User>) => void
	logout: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
	user: null,
	accessToken: null,
	isAuthenticated: false,
	isLoading: false,
	isGoogleLoading: false,
	hasRestored: false,
	hasSeenOnboarding: false,

	completeOnboarding: async () => {
		set({ hasSeenOnboarding: true })
		await SecureStore.setItemAsync('hasSeenOnboarding', 'true')
	},

	googleLogin: async (idToken, privacyAccepted, privacyPolicyVersion) => {
		set({ isGoogleLoading: true })
		try {
			const { googleLoginService } = require('@/services/authService') // Lazy import to avoid cycle if any
			const res = await googleLoginService(idToken, privacyAccepted, privacyPolicyVersion)

			if (res.success) {
				const { accessToken, user } = res.data
				if (accessToken) {
					await SecureStore.setItemAsync('accessToken', accessToken)
					setAccessToken(accessToken)
				}
				if (user) {
					await SecureStore.setItemAsync('user', JSON.stringify(user))
				}
				set({
					user,
					accessToken,
					isAuthenticated: true,
				})
			}
			return res
		} finally {
			set({ isLoading: false, isGoogleLoading: false })
		}
	},

	sendOtp: async payload => {
		set({ isLoading: true })
		try {
			return await sendOtpService(payload)
		} finally {
			set({ isLoading: false })
		}
	},

	verifyOtp: async payload => {
		set({ isLoading: true })
		try {
			const res = await verifyOtpService(payload)

			if (res.success) {
				const { accessToken, user } = res.data

				if (accessToken) {
					await SecureStore.setItemAsync('accessToken', accessToken)
					setAccessToken(accessToken)
				}
				if (user) {
					await SecureStore.setItemAsync('user', JSON.stringify(user))
				}

				set({
					user,
					accessToken,
					isAuthenticated: true,
				})
			}

			return res
		} finally {
			set({ isLoading: false })
		}
	},

	restoreFromStorage: async () => {
		if (get().hasRestored) return // idempotent

		try {
			const token = await SecureStore.getItemAsync('accessToken')
			const userJson = await SecureStore.getItemAsync('user')
			const hasSeenOnboarding = await SecureStore.getItemAsync('hasSeenOnboarding')

			set({ hasSeenOnboarding: hasSeenOnboarding === 'true' })

			if (token) {
				setAccessToken(token)
				set({
					accessToken: token,
					user: userJson ? JSON.parse(userJson) : null,
					isAuthenticated: true,
				})
			}
		} catch {
			set({
				accessToken: null,
				user: null,
				isAuthenticated: false,
			})
		} finally {
			set({ hasRestored: true })
		}
	},

	setUser: partial => {
		const merged = { ...get().user, ...partial }
		set({ user: merged })
		SecureStore.setItemAsync('user', JSON.stringify(merged)).catch(() => {})
	},

	logout: async () => {
		set({ isLoading: true })

		try {
			// Clear TanStack Query cache
			queryClient.clear()

			await SecureStore.deleteItemAsync('accessToken')
			await SecureStore.deleteItemAsync('user')
		} finally {
			set({
				user: null,
				accessToken: null,
				isAuthenticated: false,
				isLoading: false,
			})

			// Reset all related stores
			// useEquipment.getState().resetState();
			// useMuscleGroup.getState().resetState();
			// useExercise.getState().resetState();

			// Use require to avoid circular dependencies
			const { useWorkout } = require('./workoutStore')
			const { useTemplate } = require('./templateStore')

			useWorkout.getState().resetState()
			useTemplate.getState().resetState()
		}
	},
}))

registerUnauthorizedHandler(() => {
	useAuth.getState().logout()
})
