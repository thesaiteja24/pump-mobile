export type WeightUnits = 'kg' | 'lbs'
export type LengthUnits = 'cm' | 'inches'
export type Gender = 'male' | 'female' | 'other'

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

export interface UserPreferences {
	preferredWeightUnit?: WeightUnits
	preferredLengthUnit?: LengthUnits
}

export interface BaseUser {
	id: string
	firstName: string | null
	lastName: string | null
	profilePicUrl: string | null
	followersCount: number
	followingCount: number
	isPro: boolean
	proSubscriptionType: string | null
}
export type PublicUser = BaseUser

export interface SelfUser extends BaseUser {
	email: string | null
	countryCode: string | null
	phone: string | null
	height: number | null
	weight: number | null
	preferredLengthUnit: LengthUnits
	preferredWeightUnit: WeightUnits
	dateOfBirth: string | null
	gender: string | null
	role: string
	privacyPolicyAcceptedAt: string
	privacyPolicyVersion: string
}

export type User = PublicUser | SelfUser

export type UpdateUserBody = {
	firstName?: string
	lastName?: string
	dateOfBirth?: string
	preferredWeightUnit?: 'kg' | 'lbs'
	preferredLengthUnit?: 'cm' | 'inches'
	height?: number
	weight?: number
	gender?: Gender
}
