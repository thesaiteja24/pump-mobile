import type { UserRole } from '@/types/auth'

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'other'

export type WeightUnits = 'kg' | 'lbs'

export type LengthUnits = 'cm' | 'inches'

export type FitnessGoal
  = | 'loseWeight'
    | 'gainMuscle'
    | 'improveEndurance'
    | 'improveFlexibility'
    | 'improveStrength'
    | 'improveOverallFitness'

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'

export type ActivityLevel
  = | 'sedentary'
    | 'lightlyActive'
    | 'moderatelyActive'
    | 'veryActive'
    | 'athlete'

export type TargetType = 'weight' | 'bodyFat'

export type EquipmentType
  = | 'bodyweight'
    | 'dumbbells'
    | 'barbells'
    | 'kettlebells'
    | 'resistanceBands'
    | 'machines'
    | 'other'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  profilePicUrl: string
  followersCount: number
  followingCount: number
  workoutsCount: number
  isPro: boolean
  proSubscriptionType: string | null
  email: string
  height: number | null
  weight: number | null
  preferredLengthUnit: LengthUnits
  preferredWeightUnit: WeightUnits
  dateOfBirth: string | null
  gender: Gender | null
  role: UserRole
  privacyPolicyAcceptedAt: string
  privacyPolicyVersion: string
  createdAt: string
  updatedAt: string
}

export interface NutritionPlan {
  id: string
  caloriesTarget: number | null
  proteinTarget: number | null
  carbsTarget: number | null
  fatsTarget: number | null
  calculatedTDEE: number | null
  deficitOrSurplus: number | null
  startDate: string
  createdAt: string
  updatedAt: string
}

export interface FitnessProfile {
  id: string
  fitnessGoal: FitnessGoal | null
  fitnessLevel: FitnessLevel | null
  injuries: string | null
  availableEquipment: EquipmentType[]
  targetDate: string | null
  targetWeight: number | null
  activityLevel: ActivityLevel | null
  targetBodyFat: number | null
  targetType: TargetType | null
  weeklyWeightChange: number | null
  nutritionPlan?: NutritionPlan | null
  createdAt: string
  updatedAt: string
}

export interface MeasurementMetrics {
  weight: number | null
  waist: number | null
  bodyFat: number | null
  leanBodyMass: number | null
  neck: number | null
  shoulders: number | null
  chest: number | null
  abdomen: number | null
  hips: number | null
  leftBicep: number | null
  rightBicep: number | null
  leftForearm: number | null
  rightForearm: number | null
  leftThigh: number | null
  rightThigh: number | null
  leftCalf: number | null
  rightCalf: number | null
}

export interface MeasurementEntry extends MeasurementMetrics {
  id: string
  date: string
  notes: string | null
  progressPicUrls: string[]
  createdAt: string
  updatedAt: string
}

export interface MeasurementsHistoryResponse {
  history: MeasurementEntry[]
  latestValues: Record<keyof MeasurementMetrics, number | null> | null
  dailyWeightChange: {
    diff: number
    isPositive: boolean
  } | null
}

export interface UserAnalytics {
  workoutsThisWeek: number
  weeklyVolume: number
  lastWeekVolume: number
  weeklyDuration: number
  lastWeekDuration: number
  weeklyReps: number
  lastWeekReps: number
  streakDays: number
  daysSinceLastWorkout: number
  workoutDates: string[]
}
