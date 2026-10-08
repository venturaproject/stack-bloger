import { env } from "@/config"

export function assetUrl(path: string | undefined) {
  if (!path) return ""
  if (path.startsWith("http")) return path

  if (path.startsWith("/")) {
    path = path.slice(1)
  }

  return `${env.ASSET_URL}/${path}`
}

export function appUrl(
  path: string | Record<string, string> = "",
  params: Record<string, string> | undefined = undefined
) {
  if (!params && typeof path === "object") {
    params = path
    path = ""
  }

  let normalizedPath = typeof path === 'string' ? path : ''

  if (params) {
    const query = new URLSearchParams(params)
    normalizedPath = `${normalizedPath}?${query.toString()}`
  }

  if (normalizedPath.startsWith("/")) normalizedPath = normalizedPath.slice(1)

  return `${env.APP_URL}/${normalizedPath}`.replace(/\/$/, "")
}
