import { zustandStorage } from '@/lib/storage'
import { enqueueAnalyticsUpdate } from '@/lib/sync/queue/analyticsQueue'
import { AnalyticsPayload } from '@/lib/sync/types'
import { getMeasurementsService, getUserAnalyticsService } from '@/services/analyticsService'
import { useHabitStore } from './habitStore'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuth } from './authStore'

export interface AnalyticsMetrics {
	streakDays: number
	workoutsThisWeek: number
	daysSinceLastWorkout: number
	weeklyVolume: number
	lastWeekVolume: number
	workoutDates: Set<string>
}

export type MeasurementType = {
	id?: string
	date: string
	weight?: number | null
	bodyFat?: number | null
	waist?: number | null
	neck?: number | null
	shoulders?: number | null
	chest?: number | null
	leftBicep?: number | null
	rightBicep?: number | null
	leftForearm?: number | null
	rightForearm?: number | null
	abdomen?: number | null
	hips?: number | null
	leftThigh?: number | null
	rightThigh?: number | null
	leftCalf?: number | null
	rightCalf?: number | null
	notes?: string | null
	progressPicUrls?: string[]
}

type LatestMeasurements = Omit<MeasurementType, 'id' | 'date'>

interface AnalyticsState {
	fitnessProfile: any
	measurements: MeasurementType[]
	latestMeasurements: Partial<LatestMeasurements>
	dailyWeightChange: { diff: number; isPositive: boolean } | null
	nutritionPlan: any
	userAnalytics: AnalyticsMetrics | null
	isLoading: boolean
	error: string | null

	setFitnessProfile: (profile: any) => void
	setMeasurements: (measurements: MeasurementType[]) => void
	setNutritionPlan: (plan: any) => void
	setIsLoading: (loading: boolean) => void
	setError: (error: string | null) => void

	// Action methods to integrate with offline sync queue
	getMeasurements: () => Promise<any>
	getFitnessProfile: () => Promise<any>
	getNutritionPlan: () => Promise<any>
	getUserAnalytics: () => Promise<any>
	reconcileMeasurement: (queuePayloadDate: string, realBackendMeasurement: MeasurementType) => void
	updateFitnessProfile: (data: Partial<AnalyticsPayload>) => Promise<any>
	addMeasurement: (data: MeasurementType) => Promise<any>
	updateNutritionPlan: (data: Partial<AnalyticsPayload>) => Promise<any>
	resetState: () => void
}

const initialState = {
	fitnessProfile: null,
	measurements: [],
	latestMeasurements: {},
	dailyWeightChange: null,
	nutritionPlan: null,
	userAnalytics: null,
	isLoading: false,
	error: null,
}

