import axios from "axios"
import { env } from "@/config"
import { useAuthStore } from "@/lib/auth"
import { navigateTo } from "@/lib/navigation"

const axiosInstance = axios.create({
  baseURL: env?.PUBLIC_API_URL ?? "",
  withCredentials: true,   // browser sends the httpOnly access_token cookie automatically
  headers: {
    "Content-Type": "application/json",
  },
})

// Silent token refresh on 401.
// When the access_token cookie expires the server returns 401.
// We attempt one silent refresh (the httpOnly refresh_token cookie is sent
// automatically to /api/v1/auth/refresh). On success the new access_token
// cookie is set by the server and the original request is retried.
// On failure the user is redirected to /login.
let refreshPromise: Promise<void> | null = null

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url: string = error.config?.url ?? ''
    const alreadyRetried: boolean = error.config?._retry ?? false

    if (
      error.response?.status !== 401 ||
      alreadyRetried ||
      url.includes('/api/v1/auth/')
    ) {
      return Promise.reject(error)
    }

    error.config._retry = true

    if (!refreshPromise) {
      refreshPromise = axiosInstance
        .post('/api/v1/auth/refresh')
        .then(() => { refreshPromise = null })
        .catch(() => {
          refreshPromise = null
          useAuthStore.getState().logout()
          if (!window.location.pathname.startsWith('/login')) navigateTo('/login')
          return Promise.reject(error)
        }) as Promise<void>
    }

    return refreshPromise.then(() => axiosInstance(error.config))
  },
)

export { axiosInstance as axios }
