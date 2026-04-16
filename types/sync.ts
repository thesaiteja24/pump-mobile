import type { MeasurementType } from './analytics'
import type { HabitFooterType, HabitSourceType, HabitTrackingType } from './habits'
import type { LengthUnits, WeightUnits } from './user'

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'

export interface SyncableEntity {
	clientId: string
	id: string | null
	syncStatus: SyncStatus
}

export type WorkoutMutationType = 'CREATE' | 'UPDATE' | 'DELETE'

export interface WorkoutPayload {
	clientId: string
	id?: string | null
	title?: string | null
	startTime?: string | null
	endTime?: string | null
	exercises?: SerializedExercise[]
	exerciseGroups?: SerializedExerciseGroup[]
}

export interface SerializedExercise {
	exerciseId: string
	exerciseIndex: number
	exerciseGroupId?: string | null
	sets: SerializedSet[]
}

export interface SerializedSet {
	setIndex: number
	setType: string
	weight?: number | null
	reps?: number | null
	rpe?: number | null
	durationSeconds?: number | null
	restSeconds?: number | null
	note?: string | null
}

export interface SerializedExerciseGroup {
	id: string
	groupType: string
	groupIndex: number
	restSeconds?: number | null
}

export interface WorkoutMutation {
	queueId: string
	clientId: string
	type: WorkoutMutationType
	payload: WorkoutPayload
	userId: string
	createdAt: number
	retryCount: number
}

export type TemplateMutationType = 'CREATE' | 'UPDATE' | 'DELETE'

export interface SerializedTemplateExercise {
	exerciseId: string
	exerciseIndex: number
	exerciseGroupId?: string | null
	sets: SerializedSet[]
}

export interface TemplatePayload {
	clientId: string
	id?: string | null
	title?: string
	notes?: string
	shareId?: string
	sourceShareId?: string
	authorName?: string
	exercises?: SerializedTemplateExercise[]
	exerciseGroups?: SerializedExerciseGroup[]
}

export interface TemplateMutation {
	queueId: string
	clientId: string
	type: TemplateMutationType
	payload: TemplatePayload
	userId: string
	createdAt: number
	retryCount: number
}

export type AnalyticsMutationType = 'UPDATE_FITNESS_PROFILE' | 'ADD_MEASUREMENT' | 'UPDATE_NUTRITION_PLAN'

export interface AnalyticsPayload {
	userId: string
	fitnessGoal?: string | null
	fitnessLevel?: string | null
	activityLevel?: string | null
	targetType?: string | null
	targetWeight?: number | null
	targetBodyFat?: number | null
	weeklyWeightChange?: number | null
	targetDate?: string | null
	injuries?: string | null
	availableEquipment?: string[]
	date?: string
	weight?: number | null
	bodyFat?: number | null
	waist?: number | null
	neck?: number | null
	shoulders?: number | null
	chest?: number | null
	leftBicep?: number | null
	rightBicep?: number | null
	leftForearm?: number | null
	rightForearm?: number | null
	abdomen?: number | null
	hips?: number | null
	leftThigh?: number | null
	rightThigh?: number | null
	leftCalf?: number | null
	rightCalf?: number | null
	notes?: string | null
	progressPics?: { uri: string; name: string; type: string }[]
	caloriesTarget?: number | null
	proteinTarget?: number | null
	fatsTarget?: number | null
	carbsTarget?: number | null
	calculatedTDEE?: number | null
	deficitOrSurplus?: number | null
	startDate?: string | null
}

export interface AnalyticsMutation {
	queueId: string
	type: AnalyticsMutationType
	payload: AnalyticsPayload
	userId: string
	createdAt: number
	retryCount: number
}

export interface SyncResult<T = unknown> {
	success: boolean
	data?: T
	error?: Error | string
	shouldRetry?: boolean
}

export type UserMutationType = 'UPDATE_USER' | 'UPDATE_PREFERENCES'

export interface UserPayload {
	userId: string
	firstName?: string
	lastName?: string
	dateOfBirth?: string | null
	height?: number | null
	weight?: number | null
	gender?: 'male' | 'female' | 'other' | null
	preferredWeightUnit?: WeightUnits
	preferredLengthUnit?: LengthUnits
}

export interface UserMutation {
	queueId: string
	type: UserMutationType
	payload: UserPayload
	userId: string
	createdAt: number
	retryCount: number
}

export type HabitMutationType = 'CREATE_HABIT' | 'UPDATE_HABIT' | 'DELETE_HABIT' | 'LOG_HABIT'

export interface HabitPayload {
	userId: string
	id?: string
	title?: string
	colorScheme?: string
	trackingType?: HabitTrackingType
	targetValue?: number | null
	unit?: string | null
	footerType?: HabitFooterType
	source?: HabitSourceType
	internalMetricId?: string | null
	date?: string
	value?: number
}

export interface HabitMutation {
	queueId: string
	type: HabitMutationType
	payload: HabitPayload
	userId: string
	createdAt: number
	retryCount: number
}
