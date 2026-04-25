import { useAuth } from '@/stores/authStore'
import {
  ActiveUserProgramResponse,
  ProgramCreatePayload,
  ProgramDetailResponse,
  ProgramListResponse,
  ProgramMutationResponse,
  ProgramUpdatePayload,
  UserProgramDetailResponse,
  UserProgramsListResponse,
  UserProgramStartPayload,
  UserProgramStartResponse,
} from '@/types/program'
import { ApiError, ApiResponse, handleApiResponse } from '@/utils/handleApiResponse'
import { AxiosError } from 'axios'
import client from './api'

export const createProgramService = async (
  data: ProgramCreatePayload,
): Promise<ApiResponse<ProgramMutationResponse>> => {
  const userId = useAuth.getState().userId
  if (!userId) return { success: false, error: 'User not authenticated' } as any

  try {
    const response = await client.post(`/programs`, data)
    return handleApiResponse<ProgramMutationResponse>(response)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const getAllProgramsService = async (
  page: number = 1,
  limit: number = 20,
): Promise<ApiResponse<ProgramListResponse>> => {
  const userId = useAuth.getState().userId
  if (!userId) {
    throw new ApiError('User not authenticated', 401)
  }

  try {
    const response = await client.get(`/programs`, { params: { page, limit } })
    return handleApiResponse<ProgramListResponse>(response)
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.message || error.message || 'Network error'

      throw new ApiError(message, error.response?.status, error.response?.data)
    }

    throw new ApiError('Unexpected error occurred')
  }
}

export const getProgramByIdService = async (
  programId: string,
): Promise<ApiResponse<ProgramDetailResponse>> => {
  const userId = useAuth.getState().userId
  if (!userId) return { success: false, error: 'User not authenticated' } as any

  try {
    const response = await client.get(`/programs/${programId}`)
    return handleApiResponse<ProgramDetailResponse>(response)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const updateProgramService = async (
  programId: string,
  data: ProgramUpdatePayload,
): Promise<ApiResponse<ProgramMutationResponse>> => {
  const userId = useAuth.getState().userId
  if (!userId) return { success: false, error: 'User not authenticated' } as any

  try {
    const response = await client.put(`/programs/${programId}`, data)
    return handleApiResponse<ProgramMutationResponse>(response)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const deleteProgramService = async (programId: string): Promise<ApiResponse<void>> => {
  const userId = useAuth.getState().userId
  if (!userId) return { success: false, error: 'User not authenticated' } as any

  try {
    const response = await client.delete(`/programs/${programId}`)
    return handleApiResponse<void>(response)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const getUserProgramService = async (
  userProgramId: string,
  weekIndex?: number,
): Promise<ApiResponse<UserProgramDetailResponse>> => {
  const userId = useAuth.getState().userId
  if (!userId) {
    throw new ApiError('User not authenticated', 401)
  }

  try {
    const response = await client.get(`/me/programs/${userProgramId}`, {
      params: { weekIndex },
    })
    return handleApiResponse<UserProgramDetailResponse>(response)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const getActiveUserProgramService = async (): Promise<
  ApiResponse<ActiveUserProgramResponse>
> => {
  const userId = useAuth.getState().userId
  if (!userId) {
    throw new ApiError('User not authenticated', 401)
  }

  try {
    const response = await client.get(`/me/programs/active`)
    return handleApiResponse<ActiveUserProgramResponse>(response)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const startProgramService = async (
  programId: string,
  payload: UserProgramStartPayload,
): Promise<ApiResponse<UserProgramStartResponse>> => {
  const userId = useAuth.getState().userId
  if (!userId) {
    throw new ApiError('User not authenticated', 401)
  }

  try {
    const response = await client.post(`/me/programs/${programId}`, payload)
    return handleApiResponse<UserProgramStartResponse>(response)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const listUserProgramsService = async (): Promise<ApiResponse<UserProgramsListResponse>> => {
  const userId = useAuth.getState().userId
  if (!userId) {
    throw new ApiError('User not authenticated', 401)
  }

  try {
    const response = await client.get(`/me/programs`)
    return handleApiResponse<UserProgramsListResponse>(response)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}
