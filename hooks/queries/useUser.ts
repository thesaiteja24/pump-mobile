import {
	deleteProfilePicService,
	getUserDataService,
	updateProfilePicService,
	updateUserDataService,
} from '@/services/userService'
import { useAuth } from '@/stores/authStore'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ─────────────────────────────────────────────────────
// READ — user profile
// ─────────────────────────────────────────────────────
export function useUserQuery(userId: string | undefined) {
	return useQuery({
		queryKey: ['user', 'profile', userId],
		queryFn: async () => {
			const res = await getUserDataService(userId!)
			return res.data
		},
		enabled: !!userId,
		staleTime: 5 * 60 * 1000,
	})
}

// ─────────────────────────────────────────────────────
// READ — followers / following
// ─────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────
// MUTATION — update profile picture
// ─────────────────────────────────────────────────────
export function useUpdateProfilePicMutation() {
	const userId = useAuth.getState().user?.userId
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ uid, data }: { uid: string; data: FormData }) => updateProfilePicService(uid, data),
		onSuccess: res => {
			if (res.success) {
				useAuth.getState().setUser({
					...useAuth.getState().user,
					profilePicUrl: res.data.profilePicUrl,
					updatedAt: res.data.updatedAt,
				})
				qc.invalidateQueries({ queryKey: ['user', 'profile', userId] })
			}
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — delete profile picture
// ─────────────────────────────────────────────────────
export function useDeleteProfilePicMutation() {
	const userId = useAuth.getState().user?.userId
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (uid: string) => deleteProfilePicService(uid),
		onSuccess: res => {
			if (res.success) {
				useAuth.getState().setUser({
					...useAuth.getState().user,
					profilePicUrl: null,
					updatedAt: res.data?.updatedAt,
				})
				qc.invalidateQueries({ queryKey: ['user', 'profile', userId] })
			}
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — update user data
// ─────────────────────────────────────────────────────
export function useUpdateUserMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ userId, data }: { userId: string; data: Record<string, any> }) =>
			updateUserDataService(userId, data),
		onMutate: ({ data }) => {
			// Optimistic update so the UI reflects change immediately
			useAuth.getState().setUser({
				...useAuth.getState().user,
				...data,
				updatedAt: new Date().toISOString(),
			})
		},
		onSuccess: (_res, { userId }) => {
			qc.invalidateQueries({ queryKey: ['user', 'profile', userId] })
		},
		onError: (_err, { data }) => {
			// rollback on failure
			const currentUser = useAuth.getState().user
			if (currentUser) {
				const rollback: Record<string, any> = {}
				Object.keys(data).forEach(k => {
					rollback[k] = (currentUser as any)[k]
				})
				useAuth.getState().setUser(rollback)
			}
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — update preferences
// ─────────────────────────────────────────────────────
export function useUpdatePreferencesMutation() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ userId, data }: { userId: string; data: Record<string, any> }) =>
			updateUserDataService(userId, data),
		onMutate: ({ data }) => {
			useAuth.getState().setUser({ ...useAuth.getState().user, ...data })
		},
		onSuccess: (_res, { userId }) => {
			qc.invalidateQueries({ queryKey: ['user', 'profile', userId] })
		},
	})
}
