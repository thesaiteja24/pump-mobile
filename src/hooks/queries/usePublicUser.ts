import { queryKeys } from '@/lib/queryKeys'
import { getUserByIdService } from '@/services/me.service'
import { useQuery } from '@tanstack/react-query'

/**
 * Hook to fetch a public user's data
 * @param userId
 */
export function usePublicUserQuery(userId: string) {
  return useQuery({
    queryKey: queryKeys.user.byId(userId),
    queryFn: () => getUserByIdService(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
