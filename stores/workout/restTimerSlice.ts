import { StateCreator } from 'zustand'
import { RestState, WorkoutState } from './types'

export interface RestTimerSlice {
	rest: RestState
	startRestTimer: (seconds: number) => void
	stopRestTimer: () => void
	adjustRestTimer: (deltaSeconds: number) => void
	saveRestForSet: (exerciseId: string, setId: string, seconds: number) => void
}

export const createRestTimerSlice: StateCreator<WorkoutState, [], [], RestTimerSlice> = set => ({
	rest: {
		seconds: null,
		startedAt: null,
		running: false,
	},

	startRestTimer: seconds =>
		set({
			rest: {
				seconds,
				startedAt: Date.now(),
				running: true,
			},
		}),

	stopRestTimer: () =>
		set({
			rest: {
				seconds: null,
				startedAt: null,
				running: false,
			},
		}),

	adjustRestTimer: deltaSeconds =>
		set(state => {
			if (!state.rest.running || state.rest.seconds == null) return state

			return {
				rest: {
					...state.rest,
					seconds: Math.max(0, state.rest.seconds + deltaSeconds),
				},
			}
		}),

	saveRestForSet: (exerciseId, setId, seconds) =>
		set(state => {
			if (!state.workout) return state

			return {
				workout: {
					...state.workout,
					exercises: state.workout.exercises.map(ex =>
						ex.exerciseId === exerciseId
							? {
									...ex,
									sets: ex.sets.map(s => (s.id === setId ? { ...s, restSeconds: seconds } : s)),
								}
							: ex
					),
				},
			}
		}),
})
