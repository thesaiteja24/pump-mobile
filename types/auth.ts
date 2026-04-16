import type { Gender } from './onboarding'
import type { LengthUnits, WeightUnits } from './user'

export type FitnessGoal =
	| 'loseWeight'
	| 'gainMuscle'
	| 'improveEndurance'
	| 'improveFlexibility'
	| 'improveStrength'
	| 'improveOverallFitness'

export interface UserMeasurements {
	weight: number
	bodyFat: number
	leanBodyMass: number
	neck: number
	shoulders: number
	chest: number
	waist: number
	abdomen: number
	hips: number
	leftBicep: number
	rightBicep: number
	leftForearm: number
	rightForearm: number
	leftThigh: number
	rightThigh: number
	leftCalf: number
	rightCalf: number
	notes: string
	progressPics: string[]
}

export interface User {
	userId?: string
	countryCode?: string
	phone?: string
	phoneE164?: string
	email?: string
	googleId?: string
	firstName?: string
	lastName?: string
	dateOfBirth?: string | null
	gender?: Gender
	preferredWeightUnit?: WeightUnits
	preferredLengthUnit?: LengthUnits
	height?: number | null
	weight?: number | null
	profilePicUrl?: string | null
	role?: string
	privacyPolicyAcceptedAt?: string | null
	followersCount?: number
	followingCount?: number
	createdAt?: string
	updatedAt?: string
}
