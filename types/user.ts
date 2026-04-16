export type WeightUnits = 'kg' | 'lbs'
export type LengthUnits = 'cm' | 'inches'

export interface SearchedUser {
	id: string
	firstName: string
	lastName: string
	profilePicUrl: string | null
	isFollowing?: boolean
}

export interface UserPreferences {
	preferredWeightUnit?: WeightUnits
	preferredLengthUnit?: LengthUnits
}
