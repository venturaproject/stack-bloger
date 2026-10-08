import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeSwitch } from '@/components/theme-switch'
import SkipToMain from '@/components/skip-to-main'
import MayorLogo from '@/components/layout/mayor-logo'
import { useBranding } from '@/context/branding-context'
import { pathFor } from '@/lib/app-routes'

const siteUrl = import.meta.env.VITE_SITE_URL || ''

interface BlogLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  ogImage?: string
  canonicalPath?: string
  jsonLd?: Record<string, unknown>
}

function setMeta(nameOrProp: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name'
  let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, nameOrProp)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMeta(nameOrProp: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name'
  document.querySelector(`meta[${attr}="${nameOrProp}"]`)?.remove()
}

function setCanonical(path: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', `${siteUrl}${path}`)
}

function setJsonLd(data: Record<string, unknown>) {
  const id = 'blog-jsonld'
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export function BlogLayout({ children, title, description, ogImage, canonicalPath, jsonLd }: BlogLayoutProps) {
  const { brandName } = useBranding()
  const appName = brandName
  const fullTitle = title ? `${title} - ${appName}` : appName

  useEffect(() => {
    document.title = fullTitle

    setMeta('og:title', fullTitle, true)
    setMeta('og:type', title ? 'article' : 'website', true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)

    if (description) {
      setMeta('description', description)
      setMeta('og:description', description, true)
      setMeta('twitter:description', description)
    } else {
      removeMeta('description')
      removeMeta('og:description', true)
      removeMeta('twitter:description')
    }

    if (ogImage) {
      setMeta('og:image', ogImage, true)
      setMeta('twitter:image', ogImage)
    } else {
      removeMeta('og:image', true)
      removeMeta('twitter:image')
    }

    if (canonicalPath) {
      setCanonical(canonicalPath)
    } else {
      document.querySelector('link[rel="canonical"]')?.remove()
    }

    if (jsonLd) {
      setJsonLd(jsonLd)
    } else {
      document.getElementById('blog-jsonld')?.remove()
    }
  }, [title, fullTitle, description, ogImage, canonicalPath, jsonLd])

  return (
    <div className='flex min-h-screen flex-col bg-background selection:bg-primary/20'>
      <SkipToMain />
      <header className='sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70'>
        <div className='container mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6'>
          <Link
            to={pathFor('blog.index')}
            className='flex min-w-0 items-center rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            aria-label={appName}
          >
            <MayorLogo className='max-w-44 sm:max-w-52' />
          </Link>
          <nav className='flex shrink-0 items-center gap-1' aria-label={appName}>
            <ThemeSwitch />
          </nav>
        </div>
      </header>
      <main id='main-content' tabIndex={-1} className='container mx-auto w-full max-w-6xl flex-1 px-4 py-10 outline-none sm:px-6 sm:py-16 lg:py-20'>
        {children}
      </main>
      <footer className='mt-12 border-t border-border/70 bg-muted/20'>
        <div className='container mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-8 text-center text-sm text-muted-foreground sm:px-6 sm:py-10'>
          <p>&copy; {new Date().getFullYear()} {appName}</p>
        </div>
      </footer>
    </div>
  )
}
