import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import { SyncStatus } from '@/types/sync'
import { getAllTemplatesService, getTemplateByIdService, getTemplateByShareIdService } from '@/services/templateService'
import { useAuth } from '@/stores/authStore'
import { WorkoutTemplate } from '@/types/template'
import { useQuery } from '@tanstack/react-query'

// ─────────────────────────────────────────────────────
// READ — templates list
//
// Important: Templates are OFFLINE-FIRST. The Zustand templateStore holds
// the authoritative local list (including pending/optimistic items). This
// query fetches the BACKEND list and the templateStore merges it with local
// pending items. We use a short staleTime so the list stays fresh.
// ─────────────────────────────────────────────────────
export function useTemplatesQuery() {
	const userId = useAuth(s => s.user?.userId)

	return useQuery({
		queryKey: queryKeys.templates.all(userId ?? ''),
		queryFn: async () => {
			if (!userId) return [] as WorkoutTemplate[]
			const res = await getAllTemplatesService()
			if (!res.success || !res.data) return [] as WorkoutTemplate[]
			return res.data.map((item: WorkoutTemplate) => ({
				...item,
				clientId: item.clientId,
				syncStatus: 'synced' as SyncStatus,
			})) as WorkoutTemplate[]
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
			return {
				...res.data,
				clientId: res.data.clientId,
				syncStatus: 'synced' as SyncStatus,
			} as WorkoutTemplate
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
		staleTime: 7 * 24 * 60 * 60 * 1000, // shared templates don't change often
		retry: 1,
	})
}

// ─────────────────────────────────────────────────────
// Cache helpers — called from templateStore after offline mutations
// Invalidates the TanStack Query cache so the next useTemplates call
// picks up the latest data from the backend after sync.
// ─────────────────────────────────────────────────────
export function invalidateTemplatesCache(userId: string) {
	queryClient.invalidateQueries({ queryKey: queryKeys.templates.all(userId) })
}

export function invalidateTemplateCache(id: string) {
	queryClient.invalidateQueries({ queryKey: queryKeys.templates.byId(id) })
}
