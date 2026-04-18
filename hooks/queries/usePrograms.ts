import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import {
	createProgramService,
	deleteProgramService,
	getActiveUserProgramService,
	getAllProgramsService,
	getProgramByIdService,
	getUserProgramService,
	updateProgramService,
} from '@/services/programService'
import { useAuth } from '@/stores/authStore'
import {
	DraftProgram,
	ProgramDetails,
	ProgramTemplateModel,
	UserProgram,
	UserProgramStartPayload,
} from '@/types/program'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

export function usePrograms(page?: number, limit?: number) {
	const userId = useAuth(s => s.user?.userId)

	return useQuery({
		queryKey: [...queryKeys.programs.all(userId ?? ''), page ?? 'all', limit ?? 'all'],
		queryFn: async () => {
			if (!userId) return null

			const fetchProgramsPage = async (pageNumber: number, pageLimit: number) => {
				const res = await getAllProgramsService(pageNumber, pageLimit)
				if (!res.success) throw new Error(res.message || 'Failed to load programs')
				return res.data
			}

			if (page !== undefined || limit !== undefined) {
				return fetchProgramsPage(page ?? 1, limit ?? 20)
			}

			const firstPage = await fetchProgramsPage(1, 20)
			if (!firstPage) return null

			const totalPages = firstPage.pagination.pages
			if (totalPages <= 1) return firstPage

			const nextPages = await Promise.all(
				Array.from({ length: totalPages - 1 }, (_, index) => {
					return fetchProgramsPage(index + 2, 20)
				})
			)

			return {
				...firstPage,
				programs: [...firstPage.programs, ...nextPages.flatMap(pageResponse => pageResponse?.programs ?? [])],
			}
		},
		enabled: !!userId,
		staleTime: 30 * 24 * 60 * 60 * 1000, // 30 Days for global programs
	})
}

export function useProgramById(programId: string | null | undefined) {
	return useQuery({
		queryKey: queryKeys.programs.detail(programId ?? ''),
		queryFn: async () => {
			const res = await getProgramByIdService(programId!)
			return (res.data?.program ?? null) as ProgramDetails | null
		},
		enabled: Boolean(programId),
		staleTime: 6 * 24 * 60 * 60 * 1000, // 7 Days
	})
}

export function useUserPrograms() {
	const userId = useAuth(s => s.user?.userId)

	return useQuery({
		queryKey: queryKeys.programs.user.all(userId ?? ''),
		queryFn: async () => {
			if (!userId) return [] as UserProgram[]
			const { listUserProgramsService } = await import('@/services/programService')
			const res = await listUserProgramsService()
			return (res.data?.programs ?? []) as UserProgram[]
		},
		enabled: !!userId,
		staleTime: 6 * 60 * 60 * 1000, // 6 Hours
	})
}

export function useUserProgram(userProgramId: string | null | undefined, weekIndex?: number) {
	const userId = useAuth(s => s.user?.userId)
	return useQuery({
		queryKey: [queryKeys.programs.user.detail(userId ?? '', userProgramId ?? ''), weekIndex],
		queryFn: async () => {
			const res = await getUserProgramService(userProgramId!, weekIndex)
			return (res.data?.program ?? null) as UserProgram | null
		},
		enabled: Boolean(userProgramId && userId),
		placeholderData: keepPreviousData,
		staleTime: 6 * 60 * 60 * 1000, // 6 Hours
	})
}

export function useActiveProgram() {
	const userId = useAuth(s => s.user?.userId)
	return useQuery({
		queryKey: queryKeys.programs.user.active(userId ?? ''),
		queryFn: async () => {
			const res = await getActiveUserProgramService()
			return (res.data?.program ?? null) as UserProgram | null
		},
		enabled: !!userId,
		staleTime: 6 * 60 * 60 * 1000, // 6 Hours
	})
}

// ─────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────
export function useCreateProgram() {
	return useMutation({
		mutationFn: async (data: DraftProgram) => {
			const { serializeProgramCreateForApi } = await import('@/utils/serializeForApi')
			const serializedData = serializeProgramCreateForApi(data)
			const res = await createProgramService(serializedData)
			if (!res.success) throw new Error(res.message || 'Failed to create program')
			return res.data?.program as ProgramTemplateModel
		},
		onSuccess: () => {
			const userId = useAuth.getState().user?.userId
			if (userId) {
				queryClient.invalidateQueries({ queryKey: queryKeys.programs.all(userId) })
			}
		},
	})
}

export function useUpdateProgram() {
	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: DraftProgram }) => {
			const { serializeProgramUpdateForApi } = await import('@/utils/serializeForApi')
			const serializedData = serializeProgramUpdateForApi(data)
			const res = await updateProgramService(id, serializedData)
			if (!res.success) throw new Error(res.message || 'Failed to update program')
			return res.data?.program as ProgramTemplateModel
		},
		onSuccess: (updatedProgram, { id }) => {
			const userId = useAuth.getState().user?.userId
			if (userId) {
				queryClient.invalidateQueries({ queryKey: queryKeys.programs.all(userId) })
			}

			const detailKey = queryKeys.programs.detail(id)
			if (Object.prototype.hasOwnProperty.call(updatedProgram, 'weeks')) {
				queryClient.setQueryData(detailKey, updatedProgram)
			} else {
				queryClient.invalidateQueries({ queryKey: detailKey })
			}
		},
	})
}

export function useDeleteProgram() {
	return useMutation({
		mutationFn: async (id: string) => {
			const res = await deleteProgramService(id)
			if (!res.success) throw new Error('Failed to delete program')
			return id
		},
		onSuccess: deletedId => {
			const userId = useAuth.getState().user?.userId
			if (userId) {
				queryClient.invalidateQueries({ queryKey: queryKeys.programs.all(userId) })
			}
			queryClient.removeQueries({ queryKey: queryKeys.programs.detail(deletedId) })
		},
	})
}

export function useStartProgram() {
	return useMutation({
		mutationFn: async ({
			programId,
			duration,
			startDate,
		}: {
			programId: string
			duration: number
			startDate: Date
		}) => {
			const { startProgramService } = await import('@/services/programService')
			const payload: UserProgramStartPayload = {
				duration,
				startDate: startDate.toISOString(),
			}
			const res = await startProgramService(programId, payload)
			if (!res.success) throw new Error(res.message || 'Failed to start program')
			return res.data?.userProgram as UserProgram
		},
		onSuccess: () => {
			const userId = useAuth.getState().user?.userId
			if (userId) {
				queryClient.invalidateQueries({ queryKey: queryKeys.programs.user.all(userId) })
				queryClient.invalidateQueries({ queryKey: queryKeys.programs.user.active(userId) })
			}
		},
	})
}
