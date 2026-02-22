import { zustandStorage } from '@/lib/storage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createActiveWorkoutSlice } from './workout/activeWorkoutSlice'
import { createHistorySlice } from './workout/historySlice'
import { createRestTimerSlice } from './workout/restTimerSlice'
import { WorkoutState } from './workout/types'

export * from './workout/types'

const initialState = {
	workoutLoading: false,
	workoutSaving: false,
	workout: null,
	workoutHistory: [],
	lastSyncedAt: null as number | null,

	rest: {
		seconds: null,
		startedAt: null,
		running: false,
	},
}

export const useWorkout = create<WorkoutState>()(
	persist(
		(...a) => ({
			...createHistorySlice(...a),
			...createActiveWorkoutSlice(...a),
			...createRestTimerSlice(...a),

			resetState: () => {
				const [set] = a
				set(initialState)
			},
		}),
		{
			name: 'workout-store',
			storage: zustandStorage,
			partialize: state => ({
				workout: state.workout,
				workoutHistory: state.workoutHistory,
			}),
			onRehydrateStorage: () => state => {
				// Convert ISO strings back to Date objects after rehydration
				if (state?.workout) {
					if (state.workout.startTime && typeof state.workout.startTime === 'string') {
						state.workout.startTime = new Date(state.workout.startTime)
					}
					if (state.workout.endTime && typeof state.workout.endTime === 'string') {
						state.workout.endTime = new Date(state.workout.endTime)
					}
					// Convert editedAt from ISO string to Date
					if (state.workout.editedAt && typeof state.workout.editedAt === 'string') {
						state.workout.editedAt = new Date(state.workout.editedAt)
					}
				}
			},
		}
	)
)
