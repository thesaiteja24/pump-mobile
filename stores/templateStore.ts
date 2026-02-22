import { zustandStorage } from '@/lib/storage'
import { enqueueTemplateCreate, enqueueTemplateDelete, enqueueTemplateUpdate } from '@/lib/sync/queue'
import { SyncStatus } from '@/lib/sync/types'
import { getAllTemplatesService, getTemplateByShareIdService } from '@/services/templateService'
import { serializeTemplateForApi } from '@/utils/serializeForApi'
import * as Crypto from 'expo-crypto'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuth } from './authStore'
import { useExercise } from './exerciseStore'
import { DraftTemplate, TemplateExercise, TemplateSet, TemplateState, WorkoutTemplate } from './template/types'

// Initial State
const initialState = {
	templates: [],
	sharedTemplate: null,
	templateLoading: false,
	draftTemplate: null,
}

export const useTemplate = create<TemplateState>()(
	persist(
		(set, get) => ({
			...initialState,

			/**
			 * Fetch all templates from backend.
			 * Merges with pending local items to preserve optimistic updates.
			 */
			getAllTemplates: async () => {
				set({ templateLoading: true })

				try {
					const res = await getAllTemplatesService()

					if (res.success && res.data) {
						set(state => {
							// Keep pending local templates
							const pendingTemplates = state.templates.filter(t => t.syncStatus === 'pending')

							// Backend templates (synced)
							const backendTemplates = res.data.map((item: WorkoutTemplate) => ({
								...item,
								clientId: item.clientId,
								syncStatus: 'synced' as SyncStatus,
							}))

							// Deduplicate by clientId (local wins)
							const pendingClientIds = new Set(pendingTemplates.map(t => t.clientId))

							const mergedTemplates = [
								...pendingTemplates,
								...backendTemplates.filter((b: WorkoutTemplate) => !pendingClientIds.has(b.clientId)),
							]

							return {
								templates: mergedTemplates,
								templateLoading: false,
							}
						})
					} else {
						set({ templateLoading: false })
					}
				} catch (e) {
					// console.error("Failed to fetch templates", e);
					set({ templateLoading: false })
				}
			},

			setSharedTemplate: template => {
				set({ sharedTemplate: template })
			},

			/**
			 * Fetches the shared template using shareId
			 */
			getTemplateByShareId: async (shareId: string) => {
				try {
					const res = await getTemplateByShareIdService(shareId)

					if (!res.success) {
						set({ templateLoading: false })
						return
					}

					set(() => ({
						sharedTemplate: res.data,
						templateLoading: false,
					}))
				} catch (e) {
					console.error('Failed to fetch template', e)
					set({ templateLoading: false })
				}
			},

			/**
			 * Create template with offline-first support.
			 * 1. Generate clientId and add optimistically to local state
			 * 2. Enqueue for background sync
			 */
			createTemplate: async (data: DraftTemplate) => {
				const userId = useAuth.getState().user?.userId
				if (!userId) {
					return { success: false, error: 'No user logged in' }
				}

				// Generate clientId for offline tracking
				const clientId = data.clientId || Crypto.randomUUID()
				const now = new Date().toISOString()

				// Optimistic template item (fully typed)
				const optimisticTemplate: WorkoutTemplate = {
					clientId,
					id: clientId, // temporary until backend returns real ID
					syncStatus: 'pending',
					userId,
					title: data.title || 'Untitled Template',
					notes: data.notes,
					authorName:
						data.authorName || `${useAuth.getState().user?.firstName} ${useAuth.getState().user?.lastName}`,
					shareId: undefined,
					sourceShareId: data.sourceShareId,
					createdAt: now,
					updatedAt: now,
					exercises: data.exercises,
					exerciseGroups: data.exerciseGroups,
				}

				// Optimistic update: add to local state immediately
				set(state => ({
					templates: [optimisticTemplate, ...state.templates],
				}))

				// Serialize payload for background sync
				const payload = serializeTemplateForApi({
					...data,
					clientId,
					authorName: optimisticTemplate.authorName,
					userId,
				})

				enqueueTemplateCreate(payload, userId)

				return { success: true, id: clientId }
			},
			/**
			 * Save a shared template to the user's library.
			 * Can overwrite an existing template if overwriteId is provided.
			 */
			saveSharedTemplate: async (template: WorkoutTemplate, options?: { overwriteId?: string }) => {
				const userId = useAuth.getState().user?.userId
				if (!userId) {
					return { success: false, error: 'No user logged in' }
				}

				const { overwriteId } = options || {}
				const now = new Date().toISOString()

				const clientId = overwriteId
					? get().templates.find(t => t.id === overwriteId)?.clientId || overwriteId
					: Crypto.randomUUID()

				// Clone groups and exercises with new IDs
				const newGroups = template.exerciseGroups.map(g => ({
					...g,
					id: Crypto.randomUUID(),
				}))

				const groupMap = new Map<string, string>()
				template.exerciseGroups.forEach((g, i) => groupMap.set(g.id, newGroups[i].id))

				const newExercises = template.exercises.map(e => ({
					...e,
					id: Crypto.randomUUID(),
					exerciseGroupId: e.exerciseGroupId ? groupMap.get(e.exerciseGroupId) : undefined,
				}))

				const optimisticTemplate: WorkoutTemplate = {
					clientId,
					id: overwriteId || clientId,
					syncStatus: 'pending',
					userId,
					title: template.title,
					notes: template.notes,
					authorName: template.authorName || 'Unknown',
					shareId: overwriteId ? template.shareId : undefined,
					sourceShareId: template.shareId,
					exercises: newExercises,
					exerciseGroups: newGroups,
					createdAt: now,
					updatedAt: now,
				}

				if (overwriteId) {
					// Replace existing template
					set(state => ({
						templates: state.templates.map(t => (t.id === overwriteId ? optimisticTemplate : t)),
					}))
					enqueueTemplateUpdate(
						serializeTemplateForApi({
							...optimisticTemplate,
							clientId: optimisticTemplate.clientId || Crypto.randomUUID(), // <-- fix
						}),
						userId
					)
					return { success: true, id: overwriteId }
				} else {
					// New template
					set(state => ({
						templates: [optimisticTemplate, ...state.templates],
					}))
					enqueueTemplateCreate(
						serializeTemplateForApi({
							...optimisticTemplate,
							clientId: optimisticTemplate.clientId || Crypto.randomUUID(), // <-- fix
						}),
						userId
					)
					return { success: true, id: clientId }
				}
			},
			/**
			 * Update template with offline-first support.
			 * 1. Optimistic local update
			 * 2. Enqueue for background sync
			 */
			updateTemplate: async (id: string, data: Partial<WorkoutTemplate>) => {
				const userId = useAuth.getState().user?.userId
				if (!userId) {
					return { success: false, error: 'No user logged in' }
				}

				const template = get().templates.find(t => t.id === id)
				if (!template) return { success: false, error: 'Template not found' }

				const now = new Date().toISOString()

				// Merge data safely
				const updatedTemplate: WorkoutTemplate = {
					...template,
					...data,
					id: template.id, // never override
					clientId: template.clientId, // never override
					syncStatus: 'pending',
					updatedAt: now,
					authorName: data.authorName ?? template.authorName,
					exercises: data.exercises ?? template.exercises,
					exerciseGroups: data.exerciseGroups ?? template.exerciseGroups,
					title: data.title ?? template.title,
					notes: data.notes ?? template.notes,
					shareId: data.shareId ?? template.shareId,
					sourceShareId: data.sourceShareId ?? template.sourceShareId,
					userId: template.userId,
					createdAt: template.createdAt,
				}

				set(state => ({
					templates: state.templates.map(t => (t.id === id ? updatedTemplate : t)),
				}))

				enqueueTemplateUpdate(
					serializeTemplateForApi({
						...updatedTemplate,
						clientId: updatedTemplate.clientId || Crypto.randomUUID(), // <-- fix
					}),
					userId
				)

				return { success: true }
			},

			/**
			 * Delete template with offline-first support.
			 * 1. Optimistic removal from list
			 * 2. Enqueue for background sync if synced
			 */
			deleteTemplate: async id => {
				const userId = useAuth.getState().user?.userId
				if (!userId) {
					return { success: false, error: 'No user logged in' }
				}

				// Find template to get clientId and check sync status
				const template = get().templates.find(t => t.id === id)
				const clientId = template?.clientId || '' // It will be null if template is loaded from db

				// Optimistic update: remove from list immediately
				set(state => ({
					templates: state.templates.filter(t => t.id !== id),
				}))

				// when optimistic update is done then clientId and id will be same
				// when template is loaded from db then clientId is null and id is the db id
				const actualDbId = id === clientId ? null : id

				// Enqueue for background sync
				// Pass id as second arg. Logic in queue handles skipping if it's a local CREATE.
				enqueueTemplateDelete(clientId, actualDbId, userId)

				return { success: true }
			},

			startWorkoutFromTemplate: templateId => {
				const template = get().templates.find(t => t.id === templateId)
				if (!template) {
					console.error(`[Template] Template not found: ${templateId}`)
					// Note: Toast import would be needed here for user notification
					// For now, just log the error for debugging
					return
				}

				const { useWorkout } = require('./workoutStore')
				const { loadTemplate } = useWorkout.getState()
				loadTemplate(template)
			},

			// Validate template before saving (prune invalid groups only, allow empty sets)
			prepareTemplateForSave: () => {
				const draft = get().draftTemplate
				if (!draft) return null

				const exerciseStore = useExercise.getState()
				const exerciseMap = new Map(exerciseStore.exerciseList.map(e => [e.id, e]))

				let droppedExercises = 0
				let droppedGroups = 0

				// Filter exercises that exist (validate exercise IDs)
				const validExercises = draft.exercises.filter(ex => {
					const exists = exerciseMap.has(ex.exerciseId)
					if (!exists) {
						console.warn(`[Template] Exercise ${ex.exerciseId} not found, removing from template`)
						droppedExercises += 1
					}
					return exists
				})

				// Re-index exercises after filtering
				const reindexedExercises = validExercises.map((ex, index) => ({
					...ex,
					exerciseIndex: index,
				}))

				// Validate groups - must have at least 2 exercises
				const groupCounts = new Map<string, number>()
				for (const ex of reindexedExercises) {
					if (ex.exerciseGroupId) {
						groupCounts.set(ex.exerciseGroupId, (groupCounts.get(ex.exerciseGroupId) ?? 0) + 1)
					}
				}

				const validGroupIds = new Set(
					[...groupCounts.entries()].filter(([, count]) => count >= 2).map(([id]) => id)
				)

				droppedGroups =
					draft.exerciseGroups.length - draft.exerciseGroups.filter(g => validGroupIds.has(g.id)).length

				// Filter out invalid groups
				const finalGroups = draft.exerciseGroups.filter(g => validGroupIds.has(g.id))

				// Clear groupId from exercises in invalid groups
				const finalExercises = reindexedExercises.map(ex =>
					ex.exerciseGroupId && !validGroupIds.has(ex.exerciseGroupId)
						? { ...ex, exerciseGroupId: undefined }
						: ex
				)

				return {
					template: {
						...draft,
						exercises: finalExercises,
						exerciseGroups: finalGroups,
					},
					pruneReport: {
						droppedExercises,
						droppedGroups,
					},
				}
			},

			/* ───── Draft Actions ───── */

			startDraftTemplate: initialData => {
				set({
					draftTemplate: {
						clientId: Crypto.randomUUID(), // Generate clientId at creation
						title: '',
						userId: '', // Will be set when saving
						exercises: [],
						exerciseGroups: [],
						...initialData,
					},
				})
			},

			// Update template title and template note
			updateDraftTemplate: patch => {
				const draft = get().draftTemplate
				if (!draft) return
				set({ draftTemplate: { ...draft, ...patch } })
			},

			discardDraftTemplate: () => {
				set({ draftTemplate: null })
			},

			// add exercise to draft template
			addExerciseToDraft: exerciseId => {
				const draft = get().draftTemplate
				if (!draft) return

				// Check if exercise already exists in template
				if (draft.exercises.some(e => e.exerciseId === exerciseId)) {
					console.warn(`[Template] Exercise ${exerciseId} already exists in template`)
					return
				}

				// Check if exercise exists in exercise store
				const exerciseStore = useExercise.getState()
				const exerciseExists = exerciseStore.exerciseList.find(e => e.id === exerciseId)

				if (!exerciseExists) {
					console.error(`[Template] Exercise ${exerciseId} not found in exercise store`)
					return
				}

				const newExercise: TemplateExercise = {
					id: Crypto.randomUUID(),
					exerciseId,
					exerciseIndex: draft.exercises.length,
					sets: [],
				}

				set({
					draftTemplate: {
						...draft,
						exercises: [...draft.exercises, newExercise],
					},
				})
			},

			// remove exercise from draft template used in exercise editor and exercise screen
			removeExerciseFromDraft: exerciseId => {
				const draft = get().draftTemplate
				if (!draft) return

				// Find the exercise to check if it's in a group
				const targetExercise = draft.exercises.find(e => e.exerciseId === exerciseId)

				// Remove the exercise
				let newExercises = draft.exercises
					.filter(e => e.exerciseId !== exerciseId)
					.map((e, index) => ({ ...e, exerciseIndex: index }))

				let newGroups = draft.exerciseGroups

				// If exercise was in a group, validate the group is still valid
				if (targetExercise?.exerciseGroupId) {
					const groupId = targetExercise.exerciseGroupId
					const remainingInGroup = newExercises.filter(ex => ex.exerciseGroupId === groupId)

					// If group becomes invalid (<2 exercises), remove it
					if (remainingInGroup.length < 2) {
						newGroups = draft.exerciseGroups
							.filter(g => g.id !== groupId)
							.map((g, index) => ({ ...g, groupIndex: index }))

						// Clear groupId from orphaned exercise
						newExercises = newExercises.map(ex =>
							ex.exerciseGroupId === groupId ? { ...ex, exerciseGroupId: undefined } : ex
						)
					}
				}

				set({
					draftTemplate: {
						...draft,
						exercises: newExercises,
						exerciseGroups: newGroups,
					},
				})
			},

			// replace exercise in draft template used in exercise editor and exercise screen
			replaceDraftExercise: (oldId, newId) => {
				const draft = get().draftTemplate
				if (!draft) return

				const newExercises = draft.exercises.map(e =>
					e.exerciseId === oldId ? { ...e, exerciseId: newId } : e
				)

				set({
					draftTemplate: { ...draft, exercises: newExercises },
				})
			},

			// reorder exercises in draft template used in exercise editor and exercise screen
			reorderDraftExercises: ordered => {
				const draft = get().draftTemplate
				if (!draft) return

				set({
					draftTemplate: {
						...draft,
						exercises: ordered.map((e, index) => ({
							...e,
							exerciseIndex: index,
						})),
					},
				})
			},

			// add set to draft template used in exercise editor and exercise screen
			addSetToDraft: exerciseId => {
				const draft = get().draftTemplate
				if (!draft) return

				const newExercises = draft.exercises.map(e => {
					if (e.exerciseId === exerciseId) {
						const newSet: TemplateSet = {
							id: Crypto.randomUUID(),
							setIndex: e.sets.length,
							setType: 'working',
							weight: undefined,
							reps: undefined,
							rpe: undefined,
							durationSeconds: undefined,
							restSeconds: undefined,
							note: undefined,
						}
						return {
							...e,
							sets: [...e.sets, newSet],
						}
					}
					return e
				})

				set({
					draftTemplate: {
						...draft,
						exercises: newExercises,
					},
				})
			},

			// update set in draft template used in exercise editor and exercise screen
			updateDraftSet: (exerciseId, setId, patch) => {
				const draft = get().draftTemplate
				if (!draft) return

				const newExercises = draft.exercises.map(e => {
					if (e.exerciseId !== exerciseId) return e

					return {
						...e,
						sets: e.sets.map(s => (s.id === setId ? { ...s, ...patch } : s)),
					}
				})

				set({
					draftTemplate: { ...draft, exercises: newExercises },
				})
			},

			// remove set from draft template used in exercise editor and exercise screen
			removeSetFromDraft: (exerciseId, setId) => {
				const draft = get().draftTemplate
				if (!draft) return

				const newExercises = draft.exercises.map(e => {
					if (e.exerciseId !== exerciseId) return e

					return {
						...e,
						sets: e.sets.filter(s => s.id !== setId).map((s, idx) => ({ ...s, setIndex: idx })),
					}
				})

				set({
					draftTemplate: { ...draft, exercises: newExercises },
				})
			},

			// create exercise group in draft template used in exercise editor and exercise screen
			createDraftExerciseGroup: (exerciseIds, type) => {
				const draft = get().draftTemplate
				if (!draft) return

				const groupId = Crypto.randomUUID()

				set({
					draftTemplate: {
						...draft,
						exerciseGroups: [
							...draft.exerciseGroups,
							{
								id: groupId,
								groupType: type,
								groupIndex: draft.exerciseGroups.length,
								restSeconds: undefined,
							},
						],
						// Match input IDs against ITEM IDs (e.id) or REF IDs (e.exerciseId)?
						// Editor will pass ITEM IDs for precision.
						exercises: draft.exercises.map(ex =>
							exerciseIds.includes(ex.id) ? { ...ex, exerciseGroupId: groupId } : ex
						),
					},
				})
			},

			removeDraftExerciseGroup: groupId => {
				const draft = get().draftTemplate
				if (!draft) return

				// Remove group
				const newGroups = draft.exerciseGroups
					.filter(g => g.id !== groupId)
					.map((g, index) => ({ ...g, groupIndex: index }))

				// Clear groupId from exercises
				const newExercises = draft.exercises.map(ex =>
					ex.exerciseGroupId === groupId ? { ...ex, exerciseGroupId: undefined } : ex
				)

				set({
					draftTemplate: {
						...draft,
						exerciseGroups: newGroups,
						exercises: newExercises,
					},
				})
			},

			resetState: () => set({ ...initialState }),
		}),
		{
			name: 'template-store',
			storage: zustandStorage,
			partialize: state => ({ templates: state.templates }), // Don't persist draft
		}
	)
)
