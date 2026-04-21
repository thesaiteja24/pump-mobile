import { queryKeys } from '@/lib/queryKeys'
import {
	followUserService,
	getSuggestedUsersService,
	getUserFollowersService,
	getUserFollowingService,
	searchUsersService,
	unFollowUserService,
} from '@/services/engagementService'
import { SearchedUser } from '@/types/engagement'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useSuggestedUsersQuery() {
	return useQuery({
		queryKey: queryKeys.engagement.suggested,
		queryFn: async () => {
			const res = await getSuggestedUsersService()
			return (res.data ?? []) as SearchedUser[]
		},
		staleTime: 2 * 60 * 1000,
	})
}

export function useSearchUsersQuery(query: string) {
	return useQuery({
		queryKey: queryKeys.engagement.search(query),
		queryFn: async () => {
			const res = await searchUsersService(query)
			return (res.data ?? []) as SearchedUser[]
		},
		enabled: query.trim().length > 0,
		staleTime: 30 * 1000,
	})
}

export function useUserFollowersQuery(userId: string | undefined) {
	return useQuery({
		queryKey: queryKeys.engagement.followers(userId!),
		queryFn: async () => {
			const res = await getUserFollowersService(userId!)
			return (res.data ?? []) as SearchedUser[]
		},
		enabled: !!userId,
		staleTime: 60 * 1000,
	})
}

export function useUserFollowingQuery(userId: string | undefined) {
	return useQuery({
		queryKey: queryKeys.engagement.following(userId!),
		queryFn: async () => {
			const res = await getUserFollowingService(userId!)
			return (res.data ?? []) as SearchedUser[]
		},
		enabled: !!userId,
		staleTime: 60 * 1000,
	})
}

export function useFollowUserMutation() {
	const qc = useQueryClient()

	const updateFollowLoading = (targetUserId: string, isLoading: boolean) => {
		const updateFn = (old: SearchedUser[] | undefined) =>
			old?.map(u => (u.id === targetUserId ? { ...u, followLoading: isLoading } : u))

		qc.setQueriesData({ queryKey: queryKeys.engagement.suggested }, updateFn)
		qc.setQueriesData({ queryKey: ['searchUsers'] }, updateFn)
		qc.setQueriesData({ queryKey: ['userFollowers'] }, updateFn)
		qc.setQueriesData({ queryKey: ['userFollowing'] }, updateFn)
	}

	return useMutation({
		mutationFn: (targetUserId: string) => followUserService(targetUserId),
		onMutate: async targetUserId => {
			updateFollowLoading(targetUserId, true)
			return { targetUserId }
		},
		onSuccess: (res, targetUserId) => {
			if (res.success && res.data) {
				const updatedUser = res.data as SearchedUser
				const updateDataFn = (old: SearchedUser[] | undefined) =>
					old?.map(u => (u.id === targetUserId ? { ...u, ...updatedUser, followLoading: false } : u))

				qc.setQueriesData({ queryKey: queryKeys.engagement.suggested }, updateDataFn)
				qc.setQueriesData({ queryKey: ['searchUsers'] }, updateDataFn)
				qc.setQueriesData({ queryKey: ['userFollowers'] }, updateDataFn)
				qc.setQueriesData({ queryKey: ['userFollowing'] }, updateDataFn)
			}
		},
		onError: (_err, targetUserId) => {
			updateFollowLoading(targetUserId, false)
		},
		onSettled: (_res, _err, targetUserId) => {
			updateFollowLoading(targetUserId, false)
			// Invalidate as a fallback to ensure consistency
			qc.invalidateQueries({ queryKey: queryKeys.engagement.suggested })
			qc.invalidateQueries({ queryKey: ['searchUsers'] })
			qc.invalidateQueries({ queryKey: ['userFollowers'] })
			qc.invalidateQueries({ queryKey: ['userFollowing'] })
		},
	})
}

export function useUnfollowUserMutation() {
	const qc = useQueryClient()

	const updateFollowLoading = (targetUserId: string, isLoading: boolean) => {
		const updateFn = (old: SearchedUser[] | undefined) =>
			old?.map(u => (u.id === targetUserId ? { ...u, followLoading: isLoading } : u))

		qc.setQueriesData({ queryKey: queryKeys.engagement.suggested }, updateFn)
		qc.setQueriesData({ queryKey: ['searchUsers'] }, updateFn)
		qc.setQueriesData({ queryKey: ['userFollowers'] }, updateFn)
		qc.setQueriesData({ queryKey: ['userFollowing'] }, updateFn)
	}

	return useMutation({
		mutationFn: (targetUserId: string) => unFollowUserService(targetUserId),
		onMutate: async targetUserId => {
			updateFollowLoading(targetUserId, true)
			return { targetUserId }
		},
		onSuccess: (res, targetUserId) => {
			if (res.success && res.data) {
				const updatedUser = res.data as SearchedUser
				const updateDataFn = (old: SearchedUser[] | undefined) =>
					old?.map(u => (u.id === targetUserId ? { ...u, ...updatedUser, followLoading: false } : u))

				qc.setQueriesData({ queryKey: queryKeys.engagement.suggested }, updateDataFn)
				qc.setQueriesData({ queryKey: ['searchUsers'] }, updateDataFn)
				qc.setQueriesData({ queryKey: ['userFollowers'] }, updateDataFn)
				qc.setQueriesData({ queryKey: ['userFollowing'] }, updateDataFn)
			}
		},
		onError: (_err, targetUserId) => {
			updateFollowLoading(targetUserId, false)
		},
		onSettled: (_res, _err, targetUserId) => {
			updateFollowLoading(targetUserId, false)
			// Invalidate as a fallback
			qc.invalidateQueries({ queryKey: queryKeys.engagement.suggested })
			qc.invalidateQueries({ queryKey: ['searchUsers'] })
			qc.invalidateQueries({ queryKey: ['userFollowers'] })
			qc.invalidateQueries({ queryKey: ['userFollowing'] })
		},
	})
}
