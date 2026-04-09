import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import {
	createProgramService,
	deleteProgramService,
	getAllProgramsService,
	getProgramByIdService,
	updateProgramService,
} from '@/services/programService'
import { Program } from '@/stores/programStore'
import { useMutation, useQuery } from '@tanstack/react-query'

// ─────────────────────────────────────────────────────
// READ — programs list (staleTime 5 min, fresh enough for a production app)
// ─────────────────────────────────────────────────────
export function usePrograms() {
	return useQuery({
		queryKey: queryKeys.programs.all,
		queryFn: async () => {
			const res = await getAllProgramsService()
			return (res.data.programs ?? []) as Program[]
		},
		staleTime: 7 * 24 * 60 * 60 * 1000, // 7 Days
	})
}

// ─────────────────────────────────────────────────────
// READ — single program (fetched on demand, staleTime 5 min)
// ─────────────────────────────────────────────────────
export function useProgramById(programId: string | null | undefined) {
	return useQuery({
		queryKey: queryKeys.programs.detail(programId ?? ''),
		queryFn: async () => {
			const res = await getProgramByIdService(programId!)
			return res.data.program as Program
		},
		enabled: Boolean(programId),
		staleTime: 7 * 24 * 60 * 60 * 1000, // 7 Days
	})
}

// ─────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────
export function useCreateProgram() {
	return useMutation({
		mutationFn: async (data: Program) => {
			const res = await createProgramService(data as any)
			if (!res.success) throw new Error(res.message || 'Failed to create program')
			return res.data.program as Program
		},
		onSuccess: newProgram => {
			// Optimistically prepend to list without waiting for a refetch
			queryClient.setQueryData<Program[]>(queryKeys.programs.all, old =>
				old ? [newProgram, ...old] : [newProgram]
			)
			// Then invalidate so background refetch normalises any discrepancy
			queryClient.invalidateQueries({ queryKey: queryKeys.programs.all })
		},
	})
}

export function useUpdateProgram() {
	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Program }) => {
			const res = await updateProgramService(id, data as any)
			if (!res.success) throw new Error(res.message || 'Failed to update program')
			return res.data.program as Program
		},
		onSuccess: (updatedProgram, { id }) => {
			// Update list cache in-place
			queryClient.setQueryData<Program[]>(queryKeys.programs.all, old =>
				old ? old.map(p => (p.id === id ? updatedProgram : p)) : [updatedProgram]
			)
			// Update detail cache
			queryClient.setQueryData(queryKeys.programs.detail(id), updatedProgram)
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
			queryClient.setQueryData<Program[]>(queryKeys.programs.all, old =>
				old ? old.filter(p => p.id !== deletedId) : []
			)
			queryClient.removeQueries({ queryKey: queryKeys.programs.detail(deletedId) })
		},
	})
}
