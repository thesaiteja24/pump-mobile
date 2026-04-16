/**
 * Template Reconciler
 *
 * Handles state reconciliation after sync operations.
 * Updates local state with backend responses.
 */

import { useTemplate } from '@/stores/templateStore'
import { SyncStatus } from '@/types/sync'

/**
 * Reconcile a template's ID after successful CREATE sync.
 * Updates the local template with the backend-generated ID.
 */
export function reconcileTemplateId(clientId: string, dbId: string): void {
	const state = useTemplate.getState()
	const templates = state.templates

	const updatedTemplates = templates.map(item => {
		if ((item as any).clientId === clientId) {
			return {
				...item,
				id: dbId,
				syncStatus: 'synced' as SyncStatus,
			}
		}
		return item
	})

	useTemplate.setState({ templates: updatedTemplates as any })

	// Update references in other stores
	updateTemplateReferencesInPrograms(clientId, dbId)
}

/**
 * Reconcile a template with full backend data after successful UPDATE/CREATE.
 * Replaces the local item with the backend version, preserving clientId.
 */
export function reconcileTemplate(clientId: string, backendTemplate: any): void {
	const state = useTemplate.getState()
	const templates = state.templates

	const updatedTemplates = templates.map(item => {
		if ((item as any).clientId === clientId) {
			return {
				...item, // Keep existing fields as base
				...backendTemplate, // Overwrite with backend data
				// Explicitly preserve arrays if missing in backend response
				exercises: backendTemplate.exercises ?? item.exercises,
				exerciseGroups: backendTemplate.exerciseGroups ?? item.exerciseGroups,
				clientId: clientId, // Ensure clientId is preserved
				syncStatus: 'synced' as SyncStatus,
			}
		}
		return item
	})

	useTemplate.setState({ templates: updatedTemplates as any })

	// Update references in other stores
	if (backendTemplate.id) {
		updateTemplateReferencesInPrograms(clientId, backendTemplate.id)
	}
}

/**
 * Update sync status for a template by clientId
 */
export function updateTemplateSyncStatus(clientId: string, syncStatus: SyncStatus): void {
	const state = useTemplate.getState()
	const templates = state.templates

	const updatedTemplates = templates.map(item => {
		if ((item as any).clientId === clientId) {
			return { ...item, syncStatus }
		}
		return item
	})

	useTemplate.setState({ templates: updatedTemplates as any })
}

/**
 * Remove a template from local state by clientId (for failed items or rollback)
 */
export function removeTemplateByClientId(clientId: string): void {
	const state = useTemplate.getState()
	const updatedTemplates = state.templates.filter(item => (item as any).clientId !== clientId)
	useTemplate.setState({ templates: updatedTemplates })
}

/**
 * Mark template as synced after successful UPDATE
 */
export function markTemplateSynced(clientId: string): void {
	updateTemplateSyncStatus(clientId, 'synced')
}

/**
 * Mark template as failed after sync failure
 */
export function markTemplateFailed(clientId: string): void {
	updateTemplateSyncStatus(clientId, 'failed')
}

/**
 * Internal HELPER: Update any references to a template's clientId with the new dbId in the program draft.
 */
function updateTemplateReferencesInPrograms(clientId: string, dbId: string): void {
	try {
		const { useProgram } = require('@/stores/programStore')
		const programState = useProgram.getState()
		const draftProgram = programState.draftProgram

		if (draftProgram && draftProgram.weeks) {
			let updated = false
			const updatedWeeks = draftProgram.weeks.map((week: any) => {
				const updatedDays = week.days.map((day: any) => {
					if (!day.isRestDay && day.templateId === clientId) {
						updated = true
						return { ...day, templateId: dbId }
					}
					return day
				})
				return { ...week, days: updatedDays }
			})

			if (updated) {
				programState.updateDraftProgram({ weeks: updatedWeeks })
				console.info(`[Sync] Updated template references in draft program: ${clientId} -> ${dbId}`)
			}
		}
	} catch (e) {
		// Program store might not be available or initialized, ignore
		// console.error('[Sync] Failed to update template references in programs', e)
	}
}
