import { queryKeys } from '@/lib/queryKeys'
import { getUserByIdService } from '@/services/meService'
import { User } from '@/types/user'
import { useQuery } from '@tanstack/react-query'

/**
 * Hook to fetch a public user's data
 * @param userId
 */
export function usePublicUserQuery(userId: string) {
	return useQuery({
		queryKey: queryKeys.user.byId(userId),
		queryFn: async () => {
			const res = await getUserByIdService(userId)
			return res.data as User
		},
		enabled: !!userId,
		staleTime: 5 * 60 * 1000,
	})
}
