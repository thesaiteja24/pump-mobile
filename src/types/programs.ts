import { TemplateExercise, TemplateExerciseGroup } from './templates'

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'
export type UserProgramStatus = 'active' | 'completed' | 'paused' | 'cancelled'

// SECTION: SHARED / NESTED ENTITIES
export interface WorkoutTemplateSnapshot {
  id: string
  originalTemplateId: string
  title: string
  notes: string | null
  exerciseGroups: TemplateExerciseGroup[]
  exercises: TemplateExercise[]
}

// SECTION: PROGRAM ENTITIES (LIBRARY)
export interface ProgramDay {
  id: string
  name: string
  dayIndex: number
  isRestDay: boolean
  templateId: string | null
  template?: {
    id: string
    title: string
    notes: string | null
    exerciseGroups: TemplateExerciseGroup[]
    exercises: TemplateExercise[]
  } | null
}

export interface ProgramWeek {
  id: string
  name: string
  weekIndex: number
  days: ProgramDay[]
}

export interface Program {
  id: string
  clientId: string
  title: string
  description: string | null
  experienceLevel: FitnessLevel
  durationOptions: number[]
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  enrolledCount?: number
  enrolledCountLabel?: string
  weeks?: ProgramWeek[]
}

// SECTION: USER PROGRAM ENTITIES
export interface UserProgramDay {
  id: string
  userProgramWeekId: string
  name: string
  dayIndex: number
  isRestDay: boolean
  templateSnapshotId: string | null
  completed: boolean
  completedAt?: string | null
  workoutLogId?: string | null
  templateSnapshot?: WorkoutTemplateSnapshot | null
}

export interface UserProgramWeek {
  id: string
  userProgramId: string
  weekIndex: number
  days: UserProgramDay[]
}

export interface UserProgramProgress {
  id: string
  userProgramId: string
  currentWeek: number
  currentDay: number
  workoutTitle?: string | null
  isRestDay?: boolean | null
  userProgramDayId?: string | null
  templateSnapshot?: WorkoutTemplateSnapshot | null
}

export interface UserProgram {
  id: string
  userId: string
  programId: string
  status: UserProgramStatus
  startDate: string
  durationWeeks: number
  program: Partial<Program>
  weeks?: UserProgramWeek[]
  progress: UserProgramProgress
  createdAt: string
  updatedAt: string
}

// SECTION: PAYLOADS
export interface ProgramDayPayload {
  name: string
  dayIndex: number
  isRestDay: boolean
  templateId?: string | null
}

export interface ProgramWeekPayload {
  name: string
  weekIndex: number
  days: ProgramDayPayload[]
}

export interface ProgramCreatePayload {
  clientId: string
  title: string
  description: string | null
  experienceLevel: FitnessLevel
  durationOptions: number[]
  weeks: ProgramWeekPayload[]
}

export interface ProgramUpdatePayload {
  title?: string
  description?: string | null
  experienceLevel?: FitnessLevel
  durationOptions?: number[]
  weeks?: ProgramWeekPayload[]
}

export interface UserProgramStartPayload {
  duration: number
  startDate: string
}

// SECTION: API RESPONSES (META)
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

export interface PaginatedPrograms {
  programs: Program[]
  pagination: PaginationMeta
}

// SECTION: LEGACY / DRAFT TYPES (Used for UI state and serialization)
export interface DraftProgramDay {
  id: string
  weekId: string
  name: string
  dayIndex: number
  isRestDay: boolean
  templateId: string | null
  key?: string
}

export interface DraftProgramWeek {
  id: string
  programId: string
  name: string
  weekIndex: number
  days: DraftProgramDay[]
  key?: string
}

export interface DraftProgram {
  id: string
  clientId: string
  title: string
  description: string
  experienceLevel: FitnessLevel
  durationOptions: number[]
  weeks: DraftProgramWeek[]
}

// SECTION: API RESPONSES
export type ProgramResponse = { program: Program }
export type UserProgramsResponse = { programs: UserProgram[] }
export type ActiveUserProgramResponse = { program: UserProgram | null }
export type UserProgramResponse = { program: UserProgram }
export type StartProgramResponse = { userProgram: UserProgram }
