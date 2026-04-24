import { queryKeys } from '@/lib/queryKeys'
import {
	createMetaService,
	deleteMetaService,
	getAllMetaService,
	getMetaByIdService,
	updateMetaService,
} from '@/services/metaService'
import { MetaItem, MetaResource } from '@/types/meta'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Generic Meta Hooks
 * Handles both equipment and muscle-groups
 */

export function useMeta(resource: MetaResource) {
	return useQuery<MetaItem[]>({
		queryKey: queryKeys.meta.all(resource),
		queryFn: () => getAllMetaService(resource),
		staleTime: Infinity,
	})
}

export function useMetaById(resource: MetaResource, id: string | undefined) {
	return useQuery<MetaItem | null>({
		queryKey: queryKeys.meta.byId(resource, id!),
		queryFn: () => getMetaByIdService(resource, id!),
		enabled: !!id,
		staleTime: Infinity,
	})
}

// ─────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────

export function useCreateMeta(resource: MetaResource) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (data: FormData) => createMetaService(resource, data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: queryKeys.meta.resource(resource) })
		},
	})
}

export function useUpdateMeta(resource: MetaResource) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: FormData }) => updateMetaService(resource, id, data),

		onMutate: async ({ id, data }) => {
			await qc.cancelQueries({ queryKey: queryKeys.meta.resource(resource) })
			const previousAll = qc.getQueryData<MetaItem[]>(queryKeys.meta.all(resource))
			const previousById = qc.getQueryData<MetaItem>(queryKeys.meta.byId(resource, id))

			// Optimistic update
			if (previousAll) {
				const title = data.get('title') as string
				const type = data.get('type') as any // Only relevant for equipment

				qc.setQueryData<MetaItem[]>(queryKeys.meta.all(resource), old =>
					old?.map(item =>
						item.id === id
							? {
									...item,
									...(title && { title }),
									...(resource === 'equipment' && type && { type }),
								}
							: item
					)
				)
			}

			return { previousAll, previousById }
		},

		onError: (_err, variables, context) => {
			if (context?.previousAll) {
				qc.setQueryData(queryKeys.meta.all(resource), context.previousAll)
			}
			if (context?.previousById) {
				qc.setQueryData(queryKeys.meta.byId(resource, variables.id), context.previousById)
			}
		},

		onSettled: (_data, _err, variables) => {
			qc.invalidateQueries({ queryKey: queryKeys.meta.all(resource) })
			qc.invalidateQueries({ queryKey: queryKeys.meta.byId(resource, variables.id) })
		},
	})
}

export function useDeleteMeta(resource: MetaResource) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => deleteMetaService(resource, id),

		onMutate: async id => {
			await qc.cancelQueries({ queryKey: queryKeys.meta.resource(resource) })
			const previousAll = qc.getQueryData<MetaItem[]>(queryKeys.meta.all(resource))

			if (previousAll) {
				qc.setQueryData<MetaItem[]>(queryKeys.meta.all(resource), old => old?.filter(item => item.id !== id))
			}

			return { previousAll }
		},

		onError: (_err, _id, context) => {
			if (context?.previousAll) {
				qc.setQueryData(queryKeys.meta.all(resource), context.previousAll)
			}
		},

		onSettled: () => {
			qc.invalidateQueries({ queryKey: queryKeys.meta.resource(resource) })
		},
	})
}

/**
 * DX Aliases for backward compatibility and clean usage
 */

export const useEquipment = () => useMeta('equipment')
export const useEquipmentById = (id: string | undefined) => useMetaById('equipment', id)
export const useCreateEquipment = () => useCreateMeta('equipment')
export const useUpdateEquipment = () => useUpdateMeta('equipment')
export const useDeleteEquipment = () => useDeleteMeta('equipment')

export const useMuscleGroups = () => useMeta('muscle-groups')
export const useMuscleGroupById = (id: string | undefined) => useMetaById('muscle-groups', id)
export const useCreateMuscleGroup = () => useCreateMeta('muscle-groups')
export const useUpdateMuscleGroup = () => useUpdateMeta('muscle-groups')
export const useDeleteMuscleGroup = () => useDeleteMeta('muscle-groups')
