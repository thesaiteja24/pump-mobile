import { queryKeys } from '@/lib/queryKeys'
import {
	deleteProfilePicService,
	getUserDataService,
	updateProfilePicService,
	updateUserDataService,
} from '@/services/userService'
import { UpdateUserBody, User } from '@/types/user'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Hook to fetch any user's data (Self or Public)
 * @param userId
 */
export function useUserQuery(userId: string) {
	return useQuery({
		queryKey: queryKeys.user.byId(userId),
		queryFn: async () => {
			const res = await getUserDataService(userId!)
			return res.data as User
		},
		enabled: !!userId,
		staleTime: 5 * 60 * 1000,
	})
}

/**
 * Hook to update user details with optimistic updates and rollbacks
 */
export function useUpdateUserDataMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: ({ userId, data }: { userId: string; data: UpdateUserBody }) => updateUserDataService(userId, data),

		onMutate: async ({ userId, data }) => {
			// Cancel outgoing refetches
			await qc.cancelQueries({ queryKey: queryKeys.user.byId(userId) })

			// Snapshot the previous value
			const previousUser = qc.getQueryData(queryKeys.user.byId(userId))

			// Optimistically update to the new value
			if (previousUser) {
				qc.setQueryData(queryKeys.user.byId(userId), {
					...(previousUser as User),
					...data,
					updatedAt: new Date().toISOString(),
				})
			}

			return { previousUser }
		},

		onError: (_err, { userId }, context) => {
			// Rollback to the previous value if mutation fails
			if (context?.previousUser) {
				qc.setQueryData(queryKeys.user.byId(userId), context.previousUser)
			}
		},

		onSuccess: (res, { userId }) => {
			// Update cache with real server data
			if (res.success) {
				qc.setQueryData(queryKeys.user.byId(userId), res.data)
			}
		},

		onSettled: (_res, _err, { userId }) => {
			// Invalidate to ensure sync
			qc.invalidateQueries({ queryKey: queryKeys.user.byId(userId) })
		},
	})
}

/**
 * Hook to update profile picture
 */
export function useUpdateProfilePicMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: ({ uid, data }: { uid: string; data: FormData }) => updateProfilePicService(uid, data),

		onSuccess: (res, { uid }) => {
			if (res.success) {
				qc.setQueryData(queryKeys.user.byId(uid), res.data)
				qc.invalidateQueries({ queryKey: queryKeys.user.byId(uid) })
			}
		},
	})
}

/**
 * Hook to delete profile picture
 */
export function useDeleteProfilePicMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (uid: string) => deleteProfilePicService(uid),

		onSuccess: (res, uid) => {
			if (res.success) {
				qc.setQueryData(queryKeys.user.byId(uid), res.data)
				qc.invalidateQueries({ queryKey: queryKeys.user.byId(uid) })
			}
		},
	})
}
