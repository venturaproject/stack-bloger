import { navigateTo } from '@/lib/navigation'
import { axios } from '@/lib/axios'
import axiosRequest from 'axios'

function buildQs(params?: Record<string, unknown>) {
  if (!params || !Object.keys(params).length) return ''
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => [k, String(v)])
  return entries.length ? '?' + new URLSearchParams(entries).toString() : ''
}

interface RouterOpts {
  onSuccess?: () => void
  onError?: (error: Record<string, string>) => void
  onFinish?: () => void
  forceFormData?: boolean
  preserveState?: boolean
  preserveScroll?: boolean
  replace?: boolean
}

export const router = {
  visit: (url: string) => navigateTo(url),
  get: (url: string, params?: Record<string, unknown>, _opts?: { preserveState?: boolean; replace?: boolean }) =>
    navigateTo(url + buildQs(params)),
  post: async (url: string, data?: unknown, opts?: RouterOpts) => {
    try {
      const res = await axios.post(url, data)
      opts?.onSuccess?.()
      return res
    } catch (err) {
      opts?.onError?.(axiosRequest.isAxiosError(err) ? err.response?.data : {})
      throw err
    } finally {
      opts?.onFinish?.()
    }
  },
  delete: async (url: string, opts?: RouterOpts) => {
    try {
      const res = await axios.delete(url)
      opts?.onSuccess?.()
      return res
    } catch (err) {
      opts?.onError?.(axiosRequest.isAxiosError(err) ? err.response?.data : {})
      throw err
    } finally {
      opts?.onFinish?.()
    }
  },
  put: async (url: string, data?: unknown, opts?: RouterOpts) => {
    try {
      const res = await axios.put(url, data)
      opts?.onSuccess?.()
      return res
    } catch (err) {
      opts?.onError?.(axiosRequest.isAxiosError(err) ? err.response?.data : {})
      throw err
    } finally {
      opts?.onFinish?.()
    }
  },
  reload: () => window.location.reload(),
}
