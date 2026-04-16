/**
 * useMuscleGroups / useMuscleGroupById
 *
 * TanStack Query hooks that replace the old muscleGroupStore fetch actions
 * (and its manual `lastSyncedAt` stale check).
 *
 * staleTime: Infinity — muscle group catalogue is reference data that only
 * changes when an admin edits it, so we treat the cache as perpetually fresh
 * while still refetching in the background on admin operations.
 */

import { queryKeys } from '@/lib/queryKeys'
import {
	createMuscleGroupService,
	deleteMuscleGroupService,
	getAllMuscleGroupsService,
	getMuscleGroupByIdService,
	updateMuscleGroupService,
} from '@/services/muscleGroupService'
import type { MuscleGroup } from '@/types/muscle-groups'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ─────────────────────────────────────────────────────────────────
// READ — full list
// ─────────────────────────────────────────────────────────────────

export function useMuscleGroups() {
	return useQuery<MuscleGroup[]>({
		queryKey: queryKeys.muscleGroups.all,
		queryFn: async () => {
			const res = await getAllMuscleGroupsService()
			return res.data ?? []
		},
		staleTime: Infinity,
	})
}

// ─────────────────────────────────────────────────────────────────
// READ — single item
// ─────────────────────────────────────────────────────────────────

export function useMuscleGroupById(id: string | undefined) {
	return useQuery<MuscleGroup | null>({
		queryKey: queryKeys.muscleGroups.byId(id!),
		queryFn: async () => {
			const res = await getMuscleGroupByIdService(id!)
			return res.data ?? null
		},
		enabled: !!id,
		staleTime: Infinity,
	})
}

// ─────────────────────────────────────────────────────────────────
// WRITE — admin mutations
// ─────────────────────────────────────────────────────────────────

export function useCreateMuscleGroup() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: FormData) => createMuscleGroupService(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.muscleGroups.all })
		},
	})
}

export function useUpdateMuscleGroup() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: FormData }) =>
			updateMuscleGroupService(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.muscleGroups.all })
		},
	})
}

export function useDeleteMuscleGroup() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => deleteMuscleGroupService(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.muscleGroups.all })
		},
	})
}
