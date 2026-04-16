/**
 * useEquipment / useEquipmentById
 *
 * TanStack Query hooks that replace the old equipmentStore fetch actions
 * (and the manual `lastSyncedAt` stale check it had).
 *
 * Same staleTime: Infinity rationale as exercises — equipment is reference
 * data that only changes when an admin edits it. The cache is persisted via
 * the global QueryClient persister (MMKV) so the list is instantly available
 * on every app restart without a network round-trip.
 */

import { queryKeys } from '@/lib/queryKeys'
import {
	createEquipmentService,
	deleteEquipmentService,
	getAllEquipmentService,
	getEquipmentByIdService,
	updateEquipmentService,
} from '@/services/equipmentService'
import type { Equipment } from '@/types/equipment'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ─────────────────────────────────────────────────────────────────
// READ — full list
// ─────────────────────────────────────────────────────────────────

export function useEquipment() {
	return useQuery<Equipment[]>({
		queryKey: queryKeys.equipment.all,
		queryFn: async () => {
			const res = await getAllEquipmentService()
			return res.data ?? []
		},
		staleTime: Infinity,
	})
}

// ─────────────────────────────────────────────────────────────────
// READ — single item
// ─────────────────────────────────────────────────────────────────

export function useEquipmentById(id: string | undefined) {
	return useQuery<Equipment | null>({
		queryKey: queryKeys.equipment.byId(id!),
		queryFn: async () => {
			const res = await getEquipmentByIdService(id!)
			return res.data ?? null
		},
		enabled: !!id,
		staleTime: Infinity,
	})
}

// ─────────────────────────────────────────────────────────────────
// WRITE — admin mutations
// ─────────────────────────────────────────────────────────────────

export function useCreateEquipment() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: FormData) => createEquipmentService(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all })
		},
	})
}

export function useUpdateEquipment() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: FormData }) => updateEquipmentService(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all })
		},
	})
}

export function useDeleteEquipment() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => deleteEquipmentService(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all })
		},
	})
}
