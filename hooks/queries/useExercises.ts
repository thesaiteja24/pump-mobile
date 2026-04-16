/**
 * useExercises / useExerciseById
 *
 * TanStack Query hooks that replace the old exerciseStore fetch actions.
 *
 * staleTime: Infinity — exercises are reference/catalogue data that changes
 * very rarely (only when an admin updates them). The data is persisted to
 * MMKV via the global QueryClient persister, so it survives app restarts.
 * A background refetch is still triggered on every fresh app foreground
 * because TanStack Query refetches stale queries when the window regains
 * focus, but since staleTime is Infinity the cached value is rendered
 * instantly with zero loading flicker.
 *
 * Mutations (create / update / delete) live in the admin screens and call
 * the service directly, then invalidate this query to force a refetch.
 */

import { queryKeys } from '@/lib/queryKeys'
import {
	createExerciseService,
	deleteExerciseService,
	getAllExercisesService,
	getExerciseByIdService,
	updateExerciseService,
} from '@/services/exerciseService'
import type { Equipment } from '@/types/equipment'
import type { Exercise, ExerciseType } from '@/types/exercises'
import type { MuscleGroup } from '@/types/muscle-groups'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ─────────────────────────────────────────────────────────────────
// READ — full list
// ─────────────────────────────────────────────────────────────────

export function useExercises() {
	return useQuery<Exercise[]>({
		queryKey: queryKeys.exercises.all,
		queryFn: async () => {
			const res = await getAllExercisesService()
			return res.data ?? []
		},
		// Exercise catalogue rarely changes — treat as effectively permanent
		staleTime: Infinity,
	})
}

// ─────────────────────────────────────────────────────────────────
// READ — single exercise (useful for detail screens)
// ─────────────────────────────────────────────────────────────────

export function useExerciseById(id: string | undefined) {
	return useQuery<Exercise | null>({
		queryKey: queryKeys.exercises.byId(id!),
		queryFn: async () => {
			const res = await getExerciseByIdService(id!)
			return res.data ?? null
		},
		enabled: !!id,
		staleTime: Infinity,
	})
}

// ─────────────────────────────────────────────────────────────────
// WRITE — admin mutations (invalidate list after each operation)
// ─────────────────────────────────────────────────────────────────

export function useCreateExercise() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: FormData) => createExerciseService(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
		},
	})
}

export function useUpdateExercise() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: FormData }) => updateExerciseService(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
		},
	})
}

export function useDeleteExercise() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => deleteExerciseService(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
		},
	})
}
