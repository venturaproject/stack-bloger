import { createContext, useContext, useEffect, useState } from 'react'
import { axios } from '@/lib/axios'
import { PUBLIC_API_URL } from '@/config/env'

export type BrandingVariant = 'fullLight' | 'fullDark' | 'compactLight' | 'compactDark' | 'favicon'
export type BrandingConfig = Partial<Record<BrandingVariant, string>> & { brandName?: string }

const FALLBACK_LOGOS: Record<BrandingVariant, string> = {
  fullLight: '/logo-mayor-light.svg',
  fullDark: '/logo-mayor-dark.svg',
  compactLight: '/logo-mayor-compact-light.svg',
  compactDark: '/logo-mayor-compact-dark.svg',
  favicon: '/favicon.ico',
}

export function fallbackLogoUrl(variant: BrandingVariant) {
  return FALLBACK_LOGOS[variant]
}

interface BrandingContextValue {
  config: BrandingConfig
  updateConfig: (config: BrandingConfig) => void
  logoUrl: (variant: BrandingVariant) => string
  brandName: string
}

const BrandingContext = createContext<BrandingContextValue | null>(null)

function absoluteLogoUrl(url: string) {
  if (!PUBLIC_API_URL || /^https?:\/\//.test(url)) return url
  return new URL(url, PUBLIC_API_URL).toString()
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<BrandingConfig>({})

  useEffect(() => {
    axios.get<BrandingConfig>('/api/v1/branding')
      .then((response) => setConfig(response.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (icon) icon.href = absoluteLogoUrl(config.favicon ?? fallbackLogoUrl('favicon'))
  }, [config])

  const logoUrl = (variant: BrandingVariant) => absoluteLogoUrl(config[variant] ?? fallbackLogoUrl(variant))
  const brandName = config.brandName?.trim() || 'Mayor'

  return (
    <BrandingContext value={{ config, updateConfig: setConfig, logoUrl, brandName }}>
      {children}
    </BrandingContext>
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  if (!context) throw new Error('useBranding must be used within BrandingProvider')
  return context
}
