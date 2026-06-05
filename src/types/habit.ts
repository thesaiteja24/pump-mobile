export type HabitCategory = 'training' | 'nutrition' | 'recovery' | 'bodyMetrics' | 'lifestyle'

export type HabitTrackingType = 'binary' | 'quantity' | 'duration' | 'count'

export type HabitTargetPeriod = 'daily' | 'weekly' | 'monthly'

export type HabitSource = 'manual' | 'internal' | 'integration'

export type HabitLogSource = 'manual' | 'internal' | 'integration'

export type InternalHabitMetric = 'workoutCompleted' | 'programDayCompleted' | 'weightLogged'

export interface Habit {
  id: string
  userId: string
  title: string
  description: string | null
  icon: string | null
  colorScheme: string | null
  category: HabitCategory
  trackingType: HabitTrackingType
  targetPeriod: HabitTargetPeriod
  targetValue: number | null
  unit: string | null
  source: HabitSource
  internalMetric: InternalHabitMetric | null
  isActive: boolean
  startDate: string
  endDate: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface HabitTodayItem extends Habit {
  todayValue: number | null
  completed: boolean
  currentStreak: number
}

export interface HabitStats {
  currentStreak: number
  bestStreak: number
  streakPeriod: HabitTargetPeriod
  weeklyCompletion: number
  monthlyCompletion: number
  totalCompletedPeriods: number
}

export interface HabitLog {
  id: string
  habitId: string
  date: string
  value: number | null
  completed: boolean
  source: HabitLogSource
  note: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface HabitReminder {
  id: string
  habitId: string
  time: string
  timezone: string
  daysOfWeek: number[]
  nextTriggerAt: string | null
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface HabitCreateInput {
  title: string
  description?: string
  icon?: string
  colorScheme?: string
  category: HabitCategory
  trackingType: HabitTrackingType
  targetPeriod?: HabitTargetPeriod
  targetValue?: number
  unit?: string
  source?: 'manual'
  startDate: string
  endDate?: string
  sortOrder?: number
}

export interface HabitUpdateInput {
  title?: string
  description?: string | null
  icon?: string | null
  colorScheme?: string | null
  category?: HabitCategory
  trackingType?: HabitTrackingType
  targetPeriod?: HabitTargetPeriod
  targetValue?: number | null
  unit?: string | null
  startDate?: string
  endDate?: string | null
  sortOrder?: number
  isActive?: boolean
}

export interface HabitLogUpsertInput {
  value?: number
  completed?: boolean
  note?: string | null
  metadata?: Record<string, unknown> | null
}

export interface HabitReminderCreateInput {
  time: string
  timezone?: string
  daysOfWeek: number[]
  isEnabled?: boolean
}

export interface HabitReminderUpdateInput {
  time?: string
  timezone?: string
  daysOfWeek?: number[]
  isEnabled?: boolean
}
