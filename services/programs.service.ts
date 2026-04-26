import {
  PaginatedPrograms,
  Program,
  ProgramCreatePayload,
  ProgramUpdatePayload,
  UserProgram,
  UserProgramStartPayload,
} from '@/types/programs'
import { handleApiResponse } from '@/utils/handleApiResponse'
import {
  MY_ACTIVE_PROGRAM_ENDPOINT,
  MY_PROGRAMS_ENDPOINT,
  MY_PROGRAM_ITEM_ENDPOINT,
  PROGRAMS_ENDPOINT,
  PROGRAM_ITEM_ENDPOINT,
  START_PROGRAM_ENDPOINT,
} from '@/constants/urls'
import client from './api'

// SECTION: GLOBAL PROGRAMS (LIBRARY)

export const getAllProgramsService = async (
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedPrograms> => {
  try {
    const response = await client.get(PROGRAMS_ENDPOINT, { params: { page, limit } })
    const handled = handleApiResponse<PaginatedPrograms>(response)
    if (!handled.success) throw new Error(handled.message || 'Failed to fetch programs')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const getProgramByIdService = async (programId: string): Promise<Program> => {
  try {
    const response = await client.get(PROGRAM_ITEM_ENDPOINT(programId))
    const handled = handleApiResponse<{ program: Program }>(response)
    if (!handled.success) throw new Error(handled.message || 'Failed to fetch program detail')
    return handled.data!.program
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const createProgramService = async (data: ProgramCreatePayload): Promise<Program> => {
  try {
    const response = await client.post(PROGRAMS_ENDPOINT, data)
    const handled = handleApiResponse<{ program: Program }>(response)
    if (!handled.success) throw new Error(handled.message || 'Failed to create program')
    return handled.data!.program
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const updateProgramService = async (
  programId: string,
  data: ProgramUpdatePayload,
): Promise<Program> => {
  try {
    const response = await client.put(PROGRAM_ITEM_ENDPOINT(programId), data)
    const handled = handleApiResponse<{ program: Program }>(response)
    if (!handled.success) throw new Error(handled.message || 'Failed to update program')
    return handled.data!.program
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const deleteProgramService = async (programId: string): Promise<void> => {
  try {
    const response = await client.delete(PROGRAM_ITEM_ENDPOINT(programId))
    const handled = handleApiResponse<void>(response)
    if (!handled.success) throw new Error(handled.message || 'Failed to delete program')
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

// SECTION: USER PROGRAMS (ME)

export const listUserProgramsService = async (): Promise<UserProgram[]> => {
  try {
    const response = await client.get(MY_PROGRAMS_ENDPOINT)
    const handled = handleApiResponse<{ programs: UserProgram[] }>(response)
    if (!handled.success) throw new Error(handled.message || 'Failed to fetch user programs')
    return handled.data!.programs
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const getActiveUserProgramService = async (): Promise<UserProgram | null> => {
  try {
    const response = await client.get(MY_ACTIVE_PROGRAM_ENDPOINT)
    const handled = handleApiResponse<{ program: UserProgram | null }>(response)
    if (!handled.success) throw new Error(handled.message || 'Failed to fetch active program')
    return handled.data!.program
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const getUserProgramService = async (
  userProgramId: string,
  weekIndex?: number,
): Promise<UserProgram> => {
  try {
    const response = await client.get(MY_PROGRAM_ITEM_ENDPOINT(userProgramId), {
      params: { weekIndex },
    })
    const handled = handleApiResponse<{ program: UserProgram }>(response)
    if (!handled.success) throw new Error(handled.message || 'Failed to fetch user program detail')
    return handled.data!.program
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const startProgramService = async (
  programId: string,
  payload: UserProgramStartPayload,
): Promise<UserProgram> => {
  try {
    const response = await client.post(START_PROGRAM_ENDPOINT(programId), payload)
    const handled = handleApiResponse<{ userProgram: UserProgram }>(response)
    if (!handled.success) throw new Error(handled.message || 'Failed to start program')
    return handled.data!.userProgram
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}
