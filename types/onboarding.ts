import type { LengthUnits, WeightUnits } from './me'
import type { FitnessLevel } from './programs'

export type Gender = 'male' | 'female' | 'other'
export type WeightUnit = WeightUnits
export type HeightUnit = LengthUnits

export interface OnboardingStateShape {
  gender: Gender | null
  dateOfBirth: Date | null
  weight: number | null
  height: number | null
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
  activityLevel:
    | 'sedentary'
    | 'lightlyActive'
    | 'moderatelyActive'
    | 'veryActive'
    | 'athlete'
    | null
  fitnessLevel: FitnessLevel | null
  weeklyRate: number | null
  targetDate: Date | null
  weightUnit: WeightUnit
  heightUnit: HeightUnit
}
