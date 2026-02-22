import { toUTCISOString } from '@/utils/time'
import { create } from 'zustand'

export type Gender = 'male' | 'female' | 'other'
export type WeightUnit = 'kg' | 'lbs'
export type HeightUnit = 'cm' | 'inches'

interface OnboardingState {
	// Data
	gender: Gender | null
	dateOfBirth: Date | null
	weight: number | null // stored in kg
	height: number | null // stored in cm

	// UI preferences (not necessarily persisted to backend, but good for UI)
	weightUnit: WeightUnit
	heightUnit: HeightUnit

	// Actions
	setGender: (gender: Gender) => void
	setDateOfBirth: (date: Date) => void
	setWeight: (weight: number, unit: WeightUnit) => void
	setHeight: (height: number, unit: HeightUnit) => void

	setWeightUnit: (unit: WeightUnit) => void
	setHeightUnit: (unit: HeightUnit) => void

	reset: () => void

	// Helper to check if we have data to sync
	hasData: () => boolean

	// Helper to get payload for backend
	getPayload: () => {
		gender?: string
		dateOfBirth?: string
		weight?: number
		height?: number
	}
}

export const useOnboarding = create<OnboardingState>((set, get) => ({
	gender: null,
	dateOfBirth: null,
	weight: null,
	height: null,
	weightUnit: 'kg',
	heightUnit: 'cm',

	setGender: gender => set({ gender }),
	setDateOfBirth: date => {
		set({ dateOfBirth: date })
	},

	setWeight: (val, unit) => {
		let weightInKg = val
		if (unit === 'lbs') {
			weightInKg = val / 2.20462
		}
		set({ weight: weightInKg, weightUnit: unit })
	},

	setHeight: (val, unit) => {
		let heightInCm = val
		if (unit === 'inches') {
			heightInCm = val * 30.48
		}
		set({ height: heightInCm, heightUnit: unit })
	},

	setWeightUnit: unit => set({ weightUnit: unit }),
	setHeightUnit: unit => set({ heightUnit: unit }),

	reset: () =>
		set({
			gender: null,
			dateOfBirth: null,
			weight: null,
			height: null,
			weightUnit: 'kg',
			heightUnit: 'cm',
		}),

	hasData: () => {
		const s = get()
		return !!(s.gender || s.dateOfBirth || s.weight || s.height)
	},

	getPayload: () => {
		const s = get()
		return {
			...(s.gender && { gender: s.gender }),
			...(s.dateOfBirth && { dateOfBirth: toUTCISOString(s.dateOfBirth) }),
			...(s.weight && { weight: s.weight }),
			...(s.height && { height: s.height }),
			...(s.weightUnit && { weightUnit: s.weightUnit }),
			...(s.heightUnit && { heightUnit: s.heightUnit }),
		}
	},
}))
