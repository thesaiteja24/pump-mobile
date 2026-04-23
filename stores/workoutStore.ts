import { zustandStorage } from '@/lib/storage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createActiveWorkoutSlice } from './workout/activeWorkoutSlice'
import { createRestTimerSlice } from './workout/restTimerSlice'
import { WorkoutState } from '@/types/workout'

const initialState = {
	workoutSaving: false,
	workout: null,
	rest: {
		seconds: null,
		startedAt: null,
		running: false,
	},
}

export const useWorkout = create<WorkoutState>()(
	persist(
		(...a) => ({
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
			// Only persist the in-progress workout so it survives app restarts/crashes.
			// Workout history is entirely managed by TanStack Query cache.
			partialize: state => ({
				workout: state.workout,
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
					if (state.workout.editedAt && typeof state.workout.editedAt === 'string') {
						state.workout.editedAt = new Date(state.workout.editedAt)
					}
				}
			},
		}
	)
)
