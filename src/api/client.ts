import axios from 'axios'

import { ENV } from '@/config/env'
import { ApiRequestError, unwrapApiResponse } from '@/types/api'

import type { ApiResponse } from '@/types/api'
import type { AxiosError } from 'axios'

// ─── Axios instance ────────────────────────────────────────────────────────────

/**
 * Pre-configured Axios instance for all pump-fastify API calls.
 *
 * - Base URL: EXPO_PUBLIC_WEB_HOST (e.g. http://localhost:3000 in dev)
 * - Authorization header auto-attached from auth store on every request
 * - 401 responses → session cleared + navigate to login
 */
export const apiClient = axios.create({
  baseURL: ENV.EXPO_PUBLIC_WEB_HOST,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ─── Request interceptor ───────────────────────────────────────────────────────

// Lazily import auth store to avoid circular dependency at module parse time.
// The store module itself imports this file for the logoutApi call.
apiClient.interceptors.request.use((config) => {
  // Dynamic import is synchronous here because Zustand store is already
  // initialized by the time any request fires.
  // eslint-disable-next-line ts/no-require-imports
  const { useAuthStore } = require('@/stores/auth-store') as typeof import('@/stores/auth-store')
  const sessionId = useAuthStore.getState().sessionId
  if (sessionId) {
    config.headers.Authorization = `Bearer ${sessionId}`
  }
  return config
})

// ─── Response interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const status = error.response?.status

    if (status === 401) {
      // Session expired / revoked — clear auth state and navigate to login.
      // Import lazily to avoid circular dependency.
      // eslint-disable-next-line ts/no-require-imports
      const { useAuthStore } = require('@/stores/auth-store') as typeof import('@/stores/auth-store')
      await useAuthStore.getState().clearSession()
    }

    // Re-throw as ApiRequestError when the server returned a structured error body.
    const data = error.response?.data as ApiResponse<unknown> | undefined
    if (data && !data.success) {
      throw new ApiRequestError(data.message, data.error.code, data)
    }

    return Promise.reject(error)
  },
)

// ─── Typed request helper ─────────────────────────────────────────────────────

/**
 * Wraps an axios call and unwraps the `ApiResponse<T>` envelope.
 * Throws `ApiRequestError` if `success === false`.
 *
 * @example
 * const session = await apiRequest<AuthSession>(() =>
 *   apiClient.post('/api/v1/auth/google', { idToken })
 * )
 */
export async function apiRequest<T>(
  call: () => Promise<{ data: ApiResponse<T> }>,
): Promise<T> {
  const res = await call()
  return unwrapApiResponse(res.data)
}
