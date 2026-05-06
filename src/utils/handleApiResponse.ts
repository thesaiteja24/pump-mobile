export type ApiResponse<T = any> = {
  success: boolean
  message?: string
  data: T | null
  errors: any[]
  statusCode: number
}

export const handleApiResponse = <T = any>(response: any): ApiResponse<T> => {
  const { data } = response
  return {
    success: data?.success,
    message: data?.message,
    data: (data?.data as T) ?? null,
    errors: data?.errors ?? [],
    statusCode: data?.statusCode ?? response?.status,
  }
}

export class ApiError extends Error {
  statusCode?: number
  data?: unknown

  constructor(message: string, statusCode?: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.data = data
  }
}
