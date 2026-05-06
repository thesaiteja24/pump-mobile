import {
  API_BASE_URL as apiBaseUrl,
  REFRESH_TOKEN_ENDPOINT as refreshTokenEndpoint,
} from '@/constants/urls'
import { notifyUnauthorized } from '@/lib/authSession'
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import * as SecureStore from 'expo-secure-store'

/* ─────────────────────────────────────────────
   Logging (dev-only)
───────────────────────────────────────────── */
const log = {
  info: (...args: any[]) => __DEV__ && console.log(...args),
  warn: (...args: any[]) => __DEV__ && console.warn(...args),
  error: (...args: any[]) => __DEV__ && console.error(...args),
}

/* ─────────────────────────────────────────────
   In-memory token cache (HOT PATH)
───────────────────────────────────────────── */
let inMemoryAccessToken: string | null = null

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token
}

export const getAccessToken = () => {
  return inMemoryAccessToken
}

/* ─────────────────────────────────────────────
   Axios client
───────────────────────────────────────────── */
const client = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/* ─────────────────────────────────────────────
   Attach token to outgoing requests
───────────────────────────────────────────── */
client.interceptors.request.use((config) => {
  if (inMemoryAccessToken && config.headers) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`
  }
  return config
})

/* ─────────────────────────────────────────────
   Refresh token machinery
───────────────────────────────────────────── */
let isRefreshing = false

type FailedRequest = {
  resolve: (value?: AxiosResponse<any>) => void
  reject: (err: any) => void
  originalConfig: AxiosRequestConfig
}

let failedQueue: FailedRequest[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, originalConfig }) => {
    if (error) {
      reject(error)
    } else {
      if (token && originalConfig.headers) {
        originalConfig.headers.Authorization = `Bearer ${token}`
      }
      client(originalConfig).then(resolve).catch(reject)
    }
  })
  failedQueue = []
}

/* ─────────────────────────────────────────────
   Response interceptor (401 → refresh)
───────────────────────────────────────────── */
client.interceptors.response.use(
  (res) => res,
  async (err: AxiosError | any) => {
    const originalConfig = err?.config as AxiosRequestConfig & {
      __isRetryRequest?: boolean
    }

    const is401 = err?.response?.status === 401
    const isRefreshCall = originalConfig?.url?.includes(refreshTokenEndpoint)

    if (is401 && originalConfig && !originalConfig.__isRetryRequest && !isRefreshCall) {
      originalConfig.__isRetryRequest = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, originalConfig })
        })
      }

      isRefreshing = true

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken')

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const oldToken = inMemoryAccessToken

        const refreshResponse = await fetch(`${apiBaseUrl}${refreshTokenEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(oldToken ? { Authorization: `Bearer ${oldToken}` } : {}),
          },
          body: JSON.stringify({ refreshToken }),
        })

        if (!refreshResponse.ok) {
          const text = await refreshResponse.text()
          throw new Error(`Refresh failed: ${refreshResponse.status} ${text}`)
        }

        const json = await refreshResponse.json()
        const newAccessToken = json?.data?.accessToken
        const newRefreshToken = json?.data?.refreshToken

        if (!newAccessToken) {
          throw new Error('Refresh did not return accessToken')
        }

        // Persist + cache
        await SecureStore.setItemAsync('accessToken', newAccessToken)
        if (newRefreshToken) {
          await SecureStore.setItemAsync('refreshToken', newRefreshToken)
        }
        setAccessToken(newAccessToken)

        client.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`

        processQueue(null, newAccessToken)

        if (originalConfig.headers) {
          originalConfig.headers.Authorization = `Bearer ${newAccessToken}`
        }

        return client(originalConfig)
      } catch (refreshError) {
        log.warn('Token refresh failed', refreshError)

        processQueue(refreshError, null)
        setAccessToken(null)

        try {
          await SecureStore.deleteItemAsync('accessToken')
          await SecureStore.deleteItemAsync('refreshToken')
          await SecureStore.deleteItemAsync('userId')
        } catch {}

        // Authoritative logout
        notifyUnauthorized()

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  },
)

export default client
