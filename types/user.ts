export type WeightUnits = 'kg' | 'lbs'
export type LengthUnits = 'cm' | 'inches'

export interface UserPreferences {
	preferredWeightUnit?: WeightUnits
	preferredLengthUnit?: LengthUnits
}
