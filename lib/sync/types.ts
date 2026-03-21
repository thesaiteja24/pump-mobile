/**
 * Sync Types
 *
 * Core type definitions for the offline-first sync system.
 * These types are used across the sync infrastructure.
 */

import { HabitFooterType, HabitSourceType, HabitTrackingType } from '@/stores/habitStore'
import { LengthUnits, WeightUnits } from '@/stores/userStore'

export type { MeasurementType } from '@/stores/analyticsStore'

/**
 * Sync status for any syncable entity (workout, template, etc.)
 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'

/**
 * Base interface for any entity that can be synced
 */
export interface SyncableEntity {
	clientId: string // Client-generated UUID, stable identifier
	id: string | null // Backend-generated ID, null until synced
	syncStatus: SyncStatus
}

/**
 * Mutation types for the workout domain
 */
export type WorkoutMutationType = 'CREATE' | 'UPDATE' | 'DELETE'

/**
 * Serialized workout payload for API/queue
 */
export interface WorkoutPayload {
	clientId: string
	id?: string | null
	title?: string | null
	startTime?: string | null
	endTime?: string | null
	exercises?: SerializedExercise[]
	exerciseGroups?: SerializedExerciseGroup[]
}

/**
 * Serialized exercise for API payload
 */
export interface SerializedExercise {
	exerciseId: string
	exerciseIndex: number
	exerciseGroupId?: string | null
	sets: SerializedSet[]
}

/**
 * Serialized set for API payload
 */
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

/**
 * Serialized exercise group for API payload
 */
export interface SerializedExerciseGroup {
	id: string
	groupType: string
	groupIndex: number
	restSeconds?: number | null
}

/**
 * Workout mutation stored in the queue
 */
export interface WorkoutMutation {
	queueId: string // Unique queue item ID
	clientId: string // Workout clientId (dedup key)
	type: WorkoutMutationType
	payload: WorkoutPayload
	userId: string
	createdAt: number
	retryCount: number
}

/* ───────────────── Template Types ───────────────── */

/**
 * Mutation types for the template domain
 */
export type TemplateMutationType = 'CREATE' | 'UPDATE' | 'DELETE'

/**
 * Serialized template exercise for API payload
 */
export interface SerializedTemplateExercise {
	exerciseId: string
	exerciseIndex: number
	exerciseGroupId?: string | null
	sets: SerializedSet[]
}

/**
 * Serialized template payload for API/queue
 */
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

/**
 * Template mutation stored in the queue
 */
export interface TemplateMutation {
	queueId: string
	clientId: string
	type: TemplateMutationType
	payload: TemplatePayload
	userId: string
	createdAt: number
	retryCount: number
}

/* ───────────────── Analytics Types ───────────────── */

/**
 * Mutation types for the analytics domain
 */
export type AnalyticsMutationType = 'UPDATE_FITNESS_PROFILE' | 'ADD_MEASUREMENT' | 'UPDATE_NUTRITION_PLAN'

/**
 * Serialized analytics payload for API/queue
 */
export interface AnalyticsPayload {
	userId: string

	// For UPDATE_FITNESS_PROFILE
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

	// For ADD_MEASUREMENT
	date?: string // used to identify which day's measurement this is
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

	// For UPDATE_NUTRITION_PLAN
	caloriesTarget?: number | null
	proteinTarget?: number | null
	fatsTarget?: number | null
	carbsTarget?: number | null
	calculatedTDEE?: number | null
	deficitOrSurplus?: number | null
	startDate?: string | null
}

/**
 * Analytics mutation stored in the queue
 */
export interface AnalyticsMutation {
	queueId: string
	type: AnalyticsMutationType
	payload: AnalyticsPayload
	userId: string
	createdAt: number
	retryCount: number
}

/* ───────────────── Sync Result ───────────────── */

/**
 * Result of a sync operation
 */
export interface SyncResult<T = unknown> {
	success: boolean
	data?: T
	error?: Error | string
	shouldRetry?: boolean
}
/* ───────────────── User Types ───────────────── */

/**
 * Mutation types for the user domain
 */
export type UserMutationType = 'UPDATE_USER' | 'UPDATE_PREFERENCES'

/**
 * Serialized user payload for API/queue
 */
export interface UserPayload {
	// Common fields
	userId: string

	// For UPDATE_USER
	firstName?: string
	lastName?: string
	dateOfBirth?: string | null
	height?: number | null
	weight?: number | null
	gender?: 'male' | 'female' | 'other' | null

	// For UPDATE_PREFERENCES
	preferredWeightUnit?: WeightUnits
	preferredLengthUnit?: LengthUnits

	// For profile pic (separate handling might be needed but keeping simple for now)
	// Profile pic upload usually involves FormData and is harder to serialize in JSON queue.
	// For now, we focusing on data updates.
}

/**
 * User mutation stored in the queue
 */
export interface UserMutation {
	queueId: string
	type: UserMutationType
	payload: UserPayload
	userId: string
	createdAt: number
	retryCount: number
}

/* ───────────────── Habit Types ───────────────── */

/**
 * Mutation types for the habit domain
 */
export type HabitMutationType = 'CREATE_HABIT' | 'UPDATE_HABIT' | 'DELETE_HABIT' | 'LOG_HABIT'

/**
 * Serialized habit payload for API/queue
 */
export interface HabitPayload {
	userId: string
	id?: string // Habit ID for update/delete/log
	title?: string
	colorScheme?: string
	trackingType?: HabitTrackingType
	targetValue?: number | null
	unit?: string | null
	footerType?: HabitFooterType
	source?: HabitSourceType
	internalMetricId?: string | null

	// For LOG_HABIT
	date?: string
	value?: number
}

/**
 * Habit mutation stored in the queue
 */
export interface HabitMutation {
	queueId: string
	type: HabitMutationType
	payload: HabitPayload
	userId: string
	createdAt: number
	retryCount: number
}
