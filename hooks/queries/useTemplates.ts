import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import {
	createTemplateService,
	deleteTemplateService,
	getAllTemplatesService,
	getTemplateByIdService,
	getTemplateByShareIdService,
	updateTemplateService,
} from '@/services/templateService'
import { useAuth } from '@/stores/authStore'
import { DraftTemplate, WorkoutTemplate } from '@/types/template'
import { serializeTemplateForApi } from '@/utils/serializeForApi'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ─────────────────────────────────────────────────────
// READ — templates list
// ─────────────────────────────────────────────────────
export function useTemplatesQuery() {
	const userId = useAuth(s => s.user?.userId)

	return useQuery({
		queryKey: queryKeys.templates.all(userId ?? ''),
		queryFn: async () => {
			if (!userId) return [] as WorkoutTemplate[]
			const res = await getAllTemplatesService()
			if (!res.success || !res.data) return [] as WorkoutTemplate[]
			return res.data as WorkoutTemplate[]
		},
		enabled: !!userId,
		staleTime: 7 * 24 * 60 * 60 * 1000,
	})
}

// ─────────────────────────────────────────────────────
// READ — single template by id
// ─────────────────────────────────────────────────────
export function useTemplateByIdQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: queryKeys.templates.byId(id ?? ''),
		queryFn: async () => {
			const res = await getTemplateByIdService(id!)
			if (!res.success || !res.data) return null
			return res.data as WorkoutTemplate
		},
		enabled: Boolean(id),
		staleTime: 7 * 24 * 60 * 60 * 1000,
	})
}

// ─────────────────────────────────────────────────────
// READ — shared template by shareId (public, no auth required)
// ─────────────────────────────────────────────────────
export function useTemplateByShareIdQuery(shareId: string | null | undefined) {
	return useQuery({
		queryKey: queryKeys.templates.byShareId(shareId ?? ''),
		queryFn: async () => {
			const res = await getTemplateByShareIdService(shareId!)
			if (!res.success || !res.data) return null
			return res.data as WorkoutTemplate
		},
		enabled: Boolean(shareId),
		staleTime: 7 * 24 * 60 * 60 * 1000,
		retry: 1,
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — create template
// ─────────────────────────────────────────────────────
export function useCreateTemplateMutation() {
	const userId = useAuth.getState().user?.userId
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (draft: DraftTemplate) => {
			const uid = useAuth.getState().user?.userId || ''
			const payload = serializeTemplateForApi({
				...draft,
				authorName:
					draft.authorName ||
					`${useAuth.getState().user?.firstName ?? ''} ${useAuth.getState().user?.lastName ?? ''}`.trim(),
				userId: uid,
			})
			return createTemplateService(payload)
		},
		onSuccess: () => {
			if (userId) {
				qc.invalidateQueries({ queryKey: queryKeys.templates.all(userId) })
			}
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — update template
// ─────────────────────────────────────────────────────
export function useUpdateTemplateMutation() {
	const userId = useAuth.getState().user?.userId
	const qc = useQueryClient()

	return useMutation({
		mutationFn: ({ id, draft }: { id: string; draft: DraftTemplate }) => {
			const payload = serializeTemplateForApi(draft)
			return updateTemplateService(id, payload)
		},
		onSuccess: (_res, { id }) => {
			qc.invalidateQueries({ queryKey: queryKeys.templates.byId(id) })
			if (userId) {
				qc.invalidateQueries({ queryKey: queryKeys.templates.all(userId) })
			}
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — delete template
// ─────────────────────────────────────────────────────
export function useDeleteTemplateMutation() {
	const userId = useAuth.getState().user?.userId
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => deleteTemplateService(id),
		onMutate: async (id: string) => {
			if (!userId) return
			// Optimistic removal from list cache
			await qc.cancelQueries({ queryKey: queryKeys.templates.all(userId) })
			const previous = qc.getQueryData<WorkoutTemplate[]>(queryKeys.templates.all(userId))
			qc.setQueryData<WorkoutTemplate[]>(
				queryKeys.templates.all(userId),
				old => (old ?? []).filter(t => t.id !== id)
			)
			return { previous }
		},
		onError: (_err, _id, ctx: any) => {
			if (userId && ctx?.previous) {
				qc.setQueryData(queryKeys.templates.all(userId), ctx.previous)
			}
		},
		onSettled: (_res, _err, id) => {
			if (userId) {
				qc.invalidateQueries({ queryKey: queryKeys.templates.all(userId) })
			}
			qc.invalidateQueries({ queryKey: queryKeys.templates.byId(id) })
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — save shared template to user's library
// ─────────────────────────────────────────────────────
export function useSaveSharedTemplateMutation() {
	const userId = useAuth.getState().user?.userId
	const qc = useQueryClient()

	return useMutation({
		mutationFn: ({
			template,
			overwriteId,
		}: {
			template: WorkoutTemplate
			overwriteId?: string
		}) => {
			const uid = useAuth.getState().user?.userId || ''
			const payload = serializeTemplateForApi({
				...template,
				clientId: overwriteId ?? '',
				id: overwriteId ?? null,
				userId: uid,
				sourceShareId: template.shareId,
			})
			if (overwriteId) {
				return updateTemplateService(overwriteId, payload)
			}
			return createTemplateService(payload)
		},
		onSuccess: () => {
			if (userId) {
				qc.invalidateQueries({ queryKey: queryKeys.templates.all(userId) })
			}
		},
	})
}

// ─────────────────────────────────────────────────────
// Cache helpers (still useful for external invalidation)
// ─────────────────────────────────────────────────────
export function invalidateTemplatesCache(userId: string) {
	queryClient.invalidateQueries({ queryKey: queryKeys.templates.all(userId) })
}

export function invalidateTemplateCache(id: string) {
	queryClient.invalidateQueries({ queryKey: queryKeys.templates.byId(id) })
}
