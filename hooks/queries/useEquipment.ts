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

/**
 * useEquipment / useEquipmentById
 *
 * TanStack Query hooks for equipment management.
 */

export function useEquipment() {
	return useQuery<Equipment[]>({
		queryKey: queryKeys.equipment.all,
		queryFn: async () => {
			const data = await getAllEquipmentService()
			return data ?? []
		},
		staleTime: Infinity,
	})
}

export function useEquipmentById(id: string | undefined) {
	return useQuery<Equipment | null>({
		queryKey: queryKeys.equipment.byId(id!),
		queryFn: async () => {
			const data = await getEquipmentByIdService(id!)
			return data ?? null
		},
		enabled: !!id,
		staleTime: Infinity,
	})
}

// MUTATIONS

export function useCreateEquipment() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (data: FormData) => createEquipmentService(data),

		onSuccess: () => {
			qc.invalidateQueries({ queryKey: queryKeys.equipment.root })
		},
	})
}

export function useUpdateEquipment() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: FormData }) => updateEquipmentService(id, data),

		onMutate: async ({ id, data }) => {
			await qc.cancelQueries({ queryKey: queryKeys.equipment.root })
			const previousAll = qc.getQueryData<Equipment[]>(queryKeys.equipment.all)
			const previousById = qc.getQueryData<Equipment>(queryKeys.equipment.byId(id))

			// Optimistic update
			if (previousAll) {
				const title = data.get('title') as string
				const type = data.get('type') as any

				qc.setQueryData<Equipment[]>(queryKeys.equipment.all, old =>
					old?.map(item =>
						item.id === id ? { ...item, ...(title && { title }), ...(type && { type }) } : item
					)
				)
			}

			return { previousAll, previousById }
		},

		onError: (_err, variables, context) => {
			if (context?.previousAll) {
				qc.setQueryData(queryKeys.equipment.all, context.previousAll)
			}
			if (context?.previousById) {
				qc.setQueryData(queryKeys.equipment.byId(variables.id), context.previousById)
			}
		},

		onSettled: (_data, _err, variables) => {
			qc.invalidateQueries({ queryKey: queryKeys.equipment.all })
			qc.invalidateQueries({ queryKey: queryKeys.equipment.byId(variables.id) })
		},
	})
}

export function useDeleteEquipment() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => deleteEquipmentService(id),

		onMutate: async id => {
			await qc.cancelQueries({ queryKey: queryKeys.equipment.root })
			const previousAll = qc.getQueryData<Equipment[]>(queryKeys.equipment.all)

			if (previousAll) {
				qc.setQueryData<Equipment[]>(queryKeys.equipment.all, old => old?.filter(item => item.id !== id))
			}

			return { previousAll }
		},

		onError: (_err, _id, context) => {
			if (context?.previousAll) {
				qc.setQueryData(queryKeys.equipment.all, context.previousAll)
			}
		},

		onSettled: () => {
			qc.invalidateQueries({ queryKey: queryKeys.equipment.root })
		},
	})
}
