import {
  ME_ENDPOINT as me_endpoint,
  MY_ANALYTICS_ENDPOINT as my_analytics_endpoint,
  MY_FITNESS_PROFILE_ENDPOINT as my_fitness_profile_endpoint,
  MY_MEASUREMENTS_ENDPOINT as my_measurements_endpoint,
  MY_NUTRITION_PLAN_ENDPOINT as my_nutrition_plan_endpoint,
  MY_PROFILE_PIC_ENDPOINT as my_profile_pic_endpoint,
  MY_TRAINING_ANALYTICS_ENDPOINT,
  USER_ENDPOINT as user_endpoint,
} from '@/constants/urls'
import {
  AnalyticsMetrics,
  FitnessProfile,
  Measurements,
  MeasurementsQueryData,
  NutritionPlan,
  PublicUser,
  SelfUser,
  TrainingAnalytics,
  UpdateUserBody,
} from '@/types/user'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function getMeService(): Promise<SelfUser> {
  try {
    const res = await client.get(me_endpoint)
    const handled = handleApiResponse<SelfUser>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getUserByIdService(id: string): Promise<PublicUser> {
  try {
    const res = await client.get(user_endpoint(id))
    const handled = handleApiResponse<PublicUser>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getFitnessProfileService(): Promise<FitnessProfile> {
  try {
    const res = await client.get(my_fitness_profile_endpoint)
    const handled = handleApiResponse<FitnessProfile>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getMeasurementsService(duration?: string): Promise<MeasurementsQueryData> {
  try {
    const res = await client.get(my_measurements_endpoint(duration))
    const handled = handleApiResponse<MeasurementsQueryData>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getNutritionPlanService(): Promise<NutritionPlan> {
  try {
    const res = await client.get(my_nutrition_plan_endpoint)
    const handled = handleApiResponse<NutritionPlan>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getUserAnalyticsService(): Promise<AnalyticsMetrics> {
  try {
    const res = await client.get(my_analytics_endpoint)
    const handled = handleApiResponse<AnalyticsMetrics>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getTrainingAnalyticsService(duration: string): Promise<TrainingAnalytics> {
  try {
    const res = await client.get(MY_TRAINING_ANALYTICS_ENDPOINT(duration))
    const handled = handleApiResponse<TrainingAnalytics>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function addMeasurementsService(
  data: FormData | Partial<import('@/types/user').Measurements>,
): Promise<Measurements> {
  try {
    const isFormData = data instanceof FormData
    const res = await client.put(my_measurements_endpoint(), data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    })

    const handled = handleApiResponse<Measurements>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function updateMeService(data: UpdateUserBody): Promise<SelfUser> {
  try {
    const res = await client.patch(me_endpoint, data)
    const handled = handleApiResponse<SelfUser>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function updateMyProfilePicService(data: FormData): Promise<SelfUser> {
  try {
    const res = await client.patch(my_profile_pic_endpoint, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const handled = handleApiResponse<SelfUser>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function updateFitnessProfileService(
  data: import('@/types/user').UpdateFitnessProfileBody,
): Promise<FitnessProfile> {
  try {
    const res = await client.put(my_fitness_profile_endpoint, data)
    const handled = handleApiResponse<FitnessProfile>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function updateMeasurementsService(
  data: FormData | Partial<import('@/types/user').Measurements>,
): Promise<Measurements> {
  try {
    const res = await client.put(my_measurements_endpoint(), data)
    const handled = handleApiResponse<Measurements>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function updateNutritionPlanService(
  data: import('@/types/user').UpdateNutritionPlanBody,
): Promise<NutritionPlan> {
  try {
    const res = await client.put(my_nutrition_plan_endpoint, data)
    const handled = handleApiResponse<NutritionPlan>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function deleteMyProfilePicService(): Promise<SelfUser> {
  try {
    const res = await client.delete(my_profile_pic_endpoint)
    const handled = handleApiResponse<SelfUser>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}
