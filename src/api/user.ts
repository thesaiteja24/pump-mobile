import { apiClient, apiRequest } from '@/api/client'
import { userEndpoints } from '@/config/urls'

import type {
  FitnessProfile,
  MeasurementEntry,
  MeasurementsHistoryResponse,
  NutritionPlan,
  UserAnalytics,
  UserProfile,
} from '@/types/user'

// ─── Profile Endpoints ────────────────────────────────────────────────────────

/**
 * GET /users/me
 * Retrieves the logged-in user profile details.
 */
export async function getProfileApi(): Promise<UserProfile> {
  return apiRequest<UserProfile>(() =>
    apiClient.get(userEndpoints.private.profile),
  )
}

/**
 * PATCH /users/me
 * Updates the user's profile information.
 */
export async function updateProfileApi(
  data: Partial<
    Omit<
      UserProfile,
      | 'id'
      | 'email'
      | 'role'
      | 'followersCount'
      | 'followingCount'
      | 'workoutsCount'
      | 'createdAt'
      | 'updatedAt'
    >
  >,
): Promise<UserProfile> {
  return apiRequest<UserProfile>(() =>
    apiClient.patch(userEndpoints.private.profile, data),
  )
}

// ─── Fitness Endpoints ────────────────────────────────────────────────────────

/**
 * GET /users/me/fitness
 * Retrieves the user's fitness goals and settings.
 */
export async function getFitnessProfileApi(): Promise<FitnessProfile | null> {
  return apiRequest<FitnessProfile | null>(() =>
    apiClient.get(userEndpoints.private.fitness),
  )
}

/**
 * PATCH /users/me/fitness
 * Upserts the user's fitness profile.
 */
export async function upsertFitnessProfileApi(
  data: Partial<
    Omit<FitnessProfile, 'id' | 'createdAt' | 'updatedAt'>
  >,
): Promise<FitnessProfile> {
  return apiRequest<FitnessProfile>(() =>
    apiClient.patch(userEndpoints.private.fitness, data),
  )
}

// ─── Nutrition Endpoints ──────────────────────────────────────────────────────

/**
 * GET /users/me/nutrition
 * Retrieves the user's current nutrition targets and TDEE info.
 */
export async function getNutritionPlanApi(): Promise<NutritionPlan | null> {
  return apiRequest<NutritionPlan | null>(() =>
    apiClient.get(userEndpoints.private.nutrition),
  )
}

/**
 * PATCH /users/me/nutrition
 * Upserts the user's nutrition plan targets.
 */
export async function upsertNutritionPlanApi(
  data: Partial<
    Omit<NutritionPlan, 'id' | 'createdAt' | 'updatedAt'>
  >,
): Promise<NutritionPlan> {
  return apiRequest<NutritionPlan>(() =>
    apiClient.patch(userEndpoints.private.nutrition, data),
  )
}

// ─── Measurement Endpoints ────────────────────────────────────────────────────

/**
 * GET /users/me/measurements
 * Fetches the user's body measurement log history.
 */
export async function getMeasurementsApi(
  duration?: 'all' | 'week' | 'month' | 'year',
): Promise<MeasurementsHistoryResponse> {
  return apiRequest<MeasurementsHistoryResponse>(() =>
    apiClient.get(userEndpoints.private.measurements, {
      params: duration ? { duration } : undefined,
    }),
  )
}

/**
 * POST /users/me/measurements
 * Creates a new daily body measurement entry.
 */
export async function createMeasurementApi(
  data: Omit<MeasurementEntry, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<MeasurementEntry> {
  return apiRequest<MeasurementEntry>(() =>
    apiClient.post(userEndpoints.private.measurements, data),
  )
}

/**
 * PATCH /users/me/measurements/:id
 * Updates an existing daily body measurement entry.
 */
export async function updateMeasurementApi(
  id: string,
  data: Partial<Omit<MeasurementEntry, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<MeasurementEntry> {
  return apiRequest<MeasurementEntry>(() =>
    apiClient.patch(userEndpoints.private.measurementsItem(id), data),
  )
}

/**
 * DELETE /users/me/measurements/:id
 * Deletes a body measurement entry.
 */
export async function deleteMeasurementApi(id: string): Promise<void> {
  await apiRequest<null>(() =>
    apiClient.delete(userEndpoints.private.measurementsItem(id)),
  )
}

// ─── Analytics Endpoints ──────────────────────────────────────────────────────

/**
 * GET /users/me/analytics
 * Retrieves the user's workout statistics, streak, and volume trends.
 */
export async function getUserAnalyticsApi(): Promise<UserAnalytics> {
  return apiRequest<UserAnalytics>(() =>
    apiClient.get(userEndpoints.private.analytics),
  )
}
