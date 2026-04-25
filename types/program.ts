export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'

export interface ProgramDayPayload {
  name: string
  dayIndex: number
  isRestDay: boolean
  templateId?: string | null
  key?: string
}

export interface ProgramWeekPayload {
  name: string
  weekIndex: number
  days: ProgramDayPayload[]
  key?: string
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

export type ProgramPayload = ProgramCreatePayload | ProgramUpdatePayload

export interface ProgramTemplateSet {
  id: string
  setIndex: number
  setType: string
  weight: string | null
  reps: number | null
  rpe: number | null
  durationSeconds: number | null
  restSeconds: number | null
  note: string | null
  progressionStep: string | null
  autoProgress: boolean
}

export interface ProgramTemplateExerciseRef {
  id: string
  title: string
  thumbnailUrl: string | null
  exerciseType: string
}

export interface ProgramTemplateExercise {
  id: string
  templateId: string
  exerciseId: string
  exerciseGroupId: string | null
  exerciseIndex: number
  sets: ProgramTemplateSet[]
  exercise: ProgramTemplateExerciseRef
}

export interface ProgramTemplateGroup {
  id: string
  templateId: string
  groupType: string
  groupIndex: number
  restSeconds: number | null
}

export interface ProgramTemplate {
  id: string
  clientId: string
  title: string
  notes: string | null
  exerciseGroups: ProgramTemplateGroup[]
  exercises: ProgramTemplateExercise[]
}

export interface ProgramDay {
  id: string
  weekId: string
  name: string
  dayIndex: number
  isRestDay: boolean
  templateId: string | null
  template?: ProgramTemplate | null
  key?: string
}

export interface ProgramWeek {
  id: string
  programId: string
  name: string
  weekIndex: number
  days: ProgramDay[]
  key?: string
}

export interface ProgramSummary {
  id: string
  title: string
  description: string | null
  experienceLevel: FitnessLevel
  createdBy: string
}

export interface ProgramTemplateModel {
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
  enrolledCount: number
  enrolledCountLabel: string
  weeks?: ProgramWeek[]
}

export type ProgramDetails = ProgramTemplateModel & {
  weeks: ProgramWeek[]
}

export type Program = ProgramDetails

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

export interface UserProgramStartPayload {
  duration: number
  startDate: string
}

export interface WorkoutTemplateSnapshot {
  id: string
  originalTemplateId: string
  title: string
  notes: string | null
  exerciseGroups: unknown[]
  exercises: unknown[]
}

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
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  startDate: string
  durationWeeks: number
  program: ProgramSummary
  weeks?: UserProgramWeek[]
  progress: UserProgramProgress
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

export interface ProgramListResponse {
  programs: ProgramTemplateModel[]
  pagination: PaginationMeta
}

export interface ProgramDetailResponse {
  program: ProgramDetails
}

export interface ProgramMutationResponse {
  program: ProgramDetails | ProgramTemplateModel
}

export interface UserProgramStartResponse {
  userProgram: UserProgram
}

export interface UserProgramDetailResponse {
  program: UserProgram
}

export interface ActiveUserProgramResponse {
  program: UserProgram | null
}

export interface UserProgramsListResponse {
  programs: UserProgram[]
}
