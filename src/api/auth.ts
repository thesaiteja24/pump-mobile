import { apiClient, apiRequest } from '@/api/client'
import { authEndpoints } from '@/config/urls'

import type { AuthSession } from '@/types/auth'

/**
 * POST /auth/google
 *
 * Sends the Google ID token obtained via Google Sign In to the
 * pump-fastify backend for verification. The backend verifies it against
 * its GOOGLE_WEB_CLIENT_ID, finds-or-creates the user, and returns a
 * session ID + user profile.
 *
 * @param idToken - Google ID token from the OAuth2 token response
 */
export async function googleSignInApi(idToken: string): Promise<AuthSession> {
  return apiRequest<AuthSession>(() =>
    apiClient.post(authEndpoints.googleSignIn, { idToken }),
  )
}

/**
 * POST /auth/logout
 *
 * Revokes the current session in Redis. The session ID is attached
 * automatically by the axios request interceptor from the auth store.
 * Fire-and-forget safe — the local session is always cleared regardless
 * of whether this call succeeds.
 */
export async function logoutApi(): Promise<void> {
  await apiRequest<null>(() => apiClient.post(authEndpoints.logout))
}
