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

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'

export type ActivityLevel =
  | 'sedentary'
  | 'lightlyActive'
  | 'moderatelyActive'
  | 'veryActive'
  | 'athlete'

export type TargetType = 'weight' | 'bodyFat'

export interface FitnessProfile {
  fitnessGoal: FitnessGoal | null
  fitnessLevel: FitnessLevel | null
  activityLevel: ActivityLevel | null
  targetType: TargetType | null
  targetWeight: number | null
  targetBodyFat: number | null
  targetDate: string | null
  weeklyWeightChange: number | null
  injuries: string | null
  availableEquipment: []
  updatedAt: string | null
}

export type UpdateFitnessProfileBody = Partial<FitnessProfile>

export interface NutritionPlan {
  id: string
  userId: string
  caloriesTarget: number | null
  proteinTarget: number | null
  fatsTarget: number | null
  carbsTarget: number | null
  calculatedTDEE: number | null
  deficitOrSurplus: number | null
  startDate: string | null
  createdAt: string
  updatedAt: string
}

export type UpdateNutritionPlanBody = Partial<
  Omit<NutritionPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>

export interface Measurements {
  id: string
  date: string
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
  notes: number | null
  progressPicUrls: string[]
}

export type LatestMeasurements = Omit<Measurements, 'id' | 'date'>

export interface MeasurementsQueryData {
  history: Measurements[]
  latestValues: Partial<LatestMeasurements>
  dailyWeightChange: { diff: number; isPositive: boolean } | null
}

export interface AnalyticsMetrics {
  streakDays: number
  workoutsThisWeek: number
  daysSinceLastWorkout: number
  weeklyVolume: number
  lastWeekVolume: number
  weeklyDuration: number
  lastWeekDuration: number
  weeklyReps: number
  lastWeekReps: number
  workoutDates: string[]
}

export type TrainingAnalyticsItem = {
  date: string
  value: number
}

export type TrainingAnalytics = {
  volume: TrainingAnalyticsItem[]
  duration: TrainingAnalyticsItem[]
  reps: TrainingAnalyticsItem[]
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

export type AddMeasurementPayload = Partial<Measurements> & {
  progressPics?: { uri: string; name?: string; type?: string }[]
}
