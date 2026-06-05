/**
 * Generic API envelope types.
 *
 * Every pump-fastify response follows one of two shapes:
 *
 * Success:  { success: true,  message: string, data: T,   meta?: Meta }
 * Failure:  { success: false, message: string, error: ApiError, meta?: Meta }
 *
 * Use ApiResponse<T> as the Axios response data type so callers get
 * full type-narrowing via the `success` discriminant.
 */

// ─── Success ──────────────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true
  message: string
  data: T
  meta?: ApiMeta
}

// ─── Error ────────────────────────────────────────────────────────────────────

export interface ApiErrorDetail {
  /** Machine-readable error code (e.g. "INVALID_GOOGLE_TOKEN") */
  code: string
  /** Structured validation details — present on 400 validation errors */
  details?: unknown
}

export interface ApiErrorResponse {
  success: false
  message: string
  error: ApiErrorDetail
  meta?: ApiMeta
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

export interface ApiMeta {
  timestamp?: string
  [key: string]: unknown
}

// ─── Discriminated union ───────────────────────────────────────────────────────

/**
 * Discriminated union of the two possible response shapes.
 * Narrow with `if (res.success)` to access `data` safely.
 *
 * @example
 * const res: ApiResponse<AuthSession> = await api.post(...)
 * if (!res.data.success) throw new Error(res.data.message)
 * const { sessionId } = res.data.data  // fully typed
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts the `data` field from a successful response or throws with
 * the server message. Use this in service functions to avoid repetitive
 * success-check boilerplate.
 *
 * @example
 * const session = unwrapApiResponse(res.data)
 */
export function unwrapApiResponse<T>(envelope: ApiResponse<T>): T {
  if (!envelope.success) {
    throw new ApiRequestError(envelope.message, envelope.error.code, envelope)
  }
  return envelope.data
}

/**
 * Typed API error. Thrown by `unwrapApiResponse` and the axios 4xx/5xx
 * response interceptor so callers can distinguish API errors from
 * network-level errors.
 *
 * @example
 * catch (err) {
 *   if (err instanceof ApiRequestError && err.code === 'INVALID_GOOGLE_TOKEN') {
 *     Arise.error({ heading: 'Sign in failed' })
 *   }
 * }
 */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    /** Machine-readable code from `error.code` in the response body */
    public readonly code: string,
    /** Full raw response envelope for debugging */
    public readonly envelope: ApiErrorResponse,
    /** HTTP status when this error came from an axios response */
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}