export const useAnalytics = create<AnalyticsState>()(
	persist(
		(set, get) => ({
			...initialState,

			setFitnessProfile: profile => set({ fitnessProfile: profile }),
			setMeasurements: measurements => set({ measurements }),
			setNutritionPlan: plan => set({ nutritionPlan: plan }),
			setIsLoading: loading => set({ isLoading: loading }),
			setError: error => set({ error }),

			getMeasurements: async () => {
				set({ isLoading: true, error: null })
				try {
					const currentUser = useAuth.getState().user
					const userId = currentUser?.userId
					if (!userId) {
						set({ error: 'User not logged in', isLoading: false })
						return { success: false, error: 'User not logged in' }
					}

					const res = await getMeasurementsService(userId)
					if (!res.success) {
						const errMsg = res.message || res.errors?.[0]?.message || 'Failed to fetch measurements'
						set({ error: errMsg, isLoading: false })
						return { success: false, error: errMsg }
					}

					set({
						measurements: res.data?.history ?? [],
						latestMeasurements: res.data?.latestValues ?? {},
						dailyWeightChange: res.data?.dailyWeightChange ?? null,
						isLoading: false,
					})
					return { success: true }
				} catch (err) {
					set({ error: 'Unexpected error occurred', isLoading: false })
					return { success: false, error: err }
				}
			},

			getFitnessProfile: async () => {
				set({ isLoading: true, error: null })
				try {
					const currentUser = useAuth.getState().user
					const userId = currentUser?.userId
					if (!userId) {
						set({ error: 'User not logged in', isLoading: false })
						return { success: false, error: 'User not logged in' }
					}

					const { getFitnessProfileService } = require('@/services/analyticsService')
					const res = await getFitnessProfileService(userId)

					if (!res.success) {
						set({ error: res.message || 'Failed to fetch fitness profile', isLoading: false })
						return { success: false, error: res.message }
					}

					set({
						fitnessProfile: res.data ?? null,
						isLoading: false,
					})
					return { success: true }
				} catch (err) {
					set({ error: 'Unexpected error occurred', isLoading: false })
					return { success: false, error: err }
				}
			},

			getNutritionPlan: async () => {
				set({ isLoading: true, error: null })
				try {
					const currentUser = useAuth.getState().user
					const userId = currentUser?.userId
					if (!userId) {
						set({ error: 'User not logged in', isLoading: false })
						return { success: false, error: 'User not logged in' }
					}

					const { getNutritionPlanService } = require('@/services/analyticsService')
					const res = await getNutritionPlanService(userId)

					if (!res.success) {
						set({ error: res.message || 'Failed to fetch nutrition plan', isLoading: false })
						return { success: false, error: res.message }
					}

					set({
						nutritionPlan: res.data ?? null,
						isLoading: false,
					})
					return { success: true }
				} catch (err) {
					set({ error: 'Unexpected error occurred', isLoading: false })
					return { success: false, error: err }
				}
			},

			getUserAnalytics: async () => {
				set({ isLoading: true, error: null })
				try {
					const currentUser = useAuth.getState().user
					const userId = currentUser?.userId
					if (!userId) {
						set({ error: 'User not logged in', isLoading: false })
						return { success: false, error: 'User not logged in' }
					}

					const res = await getUserAnalyticsService(userId)
					if (!res.success) {
						set({ error: res.message || 'Failed to fetch analytics', isLoading: false })
						return { success: false, error: res.message }
					}

					const analyticsData = res.data
					// Convert workoutDates array to Set
					if (analyticsData && Array.isArray(analyticsData.workoutDates)) {
						analyticsData.workoutDates = new Set(analyticsData.workoutDates)
					}

					set({
						userAnalytics: analyticsData ?? null,
						isLoading: false,
					})
					return { success: true }
				} catch (err) {
					set({ error: 'Unexpected error occurred', isLoading: false })
					return { success: false, error: err }
				}
			},

			reconcileMeasurement: (queuePayloadDate: string, realBackendPayload: any) => {
				set(state => {
					const normalize = (d: string) => {
						if (!d) return ''
						const parsed = new Date(d)
						return isNaN(parsed.getTime()) ? d : parsed.toISOString().split('T')[0]
					}
					const normalizedQueueDate = normalize(queuePayloadDate)

					const existingDateIndex = state.measurements.findIndex(
						m => normalize(m.date) === normalizedQueueDate
					)

					if (existingDateIndex === -1) return state // Nothing to reconcile

					const updatedMeasurements = [...state.measurements]

					// Extract the corresponding measurement from the backend history payload
					const historyList = Array.isArray(realBackendPayload?.history) ? realBackendPayload.history : []
					const matchedBackendMeasurement =
						historyList.find((m: any) => normalize(m.date) === normalizedQueueDate) || historyList[0]

					if (matchedBackendMeasurement) {
						// Overwrite offline pessimistic object with validated backend data (containing id, etc)
						updatedMeasurements[existingDateIndex] = {
							...updatedMeasurements[existingDateIndex],
							...matchedBackendMeasurement,
						}
					}

					// We can also sync the latest values & daily change straight from the backend response.
					// NOTE: This assumes that there are no newer offline measurements waiting in the queue.
					// If there are, they will simply overwrite these when their own reconcile finishes.
					const newLatest = realBackendPayload?.latestValues
						? { ...state.latestMeasurements, ...realBackendPayload.latestValues }
						: state.latestMeasurements

					const newDailyChange =
						realBackendPayload?.dailyWeightChange !== undefined
							? realBackendPayload.dailyWeightChange
							: state.dailyWeightChange

					return {
						measurements: updatedMeasurements,
						latestMeasurements: newLatest,
						dailyWeightChange: newDailyChange,
					}
				})
			},

			updateFitnessProfile: async (data: Partial<AnalyticsPayload>) => {
				const currentUser = useAuth.getState().user
				const userId = currentUser?.userId
				if (!userId) return { success: false, error: 'User not logged in' }

				// Optimistic update
				set(state => ({
					fitnessProfile: {
						...state.fitnessProfile,
						...data,
					},
				}))

				const payload: AnalyticsPayload = {
					userId,
					...data,
				}

				console.log('Update Fitness Profile payload', JSON.stringify(payload))

				try {
					enqueueAnalyticsUpdate('UPDATE_FITNESS_PROFILE', payload, userId)
					return { success: true }
				} catch (error) {
					return { success: false, error }
				}
			},

			addMeasurement: async (data: MeasurementType & { progressPics?: any[] }) => {
				const currentUser = useAuth.getState().user
				const userId = currentUser?.userId
				if (!userId) return { success: false, error: 'User not logged in' }

				const payload: AnalyticsPayload = {
					userId,
					...data,
				}

				// Strip out progressPics for optimistic UI, map it to progressPicUrls
				const { progressPics, ...measurementData } = data
				if (progressPics && Array.isArray(progressPics)) {
					measurementData.progressPicUrls = progressPics.map(p => p.uri)
				}

				// Optimistic update
				set(state => {
					const normalize = (d: string) => {
						if (!d) return ''
						const parsed = new Date(d)
						return isNaN(parsed.getTime()) ? d : parsed.toISOString().split('T')[0]
					}
					const normalizedDataDate = normalize(measurementData.date)

					const existingDateIndex = state.measurements.findIndex(
						m => normalize(m.date) === normalizedDataDate
					)
					const updatedMeasurements = [...state.measurements]

					if (existingDateIndex !== -1) {
						// Overwrite the existing measurement for this date
						updatedMeasurements[existingDateIndex] = {
							...updatedMeasurements[existingDateIndex],
							...measurementData,
						}
					} else {
						// Append a new measurement
						updatedMeasurements.push(measurementData)
					}

					// Sort by date descending
					updatedMeasurements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

					const latestMeasurements: Partial<LatestMeasurements> = {}
					for (const entry of updatedMeasurements) {
						Object.entries(entry).forEach(([key, value]) => {
							if (
								key !== 'progressPicUrls' &&
								value !== null &&
								value !== undefined &&
								latestMeasurements[key as keyof typeof latestMeasurements] === undefined
							) {
								latestMeasurements[key as keyof typeof latestMeasurements] = value as any
							}
						})
					}

					// Optimistic Daily Weight Change
					let dailyWeightChange = state.dailyWeightChange
					const weightEntries = updatedMeasurements.filter(m => m.weight !== null && m.weight !== undefined)
					if (weightEntries.length >= 2) {
						const latestWeightRaw = weightEntries[0].weight
						const previousWeightRaw = weightEntries[1].weight
						if (latestWeightRaw != null && previousWeightRaw != null) {
							const latestWeight = Number(latestWeightRaw)
							const previousWeight = Number(previousWeightRaw)
							dailyWeightChange = {
								diff: Math.abs(latestWeight - previousWeight),
								isPositive: latestWeight > previousWeight,
							}
						}
					}

					return {
						measurements: updatedMeasurements,
						latestMeasurements,
						dailyWeightChange,
					}
				})

				try {
					enqueueAnalyticsUpdate('ADD_MEASUREMENT', payload, userId)

					// Optimistically update the auth store so the dashboard updates weight immediately
					if (payload.weight != null) {
						useAuth.getState().setUser({ weight: payload.weight })
					}
					// Refetch habit logs if any internal metric is updated
					if (payload.weight != null || payload.bodyFat != null || payload.waist != null) {
						useHabitStore.getState().getHabitLogs()
					}

					return { success: true }
				} catch (error) {
					return { success: false, error }
				}
			},

			updateNutritionPlan: async (data: Partial<AnalyticsPayload>) => {
				const currentUser = useAuth.getState().user
				const userId = currentUser?.userId
				if (!userId) return { success: false, error: 'User not logged in' }

				// Optimistic update
				set(state => ({
					nutritionPlan: {
						...state.nutritionPlan,
						...data,
					},
				}))

				const payload: AnalyticsPayload = {
					userId,
					...data,
				}

				console.log('Update Nutrition Plan payload', JSON.stringify(payload))

				try {
					enqueueAnalyticsUpdate('UPDATE_NUTRITION_PLAN', payload, userId)
					return { success: true }
				} catch (error) {
					return { success: false, error }
				}
			},

			resetState: () => set(initialState),
		}),
		{
			name: 'analytics-store',
			storage: zustandStorage,
			partialize: state => ({
				fitnessProfile: state.fitnessProfile,
				measurements: state.measurements,
				latestMeasurements: state.latestMeasurements,
				nutritionPlan: state.nutritionPlan,
			}),
		}
	)
)
