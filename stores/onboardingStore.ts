import { toUTCISOString } from '@/utils/time'
import { FitnessLevel } from '@/types/program'
import type { Gender, HeightUnit, WeightUnit } from '@/types/onboarding'
import { create } from 'zustand'

interface OnboardingState {
	// Data
	gender: Gender | null
	dateOfBirth: Date | null
	weight: number | null // stored in kg
	height: number | null // stored in cm

	// Fitness Goals Data
	fitnessGoal:
		| 'loseWeight'
		| 'gainMuscle'
		| 'improveEndurance'
		| 'improveFlexibility'
		| 'improveStrength'
		| 'improveOverallFitness'
		| null
	targetType: 'weight' | 'bodyFat' | null
	targetWeight: number | null
	targetBodyFat: number | null
	activityLevel: 'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive' | 'athlete' | null
	fitnessLevel: FitnessLevel | null
	weeklyRate: number | null
	targetDate: Date | null

	// UI preferences (not necessarily persisted to backend, but good for UI)
	weightUnit: WeightUnit
	heightUnit: HeightUnit

	// Actions
	setGender: (gender: Gender) => void
	setDateOfBirth: (date: Date) => void
	setWeight: (weight: number, unit: WeightUnit) => void
	setHeight: (height: number, unit: HeightUnit) => void

	setFitnessGoal: (goal: OnboardingState['fitnessGoal']) => void
	setTargetType: (type: OnboardingState['targetType']) => void
	setTargetWeight: (weight: number, unit: WeightUnit) => void
	setTargetBodyFat: (bodyFat: number) => void
	setActivityLevel: (level: OnboardingState['activityLevel']) => void
	setFitnessLevel: (level: OnboardingState['fitnessLevel']) => void
	setWeeklyRate: (rate: number, unit: WeightUnit) => void
	setTargetDate: (date: Date | null) => void

	setWeightUnit: (unit: WeightUnit) => void
	setHeightUnit: (unit: HeightUnit) => void

	reset: () => void

	// Helper to check if we have data to sync
	hasData: () => boolean

	// Helper to get payload for backend
	getPayload: () => {
		gender?: Gender
		dateOfBirth?: string
		weight?: number
		height?: number
		weightUnit?: WeightUnit
		heightUnit?: HeightUnit
		fitnessProfile?: {
			fitnessGoal?: OnboardingState['fitnessGoal']
			targetType?: OnboardingState['targetType']
			targetWeight?: number
			targetBodyFat?: number
			activityLevel?: OnboardingState['activityLevel']
			fitnessLevel?: OnboardingState['fitnessLevel']
			weeklyWeightChange?: number
			targetDate?: string
		}
	}
}

export const useOnboarding = create<OnboardingState>((set, get) => ({
	gender: null,
	dateOfBirth: null,
	weight: null,
	height: null,
	fitnessGoal: null,
	targetType: null,
	targetWeight: null,
	targetBodyFat: null,
	activityLevel: null,
	fitnessLevel: null,
	weeklyRate: null,
	targetDate: null,
	weightUnit: 'kg',
	heightUnit: 'cm',

	setGender: gender => set({ gender }),
	setDateOfBirth: date => set({ dateOfBirth: date }),

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

	setFitnessGoal: goal => set({ fitnessGoal: goal }),
	setTargetType: type => set({ targetType: type }),

	setTargetWeight: (val, unit) => {
		let weightInKg = val
		if (unit === 'lbs') {
			weightInKg = val / 2.20462
		}
		set({ targetWeight: parseFloat(weightInKg.toFixed(2)) })
	},

	setTargetBodyFat: bodyFat => set({ targetBodyFat: bodyFat }),
	setActivityLevel: level => set({ activityLevel: level }),
	setFitnessLevel: level => set({ fitnessLevel: level }),

	setWeeklyRate: (val, unit) => {
		let rateInKg = val
		if (unit === 'lbs') {
			rateInKg = val / 2.20462
		}
		set({ weeklyRate: parseFloat(rateInKg.toFixed(2)) })
	},
	setTargetDate: date => set({ targetDate: date }),

	setWeightUnit: unit => set({ weightUnit: unit }),
	setHeightUnit: unit => set({ heightUnit: unit }),

	reset: () =>
		set({
			gender: null,
			dateOfBirth: null,
			weight: null,
			height: null,
			fitnessGoal: null,
			targetType: null,
			targetWeight: null,
			targetBodyFat: null,
			activityLevel: null,
			fitnessLevel: null,
			weeklyRate: null,
			targetDate: null,
			weightUnit: 'kg',
			heightUnit: 'cm',
		}),

	hasData: () => {
		const s = get()
		return !!(
			s.gender ||
			s.dateOfBirth ||
			s.weight ||
			s.height ||
			s.fitnessGoal ||
			s.activityLevel ||
			s.fitnessLevel
		)
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
			...((s.fitnessGoal ||
				s.targetType ||
				s.targetWeight ||
				s.targetBodyFat ||
				s.activityLevel ||
				s.fitnessLevel ||
				s.weeklyRate ||
				s.targetDate) && {
				fitnessProfile: {
					...(s.fitnessGoal && { fitnessGoal: s.fitnessGoal }),
					...(s.targetType && { targetType: s.targetType }),
					...(s.targetWeight && { targetWeight: s.targetWeight }),
					...(s.targetBodyFat && { targetBodyFat: s.targetBodyFat }),
					...(s.activityLevel && { activityLevel: s.activityLevel }),
					...(s.fitnessLevel && { fitnessLevel: s.fitnessLevel }),
					...(s.weeklyRate && { weeklyWeightChange: s.weeklyRate }),
					...(s.targetDate && { targetDate: toUTCISOString(s.targetDate) }),
				},
			}),
		}
	},
}))
