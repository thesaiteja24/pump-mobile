export type HabitFooterType = 'weeklyStreak' | 'weeklyCount'
export type HabitTrackingType = 'streak' | 'quantity'
export type HabitSourceType = 'manual' | 'internal'
export type HabitColorScheme = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'orange'
export type InternalMetricId = 'weight' | 'workout' | 'bodyFat' | 'waist'

export interface HabitType {
  id: string
  title: string
  colorScheme: HabitColorScheme
  trackingType: HabitTrackingType
  targetValue?: number | null
  unit?: string | null
  footerType: HabitFooterType
  source: HabitSourceType
  internalMetricId?: InternalMetricId | null
}

export interface HabitLogType {
  date: string // ISO String
  value: number
}

export type CreateHabitPayload = Omit<HabitType, 'id'>
export type UpdateHabitPayload = Partial<CreateHabitPayload>
