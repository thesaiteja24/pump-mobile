import { Exercise } from '@/types/exercises'
import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import * as Crypto from 'expo-crypto'
import { create } from 'zustand'
import {
  DraftTemplate,
  TemplateExercise,
  TemplateSet,
  TemplateState,
  WorkoutTemplate,
} from '@/types/templates'

// Initial State — draft only; templates list lives in TanStack Query cache
const initialState = {
  draftTemplate: null as DraftTemplate | null,
}

export const useTemplate = create<TemplateState>()((set, get) => ({
  ...initialState,

  /**
   * Start a workout from a template.
   * The template object is passed directly (from TQ cache) so we don't need
   * to look it up from a local templates array.
   */
  startWorkoutFromTemplate: (templateId, template?: WorkoutTemplate) => {
    if (!template) {
      console.error(`[Template] Template not found: ${templateId}`)
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

    // Read exercise list from TanStack Query cache
    const exerciseList = queryClient.getQueryData<Exercise[]>(queryKeys.exercises.all) ?? []
    const exerciseMap = new Map(exerciseList.map((e) => [e.id, e]))

    let droppedExercises = 0
    let droppedGroups = 0

    // Filter exercises that exist (validate exercise IDs)
    const validExercises = draft.exercises.filter((ex) => {
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
      [...groupCounts.entries()].filter(([, count]) => count >= 2).map(([id]) => id),
    )

    droppedGroups =
      draft.exerciseGroups.length -
      draft.exerciseGroups.filter((g) => validGroupIds.has(g.id)).length

    // Filter out invalid groups
    const finalGroups = draft.exerciseGroups.filter((g) => validGroupIds.has(g.id))

    // Clear groupId from exercises in invalid groups
    const finalExercises = reindexedExercises.map((ex) =>
      ex.exerciseGroupId && !validGroupIds.has(ex.exerciseGroupId)
        ? { ...ex, exerciseGroupId: undefined }
        : ex,
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

  startDraftTemplate: (initialData) => {
    set({
      draftTemplate: {
        clientId: Crypto.randomUUID(),
        title: '',
        userId: '', // Will be set when saving
        exercises: [],
        exerciseGroups: [],
        ...initialData,
      },
    })
  },

  // Update template title and template note
  updateDraftTemplate: (patch) => {
    const draft = get().draftTemplate
    if (!draft) return
    set({ draftTemplate: { ...draft, ...patch } })
  },

  discardDraftTemplate: () => {
    set({ draftTemplate: null })
  },

  // add exercise to draft template
  addExerciseToDraft: (exerciseId) => {
    const draft = get().draftTemplate
    if (!draft) return

    // Check if exercise already exists in template
    if (draft.exercises.some((e) => e.exerciseId === exerciseId)) {
      console.warn(`[Template] Exercise ${exerciseId} already exists in template`)
      return
    }

    // Read exercise list from TanStack Query cache
    const exerciseList = queryClient.getQueryData<Exercise[]>(queryKeys.exercises.all) ?? []
    const exerciseExists = exerciseList.find((e) => e.id === exerciseId)

    if (!exerciseExists) {
      console.error(`[Template] Exercise ${exerciseId} not found in exercise cache`)
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

  // remove exercise from draft template
  removeExerciseFromDraft: (exerciseId) => {
    const draft = get().draftTemplate
    if (!draft) return

    // Find the exercise to check if it's in a group
    const targetExercise = draft.exercises.find((e) => e.exerciseId === exerciseId)

    // Remove the exercise
    let newExercises = draft.exercises
      .filter((e) => e.exerciseId !== exerciseId)
      .map((e, index) => ({ ...e, exerciseIndex: index }))

    let newGroups = draft.exerciseGroups

    // If exercise was in a group, validate the group is still valid
    if (targetExercise?.exerciseGroupId) {
      const groupId = targetExercise.exerciseGroupId
      const remainingInGroup = newExercises.filter((ex) => ex.exerciseGroupId === groupId)

      // If group becomes invalid (<2 exercises), remove it
      if (remainingInGroup.length < 2) {
        newGroups = draft.exerciseGroups
          .filter((g) => g.id !== groupId)
          .map((g, index) => ({ ...g, groupIndex: index }))

        // Clear groupId from orphaned exercise
        newExercises = newExercises.map((ex) =>
          ex.exerciseGroupId === groupId ? { ...ex, exerciseGroupId: undefined } : ex,
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

  // replace exercise in draft template
  replaceDraftExercise: (oldId, newId) => {
    const draft = get().draftTemplate
    if (!draft) return

    const newExercises = draft.exercises.map((e) =>
      e.exerciseId === oldId ? { ...e, exerciseId: newId } : e,
    )

    set({
      draftTemplate: { ...draft, exercises: newExercises },
    })
  },

  // reorder exercises in draft template
  reorderDraftExercises: (ordered) => {
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

  // add set to draft template
  addSetToDraft: (exerciseId) => {
    const draft = get().draftTemplate
    if (!draft) return

    const newExercises = draft.exercises.map((e) => {
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

  // update set in draft template
  updateDraftSet: (exerciseId, setId, patch) => {
    const draft = get().draftTemplate
    if (!draft) return

    const newExercises = draft.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e

      return {
        ...e,
        sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
      }
    })

    set({
      draftTemplate: { ...draft, exercises: newExercises },
    })
  },

  // remove set from draft template
  removeSetFromDraft: (exerciseId, setId) => {
    const draft = get().draftTemplate
    if (!draft) return

    const newExercises = draft.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e

      return {
        ...e,
        sets: e.sets.filter((s) => s.id !== setId).map((s, idx) => ({ ...s, setIndex: idx })),
      }
    })

    set({
      draftTemplate: { ...draft, exercises: newExercises },
    })
  },

  // create exercise group in draft template
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
        exercises: draft.exercises.map((ex) =>
          exerciseIds.includes(ex.id) ? { ...ex, exerciseGroupId: groupId } : ex,
        ),
      },
    })
  },

  removeDraftExerciseGroup: (groupId) => {
    const draft = get().draftTemplate
    if (!draft) return

    // Remove group
    const newGroups = draft.exerciseGroups
      .filter((g) => g.id !== groupId)
      .map((g, index) => ({ ...g, groupIndex: index }))

    // Clear groupId from exercises
    const newExercises = draft.exercises.map((ex) =>
      ex.exerciseGroupId === groupId ? { ...ex, exerciseGroupId: undefined } : ex,
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
}))
