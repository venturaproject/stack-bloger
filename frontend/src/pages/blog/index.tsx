import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BlogLayout } from '@/layouts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { pathFor } from '@/lib/app-routes'
import type { Post } from '@/pages/posts/columns'
import { ChevronLeft, ChevronRight, Grid2X2, List, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n/context'

function imgSrc(url: string) {
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads/')) return `/api${url}`
  return url
}

interface BlogIndexProps {
  posts?: {
    data: Post[]
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
  search?: string
  view?: 'cards' | 'table'
  isUpdating?: boolean
  onPageChange?: (page: number) => void
  onSearchChange?: (search: string) => void
  onViewChange?: (view: 'cards' | 'table') => void
  error?: string
}

export default function BlogIndex({ posts = { data: [] }, search = '', view = 'cards', isUpdating = false, onPageChange, onSearchChange, onViewChange, error }: BlogIndexProps) {
  const { t, currentLang } = useI18n()
  const [searchInput, setSearchInput] = useState(search)
  const searchRef = useRef<HTMLInputElement>(null)
  const dateFormatter = new Intl.DateTimeFormat(currentLang === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const nextSearch = searchInput.trim()
    if (nextSearch === search) return
    const timeout = window.setTimeout(() => onSearchChange?.(nextSearch), 350)
    return () => window.clearTimeout(timeout)
  }, [onSearchChange, search, searchInput])

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || (!event.metaKey && !event.ctrlKey)) return
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, [contenteditable="true"]')) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  if (error) {
    return (
      <BlogLayout title={t('blog_title')}>
        <div className='space-y-4'>
          <h1 className='text-3xl font-bold tracking-tight'>{t('blog_articles')}</h1>
          <p className='text-muted-foreground'>{error}</p>
          <Button variant='outline' onClick={() => window.location.reload()}>{t('blog_retry')}</Button>
        </div>
      </BlogLayout>
    )
  }
  const items = posts.data
  const currentPage = posts.current_page ?? 1
  const lastPage = posts.last_page ?? 1

  return (
    <BlogLayout title={t('blog_title')}>
      <div className='space-y-8 sm:space-y-10'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='w-full sm:max-w-md'>
            <div className='relative flex-1'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input ref={searchRef} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('blog_search_placeholder')} className='pl-9 pr-12' />
              {!searchInput && <kbd className='pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex'><span className='text-xs'>⌘</span>K</kbd>}
              {searchInput && <Button type='button' variant='ghost' size='icon' className='absolute right-0 top-0 h-9 w-9' aria-label={t('blog_clear_search')} onClick={() => { setSearchInput(''); onSearchChange?.('') }}><X className='h-4 w-4' /></Button>}
            </div>
          </div>
          <div className='flex shrink-0 rounded-md border p-1' aria-label={t('blog_view_mode')}>
            <Button type='button' variant={view === 'cards' ? 'secondary' : 'ghost'} size='icon' aria-label={t('blog_cards_view')} onClick={() => onViewChange?.('cards')}><Grid2X2 className='h-4 w-4' /></Button>
            <Button type='button' variant={view === 'table' ? 'secondary' : 'ghost'} size='icon' aria-label={t('blog_table_view')} onClick={() => onViewChange?.('table')}><List className='h-4 w-4' /></Button>
          </div>
        </div>

        <div className='flex min-h-5 items-center justify-between text-sm text-muted-foreground' aria-live='polite'>
          <span>{search ? t('blog_search_results', { count: posts.total ?? items.length, query: search }) : t('blog_total_posts', { count: posts.total ?? items.length })}</span>
          {isUpdating && <span>{t('blog_updating')}</span>}
        </div>

        {items.length === 0 ? (
          <Card className='border-dashed bg-muted/20 shadow-none'>
            <CardContent className='space-y-3 p-8 text-muted-foreground'>
              <p>{search ? t('blog_no_search_results') : t('blog_no_posts')}</p>
              {search && <Button variant='outline' size='sm' onClick={() => { setSearchInput(''); onSearchChange?.('') }}>{t('blog_clear_search')}</Button>}
            </CardContent>
          </Card>
        ) : (
          view === 'cards' ? <section className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                {items.map((post) => (
                  <article key={post.id} className='h-full'>
                    <Card className='group flex h-full flex-col overflow-hidden border-border/80 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md'>
                      {post.featuredImage && (
                        <Link to={pathFor('blog.show', post.slug)} className='overflow-hidden bg-muted'>
                          <img src={imgSrc(post.featuredImage)} alt={post.title} className='aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]' width={640} height={360} loading='lazy' />
                        </Link>
                      )}
                      <CardHeader className='flex-1 space-y-4 p-5'>
                        {post.categories?.length > 0 && (
                          <div className='flex flex-wrap gap-1.5'>
                            {post.categories.map((category) => <Badge key={category.id} variant='secondary' className='text-xs'>{category.name}</Badge>)}
                          </div>
                        )}
                        <CardTitle className='text-xl leading-snug'>
                          <Link to={pathFor('blog.show', post.slug)} className='outline-none hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'>{post.title}</Link>
                        </CardTitle>
                        {post.excerpt && <p className='line-clamp-3 text-sm leading-6 text-muted-foreground'>{post.excerpt}</p>}
                      </CardHeader>
                      <CardFooter className='justify-between gap-3 p-5 pt-0 text-sm text-muted-foreground'>
                        <span className='truncate'>{post.author?.name}</span>
                        {post.publishedAt && <time className='shrink-0' dateTime={post.publishedAt}>{dateFormatter.format(new Date(post.publishedAt))}</time>}
                      </CardFooter>
                    </Card>
                  </article>
                ))}
          </section> : (
            <section className='divide-y rounded-xl border bg-card'>
              {items.map((post) => (
                <article key={post.id} className='group flex gap-4 p-4 transition-colors hover:bg-muted/30 sm:gap-6 sm:p-5'>
                  <Link to={pathFor('blog.show', post.slug)} className='hidden w-44 shrink-0 overflow-hidden rounded-lg bg-muted sm:block'>
                    {post.featuredImage ? (
                      <img src={imgSrc(post.featuredImage)} alt={post.title} className='aspect-[4/3] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]' width={320} height={240} loading='lazy' />
                    ) : <div className='aspect-[4/3] bg-gradient-to-br from-muted to-muted/40' />}
                  </Link>
                  <div className='min-w-0 flex-1 space-y-2'>
                    {post.categories?.length > 0 && <div className='flex flex-wrap gap-1.5'>{post.categories.map((category) => <Badge key={category.id} variant='secondary' className='text-xs'>{category.name}</Badge>)}</div>}
                    <h2 className='text-lg font-semibold leading-snug sm:text-xl'><Link to={pathFor('blog.show', post.slug)} className='outline-none hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring'>{post.title}</Link></h2>
                    {post.excerpt && <p className='line-clamp-2 text-sm leading-6 text-muted-foreground'>{post.excerpt}</p>}
                    <div className='flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground'><span>{post.author?.name}</span>{post.publishedAt && <time dateTime={post.publishedAt}>{dateFormatter.format(new Date(post.publishedAt))}</time>}</div>
                  </div>
                </article>
              ))}
            </section>
          )
        )}

        {lastPage > 1 && (
          <div className='flex items-center justify-center gap-2 border-t pt-8'>
            <Button
              variant='outline'
              size='sm'
              disabled={currentPage <= 1}
              onClick={() => onPageChange?.(currentPage - 1)}
            >
              <ChevronLeft className='h-4 w-4' />
              {t('blog_previous')}
            </Button>
            <span className='text-sm text-muted-foreground'>
              {t('page_of', { current: currentPage, total: lastPage })}
            </span>
            <Button
              variant='outline'
              size='sm'
              disabled={currentPage >= lastPage}
              onClick={() => onPageChange?.(currentPage + 1)}
            >
              {t('blog_next')}
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        )}
      </div>
    </BlogLayout>
  )
}
