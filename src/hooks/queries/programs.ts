import { queryKeys } from '@/lib/queryKeys'
import {
  createProgramService,
  deleteProgramService,
  getActiveUserProgramService,
  getAllProgramsService,
  getProgramByIdService,
  getUserProgramService,
  listUserProgramsService,
  startProgramService,
  updateProgramService,
} from '@/services/programs.service'
import {
  PaginatedPrograms,
  Program,
  ProgramCreatePayload,
  ProgramUpdatePayload,
  UserProgram,
  UserProgramStartPayload,
} from '@/types/programs'
import { useAuth } from '@/stores/auth.store'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ─────────────────────────────────────────────────────────────────
// READ HOOKS (LIBRARY)
// ─────────────────────────────────────────────────────────────────

/**
 * usePrograms
 * Fetches all global programs. If page/limit are provided, it returns a single page.
 * Otherwise, it fetches all pages and merges them (legacy behavior).
 */
export function usePrograms(page?: number, limit?: number) {
  return useQuery<PaginatedPrograms | null>({
    queryKey: [...queryKeys.programs.all, page ?? 'all', limit ?? 'all'],
    queryFn: async () => {
      if (page !== undefined || limit !== undefined) {
        return getAllProgramsService(page ?? 1, limit ?? 20)
      }

      // Fetch all pages logic
      const firstPage = await getAllProgramsService(1, 20)
      const totalPages = firstPage.pagination.pages

      if (totalPages <= 1) return firstPage

      const nextPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) => {
          return getAllProgramsService(index + 2, 20)
        }),
      )

      return {
        ...firstPage,
        programs: [
          ...firstPage.programs,
          ...nextPages.flatMap((p) => p.programs),
        ],
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 Hours
  })
}

export function useProgramById(programId: string | undefined) {
  return useQuery<Program | null>({
    queryKey: queryKeys.programs.detail(programId!),
    queryFn: () => getProgramByIdService(programId!),
    enabled: !!programId,
    staleTime: 6 * 24 * 60 * 60 * 1000, // 6 Days
  })
}

// ─────────────────────────────────────────────────────────────────
// READ HOOKS (USER)
// ─────────────────────────────────────────────────────────────────

export function useUserPrograms() {
  const userId = useAuth((s) => s.userId)
  return useQuery<UserProgram[]>({
    queryKey: queryKeys.programs.user.all(userId!),
    queryFn: listUserProgramsService,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 Minutes
  })
}

export function useUserProgram(userProgramId: string | undefined, weekIndex?: number) {
  return useQuery<UserProgram | null>({
    queryKey: [...queryKeys.programs.user.detail(userProgramId!), weekIndex ?? 'default'],
    queryFn: () => getUserProgramService(userProgramId!, weekIndex),
    enabled: !!userProgramId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 Minutes
  })
}

export function useActiveProgram() {
  const userId = useAuth((s) => s.userId)
  return useQuery<UserProgram | null>({
    queryKey: queryKeys.programs.user.active(userId!),
    queryFn: getActiveUserProgramService,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 Minutes
  })
}

// ─────────────────────────────────────────────────────────────────
// MUTATION HOOKS
// ─────────────────────────────────────────────────────────────────

export function useCreateProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      // Temporary: Handle DraftProgram from UI until UI is refactored
      if ('weeks' in data && Array.isArray(data.weeks) && data.weeks[0]?.days) {
        const { serializeProgramCreateForApi } = await import('@/utils/serializeForApi')
        const serialized = serializeProgramCreateForApi(data)
        return createProgramService(serialized)
      }
      return createProgramService(data as ProgramCreatePayload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.all })
    },
  })
}

export function useUpdateProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Temporary: Handle DraftProgram from UI until UI is refactored
      if ('weeks' in data && Array.isArray(data.weeks) && data.weeks[0]?.days) {
        const { serializeProgramUpdateForApi } = await import('@/utils/serializeForApi')
        const serialized = serializeProgramUpdateForApi(data)
        return updateProgramService(id, serialized)
      }
      return updateProgramService(id, data as ProgramUpdatePayload)
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.all })
      queryClient.setQueryData(queryKeys.programs.detail(updated.id), updated)
    },
  })
}

export function useDeleteProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProgramService(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.all })
      queryClient.removeQueries({ queryKey: queryKeys.programs.detail(id) })
    },
  })
}

export function useStartProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      programId,
      duration,
      startDate,
    }: {
      programId: string
      duration: number
      startDate: Date
    }) => {
      const payload: UserProgramStartPayload = {
        duration,
        startDate: startDate.toISOString(),
      }
      return startProgramService(programId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.user.root })
    },
  })
}
